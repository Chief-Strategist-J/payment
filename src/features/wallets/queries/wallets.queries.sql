-- ============================================================
-- wallets.queries.sql
-- Feature: wallets
-- ALL database operations for the wallets feature.
-- ============================================================

-- FLOW: FLOW_CREATE_WALLET
-- Purpose: Create a new wallet for a user/org
-- Params: $1=id, $2=tenant_id, $3=org_id, $4=user_id, $5=currency
INSERT INTO wallets (
  id, tenant_id, org_id, user_id,
  balance_cents, held_cents, currency, is_active,
  created_at, updated_at
) VALUES (
  $1, $2, $3, $4,
  0, 0, $5, TRUE,
  NOW(), NOW()
)
RETURNING *;

-- FLOW: FLOW_GET_WALLET_BY_ID
-- Params: $1=id, $2=tenant_id
SELECT * FROM wallets
WHERE id = $1 AND tenant_id = $2
LIMIT 1;

-- FLOW: FLOW_GET_WALLET_BY_USER
-- Purpose: Get wallet for a specific user within a tenant
-- Params: $1=user_id, $2=tenant_id
SELECT * FROM wallets
WHERE user_id = $1 AND tenant_id = $2 AND is_active = TRUE
LIMIT 1;

-- FLOW: FLOW_CREDIT_WALLET
-- Purpose: Atomically add funds to wallet balance
-- Params: $1=id, $2=tenant_id, $3=amount_cents
UPDATE wallets
SET balance_cents = balance_cents + $3,
    updated_at = NOW()
WHERE id = $1 AND tenant_id = $2 AND is_active = TRUE
RETURNING *;

-- FLOW: FLOW_DEBIT_WALLET
-- Purpose: Atomically subtract funds — only succeeds if balance >= amount
-- Params: $1=id, $2=tenant_id, $3=amount_cents
UPDATE wallets
SET balance_cents = balance_cents - $3,
    updated_at = NOW()
WHERE id = $1 AND tenant_id = $2 AND is_active = TRUE
  AND balance_cents >= $3
RETURNING *;

-- FLOW: FLOW_HOLD_WALLET_FUNDS
-- Purpose: Move funds from available to held (reservation)
-- Params: $1=id, $2=tenant_id, $3=amount_cents
UPDATE wallets
SET balance_cents = balance_cents - $3,
    held_cents = held_cents + $3,
    updated_at = NOW()
WHERE id = $1 AND tenant_id = $2 AND is_active = TRUE
  AND balance_cents >= $3
RETURNING *;

-- FLOW: FLOW_RELEASE_WALLET_HOLD
-- Purpose: Release held funds back to available balance
-- Params: $1=id, $2=tenant_id, $3=amount_cents
UPDATE wallets
SET balance_cents = balance_cents + $3,
    held_cents = held_cents - $3,
    updated_at = NOW()
WHERE id = $1 AND tenant_id = $2 AND is_active = TRUE
  AND held_cents >= $3
RETURNING *;
