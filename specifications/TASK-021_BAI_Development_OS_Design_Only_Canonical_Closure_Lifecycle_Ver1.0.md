# TASK-021 — Design-only Canonical Closure Lifecycle Ver.1.0

## 1. Purpose and authority

This specification adds an honest completion route for explicitly classified design-only Tasks. It is additive to TASK-004 Lifecycle Foundation Ver.1.6. TASK-004 remains Lifecycle authority; TASK-021 changes neither existing implementation-phase meaning nor historical records.

The 2026-08-27 Owner request allocates TASK-021 and authorizes bounded design and implementation. Runtime classification and completion each require a distinct, independently verified Owner authorization.

## 2. Problem

The existing chain is `TASK_DEFINITION -> DESIGN -> FINAL_PLAN -> IMPLEMENTATION_AUTHORIZATION -> IMPLEMENTATION -> TESTING -> IMPLEMENTATION_REVIEW -> FINAL_JUDGMENT -> POLICY_REVIEW -> CLOSURE -> ARCHIVE`.

Existing Closure accepts only `ACTIVE / CLOSURE -> COMPLETED / CLOSURE`. A design-only Task at `FINAL_PLAN / PASS` cannot complete truthfully. Advancing through implementation phases creates false Evidence; changing only queue/projection state violates Canonical authority.

## 3. Data model and invariants

Canonical Status Record `1.2.0` adds required `task_classification`: `DESIGN_ONLY`, `IMPLEMENTATION`, or `UNKNOWN`. Legacy `1.1.0` records remain valid and are interpreted as `UNKNOWN` only by the new route; they are never silently upgraded.

Closed operations:

1. `TASK_CLASSIFICATION`: same-state `ACTIVE / FINAL_PLAN / PASS` mutation upgrading legacy/UNKNOWN to `1.2.0 / DESIGN_ONLY` after exact authority and Context/Evidence verification.
2. `DESIGN_ONLY_CLOSURE`: one atomic mutation from `ACTIVE / FINAL_PLAN / PASS / DESIGN_ONLY` to `COMPLETED / CLOSURE / PASS / NOT_REQUIRED / REVIEW_PENDING`.

The second operation records skipped phases as not entered, never passed. `archive_status=READY` is forbidden because Archive readiness is separate.

For every nonterminal `1.2.0 / DESIGN_ONLY` Task Status, ordinary entry/rework into `IMPLEMENTATION_AUTHORIZATION`, `IMPLEMENTATION`, `TESTING`, `IMPLEMENTATION_REVIEW`, `FINAL_JUDGMENT`, or `POLICY_REVIEW` is forbidden. Generic Closure from `FINAL_PLAN` is forbidden. If Task Status is `PAUSED`, `BLOCKED`, or `STALLED`, only the `RECOVERY` domain may mutate it; phase change is forbidden until valid resume. Once resumed, the same DESIGN_ONLY phase invariant still applies. Only non-classification-changing Recovery and, from `ACTIVE / FINAL_PLAN / PASS`, `DESIGN_ONLY_CLOSURE` are accepted. TASK-021 defines no reclassification/downgrade. After `COMPLETED / CLOSURE`, only the existing separately Owner-authorized Archive route may advance the Task.

### 3.1 Compatibility matrix

| Artifact | Legacy reader | TASK-021 reader | Writer rule |
|---|---|---|---|
| Record `1.1.0` | accept | accept as effective `UNKNOWN` | ordinary transitions remain `1.1.0` |
| Record `1.2.0` | fail closed | classification required | first emitted by classification |
| Event `1.1.0` | accept | accept | ordinary/legacy events |
| Event `1.2.0` | fail closed | accept in mixed chain | TASK-021 operations only |
| Commit receipt `1.0.0` | fail closed | exact verification | `TASK_CLASSIFICATION`, `DESIGN_ONLY_CLOSURE`, and governed `LEGACY_COMPLETION_ATTEST` only |

