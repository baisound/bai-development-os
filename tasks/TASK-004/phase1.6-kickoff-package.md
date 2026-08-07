# TASK-004 Phase 1.6 — Foundation Guard MVP Formal Kickoff Package

## 1. Package Status and Authority

- Package type: Owner-reviewable proposal / preparation artifact.
- Phase 1.6 status: `NOT_STARTED`.
- Phase 1.6 authorization: `NOT_AUTHORIZED`.
- This package does not create a Task, Final Plan, implementation authority,
  Lifecycle Transition, Completion Review, Closure, or Archive record.
- Owner approval of this package would authorize a later kickoff decision only;
  implementation requires a separate explicit authorization.

## 2. Evidence Reviewed

| Evidence | Relevant authority / finding |
|---|---|
| `phase1.5-governance-state-reconciliation-decision.md` | Current Owner reconciliation; Phase 1.6 is transferred, not started or authorized. |
| `phase1.5-context-guard-owner-decisions.md` | Phase 1.5 policy/design boundary; implementation authority was separately controlled. |
| `phase1.5-context-guard-completion-judge-decision.md` | Reduced Phase 1.5 scope approved with conditions; transferred requirements remain open. |
| `phase1.5-context-guard-independent-critic-rereview-03.md` | Complete matrices and Foundation-wide enforcement remain `TRANSFERRED_NOT_CLOSED` / `PHASE_1_6_P0`. |
| `phase1.5-context-guard-independent-test-retest-08-retry-01.md` | Phase 1.5 reduced-scope verification; no Phase 1.6 certification. |
| `phase1.5-context-guard-implementation-report.md` | Phase 1.5 implementation boundary and reduced-scope evidence. |
| `phase1.5-context-guard-design-final-plan.md` | Design boundary, staged deliverables, implementation preconditions, and Phase 2 / Phase 5A stop boundary. |
| `closure-owner-decisions.md` | Phase 5A boundary; completion design evidence does not authorize implementation or Phase 5A restart. |
| `closure-final-plan-consistency-recheck-02.md` | Phase 5A implementation `NOT_AUTHORIZED`; Final Plan Consistency `NOT_READY`. |
| `canonical-status.json`, `transition-log.jsonl`, `migration-mapping.jsonl` | Canonical `ACTIVE / DESIGN`; no transition or migration is created by this package. |

## 3. Phase 1.6 Identity

| Field | Proposed value | Confidence |
|---|---|---|
| Parent task | `TASK-004` | CONFIRMED |
| Working name | `Foundation Guard MVP` | Owner-confirmed working name |
| Work package | `PHASE_1_6_P0` | CONFIRMED |
| Lifecycle position | Post-Phase 1.5 transferred work package; before Phase 2 | Evidence-supported |
| Purpose | Close the Foundation-wide Context Guard gaps explicitly transferred from the reduced Phase 1.5 scope | Evidence-supported |
| Current status | `NOT_STARTED` | CONFIRMED |
| Authorization | `NOT_AUTHORIZED` | CONFIRMED |

The evidence does not establish a separate canonical lifecycle phase transition.
Phase 1.6 is treated here as a work package / roadmap item, not as a completed
canonical phase.

## 4. Transferred Requirement Matrix

| ID | Requirement | Source evidence | Phase 1.5 boundary | Proposed Phase 1.6 outcome | Verification proposal |
|---|---|---|---|---|---|
| P1.6-TR-01 | Complete Permit Ledger Fault Matrix | Completion Judge §8; Critic Re-review §6 | `TRANSFERRED_NOT_CLOSED`; not accepted risk | Every defined Permit Ledger fault path has an explicit result, persistence, retry, and Safe Stop behavior | Design matrix review plus fault-injection and negative tests |
| P1.6-TR-02 | Complete TOCTOU Matrix | Completion Judge §8; Critic Re-review §6 | Full Role-activation TOCTOU matrix transferred | Cover each identified preflight, permit, gateway, executor, and durable-evidence race boundary | Threat/matrix review plus deterministic race and mutation tests |
| P1.6-TR-03 | Complete Activation Entry Matrix | Completion Judge §8; Critic Re-review §6 | Activation entry matrix and unregistered-entry detection transferred | Classify every actual or future activation entry and enforce one guarded gateway boundary | Entry inventory review plus direct-bypass and unregistered-entry tests |
| P1.6-TR-04 | Foundation-wide Role Activation Enforcement | Governance Reconciliation §5; Completion Judge §8; Critic Re-review §6 | Foundation-wide enforcement not closed | Demonstrate that all in-scope Role activation paths require the approved guard contract | Architecture/ownership review plus integration and negative tests |

