# TASK-004 Phase 5A — Final Plan Amendment

## 1. Document Control

- Authoring Role: Builder
- Active Project / Task: `/home/baisound/projects/javascript-roulette` / `TASK-004`
- Phase: Phase 5A — Completion Transition MVP
- Objective: 承認済みPhase 5A設計を、実装可能かつ検証可能なFinal Plan Amendmentへ統合する。
- Allowed File: `docs/ai-team/tasks/TASK-004/closure-final-plan-amendment.md`
- Result: `PHASE5A_FINAL_PLAN_READY_WITH_CONDITIONS`
- Implementation Status: `NOT_AUTHORIZED`

## 2. Role Activation Record

- Active Role: Builder
- Session Name: `TASK-004 Phase 5A — Final Plan Amendment`
- Runtime Interface: `INLINE_CHAT_LINUX`
- Foundation Root: `/home/baisound/projects/ai-team`
- Project Root: `/home/baisound/projects/javascript-roulette`
- Builder Specification / SHA-256: `projects/ai-team/roles/README-Builder.md` / `f1e6fd8f9cbe4c771858774118c334addf60c9e7072b41ad892796ad4f590326`
- Evidence Specification / SHA-256: `projects/ai-team/common/Evidence-Specification.md` / `a81b65133bc45ca7e044e7484229f2b1731be85c25508b425852e23fed4759c6`
- Authority Specification / SHA-256: `projects/ai-team/common/Authority-Specification.md` / `38459f8a96a21e03bd55cdd219dfe21ae017c8edbf0027ebc12df66e14c0076d`
- Allowed Actions: approved EvidenceとProject構造の読取、実装境界の確定、本Artifactの新規作成。
- Prohibited Actions: Source/Test/Schema/Runtime State/Status/Registry/`.gitignore`/Gitの変更、Directory作成、他Role起動。
- Protected Files: 本Artifact以外の全ファイル。
- Stop Conditions: required Evidence、Project構造、Production State Root、又は実装境界を確認できない場合。
- Role Activation Result: `READY`

Runtime procedure was executed in `/home/baisound` with `set -eu`. Observed `HOME=/home/baisound`, `UNAME=Linux`, and `PHASE5A_FINAL_PLAN_RUNTIME_CHECK_COMPLETE`; exit code was `0`.

## 3. Authority and Precedence

Conflict resolution order is:

```text
Owner Decisions → Judge Decision → Revision 03 → Critic Re-review 03
→ Revision 02 → Critic Re-review 02 → Revision 01 → Critic Re-review 01
→ Original Closure Design → existing Phase 1 Final Plan
```

This Amendment supplements rather than replaces `final-plan.md` and `final-plan-amendment-d05-d06.md`. Phase 1 remains approved and protected. The Judge decision (`d7e90723…4510f`) approves Final Plan creation with mandatory conditions; it does not authorize implementation.

Reviewed input hashes were verified before planning: `task.md` `23089fdd…c9491b3`; `final-plan.md` `d14d9513…21ee5f8`; D-05/D-06 Amendment `d6f50c2f…6283cc`; its consistency check `dac16f6b…0dadf7`; Design/Re-review chain `270645c7…7024880`, `ffa8694d…ec779d`, `77ff8bc3…c3b3e0e`, `17a6591b…ea1670`, `b24d252a…9465c8`, `cd7bc231…50c1198`, `1031548f…a8073ad`, `d08f3449…68330d62`; Owner Decisions `9809afb3…ed5cc10`; Judge Decision `d7e90723…de4510f`; Architecture `f62e2dd6…597edc`; Lifecycle Foundation `a7542168…156e6cd`; Phase 1 source `d37d8234…51801b7`; Phase 1 test `756c44bf…fef236`; `package.json` `c4105b43…ffc4b831`; `.gitignore` `f5befb30…baeb6e`.

## 4. Scope

