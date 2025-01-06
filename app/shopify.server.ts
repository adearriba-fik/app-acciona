import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { logger } from "./modules/modules.server";
import { ShopifyLogger } from "./modules/shared/infrastructure/logging/ShopifyLogger";
import { InMemorySessionStorageDecorator } from "./utils/sessionStorage";
import { cosmosDBSessionStorage, initializeCosmosDatabase } from "./db.server";

const shopifyLogger = new ShopifyLogger(logger);
await initializeCosmosDatabase();

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.October24,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new InMemorySessionStorageDecorator(cosmosDBSessionStorage),
  distribution: AppDistribution.AppStore,
  logger: {
    level: shopifyLogger.level,
    log: shopifyLogger.log.bind(shopifyLogger),
  },
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    removeRest: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.October24;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
