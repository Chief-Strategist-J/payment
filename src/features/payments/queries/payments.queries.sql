-- ============================================================
-- payments.queries.sql
-- Feature: payments
-- ALL database operations for the payments feature are declared
-- here as named, flow-grouped parameterized queries.
-- Raw SQL construction inside services or handlers is prohibited.
-- ============================================================

-- FLOW: FLOW_CREATE_PAYMENT_INTENT
-- Purpose: Insert a new payment record in 'draft' status
-- Params: $1=id, $2=tenant_id, $3=org_id, $4=user_id, $5=amount_cents,
--         $6=currency, $7=idempotency_key, $8=metadata (jsonb)
INSERT INTO payments (
  id, tenant_id, org_id, user_id,
  amount_cents, currency, status,
  idempotency_key, gateway_reference, metadata,
  created_at, updated_at
) VALUES (
  $1, $2, $3, $4,
  $5, $6, 'draft',
  $7, NULL, $8,
  NOW(), NOW()
)
RETURNING *;

-- FLOW: FLOW_GET_PAYMENT_BY_ID
-- Purpose: Fetch a single payment by id + tenant isolation
-- Params: $1=id, $2=tenant_id
SELECT * FROM payments
WHERE id = $1 AND tenant_id = $2
LIMIT 1;

-- FLOW: FLOW_GET_PAYMENT_BY_IDEMPOTENCY_KEY
-- Purpose: Idempotency dedup check before domain execution
-- Params: $1=idempotency_key, $2=tenant_id
SELECT * FROM payments
WHERE idempotency_key = $1 AND tenant_id = $2
LIMIT 1;

-- FLOW: FLOW_CAPTURE_PAYMENT
-- Purpose: Transition payment from authorized → captured, set gateway reference
-- Params: $1=id, $2=tenant_id, $3=gateway_reference
UPDATE payments
SET status = 'captured',
    gateway_reference = $3,
    updated_at = NOW()
WHERE id = $1 AND tenant_id = $2 AND status = 'authorized'
RETURNING *;

-- FLOW: FLOW_AUTHORIZE_PAYMENT
-- Purpose: Transition payment from draft → authorized
-- Params: $1=id, $2=tenant_id
UPDATE payments
SET status = 'authorized',
    updated_at = NOW()
WHERE id = $1 AND tenant_id = $2 AND status = 'draft'
RETURNING *;

-- FLOW: FLOW_REFUND_PAYMENT
-- Purpose: Transition payment from captured → refunded
-- Params: $1=id, $2=tenant_id
UPDATE payments
SET status = 'refunded',
    updated_at = NOW()
WHERE id = $1 AND tenant_id = $2 AND status = 'captured'
RETURNING *;

-- FLOW: FLOW_FAIL_PAYMENT
-- Purpose: Transition payment to failed status on gateway error
-- Params: $1=id, $2=tenant_id
UPDATE payments
SET status = 'failed',
    updated_at = NOW()
WHERE id = $1 AND tenant_id = $2
RETURNING *;

-- FLOW: FLOW_LIST_PAYMENTS
-- Purpose: Paginated list of payments with optional filters
-- Params: $1=tenant_id, $2=org_id (nullable), $3=user_id (nullable),
--         $4=status (nullable), $5=limit, $6=cursor (payment id, nullable)
SELECT * FROM payments
WHERE tenant_id = $1
  AND ($2 IS NULL OR org_id = $2)
  AND ($3 IS NULL OR user_id = $3)
  AND ($4 IS NULL OR status = $4::payment_status)
  AND ($6 IS NULL OR id > $6)
ORDER BY created_at DESC, id DESC
LIMIT $5;

-- FLOW: FLOW_COUNT_PAYMENTS
-- Purpose: Total count for pagination metadata
-- Params: $1=tenant_id, $2=org_id (nullable), $3=user_id (nullable), $4=status (nullable)
SELECT COUNT(*) as total FROM payments
WHERE tenant_id = $1
  AND ($2 IS NULL OR org_id = $2)
  AND ($3 IS NULL OR user_id = $3)
  AND ($4 IS NULL OR status = $4::payment_status);
