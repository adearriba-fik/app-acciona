import { AdminApiContextWithoutRest } from "node_modules/@shopify/shopify-app-remix/dist/ts/server/clients";
import { cosmosDbClient, logger } from "../modules.server";
import { IShopifyWebhookHandler } from "../shared/domain/ports/IShopifyWebhookHandler";
import { OrderPaidWebhookHandler } from "./application/OrderPaidWebhookHandler";
import { OrderPaidPayload } from "./domain/entities/OrderPaidPayload";
import { ITicketNumberGenerator } from "./domain/ports/ITicketNumberGenerator";
import { CosmosTicketNumberGenerator } from "./infrastructure/adapters/cosmosdb/CosmosTicketNumberGenerator";
import { IMetaobjectInstaller } from "./domain/ports/IMetaobjectInstaller";
import { ShopifyMetaobjectInstaller } from "./infrastructure/adapters/shopify/metaobject/ShopifyMetaobjectInstaller";
import { RefundCreatePayload } from "./domain/entities/RefundCreatedPayload";
import { RefundCreatedWebhookHandler } from "./application/RefundCreatedWebhookHandler";
import { ContainerRequest } from "@azure/cosmos";
import { IOrderTicketNumberUpdater } from "./domain/ports/IOrderTicketNumberUpdater";
import { ShopifyOrderTicketNumberUpdater } from "./infrastructure/adapters/shopify/mutations/ShopifyOrderTicketNumberUpdater";

const TICKETS_CONTAINER = "Tickets";
const ticketsContainerConfig: Partial<ContainerRequest> = {
    partitionKey: {
        paths: ["/year"],
        version: 2,
    },
    uniqueKeyPolicy: {
        uniqueKeys: [
            {
                paths: ["/order_id", "/type"]
            },
            {
                paths: ["/refund_id", "/type"]
            }
        ]
    },
    indexingPolicy: {
        indexingMode: "consistent",
        automatic: true,
        includedPaths: [
            {
                path: "/year/?"
            },
            {
                path: "/type/?"
            },
            {
                path: "/order_id/?"
            },
            {
                path: "/refund_id/?"
            }
        ],
        excludedPaths: [
            {
                path: "/tax_lines/*"
            },
            {
                path: "/*"
            }
        ]
    }
};

export interface ITicketNumberingModuleApi {
    getOrderPaidWebhookHandler(): IShopifyWebhookHandler<OrderPaidPayload>;
    getRefundCreateWebhookHandler(): IShopifyWebhookHandler<RefundCreatePayload>;
    getOrderTicketNumberUpdater(): IOrderTicketNumberUpdater;
    onInstall(graphqlClient: AdminApiContextWithoutRest['graphql']): Promise<void>;
}

export class TicketNumberingModule implements ITicketNumberingModuleApi {
    private readonly orderPaidWebhookHandler: OrderPaidWebhookHandler;
    private readonly refundCreateWebhookHandler: RefundCreatedWebhookHandler;
    private readonly orderTicketNumberUpdater: IOrderTicketNumberUpdater;

    private constructor(
        ticketNumberGenerator: ITicketNumberGenerator,
    ) {
        this.orderPaidWebhookHandler = new OrderPaidWebhookHandler(
            ticketNumberGenerator,
            logger,
        );
        this.refundCreateWebhookHandler = new RefundCreatedWebhookHandler(
            ticketNumberGenerator,
            logger,
        );
        this.orderTicketNumberUpdater = new ShopifyOrderTicketNumberUpdater();
    }

    public static async create(): Promise<TicketNumberingModule> {
        const ticketContainer = await cosmosDbClient.getContainer(TICKETS_CONTAINER, ticketsContainerConfig);
        const ticketNumberGenerator = new CosmosTicketNumberGenerator(ticketContainer, logger);

        return new TicketNumberingModule(
            ticketNumberGenerator
        );
    }

    public getOrderPaidWebhookHandler(): OrderPaidWebhookHandler {
        return this.orderPaidWebhookHandler;
    }

    public getRefundCreateWebhookHandler(): RefundCreatedWebhookHandler {
        return this.refundCreateWebhookHandler;
    }

    public getOrderTicketNumberUpdater(): IOrderTicketNumberUpdater {
        return this.orderTicketNumberUpdater;
    }

    public async onInstall(graphqlClient: AdminApiContextWithoutRest['graphql']): Promise<void> {
        const metaobjectInstaller: IMetaobjectInstaller = new ShopifyMetaobjectInstaller(graphqlClient, logger);
        await metaobjectInstaller.install();
    }
}