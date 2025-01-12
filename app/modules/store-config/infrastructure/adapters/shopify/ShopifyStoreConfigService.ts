import { unauthenticated } from "app/shopify.server";
import { IStoreConfigService } from "../../../domain/ports/IStoreConfigService";

const QUERY_SHOP_CONFIG = `#graphql
  query shopConfig {
    shop {
        name
        taxesIncluded
    }
  }
`;

export class ShopifyStoreConfigService implements IStoreConfigService {
    async getTaxesIncluded(shop: string): Promise<boolean> {
        try {
            const { admin } = await unauthenticated.admin(shop);
            const response = await admin.graphql(QUERY_SHOP_CONFIG);
            const { data } = await response.json();

            if (!data || !data?.shop?.taxesIncluded === undefined) {
                throw new Error('Missing shop tax configuration');
            }

            return data.shop.taxesIncluded;
        } catch (error: unknown) {
            if (error instanceof Error) {
                throw new Error(`Failed to get shop tax configuration: ${error.message}`);
            }

            throw new Error(`Failed to get shop tax configuration: ${String(error)}`);
        }
    }
}