# BAI Development OS

BAI Development OS is a standalone, reusable foundation for AI-assisted software and creative-technology development.

It is intentionally separated from any one consumer project. The historical `javascript-roulette` repository is now a reference consumer/regression fixture rather than the host of OS core development.

## Core areas

- `src/context-guard/` — Context selection, permit, override, evidence binding, activation safety
- `src/lifecycle/` — Canonical Task lifecycle state and durable transitions
- `src/governance/` — Adaptive development profile selection
- `common/` — shared authority, evidence, artifact, vocabulary, and workflow rules
- `roles/` — Builder, Critic, Tester, Judge, Orchestrator, Project Policy specifications
- `registry/` — current state and document/context indexes
- `tasks/TASK-004/` — current OS foundation Task history and evidence
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
