/**
 * @file payment.errors.ts
 * @description Standardized domain error classes for the payment service.
 * Each error maps to a canonical HTTP status code and error code as per
 * api-request-response-structure.md §5 — no silent failures.
 */

export class PaymentDomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = 'PaymentDomainError';
  }
}

export class PaymentNotFoundError extends PaymentDomainError {
  constructor(paymentId: string) {
    super(`Payment not found: ${paymentId}`, 'PAYMENT_NOT_FOUND', 404);
    this.name = 'PaymentNotFoundError';
  }
}

export class WalletNotFoundError extends PaymentDomainError {
  constructor(walletId: string) {
    super(`Wallet not found: ${walletId}`, 'WALLET_NOT_FOUND', 404);
    this.name = 'WalletNotFoundError';
  }
}

export class InsufficientFundsError extends PaymentDomainError {
  constructor(walletId: string) {
    super(`Insufficient funds in wallet: ${walletId}`, 'INSUFFICIENT_FUNDS', 422);
    this.name = 'InsufficientFundsError';
  }
}

export class InvoiceNotFoundError extends PaymentDomainError {
  constructor(invoiceId: string) {
    super(`Invoice not found: ${invoiceId}`, 'INVOICE_NOT_FOUND', 404);
    this.name = 'InvoiceNotFoundError';
  }
}

export class PaymentAlreadyCapturedError extends PaymentDomainError {
  constructor(paymentId: string) {
    super(`Payment already captured: ${paymentId}`, 'PAYMENT_ALREADY_CAPTURED', 409);
    this.name = 'PaymentAlreadyCapturedError';
  }
}

export class WebhookSignatureError extends PaymentDomainError {
  constructor() {
    super('Webhook signature verification failed', 'WEBHOOK_SIGNATURE_INVALID', 401);
    this.name = 'WebhookSignatureError';
  }
}

export class BillingPlanNotFoundError extends PaymentDomainError {
  constructor(planId: string) {
    super(`Billing plan not found: ${planId}`, 'BILLING_PLAN_NOT_FOUND', 404);
    this.name = 'BillingPlanNotFoundError';
  }
}

export class IdempotencyKeyReuseError extends PaymentDomainError {
  constructor() {
    super('Idempotency key reused with different request payload', 'IDEMPOTENCY_KEY_REUSE', 409);
    this.name = 'IdempotencyKeyReuseError';
  }
}

export class PaymentValidationError extends PaymentDomainError {
  constructor(reason: string) {
    super(`Payment validation failed: ${reason}`, 'PAYMENT_VALIDATION_FAILED', 422);
    this.name = 'PaymentValidationError';
  }
}

