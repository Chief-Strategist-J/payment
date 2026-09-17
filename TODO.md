# 📋 Payment & Billing Module Feature Roadmap & Enterprise Specification

*A comprehensive enterprise engineering roadmap, financial compliance specification, and architectural backlog for `@observability/payment` within the LLM Observability Platform.*

---

## 📊 1. Master Feature Implementation Matrix (Prioritized Sequencing)

> **Priority Tier Definitions**:
> - **P0 (Critical Live Production Blocker)**: Core financial primitives, double-spend prevention, outbox reliability, runaway spend circuit breakers, and webhook security.
> - **P1 (Immediate Milestone v1.1)**: Metered LLM token billing, 2-phase wallet hold/settle, automated dunning, provider bill reconciliation, and tax compliance.
> - **P2 (Scaled Enterprise v1.2)**: Multi-gateway failover, enterprise invoice terms (Net-30/60), currency FX, and dispute mitigation.
> - **P3 (Global & Platform v1.3+)**: FinOps cost allocation graphs, prepaid commit contracts, automated credit line underwriting, and SOC 1 Type II compliance.

| Domain | Capability | Standard / Spec | Current Status | Milestone | Priority |
|---|---|---|---|---|---|
| **Payment Intents** | Multi-Tenant Payment Intent Creation | RFC 7519 / UUIDv4 | ✅ **Completed** | Production v1.0 | Core |
| **Payment Lifecycle** | State Machine (Draft → Authorized → Captured → Refunded) | Finite State Machine | ✅ **Completed** | Production v1.0 | Core |
| **Idempotency** | Idempotency Key Guard & Storage (`x-idempotency-key`) | IETF Draft RFC | ✅ **Completed** | Production v1.0 | Core |
| **Anti-Corruption Layer** | Schema-Driven ACL JSON Transformation (`mapJson`) | Hexagonal Pattern | ✅ **Completed** | Production v1.0 | Core |
| **Event Streaming** | Kafka Lifecycle Events (`payment.completed`, `refund.initiated`) | CloudEvents / AsyncAPI | ✅ **Completed** | Production v1.0 | Core |
| **Observability** | OpenTelemetry Trace Spans & Correlation ID Propagation | W3C Trace Context | ✅ **Completed** | Production v1.0 | Core |
| **Data Integrity** | Transactional Outbox Pattern & Outbox Poller Relay | Microservices Outbox | ⏳ **Pending** | v1.0-hotfix | **P0** |
| **Concurrency Defense** | Distributed Locking & Pessimistic Row Lock (`SELECT FOR UPDATE`)| Redis Redlock / ACID | ⏳ **Pending** | v1.0-hotfix | **P0** |
| **Spend Protection** | Rogue LLM Agent Runaway Spend Hard Circuit Breaker | Safety Guardrail | ⏳ **Pending** | v1.0-hotfix | **P0** |
| **Gateway Integration** | Real Stripe / Adyen Payment Gateway Adapter (3DS2 SCA) | Gateway REST API | ⏳ **Pending** | v1.0-hotfix | **P0** |
| **Security & Defense** | Gateway Webhook Cryptographic Verification (HMAC-SHA256) | RFC 2104 | ⏳ **Pending** | v1.0-hotfix | **P0** |
| **Audit & Ledger** | Double-Entry Immutable Financial Transaction Ledger | GAAP / ASC 606 | ⏳ **Pending** | v1.0-hotfix | **P0** |
| **Metered Billing** | Real-Time LLM Token Metering Engine (Input/Output/Cached/Reasoning)| Metering Pipeline | ⏳ **Pending** | v1.1 | **P1** |
| **Wallet Engine** | 2-Phase Balance Hold & Settlement for LLM Streaming Generation | 2-Phase Commit | ⏳ **Pending** | v1.1 | **P1** |
| **Reconciliation** | Upstream Provider Invoice Reconciliation (OpenAI/Anthropic vs Ledger)| FinOps Audit | ⏳ **Pending** | v1.1 | **P1** |
| **Invoicing Engine** | Automated PDF Invoice Generation & Numbering Sequences | Directive 2006/112/EC | ⏳ **Pending** | v1.1 | **P1** |
| **Tax Compliance** | Automated Sales Tax / EU VAT Engine (TaxJar / Stripe Tax) | Tax Compliance | ⏳ **Pending** | v1.1 | **P1** |
| **Subscription Engine** | Recurring Billing Plans, Usage Overage & Tier Upgrades | Billing Cycles | ⏳ **Pending** | v1.1 | **P1** |
| **Dunning Management** | Smart Payment Retry Schedule & Grace Period Enforcement | Dunning Logic | ⏳ **Pending** | v1.1 | **P1** |
| **Multi-Gateway Routing**| Automatic Gateway Failover & Cost-Optimized Routing | Smart Routing | ⏳ **Pending** | v1.2 | **P2** |
| **Enterprise Invoicing** | Custom Purchase Orders, Net-30/Net-60 Terms & Wire Transfers | Enterprise Billing | ⏳ **Pending** | v1.2 | **P2** |
| **Currency & FX** | Multi-Currency Billing & Real-Time FX Conversion Rates | ISO 4217 | ⏳ **Pending** | v1.2 | **P2** |
| **Dispute Management** | Early Fraud Warning (EFW), Chargeback Webhooks & Evidence | Chargeback API | ⏳ **Pending** | v1.2 | **P2** |
| **Credit System** | Promotional Credits, Referral Bonuses & Expiration Policies | Ledger Accounts | ⏳ **Pending** | v1.2 | **P2** |
| **FinOps Cost Graphs** | Granular LLM Cost Attribution (Per-Model, Per-User, Per-Prompt)| FinOps Open Cost | ⏳ **Pending** | v1.3 | **P3** |
| **Prepaid Contracts** | Annual Prepayment Commits, Drawdown Schedules & Rollovers | Enterprise Contracts | ⏳ **Pending** | v1.3 | **P3** |
| **Compliance & Audit** | SOC 1 Type II & PCI-DSS SAQ-A Compliance Artifacts | AICPA / PCI SSC | ⏳ **Pending** | v1.3 | **P3** |

