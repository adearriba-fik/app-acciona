import { IReportingModuleApi, ReportingModule } from "./reports/ReportingModule";
import { CosmosDbClient } from "./shared/infrastructure/cosmosdb/CosmosDbClient";
import { ILogger } from "./shared/infrastructure/logging/ILogger";
import { WinstonLogger } from "./shared/infrastructure/logging/WinstonLogger";
import { IStoreConfigModuleApi, StoreConfigModule } from "./store-config/StoreConfigModule";
import { ITicketNumberingModuleApi, TicketNumberingModule } from "./tickets/TicketNumberingModule";

class Modules {
    private static instance: Modules;
    private moduleInstances: Map<string, Promise<any> | any> = new Map();
    private initialized = false;

    private constructor() { }

    public static getInstance(): Modules {
        if (!this.instance) {
            this.instance = new Modules();
        }
        return this.instance;
    }

    private getOrCreateModule<T>(
        key: string,
        createFn: () => T
    ): T {
        if (!this.moduleInstances.has(key)) {
            logger.info(`Starting ${key} module`);
            this.moduleInstances.set(key, createFn());
        }
        return this.moduleInstances.get(key) as T;
    }

    private async getOrCreateModuleAsync<T>(
        key: string,
        createFn: () => Promise<T>
    ): Promise<T> {
        if (!this.moduleInstances.has(key)) {
            logger.info(`Starting ${key} module`);
            this.moduleInstances.set(key, createFn());
        }
        return this.moduleInstances.get(key) as Promise<T>;
    }

    public async initializeAll(): Promise<void> {
        if (this.initialized) {
            logger.warn('Modules have already been initialized');
            return;
        }

        try {
            logger.info('Starting module initialization...');

            const promises = [
                this.tickets,
                this.storeConfig,
                this.reports,
            ];

            await Promise.all(promises);
            this.initialized = true;

            logger.info('All modules initialized successfully');
        } catch (error: unknown) {
            if (error instanceof Error) {
                logger.error('Failed to initialize modules', error);
            } else {
                logger.error('Failed to initialize modules');
            }

            throw error;
        }
    }

    public get tickets(): Promise<ITicketNumberingModuleApi> {
        return this.getOrCreateModuleAsync('tickets', () => TicketNumberingModule.create());
    }

    public get storeConfig(): IStoreConfigModuleApi {
        return this.getOrCreateModule('store-config', () => StoreConfigModule.create());
    }

    public get reports(): Promise<IReportingModuleApi> {
        return this.getOrCreateModuleAsync('reports', () => ReportingModule.create());
    }
}

export const cosmosDbClient = CosmosDbClient.getInstance();
export const modules = Modules.getInstance();
export const logger: ILogger = new WinstonLogger();