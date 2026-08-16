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

- `architecture/BAI_Development_OS_Architecture_Ver2.30.md`
- `specifications/TASK-004_BAI_Development_OS_Lifecycle_Foundation_Ver1.6.md`
- `specifications/TASK-005_BAI_Development_OS_Knowledge_Operating_System_Ver1.2.md`
- `specifications/TASK-006_BAI_Development_OS_Orchestration_Automation_Foundation_Ver1.0.md`
- `specifications/TASK-007_BAI_Development_OS_Monitoring_Dashboard_Ver1.0.md`
- `specifications/TASK-008_BAI_Development_OS_External_Integration_Ver1.0.md`
- `specifications/TASK-009_BAI_Development_OS_Security_Integrity_Ver1.0.md`
- `specifications/TASK-010_BAI_Development_OS_Release_Distribution_Upgrade_Ver1.0.md`
- `specifications/TASK-011_BAI_Development_OS_Multi_Project_Conformance_Ver1.0.md`
- `specifications/TASK-012_BAI_Development_OS_Self_Maintenance_Ver1.0.md`
- `specifications/TASK-013_BAI_Development_OS_Domain_Adapter_Plugin_SDK_Ver1.0.md`
- `specifications/TASK-014_BAI_Development_OS_Adaptive_Governance_Calibration_Policy_Learning_Ver1.0.md`
- `specifications/TASK-015_BAI_Development_OS_Distributed_Orchestration_Event_Fabric_Ver1.0.md`

TASK-004 includes the completed Lifecycle foundation through Phase 6. TASK-005 is `COMPLETED` and provides the governed Knowledge Operating System. TASK-006 is `COMPLETED` and provides the Orchestration & Automation Foundation. TASK-007 is `COMPLETED` and provides read-only Monitoring & Dashboard. TASK-008 is `COMPLETED` and provides the vendor-neutral External Integration Gateway: checksummed connector manifests, capability/authorization boundaries, credential references, idempotency, retry/timeout/rate controls, TASK-004 Cost Guard integration, license context, noncanonical trust normalization, inbound webhook verification, audit and TASK-007 Monitoring integration.

## Roadmap

- `TASK-005`: Knowledge OS — `COMPLETED`
- `TASK-006`: Workspace Registry / Resolver / Automation foundation — `COMPLETED`
- `TASK-007`: Monitoring & Dashboard — `COMPLETED`
- `TASK-008`: External Integration — `COMPLETED`
- `TASK-009`: Security / Supply Chain / Integrity Hardening — `COMPLETED`
- `TASK-010`: Release / Distribution / Consumer Upgrade OS — `COMPLETED`
- `TASK-011`: Multi-Project Conformance & Compatibility Lab — `COMPLETED`
- `TASK-012`: Self-Maintenance / Drift Detection / Safe Auto-Repair — `COMPLETED`
- `TASK-013`: Domain Adapter / Plugin SDK — `COMPLETED`
- `TASK-014`: Adaptive Governance Calibration & Policy Learning — `COMPLETED`
- `TASK-015`: Distributed Orchestration & Event Fabric — `COMPLETED`
- `TASK-016`: Resilience, Recovery & Scalability Certification OS — `ACTIVE / PHASE0_COMPLETED / PHASE1+ NOT_AUTHORIZED`
- `TASK-017`: Knowledge Evolution & Federated Evidence Governance OS — `PAUSED_AT_07AF447 / PRODUCTION_ACTIVATION_BLOCKED`
- `TASK-018`: Codex Autonomous Development Control Plane — `COMPLETED / P0_MAXIMUM / OS_V1_1_0_RELEASE_PUBLISHED`
- `TASK-019`: Consumer Design Intake, Audit and Promotion Governance Foundation — `ACTIVE / P0_MAXIMUM / HIGHEST_ACROSS_ALL_CURRENT_WORK`
- `TASK-020`: Autonomous Worklane / Durable Dispatch — `IMPLEMENTATION_COMPLETE / FULL_REGRESSION_PASS / PUBLICATION_NOT_STARTED`

TASK-009 through TASK-015 and TASK-018 are `COMPLETED`. TASK-016 Phase 0 is completed; Phase 1+ remains unauthorized. TASK-017 is paused at the clean `07af447` checkpoint with its Remaining Deployment Gates patch preserved unapplied. TASK-019 is the current P0/MAXIMUM route and is inserted immediately after TASK-018, before any separate TASK-017 resume decision. Production ACME, persistent public activation and real Product credentials remain separate explicit gates.

TASK-020 refinement: `architecture/BAI_Development_OS_Post_TASK019_Autonomous_Worklane_Roadmap_Refinement_Ver1.0.md`.

