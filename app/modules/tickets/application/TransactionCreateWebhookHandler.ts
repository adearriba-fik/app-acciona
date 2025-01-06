import { ITransactionRepository } from "../domain/ports/ITransactionRepository";
import { IShopifyWebhookHandler } from "../../shared/domain/ports/IShopifyWebhookHandler";
import { ShopifyWebhookContext } from "../../shared/domain/ports/ShopifyWebhookContext";
import { TransactionCreatePayload } from "../domain/entities/TransactionCreatePayload";
import { Transaction } from "../domain/entities/Transaction";

export class TransactionCreateWebhookHandler implements IShopifyWebhookHandler<TransactionCreatePayload> {
    public readonly topic = 'order_transactions/create';

    constructor(
        private readonly transactionRepository: ITransactionRepository
    ) { }

    async handle({ payload }: ShopifyWebhookContext<TransactionCreatePayload>): Promise<void> {
        const existingTransaction = await this.transactionRepository.findByTransactionId(payload.id);
        if (existingTransaction) {
            return;
        }

        const transaction: Transaction = {
            id: payload.id,
            orderId: payload.order_id,
            kind: payload.kind,
            gateway: payload.gateway,
            status: payload.status,
            message: payload.message,
            createdAt: new Date(payload.created_at),
            test: payload.test,
            authorization: payload.authorization,
            locationId: payload.location_id,
            userId: payload.user_id,
            parentId: payload.parent_id,
            processedAt: payload.processed_at ? new Date(payload.processed_at) : null,
            deviceId: payload.device_id,
            errorCode: payload.error_code,
            sourceName: payload.source_name,
            paymentDetails: {
                creditCardBin: payload.payment_details.credit_card_bin,
                avsResultCode: payload.payment_details.avs_result_code,
                cvvResultCode: payload.payment_details.cvv_result_code,
                creditCardNumber: payload.payment_details.credit_card_number,
                creditCardCompany: payload.payment_details.credit_card_company,
                buyerActionInfo: payload.payment_details.buyer_action_info,
                creditCardName: payload.payment_details.credit_card_name,
                creditCardWallet: payload.payment_details.credit_card_wallet,
                creditCardExpirationMonth: payload.payment_details.credit_card_expiration_month,
                creditCardExpirationYear: payload.payment_details.credit_card_expiration_year,
                paymentMethodName: payload.payment_details.payment_method_name
            },
            receipt: payload.receipt,
            amount: parseFloat(payload.amount),
            currency: payload.currency,
            paymentId: payload.payment_id,
            totalUnsettledSet: {
                presentmentMoney: {
                    amount: parseFloat(payload.total_unsettled_set.presentment_money.amount),
                    currency: payload.total_unsettled_set.presentment_money.currency
                },
                shopMoney: {
                    amount: parseFloat(payload.total_unsettled_set.shop_money.amount),
                    currency: payload.total_unsettled_set.shop_money.currency
                }
            },
            manualPaymentGateway: payload.manual_payment_gateway,
            amountRounding: payload.amount_rounding,
            adminGraphqlApiId: payload.admin_graphql_api_id
        };

        await this.transactionRepository.save(transaction);
    }
}