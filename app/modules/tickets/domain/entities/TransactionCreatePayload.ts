export interface TransactionCreatePayload {
    id: string;
    order_id: string;
    kind: string;
    gateway: string;
    status: string;
    message: string | null;
    created_at: string;
    test: boolean;
    authorization: string | null;
    location_id: string | null;
    user_id: number | null;
    parent_id: string | null;
    processed_at: string | null;
    device_id: string | null;
    error_code: string | null;
    source_name: string;
    payment_details: {
        credit_card_bin: string | null;
        avs_result_code: string | null;
        cvv_result_code: string | null;
        credit_card_number: string | null;
        credit_card_company: string | null;
        buyer_action_info: string | null;
        credit_card_name: string | null;
        credit_card_wallet: string | null;
        credit_card_expiration_month: number | null;
        credit_card_expiration_year: number | null;
        payment_method_name: string | null;
    };
    receipt: Record<string, unknown>;
    amount: string;
    currency: string;
    payment_id: string;
    total_unsettled_set: {
        presentment_money: {
            amount: string;
            currency: string;
        };
        shop_money: {
            amount: string;
            currency: string;
        };
    };
    manual_payment_gateway: boolean;
    amount_rounding: number | null;
    admin_graphql_api_id: string;
}