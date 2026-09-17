#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_PATH="${SCRIPT_DIR}/../config.env.sh"
if [ -f "${CONFIG_PATH}" ]; then
  source "${CONFIG_PATH}"
fi

TARGET_ID="${1:-${PAYMENT_ID}}"
if [ -z "${TARGET_ID}" ]; then
  echo "Error: PAYMENT_ID is required as argument \$1 or env var"
  exit 1
fi

echo "==> [payments] GET /api/v1/payments/${TARGET_ID} -> Get Payment Details"
curl -s -X GET "${PAYMENT_URL}/api/v1/payments/${TARGET_ID}" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "x-request-id: ${X_REQUEST_ID}" \
  -H "x-correlation-id: ${X_CORRELATION_ID}" \
  -H "x-tenant-id: ${X_TENANT_ID}" \
  -H "traceparent: ${TRACEPARENT}" \
  -H "tracestate: ${TRACESTATE}" \
  -H "User-Agent: ${USER_AGENT}" | jq . || true
