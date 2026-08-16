# TASK-017 Knowledge Hub Remaining Deployment Gates Detailed Design Ver.1.0

Status: `WIP_CHECKPOINT / OPEN_CRITIC_FINDINGS / FINAL_JUDGE_NOT_PASS / EXTERNAL_EFFECTS_BLOCKED`

## 1. Purpose and current facts

This unit resumes the bounded repository-local TASK-017 Phase 0 work after TASK-018 and TASK-020 implementation. It reconstructs the lost Remaining Deployment Gates change from current canonical state; the missing patch and missing source commit are not Evidence.

Owner-supplied environment facts on 2026-08-16 are recorded as declarations, not independently verified runtime Evidence:

- an external VPS is already prepared;
- a DNS domain is being acquired and the exact FQDN is not yet bound;
- the selected certificate provider is Let’s Encrypt.
- the Owner can later provide SSH private-key login and server-administration authority, but no key path, host/user binding or remote-effect receipt has been supplied to this repository unit.

The supplied `BAI-DEVELOPMENT-HUB_サーバー構築_実行手順書_Ver5.0.md` is reference input. Its commands do not authorize VPS, DNS, firewall, credential, ACME, deployment or pilot effects. The current plan uses a DNS hostname and Let’s Encrypt; earlier IP-certificate language is not the selected Production route.

## 2. Authority and effect boundary

Authorized here: repository source, schema, tests, documentation and deterministic local validation. Not authorized or performed:

- VPS login or mutation, DNS purchase/registration, firewall/public-listener changes;
- Let’s Encrypt Production issuance or renewal setup;
- remote/offsite upload, retention or restore;
- Production credential issuance, Product ingestion or user Evidence collection;
- Release, Tag, Deploy, Production Activation or direct push to `main`.

Shape validation is never Authority validation. Runtime mutation requires a signed, current, non-revoked authorization receipt verified against an independently protected trust root and revocation registry.

## 3. Dependency graph

```text
repository implementation
  -> signed non-production source-backup authorization contract
  -> signed non-production target authorization contract
  -> source backup manifest contract
  -> local encrypted restore rehearsal (future explicit execution)
  -> crash-consistent committed rehearsal bundle
  -> certificate decision-readiness packet
  -> Owner Production certificate decision (external Gate)
  -> DNS + Let’s Encrypt Production TLS Evidence (external effect Gate)
  -> limited Product pilot decision-readiness packet
  -> Owner limited pilot decision (external Gate)
```

Raw `PRODUCTION_TLS_ACTIVATION_PASS` JSON cannot promote a pilot decision. The repository shape validator remains available for closed receipt validation, but the certificate and pilot builders fail closed until a canonical Owner authority verifier, latest signed prerequisite registry and authentic Production TLS verifier are materialized. A pending certificate-decision packet cannot be used as Production TLS Evidence.

## 4. Authentic non-production target authority

The target receipt binds issuer, authority ID/epoch, exact revocation-registry SHA-256, run ID, restore database, age-recipient fingerprint, runner code revision, one-time execution nonce, consumption-ledger directory identity, cluster system-identifier SHA-256, boot ID, network namespace and complete network-policy digest, PostgreSQL socket endpoint identity, protected-toolchain manifest SHA-256, backup plaintext SHA-256, source-manifest SHA-256, restricted restore role, issue/expiry time and non-production boundaries. Its canonical payload is SHA-256 hashed and Ed25519 signed.

Verification requires four separately materialized files:

1. signed target receipt;
2. protected trust-root receipt at `/etc/bai-development-os/knowledge-hub/rehearsal-authority-trust-root.json` containing the expected issuer and Ed25519 public key;
3. current revocation registry at `/etc/bai-development-os/knowledge-hub/rehearsal-authority-revocations.json` whose bytes match the receipt coordinate and epoch.
4. current authority head at `/etc/bai-development-os/knowledge-hub/rehearsal-authority-head.json`, binding the trust-root and revocation-registry hashes and current epoch.

