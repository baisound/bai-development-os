# BAI Development OS

BAI Development OS is a standalone, reusable foundation for AI-assisted software and creative-technology development.

It is intentionally separated from any one consumer project. The historical `javascript-roulette` repository is now a reference consumer/regression fixture rather than the host of OS core development.

## Core areas

- `src/context-guard/` — Context selection, permit, override, evidence binding, activation safety
- `src/lifecycle/` — Canonical Task lifecycle state and durable transitions
- `src/governance/` — Adaptive development profile selection
- `src/knowledge/` — governed Knowledge Assets, resolver, packs, usage/effectiveness and impact
- `src/monitoring/` — read-only KPI, source provenance, alerts, audit correlation, trends and Dashboard rendering
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

As of 2026-08-08, TASK-004 implements the full Lifecycle Foundation through Phase 6: recovery/checkpoint control, Context Manifest and trust/freshness control, Cost and capability-based Model routing, Closure/Archive/dependency/migration control, and authorized System File synchronization. The current machine canonical references are `architecture/BAI_Development_OS_Architecture_Ver2.11.md`, `specifications/TASK-004_BAI_Development_OS_Lifecycle_Foundation_Ver1.6.md`, and `specifications/TASK-005_BAI_Development_OS_Knowledge_Operating_System_Ver1.2.md`. TASK-004 is completed after final verification; archive remains an independent readiness/commit boundary. Permanent model-selection policy remains separate from Adaptive Development Governance.

Runtime exports include `./lifecycle/recovery`, `./context-control`, `./model-control`, `./closure`, `./archive`, `./dependency`, `./system-sync`, and `./knowledge`.


## Post-TASK-008 roadmap

The canonical roadmap now reserves TASK-009 through TASK-014 for Security/Supply-chain Hardening, Release/Distribution/Upgrade, Multi-project Conformance, Self-Maintenance/Drift Repair, Domain Adapter SDK, and Adaptive Governance Calibration. These are planned extensions only. TASK-005 through TASK-008 are completed; TASK-009 Security / Supply Chain / Integrity Hardening is completed; TASK-010 Release / Distribution / Consumer Upgrade OS is now the next development route.


## TASK-005 Knowledge Operating System Completion

As of 2026-08-08, TASK-005 is completed. Knowledge is no longer an informal note layer: it has governed immutable revisions, deterministic resolution, version-pinned Knowledge Packs, usage/verification evidence, impact analysis, promotion/demotion/freshness Governance and persistent integrity checks. Run `npm run test:knowledge` for the subsystem suite.

## Post-TASK-005 Roadmap Refinement

TASK-005 completion refined TASK-009〜014 with Knowledge-specific hardening and productization work. No new Task number was added. TASK-006 through TASK-008 are completed; TASK-009 is now next. See `architecture/BAI_Development_OS_Post_TASK005_Roadmap_Refinement_Ver1.0.md`.

## Post-TASK-006 Roadmap Refinement

TASK-006 completion refined TASK-009〜014 with orchestration-specific integrity/productization scope and reserves TASK-015 for optional Distributed Orchestration & Event Fabric. TASK-007 and TASK-008 are completed; TASK-009 is COMPLETED; TASK-010 is next. See `architecture/BAI_Development_OS_Post_TASK006_Roadmap_Refinement_Ver1.0.md`.

## TASK-007 Monitoring & Dashboard Completion

As of 2026-08-08, TASK-007 is completed. Monitoring remains read-only derived observability: verified source provenance, Lifecycle/Quality/Automation/Context/Cost/Model/Knowledge/Registry/Integration/Governance/System metrics, deterministic alerts, health, audit correlation, trends, multi-project dashboard and standalone escaped HTML. Run `npm run test:monitoring`. TASK-008 External Integration is now completed.


## Post-TASK-007 Roadmap Refinement

TASK-007 remains completed. Monitoring productization is reserved in TASK-009〜015 for integrity/privacy, schema compatibility, multi-project conformance, retention/repair, plugin extension, adaptive threshold/SLO calibration and distributed telemetry. External alert delivery baseline is implemented in TASK-008. See `architecture/BAI_Development_OS_Post_TASK007_Roadmap_Refinement_Ver1.0.md`.


## TASK-008 External Integration Completion

As of 2026-08-08, TASK-008 is completed. `IntegrationOS` provides vendor-neutral Connector Manifest/Registry, capability policy, credential references, bound external authorization, semantic idempotency, bounded retry/AbortSignal timeout/process-local rate control, TASK-004 Cost Guard integration, license-sensitive generation controls, normalized noncanonical trust responses, HMAC webhook verification, hash-chained audit and TASK-007 Monitoring integration. Run `npm run test:integration`. Historical note: TASK-009 was next at TASK-008 completion; TASK-009 is now COMPLETED and TASK-010 is next.

### Post-TASK-008 roadmap refinement
TASK-008 remains completed. Architecture Ver.2.14 assigns its deferred productization scope to TASK-009〜015; Historical note: TASK-009 was next at that refinement point; TASK-009 is now COMPLETED and TASK-010 is next.

## Consolidated Roadmap Authority

Architecture Ver.2.15 preserves Part XV as the lossless consolidated roadmap lineage; TASK-009 is realized by Part XVI and its Detailed Design Ver.1.0. Historical post-TASK-004/005/006/007/008 roadmap sections remain for provenance but MUST NOT be interpreted independently as current complete scope. The lossless audit preserves all 39 accumulated source sections; TASK-013 remains fundamentally the cross-domain Domain Adapter / Plugin SDK.

## TASK-009 Security / Integrity

As of 2026-08-08, TASK-009 is completed. `SecurityOS` provides shared path/atomic-write, secret/vault lease, signing, crash-consistent journal, signed/tamper-evident ledger, replay, egress/DLP, supply-chain/SBOM, dependency-risk and sandbox primitives. Run `npm run test:security` and `npm run check:security`. TASK-010 is next and remains not started/not authorized.


## Post-TASK-009 Roadmap Refinement

Architecture Ver.2.16 incorporates TASK-009-derived future work into the existing TASK-010〜015 scopes: secure release trust-chain/migration, multi-project SecurityOS conformance, security fsck/recovery, production security-provider plugins, adaptive security-policy calibration and optional distributed security coordination. No TASK-016 is created. TASK-010 remains next and unauthorized.
