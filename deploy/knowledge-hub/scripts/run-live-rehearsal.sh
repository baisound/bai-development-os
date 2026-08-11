#!/usr/bin/env bash
set -Eeuo pipefail

for cmd in docker sha256sum; do command -v "$cmd" >/dev/null 2>&1 || { echo "$cmd is required" >&2; exit 2; }; done
docker compose version >/dev/null 2>&1 || { echo "docker compose plugin is required" >&2; exit 2; }

here="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
project="bai-knowledge-hub-rehearsal"
env_file="$(mktemp "${TMPDIR:-/tmp}/bai-hub-rehearsal.XXXXXX.env")"
backup_file="$(mktemp "${TMPDIR:-/tmp}/bai-hub-rehearsal.XXXXXX.dump")"
evidence_out="${BAI_KNOWLEDGE_HUB_REHEARSAL_EVIDENCE_OUT:-}"
chmod 600 "$env_file" "$backup_file"
password="$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')"
runtime_password="$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')"
cat > "$env_file" <<EOF
POSTGRES_DB=bai_knowledge_hub
POSTGRES_USER=bai_hub
POSTGRES_PASSWORD=$password
BAI_KNOWLEDGE_HUB_RUNTIME_DB_USER=bai_hub_runtime
BAI_KNOWLEDGE_HUB_RUNTIME_DB_PASSWORD=$runtime_password
# CI/rehearsal uses an explicit bounded 2 GiB profile; production profile selection is separate.
POSTGRES_CONFIG_FILE=./postgres/postgresql.tuned-2gb.conf
POSTGRES_SHM_SIZE=256mb
HUB_DOMAIN=hub.example.invalid
BAI_KNOWLEDGE_HUB_RETENTION_DAYS=30
BAI_KNOWLEDGE_HUB_RATE_LIMIT_PER_MINUTE=120
BAI_KNOWLEDGE_HUB_BODY_LIMIT_BYTES=262144
BAI_KNOWLEDGE_HUB_DB_POOL_MAX=5
EOF
unset password runtime_password
compose=(docker compose --project-name "$project" --env-file "$env_file" -f "$here/compose.yaml" -f "$here/compose.rehearsal.yaml")
cleanup(){ set +e; "${compose[@]}" down -v --remove-orphans >/dev/null 2>&1; rm -f "$env_file" "$backup_file" "$backup_file.sha256"; }
trap cleanup EXIT INT TERM

wait_for_ready() {
  local attempts="$1"
  for _ in $(seq 1 "$attempts"); do
    if "${compose[@]}" exec -T knowledge-api node deploy/knowledge-hub/runtime/healthcheck.mjs >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  return 1
}

"${compose[@]}" up -d --build postgres knowledge-api
wait_for_ready 60 || { echo "Knowledge Hub did not become ready" >&2; "${compose[@]}" logs --no-color knowledge-api postgres >&2; exit 1; }

"${compose[@]}" run --rm --no-deps knowledge-admin node deploy/knowledge-hub/runtime/rehearsal-client.mjs

# Backup from the isolated rehearsal PostgreSQL container. Password is not placed on command line.
"${compose[@]}" exec -T postgres pg_dump -U bai_hub -d bai_knowledge_hub -Fc > "$backup_file"
sha256sum "$backup_file" > "$backup_file.sha256"
sha256sum -c "$backup_file.sha256" >/dev/null
backup_hash="$(sha256sum "$backup_file" | awk '{print $1}')"

restore_db="bai_knowledge_hub_restore_rehearsal"
"${compose[@]}" exec -T postgres createdb -U bai_hub "$restore_db"
cat "$backup_file" | "${compose[@]}" exec -T postgres pg_restore -U bai_hub -d "$restore_db" --no-owner --no-acl
restored_count="$("${compose[@]}" exec -T postgres psql -U bai_hub -d "$restore_db" -Atc 'SELECT count(*) FROM evidence_events;')"
[ "$restored_count" -ge 4 ] || { echo "restore Evidence verification failed: $restored_count" >&2; exit 1; }
"${compose[@]}" exec -T postgres dropdb -U bai_hub "$restore_db"

"${compose[@]}" restart knowledge-api >/dev/null
wait_for_ready 30 || { echo "Knowledge Hub failed readiness after restart" >&2; exit 1; }

# A successful result also proves that the isolated Compose resources can be torn down.
"${compose[@]}" down -v --remove-orphans >/dev/null
rm -f "$env_file" "$backup_file" "$backup_file.sha256"
trap - EXIT INT TERM

completed_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
if [ -n "$evidence_out" ]; then
  evidence_dir="$(dirname "$evidence_out")"
  [ -d "$evidence_dir" ] || { echo "Evidence output directory does not exist: $evidence_dir" >&2; exit 2; }
  tmp_evidence="${evidence_out}.tmp.$$"
  umask 077
  cat > "$tmp_evidence" <<EOF
{
  "schema_version": "1.0",
  "result": "LIVE_REHEARSAL_PASS",
  "persisted_and_restored_events": $restored_count,
  "backup_sha256": "$backup_hash",
  "public_profile_activated": false,
  "cleanup_complete": true,
  "completed_at": "$completed_at"
}
EOF
  mv "$tmp_evidence" "$evidence_out"
fi

printf 'LIVE_REHEARSAL_PASS persisted_and_restored_events=%s\n' "$restored_count"
