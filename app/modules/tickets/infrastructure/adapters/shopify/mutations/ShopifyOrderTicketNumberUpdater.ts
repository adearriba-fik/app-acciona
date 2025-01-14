import { TicketDocument } from 'app/modules/tickets/domain/entities/Ticket';
import { IOrderTicketNumberUpdater } from 'app/modules/tickets/domain/ports/IOrderTicketNumberUpdater';
import { AdminApiContextWithoutRest } from 'node_modules/@shopify/shopify-app-remix/dist/ts/server/clients';
import { ticket_metafield_namespace } from '../constants';
import { unauthenticated } from 'app/shopify.server';

const GET_ORDER_TICKETS = `#graphql
  query getOrderTickets($id: ID!, $namespace: String!) {
    order(id: $id) {
      id
      metafield(namespace: $namespace, key: "tickets") {
        value
      }
    }
  }
`;

const UPSERT_TICKET_METAOBJECT = `#graphql
  mutation upsertTicketMetaobject($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
    metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
      metaobject {
        id
        handle
        fields {
          key
          value
        }
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

const UPDATE_ORDER_TICKETS = `#graphql
  mutation updateOrderTickets($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        key
        namespace
        value
        createdAt
        updatedAt
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

export class ShopifyOrderTicketNumberUpdater implements IOrderTicketNumberUpdater {
  constructor() { }

  async updateOrder(
    shop: string,
    shopifyGraphqlOrderId: string,
    ticketDocument: TicketDocument,
  ): Promise<void> {
    const { admin } = await unauthenticated.admin(shop);
    // First, create the ticket metaobject
    const ticketMetaobject = await this.upsertTicketMetaobject(ticketDocument, admin.graphql);

    // Then get current tickets
    const currentTickets = await this.getOrderTickets(shopifyGraphqlOrderId, admin.graphql);

    // Add new ticket to the list if it doesn't exist
    if (!currentTickets.includes(ticketMetaobject!.id)) {
      const updatedTickets = [...currentTickets, ticketMetaobject!.id];
      await this.updateOrderTickets(shopifyGraphqlOrderId, updatedTickets, admin.graphql);
    }
  }

  private async upsertTicketMetaobject(ticketDocument: TicketDocument, graphqlClient: AdminApiContextWithoutRest['graphql']) {
    const response = await graphqlClient(UPSERT_TICKET_METAOBJECT, {
      variables: {
        handle: {
          type: "$app:ticket_number",
          handle: ticketDocument.id
        },
        metaobject: {
          fields: [
            {
              key: "ticket_number",
              value: ticketDocument.id
            },
            {
              key: "reference_id",
              value: ticketDocument.type == 'order' ?
                ticketDocument.order_id.toString() :
                ticketDocument.refund_id.toString()
            },
            {
              key: "type",
              value: ticketDocument.type
            },
            {
              key: "created_at",
              value: new Date(ticketDocument.created_at).toISOString()
            }
          ]
        }
      }
    });

    const result = await response.json();

    if (result.data?.metaobjectUpsert?.userErrors &&
      result.data?.metaobjectUpsert?.userErrors?.length > 0) {
      throw new Error(
        `Failed to upsert ticket metaobject: ${result.data.metaobjectUpsert.userErrors
          .map((error: any) => `${error.field}: ${error.message}`)
          .join(', ')}`
      );
    }

    return result.data!.metaobjectUpsert!.metaobject;
  }

  private async getOrderTickets(orderId: string, graphqlClient: AdminApiContextWithoutRest['graphql']): Promise<string[]> {
    const response = await graphqlClient(GET_ORDER_TICKETS, {
      variables: {
        id: orderId,
        namespace: ticket_metafield_namespace
      }
    });

    const result = await response.json();
    const ticketsValue = result.data?.order?.metafield?.value;

    if (ticketsValue) {
      try {
        return JSON.parse(ticketsValue);
      } catch (e) {
        return [];
      }
    }

    return [];
  }

  private async updateOrderTickets(orderId: string, ticketIds: string[], graphqlClient: AdminApiContextWithoutRest['graphql']) {
    const response = await graphqlClient(UPDATE_ORDER_TICKETS, {
      variables: {
        metafields: [
          {
            ownerId: orderId,
            namespace: ticket_metafield_namespace,
            key: "tickets",
            type: "list.metaobject_reference",
            value: JSON.stringify(ticketIds)
          }
        ]
      }
    });

    const result = await response.json();

    if (result.data?.metafieldsSet?.userErrors &&
      result.data?.metafieldsSet?.userErrors?.length > 0) {
      throw new Error(
        `Failed to update order tickets: ${result.data.metafieldsSet.userErrors
          .map((error: any) => `${error.field}: ${error.message}`)
          .join(', ')}`
      );
    }
  }
}