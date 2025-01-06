export interface CounterDocument {
    id: string;
    type: 'counter';
    year: string;
    currentValue: number;
    _etag?: string;
}

export interface TicketDocument {
    id: string;           // The ticket number itself (e.g., T24-0001)
    type: 'ticket';
    documentType: string; // e.g., 'order'
    documentId: string;   // e.g., shopify order id
    createdAt: Date;
    [key: string]: any;  // Index signature for CosmosDB
}