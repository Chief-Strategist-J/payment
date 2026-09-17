/**
 * payments.machine.ts — Pillar 4: State Machine as DATA
 * Payment lifecycle state transitions declared as a pure data structure.
 * The generic state machine actor in shared-infra evaluates transitions —
 * no switch/case logic here.
 *
 * States: draft → authorized → captured → refunded
 *                            → failed
 *                → cancelled
 */

export type PaymentStatus =
  | 'draft'
  | 'authorized'
  | 'captured'
  | 'refunded'
  | 'failed'
  | 'cancelled';

export type PaymentEvent =
  | 'AUTHORIZE'
  | 'CAPTURE'
  | 'REFUND'
  | 'FAIL'
  | 'CANCEL';

export interface PaymentTransition {
  from: PaymentStatus;
  event: PaymentEvent;
  to: PaymentStatus;
  guard?: (ctx: Record<string, unknown>) => boolean;
  sideEffects?: string[];   // event names to emit after transition
}

/**
 * PAYMENT_STATE_MACHINE — declarative state transition graph.
 * To add a new transition: add an entry here. Zero code change elsewhere.
 */
export const PAYMENT_STATE_MACHINE: PaymentTransition[] = [
  {
    from: 'draft',
    event: 'AUTHORIZE',
    to: 'authorized',
    sideEffects: ['payment.authorized'],
  },
  {
    from: 'draft',
    event: 'CANCEL',
    to: 'cancelled',
    sideEffects: ['payment.cancelled'],
  },
  {
    from: 'authorized',
    event: 'CAPTURE',
    to: 'captured',
    guard: (ctx) => ctx['gatewayReferenceProvided'] === true,
    sideEffects: ['payment.completed'],
  },
  {
    from: 'authorized',
    event: 'FAIL',
    to: 'failed',
    sideEffects: ['payment.failed'],
  },
  {
    from: 'authorized',
    event: 'CANCEL',
    to: 'cancelled',
    sideEffects: ['payment.cancelled'],
  },
  {
    from: 'captured',
    event: 'REFUND',
    to: 'refunded',
    sideEffects: ['payment.refunded', 'refund.initiated'],
  },
];

export function resolvePaymentTransition(
  currentStatus: PaymentStatus,
  event: PaymentEvent,
  ctx: Record<string, unknown> = {},
): PaymentTransition | null {
  const transition = PAYMENT_STATE_MACHINE.find(
    (t) => t.from === currentStatus && t.event === event,
  );
  if (!transition) return null;
  if (transition.guard && !transition.guard(ctx)) return null;
  return transition;
}
