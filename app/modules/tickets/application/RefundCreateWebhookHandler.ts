import { IRefundRepository } from "../domain/ports/IRefundRepository";
import { IShopifyWebhookHandler } from "../../shared/domain/ports/IShopifyWebhookHandler";
import { ShopifyWebhookContext } from "../../shared/domain/ports/ShopifyWebhookContext";
import { RefundCreatePayload } from "../domain/entities/RefundCreatePayload";
import { Refund } from "../domain/entities/Refund";

export class RefundCreateWebhookHandler implements IShopifyWebhookHandler<RefundCreatePayload> {
    public readonly topic = 'refunds/create';

    constructor(
        private readonly refundRepository: IRefundRepository
    ) { }

    async handle({ payload }: ShopifyWebhookContext<RefundCreatePayload>): Promise<void> {
        const existingRefund = await this.refundRepository.findByRefundId(payload.id);
        if (existingRefund) {
            return;
        }

        const refund: Refund = {
            id: payload.id,
            orderId: payload.order_id,
            createdAt: new Date(payload.created_at),
            processedAt: new Date(payload.processed_at),
            note: payload.note,
            userId: payload.user_id,
            adminGraphqlApiId: payload.admin_graphql_api_id,
            refundLineItems: payload.refund_line_items.map(item => ({
                id: item.id,
                quantity: item.quantity,
                lineItemId: item.line_item_id,
                locationId: item.location_id,
                restockType: item.restock_type,
                subtotal: item.subtotal,
                totalTax: item.total_tax,
                lineItem: {
                    id: item.line_item.id,
                    title: item.line_item.title,
                    quantity: item.line_item.quantity,
                    sku: item.line_item.sku,
                    variantId: item.line_item.variant_id,
                    productId: item.line_item.product_id,
                    price: parseFloat(item.line_item.price),
                    totalDiscount: parseFloat(item.line_item.total_discount),
                    taxLines: (item.line_item.tax_lines || []).map(taxLine => ({
                        rate: taxLine.rate,
                        title: taxLine.title,
                        price: parseFloat(taxLine.price)
                    }))
                }
            })),
            transactions: payload.transactions.map(transaction => ({
                id: transaction.id,
                orderId: transaction.order_id,
                amount: parseFloat(transaction.amount),
                currency: transaction.currency,
                status: transaction.status,
                message: transaction.message,
                createdAt: new Date(transaction.created_at),
                kind: transaction.kind,
                gateway: transaction.gateway,
                test: transaction.test,
                adminGraphqlApiId: transaction.admin_graphql_api_id
            }))
        };

        await this.refundRepository.save(refund);
    }
}