The sources use related but non-identical wording: “complete Permit Ledger fault
matrix,” “activation uncertainty recovery,” “activation entry matrix,”
“unregistered-entry detection,” “full Role-activation TOCTOU matrix,” and
“Foundation-wide enforcement.” They are retained as distinct evidence phrases;
this package maps them to the four Owner-confirmed work-package rows without
inventing additional requirements.

## 5. Scope Proposal

### In Scope

- The four transferred requirements in the matrix above.
- Requirement ownership, exact entry inventory, state/fault behavior, and
  evidence contracts needed to verify those requirements.
- Foundation Guard design, bounded implementation, tests, independent review,
  and technical milestone judgment after authorization.
- Regressions proving that the Phase 1.5 reduced-scope behavior remains intact.

### Explicit Exclusions

- Phase 5A Closure or Completion Transition implementation.
- Phase 5B Archive or Migration.
- TASK-004 Completion transition, Closure, or Archive.
- Canonical Lifecycle transition.
- Resume Checkpoint redesign, replacement, or regeneration.
- Project Registry 26 Missing Path remediation.
- Workspace Repository synchronization or Workspace specification changes.
- Unrelated video work, unrelated Tasks, or unrelated Project implementation.
- Phase 2 start.

### Deferred

Only the evidence-backed Phase 1.6 transfer is in this package. Work beyond the
four rows above remains unassigned here and requires separate Owner direction;
no additional deferred requirement is inferred.

## 6. Dependencies and Entry Criteria

The following are proposed prerequisites, not claims that they are satisfied:

1. Owner approves or revises this package and the four requirement IDs.
2. A formal Phase 1.6 Task definition and bounded design scope are approved.
3. Exact allowed Project-relative implementation and test paths are recorded.
4. Builder, Tester, Critic, Judge, and Orchestrator responsibilities are fixed.
5. Completion criteria, protected files, rollback, and Safe Stop conditions are
   accepted.
6. Phase 1.5 remains the fixed technical baseline; current Project baseline is
   `56df54de7ef15112fe49e638848d0e4c9f2f9ad5`.
7. Worktree is clean at each authorized boundary.
8. Phase 5A remains paused and Phase 2 remains blocked.
9. A separate explicit implementation authorization is issued after design and
   Final Plan gates pass.

## 7. Proposed Deliverables

### Governance

- Phase 1.6 Task definition.
- Owner decision / kickoff authorization record.
- Final Plan and implementation authorization record.

### Design

- Foundation Guard specification.
- Requirement transfer and acceptance matrix.
- Permit Ledger fault matrix.
- TOCTOU threat and state matrix.
- Activation Entry inventory and ownership matrix.
- Foundation-wide Role Activation enforcement boundary.

### Implementation and Testing

- Bounded Foundation Guard implementation; exact paths are TBD pending design.
- Unit, fault-injection, TOCTOU, activation-entry, regression, and negative tests.
- No source or test files are created by this package.

### Review

- Tester report, Critic review, Builder response, Judge decision, and technical
  completion judgment, each created only after its preceding gate and authority.

## 8. Proposed Role Sequence

1. Orchestrator package routing.
2. Owner decision on scope and kickoff.
3. Design Builder.
4. Independent Design Critic.
5. Design Judge.
6. Final Plan Builder and consistency check.
7. Owner implementation authorization.
8. Implementation Builder.
9. Independent Tester.
10. Independent Critic.
11. Judge final implementation decision.
12. Technical completion review.
13. Owner commit authorization, then separately Owner-authorized commit/push.

This sequence does not activate any Role now.

## 9. Proposed Gates