All three control files and every ancestor directory must be root-owned, non-symlink and not group/other writable. Each file is opened with no-follow semantics, verified and read through one file descriptor; caller-selected look-alike trust roots are rejected. The head and revocation registry expire after 24 hours. Source, restore and recovery operations hold a shared lease on the root-protected canonical authority lock for their whole execution. Authority-state publication must hold the exclusive side of the same lock, so revocation/head replacement cannot race an authorized effect boundary.

The privileged source wrapper uses fixed `/usr/bin/node` to bootstrap authority verification before it trusts the caller-selected runtime variables. The signed toolchain digest covers the complete revision-bound producer/helper source graph and the materialized runtime dependency tree, including `node_modules`. Source authorization, consumption, trust-root, revocation and head bytes are retained as exact bundle constituents. Historical verification checks those signed bytes at the recorded effect time and always returns `audit_only=true` and `execution_authority=false`; it cannot mint a current execution token.

Unknown issuer, forged signature, content drift, stale epoch, expired receipt, revocation, wrong run/database/recipient/revision, wrong cluster, wrong backup/manifest or wrong role rejects before `createdb`. Before the first database effect, the exact nonce is consumed with create-exclusive, file fsync and directory fsync in the receipt-bound private ledger. Replay rejects. Authority and all measured target facts are revalidated before and after each database effect and again before bundle commit. No keypair or authorization instance is created by this implementation.

## 5. Backup source closure

`backup-postgres.sh` first verifies and consumes a separately signed source-backup authorization. That receipt binds the exact source database/cluster/socket, age recipient, persistent output-root inode, tmpfs root, code revision, toolchain, boot/network namespace/policy, one-time nonce and private consumption ledger. Receipt absence, expiry, revocation, replay or any binding drift rejects before a database connection. It then delegates to the transaction-aware producer inside the locked Knowledge Hub runtime, where exact `pg@8.13.1` dependencies have been materialized from the canonical lock with `npm ci`. A read-only `REPEATABLE READ` transaction exports one PostgreSQL snapshot; `pg_dump --snapshot` and all manifest queries consume that exact snapshot. The custom-format plaintext exists only in an execution-user private tmpfs directory. After TOC/schema inspection it is encrypted with age, removed and read back as absent before the transaction closes. Only encrypted backup bytes, exact SHA sidecar, closed source manifest and committed source marker are published to persistent storage. The manifest binds:

- plaintext SHA-256/bytes and ciphertext SHA-256/bytes;
- age recipient fingerprint and `plaintext_persisted=false`;
- exact raw `pg_restore --list` and `pg_restore --schema-only` output SHA-256;
- PostgreSQL cluster system-identifier SHA-256;
- exact counts for `evidence_events`, `delivery_receipts`, `client_policies`, `api_credentials`, `schema_migrations`;
- deterministic ordered migration-name/checksum set SHA-256;
- exported snapshot identifier SHA-256;
- producer code revision/source hash, runtime lock hash, complete materialized dependency-tree hash, and actual Node/pg_dump/pg_restore/age binary and version hashes;
- source-authorization and nonce-consumption receipt hashes;
- creation time.

The signed target receipt binds plaintext identity and the exact manifest; the manifest binds the encrypted bytes. A sidecar, manifest or digest cannot replace actual ciphertext bytes. Source authorization is limited to a maximum 24-hour window. Its consumption record fixes the effect deadline, long-running `pg_dump` and `age` children are killed when that deadline is crossed, and no final source commit may be published at or after expiry.

## 6. Isolated restore rehearsal

The only supported privileged launch boundary is the checked-in root-owned systemd oneshot unit. It removes `BASH_ENV`, `ENV`, `NODE_OPTIONS`, `NODE_PATH`, `LD_*`, `PGOPTIONS` and `PGSERVICE*` before execution, uses fixed absolute interpreters, sets core limit zero, requires swap to be disabled, provides a private network namespace and holds the authority lock. The shell repeats these checks before its first data effect; direct caller-environment execution is unsupported and fail-closed.

The harness requires a new mode-0700 run directory, private authorization-consumption ledger, private tmpfs plaintext root, private `age` identity and `PGPASSFILE`, restricted `NOLOGIN` restore role and an authorization-bound database name ending in `_restore_rehearsal`. Secret files and every ancestor must be regular/root-protected and inaccessible to group/other users. Ambient `PGPASSWORD` is removed.

