export interface IStoreConfigService {
    getTaxesIncluded(shop: string): Promise<boolean>;
}