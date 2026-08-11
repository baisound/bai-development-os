#!/usr/bin/env bash
set -Eeuo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
env_file="${BAI_KNOWLEDGE_HUB_ENV_FILE:-$here/.env}"
[ -f "$env_file" ] || { echo "Environment file not found: $env_file" >&2; exit 2; }
command -v docker >/dev/null 2>&1 || { echo "docker is required" >&2; exit 2; }
docker compose version >/dev/null 2>&1 || { echo "docker compose plugin is required" >&2; exit 2; }
compose=(docker compose --env-file "$env_file" -f "$here/compose.yaml" -f "$here/compose.rehearsal.yaml")
if [ "${1:-}" = "--destroy-data" ]; then
  echo "Destroying local rehearsal containers AND PostgreSQL volume."
  "${compose[@]}" down -v --remove-orphans
else
  "${compose[@]}" down --remove-orphans
  echo "PostgreSQL named volume preserved. Use --destroy-data only when intentional."
fi
