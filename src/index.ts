/**
 * @file index.ts — Payment package public SDK surface.
 * Consumed by other packages that import @observability/payment via generated client SDK.
 * Internal infra (DB, Kafka, server) is NOT exported here.
 */

export { PaymentsService } from './features/payments/service/payments.service';
export type { IPaymentsRepositoryPort } from './features/payments/repository/payments.repository';
export type { PaymentRecord, CreatePaymentIntentInput } from './features/payments/types/payments.types';
export { PAYMENT_CONSTANTS } from './shared/constants/payment.constants';
