# TASK-004 Phase 5A — Final Plan Amendment Revision 01

## 1. Document Control

- Authoring Role: Builder
- Active Project / Task: `/home/baisound/projects/javascript-roulette` / `TASK-004`
- Scope: FPC-01 and FPC-02 only
- Result: `PHASE5A_FINAL_PLAN_REVISION_01_READY_WITH_CONDITIONS`
- Implementation Status: `NOT_AUTHORIZED`

## 2. Role Activation Record

- Active Role: Builder
- Session Name: `TASK-004 Phase 5A — Final Plan Amendment Revision 01`
- Runtime: `INLINE_CHAT_LINUX`; Foundation: `/home/baisound/projects/ai-team`; Project: `/home/baisound/projects/javascript-roulette`
- Builder/Evidence/Authority SHA-256: `f1e6fd8f…f590326`, `a81b6513…4759c6`, `38459f8a…0076d`
- Final Plan / consistency check SHA-256: `64612a4d…f7414cc` / `93d8a0ff…468583`
- Design/review/Owner/Judge evidence SHA-256: original `270645c7…7024880`; revisions `77ff8bc3…c3b3e0e`, `b24d252a…9465c8`, `1031548f…a8073ad`; re-review 03 `d08f3449…68330d62`; Owner `9809afb3…ed5cc10`; Judge `d7e90723…de4510f`
- Allowed File: `docs/ai-team/tasks/TASK-004/closure-final-plan-amendment-revision-01.md`
- Protected Files: all other paths.
- Role Activation Result: `READY`

Runtime check observed `HOME=/home/baisound`, `UNAME=Linux`, `PHASE5A_FINAL_PLAN_REV01_RUNTIME_COMPLETE`, exit `0`.

## 3. Revision Authority

Owner authorizes this new Builder Artifact only. It does not authorize correction of the original Amendment, implementation, tests, schemas, configuration, runtime state, or Git operations.

## 4. Source Evidence

Phase 1 source/test, package, and ignore boundary were read-only inputs (`d37d8234…51801b7`, `756c44bf…fef236`, `c4105b43…ffc4b831`, `f5befb30…baeb6e`). The project uses ESM `.mjs`, Node built-in tests, and the approved Phase 1 fixture boundary remains protected.

## 5. FPC-01 Exact Finding

- ID / Severity / Status: `FPC-01` / `HIGH` / `OPEN`
- Affected sections: original Amendment §§9, 11–12, 18–25, 29.
- Missing: exact schema field contracts, distinct PREPARED/COMMITTED Event schemas, API input/output/error contracts, field-level checksum projections, and wildcard-free implementation allowlist.
- Risk: an implementer would make unresolved schema, integrity, API, or scope decisions; H-03 could no longer be mechanically proven.
- Blocking reason: Judge requires a no-placeholder plan with exact schemas, checksum domains, API boundaries, and allowed files.
- Closure: Sections 6–12 of this Revision are mandatory replacements/supplements.
- Verification: schema/API/allowlist static review plus implementation test mapping.

## 6. Exact Source Architecture

All listed files are **NEW**; no existing source/test is modified.

| Path | Responsibility / exports | Reads / writes | Dependencies / errors | Test |
|---|---|---|---|---|
| `src/lifecycle/phase5a/index.mjs` | public exports only | none | all public modules | `phase5a-api.test.mjs` |
| `constants.mjs` | enums, paths, error constants, FaultPoint | none | none | `phase5a-constants.test.mjs` |
| `canonical.mjs` | canonical bytes, checksum, DAG validation | none | crypto; checksum/cycle errors | `phase5a-canonical.test.mjs` |
| `schemas.mjs` | loads/validates all schemas | none | canonical/errors | `phase5a-schema.test.mjs` |
| `durability.mjs` | durable file/JSONL/rename/directory operations | runtime files | fs promises; filesystem errors | `phase5a-durability.test.mjs` |
| `bootstrap.mjs` | state bootstrap | empty runtime root | durability/history; bootstrap errors | `phase5a-bootstrap.test.mjs` |
| `ledgers.mjs` | authorization/cost append and validation | ledger JSONL only | canonical/durability; ledger errors | `phase5a-ledgers.test.mjs` |
| `history-journal.mjs` | Global Log and transaction Journal | JSONL only | ledgers/durability; chain errors | `phase5a-history-journal.test.mjs` |
| `completion-builders.mjs` | request/readiness/auth, Payload/Manifest/Record/Markdown | staging generation; Markdown only | schemas/canonical; builder errors | `phase5a-builders.test.mjs` |
| `generation-store.mjs` | stage/publish/pointer/raw read | staging/generation/current pointer | durability; pointer errors | `phase5a-generation.test.mjs` |
| `completion-store.mjs` | orchestration, validated read, recovery, outbox | only contracts above | all Phase 5A modules | `phase5a-integration.test.mjs`, `phase5a-crash.test.mjs` |
| `faults.mjs` | test-only injector contract / default no-op | none | constants/errors | `phase5a-crash.test.mjs` |

