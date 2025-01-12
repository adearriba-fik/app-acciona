import { CosmosDbClient } from "./shared/infrastructure/cosmosdb/CosmosDbClient";
import { ILogger } from "./shared/infrastructure/logging/ILogger";
import { WinstonLogger } from "./shared/infrastructure/logging/WinstonLogger";
import { IStoreConfigModuleApi, StoreConfigModule } from "./store-config/StoreConfigModule";
import { ITicketNumberingModuleApi, TicketNumberingModule } from "./tickets/TicketNumberingModule";

class Modules {
    private static instance: Modules;
    private moduleInstances: Map<string, Promise<any>> = new Map();

    private constructor() { }

    public static getInstance(): Modules {
        if (!this.instance) {
            this.instance = new Modules();
        }
        return this.instance;
    }

    private async getOrCreateModule<T>(
        key: string,
        createFn: () => Promise<T>
    ): Promise<T> {
        if (!this.moduleInstances.has(key)) {
            this.moduleInstances.set(key, createFn());
        }
        return this.moduleInstances.get(key) as Promise<T>;
    }

    public get tickets(): Promise<ITicketNumberingModuleApi> {
        return this.getOrCreateModule('tickets', () => TicketNumberingModule.create());
    }

    public get storeConfig(): Promise<IStoreConfigModuleApi> {
        return this.getOrCreateModule('storeConfig', () => StoreConfigModule.create());
    }
}

export const cosmosDbClient = CosmosDbClient.getInstance();
export const modules = Modules.getInstance();
export const logger: ILogger = new WinstonLogger();