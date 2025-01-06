import { Container } from "@azure/cosmos";
import { IRefundRepository } from "../../../domain/ports/IRefundRepository";
import { Refund } from "../../../domain/entities/Refund";

export class CosmosRefundRepository implements IRefundRepository {
    constructor(private container: Container) { }

    async save(refund: Refund): Promise<void> {
        await this.container.items.upsert({
            ...refund,
            type: 'refund',
        });
    }

    async findByRefundId(refundId: string): Promise<Refund | null> {
        try {
            const { resource } = await this.container.item(refundId).read<Refund>();
            return resource ?? null;
        } catch (error: any) {
            if (error.code === 404) {
                return null;
            }
            throw error;
        }
    }
}