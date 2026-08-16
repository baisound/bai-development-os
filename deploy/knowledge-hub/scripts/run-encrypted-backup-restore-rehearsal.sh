#!/bin/bash
set -Eeuo pipefail
export PATH='/usr/sbin:/usr/bin:/sbin:/bin'
for unsafe_name in BASH_ENV ENV NODE_OPTIONS NODE_PATH LD_PRELOAD LD_LIBRARY_PATH PGOPTIONS PGSERVICE PGSERVICEFILE; do
  if [[ -v "$unsafe_name" ]]; then printf 'BACKUP_RESTORE_REHEARSAL_FAIL: privileged environment contains %s\n' "$unsafe_name" >&2; exit 1; fi
done
unset BASH_ENV ENV NODE_OPTIONS NODE_PATH LD_PRELOAD LD_LIBRARY_PATH PGOPTIONS PGSERVICE PGSERVICEFILE
ulimit -c 0
[[ "$(ulimit -c)" == 0 ]] || { printf '%s\n' 'BACKUP_RESTORE_REHEARSAL_FAIL: core dumps must be disabled' >&2; exit 1; }
awk 'NR > 1 { active=1 } END { exit active ? 1 : 0 }' /proc/swaps || { printf '%s\n' 'BACKUP_RESTORE_REHEARSAL_FAIL: swap must be disabled for plaintext restore' >&2; exit 1; }

readonly REQUIRED_ACK='BACKUP_RESTORE_REHEARSAL_ONLY'
readonly AUTHORITY_FINALIZATION_RESERVE_SECONDS=5
readonly CANONICAL_REHEARSAL_ROOT='/var/lib/bai-development-os/knowledge-hub/rehearsals'
readonly CANONICAL_AUTHORITY_CONSUMPTION_DIR='/var/lib/bai-development-os/knowledge-hub/authority-consumption'
fail(){ printf 'BACKUP_RESTORE_REHEARSAL_FAIL: %s\n' "$*" >&2; exit 1; }
require(){ command -v "$1" >/dev/null 2>&1 || fail "$1 is required"; }

