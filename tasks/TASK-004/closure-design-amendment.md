# TASK-004 Phase 5A — Completion Transition MVP Design Amendment

## 1. Document Control

- Authoring Role: Lifecycle Closure Design Architect
- Active Project / Task: `/home/baisound/projects/javascript-roulette` / `TASK-004`
- Phase: Phase 5A — Completion Transition MVP
- Scope: detailed design only; no implementation authorization
- Allowed persistent file: this file only
- Result: `PHASE5A_DESIGN_READY_WITH_CONDITIONS`

## 2. Authority and Source Evidence

This amendment is a bounded Phase 5A input to a future Final Plan Amendment. It preserves the Phase 1 Final Plan, D-05/D-06 Amendment, Judge approval, and historical Evidence.

Primary authorities:

- `task.md` §4.5 assigns Closure / Archive / Historical Migration to TASK-004 Phase 5.
- Lifecycle Foundation Ver.1.3 defines Closure Readiness, `COMPLETED`, Archive Readiness, Canonical Status Record, and Transition Log.
- `closure-capability-gap-decision.md` places Closure state rules in TASK-004, not TASK-006.
- Phase 1 code intentionally rejects `COMPLETED` / Archive operational transitions.

## 3. Phase 5A Purpose

Phase 5A provides the minimum safe capability to turn an Owner-authorized, evidence-complete TASK-004 from `ACTIVE` into `COMPLETED`. It must not run an archive operation, alter historical Evidence, or automate routing.

```text
Completion Request
→ Authority / Evidence / Readiness validation
→ durable Status + Event + Completion Record transaction
→ Canonical COMPLETED
→ derived-view synchronization request
```

## 4. Scope

In scope:

- production Canonical Status initialization / migration path distinct from fixtures;
- Closure Request and Completion Authorization validation;
- Closure Readiness validation;
- `ACTIVE → COMPLETED` transition;
- lease, fencing, journal, durable acknowledgement, recovery;
- immutable Completion Record;
- derived-view synchronization request / acknowledgement contract;
- idempotency, negative tests, independent verification and final judgment.

## 5. Out of Scope

- Archive execution, archive physical movement, read-only enforcement, archive checksum, archive manifest, retention, restore, and `COMPLETED → ARCHIVED`;
- TASK-003 migration execution;
- Registry discovery / autonomous update, routing, owner prompt generation, cross-project execution;
- Foundation Git initialization, Push, Tag, Release;
- TASK-000 / TASK-005 / TASK-006 implementation.

## 6. Existing Phase 1 Boundary

Phase 1 supplies canonical serialization, checksum, expected revision, lease / fencing, journal states, append-only Event, re-read verification, recovery, and no-guess Safe Stop. It permits only its bounded transition matrix and explicitly rejects:

- `ACTIVE → COMPLETED`;
- `COMPLETED → ARCHIVED`;
- `archive_status` business transitions;
- Registry event / lookup / write.

Phase 5A reuses the durability protocol but adds no new Journal state. The existing prototype fixture remains immutable test material.

## 7. Completion Semantics

- **Phase 1 implementation completion**: `IMPLEMENTATION_APPROVED`; it remains unchanged.
- **TASK-004 overall completion**: only a valid Phase 5A completion transaction, Closure Readiness result, Completion Record, and required independent evidence can establish it.
- **Archive**: separate Phase 5B operation after `COMPLETED`.

`COMPLETED` remains task-level and terminal. It is not a label for Phase 1 completion.

## 8. State Model

### Production-state bootstrap

The fixture cannot become the production Record. Phase 5A first creates a new, Project-owned production state root:

```text
docs/ai-team/lifecycle/tasks/TASK-004/
  canonical-status.json
  transition-log.jsonl
  transaction-journal.json
  lease.json
  completion-record.json
```

The root is proposed only; it requires explicit Owner path approval before implementation. Creation is an authorized `STATE_BOOTSTRAP_FROM_EVIDENCE` transaction, not a direct fixture edit. It references historical Evidence by checksum and records why historical operational state cannot be reconstructed.

### Pre-completion state

A Completion Request may execute only from:

```yaml
task_status: ACTIVE
current_phase: CLOSURE
gate_status: READY
authorization_status: AUTHORIZED
archive_status: NOT_ELIGIBLE
```

