# Vocabulary Specification

## Purpose

Provide a single canonical vocabulary across Roles.

## Technical verification Result

Use only:

- `PASS`
- `FAIL`
- `NOT_CONFIRMED`

## Execution Status

Use when a procedure-level execution state must be recorded:

- `EXECUTED`
- `NOT_EXECUTED`
- `PARTIALLY_EXECUTED`

`NOT_EXECUTED` is not a top-level verification Result. It explains why the Result is usually `NOT_CONFIRMED`.

## Observation Status

- `OBSERVED`
- `NOT_OBSERVED`
- `PARTIALLY_OBSERVED`

## Gate Readiness

Orchestrator uses:

- `PASS`
- `NOT_READY`
- `FAIL`
- `NOT_CONFIRMED`
- `BLOCKED`

These are routing and readiness results, not design approval or test results.

## Design Judgment

Judge uses:

- `APPROVED`
- `APPROVED_WITH_CONDITIONS`
- `REVISION_REQUIRED`
- `REJECTED`
- `NOT_CONFIRMED`

## Final Plan Consistency Check

Judge uses:

- `FINAL_PLAN_PASS`
- `FINAL_PLAN_REVISION_REQUIRED`
- `NOT_CONFIRMED`

`FINAL_PLAN_FAIL` is deprecated.

## Final Implementation Judgment

Until TASK-004 formally approves lifecycle terminology, use:

- `IMPLEMENTATION_APPROVED`
- `IMPLEMENTATION_FIX_REQUIRED`
- `IMPLEMENTATION_REJECTED`
- `NOT_CONFIRMED`

## Critic Review Result

- `PASS`
- `REVISION_REQUIRED`
- `NOT_CONFIRMED`

## Finding Status

- `RESOLVED`
- `PARTIALLY_RESOLVED`
- `UNRESOLVED`

## Project Policy Result

Proposal and authorization:

- `PROPOSAL_READY`
- `REVISION_REQUIRED`
- `NOT_CONFIRMED`
- `NOT_AUTHORIZED`

Update:

- `UPDATE_COMPLETED`
- `UPDATE_PARTIALLY_COMPLETED`
- `UPDATE_FAILED`

Verification:

- `VERIFICATION_PASS`
- `VERIFICATION_FAILED`
- `NOT_CONFIRMED`

`UPDATE_COMPLETED` does not mean the policy cycle is complete. VERIFY is mandatory.

## Risk vocabulary

- `ACCEPTED_RISK`
- `RESOLVED`
- `DEFERRED`
- `FOLLOW_UP_REQUIRED`

Accepted Risk and Resolved are never interchangeable.

## Lifecycle reservation

TASK-004 may add, rename, or formally approve Task Lifecycle states. Until then, Role files may refer to conceptual stages but MUST NOT invent authoritative lifecycle transitions.
