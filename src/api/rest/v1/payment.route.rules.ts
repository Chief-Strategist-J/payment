import type { PaymentsService } from '../../../features/payments/service/payments.service';

export interface PaymentRouteContext {
  paymentsService: PaymentsService;
  body?: unknown;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  params: Record<string, string>;
}

export interface PaymentRouteRule {
  name: string;
  method: string;
  pattern: string;
  requiresAuth?: boolean;
  successStatus?: number;
  successMessage: string;
  handler: (ctx: PaymentRouteContext) => Promise<unknown>;
}

export const PAYMENT_ROUTE_RULES: PaymentRouteRule[] = [
  // ─── System ──────────────────────────────────────────────────────────────────
  {
    name: 'root_check',
    method: 'GET',
    pattern: '/',
    successMessage: 'Payment Service API v1 is live',
    handler: async () => ({ service: 'payment-service', version: '1.0.0', status: 'healthy' }),
  },
  {
    name: 'health_check',
    method: 'GET',
    pattern: '/health',
    successMessage: 'Payment Service is healthy',
    handler: async () => ({ status: 'healthy', service: 'payment-service', timestamp: new Date().toISOString() }),
  },

  // ─── Payments ─────────────────────────────────────────────────────────────────
  {
    name: 'create_payment_intent',
    method: 'POST',
    pattern: '/api/v1/payments',
    requiresAuth: true,
    successStatus: 201,
    successMessage: 'Payment intent created successfully',
    handler: async (ctx: PaymentRouteContext) => {
      const body = ctx.body as Record<string, unknown>;
      const tenantId = ctx.headers?.['x-tenant-id'] ?? 'tenant-default';
      const idempotencyKey = ctx.headers?.['x-idempotency-key'] ?? `idem-${Date.now()}`;
      return ctx.paymentsService.createPaymentIntent(body as any, tenantId, idempotencyKey);
    },
  },
  {
    name: 'get_payment_by_id',
    method: 'GET',
    pattern: '/api/v1/payments/:id',
    requiresAuth: true,
    successMessage: 'Payment retrieved successfully',
    handler: async (ctx: PaymentRouteContext) => {
      const tenantId = ctx.headers?.['x-tenant-id'] ?? 'tenant-default';
      return ctx.paymentsService.getPayment(ctx.params['id']!, tenantId);
    },
  },
  {
    name: 'capture_payment',
    method: 'POST',
    pattern: '/api/v1/payments/:id/capture',
    requiresAuth: true,
    successMessage: 'Payment captured successfully',
    handler: async (ctx: PaymentRouteContext) => {
      const body = ctx.body as Record<string, unknown>;
      const tenantId = ctx.headers?.['x-tenant-id'] ?? 'tenant-default';
      return ctx.paymentsService.capturePayment(ctx.params['id']!, tenantId, body as any);
    },
  },
  {
    name: 'refund_payment',
    method: 'POST',
    pattern: '/api/v1/payments/:id/refund',
    requiresAuth: true,
    successMessage: 'Payment refund initiated successfully',
    handler: async (ctx: PaymentRouteContext) => {
      const body = ctx.body as Record<string, unknown>;
      const tenantId = ctx.headers?.['x-tenant-id'] ?? 'tenant-default';
      return ctx.paymentsService.refundPayment(ctx.params['id']!, tenantId, body as any);
    },
  },
  {
    name: 'list_payments',
    method: 'GET',
    pattern: '/api/v1/payments',
    requiresAuth: true,
    successMessage: 'Payments listed successfully',
    handler: async (ctx: PaymentRouteContext) => {
      const tenantId = ctx.headers?.['x-tenant-id'] ?? 'tenant-default';
      const q = ctx.queryParams ?? {};
      return ctx.paymentsService.listPayments(
        {
          orgId: q['orgId'],
          userId: q['userId'],
          status: q['status'] as any,
          limit: q['limit'] ? parseInt(q['limit'], 10) : 20,
          cursor: q['cursor'],
        },
        tenantId,
      );
    },
  },
];
