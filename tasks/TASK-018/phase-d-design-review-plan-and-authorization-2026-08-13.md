# TASK-018 Phase D — Queue / Human Gate Plan and Authorization

Date: `2026-08-13`
Target gate: `AUTONOMOUS_QUEUE_PASS`
Authorization: `AUTHORIZED_UNDER_CONTINUOUS_OWNER_DIRECTIVE`

## Design

Extend existing `AutomationOS` scheduler with a pure autonomous Task selector and Human Gate record contract. Selection order is Safety/Authority first, then P0/Owner priority, dependency readiness, implementation before design-only, context locality, context cost and roadmap order.

A Human Gate parks only its Task when `safe_to_continue_other_tasks=true`. A shared unsafe gate may set `system_blocked=true`; `TASK_BLOCKED` and `SYSTEM_BLOCKED` are never conflated. Design-only selection cannot be executed as implementation. Native, paid, destructive, release/deploy and credential needs require matching satisfied gates before runnable selection.

## Allowed Files

- `src/automation/autonomous-queue.mjs`
- `src/automation/index.mjs`
- `schemas/automation/autonomous-task-node.schema.json`
- `schemas/automation/human-gate.schema.json`
- `tests/automation/autonomous-queue.test.mjs`
- `tests/automation/autonomous-queue-schema.test.mjs`
- `tasks/TASK-018/**`
- active registry/status/document-index synchronization files

## Critic design decision

`DESIGN_PASS`. The queue cannot create Authorization, cannot turn Design-Ahead into implementation, does not dispatch side effects, and cannot prefer context savings over Safety/Authority.

## Rollback

Remove the new module/export/schema/tests without changing the existing action scheduler.
