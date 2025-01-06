import { cosmosDbClient } from "../modules.server";
import { IShopifyWebhookHandler } from "../shared/domain/ports/IShopifyWebhookHandler";
import { OrderPaidWebhookHandler } from "./application/OrderPaidWebhookHandler";
import { RefundCreateWebhookHandler } from "./application/RefundCreateWebhookHandler";
import { TransactionCreateWebhookHandler } from "./application/TransactionCreateWebhookHandler";
import { OrderPaidPayload } from "./domain/entities/OrderPaidPayload";
import { RefundCreatePayload } from "./domain/entities/RefundCreatePayload";
import { TransactionCreatePayload } from "./domain/entities/TransactionCreatePayload";
import { IOrderRepository } from "./domain/ports/IOrderRepository";
import { IRefundRepository } from "./domain/ports/IRefundRepository";
import { ITicketNumberGenerator } from "./domain/ports/ITicketNumberGenerator";
import { ITransactionRepository } from "./domain/ports/ITransactionRepository";
import { CosmosOrderRepository } from "./infrastructure/adapters/cosmosdb/CosmosOrderRepository";
import { CosmosRefundRepository } from "./infrastructure/adapters/cosmosdb/CosmosRefundRepository";
import { CosmosTicketNumberGenerator } from "./infrastructure/adapters/cosmosdb/CosmosTicketNumberGenerator";
import { CosmosTransactionRepository } from "./infrastructure/adapters/cosmosdb/CosmosTransactionRepository";

const ORDERS_CONTAINER = "Orders";
const TICKETS_CONTAINER = "Tickets";
const REFUNDS_CONTAINER = "Refunds";
const TRANSACTIONS_CONTAINER = "Transactions";

export interface ITicketNumberingModuleApi {
    getOrderPaidWebhookHandler(): IShopifyWebhookHandler<OrderPaidPayload>;
    getRefundCreateWebhookHandler(): IShopifyWebhookHandler<RefundCreatePayload>;
    getTransactionCreateWebhookHandler(): IShopifyWebhookHandler<TransactionCreatePayload>;
}

export class TicketNumberingModule implements ITicketNumberingModuleApi {
    private readonly orderPaidWebhookHandler: OrderPaidWebhookHandler;
    private readonly refundCreateWebhookHandler: RefundCreateWebhookHandler;
    private readonly transactionCreateWebhookHandler: TransactionCreateWebhookHandler;

    private constructor(
        orderRepository: IOrderRepository,
        refundRepository: IRefundRepository,
        transactionRepository: ITransactionRepository,
        ticketNumberGenerator: ITicketNumberGenerator,
    ) {
        this.orderPaidWebhookHandler = new OrderPaidWebhookHandler(
            orderRepository,
            ticketNumberGenerator
        );
        this.refundCreateWebhookHandler = new RefundCreateWebhookHandler(
            refundRepository
        );
        this.transactionCreateWebhookHandler = new TransactionCreateWebhookHandler(transactionRepository);
    }

    public static async create(): Promise<TicketNumberingModule> {
        const orderRepository = new CosmosOrderRepository(
            await cosmosDbClient.getContainer(ORDERS_CONTAINER)
        );
        const refundRepository = new CosmosRefundRepository(
            await cosmosDbClient.getContainer(REFUNDS_CONTAINER)
        );
        const transactionRepository = new CosmosTransactionRepository(
            await cosmosDbClient.getContainer(TRANSACTIONS_CONTAINER)
        );
        const ticketNumberGenerator = new CosmosTicketNumberGenerator(
            await cosmosDbClient.getContainer(TICKETS_CONTAINER)
        );

        return new TicketNumberingModule(
            orderRepository,
            refundRepository,
            transactionRepository,
            ticketNumberGenerator
        );
    }

    public getOrderPaidWebhookHandler(): OrderPaidWebhookHandler {
        return this.orderPaidWebhookHandler;
    }

    public getRefundCreateWebhookHandler(): RefundCreateWebhookHandler {
        return this.refundCreateWebhookHandler;
    }

    public getTransactionCreateWebhookHandler(): TransactionCreateWebhookHandler {
        return this.transactionCreateWebhookHandler;
    }
}