Implement a project-local Phase 5A completion store that safely supports `ACTIVE → COMPLETED` only after Closure Readiness and a valid Owner `COMPLETE_TASK` authorization. It includes validated canonical reads, immutable completion material, append-only history/journals/ledgers, generation-pointer publication, recovery inspection, and a non-blocking derived-sync request.

## 5. Out of Scope

Archive and historical migration (Phase 5B); Registry/Current State/Index/Summary update; TASK-005 knowledge governance; TASK-006 automation; external billing integration; distributed transactions; Foundation changes; Git operations; and production completion execution.

## 6. Existing Project Inspection

- Modules are ESM (`.mjs`); existing lifecycle code is `src/lifecycle/phase1/index.mjs`.
- Existing test boundary is `tests/lifecycle/phase1/lifecycle-store.test.mjs`; Node’s built-in test runner is used.
- `package.json` provides `npm test` only for `tests/roulette-core.test.mjs`; Phase 5A commands therefore invoke `node --test` explicitly.
- Current `.gitignore` excludes only dependencies, build output, logs, and Vite cache. No existing runtime root conflicts.
- `src/`, `tests/`, and `docs/` are distinct. The existing fixture path under `docs/ai-team/lifecycle/phase1/` must remain separate from production state.
- Node engine is `>=20.19.0`; production verification additionally requires the approved Linux/ext4 environment.

## 7. Exact Production State Root

```yaml
production_state:
  root: /home/baisound/projects/javascript-roulette/.lifecycle-runtime
  git_tracking: EXCLUDED
  filesystem: ext4
  same_filesystem_atomic_publish: true
```

The root is project-local, hidden from ordinary source/docs/test trees, and does not exist until separately authorized implementation/bootstrap. Before any write, `findmnt -T` must prove that root, staging, generations, pointer parent, journals, and logs resolve to the same ext4 filesystem.

```text
.lifecycle-runtime/
├── tasks/<task-id>/
│   ├── current.json
│   ├── generations/<generation-id>/
│   ├── staging/<generation-id>.tmp/
│   ├── transition-log.jsonl
│   ├── journals/<transaction-id>.journal.jsonl
│   ├── leases/active-lease.json
│   ├── authorization-ledger.jsonl
│   ├── cost-ledger.jsonl
│   └── outbox/<idempotency-key>.json
```

No secrets, provider credentials, access tokens, or raw secret-bearing provider payloads may be stored.

## 8. Git Tracking Boundary

Tracked: Phase 5A source/tests/schemas, bootstrap and validation definitions, `.gitignore` rule, implementation/test/review evidence. Excluded: all contents below `.lifecycle-runtime/`, including generations, pointer, logs, journals, leases, ledgers, records, outbox, staging, and temporary files.

Implementation shall add exactly this `.gitignore` line after approval:

```gitignore
/.lifecycle-runtime/
```

The rule is intentionally root-anchored and must be tested before runtime bootstrap. It is not added in this gate.

## 9. Source Architecture

All Phase 5A production code is new under `src/lifecycle/phase5a/`; Phase 1 code is not modified.

| Path | Role / public API | Mutation boundary | Test target |
|---|---|---|---|
| `canonical.mjs` | `serializeCanonical`, `checksumFor` | none | serialization/checksum |
| `errors.mjs` | `Phase5AError`, error constants | none | code mapping |
| `schemas.mjs` | `validate*` schema validators | none | negative schemas |
| `durability.mjs` | durable write/append/rename/fsync primitives | filesystem only | fault injection |
| `bootstrap.mjs` | `bootstrapProductionState` | new empty approved runtime root only | fixture/provenance |
| `authorization-ledger.mjs` | validate/reserve/commit/revoke authorization | authorization ledger append only | TTL/replay/crash |
| `cost-ledger.mjs` | validate/read/reference cost entries | cost ledger append only | pending/adjustment |
| `transition-history.mjs` | append/verify/find Global Log events | global log append only | chain/tamper |
| `journal.mjs` | append/verify external transaction journal | per-transaction journal append only | stage/recovery |
| `completion-builders.mjs` | build immutable payload/manifest/record/markdown | staging files; immutable after checksum | H-03 |
| `generation-store.mjs` | stage, publish, read pointer | staging/generation/pointer only | H-01 |
| `commit-gate.mjs` | `readCanonicalTaskState` / gate verification | none | missing/tamper cases |
| `outbox.mjs` | durable outbox create/read | outbox immutable create only | duplicate/pending |
| `completion-store.mjs` | `completeTask`, recovery inspection | orchestrates allowed stores | end-to-end |
| `index.mjs` | only supported public Phase 5A exports | none | export boundary |

