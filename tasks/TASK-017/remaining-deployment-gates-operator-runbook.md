# TASK-017 Remaining Deployment Gates — Operator Runbook

Status: `DESIGN_ONLY / NO_EXTERNAL_EFFECT_AUTHORITY`

This runbook prepares a future, separately authorized non-production backup/restore rehearsal. It does not authorize VPS login, DNS registration, firewall changes, Let’s Encrypt issuance, Production activation, credentials, Product pilot or remote backup.

## 1. Immutable prerequisites

- Install the exact committed repository revision at `/opt/bai-development-os` as root. The repository, `.git`, harness, every invoked helper and all ancestors must be root-owned and not group/other writable. Never run the root harness from a developer checkout or other user-writable workspace.
- Materialize `deploy/knowledge-hub/runtime/node_modules` only with `npm ci --omit=dev --ignore-scripts --no-audit --no-fund` against the committed runtime lock; the backup producer refuses an absent `pg@8.13.1` runtime.
- Run on a Linux host where the required commands and every ancestor directory are root-owned and not group/other writable.
- Disable swap completely for both source and restore. Encrypted swap is not an accepted alternative in this version. Set and verify core size zero.
- Use the checked-in root-owned systemd oneshot units. They create an isolated network namespace with only loopback and remove privileged environment-injection variables before the shell or Node interpreter starts.
- The restore role has the exact restricted attribute tuple required by the harness, no role/database settings and no direct or inherited role membership.
- Run the rehearsal harness only through the privileged root executor from that immutable installation. `BACKUP_RESTORE_ROOT` is canonical, root-owned and mode 0700; its ancestors are protected.
- `AUTHORIZATION_CONSUMPTION_DIR` is root-owned and mode 0700. Both source/restore plaintext staging roots are private root-owned canonical directories on tmpfs.
- No Production database, Product credential, public listener or external upload is in scope.

## 2. Canonical authority controls

Install atomically, as root, all three control files and the lock:

1. `/etc/bai-development-os/knowledge-hub/rehearsal-authority-trust-root.json`
2. `/etc/bai-development-os/knowledge-hub/rehearsal-authority-revocations.json`
3. `/etc/bai-development-os/knowledge-hub/rehearsal-authority-head.json`
4. `/etc/bai-development-os/knowledge-hub/rehearsal-authority.lock`

Files and ancestor directories must be root-owned, non-symlink and not group/other writable. Create the lock with `sudo install -o root -g root -m 0600 /dev/null /etc/bai-development-os/knowledge-hub/rehearsal-authority.lock`. The head binds the exact trust-root and revocation bytes. Head and revocation timestamps must be current within 24 hours. Every update must first take `flock --exclusive` on the lock, then use write-new, fsync, atomic rename and directory fsync; never edit in place. Source/restore/recovery units hold the shared side for their full run.

Install the execution boundary:

```bash
sudo install -o root -g root -m 0644 deploy/knowledge-hub/systemd/bai-knowledge-hub-source-backup.service /etc/systemd/system/
sudo install -o root -g root -m 0644 deploy/knowledge-hub/systemd/bai-knowledge-hub-restore-rehearsal.service /etc/systemd/system/
sudo install -o root -g root -m 0644 deploy/knowledge-hub/systemd/bai-knowledge-hub-rehearsal-recovery.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemd-analyze verify /etc/systemd/system/bai-knowledge-hub-*.service
node deploy/knowledge-hub/systemd/validate-rehearsal-recovery-environment.mjs --lint-template deploy/knowledge-hub/systemd/rehearsal-recovery.env.example
```

## 3. Source backup

Place only non-secret coordinates in root-owned mode-0600 `/run/bai-development-os/knowledge-hub/source-backup.env`; secret PostgreSQL material stays in root-owned `PGPASSFILE`. Required values include `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSFILE`, canonical `BACKUP_DIR`, `BAI_CODE_REVISION`, absolute `BAI_NODE_BIN`, `BAI_PG_DUMP_BIN`, `BAI_PG_RESTORE_BIN`, `BAI_AGE_BIN`, tmpfs `BAI_BACKUP_PLAINTEXT_TMPFS_ROOT`, `AGE_RECIPIENT`, signed `BACKUP_SOURCE_AUTHORIZATION_FILE` and `SOURCE_AUTHORIZATION_CONSUMPTION_DIR`. The receipt must bind the actual cluster/database, recipient, output/tmpfs/ledger identities and measured toolchain/network facts.

```bash
sudo sh -c 'ulimit -c 0; test "$(ulimit -c)" = 0'
sudo awk 'NR > 1 { bad=1 } END { exit bad ? 1 : 0 }' /proc/swaps
sudo systemctl start bai-knowledge-hub-source-backup.service
sudo systemctl show -p Result,ExecMainStatus bai-knowledge-hub-source-backup.service
sudo journalctl -u bai-knowledge-hub-source-backup.service --since '5 minutes ago' --no-pager
```

