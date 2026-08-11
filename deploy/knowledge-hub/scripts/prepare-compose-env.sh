#!/usr/bin/env bash
set -Eeuo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
out="${1:-$here/.env}"

if [ -e "$out" ]; then
  echo "Refusing to overwrite existing environment file: $out" >&2
  exit 2
fi

for cmd in head od tr; do command -v "$cmd" >/dev/null 2>&1 || { echo "$cmd is required" >&2; exit 2; }; done
umask 077
password="$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')"
cat > "$out" <<EOF
# Generated host-only Knowledge Hub environment. DO NOT COMMIT.
POSTGRES_IMAGE=postgres:16.14-alpine
POSTGRES_DB=bai_knowledge_hub
POSTGRES_USER=bai_hub
POSTGRES_PASSWORD=$password
POSTGRES_CONFIG_FILE=./postgres/postgresql.tuned-8gb.conf
POSTGRES_SHM_SIZE=1gb
HUB_DOMAIN=hub.example.invalid
BAI_KNOWLEDGE_HUB_RETENTION_DAYS=30
BAI_KNOWLEDGE_HUB_RATE_LIMIT_PER_MINUTE=120
BAI_KNOWLEDGE_HUB_BODY_LIMIT_BYTES=262144
BAI_KNOWLEDGE_HUB_DB_POOL_MAX=10
EOF
unset password
chmod 600 "$out"
printf 'Knowledge Hub environment created: %s\n' "$out"
printf 'PostgreSQL profile: 8 GiB startup-production baseline\n'
printf 'Public profile remains NOT AUTHORIZED.\n'