Internal APIs must not be exported from `index.mjs`. Direct JSON reads by normal callers are prohibited.

## 10. Phase 1 Reuse Boundary

Reuse Phase 1’s canonical key-ordering convention, SHA-256 prefix convention, fsync/directory-sync error pattern, lease/fencing concepts, append-only verification, Safe Stop model, and D-01〜D-06 regression requirements. Do not reuse its fixture paths, `LifecycleStore` as the Phase 5A production store, or its direct `readRecord()` as a canonical completion read.

The selected approach is a new Phase 5A module, not modification of Phase 1 transition rules. This avoids silently removing Phase 1’s intentional `COMPLETED` rejection and protects its approved behavior.

## 11. Schema Inventory

All schemas are tracked JSON Schema files under `src/lifecycle/phase5a/schemas/`, draft 2020-12, `additionalProperties: false` unless stated otherwise, and version `1.2.0`.

| Schema file | Required identity/checksum fields | Validation error |
|---|---|---|
| `completion-request.schema.json` | request/project/task/revision/from/to/evidence/request checksum | `COMPLETION_REQUEST_INVALID` |
| `complete-task-authorization.schema.json` | Owner authorization bindings, nonce, issued/expires/revoked/used | `COMPLETION_AUTHORIZATION_INVALID` |
| `authorization-ledger-entry.schema.json` | entry type, previous/entry checksum, authorization binding | `AUTHORIZATION_LEDGER_INVALID` |
| `cost-ledger-entry.schema.json` | entry type, currency/provider/amount/reconciliation, previous/entry checksum | `COST_LEDGER_INVALID` |
| `completion-payload.schema.json` | status, record, evidence, risks, follow-up, PREPARED reference, payload checksum | `COMPLETION_PAYLOAD_INVALID` |
| `bundle-manifest.schema.json` | generation, payload/status/record checksums, PREPARED reference, manifest checksum | `COMPLETION_MANIFEST_INVALID` |
| `completion-record.schema.json` | completion ID, transaction, revision, ledger references, record checksum | `COMPLETION_RECORD_INVALID` |
| `transition-event.schema.json` | event identity/type, chain references, binding, entry checksum | `TRANSITION_EVENT_INVALID` |
| `journal-entry.schema.json` | stage, immutable binding, journal chain, acknowledgement | `COMPLETION_JOURNAL_INVALID` |
| `generation-pointer.schema.json` | generation/transaction/revision/manifest/event binding, pointer checksum | `COMPLETION_POINTER_INVALID` |
| `durable-acknowledgement.schema.json` | immutable artifact and fsync acknowledgements | `DURABILITY_ACKNOWLEDGEMENT_INVALID` |
| `outbox-event.schema.json` | idempotency key, canonical bindings, `SYNC_PENDING`, checksum | `OUTBOX_EVENT_INVALID` |
| `recovery-inspection.schema.json` | classification, observed bindings, no-write requirement | `RECOVERY_INSPECTION_INVALID` |
| `validated-read-result.schema.json` | confirmed state or `COMPLETION_STATE_UNKNOWN` | `CANONICAL_READ_INVALID` |

New schema versions require a new schema file and explicit reader compatibility test; existing Phase 1 `1.1.0` files are never migrated in place.

## 12. Checksum Domains

All checksum values are `sha256:<64 lowercase hex>`. Each listed self-checksum is excluded; no other field is implicitly excluded.

