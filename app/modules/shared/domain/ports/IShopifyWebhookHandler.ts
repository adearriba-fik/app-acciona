import { ShopifyWebhookContext } from "./ShopifyWebhookContext";

export interface IShopifyWebhookHandler<T = unknown> {
    topic: string;
    handle(webhookPayload: ShopifyWebhookContext<T>): Promise<void>;
}