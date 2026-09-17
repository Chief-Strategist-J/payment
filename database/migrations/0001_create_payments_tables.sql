-- Migration: 0001_create_payments_tables.sql
-- Multi-tenant payments table with row-level security and indexing

CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  org_id VARCHAR(64),
  user_id VARCHAR(64),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  idempotency_key VARCHAR(128) NOT NULL,
  gateway_reference VARCHAR(128),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments (tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_user ON payments (tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_idempotency ON payments (tenant_id, idempotency_key);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments (status);