| Checksum | Included | Excluded |
|---|---|---|
| `payload_checksum` | all Payload fields including status, record, evidence, risks, follow-ups, PREPARED reference | `payload_checksum` |
| `manifest_checksum` | all Manifest fields including payload/status/record checksums, generation and PREPARED references | `manifest_checksum` |
| `journal_entry_checksum` | all Journal-entry fields including stage, prior checksum, acknowledgement and allowed references | `entry_checksum` |
| `transition_event_checksum` | all Event fields including prior checksum and immutable binding | `entry_checksum` |
| `authorization_entry_checksum` | all authorization-ledger entry fields | `entry_checksum` |
| `cost_entry_checksum` | all cost-ledger entry fields | `entry_checksum` |
| `outbox_event_checksum` | all Outbox event fields | `event_checksum` |
| `record_checksum` / `pointer_checksum` | all respective document fields | their own checksum field |

Payload and Manifest never include COMMITTED Event ID, Journal stage, pointer state, outbox ID/delivery state, recovery state, or runtime post-finalization timestamp. These exclusions are protected by their own checksum chains and cross-binding at the Commit Certainty Gate.

## 13. Canonical Serialization

Use UTF-8, lexicographically sorted object keys, JSON arrays in declared semantic order, JSON primitives only, no insignificant whitespace, no trailing newline for individual JSON documents, and LF-terminated canonical JSON lines for JSONL. Timestamps are RFC 3339 UTC with `Z`; booleans are JSON `true`/`false`; null must be explicit where a nullable field is required. Numbers are finite integers for revisions/amount minor units; money is `{currency, minor_units}` and never floating-point. Strings use NFC Unicode normalization. Unknown properties are rejected. Hash algorithm identifier is `sha256-canonical-json-v1`.

This is compatible with the Phase 1 sorted-key JSON strategy while adding named checksum-field exclusion rather than Phase 1’s fixed field pair.

## 14. Checksum Dependency DAG

```text
Authorization reservation + PREPARED Event
  → immutable Completion Payload → payload_checksum
  → immutable Bundle Manifest → manifest_checksum
  → COMMITTED Event / Global Log
  → COMMITTED Journal entry
  → published generation and Current Pointer
  → authorization usage commit
  → Commit Certainty Gate
  → immutable Outbox event → derived Markdown
```

An edge from Event, Journal, Pointer, Outbox, Markdown, or authorization usage back to Payload/Manifest is forbidden. Cycle detection raises `COMPLETION_CHECKSUM_CYCLE_DETECTED` before write.

## 15. Transaction Protocol

The user-provided ordering that placed pointer publication before COMMITTED Event is unsafe and conflicts with the approved Revision 03: a published `COMPLETED` generation without a durable COMMITTED Event violates H-01/H-02. The binding order below is mandatory.

| Step | Write / durability / verification | Failure and recovery |
|---:|---|---|
| 1–6 | ext4 preflight; validate request/readiness/authorization/revision; acquire fenced lease | no state write; reject or Safe Stop |
| 7 | append authorization `RESERVED` entry and fsync ledger/parent | reservation ambiguity → recovery inspection |
| 8–9 | append Journal `PREPARED`; append/fsync/reread Global PREPARED Event | old canonical state remains visible |
| 10–13 | build Payload then Manifest once; calculate checksums | no mutation after finalization |
| 14–15 | durable-write both to staging; fsync files/directory; reread all bindings | journal `VERIFIED` only after success |
| 16 | append/fsync/reread Global COMMITTED Event bound to manifest | no pointer before durable event |
| 17 | append Journal `COMMITTED`, including event reference | duplicate append prohibited |
| 18–19 | rename staging to generation, fsync; durable pointer temp, atomic rename, parent fsync, reread | pointer ambiguity → no-write recovery |
| 20 | append authorization `USED` entry bound to transaction | same authorization cannot begin new request |
| 21 | run Commit Certainty Gate | returns unknown; no fallback or repair |
| 22–24 | create immutable Outbox after gate; best-effort Markdown from committed JSON | outbox/Markdown failure does not rollback completion |
| 25 | clean lease and staging remnants only | never delete committed artifacts |

