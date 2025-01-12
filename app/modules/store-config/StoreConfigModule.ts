import { ContainerRequest } from "@azure/cosmos";
import { cosmosDbClient, logger } from "../modules.server";
import { IStoreConfigRepository } from "./domain/ports/IStoreConfigRepository";
import { CosmosStoreConfigRepository } from "./infrastructure/adapters/cosmos/CosmosStoreConfigRepository";
import { StoreConfig } from "./domain/entities/StoreConfig";
import { StoreConfigCache } from "./domain/cache/StoreConfigCache";

const STORE_CONFIG_CONTAINER = "StoreConfig";
const storeConfigContainerConfig: Partial<ContainerRequest> = {
    partitionKey: {
        paths: ["/shop"],
        version: 2
    },
    uniqueKeyPolicy: {
        uniqueKeys: [
            {
                paths: ["/shop"]
            }
        ]
    }
};

export interface IStoreConfigModuleApi {
    getStoreConfig(shop: string): Promise<StoreConfig | null>;
    saveStoreConfig(config: StoreConfig): Promise<void>;
    invalidateCache(shop: string): void;
}

export class StoreConfigModule implements IStoreConfigModuleApi {
    private readonly cache: StoreConfigCache;

    private constructor(
        private readonly storeConfigRepository: IStoreConfigRepository
    ) {
        // Default 5 minute cache timeout
        this.cache = new StoreConfigCache(5, logger);
    }

    public static async create(): Promise<StoreConfigModule> {
        const container = await cosmosDbClient.getContainer(
            STORE_CONFIG_CONTAINER,
            storeConfigContainerConfig
        );
        const repository = new CosmosStoreConfigRepository(container, logger);
        return new StoreConfigModule(repository);
    }

    public async getStoreConfig(shop: string): Promise<StoreConfig | null> {
        const cachedConfig = this.cache.get(shop);
        if (cachedConfig) {
            return cachedConfig;
        }

        const config = await this.storeConfigRepository.findByShop(shop);
        if (config) {
            this.cache.set(config);
        }

        return config;
    }

    public async saveStoreConfig(config: StoreConfig): Promise<void> {
        await this.storeConfigRepository.save(config);
        this.cache.set(config);
    }

    public invalidateCache(shop: string): void {
        this.cache.invalidate(shop);
    }
}