`index.mjs` exports only public APIs in Section 7. `faults.mjs` is not exported from `index.mjs`; no environment variable, CLI argument, or runtime configuration may enable injection.

## 7. Exact API Contracts

All functions are `async`; each rejects `Phase5AError` with a code in Section 23.

| API / module | Signature and return | Side effect / authority / idempotency | Tests |
|---|---|---|---|
| `initializeProductionState` / `bootstrap.mjs` | `(root, bootstrapRequest, {durability,faults}) => BootstrapResult` | empty approved root only; Owner implementation scope; `bootstrap_id` | BOOT-01 |
| `submitCompletionRequest` / `completion-store.mjs` | `(root, request, actor, options) => CompletionAttemptResult` | full transaction; Owner COMPLETE_TASK; `request_id` | INT-01 |
| `validateCompletionReadiness` / `completion-builders.mjs` | `(request, evidence) => ClosureReadinessResult` | none; no authority; request checksum | READY-01 |
| `validateCompleteTaskAuthorization` / `ledgers.mjs` | `(root, authorization, request, now) => ValidAuthorization` | reads ledger; Owner authority; authorization ID | AUTH-01 |
| `reserveAuthorizationUsage` / `ledgers.mjs` | `(root, authorization, transactionId) => Reservation` | appends RESERVED; Owner authorization; authorization/transaction | AUTH-02 |
| `commitAuthorizationUsage` / `ledgers.mjs` | `(root, reservation, manifestChecksum) => Usage` | appends USED; same reservation only | AUTH-03 |
| `appendAuthorizationLedgerEntry` / `ledgers.mjs` | `(path, entry) => VerifiedLedgerEntry` | JSONL append only | AUTH-04 |
| `appendCostLedgerEntry` / `ledgers.mjs` | `(path, entry) => VerifiedLedgerEntry` | JSONL append only; Cost writer scope | COST-01 |
| `appendTransitionDurably` / `history-journal.mjs` | `(taskPaths, event) => VerifiedEvent` | Global Log append only | HIST-01 |
| `appendJournalEntryDurably` / `history-journal.mjs` | `(taskPaths, entry) => VerifiedJournalEntry` | transaction Journal append only | JOUR-01 |
| `buildImmutableCompletionPayload` / `completion-builders.mjs` | `(input) => Payload` | none; transaction identity | H03-01 |
| `buildImmutableBundleManifest` / `completion-builders.mjs` | `(input) => Manifest` | none; payload checksum | H03-02 |
| `publishGeneration` / `generation-store.mjs` | `(taskPaths, generation, pointer) => PublishedGeneration` | rename/pointer only; manifest checksum | H01-01 |
| `readRawCompletionState` / `generation-store.mjs` | `(root, taskId) => RawCompletionState` | no write; Owner recovery only | H01-02 |
| `readCanonicalTaskState` / `completion-store.mjs` | `(root, taskId) => ValidatedCanonicalReadResult` | no write; normal callers; pointer binding | H01-03 |
| `inspectCompletionRecoveryState` / `completion-store.mjs` | `(root, transactionId) => RecoveryInspection` | no write; Owner recovery only | REC-01 |
| `verifyCommitCertainty` / `completion-store.mjs` | `(taskPaths, pointer) => CommitCertaintyResult` | no write; manifest/transaction | H01-04 |
| `appendDurableOutboxEvent` / `completion-store.mjs` | `(taskPaths, event) => OutboxEvent` | immutable create only; outbox key | OUT-01 |
| `generateCompletionMarkdown` / `completion-builders.mjs` | `(recordJson, destination) => MarkdownResult` | derived write only; record checksum | REC-02 |
| `recoverCompletionTransaction` / `completion-store.mjs` | `(root, transactionId, recoveryAuthorization) => RecoveryResult` | only classified allowed write; Owner Recovery Authority | CR-01–CR-18 |

