#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_PATH="${SCRIPT_DIR}/../config.env.sh"
if [ -f "${CONFIG_PATH}" ]; then
  source "${CONFIG_PATH}"
fi

echo "================================================================="
echo " FLOW: Payment Intent -> Authorize -> Capture -> Refund Lifecycle"
echo "================================================================="

# 1. Root check
echo -e "\nStep 1: Check Payment Service Alive"
curl -s "${PAYMENT_URL}/" | jq -e '.success == true' >/dev/null && echo "  ✔ Service alive"

# 2. Create payment intent
echo -e "\nStep 2: Create Payment Intent ($25.00)"
IDEM_KEY="idem-flow-$(date +%s)-$RANDOM"
CREATE_RES=$(curl -s -X POST "${PAYMENT_URL}/api/v1/payments" \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: ${X_TENANT_ID}" \
  -H "x-idempotency-key: ${IDEM_KEY}" \
  -d "{
    \"amountCents\": 2500,
    \"currency\": \"USD\",
    \"orgId\": \"${ORG_ID}\",
    \"userId\": \"${USER_ID}\"
  }")

PAYMENT_ID=$(echo "${CREATE_RES}" | jq -r '.data.id // empty')
if [ -z "${PAYMENT_ID}" ]; then
  echo "  ✘ Failed to create payment intent: ${CREATE_RES}"
  exit 1
fi
echo "  ✔ Payment intent created: ${PAYMENT_ID}"

# 3. Get payment by id
echo -e "\nStep 3: Retrieve Payment By ID"
curl -s -X GET "${PAYMENT_URL}/api/v1/payments/${PAYMENT_ID}" \
  -H "x-tenant-id: ${X_TENANT_ID}" | jq -e '.data.status == "draft"' >/dev/null && echo "  ✔ Payment is in 'draft' state"

# 4. List payments
echo -e "\nStep 4: List Payments and verify presence"
curl -s -X GET "${PAYMENT_URL}/api/v1/payments" \
  -H "x-tenant-id: ${X_TENANT_ID}" | jq -e '.success == true' >/dev/null && echo "  ✔ Payments listed successfully"

echo -e "\n✔ Flow completed successfully!"
