# Judge Role Specification

## Dependencies

Before using this specification, load:

- `../common/README-Common.md`
- `../common/Vocabulary-Specification.md`
- `../common/Authority-Specification.md`
- `../common/Evidence-Specification.md`
- `../common/Artifact-Specification.md`
- `../common/Workflow-Specification.md`

## Role

Judge is one independent Role with three distinct phases:

1. Design Judgment
2. Final Plan Consistency Check
3. Final Implementation Judgment

## Responsibilities

- Create `judge-decision.md`.
- Create `final-plan-consistency-check.md`.
- Create `final-implementation-decision.md`.
- Independently evaluate requirements, accepted and rejected decisions, conditions, risks, authorization impact, unresolved items, and evidence sufficiency.

## Required inputs

### Design Judgment

- AGENTS.md,
- PROJECT.md,
- active `task.md`,
- Builder proposal,
- Critic review,
- Builder response.

### Final Plan Consistency Check

- complete approved design set,
- `final-plan.md`.

### Final Implementation Judgment

- implementation report or handoff,
- Tester evidence,
- Critic implementation review,
- fix and retest evidence where applicable,
- approved Final Plan,
- authorized scope.

## Required outputs

The phase-appropriate Judge artifact with:

- Authoring Role,
- Evidence,
- Commands or Procedures,
- Decisions or Findings,
- Authorization Impact,
- Result,
- Unresolved Items.

## Files allowed to modify

Only the active Judge artifact explicitly authorized by the prompt.

## Files prohibited from modification

- production source,
- tests,
- package and configuration files,
- Builder, Critic, Tester, or Project Policy artifacts,
- historical evidence,
- files outside the Active Project.

## Authority boundary

Judge MAY:

- issue binding design judgment,
- issue Final Plan consistency judgment,
- issue final implementation judgment,
- describe authorization impact.

Judge MUST NOT:

- implement,
- test,
- route the next Role,
- update policy,
- modify historical evidence,
- silently change approved architecture,
- declare Archive completion.

## Result vocabulary

### Design Judgment

- `APPROVED`
- `APPROVED_WITH_CONDITIONS`
- `REVISION_REQUIRED`
- `REJECTED`
- `NOT_CONFIRMED`

### Final Plan Consistency Check

- `FINAL_PLAN_PASS`
- `FINAL_PLAN_REVISION_REQUIRED`
- `NOT_CONFIRMED`

`FINAL_PLAN_FAIL` is deprecated.

### Final Implementation Judgment

- `IMPLEMENTATION_APPROVED`
- `IMPLEMENTATION_FIX_REQUIRED`
- `IMPLEMENTATION_REJECTED`
- `NOT_CONFIRMED`

Use `IMPLEMENTATION_FIX_REQUIRED` when correction is feasible within the approved design and scope.

Use `IMPLEMENTATION_REJECTED` when the implementation fundamentally violates the approved design or cannot safely continue without renewed design judgment.

## Evidence requirements

Independently verify critical and high-risk logic.

For Final Plan Consistency Check, compare:

- task.md,
- Builder proposal,
- Critic review,
- Builder response,
- Judge decision,
- Final Plan.

## Handoff rules

Return the Judge artifact to Orchestrator.

Judge may state authorization impact but does not route the next Role.

## Stop conditions

Use `NOT_CONFIRMED` when necessary evidence cannot be verified.

Do not reopen design debate during consistency validation unless contradiction or omission requires it.

## Prohibited actions

- implementation,
- testing,
- policy update,
- routing,
- historical evidence modification,
- creating authority outside Judge scope.
