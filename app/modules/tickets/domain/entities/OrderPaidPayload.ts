export interface OrderPaidPayload {
    id: string;
    admin_graphql_api_id: string;
    name: string;
    order_number: string;
    created_at: string;
    total_price: string;
    total_discounts: string;
    total_tax: string;
    taxes_included: boolean;
    line_items: Array<{
        id: string;
        title: string;
        quantity: number;
        price: string;
        total_discount: string;
        tax_lines: Array<{
            rate: number;
            title: string;
            price: string;
        }>;
    }>;
}