/**
 * payment-capture.workflow.ts — Pillar 5: Workflow as DATA
 * The payment capture saga declared as a step array.
 * The generic workflow runner in shared-infra executes these steps —
 * no orchestration logic here.
 *
 * Steps are executed in order. On failure, the workflow runner
 * executes compensating actions (defined in compensate) for rollback.
 */

export interface WorkflowStep {
  id: string;
  name: string;
  op: 'callEntity' | 'evaluateRules' | 'emitEvent' | 'updateState' | 'callExternal';
  input: Record<string, unknown>;
  compensate?: WorkflowStep;  // rollback action if this step fails
}

/**
 * PAYMENT_CAPTURE_WORKFLOW — step DAG for capturing an authorized payment.
 * Change a step's behavior by editing its input here — no service code needed.
 */
export const PAYMENT_CAPTURE_WORKFLOW: WorkflowStep[] = [
  {
    id: 'step.validate-payment-rules',
    name: 'Validate capture business rules',
    op: 'evaluateRules',
    input: { ruleset: 'PAYMENT_RULES', category: 'fraud' },
  },
  {
    id: 'step.hold-wallet-funds',
    name: 'Reserve funds in wallet before gateway call',
    op: 'callEntity',
    input: { entity: 'wallets', method: 'holdFunds' },
    compensate: {
      id: 'step.release-wallet-hold',
      name: 'Release held funds on failure',
      op: 'callEntity',
      input: { entity: 'wallets', method: 'releaseHold' },
    },
  },
  {
    id: 'step.charge-payment-gateway',
    name: 'Execute charge on payment gateway',
    op: 'callExternal',
    input: { service: 'paymentGateway', method: 'charge' },
    compensate: {
      id: 'step.release-wallet-hold-on-gateway-failure',
      name: 'Release wallet hold on gateway failure',
      op: 'callEntity',
      input: { entity: 'wallets', method: 'releaseHold' },
    },
  },
  {
    id: 'step.settle-wallet-debit',
    name: 'Settle the wallet debit after successful gateway charge',
    op: 'callEntity',
    input: { entity: 'wallets', method: 'settleHeldDebit' },
  },
  {
    id: 'step.transition-payment-state',
    name: 'Transition payment status to captured',
    op: 'updateState',
    input: { entity: 'payments', transition: 'CAPTURE' },
  },
  {
    id: 'step.emit-payment-completed-event',
    name: 'Publish payment.completed Kafka event',
    op: 'emitEvent',
    input: { topic: 'prod.payment.payment.completed.v1', eventName: 'PAYMENT_COMPLETED' },
  },
];

/**
 * PAYMENT_REFUND_WORKFLOW — step DAG for refunding a captured payment.
 */
export const PAYMENT_REFUND_WORKFLOW: WorkflowStep[] = [
  {
    id: 'step.validate-refund-rules',
    name: 'Validate refund eligibility rules',
    op: 'evaluateRules',
    input: { ruleset: 'PAYMENT_RULES', category: 'fraud' },
  },
  {
    id: 'step.initiate-gateway-refund',
    name: 'Initiate refund on payment gateway',
    op: 'callExternal',
    input: { service: 'paymentGateway', method: 'refund' },
  },
  {
    id: 'step.credit-wallet-refund',
    name: 'Credit refund amount back to wallet',
    op: 'callEntity',
    input: { entity: 'wallets', method: 'creditRefund' },
  },
  {
    id: 'step.transition-payment-refunded',
    name: 'Transition payment status to refunded',
    op: 'updateState',
    input: { entity: 'payments', transition: 'REFUND' },
  },
  {
    id: 'step.emit-refund-initiated-event',
    name: 'Publish refund.initiated Kafka event',
    op: 'emitEvent',
    input: { topic: 'prod.payment.refund.initiated.v1', eventName: 'REFUND_INITIATED' },
  },
];