Every mutable write is followed by exact reread/identity validation. The Journal is append-only (`PREPARED`, `VERIFIED`, `COMMITTED`, `ABORTED`, `RECOVERY_REQUIRED`); no stage is overwritten.

## 16. Global Transition History

Path: `.lifecycle-runtime/tasks/TASK-004/transition-log.jsonl`. It is task-scoped, global within that task, generation-scoped `false`, append-only, and authoritative for Transition History. Bootstrap writes the first `STATE_BOOTSTRAP_FROM_EVIDENCE` Event with `previous_entry_checksum: sha256:GENESIS`; it references the Phase 1 fixture checksum but never copies its history.

Every append validates the complete chain before writing, and validates the incremental tail after fsync. Startup/recovery and Commit Certainty Gate perform full-chain validation. The verifier rejects malformed JSON, unknown event type, checksum/previous-checksum mismatch, truncation, duplicate transition ID, duplicate committed resulting revision, and non-monotonic committed revision. Generations hold references only and never duplicate event bytes.

## 17. Generation／Pointer Publish

Staging is `.lifecycle-runtime/tasks/TASK-004/staging/<uuid>.tmp`; published generations are `generations/<uuid>/`; `current.json` is the sole pointer. Generation IDs are UUID v4. A pointer binds task/project/generation/transaction/revision/manifest checksum/COMMITTED Event identity/global chain head and its own checksum.

The pointer is written as a same-directory temp file, file-synced, atomically renamed, then its parent directory is synced. Old generations are retained. Missing/invalid/ambiguous pointer, missing generation, or failed reread yields `COMPLETION_STATE_UNKNOWN`; no automatic pointer rewrite occurs. Pointer publication is visibility only and never sufficient by itself to establish completion.

## 18. Commit Certainty Gate

`readCanonicalTaskState()` returns `COMPLETED` only when all are true: valid Current Pointer and published immutable generation; valid Payload/Manifest/status/Completion Record checksums; status is `COMPLETED`; exact PREPARED and exactly one COMMITTED Event exist; the full Global Log and Journal chains pass; manifest/generation/transaction/revision/chain-head bindings match; Journal’s latest valid stage is `COMMITTED`; durable acknowledgement is complete; authorization usage is committed; and no superseded/recovery-required/conflicting lease state exists.

All other outcomes return a no-write `SAFE_STOP` result with top-level `COMPLETION_STATE_UNKNOWN`, cause codes, and `authoritative_state_returned: false`. No `ACTIVE` fallback, implicit previous-state fallback, or repair is allowed.

## 19. Read APIs

| Function | Caller and output | Writes |
|---|---|---|
| `readRawStatusSnapshot(root, taskId)` | Owner-authorized forensic/recovery inspection only; marked `forensic_only: true` | none |
| `readCanonicalTaskState(root, taskId)` | sole normal/consumer canonical API; validated result schema | none |
| `inspectCompletionRecoveryState(root, transactionId)` | Owner-authorized diagnostic classification and evidence | none |

Only the second API may feed Roles, Closure logic, or derived synchronization. No Phase 5A public export exposes a raw file reader as a normal state API.

## 20. Authorization Model

`COMPLETE_TASK` authorization is Owner-issued, 30 minutes from `issued_at`, single-use, nonce-bearing, and bound to authorization/project/task/expected revision/request checksum/evidence-manifest checksum/transition. Clock-skew allowance is exactly ±120 seconds; beyond it, return `COMPLETION_AUTHORIZATION_EXPIRED`.

The ledger first records `RESERVED` under the authorization ID and transaction. Recovery may finish only the same reservation after exact binding verification; it cannot start a different completion. A post-commit `USED` entry is append-only. Revocation is append-only and is checked before reservation and before commit. Required outcomes include `COMPLETION_AUTHORIZATION_REVOKED`, `COMPLETION_AUTHORIZATION_ALREADY_USED`, `COMPLETION_AUTHORIZATION_INVALID`, and `COMPLETION_AUTHORIZATION_EXPIRED`. Owner Recovery Authority is a distinct authorization schema and never reuses COMPLETE_TASK authority.

