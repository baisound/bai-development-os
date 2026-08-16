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

## Formal Lifecycle Foundation

TASK-004 is complete and its Lifecycle Foundation is authoritative. All governed Tasks MUST use the formal Status/Phase/Gate/Authorization model, append-only transition evidence, recovery checkpoint rules, Context/Cost/Model controls, and distinct Closure/Archive readiness decisions.

PAUSED, BLOCKED, and STALLED are distinct safe-stop states. Resume requires a valid checkpoint plus the state-specific recovery evidence. Completion is not Archive; Archive requires separate readiness and post-archive verification.

## Routing

Orchestrator exclusively creates or changes cross-lane routing, scope and authority. Inside an already authorized Autonomous Worklane, a verified Atomic Unit Terminal may durably dispatch the exact next unit to the bound Target Inbox without a chat relay. This intra-lane continuation cannot widen files, capabilities, authority epoch, effect class or completion criteria.

A Role may recommend a next action but that recommendation is advisory.

Human Gate V2 parks only its exact signed resource/capability scope unless `system_wide_block=true`. A parked lane may select only an explicitly bound, resource-disjoint RUNNABLE fallback. Legacy V1 gates require migration evidence and remain fail-closed where scope is not exact.

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


---

# Adaptive Development Profile Selection

Before selecting a Role sequence, the Orchestrator MUST classify the requested change using the Adaptive Development Governance Specification. The selected DEV profile determines which reviews, tests, evidence, and gates are actually required.

A fixed Builder -> Critic -> Judge -> Tester chain MUST NOT be applied mechanically to every change. DEV-0/DEV-1 may compress or omit unnecessary review roles. DEV-3/DEV-4 MUST strengthen Critic and test assurance. Rework MUST be impact-scoped rather than restarting the entire workflow unless the change invalidates the broader design.

The profile selector MUST NOT silently change the model-routing policy.