`READY`, not `PASS`, is used before the request because the Completion Readiness Validator is the operation that produces the final Closure gate result. Entering `CLOSURE` from `POLICY_REVIEW` is a separate, prior, authorized transition requiring policy verification Evidence.

### Completion result state

```yaml
task_status: COMPLETED
current_phase: CLOSURE
gate_status: PASS
authorization_status: NOT_REQUIRED
archive_status: REVIEW_PENDING
```

The Owner Completion Authorization is retained in `authorization_reference` and the Completion Record. `NOT_REQUIRED` means no further execution authorization is active after the terminal transition; it does not erase the authorization that enabled the transition.

## 9. Transition Preconditions

The Completion transition is valid only when all are true:

- production Record and Transition Log are valid and no unresolved Journal / active Lease exists;
- `expected_revision` equals current `record_revision`;
- `from` exactly matches current five status axes;
- completion authorization is Owner-issued, active, task-bound, revision-bound, operation-bound, and evidence-manifest-bound;
- Closure Readiness result is `CLOSURE_READY`;
- Critical = `0` and High = `0`;
- required evidence and checksums match;
- follow-up, knowledge, risk, resource, and cost rules pass;
- requested `to` state exactly matches section 8;
- Archive operation is absent.

All other completion attempts are rejected without changing the Snapshot.

## 10. Completion Request Schema

`CompletionRequest` is an immutable candidate, not canonical state.

| Field | Type / required | Validation and authority | Failure |
|---|---|---|---|
| `request_id` | UUID / required | unique per Task; Owner authorization binds it | `COMPLETION_ALREADY_APPLIED` |
| `task_id`, `project_id` | string / required | exact active Project / Task | `COMPLETION_TRANSITION_FORBIDDEN` |
| `expected_revision` | integer ≥1 / required | exact current production Record revision | `COMPLETION_REVISION_CONFLICT` |
| `requested_by` | Actor Identity / required | Orchestrator may propose; not authorize | `SCHEMA_INVALID` |
| `owner_authorization_reference` | Authorization Reference / required | Owner, `COMPLETE_TASK`, task / revision / request / evidence-manifest binding, non-expired, non-revoked | `COMPLETION_AUTHORIZATION_INVALID` |
| `completion_reason` | string 1–2000 / required | auditable reason | `SCHEMA_INVALID` |
| `required_evidence` | Evidence Reference[] / required | immutable complete set, project-relative, checksum matches | `COMPLETION_EVIDENCE_MISSING` |
| `critical_findings`, `high_findings` | integer / required | both exactly `0` | `COMPLETION_FINDINGS_UNRESOLVED` |
| `accepted_risks` | AcceptedRisk[] / required | each has Owner acceptance reference; may be empty | `COMPLETION_READINESS_FAILED` |
| `follow_up_tasks` | FollowUpReference[] / required | explicit or empty with reason; each is blocking / nonblocking | `COMPLETION_READINESS_FAILED` |
| `knowledge_handoff_status` | enum / required | section 16 | `COMPLETION_READINESS_FAILED` |
| `resource_cleanup_evidence` | ResourceCheck[] / required | section 17 checks observed | `COMPLETION_READINESS_FAILED` |
| `active_session_check` | SessionCheck / required | scope / command / timestamp / observed result; cannot claim unobservable global state | `COMPLETION_READINESS_FAILED` |
| `requested_at` | RFC3339 UTC / required | current request | `SCHEMA_INVALID` |
| `request_checksum` | sha256 / required | canonical JSON excluding checksum | `CHECKSUM_INVALID` |

## 11. Completion Readiness Validator

The validator returns only `CLOSURE_READY`, `CLOSURE_BLOCKED`, or `CLOSURE_NOT_CONFIRMED`.

Required evidence set:

- Final Implementation Judgment = `IMPLEMENTATION_APPROVED`;
- latest independent test / retest and probe evidence;
- latest Critic reassessment;
- Project Policy Review and any required Policy VERIFY;
- Completion Review and registry-resolution evidence;
- Cross-format consistency and canonical promotion evidence;
- current Git baseline observation;
- production status / log / lease / journal state;
- Owner Completion Authorization.