## 21. Authorization Ledger

Path: `.lifecycle-runtime/tasks/TASK-004/authorization-ledger.jsonl`. Entries are `ISSUED`, `RESERVED`, `USED`, or `REVOKED`; each has entry ID, prior entry checksum, entry checksum, authorization binding, timestamp, and transaction/reference when applicable. It is append-only and full-chain verified by authorization validation and the Commit Certainty Gate.

## 22. Cost Ledger Minimum Interface

Path: `.lifecycle-runtime/tasks/TASK-004/cost-ledger.jsonl`. Entries are append-only `ACTUAL`, `PENDING_EXTERNAL_RECONCILIATION`, or `ADJUSTMENT`, with provider, currency, integer minor units, known/pending distinction, external reference (non-secret), prior checksum, entry checksum, and timestamp. Completion records only `{ledger_entry_ids, ledger_chain_head, known_actual_total, pending_external, snapshot_checksum}`.

`PENDING_EXTERNAL_RECONCILIATION` is allowed when a provider/amount status is explicitly represented. It does not permit inventing actual cost and does not indefinitely block completion; a later `ADJUSTMENT` corrects the ledger without mutating the Completion Payload.

## 23. Completion Record

Canonical JSON path within a generation: `generations/<generation-id>/completion-record.json`; it is also embedded in the immutable Payload. It contains completion ID, task/project/transaction/revision, request/evidence/authorization references, readiness result, cost snapshot, risk/follow-up/knowledge fields, manifest reference, `record_checksum`, and schema version. Duplicate identity with different bytes is rejected; same replay returns the existing record.

## 24. Derived Markdown

Derived path: `generations/<generation-id>/completion-record.md`. It is generated only after committed JSON and contains `completion_id` and JSON `record_checksum`. It is not part of the Payload/Manifest checksum domain, cannot determine status, and failure produces a recorded noncanonical generation error without rollback. On mismatch, JSON is authoritative.

## 25. Durable Outbox

Path: `.lifecycle-runtime/tasks/TASK-004/outbox/<idempotency-key>.json`. The immutable event contains idempotency key, event ID, task/project/completion/generation/transaction IDs, resulting revision, manifest checksum, Global Log chain head, creation timestamp, and `delivery_status: SYNC_PENDING`. It is created only after Gate PASS and is not back-written into Manifest.

## 26. Derived Synchronization Contract

An Owner-authorized manual consumer may read only a Gate-PASS canonical result and verified Outbox event. It may update derived views under its own approved scope and records delivery acknowledgement outside canonical completion. Replays use the outbox idempotency key. Consumer absence/failure remains `SYNC_PENDING` and never rolls back canonical completion. TASK-006 must preserve this input/output contract.

## 27. Error Codes

The implementation shall define typed errors with `{code, retryable, safe_stop, required_authority, evidence}`. Families are: `RUNTIME_*`/`FILESYSTEM_*`; `COMPLETION_REQUEST_*`; `COMPLETION_AUTHORIZATION_*`; `COMPLETION_EVIDENCE_*`/`COMPLETION_READINESS_*`; `COMPLETION_REVISION_*`/`LEASE_*`; `COMPLETION_PAYLOAD_*`/`COMPLETION_MANIFEST_*`; `COMPLETION_JOURNAL_*`; `TRANSITION_HISTORY_*`/`TRANSITION_EVENT_*`; `COMPLETION_POINTER_*`; `COMPLETION_RECORD_*`; `COST_LEDGER_*`; `OUTBOX_*`; `COMPLETION_COMMIT_EVIDENCE_INCOMPLETE`/`COMPLETION_STATE_UNKNOWN`; and `COMPLETION_RECOVERY_REQUIRED`.

Checksum, chain, pointer, or durability ambiguity is Safe Stop and Owner Recovery Authority only. Schema/request/expired/revoked errors are non-retryable until corrected/newly authorized. Transient pre-write I/O may be retryable only after inspection.