## 8. Exact Schema Inventory

All files are under `src/lifecycle/phase5a/schemas/`, root type `object`, draft 2020-12, `$id` `https://baisound.local/lifecycle/phase5a/<name>/1.2.0`, `additionalProperties:false`, canonical key order lexicographic, and version `1.2.0`.

| File | Required fields (optional fields) | checksum / producer → consumer |
|---|---|---|
| `completion-request.schema.json` | request_id, project_id, task_id, expected_revision, from, to, evidence_manifest_checksum, request_checksum (reason, requested_at) | request_checksum; submit → readiness |
| `complete-task-authorization.schema.json` | authorization_id, authority_type, project_id, task_id, expected_revision, requested_transition, completion_request_checksum, evidence_manifest_checksum, nonce, issued_at, expires_at, authorization_checksum (revoked_at, revocation_reason, used_at, use_transaction_id) | authorization_checksum; validator → ledger |
| `authorization-ledger-entry.schema.json` | entry_id, type, authorization_id, transaction_id, previous_entry_checksum, entry_checksum, created_at (manifest_checksum, reason) | entry_checksum; ledger → validator/gate |
| `cost-ledger-entry.schema.json` | entry_id, type, provider, currency, minor_units, reconciliation_status, previous_entry_checksum, entry_checksum, created_at (external_reference, relates_to) | entry_checksum; ledger → record |
| `completion-payload.schema.json` | schema_version, transaction_id, task_id, project_id, previous_revision, resulting_revision, status_snapshot, completion_record, evidence_manifest, accepted_risks, follow_up_tasks, knowledge_handoff_status, prepared_event_reference, payload_checksum | payload_checksum; builder → manifest |
| `completion-bundle-manifest.schema.json` | schema_version, generation_id, transaction_id, task_id, project_id, payload_checksum, status_checksum, completion_record_checksum, prepared_event_id, prepared_event_checksum, prepared_chain_head, resulting_revision, manifest_checksum | manifest_checksum; builder → event/gate |
| `completion-record.schema.json` | schema_version, completion_id, transaction_id, task_id, project_id, resulting_revision, request_checksum, evidence_manifest_checksum, authorization_reference, cost_snapshot, record_checksum (risks, follow_ups, knowledge) | record_checksum; builder → payload/Markdown |
| `completion-prepared-event.schema.json` | event_schema_version, event_type=`COMPLETION_PREPARED`, transition_id, transaction_id, task_id, project_id, generation_id, expected_revision, previous_entry_checksum, entry_checksum, created_at | entry_checksum; history → payload |
| `completion-committed-event.schema.json` | event_schema_version, event_type=`COMPLETION_COMMITTED`, transition_id, transaction_id, task_id, project_id, generation_id, resulting_revision, manifest_checksum, prepared_event_id, previous_entry_checksum, entry_checksum, created_at | entry_checksum; history → journal/pointer |
| `completion-journal-entry.schema.json` | journal_entry_id, transaction_id, stage, manifest_checksum, previous_journal_checksum, entry_checksum, durable_acknowledgement, created_at (committed_event_reference, pointer_publish_status, recovery_status) | entry_checksum; journal → gate |
| `generation-pointer.schema.json` | task_id, project_id, generation_id, transaction_id, resulting_revision, manifest_checksum, committed_event_id, global_chain_head, pointer_checksum | pointer_checksum; store → gate |
| `durable-acknowledgement.schema.json` | transaction_id, payload_synced, manifest_synced, staging_directory_synced, log_file_synced, log_directory_synced, pointer_file_synced, pointer_directory_synced | none; journal/gate |
| `completion-outbox-event.schema.json` | event_id, idempotency_key, task_id, project_id, completion_id, generation_id, transaction_id, resulting_revision, manifest_checksum, global_chain_head, delivery_status=`SYNC_PENDING`, created_at, event_checksum | event_checksum; outbox → consumer |
| `completion-recovery-inspection.schema.json` | transaction_id, classification, canonical_read, observed_artifacts, allowed_writes, required_authority, inspection_checksum | inspection_checksum; inspector → recovery |
| `validated-canonical-read-result.schema.json` | status, task_id, authoritative_state_returned, completion_status, observed_revision, transaction_id, generation_id (state, error_code, causes) | none; gate → normal consumer |

