import { cosmosDbClient, logger } from '../modules.server';
import { MonthlyReport } from './domain/entities/MonthlyReport';
import { IMonthlyReportGenerator } from './domain/ports/IMonthlyReportGenerator';
import { CosmosTicketRepository } from './infrastructure/adapters/cosmosdb/CosmosTicketRepository';
import { MonthlyReportGenerator } from './application/MonthlyReportGenerator';
import { IReportRepository } from './domain/ports/IReportRepository';
import { ReportSender, SendReportResult } from './application/ReportSender ';
import { CosmosReportRepository } from './infrastructure/adapters/cosmosdb/CosmosReportRepository';

const REPORTS_CONTAINER = "Reports";

export interface IReportingModuleApi {
    generateMonthlyReport(year: number, month: number): Promise<MonthlyReport>;
    sendReport(year: number, month: number): Promise<SendReportResult>;
    retryFailedReports(): Promise<SendReportResult[]>;
}

export class ReportingModule implements IReportingModuleApi {
    private readonly monthlyReportGenerator: IMonthlyReportGenerator;
    private readonly reportRepository: IReportRepository;
    private readonly reportSender: ReportSender;

    private constructor(
        monthlyReportGenerator: IMonthlyReportGenerator,
        reportRepository: IReportRepository,
        reportSender: ReportSender
    ) {
        this.monthlyReportGenerator = monthlyReportGenerator;
        this.reportRepository = reportRepository;
        this.reportSender = reportSender;
    }

    public static async create(): Promise<ReportingModule> {
        const ticketContainer = await cosmosDbClient.getContainer('Tickets');
        const reportContainer = await cosmosDbClient.getContainer(REPORTS_CONTAINER);

        const ticketRepository = new CosmosTicketRepository(ticketContainer, logger);
        const reportRepository = new CosmosReportRepository(reportContainer, logger);

        const monthlyReportGenerator = new MonthlyReportGenerator(ticketRepository, logger);

        const reportSender = new ReportSender(reportRepository, logger);

        return new ReportingModule(
            monthlyReportGenerator,
            reportRepository,
            reportSender
        );
    }

    public async generateMonthlyReport(year: number, month: number): Promise<MonthlyReport> {
        const report = await this.monthlyReportGenerator.generateReport(year, month);

        await this.reportRepository.saveWithCounter({
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

        return report;
    }

    public async sendReport(year: number, month: number): Promise<SendReportResult> {
        const reportDoc = await this.reportRepository.findByYearAndMonth(year, month);
        if (!reportDoc) {
            throw new Error(`Report for ${year}-${month} not found`);
        }

        return this.reportSender.sendReport(reportDoc);
    }

    public async retryFailedReports(): Promise<SendReportResult[]> {
        return this.reportSender.retryFailedReports();
    }
}