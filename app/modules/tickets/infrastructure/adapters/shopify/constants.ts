import { logger } from "app/modules/modules.server";

if (!process.env.SHOPIFY_APP_ID) {
    logger.error('Missing SHOPIFY_APP_ID environment variable');
    throw new Error('Missing SHOPIFY_APP_ID environment variable');
}

export const ticket_metafield_namespace = `app--${process.env.SHOPIFY_APP_ID}--ticket_numbers`;