Before restore, `pg_restore --list` must equal the exact 30-coordinate Phase-0 Hub schema inventory: session/boundary coordinates, schema, five named tables and table-data entries, two defaults, six constraints and six indexes, each exactly once. Extension, ACL, trigger, rule, function/procedure, foreign, publication/subscription, unknown object names, missing/duplicate coordinates and all prefix-collision classes reject. Raw TOC and schema-only SQL hashes must also equal the source manifest. The schema-only SQL parser is derived from root-trusted migration/bootstrap source hashes and requires the exact ordered columns, types, nullability, defaults, constraint bodies, index methods/keys/predicates and psql restrict pair; added `ALTER`, `COPY`, cluster/role/privilege or unknown statements reject. The restore role is `NOLOGIN`, has no password/valid-until state, settings, outbound memberships or direct/transitive inbound grantees. The disposable cluster must also have no pre-existing client or `SET ROLE` sessions. `pg_restore` connects through the administrator only to enter that restricted role. Every external executable, including the actual `/proc/$$/exe` interpreter, is resolved before secret input is read, must reside in a root-protected path and its canonical command/path/binary digest manifest must equal the signed target authorization.

Before and after create, restore and drop, the harness remeasures authority freshness, namespace, boot, routes/policy, socket endpoint inode, cluster system identifier, complete restricted-role tuple, settings, both membership directions and session isolation. Every effect is deadline-bounded with a five-second finalization reserve; the restore process is watched at 100 ms intervals and killed on fence drift. After restore, all five table counts and the migration-set digest must equal the source manifest. Database absence and tmpfs plaintext deletion are read back before PASS. Failure produces no PASS bundle and preserves an fsync-backed failure receipt. No offsite effect occurs; the result is `LOCAL_ENCRYPTED_BACKUP_RESTORE_REHEARSAL_PASS`.

## 7. Crash-consistent publication

Before nonce consumption, a hash-chained recovery journal is durably created with the run ID, target database, target socket/cluster identities and planned tmpfs plaintext path. Pre-effect `*_CREATE_STARTED` phases conservatively mark the relevant resource at risk before plaintext/database creation. Each lifecycle phase is appended and fsynced. A crash therefore leaves a deterministic private recovery record; automatic cleanup is prohibited after process loss. `RECOVERED` can be minted only by the canonical recovery tool using a separate signed recovery receipt plus live PostgreSQL and filesystem absence probes.

Ciphertext and Evidence remain `.incomplete` until validation and cleanup finish. `commit-knowledge-hub-backup-rehearsal-bundle.mjs` verifies staged bytes with a canonical-only authority token, one-time consumption receipt and retained source sidecar/commit snapshots. It renames inside the reserved run directory and flushes files/directories. `COMMITTED.json` binds run ID, Evidence/ciphertext, nonce consumption, authorization ID/epoch/receipt/revocation and source manifest/sidecar/commit. The committer itself appends and fsyncs `BUNDLE_COMMITTED`, binds that terminal entry hash into `COMMIT-DURABLE.json`, performs the full self-contained authority/source/Evidence/time cross-check before durable publication, then fsyncs the durable receipt and directory. Restarting the same canonical commit after a crash may only finish an exactly reconstructable marker/journal/durable-incomplete boundary; it never redoes database, plaintext or network effects. Cleanup derives terminal truth from canonical validation; marker visibility alone cannot suppress a failure receipt.

Consumers must call `validateCommittedBackupRehearsalBundle`. Final-looking files without both valid terminal receipts, missing source/authorization constituents, hash drift or Evidence mismatch are not PASS. A crash at any pre-durable boundary therefore yields an incomplete/quarantined run, never accepted Evidence.

The publication classifier admits only an exact staged state or an exact marker-committed restart state. Cipher/evidence/marker partial combinations and marker-temporary state are explicitly `PARTIAL_PUBLICATION_QUARANTINE_REQUIRED`; they are never silently retried. Recovery uses a root-owned mode-0600 eight-key environment file validated by the systemd `ExecStartPre` helper. The operator runbook contains literal preflight, `findmnt`, service status/log, `RECOVERED` and destructive-handoff commands; destructive removal remains a separate Owner-authorized operation.

