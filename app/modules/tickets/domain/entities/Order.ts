export interface Order {
    id: string; //Shopify order id
    orderName: string;
    orderNumber: string;
    ticketNumber: string;
    createdAt: Date;
    totalPrice: number;
    totalDiscounts: number;
    totalTax: number;
    taxesIncluded: boolean;
    items: OrderItem[];
}

export interface OrderItem {
    id: string;
    title: string;
    quantity: number;
    price: number;
    totalDiscount: number;
    taxLines: TaxLine[];
}

export interface TaxLine {
    rate: number;
    title: string;
    price: number;
}