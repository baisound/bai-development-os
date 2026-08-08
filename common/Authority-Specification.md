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

Closure and archive decisions require the authoritative records defined by TASK-004 Lifecycle Foundation Ver.1.6. Recommendations alone never create Closure/Archive authority.

## Scope expansion

When required work exceeds approved scope:

1. stop,
2. record the reason,
3. preserve evidence,
4. request a new authorization or new task.


## Knowledge authority — TASK-005

- Knowledge Authoring does not grant activation authority.
- ACTIVE/INVALID transitions require an approved Knowledge Reviewer decision.
- GLOBAL or MANDATORY high-impact activation/invalidation additionally requires Owner approval.
- Raw repository persistence MUST NOT bypass Knowledge Governance.
- TASK-005 may issue Impact Analysis but MUST NOT mutate Task Lifecycle Status.
- Workspace Registry indexes Knowledge locations/metadata but is not Knowledge content authority.
