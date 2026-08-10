# BAI Development OS — AI Context Pack

## Current authority

- Architecture: `BAI Development OS Architecture Ver.2.28 CURRENT_CANONICAL`
- Product root: `/home/baisound/bai-development-os`
- Reference Consumer: `/home/baisound/projects/javascript-roulette`
- TASK-004〜015: `COMPLETED`
- Current Task: `TASK-016 / ACTIVE`; Phase 0 RC2 = `DESIGN AUTHORIZED / IMPLEMENTATION IN PROGRESS`; Phase 1+ = `NOT_AUTHORIZED`
- Interleaved planned route: `TASK-017 Phase 0 Pilot Transport` after TASK-016 Phase 0; advanced TASK-017 after TASK-016 resilience evidence
- Roadmap authority: Architecture Ver.2.28 Part XV, `56 / 56 PASS`

## Current subsystem map

- TASK-004 `LifecycleOS`: lifecycle, guards, context, cost/model, recovery, closure/system sync.
- TASK-005 `KnowledgeOS`: governed knowledge assets/resolution/packs/effectiveness.
- TASK-006 `AutomationOS`: registry/runtime/startup/instruction/automation/outbox.
- TASK-007 `MonitoringOS`: verified derived metrics/alerts/trends/dashboard.
- TASK-008 `IntegrationOS`: governed external capability/credential/side-effect boundary.
- TASK-009 `SecurityOS`: trusted path, secrets, signing, journal, ledger, replay, network/DLP/supply-chain/sandbox primitives.
- TASK-010 `ReleaseOS`: signed release/version/compatibility/migration/install/update/rollback.
- TASK-011 `ConformanceOS`: multi-project compatibility/isolation/fairness/provider/portability/certification.
- TASK-012 `MaintenanceOS`: read-only fsck, drift, safe repair, durable execution, rollback/quarantine/retention.
- TASK-013 `ExtensionOS`: common Domain Adapter / Plugin SDK.
- TASK-014 `CalibrationOS`: evidence-driven policy recommendations, safety review, Counterfactual/Shadow evaluation and dual-authorized activation.
- TASK-015 `DistributedOS`: optional distributed event/execution coordination with durable at-least-once semantics, idempotent effects, worker/fencing, remote result quarantine, Saga/rollout recovery and distributed evidence/metrics.

## TASK-015 realized contract

DistributedOS never replaces existing authority. Transport carries already-authorized work. Delivery is at-least-once; exactly-once is an effect property achieved through semantic consumer idempotency. REAL remote Evidence requires an attested Worker. Lease epoch/fencing prevents stale execution; late results are quarantined after policy/trust/checksum/epoch/deadline changes. Sensitive partition promotion fails closed. Distributed mode defaults disabled so local Consumers do not pay coordination cost.

## Evidence baseline

- TASK-015: `73 / 73 PASS`
- Full OS: `1218 / 1218 PASS` (prior pre-Phase-0 baseline 1188/1188)
- Consumer: `10 / 10 PASS`
- Distributed Conformance: `10 schemas / 13 shared contracts PASS`
- Roadmap: `56 / 56 PASS`
- Security / Release / Conformance / Maintenance / Extension / Calibration / Product Boundary: PASS
- TASK-016 Phase 0 Knowledge Evolution: `30 / 30 PASS`; Python Product-owned reference compile/Mock Hub smoke: PASS
- Blocking Critic findings: `0` for implementation; Phase 0 closure gate remains full Product+OS snapshot

## Loading guidance

Use summaries first. For distributed behavior, start with `tasks/TASK-015/TASK-015.summary.md`, then load the TASK-015 canonical specification and only the relevant `src/distributed/` module/tests. Part XV is current roadmap scope provenance; Parts XVI〜XXVII record completion history; Part XXVIII records the explicit Post-TASK-015 TASK-016 allocation; Part XXIX records the BAI CREATIVE OS Knowledge Audit adjudication and TASK-017 allocation. Do not load the complete Architecture by default.

For local-only work, do not load or enable DistributedOS unless topology requires it. For exact subsystem authority, load the owning TASK-004〜014 canonical. A distributed envelope, worker advertisement, queue receipt, quorum-like agreement or high confidence score is coordination/evidence only and never replaces Owner/Policy/Security authority.


## TASK-016 active Phase 0 context

TASK-016 Phase 0 is Owner-authorized and implemented; full Product+OS snapshot validation is pending. Read `tasks/TASK-016/TASK-016.summary.md`, `tasks/TASK-016/phase0-owner-authorization-2026-08-11.md` and `tasks/TASK-016/phase0-consumer-knowledge-capture-bridge-detailed-design.md` first. Implemented surfaces include secure Pattern C intake, standalone Consumer Product contracts, Product-owned Python Evidence reference/scaffold, external CredentialProvider, Public Ingestion OpenAPI/Privacy/Trust contracts and deterministic Mock Hub. It does not deploy the production Hub.

After Phase 0 closure, planning routes to TASK-017 Phase 0 Pilot Transport before returning to TASK-016 Phase 1+. TASK-016 then certifies the real Hub/client/outbox/credential path under deterministic failure, recovery, mixed-version, load/cost and DR scenarios without becoming Hub infrastructure authority.


## TASK-017 planning context

TASK-017 Phase 0 is now a bounded Owner-reprioritized Pilot Transport Slice after TASK-016 Phase 0. Read `tasks/TASK-017/TASK-017.summary.md`, `tasks/TASK-017/knowledge-evolution-detailed-roadmap.md`, then `tasks/TASK-017/phase0-consumer-evidence-hub-pilot-detailed-design.md`.

Hub v1 uses PostgreSQL and one VPS/Docker Compose under a 3,000 JPY/month hard ceiling. Client/source is assumed open/inspectable; no embedded shared secret is allowed. Consumer credentials are externalized through a generic CredentialProvider; BAI VIDEO PRODUCT uses Microsoft Password Manager as its Product-specific provider. Generated Evidence Client code becomes Product-owned and requires no BAI Development OS runtime package. Hub/credential failure must never block primary Product function.

Advanced TASK-017 work resumes after TASK-016 resilience evidence. Pattern B direct local ingestion remains late. Score/frequency/runtime telemetry/AI inference never becomes promotion authority.

## RC2 context

Read `tasks/TASK-016/phase0-rc2-product-feedback-adjudication-2026-08-11.md` after the Phase 0 design. RC2 must not create an Object-Storage-only Evidence schema: Local Outbox, temporary Object Storage and final Hub share one canonical Batch/Event identity.
