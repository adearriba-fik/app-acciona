export interface Transaction {
    id: string;
    orderId: string;
    kind: string;
    gateway: string;
    status: string;
    message: string | null;
    createdAt: Date;
    test: boolean;
    authorization: string | null;
    locationId: string | null;
    userId: number | null;
    parentId: string | null;
    processedAt: Date | null;
    deviceId: string | null;
    errorCode: string | null;
    sourceName: string;
    receipt: Record<string, unknown>;
    amount: number;
    currency: string;
    paymentId: string;
    totalUnsettledSet: MoneySet;
    manualPaymentGateway: boolean;
    amountRounding: number | null;
    adminGraphqlApiId: string;
}

interface Money {
    amount: number;
    currency: string;
}

interface MoneySet {
    presentmentMoney: Money;
    shopMoney: Money;
}