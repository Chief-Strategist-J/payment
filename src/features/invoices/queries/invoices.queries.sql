-- ============================================================
-- invoices.queries.sql
-- Feature: invoices
-- ALL database operations for the invoices feature.
-- ============================================================

-- FLOW: FLOW_CREATE_INVOICE
-- Params: $1=id, $2=tenant_id, $3=org_id, $4=user_id,
--         $5=billing_plan_id (nullable), $6=subtotal_cents, $7=tax_cents,
--         $8=total_cents, $9=currency, $10=due_date (nullable), $11=line_items (jsonb)
INSERT INTO invoices (
  id, tenant_id, org_id, user_id,
  billing_plan_id, subtotal_cents, tax_cents, total_cents,
  currency, status, due_date, line_items,
  issued_at, paid_at, created_at, updated_at
) VALUES (
  $1, $2, $3, $4,
  $5, $6, $7, $8,
  $9, 'draft', $10, $11,
  NULL, NULL, NOW(), NOW()
)
RETURNING *;

-- FLOW: FLOW_GET_INVOICE_BY_ID
-- Params: $1=id, $2=tenant_id
SELECT * FROM invoices
WHERE id = $1 AND tenant_id = $2
LIMIT 1;

-- FLOW: FLOW_LIST_INVOICES
-- Params: $1=tenant_id, $2=org_id (nullable), $3=status (nullable), $4=limit, $5=cursor
SELECT * FROM invoices
WHERE tenant_id = $1
  AND ($2 IS NULL OR org_id = $2)
  AND ($3 IS NULL OR status = $3::invoice_status)
  AND ($5 IS NULL OR id > $5)
ORDER BY created_at DESC, id DESC
LIMIT $4;

-- FLOW: FLOW_ISSUE_INVOICE
-- Purpose: Transition invoice from draft → issued, set issued_at timestamp
-- Params: $1=id, $2=tenant_id
UPDATE invoices
SET status = 'issued',
    issued_at = NOW(),
    updated_at = NOW()
WHERE id = $1 AND tenant_id = $2 AND status = 'draft'
RETURNING *;

-- FLOW: FLOW_MARK_INVOICE_PAID
-- Purpose: Transition invoice from issued → paid
-- Params: $1=id, $2=tenant_id
UPDATE invoices
SET status = 'paid',
    paid_at = NOW(),
    updated_at = NOW()
WHERE id = $1 AND tenant_id = $2 AND status = 'issued'
RETURNING *;

-- FLOW: FLOW_VOID_INVOICE
-- Purpose: Mark invoice as void (terminal state)
-- Params: $1=id, $2=tenant_id
UPDATE invoices
SET status = 'void',
    updated_at = NOW()
WHERE id = $1 AND tenant_id = $2 AND status IN ('draft', 'issued')
RETURNING *;

-- FLOW: FLOW_MARK_INVOICE_OVERDUE
-- Purpose: Batch job — mark all issued invoices past due_date as overdue
UPDATE invoices
SET status = 'overdue',
    updated_at = NOW()
WHERE status = 'issued'
  AND due_date IS NOT NULL
  AND due_date < NOW()
RETURNING id, tenant_id, org_id, user_id, total_cents, currency;
