import { Container } from "@azure/cosmos";
import { IStoreConfigRepository } from "../../../domain/ports/IStoreConfigRepository";
import { StoreConfig } from "../../../domain/entities/StoreConfig";
import { ILogger } from "app/modules/shared/infrastructure/logging/ILogger";

export class CosmosStoreConfigRepository implements IStoreConfigRepository {
    private readonly logger: ILogger;

    constructor(
        private readonly container: Container,
        baseLogger: ILogger
    ) {
        this.logger = baseLogger.child({
            repository: 'CosmosStoreConfigRepository'
        });
    }

    async findByShop(shop: string): Promise<StoreConfig | null> {
        try {
            const querySpec = {
                query: "SELECT * FROM c WHERE c.shop = @shop",
                parameters: [
                    { name: "@shop", value: shop }
                ]
            };

            const { resources } = await this.container.items
                .query<StoreConfig>(querySpec)
                .fetchAll();

            return resources[0] || null;
        } catch (error: any) {
            this.logger.error('Error finding store config', error);
            throw error;
        }
    }

    async save(config: StoreConfig): Promise<void> {
        try {
            await this.container.items.upsert(config);
        } catch (error: any) {
            this.logger.error('Error saving store config', error);
            throw error;
        }
    }
}