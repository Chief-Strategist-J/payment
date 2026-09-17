#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_PATH="${SCRIPT_DIR}/../config.env.sh"
if [ -f "${CONFIG_PATH}" ]; then
  source "${CONFIG_PATH}"
fi

echo "==> [payments] POST /api/v1/payments -> Create Payment Intent"
curl -s -X POST "${PAYMENT_URL}/api/v1/payments" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "x-request-id: ${X_REQUEST_ID}" \
  -H "x-correlation-id: ${X_CORRELATION_ID}" \
  -H "x-tenant-id: ${X_TENANT_ID}" \
  -H "x-idempotency-key: ${X_IDEMPOTENCY_KEY}" \
  -H "traceparent: ${TRACEPARENT}" \
  -H "tracestate: ${TRACESTATE}" \
  -H "User-Agent: ${USER_AGENT}" \
  -d "{
    \"amountCents\": ${AMOUNT_CENTS},
    \"currency\": \"${CURRENCY}\",
    \"orgId\": \"${ORG_ID}\",
    \"userId\": \"${USER_ID}\",
    \"metadata\": { \"source\": \"prod-check\" }
  }" | jq . || true
