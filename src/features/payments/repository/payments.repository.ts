import type {
  PaymentRecord,
  CreatePaymentIntentInput,
  CapturePaymentInput,
  ListPaymentsFilter,
} from '../types/payments.types';

/**
 * IPaymentsRepositoryPort — the domain boundary contract.
 * The service layer depends ONLY on this interface.
 * Any DB (PostgreSQL, MySQL, DynamoDB) can be plugged in by implementing this port.
 */
export interface IPaymentsRepositoryPort {
  createPaymentIntent(input: CreatePaymentIntentInput & { id: string; tenantId: string; idempotencyKey: string }): Promise<PaymentRecord>;
  getPaymentById(id: string, tenantId: string): Promise<PaymentRecord | null>;
  getPaymentByIdempotencyKey(idempotencyKey: string, tenantId: string): Promise<PaymentRecord | null>;
  authorizePayment(id: string, tenantId: string): Promise<PaymentRecord | null>;
  capturePayment(id: string, tenantId: string, input: CapturePaymentInput): Promise<PaymentRecord | null>;
  refundPayment(id: string, tenantId: string): Promise<PaymentRecord | null>;
  failPayment(id: string, tenantId: string, reason: string): Promise<PaymentRecord | null>;
  listPayments(filter: ListPaymentsFilter & { tenantId: string }): Promise<{ items: PaymentRecord[]; total: number }>;
}
