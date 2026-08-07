# TASK-004 Phase 1.6 — Foundation Guard MVP Task Definition

## 1. Document Identity

- Title: `TASK-004 Phase 1.6 — Foundation Guard MVP Task Definition`
- Parent Task: `TASK-004`
- Formal Name: `TASK-004 Phase 1.6 — Foundation Guard MVP`
- Work Package ID: `PHASE_1_6_P0`
- Classification: TASK-004 transferred work package
- Artifact Type: Task Definition / Design-input preparation artifact
- Preparation Date: `2026-08-02`
- Current Status: `NOT_STARTED`
- Design Authorization: `NOT_AUTHORIZED`
- Implementation Authorization: `NOT_AUTHORIZED`

## 2. Purpose and Boundary

This Task Definition defines the Foundation-wide requirements transferred from
the reduced Phase 1.5 Context Guard Core MVP and fixes the input boundary for a
future Design stage.

It is not a Phase 1.6 start declaration, Design Authorization, Final Plan,
Implementation Authorization, Completion record, Lifecycle Transition, Closure,
or Archive record. No source, test, schema, validator, or runtime artifact is
created by this document.

## 3. Authority References

- `docs/ai-team/tasks/TASK-004/phase1.6-formal-kickoff-decision.md`
- `docs/ai-team/tasks/TASK-004/phase1.6-kickoff-package.md`
- `docs/ai-team/tasks/TASK-004/phase1.5-governance-state-reconciliation-decision.md`
- `docs/ai-team/tasks/TASK-004/phase1.5-context-guard-completion-judge-decision.md`
- `docs/ai-team/tasks/TASK-004/phase1.5-context-guard-independent-critic-rereview-03.md`
- `docs/ai-team/tasks/TASK-004/phase1.5-context-guard-independent-test-retest-08-retry-01.md`
- `docs/ai-team/tasks/TASK-004/phase1.5-context-guard-owner-decisions.md`
- `docs/ai-team/tasks/TASK-004/phase1.5-context-guard-design-final-plan.md`
- `docs/ai-team/tasks/TASK-004/closure-owner-decisions.md`
- `docs/ai-team/tasks/TASK-004/closure-final-plan-consistency-recheck-02.md`

## 4. Problem Statement

Phase 1.5 closed only the approved reduced-scope Context Guard Core MVP. Its
Completion Judge and independent Critic explicitly retained Foundation-wide
requirements as `TRANSFERRED_NOT_CLOSED` / `PHASE_1_6_P0`. They are not accepted
risk and are not Phase 1.5 functionality.

The transferred problem is therefore not a request to repeat Phase 1.5. It is
to define and later verify complete Foundation-wide coverage for Permit Ledger
faults, Role-activation TOCTOU behavior, Activation Entry classification, and
Role Activation enforcement. “Activation uncertainty recovery” and
“unregistered-entry detection” are recorded as verification perspectives within
these approved requirements, not as new formal requirements.

## 5. Requirement Matrix

| ID | Requirement | Source evidence | Problem / gap | Required outcome | Acceptance evidence | Testability | Dependency | Risk | Current status |
|---|---|---|---|---|---|---|---|---|---|
| R1 | Complete Permit Ledger Fault Matrix | Phase 1.5 Completion Judge §8; Critic Re-review §6 | Complete fault coverage was transferred and not closed | Every in-scope Permit Ledger fault path has defined result, persistence, retry, and fail-closed behavior | Complete matrix, design review, fault-injection and negative tests | Directly testable per fault row | Permit/evidence contract and state model | Incomplete or fail-open fault handling | `NOT_STARTED / NOT_AUTHORIZED` |
| R2 | Complete TOCTOU Matrix | Phase 1.5 Completion Judge §8; Critic Re-review §6 | Full Role-activation TOCTOU coverage was transferred | Preflight, Permit, Gateway, executor, and durable-evidence race/binding boundaries are covered | Threat/state matrix, mutation/race tests, independent review | Testable with controlled mutation and stale evidence scenarios | R1 evidence lifecycle and activation contract | Race or replay permits unsafe activation | `NOT_STARTED / NOT_AUTHORIZED` |
| R3 | Complete Activation Entry Matrix | Phase 1.5 Completion Judge §8; Critic Re-review §6 | Activation entries and unregistered-entry detection were not closed | Every actual or future in-scope entry is classified and routed through the approved boundary | Entry inventory, ownership map, direct-bypass and unregistered-entry tests | Testable by inventory and negative invocation | Exact entry ownership and Gateway boundary | Omitted or bypassing activation entry | `NOT_STARTED / NOT_AUTHORIZED` |
| R4 | Foundation-wide Role Activation Enforcement | Governance Reconciliation §5; Completion Judge §8; Critic Re-review §6 | Foundation-wide enforcement remained transferred | No unguarded in-scope Role Activation path remains | Enforcement design, integration tests, negative tests, Critic/Judge evidence | Testable by caller-class coverage and bypass rejection | R2/R3 matrices and exact adapter ownership | Hidden bypass or inconsistent enforcement | `NOT_STARTED / NOT_AUTHORIZED` |

## 6. Approved In Scope

- R1 through R4 only.
- Foundation Guard design input and requirement traceability.
- Permit Ledger fault matrix.
- TOCTOU threat/state matrix.
- Activation Entry inventory and classification matrix.
- Foundation-wide Role Activation enforcement boundary.
- Future bounded implementation, tests, and independent Review candidates.
- Failure/deny behavior, test-oracle definition, protected-path proposal, and
  rollback/Safe Stop design as future Design inputs.