Record schema is a closed `oneOf`: exact historical `1.1.0` fields without classification, or those exact fields plus required classification for `1.2.0`. Unknown future versions fail closed. Generic patch cannot change/delete schema version or classification.

Event `1.2.0` adds operation, source/result versions/classifications and a closed operation branch. Any Event whose source or result Record is `1.2.0` uses Event `1.2.0`, including Recovery, Archive and rejected/verification-failed attempts. Only events whose source/result are both `1.1.0` remain Event `1.1.0`. Operation-audit checksum precedes Event checksum and never contains it. A separate final receipt written after Event acknowledgement contains both checksums, avoiding a cycle.

Committed Event `1.2.0` branches are:

- `TASK_CLASSIFICATION` and `DESIGN_ONLY_CLOSURE`: full DAG/audit and final receipt required;
- `LIFECYCLE_RECOVERY`: existing Recovery preconditions/authority/Evidence, unchanged phase/classification, and the original classification receipt coordinate required; no classification/closure DAG is recreated and no new design-only completion receipt is issued;
- `LIFECYCLE_ARCHIVE`: existing Archive readiness, exact Owner Archive authority, classification/completion receipt coordinates and normal Event durable acknowledgement required. The Event retains a closed, checksummed Archive authority object containing the signed Owner envelope and immutable Authority Ledger/history proof; verified read resolves the trusted historical Owner key and rechecks the exact Canonical authorization summary. No false implementation DAG is introduced;
- `LEGACY_COMPLETION_ATTEST`: its signed attestation DAG/receipt branch, without Canonical completion mutation.

Verified read validates the branch appropriate to the operation. Recovery and Archive cannot substitute for or erase the original classification/completion receipt.

## 4. Signed Owner authority

Request Boolean `owner_authorized` is compatibility input only. Both operations require a signed Owner envelope and mandatory runtime verifier using SecurityOS or stronger equivalent.

The verifier establishes trusted Owner key/issuer, signature, actor identity, current authority epoch, no revocation, `effective_at <= commit_time < expires_at`, and exact binding to the operation-coordinate checksum defined in §4.1. Capabilities are `CLASSIFY_DESIGN_ONLY` or `COMPLETE_TASK`, both with `CANONICAL_STATE_COMMIT`. Authorization IDs are distinct.

Authority is verified before lease, after lease, and immediately before Snapshot publication. Any change is no-write Safe Stop.

### 4.1 Non-circular artifact DAG

Self-containing checksum graphs are forbidden and detected topologically. Classification is built once in this exact order:

1. `ClassificationBaseContext`: `canonical-status`, `task-definition`, `allowed-files`, `final-plan`.
2. `DesignOnlyClassificationStatement`: closed content-addressed artifact bound to Base Context checksum.
3. `ClassificationOperationCoordinate`: Project/Task, source revision/checksum, operation/phase/capabilities, Base Context checksum and Statement checksum.
4. signed Owner envelope over Operation Coordinate checksum.
5. `ClassificationOperationBundle`: Base Context, Statement, signed envelope and Authority Verification Attestation.

Completion order is:

1. `ClosureBaseContext`: `canonical-status`, `task-definition`, `allowed-files`, `final-plan`, `classification-commit-receipt`, `critic-round-1`, `critic-round-2`, `critic-round-3`, `judge-decision`.
2. `DesignOnlyClosureReadiness`: closed artifact bound to Closure Base Context checksum.
3. `CompletionOperationCoordinate`: Project/Task, source revision/checksum, operation/phase/capabilities, Base Context checksum and Readiness checksum.
4. signed Owner envelope over Operation Coordinate checksum.
5. `CompletionOperationBundle`: Base Context, Readiness, signed envelope and Authority Verification Attestation.

Base Context never contains the Statement/Readiness, signed envelope or attestation that depends on it. Final Operation Bundle is the full Evidence set committed to Event/audit. Swapping any DAG node invalidates all descendants.

