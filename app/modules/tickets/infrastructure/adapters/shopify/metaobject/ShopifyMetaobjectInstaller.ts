// @ts-expect-error
import { MetafieldAdminAccessInput, MetafieldStorefrontAccessInput, MetafieldOwnerType, MetaobjectAdminAccess, MetaobjectStorefrontAccess } from "app/types/admin.types.d.ts";
import { ILogger } from "app/modules/shared/infrastructure/logging/ILogger";
import { IMetaobjectInstaller } from "app/modules/tickets/domain/ports/IMetaobjectInstaller";
import { AdminApiContextWithoutRest } from "node_modules/@shopify/shopify-app-remix/dist/ts/server/clients";
import { ticket_metafield_namespace } from "../constants";

const CREATE_METAOBJECT_DEFINITION = `#graphql
  mutation CreateMetaobjectDefinition($definition: MetaobjectDefinitionCreateInput!) {
    metaobjectDefinitionCreate(definition: $definition) {
      metaobjectDefinition {
        id
        type
        fieldDefinitions {
          key
          type {
            name
            category
          }
          required
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const GET_METAOBJECT_DEFINITION = `#graphql
  query GetMetaobjectDefinition($type: String!) {
    metaobjectDefinitionByType(type: $type) {
      id
      type
      fieldDefinitions {
          key
          type {
            name
            category
          }
          required
        }
    }
  }
`;

const GET_ORDER_METAFIELD_DEFINITION = `#graphql
  query getOrderMetafieldDefinition($ownerType: MetafieldOwnerType!, $query: String!) {
    metafieldDefinitions(
      ownerType: $ownerType,
      query: $query,
      first: 1
    ) {
      edges {
        node {
          id
          namespace
          key
          name
        }
      }
    }
  }
`;

const CREATE_ORDER_METAFIELD_DEFINITION = `#graphql
  mutation createOrderMetafieldDefinition($definition: MetafieldDefinitionInput!) {
    metafieldDefinitionCreate(definition: $definition) {
    createdDefinition {
        id
        name
        namespace
        key
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export class ShopifyMetaobjectInstaller implements IMetaobjectInstaller {
  constructor(
    private readonly graphqlClient: AdminApiContextWithoutRest['graphql'],
    private readonly logger: ILogger
  ) { }

  async install(): Promise<void> {
    try {
      // Install metaobject definition
      let metaobjectDefinitionId = await this.checkMetaobjectDefinitionExists();
      if (!metaobjectDefinitionId) {
        metaobjectDefinitionId = await this.createMetaobjectDefinition();
        this.logger.info('Successfully created TicketNumber metaobject definition');
      } else {
        this.logger.info('TicketNumber metaobject definition already exists');
      }

      // Install order metafield definition
      const metafieldExists = await this.checkOrderMetafieldDefinitionExists(ticket_metafield_namespace);
      if (!metafieldExists) {
        await this.createOrderMetafieldDefinition(ticket_metafield_namespace, metaobjectDefinitionId);
        this.logger.info('Successfully created Order Tickets metafield definition');
      } else {
        this.logger.info('Order Tickets metafield definition already exists');
      }
    } catch (error: any) {
      this.logger.error('Failed to complete installation', error);
      throw error;
    }
  }

  private async checkMetaobjectDefinitionExists(): Promise<string | undefined> {
    const response = await this.graphqlClient(GET_METAOBJECT_DEFINITION, {
      variables: {
        type: "$app:ticket_number"
      }
    });

    const data = await response.json();
    return data.data?.metaobjectDefinitionByType?.id;
  }

  private async checkOrderMetafieldDefinitionExists(namespace: string): Promise<boolean> {
    const response = await this.graphqlClient(GET_ORDER_METAFIELD_DEFINITION, {
      variables: {
        ownerType: MetafieldOwnerType.Order,
        query: `namespace:${namespace} AND key:tickets`
      }
    });

    const data = await response.json();
    return !!(data.data?.metafieldDefinitions?.edges && data.data?.metafieldDefinitions?.edges?.length > 0);
  }

  private async createOrderMetafieldDefinition(namespace: string, metaobjectDefinitionId: string): Promise<void> {
    const response = await this.graphqlClient(CREATE_ORDER_METAFIELD_DEFINITION, {
      variables: {
        definition: {
          name: "Order Tickets",
          namespace: namespace,
          key: "tickets",
          description: "List of ticket numbers associated with this order",
          ownerType: MetafieldOwnerType.Order,
          type: "list.metaobject_reference",
          access: {
            admin: MetafieldAdminAccessInput.PublicRead,
            storefront: MetafieldStorefrontAccessInput.PublicRead
          },
          pin: true,
          validations: [{
            name: "metaobject_definition_id",
            value: metaobjectDefinitionId
          }]
        }
      }
    });

    const result = await response.json();
    if (result.data?.metafieldDefinitionCreate?.userErrors &&
      result.data?.metafieldDefinitionCreate?.userErrors?.length > 0) {
      const errors = result.data.metafieldDefinitionCreate.userErrors
        .map((error: any) => `${error.field}: ${error.message}`)
        .join(', ');
      throw new Error(`Failed to create order metafield definition: ${errors}`);
    }
  }

  private async createMetaobjectDefinition(): Promise<string> {
    const response = await this.graphqlClient(CREATE_METAOBJECT_DEFINITION, {
      variables: {
        definition: {
          name: "TicketNumber",
          type: "$app:ticket_number",
          access: {
            admin: MetaobjectAdminAccess.MerchantRead,
            storefront: MetaobjectStorefrontAccess.PublicRead,
          },
          displayNameKey: "ticket_number",
          fieldDefinitions: [
            {
              name: "TicketNumber",
              key: "ticket_number",
              type: "single_line_text_field",
              required: true
            },
            {
              name: "Reference Id",
              key: "reference_id",
              type: "single_line_text_field",
              required: true
            },
            {
              name: "Type",
              key: "type",
              type: "single_line_text_field",
              required: true
            },
            {
              name: "Created At",
              key: "created_at",
              type: "date_time",
              required: true
            }
          ]
        }
      }
    });

    const result = await response.json();

    if (result.data?.metaobjectDefinitionCreate?.userErrors &&
      result.data?.metaobjectDefinitionCreate?.userErrors?.length > 0) {
      const errors = result.data.metaobjectDefinitionCreate.userErrors
        .map((error: any) => `${error.field}: ${error.message}`)
        .join(', ');
      throw new Error(`Failed to create metaobject definition: ${errors}`);
    }

    return result.data?.metaobjectDefinitionCreate?.metaobjectDefinition?.id!;
  }
}