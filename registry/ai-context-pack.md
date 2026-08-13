# BAI Development OS — AI Context Pack

## Current authority

- Architecture: `BAI Development OS Architecture Ver.2.29 CURRENT_CANONICAL`
- Product root: `/home/baisound/bai-development-os`
- Reference Consumer: `/home/baisound/projects/javascript-roulette`
- TASK-004〜015: `COMPLETED`
- Current Task: `TASK-016 / ACTIVE`; Phase 0 = `COMPLETED`; Phase 1+ = `NOT_AUTHORIZED`
- Current route: `TASK-018 / BAI-OS-AUTONOMY-001 / P0 MAXIMUM`; Phases B-G, H1-H2 and I0 passed; Consumer `v0.20.0` release integration passed; I1 exact OS Closure/version/tag/Release decision is next
- Parked route: `TASK-017 Phase 0 / PAUSED_AT_07AF447`; Production Activation remains `BLOCKED`
- Roadmap authority: Architecture Ver.2.29 Part XV + Part XXX, `56 / 56 PASS`

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
- Full OS: `1423 / 1423 PASS` on WSL2 Ubuntu ext4 (TASK-018 through I0)
- Consumer: `10 / 10 PASS`
- Distributed Conformance: `10 schemas / 13 shared contracts PASS`
- Roadmap: `56 / 56 PASS`
- Security / Release / Conformance / Maintenance / Extension / Calibration / Product Boundary: PASS
- TASK-016 Phase 0 Knowledge Evolution: `50 / 50 PASS`; Python Product-owned reference compile/Mock Hub smoke: PASS
- TASK-016 Phase 0 Judge: `PHASE0_COMPLETED / NEXT_ROUTE_ELIGIBLE`; TASK-017 Knowledge Hub focused: `68 / 68 PASS`; Product Integration focused: `52 / 52 PASS`; VPS private/runtime gates: `PASS`; Public TLS Staging implementation: `STATIC_PASS / VPS_EXECUTION_PENDING`; blocking Critic findings: `0`

## Loading guidance

Use summaries first. For distributed behavior, start with `tasks/TASK-015/TASK-015.summary.md`, then load the TASK-015 canonical specification and only the relevant `src/distributed/` module/tests. Part XV is current roadmap scope provenance; Parts XVI〜XXVII record completion history; Part XXVIII records the explicit Post-TASK-015 TASK-016 allocation; Part XXIX records the BAI CREATIVE OS Knowledge Audit adjudication and TASK-017 allocation. Do not load the complete Architecture by default.

For local-only work, do not load or enable DistributedOS unless topology requires it. For exact subsystem authority, load the owning TASK-004〜014 canonical. A distributed envelope, worker advertisement, queue receipt, quorum-like agreement or high confidence score is coordination/evidence only and never replaces Owner/Policy/Security authority.

## TASK-018 P0 mandatory loading order

1. `registry/current-state.md`
2. `registry/ai-context-pack.md`
3. `registry/context-loading-rules.md`
4. `architecture/BAI_Development_OS_Codex_Autonomy_P0_Roadmap_Refinement_Ver1.0.md`
5. `tasks/TASK-018/TASK-018.summary.md`
6. `tasks/TASK-018/phase-a-final-plan-2026-08-13.md`
7. `tasks/TASK-018/owner-implementation-authorization-2026-08-13.md`
8. only the exact source modules/tests for the current bounded Phase

Phases B-G, H1-H2 and I0 are complete. Consumer `v0.20.0` release integration passed at exact main SHA `1fc8bae6ee5bf0c63c1c7d92e21e1eb6dd966c88`. H2 accepted deterministic restart/context precedence, live exact-head CI revalidation, Human Gate parking, bounded recovery and branch rotation. The final Pilot Context is `11,888` estimated tokens (`50.91%` below W2), with provider/cached/output/billed fields `null`. W0/W1 remains partial under exact Consumer Human Gates; overall TASK-036/M3B completion is unclaimed. Next load the H2B Judge, I0 readiness report/index and Closure specification to make the exact I1 OS Closure/version/tag/Release decision.

Balanced Execution: maximum two review/fix cycles per bounded Phase. When required gates pass and unresolved Critical/High findings are `0/0`, continue to the next authorized unit rather than repeating Critic on unchanged artifacts.


## TASK-016 completed Phase 0 context

