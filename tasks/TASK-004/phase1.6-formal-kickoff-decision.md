# TASK-004 Phase 1.6 — Foundation Guard MVP Formal Kickoff Decision

## 1. Document Identity

- Parent Task: `TASK-004`
- Formal Phase Name: `TASK-004 Phase 1.6 — Foundation Guard MVP`
- Work Package ID: `PHASE_1_6_P0`
- Classification: TASK-004 transferred work package
- Artifact Type: Owner Decision / Formal Kickoff Decision Record
- Owner Decision Date: `2026-08-02`
- Current Phase Status: `NOT_STARTED`
- Current Authorization: `NOT_AUTHORIZED`

## 2. Purpose and Authority Boundary

This artifact records the Owner approval of the Phase 1.6 Formal Kickoff
Package and D-01 through D-18. It does not modify historical Evidence and does
not itself authorize design, implementation, source/test creation, a Lifecycle
Transition, Completion, Closure, or Archive.

The approval establishes the governance boundary for a later Phase 1.6 start.
Implementation Authorization, Commit Authorization, and Push Authorization remain
separate later Owner Decisions.

## 3. Evidence Reviewed

- `docs/ai-team/tasks/TASK-004/phase1.6-kickoff-package.md`
- `docs/ai-team/tasks/TASK-004/phase1.5-governance-state-reconciliation-decision.md`
- `docs/ai-team/tasks/TASK-004/phase1.5-context-guard-owner-decisions.md`
- `docs/ai-team/tasks/TASK-004/phase1.5-context-guard-completion-judge-decision.md`
- `docs/ai-team/tasks/TASK-004/phase1.5-context-guard-independent-critic-rereview-03.md`
- `docs/ai-team/tasks/TASK-004/phase1.5-context-guard-independent-test-retest-08-retry-01.md`
- `docs/ai-team/tasks/TASK-004/phase1.5-context-guard-design-final-plan.md`
- `docs/ai-team/tasks/TASK-004/closure-owner-decisions.md`
- `docs/ai-team/tasks/TASK-004/closure-final-plan-consistency-recheck-02.md`
- `docs/ai-team/registry/current-state.md`
- `docs/ai-team/registry/ai-context-pack.md`
- `docs/ai-team/tasks/TASK-004/TASK-004.summary.md`

## 4. Owner Decisions D-01 through D-18

### D-01 — Formal Name

**APPROVED:** `TASK-004 Phase 1.6 — Foundation Guard MVP`.

### D-02 — Classification

**APPROVED:** Phase 1.6 is a transferred work package within TASK-004.

Work Package ID is `PHASE_1_6_P0`. “Roadmap item” describes the pre-kickoff
state and is not a separate classification. Phase 1.6 is not an independent
Task and is not a Canonical Lifecycle Phase.

### D-03 — Requirement R1

**APPROVED / INCLUDE:** Complete Permit Ledger Fault Matrix.

### D-04 — Requirement R2

**APPROVED / INCLUDE:** Complete TOCTOU Matrix.

### D-05 — Requirement R3

**APPROVED / INCLUDE:** Complete Activation Entry Matrix.

### D-06 — Requirement R4

**APPROVED / INCLUDE:** Foundation-wide Role Activation Enforcement.

### D-07 — Scope

**APPROVED:** The Kickoff Package In Scope is accepted: R1–R4, Foundation
Guard design, fault/TOCTOU/activation-entry matrices, Foundation-wide Role
Activation enforcement, and later implementation, testing, and independent
Review candidates. This approval does not start design or implementation.

### D-08 — Explicit Exclusions

**APPROVED:** The following remain excluded:

- Phase 5A implementation
- Phase 5B Archive / Migration
- TASK-004 Completion transition
- Closure and Archive
- Canonical Lifecycle Transition
- Resume Checkpoint redesign
- Existing Registry 26 Missing Path remediation
- Workspace synchronization
- Phase 2 implementation
- Unrelated video task and unrelated Project work

### D-09 — Role Sequence

**APPROVED:**

1. Orchestrator
2. Owner Decision
3. Design Builder
4. Design Critic
5. Design Judge
6. Final Plan Builder
7. Owner Implementation Authorization
8. Implementation Builder
9. Tester
10. Critic
11. Judge
12. Technical Completion Review
13. Owner Commit Authorization
14. Commit
15. Owner Push Authorization
16. Push
17. Derived State Synchronization

Commit Authorization and Push Authorization are separate decisions.

### D-10 — Proposed Gates

**APPROVED as proposed operational labels only:**