Critical or High > 0 is `CLOSURE_BLOCKED`. Medium / Low are allowed only if each is classified as accepted risk or explicit nonblocking follow-up with Owner reference; otherwise `CLOSURE_NOT_CONFIRMED`.

## 12. Authority Model

- Owner alone issues `COMPLETE_TASK` authorization.
- Orchestrator may assemble evidence, detect readiness, propose a request, and operate the approved single update window; it cannot self-authorize.
- Builder may implement Phase 5A only after separate implementation authorization; it cannot issue a Completion Authorization.
- Tester, Critic, and Judge verify / judge within their roles and cannot mutate Status.
- Completion Authorization must have a finite expiry, exact `task_id`, expected revision, request ID, operation `COMPLETE_TASK`, permitted production root, and evidence-manifest checksum.
- Revoked, expired, reused, different-task, different-revision, or checksum-mismatched authorization is invalid.

## 13. Evidence Requirements

Every referenced artifact must be project-relative, readable, SHA-256-matched, and have an allowed authoring Role. The Completion evidence manifest must include:

- implementation / Tester / Critic / Judge results;
- policy and documentation synchronization outcome;
- Critical / High count;
- risks and follow-ups;
- knowledge status;
- resource / session / temporary / secret checks;
- actual cost reconciliation;
- authorization decision.

Missing or unobserved evidence is never treated as PASS.

## 14. Findings and Accepted Risk

Critical and High must be zero. An Accepted Risk requires:

```yaml
risk_id:
description:
severity:
owner_acceptance_reference:
safe_stop_effect:
review_or_follow_up_reference:
```

Residual risks such as physical power-loss durability, device persistence barrier, non-ext4, non-WSL2, unverified Node / OS / filesystem, and distributed transactions remain visible. They may be accepted only by Owner and never reclassified as resolved by completion.

## 15. Follow-up Task Handling

Each deferred item must be either:

- `BLOCKING`: Closure remains blocked until its specified condition is met; or
- `NONBLOCKING`: preserved as an explicit follow-up with rationale and Owner acceptance.

TASK-000 / TASK-005 / TASK-006 not started is nonblocking for TASK-004 Phase 5A when they remain planned and no Closure validation depends on their execution. No new task is generated automatically.

## 16. Knowledge Handoff

Allowed values:

- `NONE`: no candidate identified; evidence explains the determination. Completion allowed.
- `CANDIDATE_PRESENT`: immutable candidate references and handoff metadata are present. Completion allowed; TASK-005 need not start.
- `REVIEW_REQUIRED`: provenance / scope / sensitivity / recipient is unresolved. Completion blocked until Owner resolves or explicitly reclassifies.

Phase 5A records handoff status and references only. It does not create, promote, or modify a Knowledge Asset.

## 17. Resource Cleanup

The validator requires observed evidence for:

- no active Lifecycle lease;
- no unresolved transaction journal / recovery condition;
- no temporary fixture / probe / backup / cache in the approved runtime root;
- no active Builder / Tester / Critic / Judge process observable in the approved OS-process scope;
- secret scan result for new state / record / evidence files;
- no unintended untracked / modified path outside approved boundary;
- actual cost reconciliation or explicit `NOT_CONFIRMED`.

`active_session_check` must identify its observation boundary. It cannot claim that all Cursor sessions everywhere are absent.

## 18. Transaction Model

Reuses exactly: `PREPARED → APPLIED → VERIFIED → COMMITTED`, plus `ABORTED`, `SUPERSEDED`, and `RECOVERY_REQUIRED`. No new Journal state is introduced.

The Journal is extended with:

- `completion_request_checksum`;
- `completion_record_tmp`, `completion_record_checksum`;
- `completion_record_written`, `completion_record_synced`, `completion_record_verified`;
- derived synchronization request ID / checksum;
- Snapshot / Event / Completion Record identity bindings.

## 19. Durable Commit

The Completion Record is a commit-critical companion, not post-commit best effort.

