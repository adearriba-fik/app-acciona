import { cosmosDbClient, logger } from '../modules.server';
import { IMonthlyReportGenerator } from './domain/ports/IMonthlyReportGenerator';
import { CosmosTicketRepository } from './infrastructure/adapters/cosmosdb/CosmosTicketRepository';
import { MonthlyReportGenerator } from './application/MonthlyReportGenerator';
import { IReportRepository } from './domain/ports/IReportRepository';
import { ReportSender, SendReportResult } from './application/ReportSender ';
import { CosmosReportRepository } from './infrastructure/adapters/cosmosdb/CosmosReportRepository';
import { ITaskScheduler } from './domain/ports/ITaskScheduler';
import { CronTaskScheduler } from './infrastructure/adapters/cron-jobs/CronTaskScheduler';
import { ILogger } from '../shared/infrastructure/logging/ILogger';
import { ReportDocument } from './domain/entities/ReportDocument';

const REPORTS_CONTAINER = "Reports";

export interface IReportingModuleApi {
    generateMonthlyReport(year: number, month: number): Promise<ReportDocument>;
    sendReport(year: number, month: number): Promise<SendReportResult>;
    retryFailedReports(): Promise<SendReportResult[]>;
}

export class ReportingModule implements IReportingModuleApi {
    private readonly monthlyReportGenerator: IMonthlyReportGenerator;
    private readonly reportRepository: IReportRepository;
    private readonly reportSender: ReportSender;
    private readonly taskScheduler: ITaskScheduler;

    private constructor(
        monthlyReportGenerator: IMonthlyReportGenerator,
        reportRepository: IReportRepository,
        reportSender: ReportSender,
        taskScheduler: ITaskScheduler,
        moduleLogger: ILogger,
    ) {
        this.monthlyReportGenerator = monthlyReportGenerator;
        this.reportRepository = reportRepository;
        this.reportSender = reportSender;
        this.taskScheduler = taskScheduler;

        this.taskScheduler.addJob('failed-reports-retries', '0 0 0/4 * * *', async () => {
            const results = await this.reportSender.retryFailedReports();
            moduleLogger.info('Retry failed reports results', { results });
        });

        this.taskScheduler.addJob('monthly-report', '0 0 1 1 * *', async () => {
            const today = new Date();
            const result = await this.sendReport(today.getFullYear(), today.getMonth());

            moduleLogger.info('Retry failed reports results', { result });
        });

        process.on('SIGTERM', async () => {
            this.taskScheduler.getAllJobs().forEach(job => {
                this.taskScheduler.removeJob(job.name);
            })
        });

        process.on('SIGINT', async () => {
            this.taskScheduler.getAllJobs().forEach(job => {
                this.taskScheduler.removeJob(job.name);
            })
        });
    }

    public static async create(): Promise<ReportingModule> {
        const moduleLogger = logger.child({
            module: 'ReportingModule',
        });

        const ticketContainer = await cosmosDbClient.getContainer('Tickets');
        const reportContainer = await cosmosDbClient.getContainer(REPORTS_CONTAINER);

        const ticketRepository = new CosmosTicketRepository(ticketContainer, moduleLogger);
        const reportRepository = new CosmosReportRepository(reportContainer, moduleLogger);

        const monthlyReportGenerator = new MonthlyReportGenerator(ticketRepository, moduleLogger);

        const reportSender = new ReportSender(reportRepository, moduleLogger);
        const taskScheduler = new CronTaskScheduler({
            logger: moduleLogger,
            timezone: 'Europe/Madrid',
        });

        return new ReportingModule(
            monthlyReportGenerator,
            reportRepository,
            reportSender,
            taskScheduler,
            moduleLogger
        );
    }

    public async generateMonthlyReport(year: number, month: number): Promise<ReportDocument> {
        const report = await this.monthlyReportGenerator.generateReport(year, month);

        return this.reportRepository.saveWithCounter({
            id: `${year}-${month.toString().padStart(2, '0')}`,
            type: 'report',
            year,
            month,
            status: 'PENDING',
            retryCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            report
        });
    }

    public async sendReport(year: number, month: number): Promise<SendReportResult> {
        let reportDoc = await this.reportRepository.findByYearAndMonth(year, month);

        if (!reportDoc) {
            reportDoc = await this.generateMonthlyReport(year, month);
        }

        return this.reportSender.sendReport(reportDoc);
    }

    public async retryFailedReports(): Promise<SendReportResult[]> {
        return this.reportSender.retryFailedReports();
    }
}