import { SummaryTaxLine } from "../domain/entities/SummaryTaxLine";
import { ITicketNumberGenerator } from "app/modules/tickets/domain/ports/ITicketNumberGenerator";
import { IShopifyWebhookHandler } from "app/modules/shared/domain/ports/IShopifyWebhookHandler";
import { ShopifyWebhookContext } from "app/modules/shared/domain/ports/ShopifyWebhookContext";
import { IOrderTicketNumberUpdater } from "../domain/ports/IOrderTicketNumberUpdater";
import { ShopifyOrderTicketNumberUpdater } from "../infrastructure/adapters/shopify/mutations/ShopifyOrderTicketNumberUpdater";
import { MoneyType } from "../domain/entities/MoneyType";
import { MoneySet } from "../domain/entities/MoneySet";
import { ILogger } from "app/modules/shared/infrastructure/logging/ILogger";
import { RefundCreatePayload, RefundLineItem } from "../domain/entities/RefundCreatedPayload";
import { mapToRefundTicketCreateRequest, RefundSummary } from "../domain/entities/RefundSummary";
import { parseAmount, roundToTwoDecimals, safeAdd, safeDivide } from "../domain/utils/money-utils";
import { modules } from "app/modules/modules.server";

export class RefundCreatedWebhookHandler implements IShopifyWebhookHandler<RefundCreatePayload> {
    public readonly topic = 'orders/paid';
    private readonly logger: ILogger;

    constructor(
        private readonly ticketNumberGenerator: ITicketNumberGenerator,
        baseLogger: ILogger
    ) {
        this.logger = baseLogger.child({
            handler: 'RefundCreatedWebhookHandler',
            topic: this.topic
        });
    }

    async handle({ payload, shop, graphqlClient }: ShopifyWebhookContext<RefundCreatePayload>): Promise<void> {
        if (payload.refund_line_items.length == 0) {
            this.logger.info("Discarded: Empty refund_line_items array.");
            return;
        }

        const storeConfigModule = await modules.storeConfig;
        const taxesIncluded = await storeConfigModule.getTaxesIncluded(shop);

        this.logger.info('Processing refund with tax configuration', {
            shop,
            taxesIncluded,
            refundId: payload.id,
            orderId: payload.order_id
        });

        const shopSummary = generateRefundSummary(payload, 'shop_money', taxesIncluded);
        this.logger.info('Shop Currency Summary', {
            data: shopSummary
        });

        const ticketDocument = await this.ticketNumberGenerator.findOrGenerateTicket(mapToRefundTicketCreateRequest(shopSummary));

        const orderUpdater: IOrderTicketNumberUpdater = new ShopifyOrderTicketNumberUpdater(graphqlClient);

        await orderUpdater.updateOrder(
            `gid://shopify/Order/${payload.order_id}`,
            ticketDocument
        );
    }

}

function getMoneyAmount(moneySet: MoneySet, moneyType: MoneyType): {
    amount: number;
    currency: string;
} {
    const money = moneySet[moneyType];
    return {
        amount: parseAmount(money.amount),
        currency: money.currency_code
    };
}

function calculateTotalRefundAmount(refundLineItems: RefundLineItem[], moneyType: MoneyType): number {
    return roundToTwoDecimals(
        refundLineItems.reduce((sum, item) => {
            const { amount: subtotal } = getMoneyAmount(item.subtotal_set, moneyType);
            // Don't add tax as it's already included in subtotal
            return safeAdd(sum, subtotal);
        }, 0)
    );
}

function getCurrencyFromMoneySet(moneySet: MoneySet, moneyType: MoneyType): string {
    return moneySet[moneyType].currency_code;
}

function groupRefundLineItemsByTaxRate(
    refund: RefundCreatePayload,
    moneyType: MoneyType,
    taxesIncluded: boolean
): Map<string, {
    price: number;
    tax: number;
    rate: number;
    title: string;
}> {
    const taxGroups = new Map<string, {
        price: number;
        tax: number;
        rate: number;
        title: string;
    }>();

    refund.refund_line_items.forEach(refundLineItem => {
        // Get the subtotal which already includes tax
        const { amount: subtotal } = getMoneyAmount(refundLineItem.subtotal_set, moneyType);

        // Since we have only one tax rate per line item in this case
        // we can directly calculate the base price
        const taxLine = refundLineItem.line_item.tax_lines[0];
        const key = `${taxLine.rate}-${taxLine.title}`;

        let basePrice: number;
        let tax: number;

        if (taxesIncluded) {
            // If taxes are included in the price, we need to extract them
            basePrice = safeDivide(subtotal, (1 + taxLine.rate));
            tax = roundToTwoDecimals(subtotal - basePrice);
        } else {
            // If taxes are not included, the subtotal is already the base price
            basePrice = subtotal;
            tax = getMoneyAmount(taxLine.price_set, moneyType).amount;
        }

        const currentGroup = taxGroups.get(key) || {
            price: 0,
            tax: 0,
            rate: taxLine.rate,
            title: taxLine.title
        };

        currentGroup.price = safeAdd(currentGroup.price, basePrice);
        currentGroup.tax = safeAdd(currentGroup.tax, tax);

        taxGroups.set(key, currentGroup);
    });

    return taxGroups;
}

function generateRefundSummary(
    refund: RefundCreatePayload,
    moneyType: MoneyType = 'shop_money',
    taxesIncluded: boolean
): RefundSummary {
    const taxGroups = groupRefundLineItemsByTaxRate(refund, moneyType, taxesIncluded);
    const totalAmount = calculateTotalRefundAmount(refund.refund_line_items, moneyType);
    const currency = getCurrencyFromMoneySet(refund.refund_line_items[0].subtotal_set, moneyType);

    let tax_lines: SummaryTaxLine[] = Array.from(taxGroups.entries())
        .map(([, group]) => ({
            price: roundToTwoDecimals(group.price),
            tax: roundToTwoDecimals(group.tax),
            rate: group.rate,
            title: group.title,
            currency
        }));

    // Handle rounding
    const calculatedTotal = tax_lines.reduce(
        (sum, group) => safeAdd(sum, safeAdd(group.price, group.tax)),
        0
    );

    const discrepancy = roundToTwoDecimals(totalAmount - calculatedTotal);

    if (Math.abs(discrepancy) > 0.01) {  // Only adjust if discrepancy is more than a cent
        const largestGroup = tax_lines.reduce(
            (max, current) => current.price > max.price ? current : max,
            tax_lines[0]
        );
        largestGroup.price = roundToTwoDecimals(largestGroup.price + discrepancy);
    }

    return {
        id: refund.id,
        order_id: refund.order_id,
        created_at: refund.created_at,
        totalAmount: roundToTwoDecimals(totalAmount),
        currency,
        tax_lines
    };
}