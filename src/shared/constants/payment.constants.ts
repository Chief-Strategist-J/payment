import { PAYMENT_CONFIG } from '../../config/env.config';

/**
 * PAYMENT_CONSTANTS — all service-level string literals, endpoint paths,
 * status codes, header keys, and event names for the payment package.
 * Never hardcode these values anywhere else in the package.
 */
export const PAYMENT_CONSTANTS = {
  SERVICE_NAME: PAYMENT_CONFIG.otel.serviceName,
  SERVICE_VERSION: '1.0.0',
  DEFAULT_PORT: PAYMENT_CONFIG.server.port,
  DEFAULT_PROTOCOL: PAYMENT_CONFIG.server.protocol,

  ENDPOINT_ROOT: '/',
  STATUS_NO_CONTENT: 204,
  METHOD_OPTIONS: 'OPTIONS',
  HEADER_CONTENT_TYPE: 'Content-Type',

  HEADERS: {
    CONTENT_TYPE_JSON: 'application/json',
    AUTHORIZATION: 'authorization',
    AUTHORIZATION_CAMEL: 'Authorization',
    FORWARDED_FOR: 'x-forwarded-for',
    BEARER_PREFIX: 'Bearer ',
  },

  SECURITY_CONFIG: {
    CORS_HEADERS: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Expose-Headers': 'traceparent, tracestate, x-request-id, x-correlation-id, x-causation-id',
      'Access-Control-Max-Age': '86400',
    },
  },

  ENDPOINTS: {
    HEALTH: '/health',
    METRICS: '/metrics',
    // Payments
    PAYMENTS: '/api/v1/payments',
    PAYMENT_BY_ID: '/api/v1/payments/:id',
    PAYMENT_CAPTURE: '/api/v1/payments/:id/capture',
    PAYMENT_REFUND: '/api/v1/payments/:id/refund',
    // Wallets
    WALLETS: '/api/v1/wallets',
    WALLET_BY_ID: '/api/v1/wallets/:id',
    WALLET_CREDIT: '/api/v1/wallets/:id/credit',
    WALLET_DEBIT: '/api/v1/wallets/:id/debit',
    // Billing Plans
    BILLING_PLANS: '/api/v1/billing-plans',
    BILLING_PLAN_BY_ID: '/api/v1/billing-plans/:id',
    // Invoices
    INVOICES: '/api/v1/invoices',
    INVOICE_BY_ID: '/api/v1/invoices/:id',
    INVOICE_ISSUE: '/api/v1/invoices/:id/issue',
    INVOICE_VOID: '/api/v1/invoices/:id/void',
    // Webhooks
    WEBHOOKS_STRIPE: '/api/v1/webhooks/stripe',
    WEBHOOKS_GATEWAY: '/api/v1/webhooks/gateway',
  },

  // Payment status lifecycle
  PAYMENT_STATUS_DRAFT: 'draft',
  PAYMENT_STATUS_AUTHORIZED: 'authorized',
  PAYMENT_STATUS_CAPTURED: 'captured',
  PAYMENT_STATUS_REFUNDED: 'refunded',
  PAYMENT_STATUS_FAILED: 'failed',
  PAYMENT_STATUS_CANCELLED: 'cancelled',

  // Wallet operations
  WALLET_OP_CREDIT: 'credit',
  WALLET_OP_DEBIT: 'debit',
  WALLET_OP_HOLD: 'hold',
  WALLET_OP_RELEASE: 'release',

  // Invoice status lifecycle
  INVOICE_STATUS_DRAFT: 'draft',
  INVOICE_STATUS_ISSUED: 'issued',
  INVOICE_STATUS_PAID: 'paid',
  INVOICE_STATUS_VOID: 'void',
  INVOICE_STATUS_OVERDUE: 'overdue',

  // Audit event names
  AUDIT_EVENT_PAYMENT_CREATED: 'PAYMENT_CREATED',
  AUDIT_EVENT_PAYMENT_CAPTURED: 'PAYMENT_CAPTURED',
  AUDIT_EVENT_PAYMENT_REFUNDED: 'PAYMENT_REFUNDED',
  AUDIT_EVENT_INVOICE_ISSUED: 'INVOICE_ISSUED',
  AUDIT_EVENT_WALLET_CREDITED: 'WALLET_CREDITED',
  AUDIT_EVENT_WALLET_DEBITED: 'WALLET_DEBITED',
} as const;