- `KICKOFF_SCOPE_GATE`
- `DESIGN_REVIEW_GATE`
- `FINAL_PLAN_GATE`
- `IMPLEMENTATION_AUTHORIZATION_GATE`
- `TEST_GATE`
- `CRITIC_GATE`
- `JUDGE_GATE`
- `PHASE_COMPLETION_GATE`
- `COMMIT_AUTHORIZATION_GATE`

These labels are not Canonical Schema or Enum additions.

### D-11 — Completion Boundary

**APPROVED:** Phase 1.6 completion is limited to a future technical milestone
covering R1–R4 technical closure, required implementation and tests,
Independent Tester and Critic completion, Judge decision, and Owner Commit
Authorization.

Approved future completion statement:

> Phase 1.6 Foundation Guard MVP technical milestone is complete for the four
> approved transferred requirements, with required implementation, tests,
> independent review, and Judge decision completed. TASK-004 remains ACTIVE /
> DESIGN; no Completion, Closure, Archive, or Canonical Lifecycle Transition is
> implied.

This is not a current completion declaration.

### D-12 — Phase 5A Pause

**APPROVED:** Maintain `PAUSED_BY_OWNER_PRIORITY`.

Phase 5A remains `NOT_READY` for Final Plan Consistency and
`NOT_STARTED / NOT_AUTHORIZED` for implementation.

### D-13 — Phase 2 Block

**APPROVED:** Maintain Phase 2 as `BLOCKED`.

### D-14 — Implementation Authorization

**APPROVED:** Implementation Authorization is a separate later Owner Decision.
Current status remains `NOT_AUTHORIZED`.

### D-15 — Commit Authorization

**APPROVED:** Commit Authorization is a separate later Owner Decision.

### D-16 — Push Authorization

**APPROVED:** Push Authorization is separate from Commit Authorization and is a
later Owner Decision.

### D-17 — Kickoff Package Disposition

**APPROVED:** No blocking revision is required. The existing Kickoff Package is
approved as a Proposal. Its content is not modified by this artifact.

### D-18 — Next Role and Deliverable

**APPROVED:** The next Role is `Orchestrator`. The next deliverable is the
`Phase 1.6 Formal Kickoff Decision Artifact`, recorded by this document.

## 5. Approved Requirement Matrix

| ID | Requirement | Decision | Source relationship | Future completion expectation | Current status |
|---|---|---|---|---|---|
| R1 | Complete Permit Ledger Fault Matrix | APPROVED / INCLUDE | Phase 1.5 Judge and Critic identify it as `TRANSFERRED_NOT_CLOSED` / `PHASE_1_6_P0` | Complete fault coverage, fail-closed behavior, and evidence | `NOT_STARTED / NOT_AUTHORIZED` |
| R2 | Complete TOCTOU Matrix | APPROVED / INCLUDE | Full Role-activation TOCTOU coverage was transferred | Complete race/binding coverage and negative verification | `NOT_STARTED / NOT_AUTHORIZED` |
| R3 | Complete Activation Entry Matrix | APPROVED / INCLUDE | Activation entry matrix and unregistered-entry detection were transferred | Classify all in-scope entries and verify guarded routing | `NOT_STARTED / NOT_AUTHORIZED` |
| R4 | Foundation-wide Role Activation Enforcement | APPROVED / INCLUDE | Foundation-wide enforcement remains unclosed | Verify no unguarded in-scope activation path | `NOT_STARTED / NOT_AUTHORIZED` |

## 6. Preserved Governance State

- Phase 1.6: `NOT_STARTED / NOT_AUTHORIZED`.
- Design Authorization: `NOT_AUTHORIZED`.
- Implementation Authorization: `NOT_AUTHORIZED`.
- TASK-004: `ACTIVE`.
- Canonical lifecycle: `ACTIVE / DESIGN`.
- Canonical gate: `FAIL`.
- Completion Review: `TASK_COMPLETION_REVISION_REQUIRED`.
- Closure: `NOT_CONFIRMED`.
- Archive: `NOT_ELIGIBLE`.
- Phase 5A: `PAUSED_BY_OWNER_PRIORITY`.
- Phase 2: `BLOCKED`.
- Resume Checkpoint: not current resume authority and unchanged.

## 7. Prohibited Follow-up Actions

This decision does not authorize Phase 1.6 design, implementation, source or
test creation, schema/validator changes, Phase 5A resumption, Phase 2 start,
Completion, Closure, Archive, Checkpoint changes, Registry 26-entry repair,
Workspace synchronization, or any Canonical Lifecycle Transition.

The next Orchestrator activity is governed by a later Owner instruction. No
commit or push is authorized by this artifact.
