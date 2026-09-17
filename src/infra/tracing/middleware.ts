/**
 * @file middleware.ts
 * @description Payment HTTP tracing middleware.
 * Wraps shared-infra's runWithHttpTracing with the payment service name.
 */
import { runWithHttpTracing as runWithCoreHttpTracing } from '@chief-strategist-j/shared-infra/tracing';
import type { IncomingMessage, ServerResponse } from 'http';
import { PAYMENT_CONSTANTS } from '../../shared/constants/payment.constants';

export async function runWithHttpTracing(
  req: IncomingMessage,
  res: ServerResponse,
  handler: (span: unknown) => Promise<void>
): Promise<void> {
  return runWithCoreHttpTracing(req, res, PAYMENT_CONSTANTS.SERVICE_NAME, handler);
}
