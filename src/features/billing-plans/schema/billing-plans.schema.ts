import { z } from '@chief-strategist-j/shared-infra';
import type { JsonMapOp } from '@chief-strategist-j/shared-infra/data-driven';

// ─── Entity Schemas ────────────────────────────────────────────────────────────

export const BillingPlanEntitySchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100),
  tier: z.enum(['free', 'starter', 'pro', 'enterprise']),
  priceCents: z.number().int().nonnegative(),      // §16.3: money is never a float
  billingCycle: z.enum(['monthly', 'yearly', 'one_time']),
  currency: z.string().length(3).default('USD'),
  features: z.record(z.unknown()).default({}),     // feature limits as structured data
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateBillingPlanInputSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100),
  tier: z.enum(['free', 'starter', 'pro', 'enterprise']),
  priceCents: z.number().int().nonnegative(),
  billingCycle: z.enum(['monthly', 'yearly', 'one_time']),
  currency: z.string().length(3).default('USD'),
  features: z.record(z.unknown()).optional(),
});

export const UpdateBillingPlanInputSchema = CreateBillingPlanInputSchema.partial();

// ─── Anti-Corruption Layer ────────────────────────────────────────────────────

export const billingPlanFromApiOps: JsonMapOp[] = [
  { op: 'rename', from: 'tenant_id', to: 'tenantId' },
  { op: 'rename', from: 'price_cents', to: 'priceCents' },
  { op: 'rename', from: 'billing_cycle', to: 'billingCycle' },
  { op: 'rename', from: 'is_active', to: 'isActive' },
  { op: 'rename', from: 'created_at', to: 'createdAt' },
  { op: 'rename', from: 'updated_at', to: 'updatedAt' },
];

export const billingPlanToApiOps: JsonMapOp[] = [
  { op: 'rename', from: 'tenantId', to: 'tenant_id' },
  { op: 'rename', from: 'priceCents', to: 'price_cents' },
  { op: 'rename', from: 'billingCycle', to: 'billing_cycle' },
  { op: 'rename', from: 'isActive', to: 'is_active' },
  { op: 'rename', from: 'createdAt', to: 'created_at' },
  { op: 'rename', from: 'updatedAt', to: 'updated_at' },
];