## 8. Certificate decision readiness

The decision builder parses the exact Public TLS Staging Evidence bytes, supplied runbook bytes and structured rollback/budget Evidence, but deliberately refuses to emit a decision receipt from those caller-supplied artifacts alone. Promotion requires a canonical Owner authority verifier and latest signed prerequisite registry. DNS hostnames must contain at least two valid labels; IP literals, single-label names and malformed DNS names reject.

No decision output is currently emitted. Production ACME, firewall and public-profile effects remain false. A later authenticated packet may only emit `decision=PENDING_OWNER_DECISION`; it cannot issue a certificate or activate the VPS.

## 9. Production TLS and limited pilot

Production TLS Evidence is a later external receipt requiring an exact authority receipt, DNS SAN and chain verification, certificate validity interval, Let’s Encrypt provider, TCP 80/443 only, private API/PostgreSQL/Caddy-admin non-exposure and renewal dry-run PASS.

Only those actual bytes can feed the pilot builder. Pilot privacy, deletion, credential-revocation and Product rollback artifacts must be structured, current, unsuperseded PASS Evidence for the exact Product. Limits are at most five installations, 1,000 events and fourteen days. Scopes are the sorted subset of `evidence:read`, `evidence:write`, `policy:read`.

The pilot packet remains `PENDING_OWNER_DECISION` and cannot issue credentials, ingest events or collect real-user Evidence.

## 10. Schemas and validators

The unit contains sixteen closed schemas for:

1. backup source manifest;
2. source-backup authorization;
3. source-authorization consumption;
4. target authorization;
5. recovery authorization;
6. authority trust root;
7. authority revocations;
8. authority current head;
9. Owner-anchored authority audit checkpoints;
10. post-effect completion;
11. restore rehearsal Evidence;
12. committed rehearsal bundle;
13. generic Gate prerequisite Evidence;
14. Production certificate decision readiness;
15. Production TLS Evidence;
16. limited Product pilot readiness.

Runtime validators enforce cross-field equality, exact RFC3339 UTC time, DNS rules, deep immutability, no-secret fields, closed Product scopes, cap ceilings and no-effect constants. Shape-only validation is intentionally distinct from signature/chain verification.

## 11. Tests and negative matrix

Focused tests cover valid receipts, deep freeze, forged/revoked/expired/epoch-mismatched authority, Owner-anchored historical verification, invalid calendar dates, exact run/recipient/nonce/ledger/post-effect bindings, partial restore, timing drift, cleanup/effect inflation, missing durable completion, canonical bundle constituent/cross-field mutation, wrong prerequisite type, pilot cap/scope/effect violations, all sixteen schemas through the formal Ajv Draft 2020-12 engine and required-field mutation matrix, the single-source exact 30-coordinate Hub archive inventory, migration-derived schema and data-only COPY semantics, source/target deadline and DB lease/session/backend fencing, publication-state classification, producer transaction ordering/failure, recovery-journal chain/truncation/transition/safety-state enforcement, exact environment-file contracts, hardened systemd boundaries and JavaScript syntax. Executable no-effect stubs force-kill `age` and database creation after their simulated effects and prove conservative journal state, no premature `RECOVERED`, and explicit signed recovery.

Current repository Evidence is focused `51 / 51 PASS` and Knowledge Hub full `119 / 119 PASS` using the required Git for Windows Bash tool path. Remediation remains a WIP checkpoint: the latest fixed-snapshot audits report Security `C0/H3/M3` and Runtime/Recovery `C0/H4/M1`, and no Final Judge PASS exists. Live Linux root/systemd/PostgreSQL/real-`age` rehearsal, VPS execution, DNS acquisition, Let’s Encrypt issuance and Product pilot remain environment Gates. Repository stubs do not claim those effects occurred.

## 12. Completion definition

Repository implementation completes when focused and full clean-worktree tests pass, three independent Critic audits close Critical/High/Medium findings, the Judge accepts the bounded implementation and canonical TASK/roadmap/Registry records match. Operational TASK-017 Phase 0 remains incomplete until separately authorized, materialized Environment Evidence exists.
