# BAI Development OS Product Boundary and Adaptive Governance Addendum Ver.1.0

## Status

Operational addendum created during the 2026-08-08 repository extraction. It supplements the historical Architecture Ver.2.1 where repository-root and fixed-workflow assumptions no longer match the standalone product. Historical architecture content remains preserved.

## 1. Corrected Product Topology

```text
/home/baisound/
├── bai-development-os/             # reusable platform / canonical OS product
└── projects/
    ├── javascript-roulette/         # consumer / reference regression project
    └── <other-projects>/            # future consumers
```

The dependency direction is:

```text
BAI Development OS -> governs/supports consumer projects
consumer project  -X-> hosts BAI Development OS core
```

## 2. Repository Ownership

Former `ai-team` repository history becomes BAI Development OS product lineage. OS core previously implemented under `javascript-roulette` is extracted into the standalone product with source-commit provenance.

JavaScript Roulette retains only its application, project-local Task evidence, and `.bai-os/project.json` adapter.

## 3. Adaptive Development Governance

The OS MUST select development-process depth from actual change characteristics rather than a fixed universal workflow.

Input dimensions:

- system scale,
- feature scale,
- criticality,
- failure impact,
- reversibility,
- novelty,
- change kind,
- high-risk boundaries.

Output profiles range from `DEV_0_QUICK` to `DEV_4_FOUNDATION_CRITICAL`.

The profile controls design depth, required Roles, testing density, review-cycle cap, evidence depth, and revalidation scope. It does not change permanent model-routing policy.

## 4. Test Principle

Test effort is asymmetric by design.

- Peripheral, reversible changes use targeted validation.
- Standard features use unit/integration/targeted regression.
- Core functions add boundary/negative tests and stronger Critic review.
- Foundation-critical functions add contract, fault/recovery, and consumer-fixture regression where applicable.

Token economy may remove redundant ceremony but MUST NOT reduce assurance for critical functions.

## 5. Roadmap Preservation

The existing proposed OS roadmap remains:

- TASK-005 Knowledge OS
- TASK-006 Workspace Registry / Resolver / Automation
- TASK-007 Monitoring & Dashboard
- TASK-008 External Integration

No canonical TASK-009 is defined by this addendum.

## 6. Phase 1.6 Boundary

Repository extraction and Adaptive Development Governance are corrective TASK-004 foundation work. They do not silently authorize Phase 1.6 implementation. Existing Phase 1.6 authority/evidence remains preserved and must be evaluated from its own current decision artifacts when work resumes.
