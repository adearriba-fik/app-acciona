export interface IOrderTicketNumberUpdater {
  updateOrder(
    shopifyGraphqlOrderId: string,
    ticketNumber: string): Promise<void>;
}