import { Container, FeedResponse, OperationInput } from "@azure/cosmos";
import { IReportRepository } from "../../../domain/ports/IReportRepository";
import { ReportDocument, ReportStatus } from "../../../domain/entities/ReportDocument";
import { ReportCounter } from "../../../domain/entities/ReportCounter";
import { ILogger } from "app/modules/shared/infrastructure/logging/ILogger";

enum CosmosErrorCode {
    Conflict = 409,         // Resource already exists
    PreconditionFailed = 412  // Optimistic concurrency violation
}

export class CosmosReportRepository implements IReportRepository {
    private readonly COUNTER_ID = 'report-counter';

    constructor(
        private readonly container: Container,
        private readonly logger: ILogger
    ) { }

    async save(report: ReportDocument): Promise<void> {
        await this.container.items.upsert(report);
    }

    async saveWithCounter(reportDocument: ReportDocument): Promise<ReportDocument> {
        const existingReport = await this.findByYearAndMonth(reportDocument.year, reportDocument.month);

        if (existingReport) {
            // If report exists, just update it without touching the counter
            const updatedReport: ReportDocument = {
                ...reportDocument,
                identifier: existingReport.identifier
            };
            await this.container.items.upsert(updatedReport);
            return updatedReport;
        }

        const counter = await this.getOrCreateCounter();

        const nextValue = counter.currentValue + 1;
        reportDocument.report.Factura.Cabecera.Identificador = nextValue.toString();

        const reportDoc: ReportDocument = {
            ...reportDocument,
            identifier: nextValue,
        };

        const operations: OperationInput[] = [
            {
                operationType: 'Replace',
                id: counter.id,
                resourceBody: {
                    ...counter,
                    currentValue: nextValue
                },
                ifMatch: counter._etag,
            },
            {
                operationType: 'Upsert',
                resourceBody: reportDoc
            }
        ];

        try {
            const { result: operationResponses } = await this.container.items.batch(operations);

            if (!operationResponses ||
                !operationResponses[0].statusCode.toString().startsWith('2') ||
                !operationResponses[1].statusCode.toString().startsWith('2')) {
                throw new Error('Batch operation failed');
            }

            return operationResponses[1].resourceBody as ReportDocument;
        } catch (error: any) {
            this.logger.error('Failed to save report with counter', error);
            throw error;
        }
    }

    private async getOrCreateCounter(): Promise<ReportCounter> {
        const { resource } = await this.container.item(this.COUNTER_ID).read<ReportCounter>();

        if (!resource) {
            this.logger.debug('Counter not found, creating new one');
            const newCounter: ReportCounter = {
                id: this.COUNTER_ID,
                type: 'report_counter',
                currentValue: 0,
            };

            try {
                this.logger.debug('Creating new counter document:', {
                    id: newCounter.id,
                    currentValue: newCounter.currentValue,
                });
                const { resource: createdResource } = await this.container.items.create<ReportCounter>(newCounter);

                if (!createdResource) {
                    throw new Error('Failed to create counter document - no resource returned');
                }

                this.logger.debug('Successfully created counter:', {
                    id: createdResource.id,
                    currentValue: createdResource.currentValue,
                });
                return createdResource;
            } catch (createError: any) {
                this.logger.debug(`Error creating counter:`, {
                    code: createError.code,
                    name: createError.name,
                    message: createError.message
                });
                if (createError.code === CosmosErrorCode.Conflict
                    || createError.name === "Conflict") {
                    // Someone else created it first, read it again
                    const { resource: existingResource } = await this.container.item(this.COUNTER_ID).read<ReportCounter>();
                    if (!existingResource) {
                        throw new Error('Counter still not found after conflict');
                    }
                    this.logger.debug('Retrieved counter after concurrent creation:', {
                        id: existingResource.id,
                        currentValue: existingResource.currentValue,
                    });
                    return existingResource;
                }
                throw createError;
            }
        }

        this.logger.debug('Successfully read counter:', {
            id: resource.id,
            currentValue: resource.currentValue,
        });
        return resource;
    }

    async findByYearAndMonth(year: number, month: number): Promise<ReportDocument | null> {
        const querySpec = {
            query: "SELECT * FROM c WHERE c.type = 'report' AND c.year = @year AND c.month = @month",
            parameters: [
                { name: "@year", value: year },
                { name: "@month", value: month }
            ]
        };

        const { resources } = await this.container.items.query<ReportDocument>(querySpec).fetchAll();
        return resources[0] || null;
    }

    async *findByStatus(status: ReportStatus): AsyncIterableIterator<ReportDocument> {
        const querySpec = {
            query: "SELECT * FROM c WHERE c.type = 'report' AND c.status = @status",
            parameters: [
                { name: "@status", value: status }
            ]
        };

        const queryIterator = this.container.items.query<ReportDocument>(querySpec);

        while (queryIterator.hasMoreResults()) {
            const response: FeedResponse<ReportDocument> = await queryIterator.fetchNext();
            for (const report of response.resources) {
                yield report;
            }
        }
    }

    async updateStatus(id: string, status: ReportStatus, error?: string): Promise<void> {
        const { resource } = await this.container.item(id).read<ReportDocument>();
        if (!resource) {
            throw new Error(`Report ${id} not found`);
        }

        await this.container.item(id).replace({
            ...resource,
            status,
            error,
            updatedAt: new Date(),
            ...(status === 'FAILURE' && {
                retryCount: resource.retryCount + 1,
                lastRetryDate: new Date()
            })
        });
    }
}