/**
 * @file index.ts
 * @description payments feature public facade.
 * Only this file is imported by layers outside this feature (handlers, infra adapters).
 * Internal feature files (queries, rules, machines, workflows) are not exported here
 * — they are implementation details consumed by the service.
 */

export { PaymentsService } from './service/payments.service';
export type { IPaymentsRepositoryPort } from './repository/payments.repository';
export type {
  PaymentRecord,
  CreatePaymentIntentInput,
  CapturePaymentInput,
  RefundPaymentInput,
  ListPaymentsFilter,
} from './types/payments.types';
export {
  PaymentEntitySchema,
  CreatePaymentIntentInputSchema,
  CapturePaymentInputSchema,
  RefundPaymentInputSchema,
  ListPaymentsFilterSchema,
} from './schema/payments.schema';
