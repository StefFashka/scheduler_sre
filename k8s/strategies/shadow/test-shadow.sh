#!/usr/bin/env bash
set -euo pipefail

kubectl apply -f k8s/strategies/shadow/httproute-shadow.yaml
sleep 1

EG_NS="envoy-gateway-system"
LOCAL_PORT="8890"
SVC="$(kubectl get svc -n "$EG_NS" -l gateway.envoyproxy.io/owning-gateway-name=app-gateway -o jsonpath='{.items[0].metadata.name}')"

kubectl port-forward -n "$EG_NS" "svc/$SVC" "${LOCAL_PORT}:80" >/dev/null 2>&1 &
PF_PID=$!
trap 'kill "$PF_PID" 2>/dev/null || true' EXIT

sleep 1

echo "--- Sending 5 requests to Envoy Gateway ---"
for i in {1..5}; do
  curl -s "http://localhost:${  }/"
  echo ""
done

sleep 2
echo "--- Checking v2 logs to verify mirrored requests arrived ---"
kubectl logs deployment/my-app-v2 -n default --tail=10