All timestamps are RFC3339 UTC; IDs are UUID v4; revision/minor_units are non-negative integers; `minor_units` rejects decimal/floating point. Nullable optionals must be present as `null` and are included in checksums.

## 9. Canonical Serialization

```yaml
encoding: UTF-8
unicode_normalization: NFC
object_key_order: Unicode code-point ascending
array_order: schema-defined semantic order; never sorted during serialization
newline: LF
trailing_newline: false for JSON; true exactly once per JSONL entry
whitespace: none outside JSON string values
boolean: JSON true or false
null: explicit JSON null when schema permits
integer: base-10 finite safe integer; no exponent, leading plus, or leading zero
decimal: forbidden; currency uses integer minor_units
negative_zero: forbidden
timestamp: RFC3339 UTC
timezone: Z only
fractional_seconds: exactly three digits
additional_properties: false
hash_algorithm: sha256-canonical-json-v1
```

Phase 1 fixtures/parsers remain untouched. Phase 5A has a separate `1.2.0` parser; no adapter mutates or converts Phase 1 fixture records.

## 10. Checksum Field Matrices

For every artifact, **all fields listed as required/optional in Section 8 are INCLUDED except its self-checksum field, which is EXCLUDED**. `completion-payload` excludes only `payload_checksum`; Manifest excludes only `manifest_checksum`; Record excludes only `record_checksum`; each Event/Ledger/Journal entry excludes only `entry_checksum`; Outbox excludes only `event_checksum`; Pointer excludes only `pointer_checksum`. `durable-acknowledgement` has no checksum and is included in its Journal entry.

Normalization is Section 9 for every INCLUDED field. Null is included; arrays retain declared order; cost is normalized integer `minor_units`; timestamp is included only at creation and therefore immutable. The following are excluded from specified domains because they are absent from those schemas: COMMITTED Event ID from Manifest; Journal stage, pointer state, delivery status, Outbox ID, and Markdown from Payload/Manifest; Markdown from every canonical checksum.

## 11. Checksum Dependency DAG

```text
PREPARED Event → Payload → payload_checksum → Manifest → manifest_checksum
→ COMMITTED Event → Journal COMMITTED → Pointer → authorization USED
→ Certainty Gate → Outbox → derived Markdown
```

No reverse edge exists. Retry reuses the finalized Payload/Manifest bytes; a cycle yields `COMPLETION_CHECKSUM_CYCLE_DETECTED` before write.

## 12. Exact Implementation Allowlist

### Modified Existing Source / Tests

None.

### New Source

```text
src/lifecycle/phase5a/index.mjs
src/lifecycle/phase5a/constants.mjs
src/lifecycle/phase5a/canonical.mjs
src/lifecycle/phase5a/schemas.mjs
src/lifecycle/phase5a/durability.mjs
src/lifecycle/phase5a/bootstrap.mjs
src/lifecycle/phase5a/ledgers.mjs
src/lifecycle/phase5a/history-journal.mjs
src/lifecycle/phase5a/completion-builders.mjs
src/lifecycle/phase5a/generation-store.mjs
src/lifecycle/phase5a/completion-store.mjs
src/lifecycle/phase5a/faults.mjs
```

### New Tests

