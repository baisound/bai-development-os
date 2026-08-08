# BAI Development OS — Lightweight Context Pack

## Start Here

1. `registry/current-state.md`
2. `registry/context-loading-rules.md`
3. `PROJECT.md`
4. Active Task summary, if an active Task exists
5. Selected Adaptive Development Profile
6. Only Role specifications and source sections required by the assignment

## System Identity

BAI Development OS is a standalone reusable development foundation rooted at:

```text
/home/baisound/bai-development-os
```

Current canonical design set:

- `architecture/BAI_Development_OS_Architecture_Ver2.5.md` (+ `.docx`, `.summary.md`)
- `specifications/TASK-004_BAI_Development_OS_Lifecycle_Foundation_Ver1.6.md` (+ `.docx`, `.summary.md`)

Reference consumer:

```text
/home/baisound/projects/javascript-roulette
```

## Current Priority

- TASK-004 Lifecycle Foundation is `COMPLETED` and is a read-only completed baseline for ordinary future work.
- No new OS Task is implicitly active merely because TASK-004 is complete.
- The next planned route is TASK-005 Knowledge OS (`NOT_STARTED / NOT_AUTHORIZED`).
- Lifecycle defects discovered later are routed to a new follow-up Task rather than reopening TASK-004.

## Adaptive Routing Rule

Before choosing a Role sequence, classify the change into DEV-0 through DEV-4. Small peripheral work must not receive foundation-level ceremony. Core/foundation work receives stronger Critic and test assurance. Localized fixes re-run impacted gates/tests plus profile-required regression instead of restarting the entire workflow.

Adaptive profile selection does not modify permanent model-routing policy.

## Completed TASK-004 Capabilities

Recovery/Checkpoint, Context Control, atomic Cost Guard, Model Routing, Closure/Archive/Migration/Dependency control, and authorized System Sync are implemented runtime surfaces. Use the current canonical documents for exact contracts.

## Roadmap Identity

- TASK-005 Knowledge OS
- TASK-006 Registry / Resolver / Automation
- TASK-007 Monitoring & Dashboard
- TASK-008 External Integration
- TASK-009 Security / Supply Chain / Integrity Hardening
- TASK-010 Release / Distribution / Consumer Upgrade OS
- TASK-011 Multi-Project Conformance & Compatibility Lab
- TASK-012 Self-Maintenance / Drift Detection / Safe Auto-Repair
- TASK-013 Domain Adapter / Plugin SDK
- TASK-014 Adaptive Governance Calibration & Policy Learning

TASK-009〜014 are reserved roadmap items only and are not implicitly authorized.

## Non-negotiable Rules

- Historical Evidence is preserved.
- Consumer projects do not host copies of OS core implementation.
- Unknown or contradictory authority state Safe Stops.
- Context is loaded summary-first and impact-first.
- Safety-critical testing is not reduced for token economy.
- A completed Task is not reopened for ordinary enhancement.
