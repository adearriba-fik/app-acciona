import { TicketDocument } from "../entities/Ticket";

export interface IOrderTicketNumberUpdater {
  updateOrder(
    shop: string,
    shopifyGraphqlOrderId: string,
    ticketDocument: TicketDocument): Promise<void>;
}