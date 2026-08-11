# BAI Development OS — AI Context Pack

## Current authority

- Architecture: `BAI Development OS Architecture Ver.2.28 CURRENT_CANONICAL`
- Product root: `/home/baisound/bai-development-os`
- Reference Consumer: `/home/baisound/projects/javascript-roulette`
- TASK-004〜015: `COMPLETED`
- Current Task: `TASK-016 / ACTIVE`; Phase 0 = `COMPLETED`; Phase 1+ = `NOT_AUTHORIZED`
- Current route: `TASK-017 Phase 0 / ACTIVE`; Deployment Readiness = `ACCEPTED`; live PostgreSQL/Docker + production deployment/Product pilot = `PENDING SEPARATE GATES`; advanced TASK-017 remains after TASK-016 resilience evidence
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
- Full OS: `1269 / 1269 PASS` (TASK-017 Live Rehearsal Harness; Deployment Readiness baseline 1267/1267; Local Hub baseline 1255/1255; TASK-016 Phase 0 baseline 1238/1238)
- Consumer: `10 / 10 PASS`
- Distributed Conformance: `10 schemas / 13 shared contracts PASS`
- Roadmap: `56 / 56 PASS`
- Security / Release / Conformance / Maintenance / Extension / Calibration / Product Boundary: PASS
- TASK-016 Phase 0 Knowledge Evolution: `50 / 50 PASS`; Python Product-owned reference compile/Mock Hub smoke: PASS
- TASK-016 Phase 0 Judge: `PHASE0_COMPLETED / NEXT_ROUTE_ELIGIBLE`; TASK-017 Knowledge Hub focused: `31 / 31 PASS`; Deployment Readiness Judge: `DEPLOYMENT_READINESS_ACCEPTED / PHASE0_REMAINS_ACTIVE`; blocking Critic findings: `0`

## Loading guidance

Use summaries first. For distributed behavior, start with `tasks/TASK-015/TASK-015.summary.md`, then load the TASK-015 canonical specification and only the relevant `src/distributed/` module/tests. Part XV is current roadmap scope provenance; Parts XVI〜XXVII record completion history; Part XXVIII records the explicit Post-TASK-015 TASK-016 allocation; Part XXIX records the BAI CREATIVE OS Knowledge Audit adjudication and TASK-017 allocation. Do not load the complete Architecture by default.

For local-only work, do not load or enable DistributedOS unless topology requires it. For exact subsystem authority, load the owning TASK-004〜014 canonical. A distributed envelope, worker advertisement, queue receipt, quorum-like agreement or high confidence score is coordination/evidence only and never replaces Owner/Policy/Security authority.


## TASK-016 completed Phase 0 context

TASK-016 Phase 0 is `COMPLETED`. Read `tasks/TASK-016/TASK-016.summary.md`, `tasks/TASK-016/phase0-consumer-knowledge-capture-bridge-detailed-design.md`, then the RC2 Implementation/Critic/Judge records. Phase 0 froze canonical Consumer Evidence Event/Batch/Receipt/Client Policy v1, the Event Catalog, Privacy/Forbidden Fields, Object Storage Artifact Profile, Product-owned Python reference/scaffold, secure Pattern C intake and immutable Git Repository Snapshot Reference.

BAI VIDEO PRODUCTION is referenced by immutable Git commit/tree and explicit key-file validation coverage `KEY_FILES_ONLY`; no duplicate Product ZIP is required and no raw Product repository is committed. TASK-016 Phase 1+ remains unauthorized. The next route is TASK-017 Phase 0; later TASK-016 resilience work certifies the real Hub/client/outbox/credential path without becoming Hub infrastructure authority.


## TASK-017 active Phase 0 context

TASK-017 Phase 0 is `ACTIVE`. Read `tasks/TASK-017/TASK-017.summary.md`, `tasks/TASK-017/knowledge-evolution-detailed-roadmap.md`, `tasks/TASK-017/phase0-consumer-evidence-hub-pilot-detailed-design.md`, then the Local Hub Implementation/Critic/Judge records.

The accepted Deployment Readiness baseline builds on Local Hub Foundation with one-VPS Docker Compose packaging, private PostgreSQL/API default networking, production-compatible PostgreSQL runtime and immutable migration checksums, server-side hashed API-key credential lifecycle, liveness/readiness separation, explicit-public-profile Caddy TLS template, and safe backup/restore-rehearsal tooling. Public Clients cannot self-assign Trust or backfill provenance. No production key/DB secret is committed.

Hub v1 remains PostgreSQL and one VPS/Docker Compose under a 3,000 JPY/month hard ceiling. Consumer credentials remain externalized through generic CredentialProvider; BAI VIDEO PRODUCT uses Microsoft Password Manager in Product-owned code. Hub failure must never block primary Product function.

Phase 0 remains open for execution of the supplied self-cleaning live Docker/PostgreSQL rehearsal harness, separately authorized production activation and BAI VIDEO PRODUCTION TASK-036 pilot Evidence. The harness never activates the public Caddy profile. Advanced TASK-017 resumes only after relevant TASK-016 resilience evidence. Pattern B remains late; telemetry/frequency never becomes promotion authority.

## RC2 frozen-contract context

Read `tasks/TASK-016/phase0-rc2-product-feedback-adjudication-2026-08-11.md` after the Phase 0 design when provenance is needed. RC2 created no Object-Storage-only Evidence schema: Local Outbox, temporary Object Storage and final Hub share one canonical Batch/Event identity. The Product pilot catalog is limited to `subtitle_import`, `long_running_job_result`, and `subtitle_review_summary`; P3 raw content is rejected.

## TASK-016 Phase 0 RC2 Closure Routing

- TASK-016 Phase 0: `COMPLETED`.
- TASK-016 closure baseline: focused `50 / 50 PASS`; full OS `1238 / 1238 PASS` (historical slice baseline).
- BAI VIDEO PRODUCTION canonical Git source: commit `a098f881b095e3290d2562efe3846d9e2384806a`, tree `59d7dd9a233570e3e3616face417a6925307492b`; validation coverage `KEY_FILES_ONLY`.
- Raw Product repository is not copied into Canonical Knowledge.
- Closure routed to TASK-017 Phase 0; that route is now active. Production endpoint activation remains separately gated.
- TASK-016 Phase 1+ remains unauthorized.
