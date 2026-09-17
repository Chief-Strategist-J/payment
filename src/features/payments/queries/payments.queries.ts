/**
 * payments.queries.ts
 * Named, flow-grouped SQL query strings for the payments feature.
 * These are loaded from the .sql file at compile-time as string literals.
 * Passed directly to the parameterized query executor — no string interpolation.
 */
export const PAYMENT_QUERIES = {
  TENANT_RLS: {
    SET_LOCAL_TENANT_CONTEXT: `SELECT set_config('app.current_tenant_id', $1, true)`,
  },

  FLOW_CREATE_PAYMENT_INTENT: {
    INSERT: `
      INSERT INTO payments (
        id, tenant_id, org_id, user_id,
        amount_cents, currency, status,
        idempotency_key, gateway_reference, metadata,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'draft', $7, NULL, $8, NOW(), NOW())
      RETURNING *
    `,
  },

  FLOW_GET_PAYMENT_BY_ID: {
    SELECT: `SELECT * FROM payments WHERE id = $1 AND tenant_id = $2 LIMIT 1`,
  },

  FLOW_GET_PAYMENT_BY_IDEMPOTENCY_KEY: {
    SELECT: `SELECT * FROM payments WHERE idempotency_key = $1 AND tenant_id = $2 LIMIT 1`,
  },

  FLOW_AUTHORIZE_PAYMENT: {
    UPDATE: `
      UPDATE payments SET status = 'authorized', updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2 AND status = 'draft'
      RETURNING *
    `,
  },

  FLOW_CAPTURE_PAYMENT: {
    UPDATE: `
      UPDATE payments SET status = 'captured', gateway_reference = $3, updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2 AND status = 'authorized'
      RETURNING *
    `,
  },

  FLOW_REFUND_PAYMENT: {
    UPDATE: `
      UPDATE payments SET status = 'refunded', updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2 AND status = 'captured'
      RETURNING *
    `,
  },

  FLOW_FAIL_PAYMENT: {
    UPDATE: `
      UPDATE payments SET status = 'failed', updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `,
  },

  FLOW_LIST_PAYMENTS: {
    SELECT: `
      SELECT * FROM payments
      WHERE tenant_id = $1
        AND ($2::text IS NULL OR org_id = $2)
        AND ($3::text IS NULL OR user_id = $3)
        AND ($4::text IS NULL OR status = $4)
        AND ($6::text IS NULL OR id > $6)
      ORDER BY created_at DESC, id DESC
      LIMIT $5
    `,
    COUNT: `
      SELECT COUNT(*) as total FROM payments
      WHERE tenant_id = $1
        AND ($2::text IS NULL OR org_id = $2)
        AND ($3::text IS NULL OR user_id = $3)
        AND ($4::text IS NULL OR status = $4)
    `,
  },
} as const;
