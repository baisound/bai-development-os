#!/usr/bin/env bash
set -Eeuo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
out="$here/.env"
profile=""
retention_days="30"
rate_limit_per_minute="120"
body_limit_bytes="262144"
db_pool_max=""
hub_domain="hub.example.invalid"

usage() {
  cat <<'USAGE'
Usage:
  prepare-compose-env.sh --profile <2gb|4gb|8gb> [options]

Required:
  --profile <2gb|4gb|8gb>       PostgreSQL host-memory profile.

Options:
  --output <path>                Output env file (default: deploy/knowledge-hub/.env).
  --retention-days <1..3650>     Evidence retention days (default: 30).
  --rate-limit-per-minute <1..100000>
                                 API rate limit (default: 120).
  --body-limit-bytes <1..1048576>
                                 API request body limit (default: 262144).
  --db-pool-max <1..100>         Override profile DB pool default.
  --hub-domain <host-or-ip>      Private placeholder or explicitly selected public host.
                                 Default: hub.example.invalid.
  -h, --help                     Show this help.

Profile defaults:
  2gb -> postgresql.tuned-2gb.conf, 256mb shm, DB pool 5
  4gb -> postgresql.tuned-4gb.conf, 512mb shm, DB pool 10
  8gb -> postgresql.tuned-8gb.conf, 1gb shm, DB pool 10

POSTGRES_IMAGE, POSTGRES_DB and POSTGRES_USER remain canonical fixed values.
POSTGRES_PASSWORD and the dedicated runtime DB password are generated independently and are never printed.
Public activation is NOT authorized by this script.
USAGE
}

fail() {
  echo "ERROR: $*" >&2
  exit 2
}

require_value() {
  local option="$1"
  local value="${2:-}"
  [ -n "$value" ] || fail "$option requires a value"
}

validate_int() {
  local name="$1" value="$2" min="$3" max="$4"
  [[ "$value" =~ ^[0-9]+$ ]] || fail "$name must be an integer in range $min..$max"
  (( value >= min && value <= max )) || fail "$name must be in range $min..$max"
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --profile)
      require_value "$1" "${2:-}"; profile="$2"; shift 2 ;;
    --output)
      require_value "$1" "${2:-}"; out="$2"; shift 2 ;;
    --retention-days)
      require_value "$1" "${2:-}"; retention_days="$2"; shift 2 ;;
    --rate-limit-per-minute)
      require_value "$1" "${2:-}"; rate_limit_per_minute="$2"; shift 2 ;;
    --body-limit-bytes)
      require_value "$1" "${2:-}"; body_limit_bytes="$2"; shift 2 ;;
    --db-pool-max)
      require_value "$1" "${2:-}"; db_pool_max="$2"; shift 2 ;;
    --hub-domain)
      require_value "$1" "${2:-}"; hub_domain="$2"; shift 2 ;;
    -h|--help)
      usage; exit 0 ;;
    --)
      shift; [ "$#" -eq 0 ] || fail "unexpected positional argument: $1" ;;
    -*)
      fail "unknown option: $1" ;;
    *)
      fail "unexpected positional argument: $1 (use --output <path>)" ;;
  esac
done

[ -n "$profile" ] || { usage >&2; fail "--profile is required; allowed values: 2gb, 4gb, 8gb"; }

case "$profile" in
  2gb)
    postgres_config_file="./postgres/postgresql.tuned-2gb.conf"
    postgres_shm_size="256mb"
    profile_pool_default="5"
    ;;
  4gb)
    postgres_config_file="./postgres/postgresql.tuned-4gb.conf"
    postgres_shm_size="512mb"
    profile_pool_default="10"
    ;;
  8gb)
    postgres_config_file="./postgres/postgresql.tuned-8gb.conf"
    postgres_shm_size="1gb"
    profile_pool_default="10"
    ;;
  *)
    fail "unsupported --profile '$profile'; allowed values: 2gb, 4gb, 8gb"
    ;;
esac

[ -n "$db_pool_max" ] || db_pool_max="$profile_pool_default"
validate_int "--retention-days" "$retention_days" 1 3650
validate_int "--rate-limit-per-minute" "$rate_limit_per_minute" 1 100000
validate_int "--body-limit-bytes" "$body_limit_bytes" 1 1048576
validate_int "--db-pool-max" "$db_pool_max" 1 100
[[ "$hub_domain" =~ ^[A-Za-z0-9._:-]+$ ]] || fail "--hub-domain contains unsupported characters"

if [ -e "$out" ]; then
  fail "refusing to overwrite existing environment file: $out"
fi

for cmd in head od tr chmod; do
  command -v "$cmd" >/dev/null 2>&1 || fail "$cmd is required"
done

out_dir="$(dirname "$out")"
[ -d "$out_dir" ] || fail "output directory does not exist: $out_dir"

umask 077
password="$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')"
runtime_password="$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')"
cat > "$out" <<EOF_ENV
# Generated host-only Knowledge Hub environment. DO NOT COMMIT.
# Profile selection is explicit; regenerate this file to change host-memory profile.
POSTGRES_IMAGE=postgres:16.14-alpine
POSTGRES_DB=bai_knowledge_hub
POSTGRES_USER=bai_hub
POSTGRES_PASSWORD=$password
BAI_KNOWLEDGE_HUB_RUNTIME_DB_USER=bai_hub_runtime
BAI_KNOWLEDGE_HUB_RUNTIME_DB_PASSWORD=$runtime_password
POSTGRES_CONFIG_FILE=$postgres_config_file
POSTGRES_SHM_SIZE=$postgres_shm_size
HUB_DOMAIN=$hub_domain
BAI_KNOWLEDGE_HUB_ACME_CA_DIRECTORY=https://acme-staging-v02.api.letsencrypt.org/directory
BAI_KNOWLEDGE_HUB_RETENTION_DAYS=$retention_days
BAI_KNOWLEDGE_HUB_RATE_LIMIT_PER_MINUTE=$rate_limit_per_minute
BAI_KNOWLEDGE_HUB_BODY_LIMIT_BYTES=$body_limit_bytes
BAI_KNOWLEDGE_HUB_DB_POOL_MAX=$db_pool_max
EOF_ENV
unset password runtime_password
chmod 600 "$out"

printf 'Knowledge Hub environment created: %s\n' "$out"
printf 'Selected profile : %s\n' "$profile"
printf 'PostgreSQL config: %s\n' "$postgres_config_file"
printf 'Shared memory    : %s\n' "$postgres_shm_size"
printf 'DB pool max      : %s\n' "$db_pool_max"
printf 'Retention        : %s days\n' "$retention_days"
printf 'Rate limit       : %s/min\n' "$rate_limit_per_minute"
printf 'Body limit       : %s bytes\n' "$body_limit_bytes"
printf 'Hub domain       : %s\n' "$hub_domain"
printf "ACME directory   : Let's Encrypt STAGING (public profile remains blocked)\n"
printf 'Public profile   : NOT AUTHORIZED\n'
