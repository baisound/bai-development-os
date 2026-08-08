# BAI Development OS

## Product ID

`bai-development-os`

## Canonical Root

```text
/home/baisound/bai-development-os
```

## Purpose

BAI Development OS is the reusable development foundation for multiple projects. It provides lifecycle state management, Context Guard, authority/evidence rules, adaptive development governance, reusable Roles/templates/schemas, and the foundation for future Knowledge, Automation, Monitoring, and Integration layers.

## Product Boundary

BAI Development OS is a standalone product. Consumer projects such as `javascript-roulette` are not development hosts for OS core functionality. Consumers MAY contain a thin `.bai-os/` adapter and project-local evidence; they MUST NOT carry copies of OS core source, shared governance, shared Roles, or OS-owned Task history.

## Current Baseline

TASK-004 — AI Development OS Lifecycle Foundation: `COMPLETED`.

Current machine canonicals:

- `architecture/BAI_Development_OS_Architecture_Ver2.7.md`
- `specifications/TASK-004_BAI_Development_OS_Lifecycle_Foundation_Ver1.6.md`
- `specifications/TASK-005_BAI_Development_OS_Knowledge_Operating_System_Ver1.2.md`

TASK-004 includes the completed Lifecycle foundation through Phase 6. TASK-005 is also `COMPLETED` and provides the governed Knowledge Operating System: immutable Knowledge Assets, deterministic resolution, Knowledge Packs, usage/verification/effectiveness, promotion/demotion, freshness/invalidation/impact and Knowledge Governance.

## Roadmap

- `TASK-005`: Knowledge OS — `COMPLETED`
- `TASK-006`: Workspace Registry / Resolver / Automation foundation — next route
- `TASK-007`: Monitoring & Dashboard
- `TASK-008`: External Integration
- `TASK-009`: Security / Supply Chain / Integrity Hardening
- `TASK-010`: Release / Distribution / Consumer Upgrade OS
- `TASK-011`: Multi-Project Conformance & Compatibility Lab
- `TASK-012`: Self-Maintenance / Drift Detection / Safe Auto-Repair
- `TASK-013`: Domain Adapter / Plugin SDK
- `TASK-014`: Adaptive Governance Calibration & Policy Learning

TASK-009〜014 are roadmap reservations only: `PROPOSED / NOT_STARTED / NOT_AUTHORIZED`.

## Governance

Development process depth is selected adaptively with DEV-0 through DEV-4. This controls design/review/test/evidence depth and does not permanently select a model vendor. Foundation-critical work uses the high-assurance safety floor; lightweight peripheral work may use compressed governance.

## Runtime

Node.js >= 20.19.0

```bash
npm test
npm run check:boundaries
npm run test:knowledge
```

## Post-TASK-005 Roadmap Refinement

TASK-005-derived improvements have been allocated into existing TASK-009〜014: crash-consistent Knowledge persistence, Knowledge distribution compatibility, cross-project Knowledge isolation/conformance, repository fsck/recovery/compaction, Domain Knowledge extension points, and evidence-based resolver/confidence/freshness calibration. No TASK-015 is created. These additions remain `PROPOSED / NOT_STARTED / NOT_AUTHORIZED`.
