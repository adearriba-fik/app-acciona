/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
import type * as AdminTypes from './admin.types';

export type CreateMetaobjectDefinitionMutationVariables = AdminTypes.Exact<{
  definition: AdminTypes.MetaobjectDefinitionCreateInput;
}>;


export type CreateMetaobjectDefinitionMutation = { metaobjectDefinitionCreate?: AdminTypes.Maybe<{ metaobjectDefinition?: AdminTypes.Maybe<(
      Pick<AdminTypes.MetaobjectDefinition, 'id' | 'type'>
      & { fieldDefinitions: Array<(
        Pick<AdminTypes.MetaobjectFieldDefinition, 'key' | 'required'>
        & { type: Pick<AdminTypes.MetafieldDefinitionType, 'name' | 'category'> }
      )> }
    )>, userErrors: Array<Pick<AdminTypes.MetaobjectUserError, 'field' | 'message'>> }> };

export type GetMetaobjectDefinitionQueryVariables = AdminTypes.Exact<{
  type: AdminTypes.Scalars['String']['input'];
}>;


export type GetMetaobjectDefinitionQuery = { metaobjectDefinitionByType?: AdminTypes.Maybe<(
    Pick<AdminTypes.MetaobjectDefinition, 'id' | 'type'>
    & { fieldDefinitions: Array<(
      Pick<AdminTypes.MetaobjectFieldDefinition, 'key' | 'required'>
      & { type: Pick<AdminTypes.MetafieldDefinitionType, 'name' | 'category'> }
    )> }
  )> };

export type GetOrderMetafieldDefinitionQueryVariables = AdminTypes.Exact<{
  ownerType: AdminTypes.MetafieldOwnerType;
  query: AdminTypes.Scalars['String']['input'];
}>;


export type GetOrderMetafieldDefinitionQuery = { metafieldDefinitions: { edges: Array<{ node: Pick<AdminTypes.MetafieldDefinition, 'id' | 'namespace' | 'key' | 'name'> }> } };

export type CreateOrderMetafieldDefinitionMutationVariables = AdminTypes.Exact<{
  definition: AdminTypes.MetafieldDefinitionInput;
}>;


export type CreateOrderMetafieldDefinitionMutation = { metafieldDefinitionCreate?: AdminTypes.Maybe<{ createdDefinition?: AdminTypes.Maybe<Pick<AdminTypes.MetafieldDefinition, 'id' | 'name' | 'namespace' | 'key'>>, userErrors: Array<Pick<AdminTypes.MetafieldDefinitionCreateUserError, 'field' | 'message'>> }> };

export type CurrentAppInstallationQueryVariables = AdminTypes.Exact<{ [key: string]: never; }>;


export type CurrentAppInstallationQuery = { currentAppInstallation: { app: Pick<AdminTypes.App, 'id'> } };

export type GetOrderTicketsQueryVariables = AdminTypes.Exact<{
  id: AdminTypes.Scalars['ID']['input'];
}>;


export type GetOrderTicketsQuery = { order?: AdminTypes.Maybe<(
    Pick<AdminTypes.Order, 'id'>
    & { metafield?: AdminTypes.Maybe<Pick<AdminTypes.Metafield, 'value'>> }
  )> };

export type CreateTicketMetaobjectMutationVariables = AdminTypes.Exact<{
  metaobject: AdminTypes.MetaobjectCreateInput;
}>;


export type CreateTicketMetaobjectMutation = { metaobjectCreate?: AdminTypes.Maybe<{ metaobject?: AdminTypes.Maybe<(
      Pick<AdminTypes.Metaobject, 'id' | 'handle'>
      & { fields: Array<Pick<AdminTypes.MetaobjectField, 'key' | 'value'>> }
    )>, userErrors: Array<Pick<AdminTypes.MetaobjectUserError, 'field' | 'message' | 'code'>> }> };

export type UpdateOrderTicketsMutationVariables = AdminTypes.Exact<{
  metafields: Array<AdminTypes.MetafieldsSetInput> | AdminTypes.MetafieldsSetInput;
}>;


export type UpdateOrderTicketsMutation = { metafieldsSet?: AdminTypes.Maybe<{ metafields?: AdminTypes.Maybe<Array<Pick<AdminTypes.Metafield, 'key' | 'namespace' | 'value' | 'createdAt' | 'updatedAt'>>>, userErrors: Array<Pick<AdminTypes.MetafieldsSetUserError, 'field' | 'message' | 'code'>> }> };

export type PopulateProductMutationVariables = AdminTypes.Exact<{
  product: AdminTypes.ProductCreateInput;
}>;


export type PopulateProductMutation = { productCreate?: AdminTypes.Maybe<{ product?: AdminTypes.Maybe<(
      Pick<AdminTypes.Product, 'id' | 'title' | 'handle' | 'status'>
      & { variants: { edges: Array<{ node: Pick<AdminTypes.ProductVariant, 'id' | 'price' | 'barcode' | 'createdAt'> }> } }
    )> }> };