`AuthorityVerificationAttestation` is closed, checksummed, and signed by a separately trusted SecurityOS verifier key. Its signed payload binds Operation Coordinate checksum, Owner envelope payload/signature checksums, Owner key ID/checksum, issuer, subject, authority epoch source immutable coordinate/revision/checksum, revocation source immutable coordinate/revision/checksum, verified effective window, verifier-observed time and `ALLOW`. Event time alone never proves validity. Immutable epoch/revocation bytes or hash-chain inclusion proof are retained content-addressably. Verified read rechecks verifier proof and Owner signature. Later revocation is not retroactive to a commit proven valid at commit time.

If no trusted verifier key or historical ledger proof is configured, the operation fails closed. A checksummed unsigned `ALLOW` object is never an Attestation.

## 5. Classification

Classification requires Canonical `ACTIVE / FINAL_PLAN / PASS`, effective `UNKNOWN`, verified signed authority/Owner actor, checksummed statement (`DESIGN_ONLY`, `implementation_required=false`, `implementation_authorized=false`), exact Task Definition/Allowed Files paths/checksums, and a Context Manifest matching Project/Task, revision and `FINAL_PLAN`.

Classification Base Context source IDs are code-fixed: `canonical-status`, `task-definition`, `allowed-files`, `final-plan`. The final Operation Bundle additionally requires `classification-statement`, `owner-classification-authority`, and `authority-verification-attestation`. Each set is exact; empty, missing, duplicate, substituted or extra sets fail closed. Statement closed schema, bytes and checksum are embedded in the Event and commit receipt so verified read can reconstruct the signed coordinate. `IMPLEMENTATION` classification is immutable here.

Classification is single-purpose. Other than schema/classification, revision, reason, actor/authority/Evidence, timestamps, last transition and checksum, every Canonical field remains byte-equivalent to the source.

## 6. Completion readiness

Closure requires:

- classified `1.2.0 / DESIGN_ONLY` source and exact target `COMPLETED / CLOSURE / PASS / NOT_REQUIRED / REVIEW_PENDING`;
- checksummed `DesignOnlyClosureReadiness` bound to Project/Task, current revision, classification, Canonical checksum and Context checksum;
- exact dimensions `technical`, `quality`, `policy`, `status`, `risk`, `follow_up`, `knowledge`, `resources`, `cost`, `owner`, each with Evidence checksums;
- `technical`, `quality`, `status`, `risk`, `follow_up`, `resources`, `owner` as `PASS|ACCEPTED`; only `policy`, `knowledge`, `cost` may be `NOT_APPLICABLE`, with non-empty reason and Evidence;
- unresolved Critical/High integers zero, recomputed from verified Critic Evidence; caller Boolean/counts alone are rejected;
- implementation/testing/review/judgment/policy-implementation deliverables `NOT_APPLICABLE`, without phase claims;
- a second verified signed Owner `COMPLETE_TASK` authority;
- exact Closure Base Context IDs: `canonical-status`, `task-definition`, `allowed-files`, `final-plan`, `classification-commit-receipt`, `critic-round-1`, `critic-round-2`, `critic-round-3`, `judge-decision`; final Operation Bundle additionally requires `closure-readiness`, `owner-complete-task-authority`, `authority-verification-attestation`.

Unknown/`IMPLEMENTATION` are rejected even if Boolean, queue or projection claims completion.

Completion sets `entered_at` to commit time, clears blockers, sets `next_eligible_phases=["ARCHIVE"]`, and retains checkpoint only as historical Evidence. `authorization_status=NOT_REQUIRED` means implementation authorization is inapplicable. Mutation authority is represented by Canonical `authorization_reference` summary plus complete Event/receipt envelope and Attestation.

## 7. Context, path and TOCTOU

Base Context Manifest must match Project/Task, `FINAL_PLAN`, exact revision, fixed source set, Trust, Freshness and Sensitivity. Evidence equals required Context by `(source_id, normalized real path, raw_file_sha256, artifact_content_checksum|null)`. Source count is capped at 32 and Event at 256 KiB. Secrets/credentials are forbidden.

