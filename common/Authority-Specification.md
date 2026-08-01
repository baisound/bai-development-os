# Authority Specification

## Purpose

Define shared authorization boundaries.

## General rule

A Role may act only within authority explicitly granted by:

- the approved workflow,
- the authoritative artifact,
- the current authorized prompt,
- the approved file scope.

Authorization MUST NOT be inferred from:

- a recommendation,
- a previous conversation,
- an agent summary,
- a Builder claim,
- a Critic suggestion,
- a downstream Role statement.

## Authority separation

- Builder may design and implement only within authorized scope.
- Tester may verify but may not approve implementation.
- Critic may review but may not authorize implementation or completion.
- Judge may issue binding judgments but may not route the next Role.
- Project Policy Agent may propose and, after approval, update policy, but may not authorize itself.
- Orchestrator may route and report authority status but may not create authority.

## Implementation authorization

Design approval alone does not authorize implementation.

Implementation requires:

1. approved design state,
2. `FINAL_PLAN_PASS`,
3. explicit `AUTHORIZED` implementation status,
4. bounded allowed-file scope.

## Policy update authorization

Policy UPDATE requires explicit user or Owner approval of:

- proposed changes,
- target files,
- scope,
- migration effect,
- rollback or recovery approach.

## Closure and archive authority

No Role may declare Closure or Archive readiness solely from recommendation.

Closure and archive decisions require the authoritative records defined by the approved Lifecycle Specification. Until TASK-004 formalizes them, such decisions remain provisional and MUST be routed through Orchestrator and Project Policy review.

## Scope expansion

When required work exceeds approved scope:

1. stop,
2. record the reason,
3. preserve evidence,
4. request a new authorization or new task.
