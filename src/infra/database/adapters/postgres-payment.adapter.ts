import { Pool } from 'pg';
import { mapJson } from '@chief-strategist-j/shared-infra/data-driven';
import { PAYMENT_CONFIG } from '../../../config/env.config';
import type { IPaymentsRepositoryPort } from '../../../features/payments/repository/payments.repository';
import type {
  PaymentRecord,
  CreatePaymentIntentInput,
  CapturePaymentInput,
  ListPaymentsFilter,
} from '../../../features/payments/types/payments.types';
import { PAYMENT_QUERIES } from '../../../features/payments/queries/payments.queries';
import { paymentFromApiOps } from '../../../features/payments/schema/payments.schema';

/**
 * PostgresPaymentAdapter — implements IPaymentsRepositoryPort against PostgreSQL/AlloyDB.
 * Uses shared-infra mapJson() for ACL field mapping (fromApi ops).
 * All queries sourced from PAYMENT_QUERIES — no inline SQL.
 */
export class PostgresPaymentAdapter implements IPaymentsRepositoryPort {
  private readonly pool: Pool;

  constructor(connectionString?: string) {
    this.pool = new Pool({
      connectionString: connectionString ?? PAYMENT_CONFIG.db.url,
      host: PAYMENT_CONFIG.db.host,
      port: PAYMENT_CONFIG.db.port,
      user: PAYMENT_CONFIG.db.user,
      password: PAYMENT_CONFIG.db.password,
      database: PAYMENT_CONFIG.db.name,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    this.pool.on('error', (err: unknown) => {
      const e = err as { code?: string; message?: string };
      if (e?.code !== '57P01' && !e?.message?.includes('terminating connection')) {
        console.error('[PostgreSQL Payment Pool Error]', err);
      }
    });
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }

  private mapRow(row: Record<string, unknown>): PaymentRecord {
    return mapJson(row, paymentFromApiOps) as PaymentRecord;
  }

  async createPaymentIntent(
    input: CreatePaymentIntentInput & { id: string; tenantId: string; idempotencyKey: string },
  ): Promise<PaymentRecord> {
    const client = await this.pool.connect();
    try {
      const res = await client.query(PAYMENT_QUERIES.FLOW_CREATE_PAYMENT_INTENT.INSERT, [
        input.id,
        input.tenantId,
        input.orgId,
        input.userId,
        input.amountCents,
        input.currency ?? 'USD',
        input.idempotencyKey,
        JSON.stringify(input.metadata ?? {}),
      ]);
      return this.mapRow(res.rows[0] as Record<string, unknown>);
    } finally {
      client.release();
    }
  }

  async getPaymentById(id: string, tenantId: string): Promise<PaymentRecord | null> {
    const client = await this.pool.connect();
    try {
      const res = await client.query(PAYMENT_QUERIES.FLOW_GET_PAYMENT_BY_ID.SELECT, [id, tenantId]);
      if (!res.rows[0]) return null;
      return this.mapRow(res.rows[0] as Record<string, unknown>);
    } finally {
      client.release();
    }
  }

  async getPaymentByIdempotencyKey(idempotencyKey: string, tenantId: string): Promise<PaymentRecord | null> {
    const client = await this.pool.connect();
    try {
      const res = await client.query(PAYMENT_QUERIES.FLOW_GET_PAYMENT_BY_IDEMPOTENCY_KEY.SELECT, [idempotencyKey, tenantId]);
      if (!res.rows[0]) return null;
      return this.mapRow(res.rows[0] as Record<string, unknown>);
    } finally {
      client.release();
    }
  }

  async authorizePayment(id: string, tenantId: string): Promise<PaymentRecord | null> {
    const client = await this.pool.connect();
    try {
      const res = await client.query(PAYMENT_QUERIES.FLOW_AUTHORIZE_PAYMENT.UPDATE, [id, tenantId]);
      if (!res.rows[0]) return null;
      return this.mapRow(res.rows[0] as Record<string, unknown>);
    } finally {
      client.release();
    }
  }

  async capturePayment(id: string, tenantId: string, input: CapturePaymentInput): Promise<PaymentRecord | null> {
    const client = await this.pool.connect();
    try {
      const res = await client.query(PAYMENT_QUERIES.FLOW_CAPTURE_PAYMENT.UPDATE, [id, tenantId, input.gatewayReference]);
      if (!res.rows[0]) return null;
      return this.mapRow(res.rows[0] as Record<string, unknown>);
    } finally {
      client.release();
    }
  }

  async refundPayment(id: string, tenantId: string): Promise<PaymentRecord | null> {
    const client = await this.pool.connect();
    try {
      const res = await client.query(PAYMENT_QUERIES.FLOW_REFUND_PAYMENT.UPDATE, [id, tenantId]);
      if (!res.rows[0]) return null;
      return this.mapRow(res.rows[0] as Record<string, unknown>);
    } finally {
      client.release();
    }
  }

  async failPayment(id: string, tenantId: string): Promise<PaymentRecord | null> {
    const client = await this.pool.connect();
    try {
      const res = await client.query(PAYMENT_QUERIES.FLOW_FAIL_PAYMENT.UPDATE, [id, tenantId]);
      if (!res.rows[0]) return null;
      return this.mapRow(res.rows[0] as Record<string, unknown>);
    } finally {
      client.release();
    }
  }

  async listPayments(
    filter: ListPaymentsFilter & { tenantId: string },
  ): Promise<{ items: PaymentRecord[]; total: number }> {
    const client = await this.pool.connect();
    try {
      const [rows, count] = await Promise.all([
        client.query(PAYMENT_QUERIES.FLOW_LIST_PAYMENTS.SELECT, [
          filter.tenantId,
          filter.orgId ?? null,
          filter.userId ?? null,
          filter.status ?? null,
          filter.limit ?? 20,
          filter.cursor ?? null,
        ]),
        client.query(PAYMENT_QUERIES.FLOW_LIST_PAYMENTS.COUNT, [
          filter.tenantId,
          filter.orgId ?? null,
          filter.userId ?? null,
          filter.status ?? null,
        ]),
      ]);
      return {
        items: (rows.rows as Record<string, unknown>[]).map((r) => this.mapRow(r)),
        total: parseInt(String((count.rows[0] as Record<string, unknown>)['total'] ?? '0'), 10),
      };
    } finally {
      client.release();
    }
  }
}
