#!/usr/bin/env bash
set -euo pipefail
NS="default"

echo "Сбрасываю тестовые приложения и маршруты стратегий в namespace $NS..."
kubectl delete httproute my-app -n "$NS" --ignore-not-found
kubectl delete deployment my-app my-app-v1 my-app-v2 -n "$NS" --ignore-not-found
kubectl delete service my-app my-app-v1 my-app-v2 -n "$NS" --ignore-not-found
echo "Готово. Шлюз app-gateway и мониторинг на месте."
