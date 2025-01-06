import { LogSeverity } from '@shopify/shopify-app-remix/server';
import { ILogger } from './ILogger';

export class ShopifyLogger {
    constructor(private readonly logger: ILogger) { }

    get level() {
        switch (this.logger.level) {
            case 'debug':
                return LogSeverity.Debug;
            case 'error':
                return LogSeverity.Error;
            case 'warn':
                return LogSeverity.Warning;
            case 'info':
                return LogSeverity.Info;
            default:
                return LogSeverity.Info;
        }
    }

    log(severity: LogSeverity, message: string, context?: Record<string, any>): void {
        switch (severity) {
            case LogSeverity.Debug:
                this.logger.debug(message, {
                    ...context,
                    service: 'shopify-app'
                });
                break;
            case LogSeverity.Error:
                this.logger.error(message, context?.message, {
                    ...context,
                    service: 'shopify-app'
                });
                break;
            case LogSeverity.Info:
                this.logger.info(message, {
                    ...context,
                    service: 'shopify-app'
                });
                break;
            case LogSeverity.Warning:
                this.logger.warn(message, {
                    ...context,
                    service: 'shopify-app'
                });
                break;
            default:
                break;
        }
    }
}