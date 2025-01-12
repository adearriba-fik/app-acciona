import { OrderTicketDocument, RefundTicketDocument, TicketDocument } from "../entities/Ticket";
import { OrderTicketCreateRequest, RefundTicketCreateRequest, TicketCreateRequest } from "../entities/TicketCreateRequest";

export interface ITicketNumberGenerator {
    /**
     * Atomically finds or generates a ticket for the given request.
     * If a ticket already exists for the specified order_id (and refund_id for refunds),
     * returns the existing ticket. Otherwise, generates a new ticket with a unique number.
     * 
     * The operation is atomic - if multiple calls happen simultaneously for the same request,
     * only one ticket will be generated and all calls will receive the same ticket.
     * 
     * @param request - The ticket creation request containing all necessary information
     *                 Can be either OrderTicketCreateRequest or RefundTicketCreateRequest
     * 
     * @returns Promise<TicketDocument> - The ticket document (either existing or newly generated)
     *                                   Will be either OrderTicketDocument or RefundTicketDocument
     *                                   depending on the request type
     * 
     * @throws Error if ticket generation fails after maximum retries
     * @throws Error if there's a data consistency issue
     */
    findOrGenerateTicket(request: TicketCreateRequest): Promise<TicketDocument>;

    /**
     * Type-safe version for order tickets specifically
     */
    findOrGenerateTicket(request: OrderTicketCreateRequest): Promise<OrderTicketDocument>;

    /**
     * Type-safe version for refund tickets specifically
     */
    findOrGenerateTicket(request: RefundTicketCreateRequest): Promise<RefundTicketDocument>;
}