## 28. Recovery Matrix

| Boundary | Canonical visibility | Required recovery |
|---|---|---|
| before reservation / reserved before Journal | old state | no completion or exact reservation inspection |
| Journal PREPARED / PREPARED Event | old state | retain evidence; abort only under Owner rule |
| Payload or Manifest creation/durability | old state | reuse immutable bytes only; ambiguity Safe Stop |
| durable generation before publish | old state | exact same-transaction publish only |
| pointer swap before directory sync | unknown | no rewrite; Owner recovery inspection |
| publish before COMMITTED Event | prohibited normal state | `COMPLETION_RECOVERY_REQUIRED` |
| COMMITTED append before file/directory sync | old state | no duplicate append; retain evidence |
| COMMITTED Event before Journal COMMITTED | old state | append exact Journal entry only after validation |
| Journal COMMITTED before authorization USED | old state unless pointer/Gate pass | exact usage completion only |
| usage before Gate / Gate before Outbox | Gate unknown or confirmed respectively | no state repair; outbox idempotent after pass |
| Outbox/Markdown/cleanup | confirmed completion if Gate passed | retry derived work or cleanup only |

At every row, transaction ID plus immutable manifest checksum is the retry key; duplicate Event/Journal/Ledger/Outbox writes are rejected or observed as equivalent. Cleanup applies only to lease and nonpublished staging remnants.

## 29. Retry／Idempotency

Same request replay must retain transaction ID and immutable checksums. Unique keys are: PREPARED by transaction ID; COMMITTED by `(transaction_id, manifest_checksum, resulting_revision)`; authorization reservation/usage by authorization ID plus transaction; pointer by full target binding; Outbox by idempotency key. A different request/evidence/revision cannot reuse any of these identities.

## 30. Backward Compatibility

The Phase 1 module and fixture remain unchanged. Existing `1.1.0` Events remain readable as historical fixture material, while Phase 5A production starts an independent genesis history. Existing roulette tests and lifecycle Phase 1 tests remain mandatory regressions. No direct production use of fixture paths, Phase 1 production State, or raw reader is permitted.

## 31. Migration／Bootstrap

`bootstrapProductionState` is an explicit `STATE_BOOTSTRAP_FROM_EVIDENCE` transaction, not a fixture conversion. It validates an empty approved runtime root, creates tracked-format runtime files only under the excluded root, writes initial state/history with fixture provenance checksums, and verifies the new genesis chain. It must never alter fixture or historical Evidence.

## 32. Test Architecture

Create `tests/lifecycle/phase5a/` with unit tests per module and an integration test for `completion-store.mjs`. Use isolated ext4 temporary roots below `.lifecycle-phase5a-fixtures/`, which must be added to test cleanup assertions and never overlap `.lifecycle-runtime/`.

## 33. Test Matrix

Required groups: H-01 uncertain reads/pointer-only/missing Record/Event/Journal/read separation; H-02 log preservation/prefix/chain/tamper/truncation/duplicates/binding/branch prevention; H-03 immutability/domain isolation/DAG/post-mutation/retry stability; authorization negative/TTL/skew/revocation/reservation crash; cost actual/pending/late-adjustment/tamper; JSON/Markdown behavior; Outbox pending/consumer absent/retry/raw-read prohibition; all recovery boundaries; and D-01〜D-06 plus existing Phase 1 regressions.

## 34. Test Commands

After implementation authorization, record cwd, Node version, `findmnt -T` output, SHA-256 inputs, exit status, and cleanup result. Planned commands are:

```bash
cd /home/baisound/projects/javascript-roulette
node --version
findmnt -T .lifecycle-phase5a-fixtures -no FSTYPE,SOURCE
node --check src/lifecycle/phase5a/index.mjs
node --test tests/lifecycle/phase5a/*.test.mjs
node --test tests/lifecycle/phase1/*.test.mjs
node --test tests/roulette-core.test.mjs
test ! -e .lifecycle-phase5a-fixtures
```

