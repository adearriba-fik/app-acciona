import { SummaryTaxLine } from "./SummaryTaxLine";
import { RefundTicketCreateRequest } from "./TicketCreateRequest";

export interface RefundSummary {
    id: number;
    order_id: number,
    created_at: string;
    totalAmount: number;
    currency: string;
    tax_lines: SummaryTaxLine[];
}

export function mapToRefundTicketCreateRequest(summary: RefundSummary): RefundTicketCreateRequest {
    return {
        refund_id: summary.id,
        order_id: summary.order_id,
        created_at: new Date(summary.created_at),
        currency: summary.currency,
        totalAmount: summary.totalAmount,
        type: "refund",
        tax_lines: summary.tax_lines,
    }
}