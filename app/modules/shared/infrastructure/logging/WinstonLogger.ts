import winston from 'winston';
import { ILogger } from './ILogger';

export class WinstonLogger implements ILogger {
    private logger: winston.Logger;
    private defaultMeta: Record<string, unknown>;
    level: string;

    constructor(defaultMeta: Record<string, unknown> = { service: 'acciona-app' }) {
        this.level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : process.env.NODE_ENV === 'development' ? 'debug' : 'info';

        this.defaultMeta = defaultMeta;

        this.logger = winston.createLogger({
            level: this.level,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            defaultMeta: { service: 'acciona-app' },
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.splat()
                    ),
                }),
            ],
        });
    }

    child(meta: Record<string, unknown>): ILogger {
        return new WinstonLogger({
            ...this.defaultMeta,
            ...meta
        });
    }

    info(message: string, meta?: Record<string, unknown>): void {
        this.logger.info(message, meta);
    }

    error(message: string, error?: Error, meta?: Record<string, unknown>): void {
        this.logger.error(message, {
            error: error?.stack,
            ...meta,
        });
    }

    warn(message: string, meta?: Record<string, unknown>): void {
        this.logger.warn(message, meta);
    }

    debug(message: string, meta?: Record<string, unknown>): void {
        this.logger.debug(message, meta);
    }
}