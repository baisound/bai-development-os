# D-05 / D-06 Design Amendment Proposal

## Metadata
- Authoring Role: Builder
- Active Project: `/home/baisound/projects/javascript-roulette`
- Active Task: `TASK-004`
- Scope: Phase 1, D-05 and D-06 design amendment only
- Implementation Authorization: NOT_AUTHORIZED

## Objective
Define the minimum amendment for D-05 recovery completeness and D-06 append-only integrity without modifying the approved Final Plan, D-01–D-04, later phases, Knowledge, Registry, Automation, or any runtime artifact.

## Evidence Reviewed
- `AGENTS.md`, `PROJECT.md`, `task.md`, `final-plan.md`, `final-plan-consistency-check.md`.
- `test-report.md`, `retest-report.md`, `retest-report-02.md`, `implementation-report.md`, `implementation-fix-report.md`.
- Builder and common Workflow, Authority, Evidence, and Artifact specifications.
- Architecture Ver.1.1, TASK-004 Detailed Design Ver.1.1, and TASK-004/TASK-005 boundary review, read with the mandated DOCX extraction procedure.

## Procedures
Reviewed saved canonical evidence and the three mandatory DOCX documents. No runtime, test, schema, Final Plan, historical artifact, or shared specification was modified. This proposal is the only changed file.

## Amendment Reason
Tester Cycle 2 confirms D-01–D-04 as PASS, but records D-05 as BLOCKING: VERIFY-failure cleanup and the complete crash-boundary matrix are not fully specified/proven. D-06 remains NOT_CONFIRMED: checksum-chain fields exist, but complete log tamper, duplicate, ordering, and migration validation is not defined or independently proven.

The approved Final Plan establishes journaling, recovery, JSONL append-only logging, checksums, and `MIGRATION_MAPPING`, but does not define every recovery boundary’s canonical-determination rule nor a complete log/mapping verifier. An implementation-only patch would choose unreconciled recovery and integrity semantics; therefore this bounded amendment is required before any D-05/D-06 implementation authorization.

## Existing Design Preservation
The following remain unchanged:
- The five orthogonal state axes, Canonical Status Record as the sole current-state authority, JSONL Transition Log as audit history, revision/expected-revision rules, 60-second non-extendable Lease, and `PREPARE → AUTHORIZE → ACQUIRE_LEASE → APPLY → VERIFY → COMMIT → RELEASE_LEASE`.
- D-01 authorization/evidence enforcement, D-02 fencing/transaction eligibility, D-03 PREPARED recovery, and D-04 request/schema validation.
- Phase 2–6 operational behavior, TASK-005 Knowledge ownership, TASK-006 Registry/Automation, and all historical artifacts.

## Journal State Model
The Journal is transaction-local, never the current-state authority. A transaction has one immutable `transaction_id`, `expected_revision`, candidate snapshot checksum, candidate event checksum, lease ID/generation/fencing token, and state.

| State | Entry / exit | Effects and recovery |
|---|---|---|
| `PREPARED` | Enter only after durable candidate snapshot/event and Journal write; exit to `APPLIED`, `ABORTED`, or `RECOVERY_REQUIRED`. | Canonical snapshot/revision and log unchanged; Lease active. On recovery, candidates may be deleted only after checksum/identity validation; otherwise `RECOVERY_REQUIRED`. |
| `APPLIED` | Enter only after durable snapshot rename; exit to `VERIFIED`, `COMMITTED`, or `RECOVERY_REQUIRED`. | Canonical snapshot may be new revision but event may be absent. Recovery may append exactly the candidate event only if snapshot revision/checksum/last_transition_id match; otherwise Safe Stop. |
| `VERIFIED` | Enter only after re-reading canonical snapshot and event and validating their correlation; exit to `COMMITTED` or `RECOVERY_REQUIRED`. | Both durable records are present and valid. It is a journal acknowledgement, not a second state commit. |
| `COMMITTED` | Enter only after `VERIFIED`; terminal journal state. | Lease is released, then journal cleanup is permitted. Re-entry or duplicate event is prohibited. |
| `ABORTED` | Enter on known VERIFY failure before snapshot replacement, or recovery of a validated uncommitted candidate. | Canonical snapshot/revision unchanged; candidate files and Lease are removed; exactly one terminal recovery/failure event is retained when an event is auditable. |
| `RECOVERY_REQUIRED` | Enter on missing, inconsistent, tampered, or ambiguous journal/candidate/snapshot/event evidence. | No snapshot, log, Lease, or candidate deletion/write occurs except an independently durable Safe-Stop marker if its target is unambiguous. Owner/Judge-directed remediation is required. |
| `SUPERSEDED` | Enter only when a later valid transaction has committed for the same expected revision or a valid `superseded_by` reference exists. | Cannot commit. Candidate and Lease are invalidated after evidence preservation; no COMMITTED event for the superseded transaction. |

Prohibited transitions include `ABORTED|COMMITTED|SUPERSEDED → PREPARED`, `RECOVERY_REQUIRED → COMMITTED`, and any commit after Lease expiry, generation mismatch, or event identity duplication.