```text
tests/lifecycle/phase5a/phase5a-api.test.mjs
tests/lifecycle/phase5a/phase5a-canonical.test.mjs
tests/lifecycle/phase5a/phase5a-schema.test.mjs
tests/lifecycle/phase5a/phase5a-ledgers.test.mjs
tests/lifecycle/phase5a/phase5a-history-journal.test.mjs
tests/lifecycle/phase5a/phase5a-generation.test.mjs
tests/lifecycle/phase5a/phase5a-integration.test.mjs
tests/lifecycle/phase5a/phase5a-crash.test.mjs
```

### New Schemas

The 15 exact Section 8 schema files. Configuration may modify only `.gitignore` to add `/.lifecycle-runtime/`; `package.json` is not allowed because explicit Node commands are sufficient. Implementation Evidence may create only `closure-implementation-report.md`. Every non-listed path is protected.

## 13. Protected Files

Original Amendment, consistency check, Design/Critic/Owner/Judge Evidence, Phase 1 source/tests/fixtures, package.json, runtime state, Status/Registry, Foundation specifications, Git index/history, and all other paths.

## 14. FPC-02 Exact Finding

- ID / Severity / Status: `FPC-02` / `HIGH` / `OPEN`
- Affected sections: original Amendment §§15, 28, 33.
- Missing: separate 18 crash points; per-row durable/non-durable state, journal/authorization/log/pointer state, authority, allowed writes, retry/duplicate/cleanup rules, fault hooks, and one test per point.
- Risk: a crash could publish ambiguous completion, reuse an authorization, or duplicate a history event without a deterministic recovery rule.
- Closure: Sections 15–23 provide all required mapping.

## 15. Complete 18-Point Recovery Matrix

Abbreviations: `O`=old canonical state, `U`=`COMPLETION_STATE_UNKNOWN`, `C`=confirmed completion; `P`=PREPARED, `V`=VERIFIED, `J`=COMMITTED Journal; `R`=RESERVED, `X`=USED. All entries prohibit mutation of Payload/Manifest/committed Global Log. Retry key is `<transaction_id>:<manifest_checksum-or-pending>`.