All authority, Task, Allowed Files, Context and Evidence paths use one SecurityOS resolver: normalize both separators; reject absolute/UNC/device/parent traversal; resolve trusted root and target realpaths; reject symlink/junction/reparse escape and non-regular files; enforce volume/root containment.

The store freezes source ID, realpath, bytes and checksum. After lease and immediately before Snapshot publication it re-resolves/re-reads everything and revalidates authority, Manifest and readiness. Difference is no-write Safe Stop.

## 8. Audit and durability

Existing revision, lease/fencing, Snapshot transaction, append-only hash chain and literal-Boolean acknowledgement remain mandatory.

Each Event contains complete Manifest, operation metadata, all five source/result axes, versions/classifications/revisions, authorization identity/checksum, normalized Evidence tuples, resulting Canonical checksum, timestamp and operation-audit checksum.

Every TASK-021 attempt uses Event `1.2.0` regardless of outcome. Closed outcome `oneOf`: `COMMITTED` requires its operation-specific branch above; `REJECTED|VERIFICATION_FAILED` requires store audit ID, sanitized request digest and failure code but never treats unverified authority as Evidence; `RECOVERED` requires original transition coordinate and system recovery metadata. Null result fields are explicit.

`transition_id` is a lowercase canonical UUID generated by the store, maximum 36 ASCII characters, and is included in the signed Operation Coordinate/audit. Caller-chosen noncanonical IDs, separators, dots, ADS syntax and Windows device names are rejected. Transaction and receipt filenames use the validated UUID digest, and every internal read/write is root-confined through the SecurityOS writable resolver.

`prepareDesignOnlyOperation()` reserves the UUID against source revision/checksum and operation for a bounded TTL before Owner signing. Commit consumes the reservation once by CAS; abandoned, expired, replayed, wrong-revision or already-consumed reservations are rejected without Canonical mutation.

Closure skipped phases are ordered/unique exactly: `IMPLEMENTATION_AUTHORIZATION`, `IMPLEMENTATION`, `TESTING`, `IMPLEMENTATION_REVIEW`, `FINAL_JUDGMENT`, `POLICY_REVIEW`. Each has `entered=false`, `gate_result=NOT_APPLICABLE`, `authorization=NOT_REQUIRED`. Source/result revisions are consecutive with no intermediate commit.

After complete Event acknowledgement, the store fsyncs `audit-receipts/<transition-id>.json`, syncs directory, rereads/verifies it, then marks Journal VERIFIED/COMMITTED and cleans Journal/Lease. The receipt binds acknowledgement, Event checksum, operation-audit checksum and resulting Canonical checksum.

Receipt verification revalidates Log chain, unique Event, receipt checksum, complete acknowledgement, identity/revisions/Canonical checksum. Event existence alone is insufficient. Rejected/recovery append is serialized with append lease, tail revalidation, file/directory sync and post-append verification; ambiguity fails closed.

Receipt acknowledgement is a closed exact object and its transition ID, Event checksum and resulting revision must equal the Event. `committed_at`, Event `created_at`/`verified_at` and operation-audit `created_at` are finite RFC 3339 values and exactly equal. Event 1.2 is checked by the same operation/outcome contract before append and during verified read; unknown caller operation names are retained only in the sanitized request digest and normalized to `PHASE1` for audit, so malformed input cannot poison the Log.

APPLIED recovery may deterministically generate a not-yet-published receipt only from complete acknowledgement and exact Snapshot/Event identity. At VERIFIED or later, a missing receipt is tamper/loss and becomes `AUDIT_RECEIPT_INVALID / RECOVERY_REQUIRED`; it is never silently regenerated. Otherwise Evidence remains retained for Owner-authorized forward recovery.

All checksummed artifacts use UTF-8 canonical JSON: object keys sorted recursively, array order preserved, no insignificant whitespace/newline, and only that artifact's declared checksum field omitted. Raw file hashes cover exact bytes. Closed schemas define field sets and maximum lengths.

