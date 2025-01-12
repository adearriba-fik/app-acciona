import { SummaryTaxLine } from "./SummaryTaxLine";
import { OrderTicketCreateRequest } from "./TicketCreateRequest";

export interface OrderSummary {
    id: number;
    created_at: string;
    totalAmount: number;
    currency: string;
    tax_lines: SummaryTaxLine[];
}

export function mapToOrderTicketCreateRequest(summary: OrderSummary): OrderTicketCreateRequest {
    return {
        order_id: summary.id,
        created_at: new Date(summary.created_at),
        currency: summary.currency,
        totalAmount: summary.totalAmount,
        type: "order",
        tax_lines: summary.tax_lines,
    }
}