---

## 🚨 2. Live Operational Gaps & Immediate Critical Tasks (v1.0-hotfix)

### 2.1 Transactional Outbox Pattern (Dual-Write Protection)
- **Current Live Reality**: Currently, database transactions write payment state, and then Kafka events are emitted asynchronously in memory.
- **Critical Vulnerability**: The Classic Dual-Write Problem. If the application server crashes or restarts after the DB commit but before the Kafka producer emits `payment.completed`, downstream services (like `notification` for receipt delivery or `web-app` for wallet balance updates) will never receive the event, resulting in state divergence.
- **Remediation (P0)**:
  - Create `outbox_events` table in the payment database: `(id, aggregate_type, aggregate_id, event_type, payload, status, retry_count, created_at, processed_at)`.
  - Atomically insert the outbox record inside the exact same PostgreSQL ACID transaction as the payment update.
  - Run a lightweight background CDC (Change-Data-Capture) or Outbox relay worker with `SKIP LOCKED` to publish events to Kafka with guaranteed at-least-once delivery.

### 2.2 Concurrency & Double-Spend Defense (Distributed Locking)
- **Current Live Reality**: High-throughput LLM workloads involve concurrent requests hitting the same user wallet simultaneously.
- **Critical Vulnerability**: Without strict concurrency control, two parallel LLM generation streams could both read a $10 wallet balance, pass the validation check concurrently, and generate $10 of completions each, driving the wallet to -$10 (double-spending).
- **Remediation (P0)**:
  - Implement Redis-backed distributed locks (`redlock`) keyed on `wallet:lock:{tenantId}:{userId}` with a 500ms safety TTL for fast pre-flight hold checks.
  - Implement pessimistic database row locking (`SELECT * FROM wallets WHERE id = $1 FOR UPDATE`) inside the PostgreSQL transaction during final hold placement and settlement.

### 2.3 Rogue LLM Agent Runaway Spend Hard Circuit Breaker
- **Current Live Reality**: Autonomous LLM agents (LangChain, AutoGen, CrewAI) can easily enter infinite recursive tool-calling loops.
- **Financial Disaster Risk**: An unmonitored agent script can rack up $10,000+ in Anthropic/OpenAI API costs in under 15 minutes before the customer realizes their account has been emptied.
- **Remediation (P0)**:
  - Implement real-time spend velocity tracking in Redis (`spend:velocity:{tenantId}` sliding-window token bucket).
  - Configurable hard circuit breakers per organization:
    - Max hourly spend threshold (e.g. $100/hr)
    - Max per-request token ceiling (e.g. 128k tokens)
  - When velocity limit is tripped:
    1. Immediately freeze outgoing LLM generation calls with `HTTP 429 / 402 Spender Circuit Tripped`.
    2. Dispatch an immediate emergency notification via Kafka (`payment.spend_limit.tripped`).
    3. Require organization admin manual un-trip via dashboard.

### 2.4 Live Gateway Connector (Stripe / Adyen)
- **Current Reality**: The current v1.0 implementation contains the pure domain service, state machine, and database adapter with stubbed gateway capture parameters.
- **Risk**: Cannot charge live credit cards or process actual funds without the gateway adapter.
- **Remediation (P0)**:
  - Implement `StripePaymentGatewayAdapter` implementing `IPaymentGatewayPort`.
  - Wire Stripe Payment Intents API (`/v1/payment_intents`) with 3D-Secure (3DS2) Strong Customer Authentication (SCA) support.
  - Implement gateway response code normalization (translating card declines, insufficient funds, and network timeouts into canonical domain error codes).

### 2.5 Cryptographic Webhook Ingestion & Anti-Replay Guard
- **Current Reality**: Webhook endpoints are declared in contracts but incoming payload signature verification is not yet active.
- **Vulnerability**: Without signature verification, an attacker could forge `charge.succeeded` webhooks to illegitimately credit balances.
- **Remediation (P0)**:
  - Verify `Stripe-Signature` header using raw HTTP body and HMAC-SHA256 signature secret.
  - Enforce tolerance timestamp window (reject webhooks older than 300 seconds to prevent replay attacks).
  - Persist processed webhook event IDs in an `idempotency_store` table to ensure at-most-once processing.

