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

- `architecture/BAI_Development_OS_Architecture_Ver2.22.md`
- `specifications/TASK-004_BAI_Development_OS_Lifecycle_Foundation_Ver1.6.md`
- `specifications/TASK-005_BAI_Development_OS_Knowledge_Operating_System_Ver1.2.md`
- `specifications/TASK-006_BAI_Development_OS_Orchestration_Automation_Foundation_Ver1.0.md`
- `specifications/TASK-007_BAI_Development_OS_Monitoring_Dashboard_Ver1.0.md`
- `specifications/TASK-008_BAI_Development_OS_External_Integration_Ver1.0.md`
- `specifications/TASK-009_BAI_Development_OS_Security_Integrity_Ver1.0.md`
- `specifications/TASK-010_BAI_Development_OS_Release_Distribution_Upgrade_Ver1.0.md`
- `specifications/TASK-011_BAI_Development_OS_Multi_Project_Conformance_Ver1.0.md`
- `specifications/TASK-012_BAI_Development_OS_Self_Maintenance_Ver1.0.md`

TASK-004 includes the completed Lifecycle foundation through Phase 6. TASK-005 is `COMPLETED` and provides the governed Knowledge Operating System. TASK-006 is `COMPLETED` and provides the Orchestration & Automation Foundation. TASK-007 is `COMPLETED` and provides read-only Monitoring & Dashboard. TASK-008 is `COMPLETED` and provides the vendor-neutral External Integration Gateway: checksummed connector manifests, capability/authorization boundaries, credential references, idempotency, retry/timeout/rate controls, TASK-004 Cost Guard integration, license context, noncanonical trust normalization, inbound webhook verification, audit and TASK-007 Monitoring integration.

## Roadmap

- `TASK-005`: Knowledge OS — `COMPLETED`
- `TASK-006`: Workspace Registry / Resolver / Automation foundation — `COMPLETED`
- `TASK-007`: Monitoring & Dashboard — `COMPLETED`
- `TASK-008`: External Integration — `COMPLETED`
- `TASK-009`: Security / Supply Chain / Integrity Hardening — `COMPLETED`
- `TASK-010`: Release / Distribution / Consumer Upgrade OS — `COMPLETED`
- `TASK-011`: Multi-Project Conformance & Compatibility Lab
- `TASK-012`: Self-Maintenance / Drift Detection / Safe Auto-Repair
- `TASK-013`: Domain Adapter / Plugin SDK
- `TASK-014`: Adaptive Governance Calibration & Policy Learning
- `TASK-015`: Distributed Orchestration & Event Fabric

TASK-009 through TASK-012 are `COMPLETED`. TASK-013〜015 remain roadmap reservations; TASK-013 is the next canonical development route and remains `NOT_STARTED / NOT_AUTHORIZED`.

## Governance

Development process depth is selected adaptively with DEV-0 through DEV-4. This controls design/review/test/evidence depth and does not permanently select a model vendor. Foundation-critical work uses the high-assurance safety floor; lightweight peripheral work may use compressed governance.

## Runtime

Node.js >= 20.19.0

```bash
npm test
npm run check:boundaries
npm run test:knowledge
npm run test:automation
npm run test:monitoring
npm run test:integration
```

## Historical Roadmap / Completion Navigation

TASK-005〜011 completion/refinement history is preserved in Architecture Parts VII〜XXI and task evidence. Do not reconstruct current scope from those historical notes. Architecture Ver.2.22 Part XV is the sole current consolidated roadmap authority (`51 / 51 PASS`); completed subsystem behavior is governed by each TASK-004〜012 canonical design. External publication remains TASK-008 authorized side-effect territory.

## TASK-012 Self-Maintenance Completion

TASK-012 is `COMPLETED`: MaintenanceOS provides read-only fsck, bounded safe repair/recovery and cross-subsystem adapters. Baseline: 75/75 Maintenance, 898/898 OS, 10/10 Consumer. Architecture Ver.2.22 is current; TASK-013 is next and unauthorized.
