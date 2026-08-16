# TASK-020 — Autonomous Worklane & Durable Dispatch OS

## Identity

- Design ID: `BAI-OS-AUTONOMOUS-WORKLANE-DURABLE-DISPATCH-001`
- Priority: `P0 / OWNER_DIRECTED`
- DEV Profile: `DEV_4_FOUNDATION_CRITICAL`
- Status: `ACTIVE / IMPLEMENTATION_AUTHORIZED`
- Branch: `codex/task-020-autonomous-worklane-durable-dispatch`

## Owner directive

On 2026-08-16 the Owner directed BAI Development OS to create a development branch, canonicalize the independently reviewed detailed design, adjust the roadmap, and implement the design. This is the explicit new follow-up Task and bounded implementation authority. Completed TASK-004, TASK-015 and TASK-018 remain closed and are integrated through versioned adapters/supplements rather than historical rewrites.

## Goal

Remove design-conversation relay as a single point of failure by providing durable, authority-bound autonomous work lanes that can continue bounded work, park exact Gates, select safe fallback work, recover delivery, fence stale actors, and distinguish unit/design completion from Product completion.

## Canonical design

`specifications/TASK-020_BAI_Development_OS_Autonomous_Worklane_Durable_Dispatch_Ver1.0.md`

Design review result:

- three independent Critic audits completed;
- final Judge: `PASS_DESIGN_READY_FOR_SEPARATE_IMPLEMENTATION_AUTHORITY`;
- residual Critical/High/Medium: `0/0/0`;
- reviewed R4 SHA-256: `555DD99B848F271708029BBAF9C088E60CCC6F11A7525891AF42F86EB1580DA0`.

## Foundation implementation scope

1. Worklane, resource ownership and standing-authority contracts.
2. Durable producer Outbox and target Inbox state machines.
3. Atomic-unit terminal and deterministic next/Gate/completion intent.
4. Gate fallback selection and bounded repair/stall policy.
5. Lease/fencing/takeover eligibility.
6. Branch/PR lifecycle and merged-branch cleanup eligibility.
7. Product completion freshness/read-model guards.
8. HumanGate V1/V2 compatibility and fail-closed migration helpers.
9. Schemas, exports, Role/Workflow synchronization, focused/integration/full tests.

## Permanent boundaries

- Authority is referenced and evaluated; AutomationOS cannot mint Owner authority.
- Delivery is at-least-once; exactly-once is not claimed universally.
- Unfenceable/nonreconcilable external effects are not autonomously executed.
- TASK-004 remains the sole Lifecycle source of truth.
- TASK-015 transport never owns Lifecycle or Authority.
- No Consumer deployment, paid execution, recording, Release, Deploy or Production Activation is authorized by this Task.
- Git push/PR/merge are separate publication actions; direct push to main is prohibited.

## Completion gates

- `TASK020_DESIGN_CANONICAL_PASS`
- `TASK020_CONTRACT_FOUNDATION_PASS`
- `TASK020_STATE_MACHINE_PASS`
- `TASK020_AUTHORITY_FENCING_PASS`
- `TASK020_DELIVERY_RECOVERY_PASS`
- `TASK020_BRANCH_COMPLETION_PASS`
- `TASK020_FULL_REGRESSION_PASS`
- `TASK020_COMPLETION_JUDGE_PASS`