export type ShopifyRemixTemplateUpdateVariantMutationVariables = AdminTypes.Exact<{
  productId: AdminTypes.Scalars['ID']['input'];
  variants: Array<AdminTypes.ProductVariantsBulkInput> | AdminTypes.ProductVariantsBulkInput;
}>;


export type ShopifyRemixTemplateUpdateVariantMutation = { productVariantsBulkUpdate?: AdminTypes.Maybe<{ productVariants?: AdminTypes.Maybe<Array<Pick<AdminTypes.ProductVariant, 'id' | 'price' | 'barcode' | 'createdAt'>>> }> };

interface GeneratedQueryTypes {
  "#graphql\n  query GetMetaobjectDefinition($type: String!) {\n    metaobjectDefinitionByType(type: $type) {\n      id\n      type\n      fieldDefinitions {\n          key\n          type {\n            name\n            category\n          }\n          required\n        }\n    }\n  }\n": {return: GetMetaobjectDefinitionQuery, variables: GetMetaobjectDefinitionQueryVariables},
  "#graphql\n  query getOrderMetafieldDefinition($ownerType: MetafieldOwnerType!, $query: String!) {\n    metafieldDefinitions(\n      ownerType: $ownerType,\n      query: $query,\n      first: 1\n    ) {\n      edges {\n        node {\n          id\n          namespace\n          key\n          name\n        }\n      }\n    }\n  }\n": {return: GetOrderMetafieldDefinitionQuery, variables: GetOrderMetafieldDefinitionQueryVariables},
  "#graphql\nquery currentAppInstallation{\n    currentAppInstallation {\n        app {\n            id\n        }\n    }\n}\n": {return: CurrentAppInstallationQuery, variables: CurrentAppInstallationQueryVariables},
  "#graphql\n  query getOrderTickets($id: ID!) {\n    order(id: $id) {\n      id\n      metafield(namespace: \"$app.ticket_number\", key: \"tickets\") {\n        value\n      }\n    }\n  }\n": {return: GetOrderTicketsQuery, variables: GetOrderTicketsQueryVariables},
}

interface GeneratedMutationTypes {
  "#graphql\n  mutation CreateMetaobjectDefinition($definition: MetaobjectDefinitionCreateInput!) {\n    metaobjectDefinitionCreate(definition: $definition) {\n      metaobjectDefinition {\n        id\n        type\n        fieldDefinitions {\n          key\n          type {\n            name\n            category\n          }\n          required\n        }\n      }\n      userErrors {\n        field\n        message\n      }\n    }\n  }\n": {return: CreateMetaobjectDefinitionMutation, variables: CreateMetaobjectDefinitionMutationVariables},
  "#graphql\n  mutation createOrderMetafieldDefinition($definition: MetafieldDefinitionInput!) {\n    metafieldDefinitionCreate(definition: $definition) {\n    createdDefinition {\n        id\n        name\n        namespace\n        key\n      }\n      userErrors {\n        field\n        message\n      }\n    }\n  }\n": {return: CreateOrderMetafieldDefinitionMutation, variables: CreateOrderMetafieldDefinitionMutationVariables},
  "#graphql\n  mutation createTicketMetaobject($metaobject: MetaobjectCreateInput!) {\n    metaobjectCreate(metaobject: $metaobject) {\n      metaobject {\n        id\n        handle\n        fields {\n          key\n          value\n        }\n      }\n      userErrors {\n        field\n        message\n        code\n      }\n    }\n  }\n": {return: CreateTicketMetaobjectMutation, variables: CreateTicketMetaobjectMutationVariables},
  "#graphql\n  mutation updateOrderTickets($metafields: [MetafieldsSetInput!]!) {\n    metafieldsSet(metafields: $metafields) {\n      metafields {\n        key\n        namespace\n        value\n        createdAt\n        updatedAt\n      }\n      userErrors {\n        field\n        message\n        code\n      }\n    }\n  }\n": {return: UpdateOrderTicketsMutation, variables: UpdateOrderTicketsMutationVariables},
  "#graphql\n      mutation populateProduct($product: ProductCreateInput!) {\n        productCreate(product: $product) {\n          product {\n            id\n            title\n            handle\n            status\n            variants(first: 10) {\n              edges {\n                node {\n                  id\n                  price\n                  barcode\n                  createdAt\n                }\n              }\n            }\n          }\n        }\n      }": {return: PopulateProductMutation, variables: PopulateProductMutationVariables},
  "#graphql\n    mutation shopifyRemixTemplateUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {\n      productVariantsBulkUpdate(productId: $productId, variants: $variants) {\n        productVariants {\n          id\n          price\n          barcode\n          createdAt\n        }\n      }\n    }": {return: ShopifyRemixTemplateUpdateVariantMutation, variables: ShopifyRemixTemplateUpdateVariantMutationVariables},
}
declare module '@shopify/admin-api-client' {
  type InputMaybe<T> = AdminTypes.InputMaybe<T>;
  interface AdminQueries extends GeneratedQueryTypes {}
  interface AdminMutations extends GeneratedMutationTypes {}
}
