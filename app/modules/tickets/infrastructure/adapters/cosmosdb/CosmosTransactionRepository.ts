import { Container } from "@azure/cosmos";
import { ITransactionRepository } from "../../../domain/ports/ITransactionRepository";
import { Transaction } from "../../../domain/entities/Transaction";

export class CosmosTransactionRepository implements ITransactionRepository {
    constructor(private container: Container) { }

    async save(transaction: Transaction): Promise<void> {
        await this.container.items.upsert(transaction);
    }

    async findByTransactionId(transactionId: string): Promise<Transaction | null> {
        try {
            const { resource } = await this.container.item(transactionId).read<Transaction>();
            return resource ?? null;
        } catch (error: any) {
            if (error.code === 404) {
                return null;
            }
            throw error;
        }
    }
}