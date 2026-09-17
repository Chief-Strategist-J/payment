import * as http from 'http';
import { PAYMENT_CONFIG } from './config/env.config';
import { ServiceRegistryManager } from '@chief-strategist-j/shared-infra/discovery';
import { HTTP_CONSTANTS } from '@chief-strategist-j/shared-infra/http';
import { PaymentsService } from './features/payments/service/payments.service';
import { PaymentRestV1Router } from './api/rest/v1/payment.router';
import { PostgresPaymentAdapter } from './infra/database/adapters/postgres-payment.adapter';
import { PaymentEventProducer } from './shared/messaging/producers/payment-event.producer';
import { PaymentEventConsumer } from './shared/messaging/consumers/payment-event.consumer';
import { PAYMENT_CONSTANTS } from './shared/constants/payment.constants';
import { initPaymentTracing } from './infra/tracing/tracer';
import { runWithHttpTracing } from './infra/tracing/middleware';

// ─── Boot sequence ─────────────────────────────────────────────────────────────
// 1. Init tracing FIRST — so every subsequent operation is traced
initPaymentTracing();

const port = PAYMENT_CONFIG.server.port;
const dbUrl = PAYMENT_CONFIG.db.url;

// 2. DB adapter — isolated payment database
export const dbAdapter = new PostgresPaymentAdapter(dbUrl);

// 3. Kafka producer / consumer
export const paymentEventProducer = new PaymentEventProducer();
export const paymentEventConsumer = new PaymentEventConsumer();

paymentEventProducer.init().catch((err: unknown) => {
  console.warn('[kafka-producer] Payment service operating in fallback mode:', (err as Error)?.message ?? err);
});

paymentEventConsumer.init().catch((err: unknown) => {
  console.warn('[kafka-consumer] Payment service operating in fallback mode:', (err as Error)?.message ?? err);
});

// 4. Domain service — depends only on port interfaces, not concrete adapters
export const paymentsService = new PaymentsService(dbAdapter, paymentEventProducer);

// 5. Router — data-driven, all routes declared in PAYMENT_ROUTE_RULES
export const router = new PaymentRestV1Router(paymentsService);

// ─── HTTP server ───────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const method = req.method ?? 'GET';
  const url = req.url ?? PAYMENT_CONSTANTS.ENDPOINT_ROOT;

  if (method === PAYMENT_CONSTANTS.METHOD_OPTIONS) {
    res.writeHead(PAYMENT_CONSTANTS.STATUS_NO_CONTENT, PAYMENT_CONSTANTS.SECURITY_CONFIG.CORS_HEADERS);
    res.end();
    return;
  }

  let bodyData = '';
  req.on('data', (chunk) => { bodyData += chunk.toString(); });

  req.on('end', async () => {
    await runWithHttpTracing(req, res, async () => {
      let parsedBody: unknown = undefined;
      if (bodyData) {
        try { parsedBody = JSON.parse(bodyData); } catch { parsedBody = bodyData; }
      }

      const headersRecord: Record<string, string> = {};
      for (const [key, val] of Object.entries(req.headers)) {
        if (typeof val === 'string') headersRecord[key.toLowerCase()] = val;
      }

      const baseHost = req.headers.host ?? `${HTTP_CONSTANTS.HOST_LOCALHOST}:${port}`;
      const parsedUrl = new URL(url, `${PAYMENT_CONSTANTS.DEFAULT_PROTOCOL}://${baseHost}`);
      const pathname = parsedUrl.pathname;
      const queryParams: Record<string, string> = {};
      parsedUrl.searchParams.forEach((val, key) => { queryParams[key] = val; });

      const result = await router.route(method, pathname, parsedBody, headersRecord, queryParams);

      res.writeHead(result.statusCode, {
        ...PAYMENT_CONSTANTS.SECURITY_CONFIG.CORS_HEADERS,
        [PAYMENT_CONSTANTS.HEADER_CONTENT_TYPE]: PAYMENT_CONSTANTS.HEADERS.CONTENT_TYPE_JSON,
      });
      res.end(JSON.stringify(result.payload));
    });
  });
});

// ─── Service registry ──────────────────────────────────────────────────────────
const paymentRegistryManager = new ServiceRegistryManager({
  name: PAYMENT_CONSTANTS.SERVICE_NAME,
  host: PAYMENT_CONFIG.server.host,
  port,
  protocol: PAYMENT_CONSTANTS.DEFAULT_PROTOCOL,
});

server.listen(port, () => {
  console.log(`[${PAYMENT_CONSTANTS.SERVICE_NAME}] Payment HTTP Service running on ${PAYMENT_CONSTANTS.DEFAULT_PROTOCOL}://${HTTP_CONSTANTS.HOST_LOCALHOST}:${port}`);
  paymentRegistryManager.register().catch(() => {});
});
