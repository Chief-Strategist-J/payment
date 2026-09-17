/**
 * @file tracer.ts
 * @description Payment service OpenTelemetry initialiser.
 * Delegates entirely to shared-infra's initNodeTracing — no duplication.
 */
import { initNodeTracing } from '@chief-strategist-j/shared-infra/tracing';

export function initPaymentTracing(): void {
  initNodeTracing('payment-service', '1.0.0');
}