The Owner accepted Consumer Design Governance as TASK-019, allocated it highest priority across current work and granted checksum-bound Foundation implementation authority. Architecture Ver.2.30 first promotes the route through its own PR; source implementation begins only from a fresh branch after exact main merge verification.

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
npm run test:extension
npm run check:extension
npm run test:calibration
npm run check:calibration
npm run test:knowledge-evolution
```

## Historical Roadmap / Completion Navigation

TASK-005〜011 completion/refinement history is preserved in Architecture Parts VII〜XXI and task evidence. Do not reconstruct current scope from those historical notes. Architecture Ver.2.30 Part XV is the sole current consolidated roadmap authority (`57 / 57 PASS`); completed subsystem behavior is governed by each TASK-004〜015 canonical design. External publication remains TASK-008 authorized side-effect territory.

## TASK-013 Domain Adapter / Plugin SDK Completion

TASK-013 is `COMPLETED`: ExtensionOS provides the common cross-domain Manifest/Lifecycle/Capability/Pack/Hook/Artifact/Provider/Conformance boundary. Baseline: 161/161 Extension, 1059/1059 OS, 10/10 Consumer. Architecture Ver.2.28 is current; TASK-014 and TASK-015 are completed.

## TASK-014 Adaptive Governance Calibration & Policy Learning Completion

TASK-014 is `COMPLETED`. `CalibrationOS` provides evidence sufficiency, weighted analytics, adaptive-governance diagnostics, bounded cross-subsystem recommendations, immutable safety-floor review, Candidate checksum binding, Counterfactual and Shadow evaluation, dual-authorized activation and a tamper-evident durable calibration ledger. Baseline: 56/56 Calibration, 1115/1115 full OS, 10/10 Consumer. Architecture Ver.2.28 is current; TASK-015 is completed.


## Post-TASK-014 roadmap refinement

Architecture Ver.2.25 adds the TASK-014-derived distributed CalibrationOS requirements to TASK-015: evidence deduplication/provenance, cohort-aware baselines, remote Counterfactual/Shadow evaluation, Candidate epoch/fencing, staged rollout/rollback, divergence detection and Cost Guard/backpressure. No TASK-016 is created. TASK-015 remains unauthorized until explicitly started.


## TASK-015 Distributed Orchestration & Event Fabric Completion

TASK-015 is `COMPLETED`. `DistributedOS` provides the optional event/execution fabric: versioned envelopes, at-least-once delivery, idempotent effects, worker capability/attestation, exact lease/epoch/fencing, retry/DLQ/replay, remote-result quarantine, Saga compensation, distributed telemetry, partition semantics, quota/backpressure, canary/soak/rollback and distributed Calibration evidence. Baseline: 73/73 Distributed, 1188/1188 full OS, 10/10 Consumer. Package version is `1.0.0`. TASK-016 is created only by the later explicit Post-TASK-015 Owner roadmap refinement; TASK-015 completion itself did not imply it.


## Post-TASK-015 Roadmap Refinement

Architecture Ver.2.27 created `TASK-016 — Resilience, Recovery & Scalability Certification OS` as `NEXT / NOT_STARTED / NOT_AUTHORIZED`. Architecture Ver.2.28 preserves TASK-016 as NEXT and adds `TASK-017 — Knowledge Evolution & Federated Evidence Governance OS` as `NOT_STARTED / NOT_AUTHORIZED` after TASK-016 based on BAI CREATIVE OS audit feedback. TASK-017 adds Rejected Pattern, multi-dimensional quality Evidence, cross-project reproducibility, hard reject gates, signed/versioned knowledge rollback and privacy-minimized federated Evidence; no TASK-018 is created.

Architecture Ver.2.29 records the later explicit 2026-08-13 Owner decision creating TASK-018 at P0 and pausing TASK-017 at its safe checkpoint. The earlier “no TASK-018” statement remains historical for Ver.2.28 and is superseded only for current routing.


## TASK-016 Phase 0 Consumer Knowledge Capture Foundation

TASK-016 Phase 0 is `IMPLEMENTED / FULL_SNAPSHOT_VALIDATION_PENDING`. `KnowledgeEvolutionOS` now exposes secure Pattern C snapshot inspection/intake, Consumer Evidence contracts, Product-owned Python reference/scaffolding and a deterministic Mock Hub for contract testing. The implementation preserves Product Runtime Independence and does not deploy a production Hub. A provisional real BAI VIDEO PRODUCTION handoff intake is stored only as sanitized derived Evidence/Candidates; final Phase 0 closure waits for the full Product + matching OS snapshot.