1. Validate Completion Request, authorization, readiness, current Record / Log / Journal / Lease.
2. Acquire 60-second lease and re-read revision / fencing.
3. Stage candidate Status, Event, and Completion Record temporary files; fsync all; journal `PREPARED` includes all checksums.
4. Re-validate eligibility; rename Status; fsync status directory; journal `APPLIED`.
5. Append / fsync Event and its directory; exact re-read and acknowledgement verification.
6. Rename / fsync Completion Record and its directory; exact re-read, checksum, status-revision, transition-ID, request-ID and authorization identity verification.
7. Journal `VERIFIED`, then durable `COMMITTED`.
8. Release Lease and remove temporary files / Journal.
9. Expose the already durable derived-view synchronization request for later authorized consumers.

If failure occurs after Status rename but before a verified Completion Record, Journal recovery may finish only when all staged identities exactly match. Otherwise it remains `RECOVERY_REQUIRED` / `COMPLETION_STATE_UNKNOWN`; the physical Snapshot must not be treated as canonical completion.

## 20. Completion Record

`completion-record.json` is immutable canonical completion evidence, paired with but not replacing the Canonical Status Record.

```yaml
schema_version: "1.0.0"
completion_id: UUID
task_id: TASK-004
project_id: javascript-roulette
completed_revision: integer
completed_at: RFC3339 UTC
completed_by: ActorIdentity
authorization_reference: AuthorizationReference
completion_request_reference: { request_id, checksum }
final_status_checksum: sha256
transition_event_reference: { transition_id, checksum }
evidence_manifest: EvidenceReference[]
accepted_risks: AcceptedRisk[]
follow_up_tasks: FollowUpReference[]
knowledge_handoff_status: NONE|CANDIDATE_PRESENT|REVIEW_REQUIRED
residual_risks: RiskReference[]
archive_eligibility: REVIEW_PENDING
derived_synchronization_request: DerivedViewSynchronizationRequest
record_checksum: sha256
```

The record becomes immutable only when its journal transaction reaches `COMMITTED`. Retry uses `(task_id, completed_revision, transition_id, final_status_checksum)` as the uniqueness / identity key. Phase 5B reads it as archive input.

## 21. Derived View Synchronization

Canonical completion does not synchronously mutate Registry, Current State, Index, or Summary. The Completion Record contains a durable `DerivedViewSynchronizationRequest`:

```yaml
request_id: UUID
source_completion_id: UUID
source_status_revision: integer
source_status_checksum: sha256
required_views: [registry, current_state, current_index, task_summary]
status: PENDING
idempotency_key: task_id + completed_revision + completion_id
```

Failure to update a derived view does **not** roll back `COMPLETED`; a rollback would violate append-only terminal state. It remains canonical completion with synchronization request `PENDING`, not a new task status such as `COMPLETED_BUT_SYNC_PENDING`.

An authorized Registry process later records acknowledgement by request ID. A mismatch is detected as `CONFLICTED` / `COMPLETION_SYNC_PENDING`; Completion Review reassessment requires successful derived-view verification but cannot rewrite the Status.

## 22. Error Codes

| Code | Reuse / meaning | Retry |
|---|---|---|
| `COMPLETION_AUTHORIZATION_MISSING` | specialized `AUTHORIZATION_MISSING` | no |
| `COMPLETION_AUTHORIZATION_INVALID` | expired / revoked / binding mismatch | no |
| `COMPLETION_EVIDENCE_MISSING` | specialized `EVIDENCE_INVALID` | no |
| `COMPLETION_FINDINGS_UNRESOLVED` | Critical / High > 0 | no |
| `COMPLETION_REVISION_CONFLICT` | specialized `REVISION_CONFLICT` | new request |
| `COMPLETION_LEASE_CONFLICT` | specialized `LEASE_INVALID` | new request |
| `COMPLETION_READINESS_FAILED` | Closure validator returns blocked / unconfirmed | no |
| `COMPLETION_RECORD_WRITE_FAILED` | record durability failure | recovery only |
| `COMPLETION_RECORD_VERIFY_FAILED` | record identity / checksum mismatch | recovery only |
| `COMPLETION_STATE_UNKNOWN` | specialized `COMMIT_STATE_UNKNOWN` | no automatic retry |
| `COMPLETION_ALREADY_APPLIED` | exact idempotent replay result, not a new commit | return existing |
| `COMPLETION_SYNC_PENDING` | derived request unacknowledged | separate sync retry |
| `COMPLETION_TRANSITION_FORBIDDEN` | specialized `UNDEFINED_TRANSITION` | no |

