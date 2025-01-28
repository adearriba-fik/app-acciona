import { mapToOrderTicketCreateRequest, OrderSummary } from "app/modules/tickets/domain/entities/OrderSummary";
import { SummaryTaxLine } from "../domain/entities/SummaryTaxLine";
import { ITicketNumberGenerator } from "app/modules/tickets/domain/ports/ITicketNumberGenerator";
import { IShopifyWebhookHandler } from "app/modules/shared/domain/ports/IShopifyWebhookHandler";
import { ShopifyWebhookContext } from "app/modules/shared/domain/ports/ShopifyWebhookContext";
import { IOrderTicketNumberUpdater } from "../domain/ports/IOrderTicketNumberUpdater";
import { OrderLineItem, OrderPaidPayload } from "../domain/entities/OrderPaidPayload";
import { MoneyType } from "../domain/entities/MoneyType";
import { DiscountAllocation } from "../domain/entities/DiscountAllocation";
import { MoneySet } from "../domain/entities/MoneySet";
import { ILogger } from "app/modules/shared/infrastructure/logging/ILogger";
import { parseAmount, roundToTwoDecimals, safeAdd, safeDivide, safeMultiply } from "../domain/utils/money-utils";
import { modules } from "app/modules/modules.server";

export class OrderPaidWebhookHandler implements IShopifyWebhookHandler<OrderPaidPayload> {
    public readonly topic = 'orders/paid';
    private readonly logger: ILogger;

    constructor(
        private readonly ticketNumberGenerator: ITicketNumberGenerator,
        baseLogger: ILogger
    ) {
        this.logger = baseLogger.child({
            handler: 'OrderPaidWebhookHandler',
            topic: this.topic
        });
    }

    async handle({ payload, shop }: ShopifyWebhookContext<OrderPaidPayload>): Promise<void> {
        if (payload.tags?.includes("ceco")) {
            this.logger.info('Discarded. Order has "ceco" in tags.', {
                shop,
                orderId: payload.id
            });

            return;
        }

        const storeConfigModule = await modules.storeConfig;
        const taxesIncluded = await storeConfigModule.getTaxesIncluded(shop);

        this.logger.info('Processing order with tax configuration', {
            shop,
            taxesIncluded,
            orderId: payload.id
        });

        const shopSummary = generateOrderSummary(payload, 'shop_money', taxesIncluded);
        this.logger.info('Shop Currency Summary', {
            data: shopSummary
        });

        const ticketDocument = await this.ticketNumberGenerator.findOrGenerateTicket(mapToOrderTicketCreateRequest(shopSummary));

        const orderUpdater: IOrderTicketNumberUpdater = (await modules.tickets).getOrderTicketNumberUpdater();

        await orderUpdater.updateOrder(
            shop,
            payload.admin_graphql_api_id,
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

function calculateLineItemTotalDiscount(
    discountAllocations: DiscountAllocation[],
    moneyType: MoneyType
): number {
    return roundToTwoDecimals(
        discountAllocations.reduce((sum, discount) =>
            safeAdd(sum, getMoneyAmount(discount.amount_set, moneyType).amount),
            0
        )
    );
}

function calculateLineItemBaseAmount(
    lineItem: OrderLineItem,
    moneyType: MoneyType,
    taxesIncluded: boolean
): {
    netPrice: number;
    taxRates: Array<{
        rate: number;
        taxAmount: number;
        title: string;
    }>;
    currency: string;
} {
    const { amount: basePrice, currency } = getMoneyAmount(lineItem.price_set, moneyType);
    const totalBasePrice = safeMultiply(basePrice, lineItem.quantity);
    const totalDiscount = calculateLineItemTotalDiscount(lineItem.discount_allocations, moneyType);
    let netPrice = roundToTwoDecimals(totalBasePrice - totalDiscount);

    const taxRates = lineItem.tax_lines.map(taxLine => ({
        rate: taxLine.rate,
        taxAmount: getMoneyAmount(taxLine.price_set, moneyType).amount,
        title: taxLine.title
    }));

    // If taxes are included in the price, we need to extract them
    if (taxesIncluded) {
        const totalTaxRate = taxRates.reduce((sum, tax) => safeAdd(sum, tax.rate), 0);
        netPrice = safeDivide(netPrice, (1 + totalTaxRate));
    }

    return {
        netPrice,
        taxRates,
        currency
    };
}

function groupLineItemsByTaxRate(
    order: OrderPaidPayload,
    moneyType: MoneyType,
    taxesIncluded: boolean
): Map<number, {
    price: number;
    tax: number;
    title: string;
    currency: string;
}> {
    const taxGroups = new Map<number, {
        price: number;
        tax: number;
        title: string;
        currency: string;
    }>();

    order.line_items.forEach(lineItem => {
        const { netPrice, taxRates, currency } = calculateLineItemBaseAmount(lineItem, moneyType, taxesIncluded);

        // Calculate total tax rate for proportional distribution
        const totalTaxRate = roundToTwoDecimals(
            taxRates.reduce((sum, tax) => safeAdd(sum, tax.rate), 0)
        );

        taxRates.forEach(({ rate, taxAmount, title }) => {
            if (!taxGroups.has(rate)) {
                taxGroups.set(rate, {
                    price: 0,
                    tax: 0,
                    title,
                    currency
                });
            }

            const group = taxGroups.get(rate)!;

            // Distribute net price proportionally based on tax rate
            const priceShare = safeMultiply(netPrice, safeDivide(rate, totalTaxRate));

            group.price = safeAdd(group.price, priceShare);
            group.tax = safeAdd(group.tax, taxAmount);
        });
    });

    return taxGroups;
}

function generateOrderSummary(
    order: OrderPaidPayload,
    moneyType: MoneyType = 'shop_money',
    taxesIncluded: boolean
): OrderSummary {
    const taxGroups = groupLineItemsByTaxRate(order, moneyType, taxesIncluded);
    const { amount: totalAmount, currency } = getMoneyAmount(order.total_price_set, moneyType);

    let tax_lines: SummaryTaxLine[] = Array.from(taxGroups.entries())
        .map(([rate, group]) => ({
            price: roundToTwoDecimals(group.price),
            tax: roundToTwoDecimals(group.tax),
            rate,
            title: group.title,
            currency: group.currency
        }));

    // Handle rounding
    const calculatedTotal = tax_lines.reduce(
        (sum, group) => safeAdd(sum, safeAdd(group.price, group.tax)),
        0
    );

    const discrepancy = roundToTwoDecimals(totalAmount - calculatedTotal);

    if (Math.abs(discrepancy) > 0.01) {
        const largestGroup = tax_lines.reduce(
            (max, current) => current.price > max.price ? current : max,
            tax_lines[0]
        );
        largestGroup.price = roundToTwoDecimals(largestGroup.price + discrepancy);
    }

    return {
        id: order.id,
        created_at: order.created_at,
        totalAmount: roundToTwoDecimals(totalAmount),
        currency,
        tax_lines
    };
}