#!/usr/bin/env bash
set -Eeuo pipefail

fail(){ echo "$*" >&2; exit 2; }
env_file="${1:-${BAI_KNOWLEDGE_HUB_ENV_FILE:-}}"
[ -n "$env_file" ] || fail "usage: ensure-runtime-db-credentials.sh <existing-env-file>"
[ -f "$env_file" ] || fail "environment file does not exist: $env_file"

for cmd in grep head od tr mktemp cp mv chmod dirname; do
  command -v "$cmd" >/dev/null 2>&1 || fail "$cmd is required"
done

user_line="$(grep -E '^BAI_KNOWLEDGE_HUB_RUNTIME_DB_USER=' "$env_file" || true)"
password_line="$(grep -E '^BAI_KNOWLEDGE_HUB_RUNTIME_DB_PASSWORD=' "$env_file" || true)"
if [ -n "$user_line" ] || [ -n "$password_line" ]; then
  [ "$user_line" = 'BAI_KNOWLEDGE_HUB_RUNTIME_DB_USER=bai_hub_runtime' ] || fail "existing runtime DB user is missing or non-canonical"
  [ -n "$password_line" ] || fail "existing runtime DB password is missing"
  runtime_password="${password_line#*=}"
  [ "${#runtime_password}" -ge 32 ] || fail "existing runtime DB password is too short"
  unset runtime_password
  printf 'Runtime DB credentials already present: %s\n' "$env_file"
  exit 0
fi

umask 077
dir="$(dirname "$env_file")"
tmp="$(mktemp "$dir/.knowledge-hub-runtime-env.XXXXXX")"
cleanup(){ rm -f "$tmp"; }
trap cleanup EXIT INT TERM
cp -p "$env_file" "$tmp"
runtime_password="$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')"
cat >> "$tmp" <<EOF_ENV
BAI_KNOWLEDGE_HUB_RUNTIME_DB_USER=bai_hub_runtime
BAI_KNOWLEDGE_HUB_RUNTIME_DB_PASSWORD=$runtime_password
EOF_ENV
unset runtime_password
chmod 600 "$tmp"
mv -f "$tmp" "$env_file"
trap - EXIT INT TERM
printf 'Runtime DB credentials added without changing existing PostgreSQL credentials: %s\n' "$env_file"