The producer rejects a mutable toolchain/dependency tree, holds one read-only exported snapshot while `pg_dump --snapshot` and all manifest queries run, validates the exact archive inventory, age-encrypts it and removes plaintext before any final source file is published. A usable source run contains:

- `knowledge-hub.dump.age`
- `knowledge-hub.dump.age.sha256`
- `knowledge-hub.dump.age.manifest.json`
- `COMMITTED.json`

Any `.incomplete` file or missing/invalid marker is quarantine, not retry input. Preserve it for incident review and choose a fresh run.

Source plaintext recovery is explicit. `PLAINTEXT-RECOVERY.json` contains the root-only tmpfs locator while cleanup is pending. A normal exit replaces that pending state with `PLAINTEXT-RECOVERY-CLOSED.json`; `PLAINTEXT-RECOVERY-QUARANTINED.json` means the path may still exist. After an abrupt stop, use a separately authorized root recovery operation to read the locator, verify it remains under the selected private tmpfs root, hash/quarantine or delete the exact file, remove only the exact empty per-run directory, verify both are absent, and publish a distinct recovery receipt. Never infer cleanup from the process exit code.

## 4. Rehearsal environment values

The harness requires: `BACKUP_FILE` (the committed `.age` file), `BACKUP_SHA256_FILE`, `BACKUP_MANIFEST_FILE`, `BACKUP_SOURCE_COMMIT_FILE`, `AGE_RECIPIENT`, `AGE_IDENTITY_FILE`, `REHEARSAL_TARGET_AUTHORIZATION_FILE`, `AUTHORIZATION_CONSUMPTION_DIR`, `PLAINTEXT_TMPFS_ROOT`, `BACKUP_RESTORE_ROOT`, `BACKUP_RESTORE_RUN_DIR=$BACKUP_RESTORE_ROOT/$RUN_ID`, `RUN_ID`, `CODE_REVISION`, `RESTORE_TARGET_DATABASE`, `PGHOST`, `PGPORT`, `PGDATABASE`, `PGADMINUSER`, `PGRESTOREUSER`, `PGPASSFILE`, and exact acknowledgement `BAI_BACKUP_RESTORE_ACK=BACKUP_RESTORE_REHEARSAL_ONLY`.

Do not place secret values in shell history, logs or Evidence. Write the required coordinates to root-owned mode-0600 `/run/bai-development-os/knowledge-hub/restore-rehearsal.env`; keep age identity and pgpass in separate root-owned mode-0600 files. Do not invoke the shell directly or through an ambient `sudo -E` environment.

```bash
sudo systemctl start bai-knowledge-hub-restore-rehearsal.service
sudo systemctl show -p Result,ExecMainStatus bai-knowledge-hub-restore-rehearsal.service
sudo journalctl -u bai-knowledge-hub-restore-rehearsal.service --since '10 minutes ago' --no-pager
```

Before parsing, the unit/harness snapshots the signed authorization, ciphertext, sidecar, manifest and source commit through no-follow file descriptors into the root-only run directory; all later reads use only that single generation.

## 5. Terminal interpretation

- Only a bundle whose journal ends `BUNDLE_COMMITTED` and whose `COMMITTED.json` and `COMMIT-DURABLE.json` both pass canonical validation is PASS. The durable receipt binds the terminal journal entry hash.
- `failure.json` without a valid durable completion receipt is failure Evidence.
- Marker visibility alone never suppresses failure publication; the durable receipt is written only after constituent validation and file/directory flushes.
- The run directory never retains the plaintext source dump; only ciphertext, public provenance, source sidecar/manifest/commit metadata, signed authorization and bounded logs are retained.
- Temporary decrypted plaintext must be absent and the isolated database must be absent before PASS.
- Never auto-retry a failed RUN_ID or reuse its nonce. Inspect `recovery-journal.jsonl` with `sudo node scripts/write-knowledge-hub-rehearsal-recovery-journal.mjs inspect <absolute-journal-path>`. A `FAILED` run can enter `RECOVERED` only through `bai-knowledge-hub-rehearsal-recovery.service`, a distinct signed recovery receipt and live filesystem/PostgreSQL absence proof. If the database or plaintext still exists, the recovery command stops; deletion/drop requires a separately reviewed destructive recovery packet. After `RECOVERED`, use a fresh authorization/run ID.

## 6. Canonical recovery handoff

Recovery is verify-and-seal only. It never drops a database or deletes plaintext. Start by choosing the exact failed run directory and installing the checked-in environment template as a root-only runtime file. Replace every `CHANGE-ME` token before continuing.

