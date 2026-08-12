#!/usr/bin/env bash
set -Eeuo pipefail

readonly STAGING_CA='https://acme-staging-v02.api.letsencrypt.org/directory'
readonly REQUIRED_ACK='STAGING_PUBLIC_TLS_REHEARSAL'

fail(){ printf 'PUBLIC_TLS_STAGING_REHEARSAL_FAIL: %s\n' "$*" >&2; exit 1; }
require(){ command -v "$1" >/dev/null 2>&1 || fail "$1 is required"; }

for cmd in curl docker node openssl sha256sum ss; do require "$cmd"; done
docker compose version >/dev/null 2>&1 || fail 'docker compose plugin is required'

[ "${BAI_PUBLIC_TLS_ACK:-}" = "$REQUIRED_ACK" ] || fail "set BAI_PUBLIC_TLS_ACK=$REQUIRED_ACK after Owner staging-gate approval"
[ "${BAI_KNOWLEDGE_HUB_ACME_CA_DIRECTORY:-}" = "$STAGING_CA" ] || fail 'only the exact Let\x27s Encrypt staging directory is allowed'

here="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
repo_root="$(cd "$here/../.." && pwd)"
env_file="${BAI_KNOWLEDGE_HUB_ENV_FILE:-}"
evidence_out="${BAI_KNOWLEDGE_HUB_PUBLIC_TLS_EVIDENCE_OUT:-}"

[ -n "$env_file" ] && [ -f "$env_file" ] || fail 'BAI_KNOWLEDGE_HUB_ENV_FILE must name the existing host-only environment file'
[ -n "$evidence_out" ] || fail 'BAI_KNOWLEDGE_HUB_PUBLIC_TLS_EVIDENCE_OUT is required'
[ -d "$(dirname "$evidence_out")" ] || fail 'Evidence output directory does not exist'
[ ! -e "$evidence_out" ] || fail 'Evidence output already exists; choose a new path'

hub_domain="$(sed -n 's/^HUB_DOMAIN=//p' "$env_file" | tail -1)"
acme_ca="$(sed -n 's/^BAI_KNOWLEDGE_HUB_ACME_CA_DIRECTORY=//p' "$env_file" | tail -1)"
[ -n "$hub_domain" ] || fail 'HUB_DOMAIN is missing from the environment file'
[ "$hub_domain" != 'hub.example.invalid' ] || fail 'placeholder HUB_DOMAIN is prohibited'
[[ "$hub_domain" =~ ^[A-Za-z0-9.:-]+$ ]] || fail 'HUB_DOMAIN contains invalid characters'
[ "$acme_ca" = "$STAGING_CA" ] || fail 'environment file must use the exact Let\x27s Encrypt staging directory'

compose=(docker compose --env-file "$env_file" -f "$here/compose.yaml")
config="$("${compose[@]}" --profile public config)"
printf '%s' "$config" | grep -q 'target: 80' || fail 'public TCP 80 mapping missing'
printf '%s' "$config" | grep -q 'target: 443' || fail 'public TCP 443 mapping missing'
printf '%s' "$config" | grep -q 'protocol: udp' && fail 'UDP publish is prohibited'

# Repository contract check: only Caddy may publish ports; API/PostgreSQL/Admin stay internal.
node "$repo_root/scripts/check-knowledge-hub-deployment-readiness.mjs" >/dev/null

if ss -H -ltn '( sport = :80 or sport = :443 )' | grep -q .; then
  fail 'TCP 80 or 443 is already occupied; do not stop an unknown service automatically'
fi
if ss -H -lun '( sport = :443 )' | grep -q .; then
  fail 'UDP 443 is already listening; HTTP/3/UDP adoption is not authorized'
fi

cert_file="$(mktemp "${TMPDIR:-/tmp}/bai-hub-staging-cert.XXXXXX.pem")"
headers_file="$(mktemp "${TMPDIR:-/tmp}/bai-hub-staging-headers.XXXXXX.txt")"
public_started=false
cleanup(){
  set +e
  rm -f "$cert_file" "$headers_file"
  if [ "$public_started" = true ]; then
    "${compose[@]}" --profile public stop caddy >/dev/null 2>&1
  fi
}
trap cleanup EXIT INT TERM

"${compose[@]}" --profile public up -d caddy
public_started=true

https_ready=false
for _ in $(seq 1 90); do
  if curl --fail --silent --show-error --insecure --max-time 5 "https://$hub_domain/readyz" | grep -q '"status":"ready"'; then
    https_ready=true
    break
  fi
  sleep 2
