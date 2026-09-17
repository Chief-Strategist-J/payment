import { z } from '@chief-strategist-j/shared-infra';
import type { JsonMapOp } from '@chief-strategist-j/shared-infra/data-driven';

// ─── Entity Schemas ────────────────────────────────────────────────────────────

export const PaymentEntitySchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  orgId: z.string(),
  userId: z.string(),
  amountCents: z.number().int().positive(),       // §16.3: money is never a float
  currency: z.string().length(3),                  // ISO 4217
  status: z.enum(['draft', 'authorized', 'captured', 'refunded', 'failed', 'cancelled']),
  gatewayReference: z.string().nullable(),
  idempotencyKey: z.string(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreatePaymentIntentInputSchema = z.object({
  orgId: z.string().min(1),
  userId: z.string().min(1),
  amountCents: z.number().int().positive(),
  currency: z.string().length(3).default('USD'),
  metadata: z.record(z.unknown()).optional(),
});

export const CapturePaymentInputSchema = z.object({
  gatewayReference: z.string().min(1),
});

export const RefundPaymentInputSchema = z.object({
  reason: z.string().min(1).max(500),
  amountCents: z.number().int().positive().optional(), // partial refund if specified
});

export const ListPaymentsFilterSchema = z.object({
  orgId: z.string().optional(),
  userId: z.string().optional(),
  status: z.enum(['draft', 'authorized', 'captured', 'refunded', 'failed', 'cancelled']).optional(),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

// ─── Anti-Corruption Layer: fromApi / toApi transforms ────────────────────────
// These are DATA — no imperative copy code anywhere in handlers or services.

export const paymentFromApiOps: JsonMapOp[] = [
  { op: 'rename', from: 'amount_cents', to: 'amountCents' },
  { op: 'rename', from: 'gateway_reference', to: 'gatewayReference' },
  { op: 'rename', from: 'tenant_id', to: 'tenantId' },
  { op: 'rename', from: 'org_id', to: 'orgId' },
  { op: 'rename', from: 'user_id', to: 'userId' },
  { op: 'rename', from: 'idempotency_key', to: 'idempotencyKey' },
  { op: 'rename', from: 'created_at', to: 'createdAt' },
  { op: 'rename', from: 'updated_at', to: 'updatedAt' },
];

export const paymentToApiOps: JsonMapOp[] = [
  { op: 'rename', from: 'amountCents', to: 'amount_cents' },
  { op: 'rename', from: 'gatewayReference', to: 'gateway_reference' },
  { op: 'rename', from: 'tenantId', to: 'tenant_id' },
  { op: 'rename', from: 'orgId', to: 'org_id' },
  { op: 'rename', from: 'userId', to: 'user_id' },
  { op: 'rename', from: 'idempotencyKey', to: 'idempotency_key' },
  { op: 'rename', from: 'createdAt', to: 'created_at' },
  { op: 'rename', from: 'updatedAt', to: 'updated_at' },
];