TASK-016 Phase 0 is `COMPLETED`. Read `tasks/TASK-016/TASK-016.summary.md`, `tasks/TASK-016/phase0-consumer-knowledge-capture-bridge-detailed-design.md`, then the RC2 Implementation/Critic/Judge records. Phase 0 froze canonical Consumer Evidence Event/Batch/Receipt/Client Policy v1, the Event Catalog, Privacy/Forbidden Fields, Object Storage Artifact Profile, Product-owned Python reference/scaffold, secure Pattern C intake and immutable Git Repository Snapshot Reference.

BAI VIDEO PRODUCTION is referenced by immutable Git commit/tree and explicit key-file validation coverage `KEY_FILES_ONLY`; no duplicate Product ZIP is required and no raw Product repository is committed. TASK-016 Phase 1+ remains unauthorized. The next route is TASK-017 Phase 0; later TASK-016 resilience work certifies the real Hub/client/outbox/credential path without becoming Hub infrastructure authority.


## TASK-017 active Phase 0 context

TASK-017 Phase 0 is `ACTIVE`. Read `tasks/TASK-017/TASK-017.summary.md`, `tasks/TASK-017/knowledge-evolution-detailed-roadmap.md`, `tasks/TASK-017/phase0-consumer-evidence-hub-pilot-detailed-design.md`, then the Local Hub / Deployment Readiness / Integration Kit RC implementation, Critic and Judge records.

TASK-017 is now paused at clean checkpoint `07af447` for TASK-018 P0 insertion. Before any TASK-017 resume, read `tasks/TASK-017/phase0-development-pause-and-resume-decision-2026-08-13.md`, then its summary and detailed roadmap. The Remaining Deployment Gates patch is preserved unapplied with SHA-256 `721c9593bf8fa07c59b5b49f6690dd73ceeae33da2fa2b586cc58757b6d2e0dc`; it must be re-evaluated against the future checkout.

The accepted Deployment Readiness baseline builds on Local Hub Foundation with one-VPS Docker Compose packaging, private PostgreSQL/API default networking, production-compatible PostgreSQL runtime and immutable migration checksums, server-side hashed API-key credential lifecycle, liveness/readiness separation, explicit-public-profile Caddy TLS template, and safe backup/restore-rehearsal tooling. Public Clients cannot self-assign Trust or backfill provenance. No production key/DB secret is committed.

Hub v1 remains PostgreSQL and one VPS/Docker Compose under a 3,000 JPY/month hard ceiling. Consumer credentials remain externalized through generic CredentialProvider; BAI VIDEO PRODUCT uses Microsoft Password Manager in Product-owned code. Hub failure must never block primary Product function.

Presigned Object Storage fallback is accepted for Product integration: canonical Batch only, short-lived presign boundary, HTTPS outside loopback tests, redirects rejected, and Object Storage PUT success never ACKs/deletes Outbox Events. The private VPS/runtime gates are complete. The current staging-only Public TLS harness requires exact acknowledgement, forbids Production ACME/firewall mutation/data deletion, verifies certificate/routing/port boundaries and stops Caddy before publishing Evidence. Phase 0 remains open for real staging execution, later Production Certificate/Offsite Backup gates and BAI VIDEO PRODUCTION TASK-036 pilot Evidence. Advanced TASK-017 resumes only after relevant TASK-016 resilience evidence.

## RC2 frozen-contract context

Read `tasks/TASK-016/phase0-rc2-product-feedback-adjudication-2026-08-11.md` after the Phase 0 design when provenance is needed. RC2 created no Object-Storage-only Evidence schema: Local Outbox, temporary Object Storage and final Hub share one canonical Batch/Event identity. The Product pilot catalog is limited to `subtitle_import`, `long_running_job_result`, and `subtitle_review_summary`; P3 raw content is rejected.

## TASK-016 Phase 0 RC2 Closure Routing

- TASK-016 Phase 0: `COMPLETED`.
- TASK-016 closure baseline: focused `50 / 50 PASS`; full OS `1238 / 1238 PASS` (historical slice baseline).
- BAI VIDEO PRODUCTION canonical Git source: commit `a098f881b095e3290d2562efe3846d9e2384806a`, tree `59d7dd9a233570e3e3616face417a6925307492b`; validation coverage `KEY_FILES_ONLY`.
- Raw Product repository is not copied into Canonical Knowledge.
- Closure routed to TASK-017 Phase 0; that route is now active. Production endpoint activation remains separately gated.
- TASK-016 Phase 1+ remains unauthorized.