done
[ "$https_ready" = true ] || { "${compose[@]}" logs --no-color caddy >&2; fail 'staging HTTPS endpoint did not become ready'; }

redirect_code="$(curl --silent --output /dev/null --dump-header "$headers_file" --max-time 10 --write-out '%{http_code}' "http://$hub_domain/readyz")"
[ "$redirect_code" = 308 ] || [ "$redirect_code" = 301 ] || fail "HTTP redirect status invalid: $redirect_code"
grep -Eiq "^location: https://$hub_domain/readyz" "$headers_file" || fail 'HTTP redirect location is not the expected HTTPS endpoint'

openssl s_client -connect "${hub_domain}:443" -servername "$hub_domain" -showcerts </dev/null 2>/dev/null \
  | openssl x509 -outform PEM > "$cert_file"
[ -s "$cert_file" ] || fail 'peer certificate could not be captured'

san_text="$(openssl x509 -in "$cert_file" -noout -ext subjectAltName)"
if [[ "$hub_domain" =~ ^[0-9a-fA-F:.]+$ ]]; then
  printf '%s' "$san_text" | grep -Fq "IP Address:$hub_domain" || fail 'certificate IP SAN does not match HUB_DOMAIN'
else
  printf '%s' "$san_text" | grep -Fq "DNS:$hub_domain" || fail 'certificate DNS SAN does not match HUB_DOMAIN'
fi

issuer="$(openssl x509 -in "$cert_file" -noout -issuer)"
printf '%s' "$issuer" | grep -Eiq 'staging|fake le|\(staging\)' || fail 'certificate issuer is not recognizable as Let\x27s Encrypt staging'
cert_sha256="$(openssl x509 -in "$cert_file" -outform DER | sha256sum | awk '{print $1}')"
not_before="$(openssl x509 -in "$cert_file" -noout -startdate | cut -d= -f2- | xargs -I{} date -u -d '{}' +%Y-%m-%dT%H:%M:%SZ)"
not_after="$(openssl x509 -in "$cert_file" -noout -enddate | cut -d= -f2- | xargs -I{} date -u -d '{}' +%Y-%m-%dT%H:%M:%SZ)"

ss -H -ltn '( sport = :80 )' | grep -q . || fail 'TCP 80 listener missing during rehearsal'
ss -H -ltn '( sport = :443 )' | grep -q . || fail 'TCP 443 listener missing during rehearsal'
ss -H -lun '( sport = :443 )' | grep -q . && fail 'UDP 443 listener detected'
ss -H -ltn '( sport = :8787 or sport = :5432 or sport = :2019 )' \
  | grep -Ev '127\.0\.0\.1:8787|\[::1\]:8787' | grep -q . \
  && fail 'private API, PostgreSQL or Caddy admin has a non-loopback listener'

"${compose[@]}" --profile public stop caddy >/dev/null
public_started=false
sleep 1
ss -H -ltn '( sport = :80 or sport = :443 )' | grep -q . && fail 'public TCP listeners remain after Caddy stop'

completed_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
tmp_evidence="${evidence_out}.tmp.$$"
umask 077
cat > "$tmp_evidence" <<EOF
{
  "schema_version": "1.0",
  "result": "PUBLIC_TLS_STAGING_REHEARSAL_PASS",
  "target": {
    "host": "$hub_domain",
    "acme_ca_directory": "$STAGING_CA"
  },
  "certificate": {
    "sha256": "$cert_sha256",
    "san_verified": true,
    "issuer_staging_verified": true,
    "not_before": "$not_before",
    "not_after": "$not_after"
  },
  "routing": {
    "https_ready": true,
    "http_redirect_to_https": true
  },
  "exposure": {
    "tcp_80": true,
    "tcp_443": true,
    "udp_443": false,
    "api_8787_public": false,
    "postgres_5432_public": false,
    "caddy_admin_2019_public": false
  },
  "activation": {
    "explicit_acknowledgement": true,
    "production_acme_used": false,
    "public_profile_deactivated_after_rehearsal": true
  },
  "completed_at": "$completed_at"
}
EOF
node "$repo_root/scripts/validate-knowledge-hub-public-tls-staging-evidence.mjs" "$tmp_evidence" >/dev/null
mv "$tmp_evidence" "$evidence_out"
rm -f "$cert_file" "$headers_file"
trap - EXIT INT TERM

printf 'PUBLIC_TLS_STAGING_REHEARSAL_PASS host=%s public_profile_deactivated=true\n' "$hub_domain"
