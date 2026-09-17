import { z } from '@chief-strategist-j/shared-infra';
import type { JsonMapOp } from '@chief-strategist-j/shared-infra/data-driven';

// ─── Entity Schemas ────────────────────────────────────────────────────────────

export const InvoiceEntitySchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  orgId: z.string(),
  userId: z.string(),
  billingPlanId: z.string().uuid().nullable(),
  subtotalCents: z.number().int().nonnegative(),   // §16.3: money is never a float
  taxCents: z.number().int().nonnegative(),
  totalCents: z.number().int().nonnegative(),
  currency: z.string().length(3),
  status: z.enum(['draft', 'issued', 'paid', 'void', 'overdue']),
  dueDate: z.string().datetime().nullable(),
  issuedAt: z.string().datetime().nullable(),
  paidAt: z.string().datetime().nullable(),
  lineItems: z.array(z.object({
    description: z.string(),
    quantity: z.number().int().positive(),
    unitCents: z.number().int().nonnegative(),
    totalCents: z.number().int().nonnegative(),
  })).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateInvoiceInputSchema = z.object({
  orgId: z.string().min(1),
  userId: z.string().min(1),
  billingPlanId: z.string().uuid().optional(),
  currency: z.string().length(3).default('USD'),
  dueDate: z.string().datetime().optional(),
  lineItems: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().int().positive(),
    unitCents: z.number().int().nonnegative(),
  })).min(1),
});

export const VoidInvoiceInputSchema = z.object({
  reason: z.string().min(1).max(500),
});

// ─── Anti-Corruption Layer ────────────────────────────────────────────────────

export const invoiceFromApiOps: JsonMapOp[] = [
  { op: 'rename', from: 'tenant_id', to: 'tenantId' },
  { op: 'rename', from: 'org_id', to: 'orgId' },
  { op: 'rename', from: 'user_id', to: 'userId' },
  { op: 'rename', from: 'billing_plan_id', to: 'billingPlanId' },
  { op: 'rename', from: 'subtotal_cents', to: 'subtotalCents' },
  { op: 'rename', from: 'tax_cents', to: 'taxCents' },
  { op: 'rename', from: 'total_cents', to: 'totalCents' },
  { op: 'rename', from: 'due_date', to: 'dueDate' },
  { op: 'rename', from: 'issued_at', to: 'issuedAt' },
  { op: 'rename', from: 'paid_at', to: 'paidAt' },
  { op: 'rename', from: 'line_items', to: 'lineItems' },
  { op: 'rename', from: 'created_at', to: 'createdAt' },
  { op: 'rename', from: 'updated_at', to: 'updatedAt' },
];

export const invoiceToApiOps: JsonMapOp[] = [
  { op: 'rename', from: 'tenantId', to: 'tenant_id' },
  { op: 'rename', from: 'orgId', to: 'org_id' },
  { op: 'rename', from: 'userId', to: 'user_id' },
  { op: 'rename', from: 'billingPlanId', to: 'billing_plan_id' },
  { op: 'rename', from: 'subtotalCents', to: 'subtotal_cents' },
  { op: 'rename', from: 'taxCents', to: 'tax_cents' },
  { op: 'rename', from: 'totalCents', to: 'total_cents' },
  { op: 'rename', from: 'dueDate', to: 'due_date' },
  { op: 'rename', from: 'issuedAt', to: 'issued_at' },
  { op: 'rename', from: 'paidAt', to: 'paid_at' },
  { op: 'rename', from: 'lineItems', to: 'line_items' },
  { op: 'rename', from: 'createdAt', to: 'created_at' },
  { op: 'rename', from: 'updatedAt', to: 'updated_at' },
];
