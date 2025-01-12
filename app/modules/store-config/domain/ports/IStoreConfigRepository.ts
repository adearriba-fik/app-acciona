import { StoreConfig } from "../entities/StoreConfig";

export interface IStoreConfigRepository {
    findByShop(shop: string): Promise<StoreConfig | null>;
    save(config: StoreConfig): Promise<void>;
}