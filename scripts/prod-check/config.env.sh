#!/usr/bin/env bash

export PAYMENT_URL="${PAYMENT_URL:-http://localhost:3002}"

export TOKEN="${TOKEN:-YOUR_JWT_SESSION_TOKEN_HERE}"
export X_TENANT_ID="${X_TENANT_ID:-tenant-acme-corp}"
export X_REQUEST_ID="${X_REQUEST_ID:-req-$(date +%s)-12345}"
export X_CORRELATION_ID="${X_CORRELATION_ID:-corr-$(date +%s)-67890}"
export X_IDEMPOTENCY_KEY="${X_IDEMPOTENCY_KEY:-idem-$(date +%s)-$RANDOM}"
export TRACEPARENT="${TRACEPARENT:-00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01}"
export TRACESTATE="${TRACESTATE:-rojo=1,congo=2}"
export USER_AGENT="${USER_AGENT:-Mozilla/5.0 (prod-check-curl-runner)}"

export AMOUNT_CENTS="${AMOUNT_CENTS:-2500}"
export CURRENCY="${CURRENCY:-USD}"
export ORG_ID="${ORG_ID:-org-acme-1}"
export USER_ID="${USER_ID:-user-john-doe}"
export GATEWAY_REF="${GATEWAY_REF:-ch_mock_stripe_$(date +%s)}"
export PAYMENT_ID="${PAYMENT_ID:-}"
