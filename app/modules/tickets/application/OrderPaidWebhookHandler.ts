import { Order } from "app/modules/tickets/domain/entities/Order";
import { IOrderRepository } from "app/modules/tickets/domain/ports/IOrderRepository";
import { ITicketNumberGenerator } from "app/modules/tickets/domain/ports/ITicketNumberGenerator";
import { IShopifyWebhookHandler } from "app/modules/shared/domain/ports/IShopifyWebhookHandler";
import { ShopifyWebhookContext } from "app/modules/shared/domain/ports/ShopifyWebhookContext";
import { IOrderTicketNumberUpdater } from "../domain/ports/IOrderTicketNumberUpdater";
import { ShopifyOrderTicketNumberUpdater } from "../infrastructure/adapters/shopify/mutations/ShopifyOrderTicketNumberUpdater";
import { OrderPaidPayload } from "../domain/entities/OrderPaidPayload";

export class OrderPaidWebhookHandler implements IShopifyWebhookHandler<OrderPaidPayload> {
    public readonly topic = 'orders/paid';

    constructor(
        private readonly orderRepository: IOrderRepository,
        private readonly ticketNumberGenerator: ITicketNumberGenerator
    ) { }

    async handle({ payload, graphqlClient }: ShopifyWebhookContext<OrderPaidPayload>): Promise<void> {
        const existingOrder = await this.orderRepository.findByOrderId(payload.id);
        if (existingOrder) {
            return;
        }

        const ticketNumber = await this.ticketNumberGenerator.generateNext();

        const orderUpdater: IOrderTicketNumberUpdater = new ShopifyOrderTicketNumberUpdater(graphqlClient);

        await orderUpdater.updateOrder(
            payload.admin_graphql_api_id,
            ticketNumber
        );

        const order: Order = {
            id: payload.id,
            orderName: payload.name,
            orderNumber: payload.order_number,
            ticketNumber,
            createdAt: new Date(payload.created_at),
            totalPrice: parseFloat(payload.total_price),
            totalDiscounts: parseFloat(payload.total_discounts),
            totalTax: parseFloat(payload.total_tax),
            taxesIncluded: payload.taxes_included,
            items: payload.line_items.map(item => ({
                id: item.id,
                title: item.title,
                quantity: item.quantity,
                price: parseFloat(item.price),
                totalDiscount: parseFloat(item.total_discount),
                taxLines: (item.tax_lines || []).map(taxLine => ({
                    rate: taxLine.rate,
                    title: taxLine.title,
                    price: parseFloat(taxLine.price)
                }))
            }))
        };

        await this.orderRepository.save(order);
    }
}