| ID / exact injection | Last durable / non-durable | pointer; journal; auth; log | read / code / class | allowed write; authority; duplicate/cleanup; test |
|---|---|---|---|---|
| C1 before `reserveAuthorizationUsage` | none / reservation | old; none; unused; no event | O / `COMPLETION_NOT_STARTED` / NO_ACTION_REQUIRED | new request; none; no duplicate/no cleanup; CR-01 |
| C2 after reservation before Journal | RESERVED / Journal | old; none; R; no event | O / `AUTHORIZATION_RESERVED` / SAFE_RETRY | append P Journal for same transaction; Owner recovery; reservation unique/no cleanup; CR-02 |
| C3 after P Journal | P Journal / PREPARED Event | old; P; R; no event | O / `COMPLETION_PREPARED_INCOMPLETE` / RECOVERY_AUTHORIZATION_REQUIRED | append PREPARED Event or append ABORTED; Owner; no duplicate/retain Journal; CR-03 |
| C4 after PREPARED Event | PREPARED Event / Payload | old; P; R; PREPARED | O / `COMPLETION_PAYLOAD_INCOMPLETE` / RECOVERY_AUTHORIZATION_REQUIRED | build same payload or abort; Owner; Event unique/no cleanup; CR-04 |
| C5 before Payload checksum | PREPARED Event / Payload bytes | old; P; R; PREPARED | O / `COMPLETION_PAYLOAD_INCOMPLETE` / RECOVERY_AUTHORIZATION_REQUIRED | discard unfinalized staging only; Owner; no new Event/no published cleanup; CR-05 |
| C6 Payload finalized before Manifest | Payload / Manifest | old; P; R; PREPARED | O / `COMPLETION_MANIFEST_INCOMPLETE` / SAFE_RETRY | create one Manifest from fixed Payload; Owner; payload hash fixed/no cleanup; CR-06 |
| C7 Manifest finalized before durability | Manifest bytes / fsync proof | old; P; R; PREPARED | O / `COMPLETION_DURABILITY_UNKNOWN` / COMMIT_STATE_UNKNOWN | no write except inspection; Owner; no retry append/no cleanup; CR-07 |
| C8 durable generation before publish | staging generation / publish | old; V; R; PREPARED | O / `COMPLETION_EVENT_NOT_COMMITTED` / SAFE_RETRY | append COMMITTED Event only after reread; Owner; same manifest/no cleanup; CR-08 |
| C9 pointer rename before directory sync | pointer file / directory sync | unknown; J; R; COMMITTED | U / `COMPLETION_POINTER_UNCERTAIN` / COMMIT_STATE_UNKNOWN | inspection only; Owner; pointer no rewrite/no cleanup; CR-09 |
| C10 pointer published before COMMITTED Event | invalid normal state / event | U; J; R; PREPARED | U / `COMPLETION_RECOVERY_REQUIRED` / MANUAL_INTERVENTION_REQUIRED | no automatic write; Owner; no duplicate/no cleanup; CR-10 |
| C11 COMMITTED append before file sync | event bytes / file sync | old; V; R; uncertain COMMITTED | O / `COMPLETION_HISTORY_STATE_UNKNOWN` / COMMIT_STATE_UNKNOWN | inspection only; Owner; no append retry/no cleanup; CR-11 |
| C12 COMMITTED file sync before directory sync | file synced / directory sync | old; V; R; uncertain COMMITTED | O / `COMPLETION_HISTORY_STATE_UNKNOWN` / COMMIT_STATE_UNKNOWN | inspection only; Owner; no truncate/no cleanup; CR-12 |
| C13 COMMITTED durable before Journal J | COMMITTED Event / J entry | old; V; R; COMMITTED | O / `COMPLETION_JOURNAL_INCOMPLETE` / SAFE_RETRY | append exactly one J entry; Owner; Event key unique/no cleanup; CR-13 |
| C14 J before authorization X | Journal J / USED entry | old until pointer/Gate; J; R; COMMITTED | O / `AUTHORIZATION_USAGE_PENDING` / SAFE_RETRY | append USED for same reservation; Owner; auth unique/no cleanup; CR-14 |
| C15 X before certainty gate | USED / gate result | pointer published; J; X; COMMITTED | U / `COMPLETION_COMMIT_EVIDENCE_INCOMPLETE` / SAFE_RETRY | rerun read-only gate; Owner not needed; no writes/no cleanup; CR-15 |
| C16 gate PASS before Outbox | gate evidence / Outbox | published; J; X; COMMITTED | C / `OUTBOX_PENDING` / SAFE_RETRY | create one Outbox; no authority; key unique/no canonical cleanup; CR-16 |
| C17 Outbox before Markdown | Outbox / Markdown | published; J; X; COMMITTED | C / `COMPLETION_MARKDOWN_PENDING` / SAFE_RETRY | derive Markdown only; no authority; record checksum/no canonical cleanup; CR-17 |
| C18 Markdown before cleanup | Markdown / lease cleanup | published; J; X; COMMITTED | C / `CLEANUP_PENDING` / NO_ACTION_REQUIRED | remove lease/staging only; no authority; idempotent/no committed deletion; CR-18 |

## 16. Fault Injection Interface

`faults.mjs` defines immutable `FaultPoint` constants, `createNoopFaultInjector()`, and test-only `createFaultInjector(points)`. `maybeInject(point)` is called only by named internal functions and throws `FaultInjectedError`. The default is no-op; injector is passed through function options by tests, is not exported by `index.mjs`, has no environment-variable support, and is absent from production public APIs.

## 17. Fault Point Inventory

`C5A_FP_01_BEFORE_AUTH_RESERVATION` through `C5A_FP_18_BEFORE_CLEANUP` map one-to-one to C1–C18. Exact locations are respectively `ledgers.reserveAuthorizationUsage` before append; `completion-store` after reserve; `history-journal.appendJournalEntryDurably` after P; `appendTransitionDurably` after PREPARED; `completion-builders.buildImmutableCompletionPayload` before checksum; builder after payload; `durability.writeDurableJson` after manifest write; `generation-store.stageGeneration` after sync; `publishGeneration` after pointer rename; `completion-store` before COMMITTED append; history append before file sync; history append after file sync; completion-store before J append; before USED append; before gate; before Outbox; before Markdown; before lease cleanup. Each throws `FAULT_INJECTED` and is tested by matching `CR-01`…`CR-18`.