Production-root tests use a temporary root; no test may create `.lifecycle-runtime/`.

## 35. Implementation File Allowlist

Proposed implementation scope: every new source/schema file listed in Section 9/11; `tests/lifecycle/phase5a/*.test.mjs`; `.gitignore`; `package.json` only if a `test:lifecycle-phase5a` script is explicitly approved; and the named implementation/test/review artifacts. No existing Phase 1 source/test or existing Evidence file may be modified without a new approved amendment.

## 36. Protected Files

Existing Phase 1 Evidence, all Design/Critic/Judge/Owner Evidence, current Architecture/Lifecycle documents, Registry/Current State, historical baselines, Foundation specifications, other tasks/projects, Git index/history, and all runtime state outside authorized temporary test roots are protected.

## 37. Evidence Requirements

Implementation must record exact commands, cwd, Node/filesystem observations, source/test hashes, allowed-file verification, test result, and limitations. Unexecuted checks cannot be reported as PASS.

## 38. Implementation Artifact Chain

`closure-implementation-report.md` (Builder, authorized source scope) → `closure-test-report.md` (Tester) → optional `closure-retest-report.md` (Tester) → `closure-implementation-review.md` (Critic) → optional Builder fix report → `closure-final-judgment.md` (Judge) → Project Policy review/VERIFY → authorized Completion Readiness/reassessment. Runtime `completion-record.json`/`.md` are transaction outputs, not pre-created Evidence artifacts.

## 39. Rollback／Safe Stop

No immutable Payload/Manifest, Global Log, committed Journal, ledger, or published generation is overwritten or deleted to roll back. Pre-publication failure preserves old canonical state; ambiguous state is no-write Safe Stop. Logical correction is a new append-only record or new authorized task/transition.

## 40. Acceptance Criteria

All H-01/H-02/H-03 controls, Owner Decisions, Judge mandatory conditions, fixture separation, Git exclusion, non-circular checksums, append-only Global Log, atomic pointer publication, certainty gate, authorization lifecycle, cost minimum interface, canonical JSON, non-blocking outbox, deterministic recovery, idempotency, historical integrity, D-01〜D-06, Phase 1 regressions, and independent Tester/Critic/Judge results must pass.

## 41. Residual Risks

Power-loss beyond verified fsync semantics, non-ext4 filesystems, non-Linux/WSL2 environments, local-clock trust, external provider billing delay, and distributed transactions remain risks. The design handles these with bounded environment checks, `PENDING_EXTERNAL_RECONCILIATION`, append-only correction, and Safe Stop; it does not claim to eliminate them.

## 42. Implementation Authorization Boundary

```yaml
implementation_status: NOT_AUTHORIZED
```

No Source/Test/Schema/`.gitignore`/runtime-root/Git change may begin until a separate Owner authorization names the exact allowed files, test scope, rollback/Safe Stop constraints, and expiry.

## 43. Recommended Next Role

Judge for the independent Final Plan Consistency Check, only after Owner/Orchestrator authorizes that review. This Builder does not start it.

## 44. Recommended Next Artifact

`closure-final-plan-consistency-check.md` — a new Judge Artifact that compares this Amendment against the complete approved design and decision chain.

## 45. Gate Readiness

`READY_WITH_MANDATORY_CONDITIONS` for Final Plan Consistency Check. It is not implementation authorization.

## 46. Owner Approval Required

`YES` — before Final Plan consistency review, implementation authorization, runtime-root creation, `.gitignore` modification, schema/source/test creation, or any completion operation.

## Validation Record

- Judge Conditions and Owner Decisions 1〜5: integrated without alteration.
- H-01/H-02/H-03 conditions: retained and made mandatory.
- Exact root, paths, schemas, APIs, protocol, tests, and allowlist: specified.
- Existing Evidence/Source/Tests/Status/Registry: unchanged.
- Git operation: `NOT_EXECUTED`, prohibited by authorization.
- Lint: `PASS`; the edited Markdown Artifact has no IDE linter errors.
