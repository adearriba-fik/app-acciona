export interface RefundCreatePayload {
    id: string;
    order_id: string;
    created_at: string;
    processed_at: string;
    note: string | null;
    user_id: number | null;
    admin_graphql_api_id: string;
    refund_line_items: Array<{
        id: string;
        quantity: number;
        line_item_id: string;
        location_id: string | null;
        restock_type: string | null;
        subtotal: number;
        total_tax: number;
        line_item: {
            id: string;
            title: string;
            quantity: number;
            sku: string | null;
            variant_id: number | null;
            product_id: number | null;
            price: string;
            total_discount: string;
            tax_lines: Array<{
                rate: number;
                title: string;
                price: string;
            }>;
        };
    }>;
    transactions: Array<{
        id: string;
        order_id: string;
        amount: string;
        currency: string | null;
        status: string;
        message: string | null;
        created_at: string;
        kind: string;
        gateway: string;
        test: boolean;
        admin_graphql_api_id: string;
    }>;
}