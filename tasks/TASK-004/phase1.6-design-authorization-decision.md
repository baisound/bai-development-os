# TASK-004 Phase 1.6 — Design Authorization Decision

## 1. Document Identity

- Parent Task: `TASK-004`
- Formal Phase Name: `TASK-004 Phase 1.6 — Foundation Guard MVP`
- Work Package ID: `PHASE_1_6_P0`
- Classification: TASK-004 transferred work package
- Artifact Type: Owner Decision / Design Authorization Decision Preparation
- Owner Decision Date: `2026-08-02`
- Authority Level: Owner Decision preparation record
- Current Effectiveness: `NOT_EFFECTIVE`

## 2. Purpose and Boundary

This artifact records the Owner's conditional Design Authorization decisions
DA-01 through DA-14 and fixes the future Design scope and file boundary.

The authorization is not effective immediately. This preparation record does
not start Phase 1.6, authorize Design Builder activity, create a Design Artifact,
authorize a Final Plan or Implementation, or create a Lifecycle Transition.

## 3. Authority References

- `docs/ai-team/tasks/TASK-004/phase1.6-formal-kickoff-decision.md`
- `docs/ai-team/tasks/TASK-004/phase1.6-task-definition.md`
- `docs/ai-team/tasks/TASK-004/phase1.6-kickoff-package.md`
- `docs/ai-team/tasks/TASK-004/phase1.5-governance-state-reconciliation-decision.md`
- `docs/ai-team/tasks/TASK-004/phase1.5-context-guard-completion-judge-decision.md`
- `docs/ai-team/tasks/TASK-004/phase1.5-context-guard-independent-critic-rereview-03.md`
- `docs/ai-team/tasks/TASK-004/phase1.5-context-guard-owner-decisions.md`
- `docs/ai-team/tasks/TASK-004/closure-owner-decisions.md`
- `docs/ai-team/tasks/TASK-004/closure-final-plan-consistency-recheck-02.md`

## 4. Owner Decisions DA-01 through DA-14

### DA-01 — Design Authorization Type

**APPROVED:** Conditional Design Authorization. It is not immediate Design
start authorization.

### DA-02 — Effectiveness Conditions

**APPROVED:** The Authorization becomes effective only after all conditions are
met:

1. This Decision Artifact is created.
2. Independent Critic returns `PASS`.
3. Owner grants Commit Authorization.
4. The commit is completed.
5. Owner grants Push Authorization.
6. The commit is pushed to remote `main`.

Until then, Phase 1.6 remains `NOT_STARTED / NOT_AUTHORIZED` and Design remains
`NOT_AUTHORIZED`.

### DA-03 — Authorized Requirements

**APPROVED:** The future Design is limited to the four approved requirements:

- R1: Complete Permit Ledger Fault Matrix.
- R2: Complete TOCTOU Matrix.
- R3: Complete Activation Entry Matrix.
- R4: Foundation-wide Role Activation Enforcement.

No additional formal Requirement is created. Activation uncertainty recovery and
unregistered-entry detection remain verification perspectives within R1–R4.

### DA-04 — Design Artifact Boundary

**APPROVED:** After the Authorization becomes effective, the only initial
Design Artifact permitted is:

`docs/ai-team/tasks/TASK-004/phase1.6-foundation-guard-design.md`

That file is not created by this preparation activity. Splitting the Design
into additional files requires a new Owner Decision.

### DA-05 — Required Design Content

**APPROVED:** The future Design Artifact must cover:

- Foundation Guard architecture.
- Authority and trust boundary.
- Lifecycle interaction boundary.
- R1 Permit Ledger Fault Matrix.
- R2 TOCTOU Matrix.
- R3 Activation Entry Matrix.
- R4 Role Activation Enforcement.
- Direct Gateway bypass prevention.
- Stale Permit behavior.
- Replayed Permit behavior.
- Permit consumption behavior.
- Activation uncertainty recovery.
- Unregistered-entry detection.
- Fail-closed / deny behavior.
- Error classification.
- Test oracle.
- Observability evidence.
- Protected path proposal.
- Dependency boundary.
- Rollback conditions.
- Safe Stop conditions.
- Unresolved Design questions.

### DA-06 — Non-implementation Boundary

**APPROVED:** Design Authorization does not authorize `source/**`, `tests/**`,
schema, validator, package, migration, runtime, or any Implementation
Authorization.

### DA-07 — Canonical Boundary

**APPROVED:** Do not change `canonical-status.json`, `transition-log.jsonl`,
`migration-mapping.jsonl`, Canonical Enum, Lifecycle Schema, or TASK-004
canonical state. TASK-004 remains `ACTIVE / DESIGN` with canonical gate `FAIL`.

### DA-08 — Phase Preservation

**APPROVED:** Phase 5A remains `PAUSED_BY_OWNER_PRIORITY` with Final Plan
Consistency `NOT_READY`. Phase 2 remains `BLOCKED`. Neither is resumed or
unblocked by this decision.

