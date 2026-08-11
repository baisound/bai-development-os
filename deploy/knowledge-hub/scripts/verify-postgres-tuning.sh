#!/usr/bin/env bash
set -Eeuo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
env_file="${BAI_KNOWLEDGE_HUB_ENV_FILE:-$here/.env}"
[ -f "$env_file" ] || { echo "Environment file not found: $env_file" >&2; exit 2; }
for cmd in docker; do command -v "$cmd" >/dev/null 2>&1 || { echo "$cmd is required" >&2; exit 2; }; done
docker compose version >/dev/null 2>&1 || { echo "docker compose plugin is required" >&2; exit 2; }
set -a
# shellcheck disable=SC1090
. "$env_file"
set +a
compose=(docker compose --env-file "$env_file" -f "$here/compose.yaml")

"${compose[@]}" exec -T postgres psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /etc/postgresql/verify-tuning.sql

for expected in \
  "fsync|on" \
  "synchronous_commit|on" \
  "full_page_writes|on" \
  "password_encryption|scram-sha-256" \
  "data_checksums|on"; do
  name="${expected%%|*}"; value="${expected#*|}"
  actual="$("${compose[@]}" exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "SHOW $name;" | tr -d '\r')"
  [ "$actual" = "$value" ] || { echo "PostgreSQL safety setting mismatch: $name=$actual expected=$value" >&2; exit 1; }
done

printf 'POSTGRES_TUNING_VERIFY_PASS profile=%s image=%s\n' "${POSTGRES_CONFIG_FILE:-unknown}" "${POSTGRES_IMAGE:-unknown}"