This section records approved scope; it does not authorize any of the future
Design or implementation activities.

## 7. Explicitly Out of Scope

- Phase 5A implementation.
- Phase 5B Archive / Migration.
- TASK-004 Completion transition.
- Closure.
- Archive.
- Canonical Lifecycle Transition.
- Resume Checkpoint redesign or regeneration.
- Existing Registry 26 Missing Path remediation.
- Workspace synchronization or Workspace specification changes.
- Phase 2 implementation or start.
- Unrelated video task.
- Unrelated Project work.

## 8. Proposed Entry Criteria for Design

These are proposed prerequisites and are not claimed to be satisfied:

1. Task Definition receives an Independent Critic `PASS`.
2. Task Definition candidate is separately Owner-authorized for commit/push.
3. Owner issues explicit Design Authorization.
4. Exact Design file boundary and protected paths are recorded.
5. Project baseline is fixed and the worktree is clean.
6. Phase 5A remains `PAUSED_BY_OWNER_PRIORITY`.
7. Phase 2 remains `BLOCKED`.
8. Requirement IDs, acceptance evidence, and stop conditions are unchanged or
   separately re-approved.

## 9. Proposed Design Deliverables

The following are future candidates only; none is created here:

- Foundation Guard specification.
- Complete Permit Ledger Fault Matrix.
- Complete TOCTOU Matrix.
- Complete Activation Entry Matrix.
- Role Activation Enforcement design and ownership map.
- Failure/deny and fail-closed behavior specification.
- Test oracle and evidence contract definition.
- Protected path and rollback/Safe Stop proposal.

## 10. Proposed Role Sequence

The Owner-approved Formal Kickoff sequence is retained:

1. Orchestrator.
2. Owner Decision.
3. Design Builder.
4. Design Critic.
5. Design Judge.
6. Final Plan Builder.
7. Owner Implementation Authorization.
8. Implementation Builder.
9. Tester.
10. Critic.
11. Judge.
12. Technical Completion Review.
13. Owner Commit Authorization.
14. Commit.
15. Owner Push Authorization.
16. Push.
17. Derived State Synchronization.

After this Task Definition, the next Role is Independent Critic. Design Builder
can be considered only after a later explicit Owner Design Authorization.

## 11. Proposed Gates

The following remain proposed operational labels, not Canonical Enum values:

- `KICKOFF_SCOPE_GATE`
- `DESIGN_REVIEW_GATE`
- `FINAL_PLAN_GATE`
- `IMPLEMENTATION_AUTHORIZATION_GATE`
- `TEST_GATE`
- `CRITIC_GATE`
- `JUDGE_GATE`
- `PHASE_COMPLETION_GATE`
- `COMMIT_AUTHORIZATION_GATE`

Each gate must fail closed on missing authority, undefined requirement,
unclassified entry, missing test oracle, protected-path conflict, or scope
expansion. A failed gate returns to the preceding Owner/Role decision and does
not trigger a Lifecycle Transition.

## 12. Technical Completion Boundary

Phase 1.6 completion is a future technical milestone only. It requires R1–R4
technical closure, required implementation and tests, Independent Tester and
Critic completion, Judge decision, and Owner Commit Authorization.

It does not mean TASK-004 overall completion, `ACTIVE → COMPLETED`, Closure,
Archive, Phase 5A completion, Phase 2 start, or Canonical Lifecycle Transition.

## 13. Risks

- Scope expansion beyond R1–R4.
- Unnecessary duplication of Phase 1.5 behavior.
- Phase 2 or Phase 5A scope intrusion.
- Incomplete Permit Ledger coverage.
- Incomplete TOCTOU coverage.
- Omitted Activation Entry.
- Direct Gateway bypass.
- Stale or replayed Permit.
- Fail-open behavior.
- Hidden dependency or unclear ownership.
- Missing test oracle.
- Requirement to modify protected files without authorization.

## 14. Safe Stop Conditions

Stop and preserve evidence when any of the following occurs:

- Authority conflict or undefined requirement.
- Unclassified Activation Entry.
- Protected-path modification is required.
- Scope-outside Repository or dependency is required.
- Test oracle cannot be defined.
- Worktree is dirty or the fixed baseline changes unexpectedly.
- Owner decision remains unresolved.
- Any request attempts to start Design, Implementation, Phase 5A, Phase 2,
  Completion, Closure, Archive, or a Canonical Transition without separate
  authorization.

## 15. Authorization Boundary

Current Owner authorization permits only:

- creation of this Task Definition Artifact;
- addition of its Registry Entry;
- explicit staging as an Independent Critic candidate.

It does not authorize Phase 1.6 start, Design, Final Plan, Implementation,
source/tests, schema/validator work, Lifecycle Transition, Completion, Closure,
Archive, Commit, or Push.

## 16. Current Governance State

- Phase 1.6: `NOT_STARTED / NOT_AUTHORIZED`.
- Design: `NOT_AUTHORIZED`.
- Implementation: `NOT_AUTHORIZED`.
- TASK-004: `ACTIVE / DESIGN`.
- Phase 5A: `PAUSED_BY_OWNER_PRIORITY`.
- Phase 2: `BLOCKED`.
- Completion Review: `TASK_COMPLETION_REVISION_REQUIRED`.
- Closure: `NOT_CONFIRMED`.
- Archive: `NOT_ELIGIBLE`.
- Resume Checkpoint: not current resume authority and unchanged.

## 17. Next Boundary

- Next Role: `Independent Critic`.
- Next Action: staged 2-file Task Definition candidate review.

This document is preparation for that review. It is not a Design artifact and
does not change the canonical lifecycle state.
