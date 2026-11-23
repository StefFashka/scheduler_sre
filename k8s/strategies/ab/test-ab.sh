#!/usr/bin/env bash
set -euo pipefail

EG_NS="envoy-gateway-system"
LOCAL_PORT="8889"
SVC="$(kubectl get svc -n "$EG_NS" -l gateway.envoyproxy.io/owning-gateway-name=eg -o jsonpath='{.items[0].metadata.name}')"

kubectl port-forward -n "$EG_NS" "svc/$SVC" "${LOCAL_PORT}:80" >/dev/null 2>&1 &
PF_PID=$!
trap 'kill "$PF_PID" 2>/dev/null || true' EXIT

sleep 1

echo "--- 1. Standard Requests (No Header) -> Expected v1.0.0 ---"
for i in {1..3}; do
  curl -s "http://localhost:${LOCAL_PORT}/"
  echo ""
done

echo "--- 2. Beta Requests (-H 'x-user-group: beta') -> Expected v2.0.0 ---"
for i in {1..3}; do
  curl -s -H "x-user-group: beta" "http://localhost:${LOCAL_PORT}/"
  echo ""
done