## 18. Fault Injection Test Matrix

All C1–C18 run in `tests/lifecycle/phase5a/phase5a-crash.test.mjs` as `CR-01`…`CR-18`; each starts a fresh ext4 fixture, invokes `submitCompletionRequest`, injects its same-numbered fault, restarts with `inspectCompletionRecoveryState`, and asserts the exact matrix result.

Each test asserts: immediate injected error; only stated durable files exist; no fixture/production root mutation; required Owner recovery authority where matrix says Owner; expected revision/event/outbox counts `(1/0/0)` for C1–C15 and `(1/2/0)` for C16, `(1/2/1)` for C17–C18; authorization state respectively unused, R for C2–C14, X for C15–C18; and cleanup absent except C18 after restart. COMMITTED event count is zero C1–C8, uncertain/no duplicate C9–C12, exactly one C13–C18.

## 19. Non-crash Test Mapping

`phase5a-generation.test.mjs`: H01-01 pointer-only, H01-02 missing record/event/journal, H01-03 raw/validated/recovery isolation. `phase5a-history-journal.test.mjs`: H02-01 prefix, H02-02 chain, H02-03 tamper, H02-04 truncation, H02-05 duplicate transition/revision/order, H02-06 PREPARED/COMMITTED binding. `phase5a-canonical.test.mjs`: H03-01 payload immutable, H03-02 manifest immutable, H03-03 Journal/Outbox isolation, H03-04 DAG, H03-05 post-mutation rejection, H03-06 retry checksum. `phase5a-ledgers.test.mjs`: AUTH-01…06 TTL/single-use/revoke/evidence/request/skew; COST-01…04 actual/pending/adjustment/tamper. `phase5a-builders.test.mjs`: REC-01 JSON uniqueness/checksum/replay; REC-02 Markdown failure/mismatch. `phase5a-integration.test.mjs`: OUT-01…04 Outbox/delivery/manual retry/raw-read. Phase 1 D-01〜D-06 remain `tests/lifecycle/phase1/lifecycle-store.test.mjs`.

## 20. Exact Test Files

The eight files in Section 12 are exact; no wildcard is an allowlist. `phase5a-crash.test.mjs` contains only CR-01…CR-18. Production-like test root is `<project>/.lifecycle-phase5a-fixtures/<uuid>/runtime`; production `.lifecycle-runtime` is forbidden.

## 21. Exact Test Commands

```bash
cd /home/baisound/projects/javascript-roulette
node --version
findmnt -n -o FSTYPE -T .lifecycle-phase5a-fixtures
npm test
node --test tests/lifecycle/phase1/lifecycle-store.test.mjs
node --test tests/lifecycle/phase5a/phase5a-api.test.mjs tests/lifecycle/phase5a/phase5a-canonical.test.mjs tests/lifecycle/phase5a/phase5a-schema.test.mjs tests/lifecycle/phase5a/phase5a-ledgers.test.mjs tests/lifecycle/phase5a/phase5a-history-journal.test.mjs tests/lifecycle/phase5a/phase5a-generation.test.mjs tests/lifecycle/phase5a/phase5a-integration.test.mjs tests/lifecycle/phase5a/phase5a-crash.test.mjs
test ! -e .lifecycle-phase5a-fixtures
sha256sum src/lifecycle/phase5a/*.mjs tests/lifecycle/phase5a/*.mjs
```

Expected exit code is `0`; test report records cwd, output, checksums, and allowed-scope result. Git commands are prohibited during this authorization and are not part of this plan’s verification.

## 22. Recovery Authority Matrix

`NO_ACTION_REQUIRED`: confirmed/noncanonical cleanup; automatic lease/temp cleanup. `SAFE_RETRY`: exact identity and durable proof; same transaction only. `RECOVERY_AUTHORIZATION_REQUIRED`: Owner Recovery Authority validates before append/abort. `COMMIT_STATE_UNKNOWN` and `HISTORY_INTEGRITY_FAILURE`: no writes, preserve all evidence, Owner decision required. `AUTHORIZATION_STATE_UNKNOWN`: no new completion, inspect ledger, Owner only. `MANUAL_INTERVENTION_REQUIRED`: invalid forbidden ordering; no automatic repair. Exit requires exact chain/binding verification or an append-only abort; all other cases Safe Stop.

