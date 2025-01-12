import { SummaryTaxLine } from "./SummaryTaxLine";

export interface CounterDocument {
    id: string;
    type: 'counter';
    year: string;
    currentValue: number;
    _etag?: string;
}

interface TicketDocumentBase {
    id: string;
    year: string;
    order_id: number;
    created_at: Date;
    totalAmount: number;
    currency: string;
    tax_lines: SummaryTaxLine[];
    [key: string]: any;
}

export interface OrderTicketDocument extends TicketDocumentBase {
    type: "order";
}

export interface RefundTicketDocument extends TicketDocumentBase {
    type: "refund";
    refund_id: number;  // Required for refund tickets
}

// Union type that can be used when handling either type of ticket
export type TicketDocument = OrderTicketDocument | RefundTicketDocument;

// Type guard to check if a ticket is a refund ticket
export function isRefundTicket(ticket: TicketDocument): ticket is RefundTicketDocument {
    return ticket.type === "refund";
}

// Type guard to check if a ticket is an order ticket
export function isOrderTicket(ticket: TicketDocument): ticket is OrderTicketDocument {
    return ticket.type === "order";
}