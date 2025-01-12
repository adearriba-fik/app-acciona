import { ILogger } from "app/modules/shared/infrastructure/logging/ILogger";
import { StoreConfig } from "../entities/StoreConfig";

interface CacheEntry {
    config: StoreConfig;
    timestamp: number;
}

export class StoreConfigCache {
    private cache: Map<string, CacheEntry> = new Map();
    private readonly timeoutMs: number;
    private readonly logger: ILogger;

    constructor(
        timeoutMinutes: number = 5,
        baseLogger: ILogger
    ) {
        this.timeoutMs = timeoutMinutes * 60 * 1000;
        this.logger = baseLogger.child({
            service: 'StoreConfigCache'
        });
    }

    get(shop: string): StoreConfig | null {
        const entry = this.cache.get(shop);
        if (!entry) {
            return null;
        }

        const now = Date.now();
        if (now - entry.timestamp > this.timeoutMs) {
            this.logger.debug('Cache entry expired', { shop });
            this.cache.delete(shop);
            return null;
        }

        this.logger.debug('Cache hit', { shop });
        return entry.config;
    }

    set(config: StoreConfig): void {
        this.logger.debug('Setting cache entry', { shop: config.shop });
        this.cache.set(config.shop, {
            config,
            timestamp: Date.now()
        });
    }

    invalidate(shop: string): void {
        this.logger.debug('Invalidating cache entry', { shop });
        this.cache.delete(shop);
    }

    clear(): void {
        this.logger.debug('Clearing entire cache');
        this.cache.clear();
    }
}