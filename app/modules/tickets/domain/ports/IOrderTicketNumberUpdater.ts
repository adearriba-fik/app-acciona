import { TicketDocument } from "../entities/Ticket";

export interface IOrderTicketNumberUpdater {
  updateOrder(
    shopifyGraphqlOrderId: string,
    ticketDocument: TicketDocument): Promise<void>;
}