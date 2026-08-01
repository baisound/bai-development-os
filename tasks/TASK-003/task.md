# TASK-003 — Automated Regression Test Foundation

## Metadata

- Task ID: TASK-003
- Title: Automated Regression Test Foundation
- Active Project: javascript-roulette
- Status: TASK_DEFINITION
- Previous Task: TASK-002
- Previous Task Status: COMPLETED
- Reopen TASK-002: NO
- Current Phase: TASK_DEFINITION
- Implementation Authorization: NOT_AUTHORIZED

## Purpose

Create a durable and independently runnable automated regression test foundation for the JavaScript Roulette Version 1 baseline.

The design must select the smallest compatible testing approach through the normal multi-agent design workflow. No production implementation is authorized during TASK_DEFINITION.

## Background

TASK-002 completed Version 1 with an accepted risk: persistent automated regression tests were not yet implemented.

TASK-003 resolves that accepted risk without reopening or rewriting TASK-002 historical evidence.

## In-Scope Functions

- normalizeCandidates
- validateCandidates
- calculateStopAngle
- calculateNextRotation
- getRandomIndex

## Required Coverage Areas

### normalizeCandidates

Define tests for:

- Valid candidate arrays
- Whitespace normalization
- Empty values
- Duplicate handling according to existing Version 1 behavior
- Non-array or malformed inputs, where applicable

### validateCandidates

Define tests for:

- Minimum valid candidate count
- Maximum valid candidate count, if constrained
- Empty candidate handling
- Invalid value handling
- Exact error/result behavior from Version 1

### calculateStopAngle

Define tests for:

- First segment
- Middle segment
- Last segment
- Segment boundary values
- Angle normalization
- Deterministic expected values

### calculateNextRotation

Define tests for:

- Initial rotation
- Cumulative rotation
- Multiple consecutive spins
- Rotation normalization
- No backward visual rotation, if required by Version 1
- Exact expected results

### getRandomIndex

Define tests for:

- Valid index range
- Boundary random values
- Rejection-sampling boundaries
- Values immediately below and above rejection threshold
- Repeated rejected values followed by an accepted value
- Deterministic testing through injectable or mocked randomness
- No modulo-bias regression

## Design Constraints

- Preserve the Version 1 application behavior.
- Do not change production behavior merely to simplify testing.
- The chosen test runner must be the smallest compatible approach.
- Tests must be independently runnable.
- Tests must be persistently stored in the repository.
- Test execution must return a reliable process result.
- No browser-only manual procedure may substitute for automated regression tests.
- Existing TASK-002 evidence must not be renamed, overwritten, or modified.
- Source-control baseline must be preserved.
- Unrelated files and projects must not be accessed or modified.

## Required Builder Design Decisions

Builder must explicitly decide and document:

1. Test runner and why it is the smallest compatible option
2. Required package.json changes
3. Test file location and naming
4. How production functions become testable
5. Whether exports are required
6. How browser runtime behavior remains unchanged
7. How randomness is controlled
8. Exact rejection-sampling boundary cases
9. Exact cumulative-rotation cases
10. Commands for independent test execution
11. Expected exit behavior
12. Compatibility with Vite and the current project structure
13. Files to create or modify
14. Files prohibited from modification
15. Rollback approach
16. Completion criteria

## Required Design Artifacts

The standard workflow must create, in order:

1. builder-proposal.md
2. critic-review.md
3. builder-response.md
4. judge-decision.md
5. final-plan.md
6. final-plan-consistency-check.md

Implementation artifacts are prohibited until Final Plan Gate authorization.

## Initial Gate

TASK-003 may advance from TASK_DEFINITION to BUILDER_DESIGN only when:

- Active Project is confirmed as javascript-roulette
- TASK-002 is confirmed COMPLETED and not reopened
- TASK-003 directory and task.md exist
- Scope and prohibited changes are explicit
- Orchestrator produces a complete Builder design prompt
- No production implementation is authorized

## Expected First Decision

```text
Current Phase: TASK_DEFINITION
Next Agent: Builder
Expected Output: builder-proposal.md
Next Gate: CRITIC_REVIEW
```