```bash
RECOVERY_RUN_ID=CHANGE-ME
RECOVERY_RUN_DIR=/var/lib/bai-development-os/knowledge-hub/rehearsals/$RECOVERY_RUN_ID
sudo install -d -o root -g root -m 0700 /run/bai-development-os/knowledge-hub
sudo install -o root -g root -m 0600 /opt/bai-development-os/deploy/knowledge-hub/systemd/rehearsal-recovery.env.example /run/bai-development-os/knowledge-hub/rehearsal-recovery.env
sudoedit /run/bai-development-os/knowledge-hub/rehearsal-recovery.env
test "$(sudo stat -c '%U:%G:%a' /run/bai-development-os/knowledge-hub/rehearsal-recovery.env)" = root:root:600
sudo /usr/bin/node /opt/bai-development-os/deploy/knowledge-hub/systemd/validate-rehearsal-recovery-environment.mjs --lint-template /run/bai-development-os/knowledge-hub/rehearsal-recovery.env
```

The environment file must contain exactly these eight literal `KEY=value` assignments; quoted values, shell expansion, commands, extra keys and raw passwords are rejected:

| Key | Required value |
| --- | --- |
| `RECOVERY_JOURNAL_FILE` | Absolute `$RECOVERY_RUN_DIR/recovery-journal.jsonl` path |
| `RECOVERY_AUTHORIZATION_FILE` | Absolute root-owned mode-0600 signed recovery receipt path |
| `BAI_RECOVERY_PSQL_BIN` | Receipt-bound absolute canonical root-protected versioned client, for example `/usr/lib/postgresql/16/bin/psql`; do not use a symlink or `pg_wrapper` |
| `PGHOST` | Absolute local PostgreSQL Unix-socket directory |
| `PGPORT` | Exact socket port, `1..65535` |
| `PGADMINUSER` | Restricted recovery probe identity supplied by the recovery packet |
| `PGDATABASE` | Maintenance database used only for the live absence query |
| `PGPASSFILE` | Absolute root-owned mode-0600 pgpass path; never place its contents in the env file |

Run the read-only preflight. These commands verify the journal state, file ownership/modes, mount resolution and socket presence before systemd starts the canonical verifier. A PASS here does not authorize deletion or database mutation.

```bash
sudo test -f "$RECOVERY_RUN_DIR/recovery-journal.jsonl"
test "$(sudo stat -c '%U:%G:%a' "$RECOVERY_RUN_DIR/recovery-journal.jsonl")" = root:root:600
sudo findmnt --noheadings --target "$RECOVERY_RUN_DIR/recovery-journal.jsonl"
sudo findmnt --noheadings --target /run/bai-development-os/knowledge-hub/rehearsal-recovery.env
sudo /usr/bin/node /opt/bai-development-os/scripts/write-knowledge-hub-rehearsal-recovery-journal.mjs inspect "$RECOVERY_RUN_DIR/recovery-journal.jsonl"
sudo /usr/bin/node /opt/bai-development-os/deploy/knowledge-hub/systemd/validate-rehearsal-recovery-environment.mjs /run/bai-development-os/knowledge-hub/rehearsal-recovery.env
```

The journal must end at `FAILED`, and the distinct signed receipt must bind the exact pre-recovery journal bytes, run/database, socket/cluster, plaintext path digest and `psql` binary. Start the oneshot and verify both systemd and journal terminal truth:

```bash
sudo systemctl start bai-knowledge-hub-rehearsal-recovery.service
sudo systemctl status bai-knowledge-hub-rehearsal-recovery.service --no-pager
sudo systemctl show -p Result,ExecMainStatus bai-knowledge-hub-rehearsal-recovery.service
sudo journalctl -u bai-knowledge-hub-rehearsal-recovery.service --since '10 minutes ago' --no-pager
sudo /usr/bin/node /opt/bai-development-os/scripts/write-knowledge-hub-rehearsal-recovery-journal.mjs inspect "$RECOVERY_RUN_DIR/recovery-journal.jsonl"
```

PASS requires `Result=success`, `ExecMainStatus=0`, tool output `phase=RECOVERED`, and the final inspect output `requires_recovery=false`. Preserve the journal, receipt and service log together. Remove the runtime env and pgpass only under the approved secret-cleanup procedure.

If preflight or recovery reports that plaintext or the database still exists, stop. Record the exact run ID, journal SHA-256, signed recovery receipt SHA-256, database name, cluster/socket digests, plaintext locator digest, observed presence and failed command in a new destructive-recovery decision packet. Obtain separate Owner authorization for the precise `dropdb` and/or exact contained-path deletion. Do not edit the journal, reuse the rehearsal receipt, improvise a wildcard deletion or restart the failed RUN_ID. After the separately authorized cleanup, issue a fresh `VERIFY_ABSENT_AND_SEAL` receipt bound to the then-current failed journal and rerun only this recovery unit.

## 7. External route after repository acceptance

The shortest operational order is: authorized staging TLS rehearsal → authenticated Owner certificate-decision packet → DNS registration → Let’s Encrypt Production certificate/renewal Evidence → authenticated limited-pilot decision. Each arrow is a separate Gate. Prepared VPS and domain availability do not collapse those Gates.
