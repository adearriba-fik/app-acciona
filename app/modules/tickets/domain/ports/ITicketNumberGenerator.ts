export interface ITicketNumberGenerator {
    /**
     * Finds an existing ticket for the given document or generates a new one if none exists.
     * The operation is atomic - if multiple calls happen simultaneously for the same document,
     * only one ticket will be generated and the others will receive the same ticket.
     * 
     * @param documentType - The type of document (e.g., 'order')
     * @param documentId - The unique identifier of the document (e.g., Shopify order ID)
     * @returns Promise<string> - The ticket number (either existing or newly generated)
     * @throws Error if ticket generation fails after retries
     */
    findOrGenerateTicketForDocument(documentType: string, documentId: string): Promise<string>;
}