| Gate | Required input / pass condition | Failure action |
|---|---|---|
| `KICKOFF_SCOPE_GATE` | Owner-approved identity, four requirement rows, exclusions, and boundaries | Remain `NOT_STARTED`; return to Owner |
| `DESIGN_REVIEW_GATE` | Design covers every transferred row with no unresolved blocking finding | Revise or Safe Stop; no implementation |
| `FINAL_PLAN_GATE` | Final Plan consistency passes with no unresolved mandatory condition | Revise; no authorization |
| `IMPLEMENTATION_AUTHORIZATION_GATE` | Separate explicit Owner authorization and bounded allowed-file scope | Remain `NOT_AUTHORIZED` |
| `TEST_GATE` | Required functional, fault, race, entry, regression, and negative tests pass | Fix only with authorization; no completion claim |
| `CRITIC_GATE` | Independent review has no unresolved Critical/High finding | Stop and report |
| `JUDGE_GATE` | Judge confirms scope, evidence, and gate conditions | No milestone recognition |
| `PHASE_COMPLETION_GATE` | Technical criteria and transferred requirements are evidenced as complete | Remain incomplete; no lifecycle transition |
| `COMMIT_AUTHORIZATION_GATE` | Separate Owner approval for exact commit boundary | No Git operation |

These are proposed gate labels for the package and do not add canonical Enum
values or modify `canonical-status.json`.

## 10. Proposed Technical Completion Criteria

Phase 1.6 may be considered technically complete only if, after authorization:

- all four transferred requirements have complete, reviewable evidence;
- each matrix has explicit coverage and no unclassified required row;
- Permit Ledger, TOCTOU, and activation-entry failure paths fail closed;
- Foundation-wide Role Activation enforcement has no unguarded in-scope path;
- required positive, negative, race, fault-injection, and regression tests pass;
- independent Tester, Critic, and Judge results pass within the approved scope;
- no unresolved Critical or High finding remains;
- Phase 2 remains blocked until its own authorization;
- Phase 5A remains paused;
- TASK-004 remains `ACTIVE / DESIGN` unless a separately authorized canonical
  decision changes it.

This is a proposed technical milestone definition, not a completion judgment.

## 11. Risks and Safe Stops

- Any unclassified activation entry: Safe Stop; no implementation continuation.
- Incomplete fault or TOCTOU coverage: fail the relevant gate.
- Direct gateway bypass or unknown Role outcome: reject and preserve evidence.
- Scope expansion into Phase 5A, Phase 2, Registry repair, or Workspace sync:
  Safe Stop and Owner review.
- Missing exact implementation paths or dependency ownership: remain
  `NOT_AUTHORIZED`.
- Conflicting canonical or Owner evidence: do not infer a transition.
- Dirty worktree or changed protected canonical files: stop before activation.

## 12. Owner Decisions Required

- Approve the preferred working name `Foundation Guard MVP` and package ID
  `PHASE_1_6_P0` as the formal kickoff identity, or select another evidence-
  supported name.
- Confirm the four requirement rows and their acceptance boundaries.
- Approve the proposed scope, exclusions, and technical completion definition.
- Approve the role sequence and gate labels as operational planning.
- Later, approve the exact implementation/test file allowlist and issue separate
  implementation authorization.

## 13. Current Governance Snapshot

- TASK-004: `ACTIVE`.
- Canonical lifecycle: `ACTIVE / DESIGN`; gate `FAIL`.
- Completion Review: `TASK_COMPLETION_REVISION_REQUIRED`.
- Closure: `NOT_CONFIRMED`.
- Archive: `NOT_ELIGIBLE`.
- Phase 5A: `PAUSED_BY_OWNER_PRIORITY`; implementation `NOT_AUTHORIZED`.
- Resume Checkpoint: invalid and not current resume authority.
- Next Role: `Orchestrator`.

## 14. Safe Stop and Authorization Boundary

This package is preparation only. It creates no Phase 1.6 Task, source, tests,
schema, validator, runtime state, Completion Review, transition, checkpoint, or
Registry repair. Phase 1.6 remains `NOT_STARTED / NOT_AUTHORIZED` until the
Owner issues the required later decisions.

Prepared for Owner review; no commit or push is authorized by this artifact.
