#!/usr/bin/env bash
set -Eeuo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
env_file="${BAI_KNOWLEDGE_HUB_ENV_FILE:-$here/.env}"
[ -f "$env_file" ] || { echo "Knowledge Hub environment file does not exist: $env_file" >&2; exit 2; }
for cmd in docker grep; do command -v "$cmd" >/dev/null 2>&1 || { echo "$cmd is required" >&2; exit 2; }; done
docker compose version >/dev/null 2>&1 || { echo "docker compose plugin is required" >&2; exit 2; }
grep -qx 'BAI_KNOWLEDGE_HUB_RUNTIME_DB_USER=bai_hub_runtime' "$env_file" || { echo "canonical runtime DB user missing from environment" >&2; exit 2; }
compose=(docker compose --env-file "$env_file" -f "$here/compose.yaml" -f "$here/compose.private.yaml")

api_user="$("${compose[@]}" exec -T knowledge-api sh -lc 'printf %s "$PGUSER"')"
[ "$api_user" = 'bai_hub_runtime' ] || { echo "Knowledge API is not using bai_hub_runtime" >&2; exit 1; }

role="$("${compose[@]}" exec -T postgres sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "SELECT rolsuper,rolcreatedb,rolcreaterole,rolinherit,rolreplication,rolbypassrls,rolcanlogin FROM pg_roles WHERE rolname='"'"'bai_hub_runtime'"'"';"')"
[ "$role" = 'f|f|f|f|f|f|t' ] || { echo "Runtime DB role attributes violate least-privilege contract: $role" >&2; exit 1; }

membership="$("${compose[@]}" exec -T postgres sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "SELECT count(*) FROM pg_auth_members WHERE member=(SELECT oid FROM pg_roles WHERE rolname='"'"'bai_hub_runtime'"'"');"')"
[ "$membership" = '0' ] || { echo "Runtime DB role has unexpected role memberships: $membership" >&2; exit 1; }

privileges="$("${compose[@]}" exec -T postgres sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "SELECT
has_schema_privilege('"'"'bai_hub_runtime'"'"','"'"'public'"'"','"'"'USAGE'"'"'),
NOT has_schema_privilege('"'"'bai_hub_runtime'"'"','"'"'public'"'"','"'"'CREATE'"'"'),
has_table_privilege('"'"'bai_hub_runtime'"'"','"'"'public.evidence_events'"'"','"'"'SELECT'"'"'),
has_table_privilege('"'"'bai_hub_runtime'"'"','"'"'public.evidence_events'"'"','"'"'INSERT'"'"'),
has_table_privilege('"'"'bai_hub_runtime'"'"','"'"'public.evidence_events'"'"','"'"'DELETE'"'"'),
NOT has_table_privilege('"'"'bai_hub_runtime'"'"','"'"'public.evidence_events'"'"','"'"'UPDATE'"'"'),
has_table_privilege('"'"'bai_hub_runtime'"'"','"'"'public.delivery_receipts'"'"','"'"'INSERT'"'"'),
NOT has_table_privilege('"'"'bai_hub_runtime'"'"','"'"'public.delivery_receipts'"'"','"'"'SELECT'"'"'),
has_table_privilege('"'"'bai_hub_runtime'"'"','"'"'public.client_policies'"'"','"'"'SELECT'"'"'),
NOT has_table_privilege('"'"'bai_hub_runtime'"'"','"'"'public.client_policies'"'"','"'"'INSERT'"'"'),
NOT has_table_privilege('"'"'bai_hub_runtime'"'"','"'"'public.client_policies'"'"','"'"'UPDATE'"'"'),
NOT has_table_privilege('"'"'bai_hub_runtime'"'"','"'"'public.client_policies'"'"','"'"'DELETE'"'"'),
has_table_privilege('"'"'bai_hub_runtime'"'"','"'"'public.api_credentials'"'"','"'"'SELECT'"'"'),
NOT has_table_privilege('"'"'bai_hub_runtime'"'"','"'"'public.api_credentials'"'"','"'"'INSERT'"'"'),
NOT has_table_privilege('"'"'bai_hub_runtime'"'"','"'"'public.schema_migrations'"'"','"'"'SELECT'"'"');"')"
[ "$privileges" = 't|t|t|t|t|t|t|t|t|t|t|t|t|t|t' ] || { echo "Runtime DB object privileges violate least-privilege contract: $privileges" >&2; exit 1; }

printf 'RUNTIME_DB_ROLE_SECURITY_PASS user=%s\n' "$api_user"