## 23. Safe Stop

The implementation must not:

- infer completion from Event existence, Completion Record existence, or Snapshot bytes alone;
- repair / delete journal, lease, log, or record on ambiguous identity;
- complete without all authorization / evidence / readiness bindings;
- update a derived view before canonical completion;
- simultaneously archive;
- reopen `COMPLETED`.

Any mismatch preserves evidence and enters `RECOVERY_REQUIRED` / no-write Safe Stop. A correction after a committed terminal state requires a new task or explicitly designed compensating process; it never edits historical files.

## 24. Recovery

- `PREPARED`: discard only candidates verified never applied; release lease; append failure Event.
- `APPLIED`: complete only if staged Event and Completion Record exactly match Status / request / authorization; otherwise `RECOVERY_REQUIRED`.
- Event acknowledged but record absent: same strict completion-only recovery; no inferred completion.
- Record present but journal not committed: verify full three-way identity; otherwise Safe Stop.
- `VERIFIED`: write `COMMITTED` only after all acknowledgement fields are literal true and every identity matches.
- cleanup failure after `COMMITTED`: retain safe completed state and retry cleanup only; never duplicate Event or Record.

Recovery requires an approved procedure. Owner / Judge authorization is required to escape unresolved `RECOVERY_REQUIRED`.

## 25. Idempotency

Exact replay of an already committed request returns the existing Completion Record without revision increment, extra Event, extra Record, or duplicate synchronization request. A different request after `COMPLETED` is rejected. A stale request is rejected on revision / authorization / evidence binding. Derived-view requests replay independently by idempotency key and do not mutate Status.

## 26. Negative Cases

Mandatory rejection cases include:

- wrong task / project / phase / from-state / to-state / gate;
- missing, expired, revoked, reused, other-task, stale-revision authorization;
- missing or mismatched final judgment, Completion Review, consistency, test, probe, or evidence checksum;
- Critical / High nonzero; unaccepted risk; undocumented blocking follow-up;
- unresolved recovery, active lease, expected-revision conflict;
- Archive request in Phase 5A;
- attempt to use the prototype fixture;
- direct derived-view completion claim;
- `COMPLETED → ACTIVE` or `COMPLETED → IMPLEMENTATION`.

## 27. Test Matrix

| Category | Required cases |
|---|---|
| Positive | normal completion; accepted risk; nonblocking follow-up; `CANDIDATE_PRESENT`; derived sync retry |
| Authorization | missing, foreign-task, stale revision, expired, revoked, reused |
| Evidence | missing final judgment / completion review / cross-format / test evidence; checksum mismatch |
| Findings | Critical, High, Medium-only, Low-only, unaccepted accepted-risk |
| Transaction | PREPARED / APPLIED / pre-event / post-event sync / directory sync / verification / record-write / record-verify / post-commit-cleanup failure |
| Idempotency | duplicate request, exact replay, already completed, restart unknown state, derived sync replay |
| State | wrong phase / gate / task / revision / lease; terminal reopen; archive simultaneous rejection |
| Integrity | fixture and historical Evidence unchanged; one Record; follow-up / accepted-risk retention; D-01–D-06 regression remains passing |

Independent Tester must run the full Phase 1 regression plus all Phase 5A tests. Critic verifies state / authority / recovery / scope. Judge issues the binding final judgment.

## 28. Phase 5B Boundary

Phase 5B alone owns:

- Archive Readiness and Archive Record;
- archive destination / manifest / checksum / index;
- retention and restore / read-only access;
- historical migration execution;
- `COMPLETED → ARCHIVED`;
- post-archive VERIFY and archive rollback.

Phase 5A only sets `archive_status=REVIEW_PENDING`; it does not assess or execute Archive.

## 29. Backward Compatibility

- Keep existing Phase 1 API behavior and its rejection of Phase 5 transitions until Phase 5A implementation extends it under a new bounded interface.
- Do not edit prototype fixtures or their empty baseline log.
- Preserve D-01–D-06 and IC4–IC6 behaviors and run their regression suite unchanged.
- Existing `1.1.0` fixture schema remains readable as a historical test format.
- Production state bootstrap references existing Evidence without rewriting it.

