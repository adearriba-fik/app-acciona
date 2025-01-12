import { DiscountAllocation } from "./DiscountAllocation";
import { MoneySet } from "./MoneySet";
import { TaxLine } from "./TaxLine";

export interface RefundCreatePayload {
    id: number;
    admin_graphql_api_id: string;
    order_id: number;
    created_at: string;
    processed_at: string;
    refund_line_items: RefundLineItem[];
    transactions: RefundTransaction[];
}

export interface RefundLineItem {
    id: string;
    quantity: number;
    subtotal: number;
    total_tax: number;
    subtotal_set: MoneySet;
    total_tax_set: MoneySet;
    line_item: {
        price: string;
        discount_allocations: DiscountAllocation[];
        tax_lines: TaxLine[];
    };
}

export interface RefundTransaction {
    amount: string;
    currency: string;
}