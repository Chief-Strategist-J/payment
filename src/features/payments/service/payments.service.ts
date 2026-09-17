import { randomUUID } from 'node:crypto';
import { resolveRules } from '@chief-strategist-j/shared-infra/rules-engine';
import { PAYMENT_RULES } from '../rules/payments.rules';
import { resolvePaymentTransition } from '../machines/payments.machine';
import {
  CreatePaymentIntentInputSchema,
  CapturePaymentInputSchema,
  RefundPaymentInputSchema,
  ListPaymentsFilterSchema,
} from '../schema/payments.schema';
import type { IPaymentsRepositoryPort } from '../repository/payments.repository';
import type { PaymentEventProducer } from '../../../shared/messaging/producers/payment-event.producer';
import type {
  PaymentRecord,
  CreatePaymentIntentInput,
  CapturePaymentInput,
  RefundPaymentInput,
  ListPaymentsFilter,
} from '../types/payments.types';
import {
  PaymentNotFoundError,
  PaymentAlreadyCapturedError,
  IdempotencyKeyReuseError,
  PaymentValidationError,
} from '../../../shared/errors/payment.errors';

/**
 * PaymentsService — pure domain service.
 * No HTTP, no direct DB, no process.env.
 * Depends only on IPaymentsRepositoryPort and PaymentEventProducer interfaces.
 */
export class PaymentsService {
  constructor(
    private readonly repo: IPaymentsRepositoryPort,
    private readonly eventProducer?: PaymentEventProducer,
  ) {}

  async createPaymentIntent(
    input: CreatePaymentIntentInput,
    tenantId: string,
    idempotencyKey: string,
  ): Promise<PaymentRecord> {
    const validated = CreatePaymentIntentInputSchema.parse(input);

    // Rules evaluation — deny-override, priority-weighted, AS DATA
    const ruleCtx: Record<string, unknown> = {
      amountCents: validated.amountCents,
      tenantId,
      idempotencyKey,
    };
    const deniedRules = (await resolveRules(PAYMENT_RULES, ruleCtx)).filter(
      (r) => r.effect === 'deny',
    );
    if (deniedRules.length > 0) {
      const denied = deniedRules[0]!;
      throw new PaymentValidationError(denied.name ?? denied.id);
    }

    // Idempotency guard
    const existing = await this.repo.getPaymentByIdempotencyKey(idempotencyKey, tenantId);
    if (existing) {
      return existing; // hash verified at handler layer (§3A)
    }

    const payment = await this.repo.createPaymentIntent({
      ...validated,
      id: randomUUID(),
      tenantId,
      idempotencyKey,
    });

    return payment;
  }

  async capturePayment(
    id: string,
    tenantId: string,
    input: CapturePaymentInput,
  ): Promise<PaymentRecord> {
    const validated = CapturePaymentInputSchema.parse(input);
    const payment = await this.repo.getPaymentById(id, tenantId);
    if (!payment) throw new PaymentNotFoundError(id);

    // State machine guard — only authorized payments can be captured
    const transition = resolvePaymentTransition(payment.status, 'CAPTURE', {
      gatewayReferenceProvided: !!validated.gatewayReference,
    });
    if (!transition) throw new PaymentAlreadyCapturedError(id);

    const captured = await this.repo.capturePayment(id, tenantId, validated);
    if (!captured) throw new PaymentNotFoundError(id);

    await this.eventProducer?.publishPaymentCompleted({
      paymentId: captured.id,
      tenantId,
      orgId: captured.orgId,
      userId: captured.userId,
      amountCents: captured.amountCents,
      currency: captured.currency,
    });

    return captured;
  }

  async refundPayment(
    id: string,
    tenantId: string,
    input: RefundPaymentInput,
  ): Promise<PaymentRecord> {
    RefundPaymentInputSchema.parse(input);
    const payment = await this.repo.getPaymentById(id, tenantId);
    if (!payment) throw new PaymentNotFoundError(id);

    const transition = resolvePaymentTransition(payment.status, 'REFUND');
    if (!transition) {
      throw new IdempotencyKeyReuseError();
    }

    const refunded = await this.repo.refundPayment(id, tenantId);
    if (!refunded) throw new PaymentNotFoundError(id);

    await this.eventProducer?.publishRefundInitiated({
      paymentId: refunded.id,
      tenantId,
      orgId: refunded.orgId,
      userId: refunded.userId,
      amountCents: refunded.amountCents,
      currency: refunded.currency,
    });

    return refunded;
  }

  async getPayment(id: string, tenantId: string): Promise<PaymentRecord> {
    const payment = await this.repo.getPaymentById(id, tenantId);
    if (!payment) throw new PaymentNotFoundError(id);
    return payment;
  }

  async listPayments(
    filter: ListPaymentsFilter,
    tenantId: string,
  ): Promise<{ items: PaymentRecord[]; total: number }> {
    const validated = ListPaymentsFilterSchema.parse(filter);
    return this.repo.listPayments({ ...validated, tenantId });
  }
}
