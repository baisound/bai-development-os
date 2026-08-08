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

- `architecture/BAI_Development_OS_Architecture_Ver2.14.md`
- `specifications/TASK-004_BAI_Development_OS_Lifecycle_Foundation_Ver1.6.md`
- `specifications/TASK-005_BAI_Development_OS_Knowledge_Operating_System_Ver1.2.md`
- `specifications/TASK-006_BAI_Development_OS_Orchestration_Automation_Foundation_Ver1.0.md`
- `specifications/TASK-007_BAI_Development_OS_Monitoring_Dashboard_Ver1.0.md`
- `specifications/TASK-008_BAI_Development_OS_External_Integration_Ver1.0.md`

TASK-004 includes the completed Lifecycle foundation through Phase 6. TASK-005 is `COMPLETED` and provides the governed Knowledge Operating System. TASK-006 is `COMPLETED` and provides the Orchestration & Automation Foundation. TASK-007 is `COMPLETED` and provides read-only Monitoring & Dashboard. TASK-008 is `COMPLETED` and provides the vendor-neutral External Integration Gateway: checksummed connector manifests, capability/authorization boundaries, credential references, idempotency, retry/timeout/rate controls, TASK-004 Cost Guard integration, license context, noncanonical trust normalization, inbound webhook verification, audit and TASK-007 Monitoring integration.

## Roadmap

- `TASK-005`: Knowledge OS — `COMPLETED`
- `TASK-006`: Workspace Registry / Resolver / Automation foundation — `COMPLETED`
- `TASK-007`: Monitoring & Dashboard — `COMPLETED`
- `TASK-008`: External Integration — `COMPLETED`
- `TASK-009`: Security / Supply Chain / Integrity Hardening
- `TASK-010`: Release / Distribution / Consumer Upgrade OS
- `TASK-011`: Multi-Project Conformance & Compatibility Lab
- `TASK-012`: Self-Maintenance / Drift Detection / Safe Auto-Repair
- `TASK-013`: Domain Adapter / Plugin SDK
- `TASK-014`: Adaptive Governance Calibration & Policy Learning
- `TASK-015`: Distributed Orchestration & Event Fabric

TASK-009〜015 are roadmap reservations only: `PROPOSED / NOT_STARTED / NOT_AUTHORIZED`. TASK-009 is the next canonical development route but is not automatically authorized.

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

## Post-TASK-005 Roadmap Refinement

TASK-005-derived improvements have been allocated into existing TASK-009〜014: crash-consistent Knowledge persistence, Knowledge distribution compatibility, cross-project Knowledge isolation/conformance, repository fsck/recovery/compaction, Domain Knowledge extension points, and evidence-based resolver/confidence/freshness calibration. No TASK-015 is created. These additions remain `PROPOSED / NOT_STARTED / NOT_AUTHORIZED`.

## Post-TASK-006 Roadmap Refinement

TASK-006-derived improvements strengthen TASK-009〜014 with orchestration integrity, automation release compatibility, multi-consumer conformance, Registry/Outbox/runtime self-repair, orchestration plugin points and evidence-based automation calibration. TASK-015 is newly reserved for optional Distributed Orchestration & Event Fabric: durable event delivery, replay/DLQ, worker leases, ordering/idempotency and cross-project Saga compensation. All remain `PROPOSED / NOT_STARTED / NOT_AUTHORIZED`; TASK-009 is now the next route.


## Post-TASK-007 Roadmap Refinement

TASK-007-derived productization work is allocated to TASK-009〜015: monitoring integrity/privacy, schema/release compatibility, multi-project isolation/noisy-neighbor conformance, retention/repair/rebuild, collector/renderer/exporter plugins, adaptive thresholds/anomaly/SLO calibration, and distributed telemetry/trace/HA. External alert delivery baseline is implemented by TASK-008; later security/release/conformance/repair/plugin/calibration/distributed hardening remains TASK-009〜015. All future additions remain `PROPOSED / NOT_STARTED / NOT_AUTHORIZED`.


## TASK-008 External Integration Completion

TASK-008 is `COMPLETED`. `IntegrationOS` provides a vendor-neutral external execution boundary with checksummed Connector Manifest/Registry, least-privilege capability resolution, credential references, bound Owner authorization, data/payload constraints, semantic idempotency, bounded retry/AbortSignal timeout/process-local rate control, TASK-004 Cost Guard integration, license-sensitive generation context, normalized noncanonical trust responses, HMAC webhook verification, hash-chained audit and TASK-007 Monitoring emission. External connector success never makes returned data canonical by itself.

Final verification: dedicated Integration `77/77 PASS`, full OS `561/561 PASS`, consumer `10/10 PASS`, Product Boundary PASS, Integration schemas `6/6 PASS`, Architecture Ver.2.12 DOCX `88/88 PASS`, TASK-008 design DOCX `6/6 PASS`. Next route: TASK-009 (`NOT_STARTED / NOT_AUTHORIZED`).

## Post-TASK-008 Roadmap Refinement

TASK-008 remains `COMPLETED`. External Integration productization is allocated to TASK-009〜015: Credential/Vault/security/integrity; connector release/migration compatibility; multi-project/tenant conformance; Integration fsck/reconciliation; Connector/Auth/Transport/Webhook SDK; adaptive retry/rate/timeout/circuit-breaker calibration; and optional distributed idempotency/rate/webhook/job/cost coordination. Architecture Ver.2.14 is `CURRENT_CANONICAL`. No TASK-016 is created and no future Task is implicitly authorized.

## Consolidated Roadmap Authority

Architecture Ver.2.14 Part XV is the sole current complete scope for TASK-009〜015. Historical post-TASK-004/005/006/007/008 roadmap sections remain for provenance but MUST NOT be interpreted independently as current complete scope. The lossless audit preserves all 33 accumulated source sections; TASK-013 remains fundamentally the cross-domain Domain Adapter / Plugin SDK.
