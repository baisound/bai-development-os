#!/bin/sh
set -eu
PATH='/usr/sbin:/usr/bin:/sbin:/bin'
export PATH
for unsafe_name in BASH_ENV ENV NODE_OPTIONS NODE_PATH LD_PRELOAD LD_LIBRARY_PATH PGOPTIONS PGSERVICE PGSERVICEFILE; do
  eval "unsafe_present=\${$unsafe_name+x}"
  [ -z "$unsafe_present" ] || { printf 'KNOWLEDGE_HUB_BACKUP_FAIL: privileged environment contains %s\n' "$unsafe_name" >&2; exit 1; }
done
unset BASH_ENV ENV NODE_OPTIONS NODE_PATH LD_PRELOAD LD_LIBRARY_PATH PGOPTIONS PGSERVICE PGSERVICEFILE
: "${PGHOST:?PGHOST required}"
: "${PGPORT:=5432}"
: "${PGDATABASE:?PGDATABASE required}"
: "${PGUSER:?PGUSER required}"
: "${PGPASSFILE:?PGPASSFILE required}"
: "${BACKUP_DIR:?BACKUP_DIR required}"
: "${BAI_CODE_REVISION:?BAI_CODE_REVISION required}"
: "${BAI_NODE_BIN:?BAI_NODE_BIN required}"
: "${BAI_PG_DUMP_BIN:?BAI_PG_DUMP_BIN required}"
: "${BAI_PG_RESTORE_BIN:?BAI_PG_RESTORE_BIN required}"
: "${BAI_AGE_BIN:?BAI_AGE_BIN required}"
: "${BAI_BACKUP_PLAINTEXT_TMPFS_ROOT:?BAI_BACKUP_PLAINTEXT_TMPFS_ROOT required}"
: "${AGE_RECIPIENT:?AGE_RECIPIENT required}"
: "${BACKUP_SOURCE_AUTHORIZATION_FILE:?BACKUP_SOURCE_AUTHORIZATION_FILE required}"
: "${SOURCE_AUTHORIZATION_CONSUMPTION_DIR:?SOURCE_AUTHORIZATION_CONSUMPTION_DIR required}"
umask 077
ulimit -c 0
[ "$(ulimit -c)" = 0 ] || { printf '%s\n' 'KNOWLEDGE_HUB_BACKUP_FAIL: core dumps must be disabled' >&2; exit 1; }
[ "$(id -u)" = 0 ] || { printf '%s\n' 'KNOWLEDGE_HUB_BACKUP_FAIL: producer requires the privileged immutable executor' >&2; exit 1; }
actual_interpreter="$(readlink -f /proc/$$/exe)"
expected_interpreter="$(readlink -f "$(command -v sh)")"
[ "$actual_interpreter" = "$expected_interpreter" ] || { printf '%s\n' 'KNOWLEDGE_HUB_BACKUP_FAIL: active shell interpreter differs from the protected PATH interpreter' >&2; exit 1; }
awk 'NR > 1 { active=1 } END { exit active ? 1 : 0 }' /proc/swaps || { printf '%s\n' 'KNOWLEDGE_HUB_BACKUP_FAIL: swap must be disabled for plaintext production' >&2; exit 1; }
case "$PGHOST" in /*) ;; *) printf '%s\n' 'KNOWLEDGE_HUB_BACKUP_FAIL: PGHOST must be a local Unix socket directory' >&2; exit 1;; esac
command -v ip >/dev/null 2>&1 || { printf '%s\n' 'KNOWLEDGE_HUB_BACKUP_FAIL: ip is required for egress isolation proof' >&2; exit 1; }
authority_lock='/etc/bai-development-os/knowledge-hub/rehearsal-authority.lock'
[ -f "$authority_lock" ] && [ ! -L "$authority_lock" ] && [ "$(stat -c %u "$authority_lock")" = 0 ] && [ $((0$(stat -c %a "$authority_lock") & 022)) -eq 0 ] || { printf '%s\n' 'KNOWLEDGE_HUB_BACKUP_FAIL: canonical authority lock is not root-protected' >&2; exit 1; }
exec 9<"$authority_lock"
flock --shared 9 || { printf '%s\n' 'KNOWLEDGE_HUB_BACKUP_FAIL: canonical authority read lease unavailable' >&2; exit 1; }
[ -z "$(ip -o -4 route show table all | grep -Ev ' dev lo( |$)' || true)" ] && [ -z "$(ip -o -6 route show table all | grep -Ev ' dev lo( |$)' || true)" ] || { printf '%s\n' 'KNOWLEDGE_HUB_BACKUP_FAIL: source backup namespace has an external route' >&2; exit 1; }
repo_root="$(cd "$(dirname "$0")/../../.." && pwd)"
[ "$repo_root" = /opt/bai-development-os ] || { printf '%s\n' 'KNOWLEDGE_HUB_BACKUP_FAIL: producer must run from the root-owned immutable installation' >&2; exit 1; }
trusted_node_bin='/usr/bin/node'
[ "$BAI_NODE_BIN" = "$trusted_node_bin" ] && [ -f "$trusted_node_bin" ] && [ ! -L "$trusted_node_bin" ] && [ "$(readlink -f "$trusted_node_bin")" = "$trusted_node_bin" ] || {
  printf '%s\n' 'KNOWLEDGE_HUB_BACKUP_FAIL: BAI_NODE_BIN must equal the fixed protected /usr/bin/node verifier bootstrap' >&2
  exit 1
}
[ -d "$repo_root/deploy/knowledge-hub/runtime/node_modules/pg" ] || {
  printf '%s\n' 'KNOWLEDGE_HUB_BACKUP_FAIL: locked runtime dependencies are not materialized; run npm ci against deploy/knowledge-hub/runtime/package-lock.json in the authorized build environment' >&2
  exit 1
}
[ -f "$BAI_NODE_BIN" ] && [ ! -L "$BAI_NODE_BIN" ] && [ "$(readlink -f "$BAI_NODE_BIN")" = "$BAI_NODE_BIN" ] || {
  printf '%s\n' 'KNOWLEDGE_HUB_BACKUP_FAIL: BAI_NODE_BIN must be a canonical ordinary file' >&2
  exit 1
}
[ -f "$BAI_PG_DUMP_BIN" ] && [ ! -L "$BAI_PG_DUMP_BIN" ] && [ "$(readlink -f "$BAI_PG_DUMP_BIN")" = "$BAI_PG_DUMP_BIN" ] || {
  printf '%s\n' 'KNOWLEDGE_HUB_BACKUP_FAIL: BAI_PG_DUMP_BIN must be a canonical ordinary file' >&2
  exit 1
}
[ -f "$BAI_PG_RESTORE_BIN" ] && [ ! -L "$BAI_PG_RESTORE_BIN" ] && [ "$(readlink -f "$BAI_PG_RESTORE_BIN")" = "$BAI_PG_RESTORE_BIN" ] || {
  printf '%s\n' 'KNOWLEDGE_HUB_BACKUP_FAIL: BAI_PG_RESTORE_BIN must be a canonical ordinary file' >&2
  exit 1
}
[ -f "$BAI_AGE_BIN" ] && [ ! -L "$BAI_AGE_BIN" ] && [ "$(readlink -f "$BAI_AGE_BIN")" = "$BAI_AGE_BIN" ] || {
  printf '%s\n' 'KNOWLEDGE_HUB_BACKUP_FAIL: BAI_AGE_BIN must be a canonical ordinary file' >&2
  exit 1
}
[ -d "$BAI_BACKUP_PLAINTEXT_TMPFS_ROOT" ] && [ ! -L "$BAI_BACKUP_PLAINTEXT_TMPFS_ROOT" ] && [ "$(readlink -f "$BAI_BACKUP_PLAINTEXT_TMPFS_ROOT")" = "$BAI_BACKUP_PLAINTEXT_TMPFS_ROOT" ] && [ "$(stat -f -c %T "$BAI_BACKUP_PLAINTEXT_TMPFS_ROOT")" = tmpfs ] || {
  printf '%s\n' 'KNOWLEDGE_HUB_BACKUP_FAIL: source plaintext staging root must be canonical tmpfs' >&2
  exit 1
}
[ "$(git -C "$repo_root" rev-parse HEAD)" = "$BAI_CODE_REVISION" ] || {
  printf '%s\n' 'KNOWLEDGE_HUB_BACKUP_FAIL: BAI_CODE_REVISION differs from repository HEAD' >&2
  exit 1
}
for protected_dir in "$BACKUP_DIR" "$PGHOST" "$SOURCE_AUTHORIZATION_CONSUMPTION_DIR"; do
  [ -d "$protected_dir" ] && [ ! -L "$protected_dir" ] && [ "$(readlink -f "$protected_dir")" = "$protected_dir" ] || { printf 'KNOWLEDGE_HUB_BACKUP_FAIL: protected directory invalid: %s\n' "$protected_dir" >&2; exit 1; }
  current="$protected_dir"
  while [ "$current" != / ]; do
    owner="$(stat -c %u "$current")"; mode="$(stat -c %a "$current")"
    [ "$owner" = 0 ] || { printf 'KNOWLEDGE_HUB_BACKUP_FAIL: protected directory is not root-owned: %s\n' "$current" >&2; exit 1; }
    [ $((0$mode & 022)) -eq 0 ] || { printf 'KNOWLEDGE_HUB_BACKUP_FAIL: protected directory is writable outside root: %s\n' "$current" >&2; exit 1; }
    current="$(dirname "$current")"
  done
done
for protected_file in "$BACKUP_SOURCE_AUTHORIZATION_FILE" "$PGPASSFILE" "$trusted_node_bin"; do
  [ -f "$protected_file" ] && [ ! -L "$protected_file" ] && [ "$(readlink -f "$protected_file")" = "$protected_file" ] || { printf 'KNOWLEDGE_HUB_BACKUP_FAIL: source authority file invalid: %s\n' "$protected_file" >&2; exit 1; }
  current="$protected_file"
  while [ "$current" != / ]; do
    owner="$(stat -c %u "$current")"; mode="$(stat -c %a "$current")"
    [ "$owner" = 0 ] && [ $((0$mode & 022)) -eq 0 ] || { printf 'KNOWLEDGE_HUB_BACKUP_FAIL: source authority path is not root-protected: %s\n' "$current" >&2; exit 1; }
    current="$(dirname "$current")"
  done
done
for rel in deploy/knowledge-hub/scripts/backup-postgres.sh deploy/knowledge-hub/runtime/create-consistent-backup.mjs deploy/knowledge-hub/runtime/package.json deploy/knowledge-hub/runtime/package-lock.json scripts/check-knowledge-hub-runtime-lock-candidate.mjs scripts/knowledge-hub-phase0-schema-inventory.mjs scripts/validate-knowledge-hub-remaining-deployment-gates.mjs scripts/verify-knowledge-hub-rehearsal-target-authorization.mjs scripts/validate-knowledge-hub-pg-restore-list.mjs scripts/validate-knowledge-hub-schema-sql.mjs; do
  git -C "$repo_root" ls-files --error-unmatch "$rel" >/dev/null || { printf 'KNOWLEDGE_HUB_BACKUP_FAIL: untracked producer source: %s\n' "$rel" >&2; exit 1; }
  current="$repo_root/$rel"
  while [ "$current" != / ]; do
    [ "$(stat -c %u "$current")" = 0 ] || { printf 'KNOWLEDGE_HUB_BACKUP_FAIL: producer path is not root-owned: %s\n' "$rel" >&2; exit 1; }
    mode="$(stat -c %a "$current")"; [ $((0$mode & 022)) -eq 0 ] || { printf 'KNOWLEDGE_HUB_BACKUP_FAIL: producer path is writable outside root: %s\n' "$rel" >&2; exit 1; }
    current="$(dirname "$current")"
  done
  git -C "$repo_root" diff --quiet -- "$rel" || { printf 'KNOWLEDGE_HUB_BACKUP_FAIL: producer file drift: %s\n' "$rel" >&2; exit 1; }
  git -C "$repo_root" diff --cached --quiet -- "$rel" || { printf 'KNOWLEDGE_HUB_BACKUP_FAIL: staged producer file drift: %s\n' "$rel" >&2; exit 1; }
  [ "$(git -C "$repo_root" show "$BAI_CODE_REVISION:$rel" | sha256sum | awk '{print $1}')" = "$(sha256sum "$repo_root/$rel" | awk '{print $1}')" ] || { printf 'KNOWLEDGE_HUB_BACKUP_FAIL: producer source differs from BAI_CODE_REVISION: %s\n' "$rel" >&2; exit 1; }
done
source_commands='awk date dirname env flock git grep id ip readlink sha256sum sort stat timeout tr'
toolchain_rows=''
for cmd in $source_commands; do
  binary="$(readlink -f "$(command -v "$cmd")")"; [ -f "$binary" ] && [ ! -L "$binary" ] || { printf 'KNOWLEDGE_HUB_BACKUP_FAIL: toolchain binary invalid: %s\n' "$cmd" >&2; exit 1; }
  toolchain_rows="$toolchain_rows$cmd\t$binary\t$(sha256sum "$binary" | awk '{print $1}')\n"
done
for binary in "$actual_interpreter" "$trusted_node_bin" "$BAI_PG_DUMP_BIN" "$BAI_PG_RESTORE_BIN" "$BAI_AGE_BIN"; do toolchain_rows="$toolchain_rows$binary\t$binary\t$(sha256sum "$binary" | awk '{print $1}')\n"; done
runtime_attestation_json="$("$trusted_node_bin" "$repo_root/deploy/knowledge-hub/runtime/create-consistent-backup.mjs" attest)" || { printf '%s\n' 'KNOWLEDGE_HUB_BACKUP_FAIL: producer runtime graph attestation failed' >&2; exit 1; }
producer_source_graph_sha256="$("$trusted_node_bin" -e 'const x=JSON.parse(process.argv[1]);process.stdout.write(x.producer_source_sha256)' "$runtime_attestation_json")"
runtime_dependency_tree_sha256="$("$trusted_node_bin" -e 'const x=JSON.parse(process.argv[1]);process.stdout.write(x.runtime_dependency_tree_sha256)' "$runtime_attestation_json")"
toolchain_rows="$toolchain_rows""producer-runtime-graph\t$repo_root\t$producer_source_graph_sha256\nproducer-node-modules\t$repo_root/deploy/knowledge-hub/runtime/node_modules\t$runtime_dependency_tree_sha256\n"
toolchain_manifest_sha256="$(printf '%b' "$toolchain_rows" | LC_ALL=C sort | sha256sum | awk '{print $1}')"
verified_authority_json="$("$trusted_node_bin" "$repo_root/scripts/verify-knowledge-hub-rehearsal-target-authorization.mjs" canonical-source "$BACKUP_SOURCE_AUTHORIZATION_FILE")" || { printf '%s\n' 'KNOWLEDGE_HUB_BACKUP_FAIL: canonical source backup authority rejected' >&2; exit 1; }
authority_receipt_sha256="$("$trusted_node_bin" -e 'const x=JSON.parse(process.argv[1]);process.stdout.write(x.receipt_sha256)' "$verified_authority_json")"
source_authority_snapshot="$SOURCE_AUTHORIZATION_CONSUMPTION_DIR/$authority_receipt_sha256.source-authorization.json"
"$trusted_node_bin" -e 'const fs=require("fs"),path=require("path"),crypto=require("crypto");const [source,target,expected]=process.argv.slice(1);const s=fs.openSync(source,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);try{const before=fs.fstatSync(s),bytes=fs.readFileSync(s),after=fs.fstatSync(s);if(!before.isFile()||before.dev!==after.dev||before.ino!==after.ino||before.size!==after.size||before.mtimeMs!==after.mtimeMs||crypto.createHash("sha256").update(bytes).digest("hex")!==expected)throw Error("unstable receipt");const d=fs.openSync(target,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW,0o400);try{fs.writeFileSync(d,bytes);fs.fsyncSync(d)}finally{fs.closeSync(d)}const p=fs.openSync(path.dirname(target),"r");try{fs.fsyncSync(p)}finally{fs.closeSync(p)}}finally{fs.closeSync(s)}' "$BACKUP_SOURCE_AUTHORIZATION_FILE" "$source_authority_snapshot" "$authority_receipt_sha256" || { printf '%s\n' 'KNOWLEDGE_HUB_BACKUP_FAIL: source authority immutable snapshot failed' >&2; exit 1; }
BACKUP_SOURCE_AUTHORIZATION_FILE="$source_authority_snapshot"
verified_authority_json="$("$trusted_node_bin" "$repo_root/scripts/verify-knowledge-hub-rehearsal-target-authorization.mjs" canonical-source "$BACKUP_SOURCE_AUTHORIZATION_FILE")" || { printf '%s\n' 'KNOWLEDGE_HUB_BACKUP_FAIL: snapshotted source backup authority rejected' >&2; exit 1; }
authority_field(){ "$trusted_node_bin" -e 'const x=JSON.parse(process.argv[1]);const v=x.receipt[process.argv[2]];if(typeof v!=="string")process.exit(1);process.stdout.write(v)' "$verified_authority_json" "$1"; }
authorized_nonce_sha256="$(authority_field execution_nonce_sha256)"
authorized_cluster_sha256="$(authority_field source_cluster_identifier_sha256)"
authorized_socket_sha256="$(authority_field postgres_socket_identity_sha256)"
authorized_recipient_sha256="$(authority_field age_recipient_fingerprint_sha256)"
authorized_output_root_sha256="$(authority_field backup_output_root_sha256)"
authorized_plaintext_root_sha256="$(authority_field plaintext_tmpfs_root_sha256)"
authorized_toolchain_sha256="$(authority_field toolchain_manifest_sha256)"
authorized_netns_sha256="$(authority_field network_namespace_inode_sha256)"
authorized_boot_sha256="$(authority_field boot_id_sha256)"
authorized_network_policy_sha256="$(authority_field network_policy_sha256)"
authorized_ledger_sha256="$(authority_field consumption_ledger_directory_sha256)"
authorized_expires_at="$(authority_field expires_at)"
remaining_effect_seconds(){
  "$trusted_node_bin" -e 'const deadline=Date.parse(process.argv[1]),reserve=5000,remaining=Math.floor((deadline-Date.now()-reserve)/1000);if(!Number.isFinite(deadline)||remaining<1)process.exit(1);process.stdout.write(String(remaining))' "$authorized_expires_at"
}
source_effect_seconds="$(remaining_effect_seconds)" || { printf '%s\n' 'KNOWLEDGE_HUB_BACKUP_FAIL: source authority lacks the five-second finalization reserve' >&2; exit 1; }
[ "$(authority_field source_database)" = "$PGDATABASE" ] && [ "$(authority_field runner_code_revision)" = "$BAI_CODE_REVISION" ] || { printf '%s\n' 'KNOWLEDGE_HUB_BACKUP_FAIL: source authority database or revision mismatch' >&2; exit 1; }
recipient_sha256="$(printf '%s' "$AGE_RECIPIENT" | sha256sum | awk '{print $1}')"
output_root_sha256="$(stat -Lc '%d:%i:%u:%g:%a' "$BACKUP_DIR" | sha256sum | awk '{print $1}')"
plaintext_root_sha256="$(stat -Lc '%d:%i:%u:%g:%a' "$BAI_BACKUP_PLAINTEXT_TMPFS_ROOT" | sha256sum | awk '{print $1}')"
ledger_sha256="$(stat -Lc '%d:%i:%u:%g:%a' "$SOURCE_AUTHORIZATION_CONSUMPTION_DIR" | sha256sum | awk '{print $1}')"
socket_file="$PGHOST/.s.PGSQL.$PGPORT"
[ -S "$socket_file" ] && [ ! -L "$socket_file" ] || { printf '%s\n' 'KNOWLEDGE_HUB_BACKUP_FAIL: PostgreSQL source socket invalid' >&2; exit 1; }
socket_sha256="$({ stat -Lc 'dir:%d:%i:%u:%g:%a' "$PGHOST"; stat -Lc 'socket:%d:%i:%u:%g:%a' "$socket_file"; } | sha256sum | awk '{print $1}')"
netns_sha256="$(readlink /proc/self/ns/net | sha256sum | awk '{print $1}')"
boot_sha256="$(sha256sum /proc/sys/kernel/random/boot_id | awk '{print $1}')"
network_policy_sha256="$({ ip -details -json link show; ip -json -4 route show table all; ip -json -6 route show table all; ip -json rule show; } | sha256sum | awk '{print $1}')"
[ "$recipient_sha256" = "$authorized_recipient_sha256" ] && [ "$output_root_sha256" = "$authorized_output_root_sha256" ] && [ "$plaintext_root_sha256" = "$authorized_plaintext_root_sha256" ] && [ "$toolchain_manifest_sha256" = "$authorized_toolchain_sha256" ] && [ "$socket_sha256" = "$authorized_socket_sha256" ] && [ "$netns_sha256" = "$authorized_netns_sha256" ] && [ "$boot_sha256" = "$authorized_boot_sha256" ] && [ "$network_policy_sha256" = "$authorized_network_policy_sha256" ] && [ "$ledger_sha256" = "$authorized_ledger_sha256" ] || { printf '%s\n' 'KNOWLEDGE_HUB_BACKUP_FAIL: source authority fact binding mismatch' >&2; exit 1; }
consumption_file="$SOURCE_AUTHORIZATION_CONSUMPTION_DIR/$authorized_nonce_sha256.json"
consumed_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
"$trusted_node_bin" -e 'const fs=require("fs"),path=require("path");const [file,authority,nonce,consumed,deadline]=process.argv.slice(1);if(Date.parse(consumed)>=Date.parse(deadline))throw Error("authority expired before consumption");const value={schema_version:"1.0",result:"BACKUP_SOURCE_AUTHORIZATION_CONSUMED",authority_receipt_sha256:authority,execution_nonce_sha256:nonce,consumed_at:consumed,effect_deadline_at:deadline};const fd=fs.openSync(file,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW,0o600);try{fs.writeFileSync(fd,`${JSON.stringify(value)}\n`);fs.fsyncSync(fd)}finally{fs.closeSync(fd)}const dir=fs.openSync(path.dirname(file),"r");try{fs.fsyncSync(dir)}finally{fs.closeSync(dir)}' "$consumption_file" "$authority_receipt_sha256" "$authorized_nonce_sha256" "$consumed_at" "$authorized_expires_at" || { printf '%s\n' 'KNOWLEDGE_HUB_BACKUP_FAIL: source authorization nonce already consumed, expired or ledger write failed' >&2; exit 1; }
consumption_sha256="$(sha256sum "$consumption_file" | awk '{print $1}')"
source_effect_seconds="$(remaining_effect_seconds)" || { printf '%s\n' 'KNOWLEDGE_HUB_BACKUP_FAIL: source authority reserve elapsed after nonce consumption' >&2; exit 1; }
exec env -i \
  PATH="$PATH" HOME=/root LANG=C.UTF-8 LC_ALL=C.UTF-8 \
  PGHOST="$PGHOST" PGPORT="$PGPORT" PGDATABASE="$PGDATABASE" PGUSER="$PGUSER" PGPASSFILE="$PGPASSFILE" \
  BACKUP_DIR="$BACKUP_DIR" BAI_CODE_REVISION="$BAI_CODE_REVISION" \
  BAI_NODE_BIN="$BAI_NODE_BIN" BAI_PG_DUMP_BIN="$BAI_PG_DUMP_BIN" \
  BAI_PG_RESTORE_BIN="$BAI_PG_RESTORE_BIN" BAI_AGE_BIN="$BAI_AGE_BIN" \
  BAI_BACKUP_PLAINTEXT_TMPFS_ROOT="$BAI_BACKUP_PLAINTEXT_TMPFS_ROOT" \
  BAI_SOURCE_AUTHORITY_RECEIPT_SHA256="$authority_receipt_sha256" \
  BAI_SOURCE_AUTHORITY_CONSUMPTION_SHA256="$consumption_sha256" \
  BAI_SOURCE_AUTHORITY_RECEIPT_FILE="$BACKUP_SOURCE_AUTHORIZATION_FILE" \
  BAI_SOURCE_AUTHORITY_CONSUMPTION_FILE="$consumption_file" \
  BAI_AUTHORITY_TRUST_ROOT_FILE=/etc/bai-development-os/knowledge-hub/rehearsal-authority-trust-root.json \
  BAI_AUTHORITY_REVOCATIONS_FILE=/etc/bai-development-os/knowledge-hub/rehearsal-authority-revocations.json \
  BAI_AUTHORITY_HEAD_FILE=/etc/bai-development-os/knowledge-hub/rehearsal-authority-head.json \
  BAI_AUTHORITY_EXPIRES_AT="$authorized_expires_at" \
  BAI_PRODUCER_SOURCE_GRAPH_SHA256="$producer_source_graph_sha256" BAI_RUNTIME_DEPENDENCY_TREE_SHA256="$runtime_dependency_tree_sha256" \
  BAI_AUTHORIZED_SOURCE_CLUSTER_SHA256="$authorized_cluster_sha256" \
  AGE_RECIPIENT="$AGE_RECIPIENT" \
  /usr/bin/timeout --foreground --kill-after=1s "${source_effect_seconds}s" \
  "$BAI_NODE_BIN" "$repo_root/deploy/knowledge-hub/runtime/create-consistent-backup.mjs" "$BACKUP_DIR"
