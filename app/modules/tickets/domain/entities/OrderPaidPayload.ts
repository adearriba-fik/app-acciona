import { DiscountAllocation } from "./DiscountAllocation";
import { MoneySet } from "./MoneySet";
import { TaxLine } from "./TaxLine";

export interface OrderPaidPayload {
    id: number;
    admin_graphql_api_id: string;
    name: string;
    order_number: string;
    created_at: string;
    total_price: string;
    total_price_set: MoneySet;
    total_discounts: string;
    total_tax: string;
    taxes_included: boolean;
    line_items: OrderLineItem[];
    tags?: string;
}

export interface OrderLineItem {
    id: string;
    title: string;
    price: string;
    price_set: MoneySet;
    quantity: number;
    tax_lines: TaxLine[];
    discount_allocations: DiscountAllocation[];
}