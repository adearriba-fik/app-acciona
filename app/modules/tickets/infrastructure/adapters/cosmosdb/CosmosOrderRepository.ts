import { Container } from "@azure/cosmos";
import { IOrderRepository } from "../../../domain/ports/IOrderRepository";
import { Order } from "../../../domain/entities/Order";

export class CosmosOrderRepository implements IOrderRepository {
    constructor(private container: Container) { }

    async save(order: Order): Promise<void> {
        await this.container.items.upsert({
            ...order,
            type: 'order',
        });
    }

    async findByOrderId(orderId: string): Promise<Order | null> {
        try {
            const { resource } = await this.container.item(orderId).read<Order>();
            return resource ?? null;
        } catch (error: any) {
            if (error.code === 404) {
                return null;
            }
            throw error;
        }
    }
}