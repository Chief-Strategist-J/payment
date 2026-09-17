import {
  createKafkaClient,
  TypedEventProducer,
  type CentralizedKafkaClient,
  type KafkaHeaders,
  type KafkaEvent,
} from '@chief-strategist-j/shared-infra/messaging';

export const PAYMENT_KAFKA_TOPICS = {
  PAYMENT_EVENTS: 'prod.payment.payment.completed.v1',
  REFUND_EVENTS: 'prod.payment.refund.initiated.v1',
  INVOICE_EVENTS: 'prod.payment.invoice.issued.v1',
  PAYMENT_FAILED: 'prod.payment.payment.failed.v1',
} as const;

/**
 * PaymentEventProducer — thin domain-specific wrapper over shared-infra TypedEventProducer.
 * Mirrors the exact pattern of AuthEventProducer in auth package.
 * All Kafka infra (tracing, retry, middleware pipeline) comes from shared-infra.
 */
export class PaymentEventProducer {
  private client: CentralizedKafkaClient;
  private producer: TypedEventProducer;

  constructor() {
    this.client = createKafkaClient('payment-service-producer');
    this.producer = new TypedEventProducer(this.client);
  }

  public async init(): Promise<void> {
    await this.client.connect();
  }

  public publishPaymentCompleted(
    payload: {
      paymentId: string;
      tenantId: string;
      orgId: string;
      userId: string;
      amountCents: number;
      currency: string;
    },
    headers?: KafkaHeaders,
  ): Promise<KafkaEvent<typeof payload>> {
    return this.producer.publish(
      PAYMENT_KAFKA_TOPICS.PAYMENT_EVENTS,
      'PAYMENT_COMPLETED',
      payload,
      headers,
    );
  }

  public publishPaymentFailed(
    payload: {
      paymentId: string;
      tenantId: string;
      orgId: string;
      userId: string;
      reason: string;
    },
    headers?: KafkaHeaders,
  ): Promise<KafkaEvent<typeof payload>> {
    return this.producer.publish(
      PAYMENT_KAFKA_TOPICS.PAYMENT_FAILED,
      'PAYMENT_FAILED',
      payload,
      headers,
    );
  }

  public publishRefundInitiated(
    payload: {
      paymentId: string;
      tenantId: string;
      orgId: string;
      userId: string;
      amountCents: number;
      currency: string;
    },
    headers?: KafkaHeaders,
  ): Promise<KafkaEvent<typeof payload>> {
    return this.producer.publish(
      PAYMENT_KAFKA_TOPICS.REFUND_EVENTS,
      'REFUND_INITIATED',
      payload,
      headers,
    );
  }

  public publishInvoiceIssued(
    payload: {
      invoiceId: string;
      tenantId: string;
      orgId: string;
      userId: string;
      totalCents: number;
      currency: string;
      dueDate: string | null;
    },
    headers?: KafkaHeaders,
  ): Promise<KafkaEvent<typeof payload>> {
    return this.producer.publish(
      PAYMENT_KAFKA_TOPICS.INVOICE_EVENTS,
      'INVOICE_ISSUED',
      payload,
      headers,
    );
  }
}
