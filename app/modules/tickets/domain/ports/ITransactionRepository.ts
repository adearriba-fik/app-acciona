import { Transaction } from "../entities/Transaction";

export interface ITransactionRepository {
    save(transaction: Transaction): Promise<void>;
    findByTransactionId(transactionId: string): Promise<Transaction | null>;
}