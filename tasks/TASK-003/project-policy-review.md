# TASK-003 Project Policy Review

## Authoring Role

Project Policy Agent

## Objective

Evaluate policy and documentation changes suggested by TASK-003's provenance exception and deferred accessibility observations. This review performs DETECT and PROPOSE only; it does not update policy, risk, source, test, or configuration files.

## Evidence

- `/home/baisound/AGENTS.md`
- `PROJECT.md`
- `docs/ai-team/README-Project-Policy.md`
- `docs/risk-register.md`
- `docs/ai-team/tasks/TASK-003/task.md`
- `docs/ai-team/tasks/TASK-003/final-implementation-decision.md`
- `docs/ai-team/tasks/TASK-003/provenance-exception.md`
- `docs/ai-team/tasks/TASK-003/test-report.md`
- `docs/ai-team/tasks/TASK-003/implementation-review.md`

## Current State

- TASK-003 Final Implementation Decision is `IMPLEMENTATION_APPROVED`.
- `CRT-003-001` remains `UNRESOLVED`: the historical origin of listed out-of-scope differences is unknown. The Project Owner accepted this only as an evaluation exclusion and residual risk; it is not evidence that any difference predated TASK-003.
- `CRT-003-002` remains `UNRESOLVED`: keyboard-only interaction and real screen-reader live-region output were recorded as `NOT_EXECUTED`.
- `RISK-001` remains the accepted Version 1 automated-regression-test coverage risk in the current risk register. This review does not modify its status or treat it as resolved evidence.

## Classification

### Workspace-wide

1. **Pre-resume Git provenance baseline capture rule**
   - Before resuming implementation, testing, or review after an interruption, capture a timestamp, repository root, HEAD, `git status --porcelain=v1 -uall`, `git diff --name-status`, and `git diff --cached --name-status`.
   - Save the capture in an active-task artifact before new work begins.
   - If Git is unavailable or the repository state cannot be read, record `NOT_CONFIRMED`; do not infer that current differences are pre-existing.

2. **Approved provenance exception rule**
   - A provenance exception requires explicit Project Owner authorization.
   - The exception must identify known facts, unknown facts, affected files, evaluation exclusions, prohibited interpretations, residual risk, and a post-authorization baseline procedure.
   - An exception may exclude unavailable provenance from a specific evaluation. It must not prove, imply, or characterize an out-of-scope difference as pre-existing.

### Project-wide

1. **Accessibility validation risk handling**
   - Add a project-risk process for deferred keyboard-only and real screen-reader validation when a task does not execute those checks.
   - The record must preserve `NOT_EXECUTED` status and distinguish unchanged markup from direct user-assistive-technology evidence.
   - This is a proposed future risk-register update only; no risk-register change is authorized by this review.

### Task-specific

1. **TASK-003 provenance record**
   - Retain `provenance-exception.md` unchanged as the authorized exception and baseline record.
   - Do not revise TASK-003 artifacts to add new provenance-template headings or correct historical metadata.

2. **TASK-003 accessibility limitation**
   - Retain `CRT-003-002` and the `NOT_EXECUTED` Tester observation unchanged.
   - Do not convert static markup inspection into direct keyboard or screen-reader execution evidence.

## Proposed Changes

### Proposal PPR-003-001 — Pre-resume baseline policy

**Classification:** Workspace-wide  
**Proposed target:** AGENTS.md and a future canonical task template  
**Proposal:** Define a mandatory pre-resume provenance baseline for Git-managed work before an interrupted task resumes any mutable phase. The artifact must record authoring role, phase, timestamp, repository root, HEAD, exact commands, complete outputs, and any capture limitation.

### Proposal PPR-003-002 — Provenance exception policy

**Classification:** Workspace-wide  
**Proposed target:** AGENTS.md and a future `provenance-exception.template.md`  
**Proposal:** Define the Project Owner authorization requirement and the non-retrospective-evidence rule. Require exceptions to state that unknown provenance remains unknown and cannot be used as proof of pre-existing state.

### Proposal PPR-003-003 — Deferred accessibility validation handling

**Classification:** Project-wide  
**Proposed target:** `docs/risk-register.md` and a future project release-validation policy  
**Proposal:** Add a deferred validation risk entry when keyboard-only interaction or real screen-reader behavior is not executed. The entry must record affected flows, execution status, release impact, mitigation, and the follow-up reference.

## Authorization Status

AUTHORIZED_FOR_POLICY_REVIEW_ONLY

No policy UPDATE, risk-register UPDATE, or follow-up task creation is authorized.

## Follow-up Task Recommendation

Recommended only if the project requires release-level accessibility assurance:

`TASK-004 — Accessibility Interaction Validation`

Purpose: independently execute and record keyboard-only operation and real screen-reader live-region behavior in supported environments. This would address direct validation evidence; it would not rewrite TASK-003 or treat either residual risk as resolved before execution.

## Result

PROPOSAL_READY

## Unresolved Items

- `CRT-003-001` provenance limitation remains accepted only as an evaluation exclusion; its unknown history is not resolved.
- `CRT-003-002` keyboard-only and real screen-reader validation remains `NOT_EXECUTED`.
- No policy or risk-document update has been authorized in this assignment.
