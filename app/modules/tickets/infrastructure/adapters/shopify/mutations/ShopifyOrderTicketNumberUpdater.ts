import { IOrderTicketNumberUpdater } from 'app/modules/tickets/domain/ports/IOrderTicketNumberUpdater';
import { AttributeInput } from 'app/types/admin.types';
import { AdminApiContextWithoutRest } from 'node_modules/@shopify/shopify-app-remix/dist/ts/server/clients';

const GET_ORDER_ATTRIBUTES = `#graphql
  query getOrderAttributes($id: ID!) {
    order(id: $id) {
      id
      customAttributes {
        key
        value
      }
    }
  }
`;

const UPDATE_ORDER_METAFIELD = `#graphql
  mutation updateOrderAttributes($input: OrderInput!) {
    orderUpdate(input: $input) {
      order {
        id
        customAttributes {
          key
          value
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export class ShopifyOrderTicketNumberUpdater implements IOrderTicketNumberUpdater {
  constructor(private readonly graphqlClient: AdminApiContextWithoutRest['graphql']) { }

  private async getOrderAttributes(shopifyGraphqlOrderId: string) {
    const response = await this.graphqlClient(GET_ORDER_ATTRIBUTES, {
      variables: {
        id: shopifyGraphqlOrderId,
      }
    });

    const orderResponse = await response.json();
    return orderResponse.data?.order?.customAttributes ?? [];
  }

  async updateOrder(
    shopifyGraphqlOrderId: string,
    ticketNumber: string,
  ): Promise<void> {
    const currentAttributes = await this.getOrderAttributes(shopifyGraphqlOrderId);

    const updatedAttributes: AttributeInput[] = [
      ...currentAttributes?.map(attr => ({
        key: attr.key,
        value: attr.value!
      })),
      {
        key: 'ticketNumber',
        value: ticketNumber
      }
    ];

    const response = await this.graphqlClient(UPDATE_ORDER_METAFIELD, {
      variables: {
        input: {
          id: shopifyGraphqlOrderId,
          customAttributes: updatedAttributes
        }
      }
    });

    const mutationResponse = await response.json();

    if (!mutationResponse.data?.orderUpdate) {
      throw new Error();
    }

    if (mutationResponse.data.orderUpdate.userErrors.length > 0) {
      throw new Error(
        `Failed to update order metafield: ${mutationResponse.data.orderUpdate.userErrors
          .map(error => `${error.field}: ${error.message}`)
          .join(', ')
        }`
      );
    }
  }
}