### 2.6 Double-Entry Financial Ledger
- **Current Reality**: The database tracks point-in-time balances and payment records in a single row.
- **Financial Risk**: Single-entry balance updates are vulnerable to race conditions and lack GAAP-compliant financial audit trails.
- **Remediation (P0)**:
  - Implement an immutable `ledger_entries` table with strict double-entry accounting (`debit_account_id`, `credit_account_id`, `amount_cents`, `currency`, `transaction_id`).
  - Total debits must equal total credits on every transaction (`CHECK (SUM(debit) = SUM(credit))`).
  - Account balances become derived projections computed from ledger sums with snapshot caching.

---

## 🤖 3. Deep-Dive: LLM Observability Billing & Metering

### 3.1 Metered Token Consumption Engine
As an LLM observability platform, billing is heavily driven by streaming model usage:
- **Token Tier Weighting**:
  - Prompt tokens (Input)
  - Completion tokens (Output — typically 3x–4x input price)
  - Cached tokens (e.g. Anthropic prompt caching / OpenAI cached input at 10%–50% discount)
  - Reasoning tokens (e.g. OpenAI o1/o3, deep reasoning chains)
- **High-Throughput Aggregation**:
  - LLM traces stream millions of tokens per second. Storing a database payment record per span will crush PostgreSQL.
  - Usage events stream via Kafka (`prod.telemetry.tokens.consumed.v1`).
  - Redis sliding window / bucket aggregators roll up usage per tenant in 1-minute batches before committing to the billing ledger.

### 3.2 2-Phase Balance Hold & Settle for LLM Streaming
- **The Problem**: When a user makes an LLM completion request that streams for 30 seconds, their wallet balance might be drained by parallel requests mid-stream.
- **Phase 1 (Reserve / Hold)**:
  - Before proxying the prompt to the model provider (OpenAI, Anthropic, Bedrock), the payment engine places a provisional hold based on `max_tokens * model_output_rate`.
  - If `wallet_balance - active_holds < 0`, the LLM request is rejected immediately with `HTTP 402 Payment Required`.
- **Phase 2 (Settlement)**:
  - When the model stream finishes, the exact token count is reported.
  - The hold is released and the exact amount is debited from the wallet.
  - If the request aborts or errors, the hold is released in full.

### 3.3 Upstream Provider Invoice Reconciliation
- **The Problem**: Discrepancies between what the LLM provider (OpenAI, Anthropic, AWS Bedrock) bills the platform at the end of the month and what our telemetry reported.
- **Batch Reconciliation Worker**:
  - Daily ingestion of provider detailed usage reports (OpenAI Activity API / AWS CUR logs).
  - Automated diffing against our double-entry ledger at the tenant and model level.
  - Flags unmetered token leaks, dropped streaming connections, and over-charges.

---

## 🧾 4. Invoicing, Dunning & Tax Compliance

### 4.1 Automated Invoice Generation & Lifecycle
- **Sequence Guarantee**: Invoices must have legally compliant sequential numbers without gaps (e.g. `INV-2026-00001`).
- **PDF Generation Pipeline**:
  - Headless Chromium or Puppeteer worker converts HTML invoice template to PDF.
  - Uploads PDF to tenant-isolated S3/GCS bucket with signed download URLs.
  - Emits `prod.payment.invoice.issued.v1` Kafka event to notify user via notification package.

### 4.2 Automated Dunning & Churn Mitigation
- **Grace Period Engine**:
  - Day 0: Card charge fails → emit `payment.failed`, trigger retry after 24h, send notification email.
  - Day 3: Retry 2 → send urgent payment update notification.
  - Day 7: Retry 3 → send final warning notification.
  - Day 14: Suspend LLM API access, lock API keys, degrade organization to Read-Only tier.

### 4.3 Tax & Regulatory Standards
- **EU VAT & Reverse Charge**: Validate EU VIES VAT numbers via API; apply 0% reverse charge for B2B cross-border EU customers.
- **US State Sales Tax**: Automatic nexus detection and tax jurisdiction calculation via TaxJar/Stripe Tax.
- **Currency Compliance**: Support ISO 4217 zero-decimal currencies (JPY, KRW) and standard two-decimal currencies (USD, EUR, GBP).

---

## 🛡️ 5. Financial Security & PCI-DSS Scoping

- **Zero Cardholder Data Storage**: No PAN, CVV, or card expiration dates ever touch our application servers or PostgreSQL databases (SAQ-A compliance). All card entry uses Stripe Elements / Hosted Fields.
- **Customer DEK Encryption**: Tenant payment metadata and billing addresses encrypted using AES-256-GCM with tenant-isolated data encryption keys.
- **Database Row-Level Security**: PostgreSQL RLS policies enforce `tenant_id = current_setting('app.current_tenant_id')` on all billing tables.