## 30. Schema Versioning

Use a new production Record schema `1.2.0`, not an in-place semantic reinterpretation of `1.1.0`. It adds lifecycle-required fields absent from the Phase 1 runtime record:

- accepted / residual / deferred risk references;
- knowledge handoff status;
- context / cost references;
- completion record reference;
- derived synchronization request reference.

The Phase 5A migration validator must accept `1.1.0` only as fixture / historical input and create a new `1.2.0` production Record with explicit provenance. Unknown or ambiguous source values are `NOT_CONFIRMED`, not defaulted.

## 31. Acceptance Criteria

- Completion Authorization is bound to task, revision, request, evidence, operation, root, expiry.
- Critical / High are `0 / 0`; required Evidence is complete.
- Canonical production Status reaches `COMPLETED` only through durable verified commit.
- Event remains append-only; Completion Record is durable and unique.
- retry is idempotent; ambiguity Safe Stops.
- derived mismatch is detectable without status rollback.
- historical Evidence / fixture remain unchanged.
- Archive is not executed.
- D-01–D-06 regression and Phase 5A independent verification pass.

## 32. Required Artifact Chain

The required chain is retained with one clarification:

```text
closure-design-amendment.md
→ closure-critic-review.md
→ closure-builder-response.md
→ closure-judge-decision.md
→ closure-final-plan-amendment.md
→ closure-final-plan-consistency-check.md
→ implementation authorization
→ closure-implementation-report.md
→ closure-test-report.md
→ closure-retest-report.md (if required)
→ closure-implementation-review.md
→ closure-final-judgment.md
→ closure-policy-review.md
→ closure-readiness.md
→ completion-record.md
→ completion-review-reassessment.md
```

`completion-record.md` is shown as an artifact name in the workflow but its runtime counterpart is `completion-record.json`; the Final Plan must select one canonical production format and define the other, if present, as human-readable evidence.

## 33. Implementation Boundary

Future implementation may modify only Owner-approved Project paths for:

- Phase 5A runtime source and tests;
- Phase 5A schemas;
- Project-owned production lifecycle root;
- new Phase 5A artifacts.

It must not modify Foundation canonical documents, fixture copies, existing historical Evidence, Registry / Current State / Index / Summary, Archive paths, or other tasks without separate authority.

## 34. Risks

- durable completion requires Status, Event, and Completion Record as one recoverable transaction;
- real current-state bootstrap has no reconstructable prior operational log and must remain evidence-bounded;
- derived-view synchronization can lag canonical completion;
- physical power loss and non-target runtime limitations remain residual risk;
- cost / session checks have observation boundaries and must not claim universal certainty.

## 35. Open Questions

Before Final Plan, Owner must decide:

1. exact Project-owned production state root and whether runtime state is Git-tracked after completion;
2. whether actual-cost reconciliation has an approved authoritative record or must block until created;
3. canonical format for Completion Record (`.json` runtime record and/or `.md` human evidence);
4. authorized Registry process / artifact for consuming a derived synchronization request;
5. expiry duration and revocation storage for `COMPLETE_TASK` authorization.

These are blocking design inputs; no placeholder may remain in the Final Plan.

## 36. Final Recommendation

Adopt Phase 5A as a new bounded design / implementation cycle within TASK-004 Phase 5. Use a new production state root and schema `1.2.0`; do not mutate the Phase 1 fixture. Couple Completion Record durability to the same recoverable transaction as the terminal Status and Event. Keep Registry synchronization derived and Phase 5B Archive separate.

## 37. Recommended Next Role

Critic, after Owner confirms the five open design inputs and authorizes a single new Critic artifact path. This amendment itself does not start the Critic.

## 38. Recommended Next Artifact

`closure-critic-review.md`, created only after the Owner issues the Critic review authorization and confirms its output path is absent.

## 39. Gate Readiness

`NOT_READY`

The design boundary is complete enough for review, but final-plan creation and implementation are not ready until the open Owner decisions are resolved, the independent Critic / Builder / Judge design cycle completes, and a bounded implementation authorization exists.

## 40. Owner Approval Required

`YES`

No source, test, Status, Registry, Current State, Summary, Git, Completion Review reassessment, or Archive operation is authorized by this design amendment.