## 9. Verified queue/dependency binding

Authoritative selector/dependency APIs consume `CanonicalTaskBinding` from `LifecycleStore.readVerifiedCanonical`, never caller records. Verified read establishes trusted directory identity, Project/Task match, record checksum/revision, no unresolved Journal/Lease, valid mixed Log chain, exactly one matching committed last Event, and for design-only completion a verified final receipt. It also reconstructs the DAG, verifies the full signed Owner envelope against trusted key/issuer, checks actor/operation/source revision/Base Context/Statement or Readiness binding, and validates the commit-time Authority Verification Attestation. Self-consistent unsigned or wrong-key files are rejected.

Binder derives queue `COMPLETED` only from verified Canonical `COMPLETED`, rejects projection completion otherwise, and binds project/task/revision/record/event/receipt checksums. Binding is noncanonical.

`selectAutonomousTask` and `evaluateDependencies` require an expected Project ID and exact same-Project identity for every candidate/task row in the bounded Consumer invocation, plus a valid binding for every `COMPLETED` dependency. Raw completion is invalid. Each binding carries a Store-generated `observation_id`, `observed_at` and bounded `expires_at`; callers cannot choose the observation identity. A snapshot coordinator collects those verified reads and signs one closed member manifest containing exact Project/Task, revision, Canonical checksum and binding payload checksum. The selector accepts only the exact, unexpired signed set; an optional usage ledger makes a selection snapshot single-use within the owning runtime, while durable dispatch still uses its existing outbox/idempotency/fencing controls. Stale, expired, replayed through that ledger, cross-Project, mixed or partial bindings and receipt/materialization failure cause no dispatch. The dependent Task's own Authority, Human Gates and blockers are then reevaluated.

Legacy `1.1.0` completed records have no retained final acknowledgement after Journal cleanup. `LEGACY_COMPLETION_ATTEST` is therefore a third governed operation. It requires distinct signed Owner capabilities `ATTEST_LEGACY_COMPLETION` and `CANONICAL_QUEUE_BINDING`, plus the same trusted-verifier signed Authority Verification Attestation.

Its Operation Coordinate binds Project/Task, source revision/checksum, immutable completion-time Log prefix length/head checksum, historical completion Evidence checksums, migration epoch/time, store-generated single-use preparation ID and capability. Verified read rechecks Owner/verifier signatures, epoch/revocation proof, actor/scope and exact inclusion of the attested Log prefix; later valid appends do not invalidate it. Unsigned, Boolean-only, wrong-key, expired, revoked, replayed or cross-Task/revision/prefix attestations are rejected. Confirmable legacy completion becomes a binding; unconfirmed legacy is parked.

All ordinary `1.1.0` completions, whether created before or after TASK-021 runtime adoption, require `LEGACY_COMPLETION_ATTEST` before Canonical queue binding. TASK-021 does not silently retrofit or emit a normal-completion receipt for `1.1.0`; this removes dual semantics. A future ordinary completion receipt is separate follow-up scope.

## 10. Migration and rollback

No historical rewrite. Migration: drain writer/lease/journal; back up; install new runtime; shadow-validate `1.1`; establish one writer/cutover receipt (no dual writers); build/dry-run/commit classification; verify `1.2` receipt; build/dry-run/commit closure; verify receipt; materialize bindings; recalculate dependencies/queue.

Before Snapshot publication, failure leaves Canonical unchanged. After APPLIED, uncertainty is `COMMIT_STATE_UNKNOWN / RECOVERY_REQUIRED`, not rollback.

The downgrade point of no return is the first committed `1.2.0` Record or first durably appended valid Event 1.2 of any outcome (`COMMITTED`, `REJECTED`, `VERIFICATION_FAILED`, or `RECOVERED`). “Committed Event” here means committed to the append-only Log, not only `outcome=COMMITTED`. The migration plan binds the source schema, revision and Canonical checksum. Before PONR, old runtime may return only after a closed Store proof exactly matches Project/Task/schema/revision/checksum and supplies literal Boolean writer/journal/lease/PONR fields. Missing fields, stale copies and caller Booleans fail closed. After PONR, downgrade is forbidden; restore TASK-021 runtime and forward-recover. Classification may remain at `FINAL_PLAN / DESIGN_ONLY`. Completed Tasks cannot reopen.

