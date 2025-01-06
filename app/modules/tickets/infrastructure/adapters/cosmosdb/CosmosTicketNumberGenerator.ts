import { Container, OperationInput } from "@azure/cosmos";
import { ITicketNumberGenerator } from "../../../domain/ports/ITicketNumberGenerator";
import { CounterDocument, TicketDocument } from "app/modules/tickets/domain/entities/Ticket";

enum CosmosErrorCode {
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
    private readonly maxRetries = 3;
    private readonly retryDelayBase = 100;
    private readonly counterFormat = {
        prefix: 'T',
        padding: 4
    };

    constructor(private container: Container) { }

    async findOrGenerateTicketForDocument(documentType: string, documentId: string): Promise<string> {
        const { resources: existingTickets } = await this.container.items
            .query<TicketDocument>({
                query: "SELECT * FROM c WHERE c.type = 'ticket' AND c.documentType = @documentType AND c.documentId = @documentId",
                parameters: [
                    { name: "@documentType", value: documentType },
                    { name: "@documentId", value: documentId }
                ]
            })
            .fetchAll();

        if (existingTickets.length > 0) {
            return existingTickets[0].id;
        }

        return this.generateNewTicket(documentType, documentId);
    }

    private async generateNewTicket(documentType: string, documentId: string): Promise<string> {
        const year = this.getCurrentYear();
        let retryCount = 0;

        while (retryCount < this.maxRetries) {
            try {
                const counterDoc = await this.getOrCreateCounter(year);
                const nextValue = counterDoc.currentValue + 1;
                const ticketNumber = this.formatTicketNumber(year, nextValue);

                // Create both documents in a transaction
                const response = await this.container.items.batch([
                    {
                        operationType: "Upsert",
                        resourceBody: {
                            ...counterDoc,
                            currentValue: nextValue,
                        },
                    },
                    {
                        operationType: "Create",
                        resourceBody: {
                            id: ticketNumber,
                            type: 'ticket',
                            documentType,
                            documentId,
                            createdAt: new Date(),
                        } as TicketDocument,
                    }
                ]);

                const allOperationsSucceeded = response.result?.every(
                    operation => operation.statusCode >= 200 && operation.statusCode < 300
                );

                if (allOperationsSucceeded) {
                    return ticketNumber;
                }

                throw new Error('Batch operation failed');
            } catch (error: any) {
                if (error.code === CosmosErrorCode.Conflict || error.code === CosmosErrorCode.PreconditionFailed) {
                    retryCount++;
                    if (retryCount === this.maxRetries) {
                        throw new Error('Failed to generate ticket number after max retries');
                    }
                    await this.delay(this.calculateRetryDelay(retryCount));
                    continue;
                }
                throw error;
            }
        }

        throw new Error('Failed to generate ticket number after max retries');
    }

    private getCurrentYear(): string {
        return new Date().getFullYear().toString().slice(-2);
    }

    private formatTicketNumber(year: string, value: number): string {
        return `${this.counterFormat.prefix}${year}-${value.toString().padStart(this.counterFormat.padding, '0')}`;
    }

    private calculateRetryDelay(retryCount: number): number {
        return Math.pow(2, retryCount) * this.retryDelayBase;
    }

    private async getOrCreateCounter(year: string): Promise<CounterDocument> {
        const existingCounter = await this.findCounterByYear(year);
        if (existingCounter) {
            return existingCounter;
        }

        const newCounter: CounterDocument = {
            id: `counter-${year}`,
            type: 'counter',
            year,
            currentValue: 0
        };

        try {
            const { resource } = await this.container.items.create(newCounter);
            return resource!;
        } catch (error: any) {
            if (error.code === CosmosErrorCode.Conflict) {
                return await this.findCounterByYear(year) ??
                    Promise.reject(new Error('Counter not found after conflict'));
            }
            throw error;
        }
    }

    private async findCounterByYear(year: string): Promise<CounterDocument | null> {
        const { resources } = await this.container.items
            .query<CounterDocument>({
                query: "SELECT * FROM c WHERE c.type = 'counter' AND c.year = @year",
                parameters: [{ name: "@year", value: year }]
            })
            .fetchAll();

        return resources[0] ?? null;
    }

    private async incrementTicketNumber(counterDoc: CounterDocument): Promise<number> {
        const nextValue = counterDoc.currentValue + 1;
        const updatedCounter: CounterDocument = {
            ...counterDoc,
            currentValue: nextValue
        };

        try {
            await this.container.item(counterDoc.id).replace(updatedCounter, {
                accessCondition: {
                    type: 'IfMatch',
                    condition: counterDoc._etag!
                }
            });
            return nextValue;
        } catch (error: any) {
            if (error.code === CosmosErrorCode.PreconditionFailed) {
                const { resource: latestCounter } = await this.container.item(counterDoc.id).read<CounterDocument>();
                if (!latestCounter) {
                    throw new Error('Counter document not found');
                }

                throw new CounterConcurrencyError(latestCounter);
            }
            throw error;
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}