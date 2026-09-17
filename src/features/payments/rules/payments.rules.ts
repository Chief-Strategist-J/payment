import type { Rule } from '@chief-strategist-j/shared-infra/rules-engine';

/**
 * payments.rules.ts
 * Business rules for the payments feature, declared as DATA.
 * The generic resolveRules() engine from shared-infra evaluates these.
 */
export const PAYMENT_RULES: Rule[] = [
  // ─── Fraud & Limit Rules ─────────────────────────────────────────────────────
  {
    id: 'payment.rule.max_transaction_amount',
    name: 'Reject transactions exceeding tenant single-transaction limit',
    category: 'fraud',
    priority: 100,
    effect: 'deny',
    conditions: [
      {
        field: 'amountCents',
        op: 'greater_than',
        value: 10000000, // $100,000 max single transaction
      },
    ],
  },
  {
    id: 'payment.rule.zero_or_negative_amount',
    name: 'Reject payments with non-positive amount',
    category: 'validation',
    priority: 95,
    effect: 'deny',
    conditions: [
      {
        field: 'amountCents',
        op: 'lte',
        value: 0,
      },
    ],
  },
  {
    id: 'payment.rule.require_idempotency_key',
    name: 'Require idempotency key for all payment intents',
    category: 'resilience',
    priority: 80,
    effect: 'deny',
    conditions: [
      {
        field: 'idempotencyKey',
        op: 'is_null',
      },
    ],
  },

  // ─── Allow Rules (evaluated after all deny-override checks pass) ──────────────
  {
    id: 'payment.rule.allow_standard_payment',
    name: 'Allow standard payment',
    category: 'access',
    priority: 10,
    effect: 'allow',
    conditions: [],
  },
];
