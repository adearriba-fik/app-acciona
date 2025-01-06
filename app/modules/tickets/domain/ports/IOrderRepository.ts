import { Order } from "../entities/Order";

export interface IOrderRepository {
    save(order: Order): Promise<void>;
    findByOrderId(orderId: string): Promise<Order | null>;
}