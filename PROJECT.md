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
- `TASK-009`: Security / Supply Chain / Integrity Hardening — `COMPLETED`
- `TASK-010`: Release / Distribution / Consumer Upgrade OS — `COMPLETED`
- `TASK-011`: Multi-Project Conformance & Compatibility Lab
- `TASK-012`: Self-Maintenance / Drift Detection / Safe Auto-Repair
- `TASK-013`: Domain Adapter / Plugin SDK
- `TASK-014`: Adaptive Governance Calibration & Policy Learning
- `TASK-015`: Distributed Orchestration & Event Fabric

TASK-009 through TASK-011 are `COMPLETED`. TASK-012〜015 remain roadmap reservations; TASK-012 is the next canonical development route and remains `NOT_STARTED / NOT_AUTHORIZED`.

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

Historical TASK-005 refinement note: improvements were allocated into TASK-009〜014 for crash-consistent Knowledge persistence, distribution compatibility, cross-project isolation/conformance, repository repair, Domain Knowledge extension points and calibration. TASK-009 is now COMPLETED; remaining future ownership is consolidated under TASK-010〜014. TASK-015 had not yet been created at that point.

## Post-TASK-006 Roadmap Refinement

TASK-006-derived improvements strengthen TASK-009〜014 with orchestration integrity, automation release compatibility, multi-consumer conformance, Registry/Outbox/runtime self-repair, orchestration plugin points and evidence-based automation calibration. TASK-015 is newly reserved for optional Distributed Orchestration & Event Fabric: durable event delivery, replay/DLQ, worker leases, ordering/idempotency and cross-project Saga compensation. Historical TASK-006 refinement note: those items were future at that point. Current state: TASK-009 through TASK-011 are COMPLETED and TASK-012 is next.


## Post-TASK-007 Roadmap Refinement

Historical TASK-007 refinement note: Monitoring productization was allocated to TASK-009〜015. TASK-009 security work is now COMPLETED; remaining release/conformance/repair/plugin/calibration/distributed work is consolidated under TASK-010〜015 and remains unstarted/unauthorized.


## TASK-008 External Integration Completion

TASK-008 is `COMPLETED`. `IntegrationOS` provides a vendor-neutral external execution boundary with checksummed Connector Manifest/Registry, least-privilege capability resolution, credential references, bound Owner authorization, data/payload constraints, semantic idempotency, bounded retry/AbortSignal timeout/process-local rate control, TASK-004 Cost Guard integration, license-sensitive generation context, normalized noncanonical trust responses, HMAC webhook verification, hash-chained audit and TASK-007 Monitoring emission. External connector success never makes returned data canonical by itself.

Final verification: dedicated Integration `77/77 PASS`, full OS `561/561 PASS`, consumer `10/10 PASS`, Product Boundary PASS, Integration schemas `6/6 PASS`, Architecture Ver.2.12 DOCX `88/88 PASS`, TASK-008 design DOCX `6/6 PASS`. Historical TASK-008 completion route: TASK-009 was next at that point. Current state: TASK-009 through TASK-011 are COMPLETED and TASK-012 is next.

## Post-TASK-008 Roadmap Refinement

TASK-008 remains `COMPLETED`. External Integration productization is allocated to TASK-009〜015: Credential/Vault/security/integrity; connector release/migration compatibility; multi-project/tenant conformance; Integration fsck/reconciliation; Connector/Auth/Transport/Webhook SDK; adaptive retry/rate/timeout/circuit-breaker calibration; and optional distributed idempotency/rate/webhook/job/cost coordination. Historical refinement baseline was Architecture Ver.2.18; current authority is Architecture Ver.2.20. No TASK-016 is created and no future Task is implicitly authorized.

## Consolidated Roadmap Authority

Architecture Ver.2.20 Part XV is the sole current consolidated roadmap scope for TASK-012〜015; TASK-009〜011 are completed and Part XVIII records TASK-010 completion. Historical post-TASK-004/005/006/007/008 roadmap sections remain for provenance but MUST NOT be interpreted independently as current complete scope. The lossless audit preserves all 48 accumulated source sections; TASK-013 remains fundamentally the cross-domain Domain Adapter / Plugin SDK.

## TASK-009 Completion

TASK-009 Security / Supply Chain / Integrity Hardening is completed under `specifications/TASK-009_BAI_Development_OS_Security_Integrity_Ver1.0.md`. SecurityOS is a reusable primitive layer and does not replace subsystem authority. Historical TASK-009 technical baseline: Security 64/64, full OS 625/625, Consumer 10/10, Product Boundary PASS, Roadmap 39/39, Security Conformance 9 schemas PASS. TASK-010 is now completed and TASK-011 is completed; TASK-012 is next.


## Post-TASK-009 Roadmap Refinement

Historical TASK-009 refinement remains preserved. Current authority is Architecture Ver.2.20; TASK-009 through TASK-011 are completed. The older 39-section baseline is historical; current `npm run check:roadmap` baseline is 48 / 48. TASK-012 is next and remains not started/not authorized.


## TASK-010 Completion

TASK-010 Release / Distribution / Consumer Upgrade OS is `COMPLETED` under `specifications/TASK-010_BAI_Development_OS_Release_Distribution_Upgrade_Ver1.0.md`. `ReleaseOS` standardizes signed/versioned releases, trust-anchor lifecycle, compatibility/migration preview, offline distribution, local transactional install/update, Owner-gated downgrade/rollback, portable subsystem bundles, repository release planning, canary gates, diagnostics and attestation. Technical baseline: TASK-010 91/91, full OS 716/716, Consumer 10/10, Product Boundary PASS, Roadmap 39/39, Security Conformance PASS, Release schemas 8/8 PASS. Architecture Ver.2.17 was the TASK-010 completion baseline. TASK-011 is completed; current authority is Ver.2.20 and TASK-012 is next.


## Post-TASK-010 Roadmap Refinement

TASK-010 remains `COMPLETED`. Architecture Ver.2.20 Part XV is the single current roadmap authority and adds five TASK-010-derived sections to TASK-011〜015 without replacing earlier scope. `npm run check:roadmap` must preserve `48 / 48` accumulated source sections. TASK-011 is `COMPLETED`; TASK-012 is `NEXT / NOT_STARTED / NOT_AUTHORIZED`.


## TASK-011 Multi-Project Conformance Completion

TASK-011 is `COMPLETED`. `ConformanceOS` provides machine-verifiable Consumer fixtures, compatibility/isolation/fairness/provider/upgrade/portability probes and C0–C5 certification. The verified local baseline is `C3_MULTI_PROJECT PASS` with two REAL executed Consumers. Windows x64 and macOS arm64 remain SIMULATED/CONDITIONAL and are not claimed as real-tested. Architecture Ver.2.20 is current canonical; TASK-012 is `NEXT / NOT_STARTED / NOT_AUTHORIZED`.

## Post-TASK-011 Roadmap Refinement

TASK-011 remains `COMPLETED`. Ver.2.20 Part XV assigns its follow-ons to TASK-012〜015 and preserves `48 / 48` roadmap sources. TASK-012 remains `NEXT / NOT_STARTED / NOT_AUTHORIZED`.
