#!/usr/bin/env bash
set -Eeuo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
env_file="${BAI_KNOWLEDGE_HUB_ENV_FILE:-$here/.env}"
if [ ! -f "$env_file" ]; then
  "$here/scripts/prepare-compose-env.sh" "$env_file"
fi
for cmd in docker curl; do command -v "$cmd" >/dev/null 2>&1 || { echo "$cmd is required" >&2; exit 2; }; done
docker compose version >/dev/null 2>&1 || { echo "docker compose plugin is required" >&2; exit 2; }
compose=(docker compose --env-file "$env_file" -f "$here/compose.yaml" -f "$here/compose.rehearsal.yaml")
"${compose[@]}" up -d --build postgres knowledge-api
ready=0
for _ in $(seq 1 60); do
  if curl -fsS --max-time 2 http://127.0.0.1:8787/readyz >/dev/null 2>&1; then ready=1; break; fi
  sleep 2
done
if [ "$ready" -ne 1 ]; then
  "${compose[@]}" logs --no-color knowledge-api postgres >&2 || true
  echo "Knowledge Hub did not become ready" >&2
  exit 1
fi
BAI_KNOWLEDGE_HUB_ENV_FILE="$env_file" "$here/scripts/verify-postgres-tuning.sh"
printf 'KNOWLEDGE_HUB_LOCAL_COMPOSE_READY url=http://127.0.0.1:8787 env=%s\n' "$env_file"