readonly TRUSTED_REHEARSAL_REPOSITORY='/opt/bai-development-os'
readonly TRUSTED_NODE_BIN='/usr/bin/node'
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
[ "$repo_root" = "$TRUSTED_REHEARSAL_REPOSITORY" ] || fail 'rehearsal must run from the root-owned immutable installation'
current="$(readlink -f "${BASH_SOURCE[0]}")"
while :; do
  [ "$(stat -c %u "$current")" = 0 ] || fail 'rehearsal installation must be root-owned'
  mode="$(stat -c %a "$current")"; (( (8#$mode & 022) == 0 )) || fail 'rehearsal installation must not be group/other writable'
  parent="$(dirname "$current")"; [ "$parent" = "$current" ] && break; current="$parent"
done
readonly REQUIRED_COMMANDS='age awk bash cat chmod cp createdb date dirname dropdb env flock getent git grep id ip mkdir mv node pg_restore psql readlink rm setpriv sha256sum sleep sort stat timeout tr wc'
for cmd in $REQUIRED_COMMANDS; do require "$cmd"; done
[ "$(readlink -f "$(command -v node)")" = "$TRUSTED_NODE_BIN" ] && [ -f "$TRUSTED_NODE_BIN" ] && [ ! -L "$TRUSTED_NODE_BIN" ] || fail 'Node verifier bootstrap must be the fixed /usr/bin/node ordinary file'
[ "$(id -u)" = 0 ] || fail 'run the bounded rehearsal through the privileged root executor'
actual_interpreter="$(readlink -f /proc/$$/exe)"
expected_interpreter="$(readlink -f "$(command -v bash)")"
[[ "$actual_interpreter" == "$expected_interpreter" ]] || fail 'active Bash interpreter differs from the protected PATH interpreter'
authority_lock='/etc/bai-development-os/knowledge-hub/rehearsal-authority.lock'
[[ -f "$authority_lock" && ! -L "$authority_lock" && "$(stat -c %u "$authority_lock")" == 0 ]] || fail 'canonical authority lock is not a root-owned ordinary file'
authority_lock_mode="$(stat -c %a "$authority_lock")"; (( (8#$authority_lock_mode & 022) == 0 )) || fail 'canonical authority lock is writable outside root'
exec 9<"$authority_lock"
flock --shared 9 || fail 'canonical authority read lease unavailable'
toolchain_rows=''
for cmd in $REQUIRED_COMMANDS; do
  binary="$(readlink -f "$(command -v "$cmd")")"; [ -f "$binary" ] && [ ! -L "$binary" ] || fail "$cmd must resolve to an ordinary file"
  current="$binary"
  while :; do
    [ "$(stat -c %u "$current")" = 0 ] || fail "$cmd path must be root-owned"
    mode="$(stat -c %a "$current")"; (( (8#$mode & 022) == 0 )) || fail "$cmd path must not be group/other writable"
    parent="$(dirname "$current")"; [ "$parent" = "$current" ] && break; current="$parent"
  done
  binary_sha256="$(sha256sum "$binary" | awk '{print $1}')"
  toolchain_rows+="$cmd\t$binary\t$binary_sha256\n"
done
toolchain_manifest_sha256="$(printf '%b' "$toolchain_rows" | LC_ALL=C sort | sha256sum | awk '{print $1}')"
[ "${BAI_BACKUP_RESTORE_ACK:-}" = "$REQUIRED_ACK" ] || fail "set BAI_BACKUP_RESTORE_ACK=$REQUIRED_ACK after bounded rehearsal approval"
: "${BACKUP_FILE:?BACKUP_FILE required}"
: "${BACKUP_SHA256_FILE:?BACKUP_SHA256_FILE required}"
: "${BACKUP_MANIFEST_FILE:?BACKUP_MANIFEST_FILE required}"
: "${BACKUP_SOURCE_COMMIT_FILE:?BACKUP_SOURCE_COMMIT_FILE required}"
: "${AGE_RECIPIENT:?AGE_RECIPIENT required}"
: "${AGE_IDENTITY_FILE:?AGE_IDENTITY_FILE required}"
: "${REHEARSAL_TARGET_AUTHORIZATION_FILE:?REHEARSAL_TARGET_AUTHORIZATION_FILE required}"
: "${AUTHORIZATION_CONSUMPTION_DIR:?AUTHORIZATION_CONSUMPTION_DIR required}"
: "${PLAINTEXT_TMPFS_ROOT:?PLAINTEXT_TMPFS_ROOT required}"
: "${BACKUP_RESTORE_ROOT:?BACKUP_RESTORE_ROOT required}"
: "${BACKUP_RESTORE_RUN_DIR:?BACKUP_RESTORE_RUN_DIR required}"
: "${RUN_ID:?RUN_ID required}"
: "${CODE_REVISION:?CODE_REVISION required}"
: "${RESTORE_TARGET_DATABASE:?RESTORE_TARGET_DATABASE required}"
: "${PGHOST:?PGHOST required}"
: "${PGADMINUSER:?PGADMINUSER required}"
: "${PGRESTOREUSER:?PGRESTOREUSER required}"
: "${PGRESTOREEXECUTOR:?PGRESTOREEXECUTOR required}"
: "${PGDATABASE:?PGDATABASE required}"
: "${PGPORT:=5432}"
: "${PGPASSFILE:?PGPASSFILE required}"
: "${PGRESTOREPASSFILE:?PGRESTOREPASSFILE required}"
pgpass_file="$PGPASSFILE"
restore_pgpass_file="$PGRESTOREPASSFILE"
unset PGPASSWORD
unset PGPASSFILE
unset PGRESTOREPASSFILE

[[ "$RUN_ID" =~ ^[A-Za-z0-9._-]{1,64}$ ]] || fail 'RUN_ID invalid'
[[ "$CODE_REVISION" =~ ^[a-f0-9]{40}$ ]] || fail 'CODE_REVISION must be an exact lowercase Git SHA'
[[ "$RESTORE_TARGET_DATABASE" =~ ^[A-Za-z0-9_]+_restore_rehearsal$ ]] || fail 'restore database must use _restore_rehearsal suffix'
[[ "$PGADMINUSER" =~ ^[A-Za-z_][A-Za-z0-9_]{0,62}$ ]] || fail 'PGADMINUSER invalid'
[[ "$PGRESTOREUSER" =~ ^[A-Za-z_][A-Za-z0-9_]{0,62}$ ]] || fail 'PGRESTOREUSER invalid'
[[ "$PGRESTOREEXECUTOR" =~ ^[A-Za-z_][A-Za-z0-9_]{0,62}$ ]] && [ "$PGRESTOREEXECUTOR" != "$PGRESTOREUSER" ] || fail 'PGRESTOREEXECUTOR invalid or not separated from restore role'
[[ "$PGHOST" = /* ]] && [ -d "$PGHOST" ] && [ ! -L "$PGHOST" ] || fail 'PGHOST must be an ordinary local PostgreSQL socket directory'
[ "$BACKUP_MANIFEST_FILE" = "$BACKUP_FILE.manifest.json" ] || fail 'manifest path must equal BACKUP_FILE.manifest.json'
for input in "$BACKUP_FILE" "$BACKUP_SHA256_FILE" "$BACKUP_MANIFEST_FILE" "$BACKUP_SOURCE_COMMIT_FILE" "$AGE_IDENTITY_FILE" "$REHEARSAL_TARGET_AUTHORIZATION_FILE" "$pgpass_file" "$restore_pgpass_file"; do [ -f "$input" ] && [ ! -L "$input" ] || fail 'inputs must be ordinary non-symlink files'; done
for secret_file in "$AGE_IDENTITY_FILE" "$pgpass_file" "$restore_pgpass_file"; do
  [ "$(stat -c %u "$secret_file")" = "$(id -u)" ] || fail 'secret file owner differs from execution user'
  secret_mode="$(stat -c %a "$secret_file")"; (( (8#$secret_mode & 077) == 0 )) || fail 'secret file group/other permissions are prohibited'
done
assert_protected_ancestors(){
  local current
  current="$(dirname "$(readlink -f "$1")")"
  while [[ "$current" != / ]]; do
    [[ "$(stat -c %u "$current")" == 0 ]] || fail "$2 ancestor must be root-owned"
    local mode="$(stat -c %a "$current")"; (( (8#$mode & 022) == 0 )) || fail "$2 ancestor must not be group/other writable"
    current="$(dirname "$current")"
  done
}
for secret_file in "$AGE_IDENTITY_FILE" "$pgpass_file" "$restore_pgpass_file"; do assert_protected_ancestors "$secret_file" 'secret file'; done
[ "$BACKUP_SHA256_FILE" = "$BACKUP_FILE.sha256" ] || fail 'sidecar path must equal BACKUP_FILE.sha256'
[ "$BACKUP_SOURCE_COMMIT_FILE" = "$(dirname "$BACKUP_FILE")/COMMITTED.json" ] || fail 'source commit marker must share the backup run directory'
SOURCE_AUTHORIZATION_FILE="$(dirname "$BACKUP_FILE")/SOURCE-AUTHORIZATION.json"
SOURCE_AUTHORIZATION_CONSUMPTION_FILE="$(dirname "$BACKUP_FILE")/SOURCE-AUTHORIZATION-CONSUMPTION.json"
SOURCE_AUTHORITY_TRUST_ROOT_FILE="$(dirname "$BACKUP_FILE")/SOURCE-AUTHORITY-TRUST-ROOT.json"
SOURCE_AUTHORITY_REVOCATIONS_FILE="$(dirname "$BACKUP_FILE")/SOURCE-AUTHORITY-REVOCATIONS.json"
SOURCE_AUTHORITY_HEAD_FILE="$(dirname "$BACKUP_FILE")/SOURCE-AUTHORITY-HEAD.json"
for source_authority_artifact in "$SOURCE_AUTHORIZATION_FILE" "$SOURCE_AUTHORIZATION_CONSUMPTION_FILE" "$SOURCE_AUTHORITY_TRUST_ROOT_FILE" "$SOURCE_AUTHORITY_REVOCATIONS_FILE" "$SOURCE_AUTHORITY_HEAD_FILE"; do [ -f "$source_authority_artifact" ] && [ ! -L "$source_authority_artifact" ] || fail 'source authority audit artifacts must be ordinary non-symlink files'; done
[ "$(wc -l < "$BACKUP_SHA256_FILE" | tr -d ' ')" = 1 ] || fail 'sidecar must contain exactly one line'
[ "$BACKUP_RESTORE_ROOT" = "$CANONICAL_REHEARSAL_ROOT" ] || fail 'run root must equal the canonical rehearsal root'
[ "$AUTHORIZATION_CONSUMPTION_DIR" = "$CANONICAL_AUTHORITY_CONSUMPTION_DIR" ] || fail 'authorization consumption directory must equal the canonical ledger directory'
[ -d "$BACKUP_RESTORE_ROOT" ] && [ ! -L "$BACKUP_RESTORE_ROOT" ] || fail 'run root must be an existing ordinary directory'
[ "$(readlink -f "$BACKUP_RESTORE_ROOT")" = "$BACKUP_RESTORE_ROOT" ] || fail 'run root must be canonical'
[ "$(stat -c %u "$BACKUP_RESTORE_ROOT")" = "$(id -u)" ] || fail 'run root must be owned by the execution user'
run_root_mode="$(stat -c %a "$BACKUP_RESTORE_ROOT")"; (( (8#$run_root_mode & 077) == 0 )) || fail 'run root must not grant group/other permissions'
ancestor="$(dirname "$BACKUP_RESTORE_ROOT")"
while :; do
  [ "$(stat -c %u "$ancestor")" = 0 ] || fail 'run root ancestor must be root-owned'
  ancestor_mode="$(stat -c %a "$ancestor")"; (( (8#$ancestor_mode & 022) == 0 )) || fail 'run root ancestor must not be group/other writable'
  parent="$(dirname "$ancestor")"; [ "$parent" = "$ancestor" ] && break; ancestor="$parent"
done
[ "$BACKUP_RESTORE_RUN_DIR" = "$BACKUP_RESTORE_ROOT/$RUN_ID" ] || fail 'run directory must be the exact root/RUN_ID child'
[ ! -e "$BACKUP_RESTORE_RUN_DIR" ] || fail 'run directory already exists; use a new RUN_ID'
[ -d "$AUTHORIZATION_CONSUMPTION_DIR" ] && [ ! -L "$AUTHORIZATION_CONSUMPTION_DIR" ] && [ "$(readlink -f "$AUTHORIZATION_CONSUMPTION_DIR")" = "$AUTHORIZATION_CONSUMPTION_DIR" ] || fail 'authorization consumption directory must be canonical and ordinary'
[ "$(stat -c %u "$AUTHORIZATION_CONSUMPTION_DIR")" = 0 ] || fail 'authorization consumption directory must be root-owned'
consumption_mode="$(stat -c %a "$AUTHORIZATION_CONSUMPTION_DIR")"; (( (8#$consumption_mode & 077) == 0 )) || fail 'authorization consumption directory must not grant group/other permissions'
assert_protected_ancestors "$AUTHORIZATION_CONSUMPTION_DIR/receipt" 'authorization consumption directory'
[ -d "$PLAINTEXT_TMPFS_ROOT" ] && [ ! -L "$PLAINTEXT_TMPFS_ROOT" ] && [ "$(readlink -f "$PLAINTEXT_TMPFS_ROOT")" = "$PLAINTEXT_TMPFS_ROOT" ] || fail 'plaintext root must be canonical and ordinary'
[ "$(stat -f -c %T "$PLAINTEXT_TMPFS_ROOT")" = 'tmpfs' ] || fail 'plaintext root must be tmpfs'
[ "$(stat -c %u "$PLAINTEXT_TMPFS_ROOT")" = "$(id -u)" ] || fail 'plaintext tmpfs root owner differs from execution user'
plaintext_root_mode="$(stat -c %a "$PLAINTEXT_TMPFS_ROOT")"; (( (8#$plaintext_root_mode & 077) == 0 )) || fail 'plaintext tmpfs root must not grant group/other permissions'
assert_protected_ancestors "$PLAINTEXT_TMPFS_ROOT/placeholder" 'plaintext root'
assert_protected_ancestors "$PGHOST/placeholder" 'PostgreSQL socket directory'

[ "$(git -C "$repo_root" rev-parse HEAD)" = "$CODE_REVISION" ] || fail 'CODE_REVISION differs from repository HEAD'
rehearsal_paths=(
  deploy/knowledge-hub/scripts/run-encrypted-backup-restore-rehearsal.sh
  scripts/validate-knowledge-hub-remaining-deployment-gates.mjs
  scripts/verify-knowledge-hub-rehearsal-target-authorization.mjs
  scripts/validate-knowledge-hub-pg-restore-list.mjs
  scripts/validate-knowledge-hub-schema-sql.mjs
  scripts/validate-knowledge-hub-data-only-copy.mjs
  scripts/commit-knowledge-hub-backup-rehearsal-bundle.mjs
  scripts/write-knowledge-hub-rehearsal-recovery-journal.mjs
  deploy/knowledge-hub/scripts/backup-postgres.sh
  deploy/knowledge-hub/runtime/create-consistent-backup.mjs
)
for rel in "${rehearsal_paths[@]}"; do
  git -C "$repo_root" ls-files --error-unmatch "$rel" >/dev/null || fail "untracked rehearsal implementation: $rel"
  current="$repo_root/$rel"
  while [ "$current" != "$repo_root" ]; do
    [ "$(stat -c %u "$current")" = 0 ] || fail "rehearsal implementation is not root-owned: $rel"
    mode="$(stat -c %a "$current")"; (( (8#$mode & 022) == 0 )) || fail "rehearsal implementation is writable outside root: $rel"
    current="$(dirname "$current")"
  done
  expected_file_sha="$(git -C "$repo_root" show "$CODE_REVISION:$rel" | sha256sum | awk '{print $1}')"
  actual_file_sha="$(sha256sum "$repo_root/$rel" | awk '{print $1}')"
  [ "$expected_file_sha" = "$actual_file_sha" ] || fail "rehearsal implementation differs from CODE_REVISION: $rel"
done
[ "$(stat -c %u "$repo_root/.git")" = 0 ] || fail 'Git object store must be root-owned'
git_mode="$(stat -c %a "$repo_root/.git")"; (( (8#$git_mode & 022) == 0 )) || fail 'Git object store must not be group/other writable'
git -C "$repo_root" diff --quiet -- "${rehearsal_paths[@]}" || fail 'rehearsal implementation has unstaged drift'
git -C "$repo_root" diff --cached --quiet -- "${rehearsal_paths[@]}" || fail 'rehearsal implementation has staged drift'

# Reserve the private run directory and take one same-file-descriptor snapshot
# before parsing or verifying any authorization field. Every later authority
# read uses this immutable snapshot, never the caller-controlled source path.
original_rehearsal_target_authorization_file="$REHEARSAL_TARGET_AUTHORIZATION_FILE"
mkdir "$BACKUP_RESTORE_RUN_DIR" || fail 'run directory reservation failed'
chmod 700 "$BACKUP_RESTORE_RUN_DIR"
node -e 'const fs=require("fs");const fd=fs.openSync(process.argv[1],"r");try{fs.fsyncSync(fd)}finally{fs.closeSync(fd)}' "$BACKUP_RESTORE_ROOT" || fail 'run root directory fsync failed'
[ "$(readlink -f "$BACKUP_RESTORE_RUN_DIR")" = "$BACKUP_RESTORE_RUN_DIR" ] && [ ! -L "$BACKUP_RESTORE_RUN_DIR" ] || fail 'reserved run directory containment invalid'
inputs_dir="$BACKUP_RESTORE_RUN_DIR/inputs"
mkdir "$inputs_dir" && chmod 700 "$inputs_dir"
authorization_snapshot="$inputs_dir/target-authorization.json"
target_authority_trust_root='/etc/bai-development-os/knowledge-hub/rehearsal-authority-trust-root.json'
target_authority_revocations='/etc/bai-development-os/knowledge-hub/rehearsal-authority-revocations.json'
target_authority_head='/etc/bai-development-os/knowledge-hub/rehearsal-authority-head.json'
snapshot_ordinary(){
  node -e 'const fs=require("fs"),path=require("path");const [source,target]=process.argv.slice(1);const sourceFd=fs.openSync(source,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);try{const before=fs.fstatSync(sourceFd);if(!before.isFile())throw Error("snapshot source is not ordinary");const bytes=fs.readFileSync(sourceFd);const after=fs.fstatSync(sourceFd);if(before.dev!==after.dev||before.ino!==after.ino||before.size!==after.size||before.mtimeMs!==after.mtimeMs)throw Error("snapshot source changed during read");const targetFd=fs.openSync(target,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW,0o400);try{fs.writeFileSync(targetFd,bytes);fs.fsyncSync(targetFd)}finally{fs.closeSync(targetFd)}const dirFd=fs.openSync(path.dirname(target),"r");try{fs.fsyncSync(dirFd)}finally{fs.closeSync(dirFd)}}finally{fs.closeSync(sourceFd)}' "$1" "$2"
}
snapshot_ordinary "$original_rehearsal_target_authorization_file" "$authorization_snapshot" || fail 'authorization snapshot failed'
snapshot_ordinary "$target_authority_trust_root" "$inputs_dir/target-authority-trust-root.json" || fail 'target authority trust-root snapshot failed'
snapshot_ordinary "$target_authority_revocations" "$inputs_dir/target-authority-revocations.json" || fail 'target authority revocations snapshot failed'
snapshot_ordinary "$target_authority_head" "$inputs_dir/target-authority-head.json" || fail 'target authority head snapshot failed'
[ "$(sha256sum "$authorization_snapshot" | awk '{print $1}')" = "$(sha256sum "$original_rehearsal_target_authorization_file" | awk '{print $1}')" ] || fail 'authorization source changed after snapshot'
REHEARSAL_TARGET_AUTHORIZATION_FILE="$authorization_snapshot"
original_backup_file="$BACKUP_FILE"
original_backup_sidecar="$BACKUP_SHA256_FILE"
original_backup_manifest="$BACKUP_MANIFEST_FILE"
original_backup_commit="$BACKUP_SOURCE_COMMIT_FILE"
original_source_authorization="$SOURCE_AUTHORIZATION_FILE"
original_source_authorization_consumption="$SOURCE_AUTHORIZATION_CONSUMPTION_FILE"
original_source_authority_trust_root="$SOURCE_AUTHORITY_TRUST_ROOT_FILE"
original_source_authority_revocations="$SOURCE_AUTHORITY_REVOCATIONS_FILE"
original_source_authority_head="$SOURCE_AUTHORITY_HEAD_FILE"
snapshot_ordinary "$original_backup_file" "$inputs_dir/backup.dump.age" || fail 'backup ciphertext snapshot failed'
snapshot_ordinary "$original_backup_sidecar" "$inputs_dir/backup.dump.sha256" || fail 'backup sidecar snapshot failed'
snapshot_ordinary "$original_backup_manifest" "$inputs_dir/backup.dump.manifest.json" || fail 'backup manifest snapshot failed'
snapshot_ordinary "$original_backup_commit" "$inputs_dir/SOURCE-COMMITTED.json" || fail 'backup source commit snapshot failed'
snapshot_ordinary "$original_source_authorization" "$inputs_dir/source-authorization.json" || fail 'source authorization snapshot failed'
snapshot_ordinary "$original_source_authorization_consumption" "$inputs_dir/source-authorization-consumption.json" || fail 'source authorization consumption snapshot failed'
snapshot_ordinary "$original_source_authority_trust_root" "$inputs_dir/source-authority-trust-root.json" || fail 'source authority trust-root snapshot failed'
snapshot_ordinary "$original_source_authority_revocations" "$inputs_dir/source-authority-revocations.json" || fail 'source authority revocations snapshot failed'
snapshot_ordinary "$original_source_authority_head" "$inputs_dir/source-authority-head.json" || fail 'source authority head snapshot failed'
BACKUP_FILE="$inputs_dir/backup.dump.age"
BACKUP_SHA256_FILE="$inputs_dir/backup.dump.sha256"
BACKUP_MANIFEST_FILE="$inputs_dir/backup.dump.manifest.json"
BACKUP_SOURCE_COMMIT_FILE="$inputs_dir/SOURCE-COMMITTED.json"
verify_authority(){ "$TRUSTED_NODE_BIN" "$repo_root/scripts/verify-knowledge-hub-rehearsal-target-authorization.mjs" canonical "$REHEARSAL_TARGET_AUTHORIZATION_FILE" >/dev/null; }
verify_authority
node "$repo_root/scripts/validate-knowledge-hub-remaining-deployment-gates.mjs" sourceManifest "$BACKUP_MANIFEST_FILE" >/dev/null
"$TRUSTED_NODE_BIN" "$repo_root/scripts/verify-knowledge-hub-rehearsal-target-authorization.mjs" historical-source-bundle "$BACKUP_RESTORE_RUN_DIR" >/dev/null || fail 'embedded historical source authority audit failed'
node -e 'const fs=require("fs"),crypto=require("crypto");const marker=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));const manifest=JSON.parse(fs.readFileSync(process.argv[2],"utf8")),manifestBytes=fs.readFileSync(process.argv[2]),backup=fs.readFileSync(process.argv[3]);const keys=["schema_version","result","backup_plaintext_sha256","backup_ciphertext_sha256","source_manifest_sha256","committed_at"].sort();const h=x=>crypto.createHash("sha256").update(x).digest("hex");if(Object.keys(marker).sort().join("\n")!==keys.join("\n")||marker.schema_version!=="1.0"||marker.result!=="KNOWLEDGE_HUB_BACKUP_SOURCE_COMMITTED"||marker.source_manifest_sha256!==h(manifestBytes)||marker.backup_plaintext_sha256!==manifest.backup_plaintext_sha256||marker.backup_ciphertext_sha256!==h(backup)||manifest.backup_ciphertext_sha256!==h(backup))process.exit(1)' "$BACKUP_SOURCE_COMMIT_FILE" "$BACKUP_MANIFEST_FILE" "$BACKUP_FILE" || fail 'backup source commit marker invalid'
authorized_cluster_sha="$(node -e 'const fs=require("fs");const x=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));process.stdout.write(x.target_cluster_identifier_sha256)' "$REHEARSAL_TARGET_AUTHORIZATION_FILE")"
authorized_netns_sha="$(node -e 'const fs=require("fs");const x=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));process.stdout.write(x.network_namespace_inode_sha256)' "$REHEARSAL_TARGET_AUTHORIZATION_FILE")"
authorized_boot_sha="$(node -e 'const fs=require("fs");const x=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));process.stdout.write(x.boot_id_sha256)' "$REHEARSAL_TARGET_AUTHORIZATION_FILE")"
authorized_network_policy_sha="$(node -e 'const fs=require("fs");const x=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));process.stdout.write(x.network_policy_sha256)' "$REHEARSAL_TARGET_AUTHORIZATION_FILE")"
authorized_socket_sha="$(node -e 'const fs=require("fs");const x=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));process.stdout.write(x.postgres_socket_identity_sha256)' "$REHEARSAL_TARGET_AUTHORIZATION_FILE")"
authorized_toolchain_sha="$(node -e 'const fs=require("fs");const x=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));process.stdout.write(x.toolchain_manifest_sha256)' "$REHEARSAL_TARGET_AUTHORIZATION_FILE")"
authorized_backup_sha="$(node -e 'const fs=require("fs");const x=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));process.stdout.write(x.backup_plaintext_sha256)' "$REHEARSAL_TARGET_AUTHORIZATION_FILE")"
authorized_manifest_sha="$(node -e 'const fs=require("fs");const x=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));process.stdout.write(x.backup_manifest_sha256)' "$REHEARSAL_TARGET_AUTHORIZATION_FILE")"
authorized_restore_role="$(node -e 'const fs=require("fs");const x=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));process.stdout.write(x.restore_role)' "$REHEARSAL_TARGET_AUTHORIZATION_FILE")"
authorized_restore_executor="$(node -e 'const fs=require("fs");const x=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));process.stdout.write(x.restore_executor_role)' "$REHEARSAL_TARGET_AUTHORIZATION_FILE")"
authorized_executor_pgpass_sha="$(node -e 'const fs=require("fs");const x=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));process.stdout.write(x.restore_executor_pgpass_file_sha256)' "$REHEARSAL_TARGET_AUTHORIZATION_FILE")"
authorized_executor_membership_sha="$(node -e 'const fs=require("fs");const x=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));process.stdout.write(x.restore_executor_membership_graph_sha256)' "$REHEARSAL_TARGET_AUTHORIZATION_FILE")"
authorized_executor_app="$(node -e 'const fs=require("fs");const x=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));process.stdout.write(x.restore_executor_application_name)' "$REHEARSAL_TARGET_AUTHORIZATION_FILE")"
authorized_executor_lease_sha="$(node -e 'const fs=require("fs");const x=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));process.stdout.write(x.restore_executor_lease_coordinate_sha256)' "$REHEARSAL_TARGET_AUTHORIZATION_FILE")"
authorized_run_id="$(node -e 'const fs=require("fs");const x=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));process.stdout.write(x.run_id)' "$REHEARSAL_TARGET_AUTHORIZATION_FILE")"
authorized_restore_database="$(node -e 'const fs=require("fs");const x=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));process.stdout.write(x.restore_database)' "$REHEARSAL_TARGET_AUTHORIZATION_FILE")"
authorized_recipient_sha="$(node -e 'const fs=require("fs");const x=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));process.stdout.write(x.age_recipient_fingerprint_sha256)' "$REHEARSAL_TARGET_AUTHORIZATION_FILE")"
authorized_runner_revision="$(node -e 'const fs=require("fs");const x=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));process.stdout.write(x.runner_code_revision)' "$REHEARSAL_TARGET_AUTHORIZATION_FILE")"
authorized_execution_nonce_sha="$(node -e 'const fs=require("fs");const x=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));process.stdout.write(x.execution_nonce_sha256)' "$REHEARSAL_TARGET_AUTHORIZATION_FILE")"
authorized_consumption_dir_sha="$(node -e 'const fs=require("fs");const x=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));process.stdout.write(x.consumption_ledger_directory_sha256)' "$REHEARSAL_TARGET_AUTHORIZATION_FILE")"
authorized_expires_at="$(node -e 'const fs=require("fs");const x=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));process.stdout.write(x.expires_at)' "$REHEARSAL_TARGET_AUTHORIZATION_FILE")"
authority_deadline_epoch="$(date -u -d "$authorized_expires_at" +%s)" || fail 'target authority expiry is not a valid UTC deadline'
authorization_receipt_sha256="$(sha256sum "$REHEARSAL_TARGET_AUTHORIZATION_FILE" | awk '{print $1}')"
[ "$toolchain_manifest_sha256" = "$authorized_toolchain_sha" ] || fail 'protected toolchain differs from target authorization'
sidecar_sha256="$(sha256sum "$BACKUP_SHA256_FILE" | awk '{print $1}')"
source_manifest_sha256="$(sha256sum "$BACKUP_MANIFEST_FILE" | awk '{print $1}')"
source_commit_sha256="$(sha256sum "$BACKUP_SOURCE_COMMIT_FILE" | awk '{print $1}')"
sidecar_ciphertext_sha256="$(awk 'NR == 1 { print $1 }' "$BACKUP_SHA256_FILE")"
[[ "$sidecar_ciphertext_sha256" =~ ^[a-f0-9]{64}$ ]] || fail 'sidecar SHA-256 invalid'
source_ciphertext_sha256="$(sha256sum "$BACKUP_FILE" | awk '{print $1}')"
[ "$sidecar_ciphertext_sha256" = "$source_ciphertext_sha256" ] || fail 'encrypted backup SHA-256 does not match its bound sidecar'
plaintext_sha256="$(node -e 'const fs=require("fs");const x=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));process.stdout.write(x.backup_plaintext_sha256)' "$BACKUP_MANIFEST_FILE")"
[ "$authorized_backup_sha" = "$plaintext_sha256" ] || fail 'backup is not bound by target authorization'
[ "$authorized_manifest_sha" = "$source_manifest_sha256" ] || fail 'source manifest is not bound by target authorization'
[ "$authorized_restore_role" = "$PGRESTOREUSER" ] || fail 'restore role differs from target authorization'
[ "$authorized_restore_executor" = "$PGRESTOREEXECUTOR" ] || fail 'restore executor differs from target authorization'
[ "$(sha256sum "$restore_pgpass_file" | awk '{print $1}')" = "$authorized_executor_pgpass_sha" ] || fail 'restore executor credential file differs from target authorization'
[[ "$authorized_executor_app" =~ ^[A-Za-z][A-Za-z0-9._-]{0,62}$ ]] || fail 'restore executor application name invalid'
[ "$authorized_run_id" = "$RUN_ID" ] || fail 'run ID differs from target authorization'
[ "$authorized_restore_database" = "$RESTORE_TARGET_DATABASE" ] || fail 'restore database differs from target authorization'
[ "$authorized_runner_revision" = "$CODE_REVISION" ] || fail 'runner revision differs from target authorization'
recipient_fingerprint_sha256="$(printf '%s' "$AGE_RECIPIENT" | sha256sum | awk '{print $1}')"
[ "$authorized_recipient_sha" = "$recipient_fingerprint_sha256" ] || fail 'age recipient differs from target authorization'
consumption_dir_sha256="$(stat -Lc '%d:%i:%u:%g:%a' "$AUTHORIZATION_CONSUMPTION_DIR" | sha256sum | awk '{print $1}')"
[ "$authorized_consumption_dir_sha" = "$consumption_dir_sha256" ] || fail 'authorization consumption directory differs from target authorization'
network_namespace_inode_sha256="$(readlink /proc/self/ns/net | sha256sum | awk '{print $1}')"
[ "$network_namespace_inode_sha256" = "$authorized_netns_sha" ] || fail 'network namespace differs from target authorization'
boot_id_sha256="$(sha256sum /proc/sys/kernel/random/boot_id | awk '{print $1}')"
[ "$boot_id_sha256" = "$authorized_boot_sha" ] || fail 'boot identity differs from target authorization'
non_loopback_up="$(ip -o link show up | awk -F': ' '$2 !~ /^lo(@|$)/ {count++} END {print count+0}')"
[ "$non_loopback_up" = 0 ] || fail 'non-loopback network interface is up'
[ -z "$(ip -o -4 route show table all | grep -Ev ' dev lo( |$)' || true)" ] && [ -z "$(ip -o -6 route show table all | grep -Ev ' dev lo( |$)' || true)" ] || fail 'rehearsal namespace has a non-loopback route'
network_policy_sha256="$({ ip -details -json link show; ip -json -4 route show table all; ip -json -6 route show table all; ip -json rule show; } | sha256sum | awk '{print $1}')"
[ "$network_policy_sha256" = "$authorized_network_policy_sha" ] || fail 'network policy differs from target authorization'
postgres_socket_file="$PGHOST/.s.PGSQL.$PGPORT"
[ -S "$postgres_socket_file" ] && [ ! -L "$postgres_socket_file" ] || fail 'PostgreSQL socket endpoint is missing or not an ordinary socket'
postgres_socket_identity_sha256="$({ stat -Lc 'dir:%d:%i:%u:%g:%a' "$PGHOST"; stat -Lc 'socket:%d:%i:%u:%g:%a' "$postgres_socket_file"; } | sha256sum | awk '{print $1}')"
[ "$postgres_socket_identity_sha256" = "$authorized_socket_sha" ] || fail 'PostgreSQL socket identity differs from target authorization'
manifest_ciphertext_sha="$(node -e 'const fs=require("fs");const x=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));process.stdout.write(x.backup_ciphertext_sha256)' "$BACKUP_MANIFEST_FILE")"
[ "$manifest_ciphertext_sha" = "$source_ciphertext_sha256" ] || fail 'source manifest ciphertext hash mismatch'
manifest_plaintext_bytes="$(node -e 'const fs=require("fs");const x=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));process.stdout.write(String(x.backup_plaintext_bytes))' "$BACKUP_MANIFEST_FILE")"
manifest_ciphertext_bytes="$(node -e 'const fs=require("fs");const x=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));process.stdout.write(String(x.backup_ciphertext_bytes))' "$BACKUP_MANIFEST_FILE")"
[ "$manifest_ciphertext_bytes" = "$(stat -c %s "$BACKUP_FILE")" ] || fail 'source manifest ciphertext byte length mismatch'

cluster_system_identifier="$(PGPASSFILE="$pgpass_file" psql --host="$PGHOST" --port="$PGPORT" --username="$PGADMINUSER" --dbname="$PGDATABASE" --tuples-only --no-align --command='SELECT system_identifier FROM pg_control_system()')"
[[ "$cluster_system_identifier" =~ ^[0-9]+$ ]] || fail 'PostgreSQL system identifier unavailable'
cluster_system_identifier_sha256="$(printf '%s' "$cluster_system_identifier" | sha256sum | awk '{print $1}')"
[ "$cluster_system_identifier_sha256" = "$authorized_cluster_sha" ] || fail 'connected PostgreSQL cluster is not the authorized non-production rehearsal target'
source_cluster_sha="$(node -e 'const fs=require("fs");const x=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));process.stdout.write(x.source_cluster_identifier_sha256)' "$BACKUP_MANIFEST_FILE")"
[ "$source_cluster_sha" != "$cluster_system_identifier_sha256" ] || fail 'restore target must be a different disposable cluster from the backup source'
restore_role_state="$(PGPASSFILE="$pgpass_file" psql --host="$PGHOST" --port="$PGPORT" --username="$PGADMINUSER" --dbname="$PGDATABASE" --tuples-only --no-align --command="SELECT concat_ws(':',rolsuper::int,rolinherit::int,rolcreaterole::int,rolcreatedb::int,rolcanlogin::int,rolreplication::int,rolbypassrls::int,coalesce(rolconnlimit,-1),(rolpassword IS NULL)::int,(rolvaliduntil IS NULL)::int) FROM pg_roles WHERE rolname = '$PGRESTOREUSER'")"
[ "$restore_role_state" = '0:0:0:0:0:0:0:-1:1:1' ] || fail 'restore role attributes differ from the exact NOLOGIN restricted profile'
executor_role_state="$(PGPASSFILE="$pgpass_file" psql --host="$PGHOST" --port="$PGPORT" --username="$PGADMINUSER" --dbname="$PGDATABASE" --tuples-only --no-align --command="SELECT concat_ws(':',rolsuper::int,rolinherit::int,rolcreaterole::int,rolcreatedb::int,rolcanlogin::int,rolreplication::int,rolbypassrls::int,coalesce(rolconnlimit,-1),(rolpassword IS NULL)::int,(rolvaliduntil IS NULL)::int) FROM pg_roles WHERE rolname = '$PGRESTOREEXECUTOR'")"
[ "$executor_role_state" = '0:0:0:0:1:0:0:1:0:0' ] || fail 'restore executor attributes differ from the exact bounded LOGIN profile'
role_settings="$(PGPASSFILE="$pgpass_file" psql --host="$PGHOST" --port="$PGPORT" --username="$PGADMINUSER" --dbname="$PGDATABASE" --tuples-only --no-align --command="SELECT count(*) FROM pg_db_role_setting s JOIN pg_roles r ON r.oid=s.setrole WHERE r.rolname = '$PGRESTOREUSER'")"
[ "$role_settings" = 0 ] || fail 'restore role must have no per-role or per-database settings'
executor_role_settings="$(PGPASSFILE="$pgpass_file" psql --host="$PGHOST" --port="$PGPORT" --username="$PGADMINUSER" --dbname="$PGDATABASE" --tuples-only --no-align --command="SELECT count(*) FROM pg_db_role_setting s JOIN pg_roles r ON r.oid=s.setrole WHERE r.rolname = '$PGRESTOREEXECUTOR'")"
[ "$executor_role_settings" = 0 ] || fail 'restore executor must have no per-role or per-database settings'
role_memberships="$(PGPASSFILE="$pgpass_file" psql --host="$PGHOST" --port="$PGPORT" --username="$PGADMINUSER" --dbname="$PGDATABASE" --tuples-only --no-align --command="SELECT count(*) FROM pg_roles r WHERE r.rolname <> '$PGRESTOREUSER' AND pg_has_role('$PGRESTOREUSER',r.oid,'MEMBER')")"
[ "$role_memberships" = 0 ] || fail 'restore role must have no direct or inherited role memberships'
measure_executor_membership_graph(){
  local outbound inbound restore_inbound
  outbound="$(PGPASSFILE="$pgpass_file" psql --host="$PGHOST" --port="$PGPORT" --username="$PGADMINUSER" --dbname="$PGDATABASE" --tuples-only --no-align --command="SELECT coalesce(string_agg(role_name||':'||admin_option::int||':'||inherit_option::int||':'||set_option::int,',' ORDER BY role_name),'') FROM (SELECT r.rolname AS role_name,m.admin_option,m.inherit_option,m.set_option FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.roleid WHERE m.member=(SELECT oid FROM pg_roles WHERE rolname='$PGRESTOREEXECUTOR')) q")"
  inbound="$(PGPASSFILE="$pgpass_file" psql --host="$PGHOST" --port="$PGPORT" --username="$PGADMINUSER" --dbname="$PGDATABASE" --tuples-only --no-align --command="SELECT coalesce(string_agg(member_name,',' ORDER BY member_name),'') FROM (SELECT r.rolname AS member_name FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.member WHERE m.roleid=(SELECT oid FROM pg_roles WHERE rolname='$PGRESTOREEXECUTOR')) q")"
  restore_inbound="$(PGPASSFILE="$pgpass_file" psql --host="$PGHOST" --port="$PGPORT" --username="$PGADMINUSER" --dbname="$PGDATABASE" --tuples-only --no-align --command="SELECT coalesce(string_agg(member_name,',' ORDER BY member_name),'') FROM (SELECT r.rolname AS member_name FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.member WHERE m.roleid=(SELECT oid FROM pg_roles WHERE rolname='$PGRESTOREUSER')) q")"
  [ "$outbound" = "$PGRESTOREUSER:0:0:1" ] && [ -z "$inbound" ] && [ "$restore_inbound" = "$PGRESTOREEXECUTOR" ] || fail 'restore executor membership graph is not exact one-way SET ROLE'
  printf 'executor=%s\noutbound=%s\ninbound=%s\nrestore_inbound=%s\n' "$executor_role_state" "$outbound" "$inbound" "$restore_inbound" | sha256sum | awk '{print $1}'
}
executor_membership_graph_sha="$(measure_executor_membership_graph)"
[ "$executor_membership_graph_sha" = "$authorized_executor_membership_sha" ] || fail 'restore executor membership graph differs from target authorization'
other_client_sessions="$(PGPASSFILE="$pgpass_file" psql --host="$PGHOST" --port="$PGPORT" --username="$PGADMINUSER" --dbname="$PGDATABASE" --tuples-only --no-align --command="SELECT count(*) FROM pg_stat_activity WHERE backend_type='client backend' AND pid<>pg_backend_pid()")"
[ "$other_client_sessions" = 0 ] || fail 'disposable restore cluster has a pre-existing client or SET ROLE session'
lease_app="bai-kh-lease-${authorized_execution_nonce_sha:0:16}"
lease_coordinate_sha="$(printf '%s:%s:%s:%s:%s:%s' "$authorized_execution_nonce_sha" "$lease_app" "$authorized_executor_app" "$PGRESTOREEXECUTOR" "$authorized_cluster_sha" "$authorized_socket_sha" | sha256sum | awk '{print $1}')"
[ "$lease_coordinate_sha" = "$authorized_executor_lease_sha" ] || fail 'restore operation lease coordinate differs from target authorization'
sandbox_passwd="$(getent passwd bai-kh-restore)" || fail 'dedicated nonroot restore sandbox identity is absent'
[ "$(printf '%s\n' "$sandbox_passwd" | wc -l | tr -d ' ')" = 1 ] || fail 'dedicated restore sandbox identity is ambiguous'
IFS=: read -r sandbox_name _ sandbox_uid sandbox_gid _ sandbox_home sandbox_shell <<< "$sandbox_passwd"
[ "$sandbox_name" = bai-kh-restore ] && [[ "$sandbox_uid" =~ ^[0-9]+$ ]] && [ "$sandbox_uid" -ne 0 ] && [[ "$sandbox_gid" =~ ^[0-9]+$ ]] || fail 'dedicated restore sandbox identity invalid'
[[ "$sandbox_shell" = */nologin || "$sandbox_shell" = */false ]] || fail 'dedicated restore sandbox must not have an interactive shell'
lease_active=false
lease_backend_pid=0
verify_target_state(){
  local allowed_restore_sessions="${1:-0}"
  verify_authority
  [ "$(readlink /proc/self/ns/net | sha256sum | awk '{print $1}')" = "$authorized_netns_sha" ] || fail 'network namespace changed during rehearsal'
  [ "$(sha256sum /proc/sys/kernel/random/boot_id | awk '{print $1}')" = "$authorized_boot_sha" ] || fail 'boot identity changed during rehearsal'
  [ -z "$(ip -o -4 route show table all | grep -Ev ' dev lo( |$)' || true)" ] && [ -z "$(ip -o -6 route show table all | grep -Ev ' dev lo( |$)' || true)" ] || fail 'network route changed during rehearsal'
  current_network_policy_sha="$({ ip -details -json link show; ip -json -4 route show table all; ip -json -6 route show table all; ip -json rule show; } | sha256sum | awk '{print $1}')"
  [ "$current_network_policy_sha" = "$authorized_network_policy_sha" ] || fail 'network policy changed during rehearsal'
  [ -S "$postgres_socket_file" ] && [ ! -L "$postgres_socket_file" ] || fail 'PostgreSQL socket endpoint changed during rehearsal'
  current_socket_sha="$({ stat -Lc 'dir:%d:%i:%u:%g:%a' "$PGHOST"; stat -Lc 'socket:%d:%i:%u:%g:%a' "$postgres_socket_file"; } | sha256sum | awk '{print $1}')"
  [ "$current_socket_sha" = "$authorized_socket_sha" ] || fail 'PostgreSQL socket identity changed during rehearsal'
  current_cluster="$(PGPASSFILE="$pgpass_file" psql --host="$PGHOST" --port="$PGPORT" --username="$PGADMINUSER" --dbname="$PGDATABASE" --tuples-only --no-align --command='SELECT system_identifier FROM pg_control_system()')"
  [ "$(printf '%s' "$current_cluster" | sha256sum | awk '{print $1}')" = "$authorized_cluster_sha" ] || fail 'PostgreSQL cluster changed during rehearsal'
  current_role_state="$(PGPASSFILE="$pgpass_file" psql --host="$PGHOST" --port="$PGPORT" --username="$PGADMINUSER" --dbname="$PGDATABASE" --tuples-only --no-align --command="SELECT concat_ws(':',rolsuper::int,rolinherit::int,rolcreaterole::int,rolcreatedb::int,rolcanlogin::int,rolreplication::int,rolbypassrls::int,coalesce(rolconnlimit,-1),(rolpassword IS NULL)::int,(rolvaliduntil IS NULL)::int) FROM pg_roles WHERE rolname = '$PGRESTOREUSER'")"
  [ "$current_role_state" = '0:0:0:0:0:0:0:-1:1:1' ] || fail 'restore role attributes changed during rehearsal'
  current_executor_state="$(PGPASSFILE="$pgpass_file" psql --host="$PGHOST" --port="$PGPORT" --username="$PGADMINUSER" --dbname="$PGDATABASE" --tuples-only --no-align --command="SELECT concat_ws(':',rolsuper::int,rolinherit::int,rolcreaterole::int,rolcreatedb::int,rolcanlogin::int,rolreplication::int,rolbypassrls::int,coalesce(rolconnlimit,-1),(rolpassword IS NULL)::int,(rolvaliduntil IS NULL)::int) FROM pg_roles WHERE rolname = '$PGRESTOREEXECUTOR'")"
  [ "$current_executor_state" = "$executor_role_state" ] || fail 'restore executor attributes changed during rehearsal'
  current_role_settings="$(PGPASSFILE="$pgpass_file" psql --host="$PGHOST" --port="$PGPORT" --username="$PGADMINUSER" --dbname="$PGDATABASE" --tuples-only --no-align --command="SELECT count(*) FROM pg_db_role_setting s JOIN pg_roles r ON r.oid=s.setrole WHERE r.rolname = '$PGRESTOREUSER'")"
  [ "$current_role_settings" = 0 ] || fail 'restore role settings changed during rehearsal'
  current_memberships="$(PGPASSFILE="$pgpass_file" psql --host="$PGHOST" --port="$PGPORT" --username="$PGADMINUSER" --dbname="$PGDATABASE" --tuples-only --no-align --command="SELECT count(*) FROM pg_roles r WHERE r.rolname <> '$PGRESTOREUSER' AND pg_has_role('$PGRESTOREUSER',r.oid,'MEMBER')")"
  [ "$current_memberships" = 0 ] || fail 'restore role membership changed during rehearsal'
  [ "$(measure_executor_membership_graph)" = "$authorized_executor_membership_sha" ] || fail 'restore executor membership graph changed during rehearsal'
  expected_lease_sessions=0; [ "$lease_active" = true ] && expected_lease_sessions=1
  session_fence="$(PGPASSFILE="$pgpass_file" psql --host="$PGHOST" --port="$PGPORT" --username="$PGADMINUSER" --dbname="$PGDATABASE" --tuples-only --no-align --command="SELECT concat_ws(':', count(*) FILTER (WHERE application_name='$lease_app' AND usename='$PGADMINUSER' AND pid=$lease_backend_pid), count(*) FILTER (WHERE application_name='$authorized_executor_app' AND usename='$PGRESTOREEXECUTOR'), count(*) FILTER (WHERE NOT ((application_name='$lease_app' AND usename='$PGADMINUSER' AND pid=$lease_backend_pid) OR (application_name='$authorized_executor_app' AND usename='$PGRESTOREEXECUTOR')))) FROM pg_stat_activity WHERE backend_type='client backend' AND pid<>pg_backend_pid()")"
  [ "$session_fence" = "$expected_lease_sessions:$allowed_restore_sessions:0" ] || fail 'exact lease/executor backend session fence changed during rehearsal'
  if [ "$lease_active" = true ]; then
    lease_lock_count="$(PGPASSFILE="$pgpass_file" psql --host="$PGHOST" --port="$PGPORT" --username="$PGADMINUSER" --dbname="$PGDATABASE" --tuples-only --no-align --command="SELECT count(*) FROM pg_locks WHERE locktype='advisory' AND granted AND pid=$lease_backend_pid")"
    [ "$lease_lock_count" = 1 ] || fail 'database-side operation lease is no longer held by the exact backend'
  fi
}
effect_deadline_seconds(){
  verify_target_state "${1:-0}"
  local remaining="$((authority_deadline_epoch - $(date -u +%s) - AUTHORITY_FINALIZATION_RESERVE_SECONDS))"
  [ "$remaining" -gt 0 ] || fail 'target authority effect deadline elapsed'
  printf '%s' "$remaining"
}
PGPASSFILE="$pgpass_file" psql --host="$PGHOST" --port="$PGPORT" --username="$PGADMINUSER" --dbname="$PGDATABASE" --tuples-only --no-align \
  --command="SELECT 1 FROM pg_database WHERE datname = '$RESTORE_TARGET_DATABASE'" | grep -q 1 && fail 'restore database already exists'

encrypted_tmp="$BACKUP_RESTORE_RUN_DIR/encrypted-backup.age.incomplete"
encrypted_final="$BACKUP_RESTORE_RUN_DIR/encrypted-backup.age"
evidence_tmp="$BACKUP_RESTORE_RUN_DIR/evidence.json.incomplete"
evidence_final="$BACKUP_RESTORE_RUN_DIR/evidence.json"
failure_tmp="$BACKUP_RESTORE_RUN_DIR/failure.json.incomplete"
failure_final="$BACKUP_RESTORE_RUN_DIR/failure.json"
tmp_plain="$PLAINTEXT_TMPFS_ROOT/bai-hub-$RUN_ID.dump"
[ ! -e "$tmp_plain" ] || fail 'planned tmpfs plaintext path already exists'
journal_file="$BACKUP_RESTORE_RUN_DIR/recovery-journal.jsonl"
restore_created=false
database_dropped=true
temporary_plaintext_deleted=true
run_succeeded=false
lease_process_pid=''
append_recovery(){
  local phase="$1" payload
  payload="$(node -e 'const [runId,database,socketSha,clusterSha,phase,tmpPath,created,dropped,deleted]=process.argv.slice(1);process.stdout.write(JSON.stringify({run_id:runId,restore_database:database,postgres_socket_identity_sha256:socketSha,target_cluster_identifier_sha256:clusterSha,phase,temporary_plaintext_path:tmpPath,database_created:created==="true",database_dropped:dropped==="true",temporary_plaintext_deleted:deleted==="true"}))' "$RUN_ID" "$RESTORE_TARGET_DATABASE" "$postgres_socket_identity_sha256" "$cluster_system_identifier_sha256" "$phase" "$tmp_plain" "$restore_created" "$database_dropped" "$temporary_plaintext_deleted")" || return 1
  node "$repo_root/scripts/write-knowledge-hub-rehearsal-recovery-journal.mjs" append "$journal_file" "$payload" >/dev/null
}
append_recovery RESERVED || fail 'durable recovery journal reservation failed'
cleanup(){
  original_exit=$?
  trap - EXIT INT TERM
  set +e
  run_succeeded=false
  if [ -f "$BACKUP_RESTORE_RUN_DIR/COMMITTED.json" ] && node "$repo_root/scripts/commit-knowledge-hub-backup-rehearsal-bundle.mjs" validate canonical "$BACKUP_RESTORE_RUN_DIR" "$REHEARSAL_TARGET_AUTHORIZATION_FILE" "$BACKUP_MANIFEST_FILE" >/dev/null 2>&1; then run_succeeded=true; fi
  if [ "$restore_created" = true ]; then
    if ( verify_target_state ) >/dev/null 2>&1; then
      cleanup_remaining="$((authority_deadline_epoch - $(date -u +%s)))"
      if [ "$cleanup_remaining" -gt 0 ]; then PGPASSFILE="$pgpass_file" timeout --foreground --kill-after=1s "$cleanup_remaining" dropdb --if-exists --host="$PGHOST" --port="$PGPORT" --username="$PGADMINUSER" "$RESTORE_TARGET_DATABASE" >/dev/null 2>&1 || true; fi
      remaining="$(PGPASSFILE="$pgpass_file" psql --host="$PGHOST" --port="$PGPORT" --username="$PGADMINUSER" --dbname="$PGDATABASE" --tuples-only --no-align --command="SELECT 1 FROM pg_database WHERE datname = '$RESTORE_TARGET_DATABASE'" 2>/dev/null || printf UNKNOWN)"
      if [ -z "$remaining" ]; then restore_created=false; database_dropped=true; append_recovery DATABASE_DROPPED || true; else printf 'cleanup: isolated database remains or state unknown: %s\n' "$RESTORE_TARGET_DATABASE" >&2; fi
    else
      printf 'cleanup: target authority or cluster fence is no longer valid; destructive cleanup is prohibited\n' >&2
    fi
  fi
  if [ -e "$tmp_plain" ]; then
    if rm -f "$tmp_plain" && [ ! -e "$tmp_plain" ]; then temporary_plaintext_deleted=true; append_recovery PLAINTEXT_DELETED || true; else printf 'cleanup: temporary plaintext remains: %s\n' "$tmp_plain" >&2; fi
  fi
  if [ "$run_succeeded" != true ]; then
    node -e 'const fs=require("fs"),path=require("path");const [tmp,final,runId,exitCode,database,dropped,deleted]=process.argv.slice(1);if(fs.existsSync(final))process.exit(1);const value={schema_version:"1.0",result:"LOCAL_BACKUP_RESTORE_REHEARSAL_FAILED",run_id:runId,exit_code:Number(exitCode),restore_database:database,database_dropped:dropped==="true",temporary_plaintext_deleted:deleted==="true",pass_evidence_published:false};const fd=fs.openSync(tmp,"wx",0o600);try{fs.writeFileSync(fd,`${JSON.stringify(value)}\n`);fs.fsyncSync(fd)}finally{fs.closeSync(fd)}fs.renameSync(tmp,final);const out=fs.openSync(final,"r+");try{fs.fsyncSync(out)}finally{fs.closeSync(out)}const dir=fs.openSync(path.dirname(final),"r");try{fs.fsyncSync(dir)}finally{fs.closeSync(dir)}' "$failure_tmp" "$failure_final" "$RUN_ID" "$original_exit" "$RESTORE_TARGET_DATABASE" "$database_dropped" "$temporary_plaintext_deleted" 2>/dev/null || true
    append_recovery FAILED || true
    printf 'failure_receipt=%s database_dropped=%s temporary_plaintext_deleted=%s\n' "$failure_final" "$database_dropped" "$temporary_plaintext_deleted" >&2
  fi
  if [ -n "$lease_process_pid" ]; then kill "$lease_process_pid" >/dev/null 2>&1 || true; wait "$lease_process_pid" >/dev/null 2>&1 || true; fi
  if [ "$database_dropped" != true ] || [ "$temporary_plaintext_deleted" != true ]; then exit 1; fi
  exit "$original_exit"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
coproc REHEARSAL_DB_LEASE {
  PGPASSFILE="$pgpass_file" PGAPPNAME="$lease_app" psql --quiet --no-psqlrc --set=ON_ERROR_STOP=1 --host="$PGHOST" --port="$PGPORT" --username="$PGADMINUSER" --dbname="$PGDATABASE" --tuples-only --no-align
}
lease_process_pid="$REHEARSAL_DB_LEASE_PID"
printf "SELECT pg_backend_pid() FROM (SELECT pg_advisory_lock(('x'||substring('%s' from 1 for 16))::bit(64)::bigint)) AS held) q;\n" "$authorized_execution_nonce_sha" >&"${REHEARSAL_DB_LEASE[1]}"
IFS= read -r -t 5 lease_backend_pid <&"${REHEARSAL_DB_LEASE[0]}" || fail 'database-side operation lease did not become ready'
[[ "$lease_backend_pid" =~ ^[0-9]+$ ]] && kill -0 "$lease_process_pid" 2>/dev/null || fail 'database-side operation lease backend invalid'
lease_active=true
verify_target_state
consumption_file="$AUTHORIZATION_CONSUMPTION_DIR/$authorized_execution_nonce_sha.json"
node -e 'const fs=require("fs"),path=require("path");const [file,runId,authority,nonce]=process.argv.slice(1);const bytes=Buffer.from(`${JSON.stringify({schema_version:"1.0",result:"REHEARSAL_AUTHORIZATION_CONSUMED",run_id:runId,authority_receipt_sha256:authority,execution_nonce_sha256:nonce})}\n`);const fd=fs.openSync(file,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL,0o600);try{fs.writeFileSync(fd,bytes);fs.fsyncSync(fd)}finally{fs.closeSync(fd)}const dir=fs.openSync(path.dirname(file),"r");try{fs.fsyncSync(dir)}finally{fs.closeSync(dir)}' "$consumption_file" "$RUN_ID" "$authorization_receipt_sha256" "$authorized_execution_nonce_sha" || fail 'authorization nonce is already consumed or could not be durably recorded'
append_recovery AUTHORIZATION_CONSUMED || fail 'authorization consumption journal update failed'
cp --no-clobber "$consumption_file" "$inputs_dir/authorization-consumption.json"
chmod 400 "$inputs_dir"/*
[ "$(sha256sum "$inputs_dir/backup.dump.manifest.json" | awk '{print $1}')" = "$source_manifest_sha256" ] || fail 'reserved source manifest snapshot mismatch'
[ "$(sha256sum "$inputs_dir/backup.dump.sha256" | awk '{print $1}')" = "$sidecar_sha256" ] || fail 'reserved source sidecar snapshot mismatch'
[ "$(sha256sum "$inputs_dir/SOURCE-COMMITTED.json" | awk '{print $1}')" = "$source_commit_sha256" ] || fail 'reserved source commit snapshot mismatch'
[ "$(sha256sum "$authorization_snapshot" | awk '{print $1}')" = "$authorization_receipt_sha256" ] || fail 'reserved authorization snapshot mismatch'
[ "$(sha256sum "$inputs_dir/authorization-consumption.json" | awk '{print $1}')" = "$(sha256sum "$consumption_file" | awk '{print $1}')" ] || fail 'reserved authorization consumption snapshot mismatch'
BACKUP_SHA256_FILE="$inputs_dir/backup.dump.sha256"
BACKUP_MANIFEST_FILE="$inputs_dir/backup.dump.manifest.json"
BACKUP_SOURCE_COMMIT_FILE="$inputs_dir/SOURCE-COMMITTED.json"
REHEARSAL_TARGET_AUTHORIZATION_FILE="$authorization_snapshot"
verify_authority
node -e 'const fs=require("fs"),crypto=require("crypto");const marker=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));const manifest=JSON.parse(fs.readFileSync(process.argv[2],"utf8")),manifestBytes=fs.readFileSync(process.argv[2]),backup=fs.readFileSync(process.argv[3]);const h=x=>crypto.createHash("sha256").update(x).digest("hex");if(marker.result!=="KNOWLEDGE_HUB_BACKUP_SOURCE_COMMITTED"||marker.source_manifest_sha256!==h(manifestBytes)||marker.backup_plaintext_sha256!==manifest.backup_plaintext_sha256||marker.backup_ciphertext_sha256!==h(backup))process.exit(1)' "$BACKUP_SOURCE_COMMIT_FILE" "$BACKUP_MANIFEST_FILE" "$BACKUP_FILE" || fail 'reserved source commit snapshot invalid'
started_epoch="$(date -u +%s)"
started_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
umask 077

cp --no-clobber "$BACKUP_FILE" "$encrypted_tmp"
[ -s "$encrypted_tmp" ] || fail 'encrypted backup is empty'
ciphertext_sha256="$(sha256sum "$encrypted_tmp" | awk '{print $1}')"
[ "$plaintext_sha256" != "$ciphertext_sha256" ] || fail 'ciphertext hash equals plaintext hash'
plaintext_bytes="$manifest_plaintext_bytes"
ciphertext_bytes="$(stat -c %s "$encrypted_tmp")"
[ "$ciphertext_sha256" = "$source_ciphertext_sha256" ] && [ "$ciphertext_bytes" = "$manifest_ciphertext_bytes" ] || fail 'staged ciphertext differs from source manifest'
manifest_recipient_sha="$(node -e 'const fs=require("fs");const x=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));process.stdout.write(x.encryption.recipient_fingerprint_sha256)' "$BACKUP_MANIFEST_FILE")"
[ "$manifest_recipient_sha" = "$recipient_fingerprint_sha256" ] || fail 'source manifest recipient differs from authorized recipient'

temporary_plaintext_deleted=false
append_recovery PLAINTEXT_CREATE_STARTED || fail 'plaintext-create intent journal update failed'
decrypt_remaining="$(effect_deadline_seconds)"
timeout --foreground --kill-after=1s "$decrypt_remaining" age --decrypt --identity "$AGE_IDENTITY_FILE" --output "$tmp_plain" "$encrypted_tmp"
chmod 600 "$tmp_plain"
[ "$(sha256sum "$tmp_plain" | awk '{print $1}')" = "$plaintext_sha256" ] || fail 'decrypted plaintext hash mismatch'
append_recovery PLAINTEXT_CREATED || fail 'plaintext recovery journal update failed'
sandbox_pg_restore(){
  local application_name="$1"; shift
  exec 7<"$tmp_plain"
  exec 8<"$restore_pgpass_file"
  PGAPPNAME="$application_name" setpriv --reuid="$sandbox_uid" --regid="$sandbox_gid" --clear-groups --no-new-privs --inh-caps=-all --ambient-caps=-all --bounding-set=-all \
    env -i PATH="$PATH" HOME="$sandbox_home" LANG=C.UTF-8 LC_ALL=C.UTF-8 PGAPPNAME="$application_name" PGPASSFILE=/proc/self/fd/8 \
    pg_restore "$@" /proc/self/fd/7
  local status=$?
  exec 7<&-
  exec 8<&-
  return "$status"
}
archive_list="$BACKUP_RESTORE_RUN_DIR/archive.list"
sandbox_pg_restore "$authorized_executor_app" --list > "$archive_list"
node "$repo_root/scripts/validate-knowledge-hub-pg-restore-list.mjs" "$archive_list" >/dev/null
expected_archive_toc_sha="$(node -e 'const fs=require("fs");const x=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));process.stdout.write(x.archive_toc_sha256)' "$BACKUP_MANIFEST_FILE")"
[ "$(sha256sum "$archive_list" | awk '{print $1}')" = "$expected_archive_toc_sha" ] || fail 'archive TOC bytes differ from the source manifest'
schema_sql="$BACKUP_RESTORE_RUN_DIR/schema-only.sql"
sandbox_pg_restore "$authorized_executor_app" --schema-only --no-owner --no-acl > "$schema_sql"
expected_schema_sql_sha="$(node -e 'const fs=require("fs");const x=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));process.stdout.write(x.schema_sql_sha256)' "$BACKUP_MANIFEST_FILE")"
[ "$(sha256sum "$schema_sql" | awk '{print $1}')" = "$expected_schema_sql_sha" ] || fail 'archive schema SQL differs from the source manifest'
schema_semantics_json="$(node "$repo_root/scripts/validate-knowledge-hub-schema-sql.mjs" "$schema_sql")" || fail 'archive schema SQL semantics rejected'
schema_semantics_sha="$(node -e 'const x=JSON.parse(process.argv[1]);process.stdout.write(x.schema_semantics_sha256)' "$schema_semantics_json")"
expected_schema_semantics_sha="$(node -e 'const fs=require("fs");const x=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));process.stdout.write(x.schema_semantics_sha256)' "$BACKUP_MANIFEST_FILE")"
[ "$schema_semantics_sha" = "$expected_schema_semantics_sha" ] || fail 'archive schema semantics differ from source manifest'
data_only_sql="$BACKUP_RESTORE_RUN_DIR/data-only.sql"
sandbox_pg_restore "$authorized_executor_app" --data-only --no-owner --no-acl > "$data_only_sql"
node "$repo_root/scripts/validate-knowledge-hub-data-only-copy.mjs" "$data_only_sql" >/dev/null || fail 'archive data-only COPY framing rejected'
expected_pg_restore_version_sha="$(node -e 'const fs=require("fs");const x=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));process.stdout.write(x.producer.pg_restore_version_sha256)' "$BACKUP_MANIFEST_FILE")"
[ "$(pg_restore --version | tr -d '\r\n' | sha256sum | awk '{print $1}')" = "$expected_pg_restore_version_sha" ] || fail 'target pg_restore version differs from source producer'
verify_target_state
restore_created=true
database_dropped=false
append_recovery DATABASE_CREATE_STARTED || fail 'database-create intent journal update failed'
create_remaining="$(effect_deadline_seconds)"
PGPASSFILE="$pgpass_file" timeout --foreground --kill-after=1s "$create_remaining" createdb --host="$PGHOST" --port="$PGPORT" --username="$PGADMINUSER" --owner="$PGRESTOREUSER" "$RESTORE_TARGET_DATABASE"
append_recovery DATABASE_CREATED || fail 'database recovery journal update failed'
verify_target_state
restore_remaining="$(effect_deadline_seconds)"
exec 7<"$tmp_plain"
exec 8<"$restore_pgpass_file"
timeout --foreground --kill-after=1s "$restore_remaining" setpriv --reuid="$sandbox_uid" --regid="$sandbox_gid" --clear-groups --no-new-privs --inh-caps=-all --ambient-caps=-all --bounding-set=-all \
  env -i PATH="$PATH" HOME="$sandbox_home" LANG=C.UTF-8 LC_ALL=C.UTF-8 PGAPPNAME="$authorized_executor_app" PGPASSFILE=/proc/self/fd/8 \
  pg_restore --host="$PGHOST" --port="$PGPORT" --username="$PGRESTOREEXECUTOR" --role="$PGRESTOREUSER" --dbname="$RESTORE_TARGET_DATABASE" --no-owner --no-acl --exit-on-error --single-transaction /proc/self/fd/7 &
restore_pid=$!
exec 7<&-
exec 8<&-
while kill -0 "$restore_pid" 2>/dev/null; do
  sleep 0.1
  if ! ( verify_target_state 1 ) >/dev/null 2>&1; then kill "$restore_pid" 2>/dev/null || true; wait "$restore_pid" || true; fail 'target authority, role/session isolation or cluster fence changed during restore'; fi
done
wait "$restore_pid"
verify_target_state
read_remaining="$(effect_deadline_seconds)"
restored_counts_json="$(PGPASSFILE="$pgpass_file" timeout --foreground --kill-after=1s "$read_remaining" psql --quiet --host="$PGHOST" --port="$PGPORT" --username="$PGADMINUSER" --dbname="$RESTORE_TARGET_DATABASE" --tuples-only --no-align --command="SET ROLE \"$PGRESTOREUSER\"; SELECT json_build_object('evidence_events',(SELECT count(*) FROM evidence_events),'delivery_receipts',(SELECT count(*) FROM delivery_receipts),'client_policies',(SELECT count(*) FROM client_policies),'api_credentials',(SELECT count(*) FROM api_credentials),'schema_migrations',(SELECT count(*) FROM schema_migrations))::text")"
read_remaining="$(effect_deadline_seconds)"
restored_migration_set="$(PGPASSFILE="$pgpass_file" timeout --foreground --kill-after=1s "$read_remaining" psql --quiet --host="$PGHOST" --port="$PGPORT" --username="$PGADMINUSER" --dbname="$RESTORE_TARGET_DATABASE" --tuples-only --no-align --command="SET ROLE \"$PGRESTOREUSER\"; SELECT string_agg(migration_name || ':' || checksum, ',' ORDER BY migration_name) FROM schema_migrations")"
restored_migration_set_sha256="$(printf '%s' "$restored_migration_set" | sha256sum | awk '{print $1}')"
node -e 'const fs=require("fs");const manifest=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));const actual=JSON.parse(process.argv[2]);if(JSON.stringify(manifest.table_counts)!==JSON.stringify(actual))process.exit(1);if(manifest.migration_set_sha256!==process.argv[3])process.exit(1)' "$BACKUP_MANIFEST_FILE" "$restored_counts_json" "$restored_migration_set_sha256" || fail 'restored table counts or migration set differ from source manifest'
verify_target_state
drop_remaining="$(effect_deadline_seconds)"
PGPASSFILE="$pgpass_file" timeout --foreground --kill-after=1s "$drop_remaining" dropdb --host="$PGHOST" --port="$PGPORT" --username="$PGADMINUSER" "$RESTORE_TARGET_DATABASE"
restore_created=false
database_dropped=true
append_recovery DATABASE_DROPPED || fail 'database-drop recovery journal update failed'
database_remaining="$(PGPASSFILE="$pgpass_file" psql --host="$PGHOST" --port="$PGPORT" --username="$PGADMINUSER" --dbname="$PGDATABASE" --tuples-only --no-align --command="SELECT 1 FROM pg_database WHERE datname = '$RESTORE_TARGET_DATABASE'")"
[ -z "$database_remaining" ] || fail 'restore database remains after drop'
verify_target_state
rm -f "$tmp_plain"
[ ! -e "$tmp_plain" ] || fail 'temporary plaintext remains'
temporary_plaintext_deleted=true
append_recovery PLAINTEXT_DELETED || fail 'plaintext-delete recovery journal update failed'

completed_epoch="$(date -u +%s)"
completed_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
[ "$completed_epoch" -lt "$authority_deadline_epoch" ] || fail 'target authority expired before final Evidence materialization'
verify_target_state
"$TRUSTED_NODE_BIN" "$repo_root/scripts/verify-knowledge-hub-rehearsal-target-authorization.mjs" historical-source-bundle "$BACKUP_RESTORE_RUN_DIR" >/dev/null || fail 'embedded historical source authority audit failed before PASS'
duration_seconds="$((completed_epoch - started_epoch))"
host_binding_sha256="$(printf '%s:%s' "$PGHOST" "$PGPORT" | sha256sum | awk '{print $1}')"
age_version_sha256="$(age --version 2>&1 | sha256sum | awk '{print $1}')"
postgres_tools_version_sha256="$({ PGPASSFILE="$pgpass_file" psql --version; PGPASSFILE="$pgpass_file" pg_restore --version; } 2>&1 | sha256sum | awk '{print $1}')"
cat > "$evidence_tmp" <<EOF
{
  "schema_version": "1.0",
  "result": "LOCAL_ENCRYPTED_BACKUP_RESTORE_REHEARSAL_PASS",
  "target": {"environment": "NON_PRODUCTION_REHEARSAL", "authorization_receipt_sha256": "$authorization_receipt_sha256", "cluster_system_identifier_sha256": "$cluster_system_identifier_sha256", "host_binding_sha256": "$host_binding_sha256"},
  "backup": {"plaintext_sha256": "$plaintext_sha256", "plaintext_bytes": $plaintext_bytes, "ciphertext_sha256": "$ciphertext_sha256", "ciphertext_bytes": $ciphertext_bytes},
  "encryption": {"format": "age-v1", "recipient_fingerprint_sha256": "$recipient_fingerprint_sha256", "identity_material_in_evidence": false},
  "restore": {"database": "$RESTORE_TARGET_DATABASE", "table_counts": $restored_counts_json, "migration_set_sha256": "$restored_migration_set_sha256", "plaintext_hash_verified": true, "database_dropped": true, "temporary_plaintext_deleted": true},
  "provenance": {"run_id": "$RUN_ID", "source_sidecar_sha256": "$sidecar_sha256", "source_manifest_sha256": "$source_manifest_sha256", "source_commit_sha256": "$source_commit_sha256", "code_revision": "$CODE_REVISION", "age_version_sha256": "$age_version_sha256", "postgres_tools_version_sha256": "$postgres_tools_version_sha256", "started_at": "$started_at", "duration_seconds": $duration_seconds},
  "effects": {"offsite_uploaded": false, "production_database_mutated": false, "production_certificate_issued": false, "product_credential_issued": false},
  "completed_at": "$completed_at"
}
EOF
node "$repo_root/scripts/validate-knowledge-hub-remaining-deployment-gates.mjs" backup "$evidence_tmp" >/dev/null
verify_target_state
post_effect_file="$AUTHORIZATION_CONSUMPTION_DIR/$authorized_execution_nonce_sha.post-effect.json"
evidence_incomplete_sha256="$(sha256sum "$evidence_tmp" | awk '{print $1}')"
safe_journal_entry_sha256="$(node -e 'const fs=require("fs");const lines=fs.readFileSync(process.argv[1],"utf8").trimEnd().split("\n");const x=JSON.parse(lines.at(-1));if(x.phase!=="PLAINTEXT_DELETED"||x.database_created!==false||x.database_dropped!==true||x.temporary_plaintext_deleted!==true)process.exit(1);process.stdout.write(x.entry_sha256)' "$journal_file")" || fail 'safe post-effect journal terminal unavailable'
post_effect_completed_epoch="$(date -u +%s)"
post_effect_completed_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
[ "$post_effect_completed_epoch" -lt "$authority_deadline_epoch" ] || fail 'target authority expired before post-effect completion receipt'
node -e 'const fs=require("fs"),path=require("path");const [file,runId,authority,nonce,evidence,journal,completed,expires]=process.argv.slice(1);if(Date.parse(completed)>=Date.parse(expires))throw Error("post-effect completion is not before authority expiry");const value={schema_version:"1.0",result:"REHEARSAL_POST_EFFECT_COMPLETED",run_id:runId,authority_receipt_sha256:authority,execution_nonce_sha256:nonce,evidence_sha256:evidence,recovery_journal_safe_entry_sha256:journal,database_absent:true,temporary_plaintext_absent:true,completed_at:completed};const bytes=Buffer.from(`${JSON.stringify(value)}\n`);const fd=fs.openSync(file,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW,0o600);try{fs.writeFileSync(fd,bytes);fs.fsyncSync(fd)}finally{fs.closeSync(fd)}const dir=fs.openSync(path.dirname(file),"r");try{fs.fsyncSync(dir)}finally{fs.closeSync(dir)}' "$post_effect_file" "$RUN_ID" "$authorization_receipt_sha256" "$authorized_execution_nonce_sha" "$evidence_incomplete_sha256" "$safe_journal_entry_sha256" "$post_effect_completed_at" "$authorized_expires_at" || fail 'durable post-effect completion receipt failed'
snapshot_ordinary "$post_effect_file" "$inputs_dir/post-effect-completion.json" || fail 'post-effect completion snapshot failed'
[ "$(sha256sum "$post_effect_file" | awk '{print $1}')" = "$(sha256sum "$inputs_dir/post-effect-completion.json" | awk '{print $1}')" ] || fail 'post-effect completion snapshot mismatch'
commit_remaining="$(effect_deadline_seconds)"
timeout --foreground --kill-after=1s "$commit_remaining" "$TRUSTED_NODE_BIN" "$repo_root/scripts/commit-knowledge-hub-backup-rehearsal-bundle.mjs" commit canonical "$BACKUP_RESTORE_RUN_DIR" "$REHEARSAL_TARGET_AUTHORIZATION_FILE" "$BACKUP_MANIFEST_FILE" >/dev/null
verify_target_state
validate_remaining="$(effect_deadline_seconds)"
timeout --foreground --kill-after=1s "$validate_remaining" "$TRUSTED_NODE_BIN" "$repo_root/scripts/commit-knowledge-hub-backup-rehearsal-bundle.mjs" validate canonical "$BACKUP_RESTORE_RUN_DIR" "$REHEARSAL_TARGET_AUTHORIZATION_FILE" "$BACKUP_MANIFEST_FILE" >/dev/null
verify_target_state
"$TRUSTED_NODE_BIN" "$repo_root/scripts/verify-knowledge-hub-rehearsal-target-authorization.mjs" historical-target-bundle "$BACKUP_RESTORE_RUN_DIR" >/dev/null || fail 'embedded historical target authority audit failed before PASS'
run_succeeded=true
evidence_sha256="$(sha256sum "$evidence_final" | awk '{print $1}')"
trap - EXIT INT TERM
printf 'LOCAL_ENCRYPTED_BACKUP_RESTORE_REHEARSAL_PASS run_dir=%s evidence=%s evidence_sha256=%s offsite_uploaded=false\n' "$BACKUP_RESTORE_RUN_DIR" "$evidence_final" "$evidence_sha256"
