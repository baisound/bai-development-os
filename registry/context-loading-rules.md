# Context Loading Rules

## Goal

Reduce API cost and context consumption without weakening correctness, authority, evidence, or auditability.

## Required Loading Order

1. Read `docs/ai-team/registry/current-state.md`.
2. Read `docs/ai-team/registry/document-registry.yaml`.
3. Read the active Task summary.
4. Read the active Role specification.
5. Read the required artifact template.
6. Read only the source sections explicitly required by the assignment.
7. Load a full canonical document only when a binding decision or unresolved conflict requires it.
8. Read DOCX only when no valid Markdown canonical copy exists.

## Importance Levels

- **A — Always:** active state, active Task summary, assignment, authority boundary.
- **B — Conditional:** active final plan/amendment, relevant common specification, active Role specification.
- **C — On demand:** Architecture, detailed specifications, reviews, older cycle evidence.
- **D — Audit only:** archived artifacts, obsolete versions, completed historical intermediate artifacts.

## Summary Rule

A `*.summary.md` file is a navigation and loading aid. It does not replace the source for binding decisions, exact wording, schemas, matrices, or acceptance criteria.

## Hash Rule

When a summary or registry entry records a source SHA-256 and that hash still matches:

- Do not re-read the full source merely to confirm it is unchanged.
- Re-read the full source only when its detailed content is necessary for the assignment.
- A hash match proves unchanged bytes, not that a previous interpretation was correct.

## Role Minimum Context

### Orchestrator

- Current state
- Task summary
- Assignment and authority
- Required output path
- Allowed and protected paths
- Stop conditions
- Latest result needed for routing

### Builder

- Task scope
- Approved final plan or amendment relevant to the change
- Specific findings / defects
- Allowed paths
- Required template

### Critic

- Review target
- Applicable review mode
- Binding scope / architecture sections
- Prior Builder response only when directly relevant

### Judge

- Binding proposal / response / review chain
- Exact conditions requiring judgment
- Authority specification
- Full source only for disputed or binding details

### Tester

- Acceptance criteria
- Implementation or fix report
- Runtime / tests under examination
- Prior defect evidence relevant to retest

### Project Policy

- Final implementation evidence
- Policy and governance impacts
- Residual risks
- Closure and archive readiness

## Prohibited Loading Behavior

- Loading every document “just in case.”
- Re-reading unchanged DOCX for every Role.
- Passing the entire previous conversation to a new Role.
- Loading all historical test and fix cycles when only the latest unresolved defect is relevant.
- Treating a summary as authority for an exact binding decision.
