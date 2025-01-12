import { SummaryTaxLine } from "./SummaryTaxLine";

interface TicketCreateRequestBase {
    order_id: number;
    created_at: Date;
    totalAmount: number;
    currency: string;
    tax_lines: SummaryTaxLine[];
}

export interface OrderTicketCreateRequest extends TicketCreateRequestBase {
    type: "order";
}

export interface RefundTicketCreateRequest extends TicketCreateRequestBase {
    type: "refund";
    refund_id: number;
}

export type TicketCreateRequest = OrderTicketCreateRequest | RefundTicketCreateRequest;