## 23. Error Code Cross-reference

`FAULT_INJECTED` maps CR-01…18. `COMPLETION_STATE_UNKNOWN` maps H01-01…03 and CR-09…15. `COMPLETION_HISTORY_STATE_UNKNOWN` maps CR-11/12 and H02-03/04. `COMPLETION_RECOVERY_REQUIRED` maps CR-10. `AUTHORIZATION_RESERVED`, `AUTHORIZATION_USAGE_PENDING`, `COMPLETION_AUTHORIZATION_ALREADY_USED`, `…EXPIRED`, `…REVOKED` map AUTH-01…06 and CR-02/14/15. `COMPLETION_PAYLOAD_INCOMPLETE`, `…MANIFEST_INCOMPLETE`, `…DURABILITY_UNKNOWN`, `…JOURNAL_INCOMPLETE`, `OUTBOX_PENDING`, `COMPLETION_MARKDOWN_PENDING`, `CLEANUP_PENDING` map their same-named matrix rows. Each is Safe Stop unless explicitly `SAFE_RETRY`.

## 24. Implementation Sequence

1) constants/canonical/schema; 2) durability/bootstrap; 3) ledgers/history/journal; 4) generation/builders; 5) authorization/cost/record; 6) gate/outbox/Markdown; 7) recovery/faults; 8) unit, integration, crash, regression tests. Each stage uses only listed files, begins after preceding tests pass, stops on schema/chain/durability ambiguity, and rolls back only uncommitted temp output.

## 25. Stop Conditions by Stage

Schema mismatch, non-ext4 fixture, any checksum cycle, missing required identity, existing runtime root, forbidden direct read, test cleanup failure, or allowlist expansion causes Safe Stop and new authorization.

## 26. Revised Acceptance Criteria

FPC-01 closes only when all 15 exact schemas, all APIs, all checksum projections, and wildcard-free allowlist are present. FPC-02 closes only when C1–C18, fault points, CR-01…18, authority classifications, and error mapping are complete. H-01/H-02/H-03 and Owner Decisions remain unchanged; implementation stays `NOT_AUTHORIZED`.

## 27. FPC-01 Closure Conditions

Sections 6–12 are incorporated into the Final Plan Amendment without weakening higher-precedence evidence.

## 28. FPC-02 Closure Conditions

Sections 15–23 are incorporated into the Final Plan Amendment without collapsing crash rows or using “same/as above” semantics.

## 29. Residual Risks

Physical power loss beyond verified fsync semantics, non-ext4 runtime, local clock trust, and provider billing latency remain Safe Stop/ledger risks; no distributed transaction is claimed.

## 30. Required Changes to Original Final Plan

Add this Revision as controlling detail for FPC-01/FPC-02. Do not edit historical Phase 1 plans or the original Amendment.

## 31. Consistency Re-check Entry Conditions

The next independent review must verify all closure conditions, no High finding, the unchanged Owner/Judge decisions, and `implementation_status: NOT_AUTHORIZED`.

## 32. Implementation Authorization Boundary

No code/config/schema/test/runtime mutation is authorized by this Artifact.

## 33. Recommended Next Role

Critic for an authorized independent consistency re-check; not started here.

## 34. Recommended Next Artifact

New `closure-final-plan-consistency-check-revision-01.md` after Owner authorization.

## 35. Gate Readiness

`READY_WITH_MANDATORY_CONDITIONS` for a consistency re-check; not ready for implementation.

## 36. Owner Approval Required

`YES`.

## Validation Record

- FPC-01/FPC-02 extracted from the saved consistency check.
- 15 schemas, 18 recovery/fault/test mappings, APIs, and exact allowlist specified.
- Existing Evidence/Source/Tests/Schemas/`.gitignore`/Runtime State/Status/Registry/Git unchanged.
- Lint: `PASS`; the edited Markdown Artifact has no IDE linter errors.
