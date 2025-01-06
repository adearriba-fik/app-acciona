import { AdminApiContextWithoutRest } from "node_modules/@shopify/shopify-app-remix/dist/ts/server/clients";

export interface ShopifyWebhookContext<T = unknown> {
    topic: string;
    shop: string;
    payload: T;
    graphqlClient: AdminApiContextWithoutRest['graphql']
}