The Canonical Record `authorization_reference` stores the verified Owner envelope summary/reference for the mutation that produced the record, including authorization ID, path/checksum and exact scope. The complete envelope, signature and attestation remain in Event/receipt. `authorization_status=NOT_REQUIRED` remains the orthogonal implementation-authorization axis.

## 11. Consumer boundary and BAI VOICE APP profile

Consumers keep only their Canonical Status, Task/Evidence and existing thin adapter. They MUST NOT vendor OS Core or add an OS runtime service. Use external tooling bound to exact TASK-021 implementation commit/version.

BAI VOICE APP preflight expects root `D:\BAI\BAI VOICE APP`, resolved checkpoint `415ac2ce1bcc5a38a3bdd366536d7350b3c64c14` (reported abbreviation `415ac2c`), TASK-001 revision `13` and tuple `ACTIVE / FINAL_PLAN / PASS / PENDING / NOT_ELIGIBLE`, Gate `HG-TASK-001-DESIGN-ONLY-CLOSURE-001 / WAITING_OWNER`, queue `NO_RUNNABLE_TASK`, TASK-002–009 dependency wait. Execution MUST compare the full 40-character Consumer commit. Mismatch rebuilds the plan; values are never forced.

Two distinct signed Owner envelopes are required. Human Gate is coordination, not authority; it remains waiting through dry-run/classification and is satisfied/closed only after verified completion receipt per Consumer policy.

Implementation Evidence MUST publish the exact OS commit/minimum version, exported API names and request/receipt fields. The normative runbook MUST use those names for preflight, classification dry-run/commit, receipt verify, closure dry-run/commit, verified Canonical read, binding materialization and dependency reevaluation before Consumer execution is eligible.

After completion, TASK-002–009 are reread as one dependency snapshot. TASK-002 becomes ready only if TASK-001 was its sole unmet dependency; TASK-003–009 remain governed by their dependencies/Gates. Queue output is Evidence, not authority.

## 12. Safe Stop and acceptance

Codes include `TASK_CLASSIFICATION_REQUIRED`, `TASK_CLASSIFICATION_IMMUTABLE`, `DESIGN_ONLY_CLASSIFICATION_INVALID`, `DESIGN_ONLY_CLOSURE_INVALID`, `DESIGN_ONLY_COMPLETE_TASK_AUTH_REQUIRED`, `CONTEXT_MANIFEST_INVALID`, `CONTEXT_EVIDENCE_BINDING_INVALID`, `QUEUE_COMPLETION_CANONICAL_MISMATCH`, `AUDIT_RECEIPT_INVALID`, `CANONICAL_READ_NOT_VERIFIED`, `LIFECYCLE_RUNTIME_DOWNGRADE_FORBIDDEN`.

Acceptance requires legacy/focused/full tests; deterministic DAG construction and cycle rejection; strict UUID/internal path and prepare TTL/single-use/replay tests; implementation/unknown/bypass/downgrade and pause/block/stall phase-bypass negatives; wrong Owner/verifier key, actor/scope/revision/expiry/revocation/TOCTOU, fake unsigned `ALLOW`, backdated Event and post-commit forgery negatives; empty/swapped Context and all-N/A negatives; Windows path escape negatives; forged/stale/missing receipt/dependency and signed legacy-attestation/prefix negatives; `1.2.0` Recovery/Archive branch and crash tests; all ordinary `1.1.0` completion attestation boundaries; mixed-log/outcome-schema/crash/downgrade tests; three independent Critic rounds at Critical/High `0/0`; Judge PASS; and no Release/Deploy/Tag/Consumer/native/paid/credential/Production effects.
