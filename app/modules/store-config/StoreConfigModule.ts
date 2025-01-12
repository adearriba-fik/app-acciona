import { IStoreConfigService } from "./domain/ports/IStoreConfigService";
import { ShopifyStoreConfigService } from "./infrastructure/adapters/shopify/ShopifyStoreConfigService";

export interface IStoreConfigModuleApi {
    getTaxesIncluded(shop: string): Promise<boolean>;
}

export class StoreConfigModule implements IStoreConfigModuleApi {
    private constructor(
        private readonly storeConfigService: IStoreConfigService
    ) { }

    public static create(): StoreConfigModule {
        const service = new ShopifyStoreConfigService();
        return new StoreConfigModule(service);
    }

    public async getTaxesIncluded(shop: string): Promise<boolean> {
        return this.storeConfigService.getTaxesIncluded(shop);
    }
}