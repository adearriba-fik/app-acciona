import { Refund } from "../entities/Refund";

export interface IRefundRepository {
    save(refund: Refund): Promise<void>;
    findByRefundId(refundId: string): Promise<Refund | null>;
}