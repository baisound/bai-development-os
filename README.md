# BAI Development OS

BAI Development OS is a standalone, reusable foundation for AI-assisted software and creative-technology development.

It is intentionally separated from any one consumer project. The historical `javascript-roulette` repository is now a reference consumer/regression fixture rather than the host of OS core development.

## Core areas

- `src/context-guard/` — Context selection, permit, override, evidence binding, activation safety
- `src/lifecycle/` — Canonical Task lifecycle state and durable transitions
- `src/governance/` — Adaptive development profile selection
- `src/knowledge/` — governed Knowledge Assets, resolver, packs, usage/effectiveness and impact
- `common/` — shared authority, evidence, artifact, vocabulary, and workflow rules
- `roles/` — Builder, Critic, Tester, Judge, Orchestrator, Project Policy specifications
- `registry/` — current state and document/context indexes
- `tasks/TASK-004/` — completed Lifecycle Foundation history/evidence
- `tasks/TASK-005/` — completed Knowledge OS design/implementation/evidence
- `context-guard/` / `lifecycle/` / `schemas/` — machine-readable contracts
- `tests/` — core regression and assurance tests

## Adaptive development governance

BAI Development OS does **not** force every change through the same amount of ceremony. The required design depth, Critic/Tester/Judge participation, test density, evidence level, and revalidation scope are selected from the actual change characteristics: system scale, feature scale, criticality, failure impact, reversibility, novelty, and high-risk boundaries.

The profile system changes **development process depth**, not the permanent model-selection policy.

## Consumer example

```text
/home/baisound/projects/javascript-roulette/.bai-os/project.json
```

A consumer project keeps its own source and Task evidence. Shared OS implementation remains here.

## Verification

```bash
npm test
npm run check:boundaries
```

See `MIGRATION.md` for the repository rename and product-extraction procedure.


## TASK-004 Lifecycle Foundation Completion

As of 2026-08-08, TASK-004 implements the full Lifecycle Foundation through Phase 6: recovery/checkpoint control, Context Manifest and trust/freshness control, Cost and capability-based Model routing, Closure/Archive/dependency/migration control, and authorized System File synchronization. The current machine canonical references are `architecture/BAI_Development_OS_Architecture_Ver2.6.md`, `specifications/TASK-004_BAI_Development_OS_Lifecycle_Foundation_Ver1.6.md`, and `specifications/TASK-005_BAI_Development_OS_Knowledge_Operating_System_Ver1.2.md`. TASK-004 is completed after final verification; archive remains an independent readiness/commit boundary. Permanent model-selection policy remains separate from Adaptive Development Governance.

Runtime exports include `./lifecycle/recovery`, `./context-control`, `./model-control`, `./closure`, `./archive`, `./dependency`, `./system-sync`, and `./knowledge`.


## Post-TASK-008 roadmap

The canonical roadmap now reserves TASK-009 through TASK-014 for Security/Supply-chain Hardening, Release/Distribution/Upgrade, Multi-project Conformance, Self-Maintenance/Drift Repair, Domain Adapter SDK, and Adaptive Governance Calibration. These are planned extensions only. TASK-005 is completed; TASK-006 is now the next development route.


## TASK-005 Knowledge Operating System Completion

As of 2026-08-08, TASK-005 is completed. Knowledge is no longer an informal note layer: it has governed immutable revisions, deterministic resolution, version-pinned Knowledge Packs, usage/verification evidence, impact analysis, promotion/demotion/freshness Governance and persistent integrity checks. Run `npm run test:knowledge` for the subsystem suite.