### DA-09 — Registry and Workspace Boundary

**APPROVED:** Do not modify the existing 26 Registry Missing Path entries, the
Workspace Repository, or cross-repository synchronization.

### DA-10 — Design Review Sequence

**APPROVED:** After an effective Authorization and Design Artifact creation:

1. Design Builder.
2. Design Critic.
3. Design Judge.
4. Final Plan Builder.

Design Builder does not perform the Critic or Judge role.

### DA-11 — Final Plan Boundary

**APPROVED:** Final Plan creation is permitted only after Design Judge approval.
No Final Plan is created now.

### DA-12 — Implementation Boundary

**APPROVED:** Implementation requires a separate Owner Decision. Design Critic
PASS or Design Judge approval alone does not authorize Implementation.

### DA-13 — Commit and Push Boundary

**APPROVED:** Commit Authorization and Push Authorization are separate future
Owner Decisions for the Design Artifact.

### DA-14 — Current Next Boundary

**APPROVED:** After this artifact is created, the next Role is `Independent
Critic` and the next Action is review of the staged 2-file Decision candidate.
Design Builder has not started.

## 5. Effectiveness Conditions and Current Evaluation

| Condition | Current state |
|---|---|
| Decision Artifact created | Candidate preparation; not yet independently reviewed |
| Independent Critic | `NOT_COMPLETED` |
| Commit Authorization | `NOT_AUTHORIZED` |
| Commit | `NOT_COMPLETED` |
| Push Authorization | `NOT_AUTHORIZED` |
| Push | `NOT_COMPLETED` |
| Design Authorization effective | `NO` |

## 6. Authorized Requirements and Future Design Scope

The future Design scope is exactly R1–R4. It may address the required Design
content in DA-05, including activation uncertainty recovery and unregistered-
entry detection as verification perspectives. No new formal Requirement is
added.

## 7. Authorized Design File Boundary

Only after the conditions in DA-02 are satisfied may the following single file
be created:

`docs/ai-team/tasks/TASK-004/phase1.6-foundation-guard-design.md`

It is not created now. No other Design file is authorized by this record.

## 8. Explicit Exclusions

- `source/**` changes.
- `tests/**` changes.
- Schema or validator implementation.
- `package.json` or `package-lock.json` changes.
- Migration or runtime implementation.
- Final Plan creation before Design Judge approval.
- Implementation Authorization or Implementation.
- Canonical Transition.
- TASK-004 Completion.
- Closure or Archive.
- Phase 5A resumption.
- Phase 2 start.
- Resume Checkpoint change.
- Registry 26-entry remediation.
- Workspace synchronization.
- Commit or Push before separate Owner Authorization.

## 9. Review Sequence and Future Gates

The future sequence is Design Builder → Design Critic → Design Judge → Final
Plan Builder, followed by separate Owner Implementation Authorization. The
approved operational labels remain proposals and are not Canonical Enum values:

- `KICKOFF_SCOPE_GATE`
- `DESIGN_REVIEW_GATE`
- `FINAL_PLAN_GATE`
- `IMPLEMENTATION_AUTHORIZATION_GATE`
- `TEST_GATE`
- `CRITIC_GATE`
- `JUDGE_GATE`
- `PHASE_COMPLETION_GATE`
- `COMMIT_AUTHORIZATION_GATE`

No gate is claimed as passed by this artifact.

## 10. Current Governance State

- Phase 1.6: `NOT_STARTED / NOT_AUTHORIZED`.
- Design: `NOT_AUTHORIZED`.
- Final Plan: `NOT_AUTHORIZED`.
- Implementation: `NOT_AUTHORIZED`.
- TASK-004: `ACTIVE / DESIGN`.
- Canonical gate: `FAIL`.
- Phase 5A: `PAUSED_BY_OWNER_PRIORITY`; Final Plan Consistency `NOT_READY`.
- Phase 2: `BLOCKED`.
- Completion Review: `TASK_COMPLETION_REVISION_REQUIRED`.
- Closure: `NOT_CONFIRMED`.
- Archive: `NOT_ELIGIBLE`.
- Resume Checkpoint: not current resume authority and unchanged.

## 11. Authorization Boundary and Safe Stop

This preparation activity authorizes only creation of this Decision Artifact,
its Registry Entry, and staging as an Independent Critic candidate. It does not
authorize Design Builder, Design Artifact creation, Final Plan, Implementation,
Phase 5A, Phase 2, Lifecycle Transition, Completion, Closure, Archive, Commit,
Push, Checkpoint modification, Registry 26-entry repair, or Workspace change.

Stop and return to Owner review on Authority conflict, requirement ambiguity,
file-boundary expansion, protected-path conflict, missing evidence, dirty
worktree, failed Critic review, or any attempt to start Design before DA-02 is
effective.
