export interface Refund {
    id: string;
    orderId: string;
    createdAt: Date;
    processedAt: Date;
    note: string | null;
    userId: number | null;
    adminGraphqlApiId: string;
    refundLineItems: Array<{
        id: string;
        quantity: number;
        lineItemId: string;
        locationId: string | null;
        restockType: string | null;
        subtotal: number;
        totalTax: number;
        lineItem: {
            id: string;
            title: string;
            quantity: number;
            sku: string | null;
            variantId: number | null;
            productId: number | null;
            price: number;
            totalDiscount: number;
            taxLines: Array<{
                rate: number;
                title: string;
                price: number;
            }>;
        };
    }>;
    transactions: Array<{
        id: string;
        orderId: string;
        amount: number;
        currency: string | null;
        status: string;
        message: string | null;
        createdAt: Date;
        kind: string;
        gateway: string;
        test: boolean;
        adminGraphqlApiId: string;
    }>;
}