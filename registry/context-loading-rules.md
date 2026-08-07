# Context Loading Rules

## Goal

Reduce context and token consumption without weakening correctness, authority, evidence, or critical testing.

## Required Loading Order

1. Read `registry/current-state.md`.
2. Read `registry/ai-context-pack.md`.
3. Read `PROJECT.md`.
4. Read the active Task summary.
5. Read the selected Adaptive Development Profile result.
6. Read the active Role specification only when that Role is required by the selected profile.
7. Read only the source sections and implementation files affected by the assignment.
8. Load a full canonical document only when a binding decision or unresolved conflict requires it.
9. Read DOCX only when no valid Markdown authority is available for the required detail.

## Root Rule

BAI Development OS canonical root:

```text
/home/baisound/bai-development-os
```

Consumer project roots are supplied by project adapters such as `.bai-os/project.json`; they are not hardcoded into OS runtime source.

## Importance Levels

- **A — Always:** current state, active Task scope, assignment, authority boundary, selected development profile.
- **B — Conditional:** relevant final plan/amendment, common specification, required Role specification, impacted tests.
- **C — On demand:** Architecture, detailed specifications, reviews, older cycle evidence.
- **D — Audit only:** archived artifacts, obsolete versions, completed historical intermediate artifacts.

## Adaptive Profile Rule

The selected DEV profile determines context depth as well as workflow depth.

- DEV-0/DEV-1: impacted files and minimal authority only.
- DEV-2: focused design, relevant implementation, targeted regression.
- DEV-3: detailed design, Critic inputs, boundary/negative and regression evidence.
- DEV-4: architecture/failure-mode sources, core contracts, consumer fixtures, fault/recovery evidence.

A high-assurance profile may load more evidence because correctness requires it. Context Economy MUST NOT be used to suppress evidence required for critical verification.

## Summary Rule

A `*.summary.md` file is a navigation/loading aid. It does not replace the source for binding decisions, exact wording, schemas, matrices, or acceptance criteria.

## Hash Rule

When a summary or registry entry records a source SHA-256 and the hash still matches, do not re-read the full source merely to confirm it is unchanged. A hash match proves unchanged bytes, not correctness of a prior interpretation.

## Prohibited Loading Behavior

- Loading every document "just in case."
- Re-reading unchanged DOCX for every Role.
- Passing an entire previous conversation to each Role.
- Loading all historical review/retest cycles when only the current unresolved defect matters.
- Restarting all Role sessions after a localized fix when the selected profile only requires impacted revalidation.
- Using cost reduction to weaken required foundation-critical tests.
