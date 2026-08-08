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
## Roadmap Retrieval Rule

For completed `TASK-009`, load TASK-009 Ver.1.0 plus Architecture Part XVI when needed. For completed `TASK-010`, load TASK-010 Ver.1.0 plus Architecture Ver.2.17 Part XVIII when needed. For future `TASK-012` through `TASK-015`, load Architecture Ver.2.20 Part XV (or its summary for navigation) as the current complete consolidated scope. Parts VI/VIII/X/XII/XIV and post-TASK addenda are Historical Evolution and MUST NOT be used alone as current task scope. Load them only for provenance/evolution analysis.

If a retrieved historical fragment says a future Task is undefined or shows only one refinement slice, resolve it against Part XV before making a routing or scope decision.

## TASK-009 security context rule

Do not load the entire SecurityOS implementation by default. Start from `tasks/TASK-009/TASK-009.summary.md`; load the Detailed Design Ver.1.0 and only the relevant security module/schema/test when a task actually touches path safety, secrets, signing, journaling, replay, egress/DLP, supply-chain or sandbox behavior.


Historical post-TASK-010 note: Architecture Ver.2.18/2.19 Part XV carried TASK-011〜015. Current routing after TASK-011 completion uses Ver.2.19 Part XV for TASK-012〜015. `BAI_Development_OS_Post_TASK010_Roadmap_Refinement_Ver1.0.md` is provenance only; do not load it as a substitute for Part XV.


For completed `TASK-011`, load `tasks/TASK-011/TASK-011.summary.md` first and TASK-011 Ver.1.0 when exact conformance contracts are required. For future `TASK-012` through `TASK-015`, Architecture Ver.2.20 Part XV remains the single current consolidated scope. Do not treat SIMULATED/DECLARED conformance evidence as REAL execution evidence.

## Post-TASK-011 roadmap loading

For TASK-012〜015 current scope, load Architecture Ver.2.20 Part XV first. Load `BAI_Development_OS_Post_TASK011_Roadmap_Refinement_Ver1.0.md` only for provenance of TASK-011-derived additions. Historical addenda must not override Part XV.
