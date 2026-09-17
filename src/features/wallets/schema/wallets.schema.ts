import { z } from '@chief-strategist-j/shared-infra';
import type { JsonMapOp } from '@chief-strategist-j/shared-infra/data-driven';

// ─── Entity Schemas ────────────────────────────────────────────────────────────

export const WalletEntitySchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  orgId: z.string(),
  userId: z.string(),
  balanceCents: z.number().int().nonnegative(),   // §16.3: money is never a float
  heldCents: z.number().int().nonnegative(),       // funds on hold, not yet settled
  currency: z.string().length(3),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const WalletCreditInputSchema = z.object({
  amountCents: z.number().int().positive(),
  description: z.string().min(1).max(500),
  referenceId: z.string().optional(),
});

export const WalletDebitInputSchema = z.object({
  amountCents: z.number().int().positive(),
  description: z.string().min(1).max(500),
  referenceId: z.string().optional(),
});

export const WalletHoldInputSchema = z.object({
  amountCents: z.number().int().positive(),
  description: z.string().min(1).max(500),
  referenceId: z.string().optional(),
});

// ─── Anti-Corruption Layer: fromApi / toApi transforms ────────────────────────

export const walletFromApiOps: JsonMapOp[] = [
  { op: 'rename', from: 'balance_cents', to: 'balanceCents' },
  { op: 'rename', from: 'held_cents', to: 'heldCents' },
  { op: 'rename', from: 'tenant_id', to: 'tenantId' },
  { op: 'rename', from: 'org_id', to: 'orgId' },
  { op: 'rename', from: 'user_id', to: 'userId' },
  { op: 'rename', from: 'is_active', to: 'isActive' },
  { op: 'rename', from: 'created_at', to: 'createdAt' },
  { op: 'rename', from: 'updated_at', to: 'updatedAt' },
];

export const walletToApiOps: JsonMapOp[] = [
  { op: 'rename', from: 'balanceCents', to: 'balance_cents' },
  { op: 'rename', from: 'heldCents', to: 'held_cents' },
  { op: 'rename', from: 'tenantId', to: 'tenant_id' },
  { op: 'rename', from: 'orgId', to: 'org_id' },
  { op: 'rename', from: 'userId', to: 'user_id' },
  { op: 'rename', from: 'isActive', to: 'is_active' },
  { op: 'rename', from: 'createdAt', to: 'created_at' },
  { op: 'rename', from: 'updatedAt', to: 'updated_at' },
];
