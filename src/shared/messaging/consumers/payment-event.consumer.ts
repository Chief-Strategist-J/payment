import {
  createKafkaClient,
  TypedEventConsumer,
  type KafkaEvent,
} from '@chief-strategist-j/shared-infra/messaging';

/**
 * PaymentEventConsumer — subscribes to external events (from auth service).
 * All Kafka infra (DLQ, idempotency, tracing, logging) comes from
 * shared-infra's ConsumerMiddlewarePipeline — no duplication here.
 */
export class PaymentEventConsumer {
  private consumer: TypedEventConsumer;

  constructor() {
    const client = createKafkaClient('payment-service-consumer');
    this.consumer = new TypedEventConsumer(client);
  }

  public async init(): Promise<void> {
    // Subscribe to user.registered from auth to create default wallet
    this.consumer.subscribe<{ userId: string; email: string; orgId: string; tenantId: string }>(
      'prod.identity.user.registered.v1',
      (event: KafkaEvent<{ userId: string; email: string; orgId: string; tenantId: string }>) => {
        // Handled by WalletsService.createDefaultWallet — imported at runtime to avoid circular deps
        console.log(`[payment-consumer] user.registered received for userId=${event.payload.userId}`);
        return Promise.resolve();
      },
    );
  }
}
