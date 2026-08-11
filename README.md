# BAI Development OS

BAI Development OS is a standalone, reusable foundation for AI-assisted software and creative-technology development.

It is intentionally separated from any one consumer project. The historical `javascript-roulette` repository is now a reference consumer/regression fixture rather than the host of OS core development.

## Core areas

- `src/context-guard/` — Context selection, permit, override, evidence binding, activation safety
- `src/lifecycle/` — Canonical Task lifecycle state and durable transitions
- `src/governance/` — Adaptive development profile selection
- `src/knowledge/` — governed Knowledge Assets, resolver, packs, usage/effectiveness and impact
- `src/monitoring/` — read-only KPI, source provenance, alerts, audit correlation, trends and Dashboard rendering
- `src/distributed/` — optional event fabric, durable delivery, worker/lease/fencing, remote execution, Saga, rollout and distributed evidence/telemetry
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
npm run test:distributed
npm run check:distributed
npm run check:boundaries
```

See `MIGRATION.md` for the repository rename and product-extraction procedure.


## TASK-004 Lifecycle Foundation Completion

As of 2026-08-08, TASK-004 implements the full Lifecycle Foundation through Phase 6: recovery/checkpoint control, Context Manifest and trust/freshness control, Cost and capability-based Model routing, Closure/Archive/dependency/migration control, and authorized System File synchronization. The current machine canonical references are `architecture/BAI_Development_OS_Architecture_Ver2.11.md`, `specifications/TASK-004_BAI_Development_OS_Lifecycle_Foundation_Ver1.6.md`, and `specifications/TASK-005_BAI_Development_OS_Knowledge_Operating_System_Ver1.2.md`. TASK-004 is completed after final verification; archive remains an independent readiness/commit boundary. Permanent model-selection policy remains separate from Adaptive Development Governance.

Runtime exports include `./lifecycle/recovery`, `./context-control`, `./model-control`, `./closure`, `./archive`, `./dependency`, `./system-sync`, and `./knowledge`.


## Post-TASK-008 roadmap

The canonical roadmap preserves TASK-009 through TASK-015 as the staged product roadmap. TASK-009 through TASK-015 are completed. A later explicit Post-TASK-015 Owner refinement creates TASK-016 as the next unstarted/unapproved roadmap task.


## TASK-005 Knowledge Operating System Completion

As of 2026-08-08, TASK-005 is completed. Knowledge is no longer an informal note layer: it has governed immutable revisions, deterministic resolution, version-pinned Knowledge Packs, usage/verification evidence, impact analysis, promotion/demotion/freshness Governance and persistent integrity checks. Run `npm run test:knowledge` for the subsystem suite.

## Post-TASK-005 Roadmap Refinement

TASK-005 completion refined TASK-009〜014 with Knowledge-specific hardening and productization work. No new Task number was added. TASK-006 through TASK-008 are completed; TASK-009 is now next. See `architecture/BAI_Development_OS_Post_TASK005_Roadmap_Refinement_Ver1.0.md`.

## Post-TASK-006 Roadmap Refinement

Historical note: TASK-006 completion refined TASK-009〜014 and reserved TASK-015 for optional Distributed Orchestration & Event Fabric. That reservation is now fulfilled: TASK-007 through TASK-015 are completed. See `architecture/BAI_Development_OS_Post_TASK006_Roadmap_Refinement_Ver1.0.md`.

## TASK-007 Monitoring & Dashboard Completion

As of 2026-08-08, TASK-007 is completed. Monitoring remains read-only derived observability: verified source provenance, Lifecycle/Quality/Automation/Context/Cost/Model/Knowledge/Registry/Integration/Governance/System metrics, deterministic alerts, health, audit correlation, trends, multi-project dashboard and standalone escaped HTML. Run `npm run test:monitoring`. TASK-008 External Integration is now completed.


## Post-TASK-007 Roadmap Refinement

TASK-007 remains completed. Monitoring productization is reserved in TASK-009〜015 for integrity/privacy, schema compatibility, multi-project conformance, retention/repair, plugin extension, adaptive threshold/SLO calibration and distributed telemetry. External alert delivery baseline is implemented in TASK-008. See `architecture/BAI_Development_OS_Post_TASK007_Roadmap_Refinement_Ver1.0.md`.


## TASK-008 External Integration Completion

As of 2026-08-08, TASK-008 is completed. `IntegrationOS` provides vendor-neutral Connector Manifest/Registry, capability policy, credential references, bound external authorization, semantic idempotency, bounded retry/AbortSignal timeout/process-local rate control, TASK-004 Cost Guard integration, license-sensitive generation controls, normalized noncanonical trust responses, HMAC webhook verification, hash-chained audit and TASK-007 Monitoring integration. Run `npm run test:integration`. Historical note: TASK-009 was next at TASK-008 completion; TASK-009 through TASK-013 are now COMPLETED; TASK-014 is next.

### Post-TASK-008 roadmap refinement
TASK-008 remains completed. Architecture Ver.2.14 assigns its deferred productization scope to TASK-009〜015; Historical note: TASK-009 was next at that refinement point; TASK-009 through TASK-013 are now COMPLETED; TASK-014 is next.

## Consolidated Roadmap Authority

Architecture Ver.2.26 Part XV is the single lossless consolidated roadmap authority. Completed TASK-009〜015 behavior is governed by each subsystem canonical/completion Part; historical roadmap sections remain provenance only. The lossless checker preserves all 54 accumulated source sections.

## TASK-009 Security / Integrity

As of 2026-08-08, TASK-009 is completed. `SecurityOS` provides shared path/atomic-write, secret/vault lease, signing, crash-consistent journal, signed/tamper-evident ledger, replay, egress/DLP, supply-chain/SBOM, dependency-risk and sandbox primitives. Run `npm run test:security` and `npm run check:security`. TASK-010 through TASK-013 are completed; TASK-014 is next.


## Post-TASK-009 Roadmap Refinement

Historical TASK-009 refinement is preserved. Current authority is Architecture Ver.2.23. TASK-010〜013 are completed; TASK-014 is next and unauthorized. No TASK-016 is created.


## TASK-010 Release / Distribution Completion

`ReleaseOS` is now the canonical release/distribution/consumer-upgrade foundation. It provides strict SemVer, signed manifests/bundles, trust-anchor lifecycle, compatibility and migration preview, offline acquisition, transactional install/update, Owner-gated downgrade/rollback, portable subsystem bundles, canary gates, diagnostics and installation attestation. Validation: TASK-010 91/91, full OS 716/716, Consumer 10/10, Release schemas 8/8. Architecture Ver.2.18 was the post-TASK-010 roadmap baseline; TASK-010 Ver.1.0 remains its subsystem canonical. Current architecture authority is Ver.2.23; TASK-011〜013 are completed; TASK-014 is next.


## Post-TASK-010 Roadmap Refinement

Historical post-TASK-010 refinement is preserved in Architecture lineage. Architecture Ver.2.23 Part XV remains the current lossless roadmap authority with `51 / 51` source sections. TASK-011〜013 are completed; TASK-014 is next and unauthorized.


## TASK-011 Multi-Project Conformance Completion

TASK-011 is `COMPLETED`. `ConformanceOS` provides machine-verifiable Consumer fixtures, compatibility/isolation/fairness/provider/upgrade/portability probes and C0–C5 certification. The verified local baseline is `C3_MULTI_PROJECT PASS` with two REAL executed Consumers. Windows x64 and macOS arm64 remain SIMULATED/CONDITIONAL and are not claimed as real-tested. Architecture Ver.2.23 is current canonical; TASK-012 and TASK-013 are `COMPLETED`; TASK-014 is `NEXT / NOT_STARTED / NOT_AUTHORIZED`.

## Post-TASK-011 Roadmap Refinement

Historical state at the post-TASK-011 refinement point: Architecture Ver.2.23 Part XV incorporated four TASK-011-derived future sections for TASK-012〜015 and preserved `51 / 51` sources. Those routes have since been completed through TASK-015; current authority is Architecture Ver.2.28 with `56 / 56 PASS`.


## TASK-012 Self-Maintenance Completion

TASK-012 is `COMPLETED`. `MaintenanceOS` provides read-only fsck, immutable/checksummed findings, bounded repair planning, durable single-use repair execution, `owner_authorization_ref`, immediate auto-repair revalidation, checkpoint/rollback/quarantine, drift/retention and subsystem adapters. It never manufactures Canonical/Trust authority or promotes SIMULATED/DECLARED Conformance evidence. Run `npm run test:maintenance` and `npm run check:maintenance`. Architecture Ver.2.23 is current; TASK-013 is completed and TASK-014 is next and unauthorized.


## TASK-013 ExtensionOS Completion

TASK-013 is `COMPLETED`. `ExtensionOS` supplies the single cross-domain Adapter/Plugin SDK with checksummed Manifest/Provider provenance, compatibility/dependency lifecycle, Capability Broker, trust/sandbox/authorization/resource boundaries, Domain Policy/Test/Evidence Packs, artifact gates, subsystem hooks, durable Registry, Extension Conformance and eight reference domains. Verification: Extension 161/161, OS 1059/1059, Consumer 10/10. Current Architecture: Ver.2.23. TASK-014 is next but not started/authorized.


## Post-TASK-014 Roadmap Refinement

Architecture Ver.2.28 preserves 56/56 roadmap source sections and extends TASK-015 with optional distributed CalibrationOS coordination: provenance-preserving Evidence transport/deduplication, cohort-aware baselines, remote Counterfactual/Shadow evaluation, exact Candidate version/epoch propagation, fenced canary rollout, regression-driven governed rollback, policy-divergence detection and calibration quota/backpressure. TASK-014 remains completed. The later Post-TASK-015 refinement creates TASK-016; this historical Post-TASK-014 note did not.


## TASK-015 Distributed Orchestration & Event Fabric Completion

TASK-015 is `COMPLETED`. `DistributedOS` is the optional distributed coordination layer. It does not make remote execution mandatory and does not create new authority. Package baseline: `1.0.0`; Distributed tests `73/73`; full OS `1188/1188`; Consumer `10/10`. TASK-015 completion did not itself create TASK-016; the later explicit Post-TASK-015 Owner refinement does.


## Post-TASK-015 Roadmap Refinement

`TASK-016 — Resilience, Recovery & Scalability Certification OS` remains `NEXT / NOT_STARTED / NOT_AUTHORIZED`. BAI CREATIVE OS audit feedback is adjudicated in Architecture Ver.2.28 and creates `TASK-017 — Knowledge Evolution & Federated Evidence Governance OS` after TASK-016, also `NOT_STARTED / NOT_AUTHORIZED`. TASK-017 focuses on Rejected Pattern memory, decomposable quality Evidence, reproducibility, hard reject gates, signed/versioned knowledge rollback and privacy-minimized federated Evidence. No TASK-018 is created.


## TASK-016 Phase 0 — Consumer Knowledge Capture Foundation

TASK-016 Phase 0 is Owner-authorized and implemented, with final full BAI VIDEO PRODUCT/PRODUCTION + matching OS snapshot validation pending. `KnowledgeEvolutionOS` provides secure Pattern C snapshot inspection/intake, source-neutral Consumer Evidence contracts, Product-owned Python Evidence scaffolding and a deterministic Mock Hub/OpenAPI contract. No production Hub is deployed and TASK-016 Phase 1+ / TASK-017 remain separately authorization-gated.
