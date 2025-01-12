import { Container, OperationInput } from "@azure/cosmos";
import { ITicketNumberGenerator } from "../../../domain/ports/ITicketNumberGenerator";
import { CounterDocument, OrderTicketDocument, RefundTicketDocument, TicketDocument } from "app/modules/tickets/domain/entities/Ticket";
import { OrderTicketCreateRequest, RefundTicketCreateRequest, TicketCreateRequest } from "app/modules/tickets/domain/entities/TicketCreateRequest";
import { ILogger } from "app/modules/shared/infrastructure/logging/ILogger";

enum CosmosErrorCode {
    NotFound = 404,
    Conflict = 409,         // Resource already exists
    PreconditionFailed = 412  // Optimistic concurrency violation
}

class CounterConcurrencyError extends Error {
    constructor(public readonly latestDocument: CounterDocument) {
        super('Counter document was modified');
        this.name = 'CounterConcurrencyError';
    }
}

export class CosmosTicketNumberGenerator implements ITicketNumberGenerator {
    private readonly logger: ILogger;
    private readonly maxRetries = 3;
    private readonly retryDelayBase = 100; // ms
    private readonly counterFormat = {
        prefix: 'T',
        padding: 4
    };

    constructor(private container: Container, baseLogger: ILogger) {
        this.logger = baseLogger.child({
            handler: 'CosmosTicketNumberGenerator'
        });
    }

    private getYearFromDate(date: Date | string): string {
        return new Date(date).getFullYear().toString();
    }

    async findOrGenerateTicket(request: TicketCreateRequest): Promise<TicketDocument>;
    async findOrGenerateTicket(request: OrderTicketCreateRequest): Promise<OrderTicketDocument>;
    async findOrGenerateTicket(request: RefundTicketCreateRequest): Promise<RefundTicketDocument>;
    async findOrGenerateTicket(request: TicketCreateRequest): Promise<TicketDocument> {
        const year = this.getYearFromDate(request.created_at);
        const existingTicket = await this.findExistingTicket(request, year);
        if (existingTicket) {
            return existingTicket;
        }

        // If no existing ticket, generate a new one with retries
        let retryCount = 0;
        while (retryCount < this.maxRetries) {
            try {
                return await this.generateNewTicket(request, year);
            } catch (error) {
                if (error instanceof CounterConcurrencyError) {
                    retryCount++;
                    if (retryCount === this.maxRetries) {
                        throw new Error('Failed to generate ticket after max retries');
                    }
                    await this.delay(this.calculateRetryDelay(retryCount));
                    continue;
                }
                throw error;
            }
        }

        throw new Error('Failed to generate ticket after max retries');
    }

    private async findExistingTicket(request: TicketCreateRequest, year: string): Promise<TicketDocument | null> {
        const querySpec = request.type === 'order'
            ? {
                query: "SELECT * FROM c WHERE c.year = @year AND c.type = @type AND c.order_id = @orderId",
                parameters: [
                    { name: "@year", value: year },
                    { name: "@type", value: "order" },
                    { name: "@orderId", value: request.order_id }
                ]
            }
            : {
                query: "SELECT * FROM c WHERE c.year = @year AND c.type = @type AND c.order_id = @orderId AND c.refund_id = @refundId",
                parameters: [
                    { name: "@year", value: year },
                    { name: "@type", value: "order" },
                    { name: "@orderId", value: request.order_id },
                    { name: "@refundId", value: (request as RefundTicketCreateRequest).refund_id }
                ]
            };

        const { resources } = await this.container.items
            .query<TicketDocument>(querySpec, {
                partitionKey: year
            })
            .fetchAll();

        return resources[0] || null;
    }

    private async generateNewTicket(request: TicketCreateRequest, year: string): Promise<TicketDocument> {
        const counterDoc = await this.getOrCreateCounter(year);

        const nextValue = counterDoc.currentValue + 1;
        const ticketNumber = this.formatTicketNumber(year, nextValue);
        const ticketDoc = this.createTicketDocument(ticketNumber, request, year);

        const operations: OperationInput[] = [
            {
                operationType: 'Replace',
                id: counterDoc.id,
                resourceBody: {
                    ...counterDoc,
                    currentValue: nextValue
                },
                ifMatch: counterDoc._etag,
            },
            {
                operationType: 'Create',
                resourceBody: ticketDoc
            }
        ];

        try {
            const { result: operationResponses } = await this.container.items.batch(operations, year);

            if (!operationResponses ||
                !operationResponses[0].statusCode.toString().startsWith('2') ||
                !operationResponses[1].statusCode.toString().startsWith('2')) {
                throw new Error('Batch operation failed');
            }

            return operationResponses[1].resourceBody as TicketDocument;
        } catch (error: any) {
            if (error.code === CosmosErrorCode.PreconditionFailed) {
                const { resource: latestCounter } = await this.container.item(counterDoc.id, year).read<CounterDocument>();
                if (!latestCounter) {
                    throw new Error('Counter document not found');
                }
                throw new CounterConcurrencyError(latestCounter);
            }

            if (error.code === CosmosErrorCode.Conflict) {
                const existingTicket = await this.findExistingTicket(request, year);
                if (existingTicket) {
                    return existingTicket;
                }
            }

            throw error;
        }
    }

    private async getOrCreateCounter(year: string): Promise<CounterDocument> {
        const counterId = `counter-${year}`;

        const { resource } = await this.container.item(counterId, year).read<CounterDocument>();

        if (!resource) {
            this.logger.debug('Counter not found, creating new one');
            const newCounter: CounterDocument = {
                id: counterId,
                type: 'counter',
                year,
                currentValue: 0
            };

            try {
                this.logger.debug('Creating new counter document:', {
                    id: newCounter.id,
                    year: newCounter.year,
                    currentValue: newCounter.currentValue,
                });
                const { resource: createdResource } = await this.container.items.create<CounterDocument>(newCounter);

                if (!createdResource) {
                    throw new Error('Failed to create counter document - no resource returned');
                }

                this.logger.debug('Successfully created counter:', {
                    id: createdResource.id,
                    year: createdResource.year,
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
                    const { resource: existingResource } = await this.container.item(counterId, year).read<CounterDocument>();
                    if (!existingResource) {
                        throw new Error('Counter still not found after conflict');
                    }
                    this.logger.debug('Retrieved counter after concurrent creation:', {
                        id: existingResource.id,
                        year: existingResource.year,
                        currentValue: existingResource.currentValue,
                    });
                    return existingResource;
                }
                throw createError;
            }
        }

        this.logger.debug('Successfully read counter:', {
            id: resource.id,
            year: resource.year,
            currentValue: resource.currentValue,
        });
        return resource;
    }

    private createTicketDocument(ticketNumber: string, request: TicketCreateRequest, year: string): TicketDocument {
        const baseTicket = {
            id: ticketNumber,
            year,
            order_id: request.order_id,
            created_at: request.created_at,
            totalAmount: request.totalAmount,
            currency: request.currency,
            tax_lines: request.tax_lines,
            type: request.type
        };

        if (request.type === 'refund') {
            return {
                ...baseTicket,
                refund_id: (request as RefundTicketCreateRequest).refund_id
            } as RefundTicketDocument;
        }

        return baseTicket as OrderTicketDocument;
    }

    private formatTicketNumber(year: string, value: number): string {
        return `${this.counterFormat.prefix}${year.slice(-2)}-${value}`;
    }

    private calculateRetryDelay(retryCount: number): number {
        return Math.pow(2, retryCount) * this.retryDelayBase;
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}