## Crash Recovery Matrix
| Boundary | Detection and canonical determination | Recovery / idempotence |
|---|---|---|
| Immediately after Journal | `PREPARED`; snapshot/event remain canonical-old. | Validate candidate identities; mark `ABORTED`, remove candidates/Lease, retain one recovery event. Re-run performs no further change. |
| Candidate after/before VERIFY | Candidate checksum/schema/evidence/Lease result unavailable or fails. | Do not replace snapshot; `ABORTED`; release Lease; no COMMITTED event. |
| VERIFY failure | Failure outcome and old canonical snapshot are verified. | Append one `VERIFICATION_FAILED` event chained to current tail, clean candidate/Lease/journal, and retain old revision. Duplicate invocation detects terminal Journal state. |
| VERIFY success/pre-COMMIT | Candidate valid but no replacement yet. | Treat as `PREPARED`, not committed; crash recovery aborts unless durable APPLIED evidence exists. |
| Snapshot replacement/pre-event | Snapshot revision/checksum/last_transition_id equals candidate, event absent. | Append exactly candidate Event if its checksum, previous checksum, revision, actors, and transaction ID validate; then `VERIFIED`. Any mismatch is `RECOVERY_REQUIRED`. |
| Event confirmation/pre-Lease release | Snapshot and exactly one matching Event validate. | Mark `COMMITTED`, release Lease, remove Journal. Retry is idempotent and must not append an event. |

## Append-only and Integrity Model
- Log append requires: valid current tail, unique `transition_id`, unique `(expected_revision, resulting_revision)` for a COMMITTED event, and no prior finalized transaction ID.
- Each Event uses canonical JSON UTF-8 and `entry_checksum` over the Event excluding itself; `previous_entry_checksum` equals the preceding verified tail or `sha256:GENESIS`.
- A verifier reads all lines in order, rejects malformed JSON, unknown schema, duplicate transaction IDs, duplicate committed resulting revisions, broken previous checksum, invalid entry checksum, illegal outcome/revision combinations, or snapshot/log revision disagreement.
- Any verifier failure is `COMMIT_STATE_UNKNOWN`/Safe Stop: it must not truncate, reorder, repair, or infer a canonical state. Repair requires a new authorized recovery procedure and append-only evidence.
- Existing lines are never modified. Corrections use a new Event and new revision only where the snapshot transition is independently valid.

## Migration Validation
`MIGRATION_MAPPING` remains reference-only and must require: `mapping_id`, `source_task_id`, `legacy_expression`, complete five-axis `mapped_state`, `confidence`, non-empty `source_evidence`, `mapped_by`, `created_at`, and self-excluding SHA-256 checksum.

`source_task_id` must match the mapping’s evidence Task identity; source evidence paths/checksums must resolve to unchanged historical artifacts; duplicate `mapping_id` or duplicate source-evidence/checksum mappings are rejected. `LOW` confidence, conflicting mappings, missing evidence, checksum mismatch, or ambiguous legacy meaning must produce `NOT_CONFIRMED` and must not create/update Canonical Status Record state. No migration validator may edit TASK-001–003.

## Compatibility and Migration
Runtime implementation will add Journal fields/states and a verifier under a new compatible schema minor version only after Judge approval. Existing valid `PREPARED`, `SNAPSHOT_RENAMED`, and `LOG_APPENDED` journal records require an explicit compatibility mapper to the above states; unmappable records Safe Stop. Fixtures must add valid/tampered Journal, Event chain, and Mapping cases. D-01–D-04 regression coverage must remain unchanged and run before D-05/D-06 tests.

## Machine-Verifiable Test Requirements
1. Inject every Crash Recovery Matrix boundary; assert snapshot bytes, revision, Event cardinality, Lease/candidate/journal cleanup, and repeated-recovery idempotence.
2. Force snapshot/event checksum, transaction ID, actor, revision, and prior-checksum mismatches; assert `RECOVERY_REQUIRED` and no writes.
3. Attempt edited, deleted, reordered, duplicate-ID, duplicate-revision, and broken-chain JSONL logs; assert verifier Safe Stop.
4. Attempt duplicate committed transaction after recovery and supersession; assert no second Event and unchanged canonical revision.
5. Validate migration required fields, enum/type/nullability/checksum, task/evidence identity, duplicate mapping rejection, historical source read-only behavior, and LOW/conflict `NOT_CONFIRMED`.
6. Re-run D-01–D-04 regression tests and assert their existing outcomes.

## Residual Risks
The design is limited to Node v24.18.0 on Linux WSL2 and same-filesystem ext4 semantics. Directory/file fsync and rename cannot prove power-loss durability in unit tests; non-target filesystems, power failure between device persistence barriers, and manually altered files outside the verifier’s observed sequence remain Safe-Stop conditions, not PASS claims.

## Unresolved Limits
- This proposal does not authorize a Journal schema change, runtime implementation, test implementation, migration execution, or Final Plan revision.
- D-06 severity remains NOT_CONFIRMED until independent verifier tests are observed.
- A Judge must determine whether this amendment is compatible with the approved Final Plan and whether an updated Final Plan/consistency check is required.

## Handoff Information
This Builder proposal is advisory evidence only. It does not route, approve, authorize implementation, or claim Judge approval.

AMENDMENT_READY_FOR_JUDGE
