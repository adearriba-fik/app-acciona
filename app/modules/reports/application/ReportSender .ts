import { ILogger } from "app/modules/shared/infrastructure/logging/ILogger";
import { ReportDocument } from "../domain/entities/ReportDocument";
import { IReportRepository } from "../domain/ports/IReportRepository";

interface ApiConfig {
    endpoint: string;
    username: string;
    password: string;
}

export interface SendReportResult {
    reportId: string;
    success: boolean;
    error?: string;
    timestamp: Date;
    statusCode?: number;
    responseText?: string;
}

export class ReportSender {
    private readonly apiConfig: ApiConfig;

    constructor(
        private readonly reportRepository: IReportRepository,
        private readonly logger: ILogger
    ) {
        this.apiConfig = {
            endpoint: process.env.ACCIONA_API_ENDPOINT || 'https://b2bawdsappi.acciona.es:93/RestAdapter/fi/contabilizacionAsientos',
            username: process.env.ACCIONA_API_USERNAME || 'SHOPIFY_COMMS',
            password: process.env.ACCIONA_API_PASSWORD || 'APDComm_01.'
        };
    }

    async sendReport(report: ReportDocument): Promise<SendReportResult> {
        try {
            await this.reportRepository.updateStatus(report.id, 'SENDING');

            const authHeader = 'Basic ' + Buffer.from(`${this.apiConfig.username}:${this.apiConfig.password}`).toString('base64');

            const response = await fetch(this.apiConfig.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader
                },
                body: JSON.stringify(report.report)
            });

            const responseText = await response.text();

            if (!response.ok) {
                const result: SendReportResult = {
                    reportId: report.id,
                    success: false,
                    error: `API request failed: ${responseText}`,
                    timestamp: new Date(),
                    statusCode: response.status,
                    responseText: responseText
                };

                await this.reportRepository.updateStatus(report.id, 'FAILURE', result.error);

                this.logger.error('Failed to send report to Acciona API', new Error(result.error), {
                    reportId: report.id,
                    statusCode: response.status,
                    response: responseText
                });

                return result;
            }

            await this.reportRepository.updateStatus(report.id, 'SUCCESS');

            this.logger.info('Successfully sent report to Acciona API', {
                reportId: report.id,
                year: report.year,
                month: report.month,
                statusCode: response.status
            });

            return {
                reportId: report.id,
                success: true,
                timestamp: new Date(),
                statusCode: response.status,
                responseText
            };
        } catch (error: any) {
            const result: SendReportResult = {
                reportId: report.id,
                success: false,
                error: error instanceof Error ? error.message : String(error),
                timestamp: new Date()
            };

            this.logger.error('Failed to send report to Acciona API', error instanceof Error ? error : new Error(String(error)), {
                reportId: report.id,
                year: report.year,
                month: report.month
            });

            await this.reportRepository.updateStatus(
                report.id,
                'FAILURE',
                result.error
            );

            return result;
        }
    }

    async retryFailedReports(): Promise<SendReportResult[]> {
        const responses: SendReportResult[] = [];
        const failedReports = this.reportRepository.findByStatus('FAILURE');

        for await (const report of failedReports) {
            const response = await this.sendReport(report);
            responses.push(response);
        }

        return responses;
    }
}