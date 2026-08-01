# Workflow Specification

## Purpose

Define the shared canonical workflow used by Roles before TASK-004 formally approves the complete Lifecycle Specification.

## Current canonical operational flow

```text
TASK_DEFINITION
→ BUILDER_DESIGN
→ CRITIC_REVIEW
→ BUILDER_RESPONSE
→ JUDGE_REVIEW
→ FINAL_PLAN_CREATION
→ FINAL_PLAN_CONSISTENCY_CHECK
→ IMPLEMENTATION
→ IMPLEMENTATION_REPORT or IMPLEMENTATION_HANDOFF
→ TESTER_VALIDATION
→ IMPLEMENTATION_REVIEW
→ IMPLEMENTATION_FIX when required
→ RETEST when required
→ CRITIC_RE_REVIEW when required
→ FINAL_IMPLEMENTATION_JUDGMENT
→ PROJECT_POLICY_REVIEW
→ USER_OR_OWNER_APPROVAL when required
→ POLICY_UPDATE when required
→ VERIFY
→ CLOSURE_READINESS_DECISION
→ ARCHIVE_READINESS_DECISION
```

## Important limitation

The final Task Lifecycle state model is reserved for TASK-004.

Until TASK-004 is approved:

- do not invent authoritative state transitions,
- do not claim formal closure or archive completion without required records,
- use the flow above as operational routing guidance,
- preserve current evidence and route unresolved governance decisions.

## Routing

Only Orchestrator routes the next Role.

A Role may recommend a next action but that recommendation is advisory.

## Rework loops

Typical rework loops include:

- Critic → Builder Response → Judge
- Final Plan Consistency Check → Builder Final Plan revision
- Tester FAIL → Builder Fix → Retest
- Critic implementation REVISION_REQUIRED → Builder Fix → Retest → Critic Re-Review
- Policy VERIFY failure → correction or rollback proposal → approval → UPDATE → VERIFY

## Closure and archive

Closure Readiness and Archive Readiness are separate decisions.

Accepted risks, unresolved high-severity findings, missing canonical status records, or verification failure may block closure or archive.

