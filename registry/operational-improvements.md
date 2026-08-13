# Operational Improvements Registry

## Purpose

This registry records improvements discovered through real operation. These items are not automatically authorized for implementation.

| ID | Improvement | Decision / Status | Planned integration |
|---|---|---|---|
| OP-001 | Canonical Document Reading Rules | Adopted in Artifact Specification | Architecture / Artifact governance update |
| OP-002 | Critic Review Mode | Adopt for Ver.1.2+ | Review Framework Specification |
| OP-003 | `builder-response-<review-mode>.md` naming | Adopt for Ver.1.2+ | Workflow, templates, vocabulary |
| OP-004 | TASK Completion Review | Adopt after TASK-004 Phase 1 | Closure workflow |
| OP-005 | Role Session Lifecycle | Highest priority | Context / Resume contract and later automation |
| OP-006 | Execution Timeout and Empty Command Detection | Highest priority | Session lifecycle and stall recovery |
| OP-007 | Context Economy | P0 | Summary-first, section loading, artifact cache |
| OP-008 | Cost Guard | P0 | Per-Task / per-Role budget, hard stop |
| OP-009 | AI Canonical Markdown | P0 | Markdown canonical copy plus DOCX human copy |
| OP-010 | Execution Model separation | Planned | Separate Role, Agent, Session, and execution topology |
| OP-011 | Capability-based Agent selection | Planned | Agent routing |
| OP-012 | Fix / Retest cycle-specific naming | Planned | Preserve repeated-cycle historical evidence |

## Mandatory Sustainability Principles

1. Context is a finite resource.
2. Tokens and API usage are budgeted resources.
3. A Role reads only the minimum necessary artifacts and sections.
4. Full Architecture and DOCX are not default inputs.
5. Session state must be disposable and recoverable from artifacts.
6. Budget exhaustion, timeout, empty commands, and repeated failed attempts trigger Safe Stop.
7. Cost reduction must not weaken authority, evidence, testing, or historical integrity.

## Product Extraction Addendum — 2026-08-08

| ID | Improvement | Decision / Status | Planned integration |
|---|---|---|---|
| OP-013 | Repository / Product Boundary Correction | Implemented in extraction working tree | Standalone `bai-development-os`; consumer adapters |
| OP-014 | Adaptive Development Governance | Core foundation implemented; verification required | DEV-0 through DEV-4 workflow-depth selector |
| OP-015 | Impact-scoped Revalidation | Adopted with Adaptive Governance | Avoid full workflow restart for localized fixes |

### Adaptive Governance Principle

Development assurance depth is proportional to system scale, feature scale, criticality, failure impact, reversibility, novelty, and high-risk boundaries. Cost reduction is achieved by removing unnecessary governance work, not by weakening tests for critical functions. The selector does not modify permanent model-routing policy.


## Post-TASK-004 Product Expansion Addendum — 2026-08-08

| ID | Improvement | Decision / Status | Planned integration |
|---|---|---|---|
| OP-016 | Shared Security / Path / Supply-chain Hardening | Roadmap reserved | TASK-009 |
| OP-017 | Reproducible Release / Distribution / Consumer Upgrade | Roadmap reserved | TASK-010 |
| OP-018 | Multi-project Consumer Conformance Lab | Roadmap reserved | TASK-011 |
| OP-019 | Canonical Drift Detection / Safe Auto-Repair | Roadmap reserved | TASK-012 |
| OP-020 | Domain Adapter / Plugin SDK | Roadmap reserved | TASK-013 |
| OP-021 | Adaptive Governance Calibration from operational Evidence | Roadmap reserved | TASK-014 |

These entries expand the product after TASK-008 and do not reopen TASK-004. All are `PROPOSED / NOT_STARTED / NOT_AUTHORIZED`.


## Post-TASK-005 Knowledge Expansion Addendum — 2026-08-08

| ID | Improvement | Decision / Status | Planned integration |
|---|---|---|---|
| OP-022 | Crash-consistent Knowledge mutation / journal fencing | Roadmap reserved | TASK-009 |
| OP-023 | Knowledge Pack release portability and schema/taxonomy migration | Roadmap reserved | TASK-010 |
| OP-024 | Cross-project Knowledge portability / isolation conformance | Roadmap reserved | TASK-011 |
| OP-025 | Knowledge repository fsck / recovery / compaction | Roadmap reserved | TASK-012 |
| OP-026 | Domain Knowledge extension points | Roadmap reserved | TASK-013 |
| OP-027 | Resolver / confidence / freshness evidence calibration | Roadmap reserved | TASK-014 |

No TASK-015 is created; these improvements extend existing reserved responsibility boundaries.


## Post-TASK-006 Orchestration Expansion Addendum — 2026-08-08

| ID | Improvement | Decision / Status | Planned integration |
|---|---|---|---|
| OP-028 | Crash-consistent derived sync / Registry / Outbox mutation and approval/event integrity | Roadmap reserved | TASK-009 |
| OP-029 | Versioned automation/startup/approval/outbox compatibility and migration | Roadmap reserved | TASK-010 |
| OP-030 | Concurrent multi-consumer orchestration and isolation conformance | Roadmap reserved | TASK-011 |
| OP-031 | Registry/Outbox/Runtime Evidence fsck, replay, dead-letter and safe repair | Roadmap reserved | TASK-012 |
| OP-032 | Runtime Probe / Resolver / Compiler / Classifier / Executor / Sync extension SDK | Roadmap reserved | TASK-013 |
| OP-033 | Owner-gate / automation / retry / prompt / probe effectiveness calibration | Roadmap reserved | TASK-014 |
| OP-034 | Distributed Orchestration & Event Fabric | New roadmap reservation | TASK-015 |

TASK-015 is intentionally optional; simple single-machine projects continue using TASK-006 local orchestration. All items remain `PROPOSED / NOT_STARTED / NOT_AUTHORIZED`.


## Post-TASK-007 Monitoring Completion Addendum — 2026-08-08

| ID | Improvement | Decision / Status | Planned integration |
|---|---|---|---|
| OP-035 | Verified source freshness/provenance must be visible in dashboards | Implemented | TASK-007 |
| OP-036 | Monitoring Event crash-journal / tail repair | Roadmap reserved | TASK-009 / TASK-012 |
| OP-037 | External alert delivery adapters | Baseline implemented | TASK-008 |
| OP-038 | Monitoring threshold evidence calibration | Roadmap reserved | TASK-014 |
| OP-039 | Distributed telemetry/event observation | Roadmap reserved | TASK-015 |

TASK-007 remains read-only and completed; future notification/repair/calibration/distributed work does not reopen it.


## Post-TASK-007 Monitoring Roadmap Refinement — 2026-08-08

| ID | Improvement | Decision / Status | Planned integration |
|---|---|---|---|
| OP-040 | Monitoring ledger WAL/journal, signing, privacy/redaction and replay/tamper hardening | Roadmap reserved | TASK-009 |
| OP-041 | Monitoring schema migration, historical compatibility and offline diagnostic bundle lifecycle | Roadmap reserved | TASK-010 |
| OP-042 | Multi-project monitoring isolation, cardinality and noisy-neighbor conformance | Roadmap reserved | TASK-011 |
| OP-043 | Monitoring retention, compaction, rollup, repair, rebuild, backup/restore and fsck | Roadmap reserved | TASK-012 |
| OP-044 | Collector / metric / alert / renderer / exporter Monitoring Plugin SDK | Roadmap reserved | TASK-013 |
| OP-045 | Adaptive thresholds, anomaly/baseline, SLI/SLO and alert-fatigue calibration | Roadmap reserved | TASK-014 |
| OP-046 | Distributed telemetry, trace propagation, clock-skew/order, backpressure and HA collectors | Roadmap reserved | TASK-015 |

External alert delivery itself remains TASK-008. TASK-007 stays read-only and `COMPLETED`; OP-040〜046 are `PROPOSED / NOT_STARTED / NOT_AUTHORIZED` future responsibilities.


## TASK-008 External Integration Completion Addendum — 2026-08-08

| ID | Improvement | Decision / Status | Planned integration |
|---|---|---|---|
| OP-047 | Bound authorization for external side effects | Implemented | TASK-008 |
| OP-048 | Credential-reference-only runtime secret boundary | Implemented | TASK-008 |
| OP-049 | Semantic idempotency conflict detection | Implemented | TASK-008 |
| OP-050 | License-sensitive generation terms provenance | Implemented | TASK-008 |
| OP-051 | Abort-aware connector timeout and timer cleanup | Implemented | TASK-008 |
| OP-052 | External connector Cost Guard reservation/actual/release | Implemented | TASK-008 |

Crash-consistent audit persistence, security/privacy hardening, multi-project connector conformance, self-repair, connector Plugin SDK, adaptive policy calibration and distributed connector/rate/event coordination remain post-TASK-008 responsibilities of TASK-009〜015.

## TASK-008 Post-Completion Roadmap Refinement — 2026-08-08

| ID | Improvement | State | Owner Task |
|---|---|---|---|
| OP-053 | Credential/Vault lifecycle, signing, webhook replay and connector sandbox/egress/DLP hardening | Roadmap reserved | TASK-009 |
| OP-054 | Connector SemVer, compatibility matrix, contract tests, canary/rollback and provider/API migration | Roadmap reserved | TASK-010 |
| OP-055 | Multi-project/tenant connector isolation, quota fairness, real-provider conformance and webhook ownership | Roadmap reserved | TASK-011 |
| OP-056 | Integration fsck, audit/idempotency/Cost reconciliation, dead-letter/replay and deterministic rebuild | Roadmap reserved | TASK-012 |
| OP-057 | Connector/Auth/Transport/Webhook Plugin SDK and capability-negotiation/conformance kit | Roadmap reserved | TASK-013 |
| OP-058 | Retry/rate/timeout/circuit-breaker/provider-health and authorization-friction calibration | Roadmap reserved | TASK-014 |
| OP-059 | Distributed idempotency/rate/webhook/job/cancellation/Cost coordination | Roadmap reserved | TASK-015 |

TASK-008 remains `COMPLETED`. OP-053〜059 are `PROPOSED / NOT_STARTED / NOT_AUTHORIZED` future responsibilities. No TASK-016 is created.

## Roadmap scope consolidation — 2026-08-08

Problem: future TASK scope accumulated across multiple appendices, making partial retrieval semantically lossy even though source text was retained. Resolution: Architecture Ver.2.14 Part XV becomes the single current consolidated scope for TASK-009〜015, backed by a 33-section lossless merge audit. Future roadmap refinements must update consolidated scope and provenance together.

## TASK-009 completion — 2026-08-08

Shared SecurityOS primitives now replace duplicated security/path/integrity mechanisms where practical. Crash-consistent Knowledge mutation, signed Owner Approval/Outbox option, durable webhook replay, egress/DLP, supply-chain/SBOM and shared security conformance are implemented. Remaining real-provider KMS/HSM/Vault/container sandbox productization belongs TASK-013; automatic repair TASK-012; distributed coordination TASK-015.


## Post-TASK-009 Security Productization Allocation

TASK-009 implementation exposed production-layer follow-ons that are now reserved in existing roadmap owners: release trust chain/security migration (TASK-010), multi-project security isolation/conformance (TASK-011), SecurityOS fsck/recovery (TASK-012), Vault/KMS/HSM/sandbox/provider plugins (TASK-013), evidence-based security calibration (TASK-014), and optional distributed security coordination (TASK-015). No TASK-016 is created.


## TASK-010 Completion Residuals

- TASK-011: prove ReleaseOS behavior across multiple consumers, platforms and provider/version combinations.
- TASK-012: detect and safely reclaim stale local release-operation locks after crashes; fsck/reconcile release state.
- TASK-013: add platform/package-manager/repository-release provider plugins without changing ReleaseOS core contracts.
- TASK-014: calibrate canary, rollback, compatibility and acquisition policies from evidence while preserving fixed safety floors.
- TASK-015: coordinate release locks, trust/key state, cost and rollout across multiple workers/machines when distributed topology requires it.
- Actual GitHub publication remains an explicit authorized TASK-008 external side effect.


## Post-TASK-010 Release Productization Allocation

| ID | Improvement | State | Owner Task |
|---|---|---|---|
| OP-060 | Cross-platform/filesystem/package-source ReleaseOS conformance and multi-version upgrade-chain certification | Roadmap reserved | TASK-011 |
| OP-061 | Stale release-lock reclaim, interrupted release reconciliation, release fsck, attestation/trust/cache/checkpoint maintenance | Roadmap reserved | TASK-012 |
| OP-062 | Platform Installer / Package Manager / Artifact Repository / Distribution Source / Migration Provider SDK | Roadmap reserved | TASK-013 |
| OP-063 | Evidence-based canary cohort, soak, health-gate, rollback-trigger and acquisition-source calibration | Roadmap reserved | TASK-014 |
| OP-064 | Optional distributed release lease, staged cohort rollout, trust/key propagation, partial rollout recovery and global rollback coordination | Roadmap reserved | TASK-015 |

TASK-010 remains `COMPLETED`. OP-060〜064 are `PROPOSED / NOT_STARTED / NOT_AUTHORIZED`. Actual external publication remains a TASK-008 authorized side effect. No TASK-016 is created.


## TASK-011 ConformanceOS Completion Allocation

- OP-018, OP-024, OP-030, OP-042, OP-055 and OP-060 Conformance responsibilities are realized in the TASK-011 ConformanceOS baseline to the extent represented by current executable/local evidence.
- Real Windows/macOS/provider executions remain future certification evidence and are not mislabeled as completed executions.
- Self-repair of Conformance artifacts belongs TASK-012; plugin/provider extension belongs TASK-013; adaptive coverage/certification calibration belongs TASK-014; distributed remote-worker Conformance belongs TASK-015.

TASK-011 is `COMPLETED`. TASK-012 is `NEXT / NOT_STARTED / NOT_AUTHORIZED`.

## Post-TASK-011 Roadmap Refinement

TASK-011 remains `COMPLETED`. Architecture Ver.2.20 Part XV directly incorporates four TASK-011-derived future sections: Conformance evidence/certification self-maintenance in TASK-012; Runner/Probe/Sandbox/Fixture/Provider SDKs in TASK-013; evidence/coverage/certification calibration in TASK-014; and optional remote/distributed Conformance execution in TASK-015. Roadmap preservation is `51 / 51 PASS`. TASK-012 remains `NEXT / NOT_STARTED / NOT_AUTHORIZED`; TASK-013〜015 remain future and unauthorized.


## TASK-012 MaintenanceOS Completion Allocation

TASK-012 is `COMPLETED`. The common MaintenanceOS baseline realizes the shared fsck/drift/repair framework underlying OP-019/025/031/043/056/061 and related Security/Conformance maintenance responsibilities. Domain/provider-specific rebuilders and atomic reconciliation contracts remain TASK-013; adaptive cadence/freshness/retention calibration remains TASK-014; distributed repair/fencing remains TASK-015. TASK-013 is `NEXT / NOT_STARTED / NOT_AUTHORIZED`.


## Post-TASK-012 Maintenance Productization Allocation

TASK-012 follow-ons are reserved in existing owners: maintenance/reconciliation provider SDKs (TASK-013), evidence-based maintenance calibration (TASK-014), and optional distributed repair/fencing/recovery (TASK-015). Opaque external effects remain fail-closed until a specialized reconciler proves state.


## TASK-013 ExtensionOS Completion Allocation

TASK-013 is `COMPLETED`. The common ExtensionOS baseline realizes the general Domain Adapter / Plugin SDK and the plugin/provider extension responsibilities accumulated from Knowledge, Automation, Monitoring, Integration, Security, Release, Conformance and Maintenance. Executable provider provenance, sandbox/trust boundaries, dependency safety, durable Registry and Conformance are implemented. Domain/vendor-specific provider packages can now be added without modifying Core. Adaptive provider/policy calibration belongs TASK-014; optional distributed/remote extension coordination belongs TASK-015.

## TASK-014 CalibrationOS Completion Allocation — 2026-08-08

TASK-014 is `COMPLETED`. Evidence-based calibration responsibilities accumulated from Governance, Knowledge, Automation, Monitoring, Integration, Security, Release, Conformance, Maintenance and Extension are implemented as one bounded CalibrationOS rather than separate self-tuning engines. Recommendations remain advisory, mandatory safety floors remain immutable, and activation requires exact Candidate binding, PASS Counterfactual + Shadow evaluation, Owner authorization and Policy authorization.

## Post-TASK-013 / TASK-014 Productization Allocation — 2026-08-08

| ID | Improvement | State | Owner Task |
|---|---|---|---|
| OP-065 | Extension provider timeout/concurrency/resource/health calibration from REAL/SANDBOX evidence | Implemented | TASK-014 |
| OP-066 | Cross-subsystem evidence sufficiency, robust anomaly and SLI/SLO calibration analytics | Implemented | TASK-014 |
| OP-067 | Over-governance advisory, under-assurance blocking, oscillation detection and risk-reduction/cost ranking | Implemented | TASK-014 |
| OP-068 | Immutable safety-floor evaluation plus Candidate checksum binding | Implemented | TASK-014 |
| OP-069 | Counterfactual + Shadow proof and dual-authorized policy activation | Implemented | TASK-014 |
| OP-070 | Distributed Calibration Evidence transport, worker identity/fencing, late-result quarantine and replicated extension coordination | Roadmap reserved | TASK-015 |

TASK-015 remains `NEXT / NOT_STARTED / NOT_AUTHORIZED`. Single-machine operation remains first-class; distributed topology is optional rather than a prerequisite.


## Post-TASK-014 Roadmap Refinement — 2026-08-08

TASK-014 remains `COMPLETED`. Post-completion review assigns the remaining topology-dependent improvements to existing TASK-015 and intentionally creates no TASK-016.

| ID | Improvement | Disposition | Owner |
|---|---|---|---|
| OP-071 | Distributed Calibration Evidence envelope with provenance/class/time-source/attestation and idempotent deduplication | Roadmap reserved | TASK-015 |
| OP-072 | Cohort/topology-aware calibration baselines with partial-coverage and clock-skew uncertainty | Roadmap reserved | TASK-015 |
| OP-073 | Remote Counterfactual + Shadow evaluation bound to exact Candidate checksum and worker/environment fingerprint | Roadmap reserved | TASK-015 |
| OP-074 | Candidate version/activation-epoch propagation with lease/fencing and stale-result quarantine | Roadmap reserved | TASK-015 |
| OP-075 | Staged/canary distributed policy rollout with post-activation SLO observation and governed rollback | Roadmap reserved | TASK-015 |
| OP-076 | Distributed policy-divergence detection and reconciliation to canonical activated version | Roadmap reserved | TASK-015 |
| OP-077 | Tamper-evident distributed calibration checkpoints/receipts without false global-atomic-ledger claims | Roadmap reserved | TASK-015 |
| OP-078 | Calibration Evidence/evaluation quota, backpressure and Cost Guard controls | Roadmap reserved | TASK-015 |
| OP-079 | Candidate explainability lineage and decomposable confidence/freshness/coverage evidence | Acceptance requirement | TASK-015 inherited from TASK-014 |
| OP-080 | Optional learned-model/provider implementations stay behind existing Candidate/Safety/Evaluation/Authorization contract | Extension boundary, no new task | TASK-013/TASK-014 |

TASK-015 remains `NEXT / NOT_STARTED / NOT_AUTHORIZED`. Distributed calibration remains opt-in; single-machine CalibrationOS does not inherit distributed coordination cost.

## TASK-015 Completion Allocation

TASK-015 is `COMPLETED`. The optional common `DistributedOS` realizes the topology-dependent coordination responsibilities previously reserved across Monitoring, Integration, Security, Release, Conformance, Maintenance, Extension and Calibration without duplicating distributed primitives inside each subsystem. Historical reservation rows above are retained as provenance; this section is the current disposition.

| Improvement | TASK-015 disposition |
| --- | --- |
| OP-034 | Implemented by common Event Envelope, durable delivery, Worker/Lease/Fencing, retry/DLQ/replay and Saga foundations. |
| OP-039 / OP-046 | Implemented by correlation/causation-aware distributed telemetry, deduplication, missing-coverage, clock-skew and SLI/SLO aggregation. |
| OP-059 | Implemented by semantic idempotency, quota/backpressure/resource budget and shared remote-run/transport coordination boundaries. |
| OP-064 | Implemented by exact rollout lease/epoch/fencing, canary/soak, promotion criteria, divergence detection and known-good rollback. |
| OP-070 | Implemented by distributed Calibration Evidence transport, worker attestation/fencing, late-result quarantine and common remote coordination. |
| OP-071 | Implemented by versioned Distributed Calibration Evidence envelope with provenance, time-source, attestation and idempotent deduplication. |
| OP-072 | Implemented by cohort/source coverage, explicit missing observations, clock-skew metadata and uncertainty-preserving aggregation. |
| OP-073 | Implemented by exact-checksum remote run request/result binding for Counterfactual and Shadow evaluation plus worker/environment fingerprints. |
| OP-074 | Implemented by activation epoch, exact run/rollout lease scopes, fencing and stale-result quarantine. |
| OP-075 | Implemented by canary rollout, mandatory soak, promotion criteria, post-result regression handling and governed rollback. |
| OP-076 | Implemented by policy-version divergence detection and canonical-version reconciliation input. |
| OP-077 | Implemented by tamper-evident checkpoint receipts explicitly scoped as local/distributed receipts, not a false global atomic ledger. |
| OP-078 | Implemented by queue/in-flight/replay/cost quota and backpressure controls. |
| OP-079 | Implemented as distributed Candidate lineage plus decomposed evidence sufficiency/freshness/coverage/evaluation confidence inputs. |
| OP-080 | Boundary preserved: optional learned/vendor implementations remain Extension/Calibration providers behind existing Safety/Evaluation/Authorization contracts; no TASK-016 is implied. |

Production-specific cloud brokers, remote worker fleets, multi-region deployment and vendor adapters remain deployment/provider implementations behind TASK-015 contracts. They are not unfinished Core authority and require no automatic new roadmap Task.


## Post-TASK-015 Resilience Roadmap Refinement — 2026-08-08

TASK-015 remains `COMPLETED`. The explicit Owner refinement creates one bounded next task, TASK-016, for reusable resilience/recovery/scalability certification. Provider/cloud deployments remain outside Core.

| ID | Improvement | State | Owner Task |
|---|---|---|---|
| OP-081 | Deterministic virtual-clock distributed simulation and scenario replay | Roadmap reserved | TASK-016 |
| OP-082 | Bounded crash/partition/drop/delay/reorder/clock-skew/storage/compensation fault injection | Roadmap reserved | TASK-016 |
| OP-083 | Post-failure convergence, reconciliation, fencing and duplicate-effect certification | Roadmap reserved | TASK-016 |
| OP-084 | RTO/RPO-style recovery objective measurement with explicit NOT_MEASURED state | Roadmap reserved | TASK-016 |
| OP-085 | Mixed-version protocol/schema and rolling upgrade/downgrade certification | Roadmap reserved | TASK-016 |
| OP-086 | Load/soak/capacity/backpressure/cost-envelope certification | Roadmap reserved | TASK-016 |
| OP-087 | Backup/restore and disaster-recovery drills for durable coordination/evidence state | Roadmap reserved | TASK-016 |
| OP-088 | Redacted incident timeline and evidence-bundle reconstruction | Roadmap reserved | TASK-016 |
| OP-089 | Chaos authorization, blast-radius, Emergency Stop and cost-safety controls | Roadmap reserved | TASK-016 |
| OP-090 | Resilience Certification levels separating SIMULATED/SANDBOX/attested REAL evidence | Roadmap reserved | TASK-016 |

TASK-016 is `NEXT / NOT_STARTED / NOT_AUTHORIZED`. No TASK-017 is created.


## Post-BAI-CREATIVE-OS Knowledge Audit Addendum — 2026-08-10

The external audit was performed against a 2026-07-31 snapshot and is partially superseded by completed TASK-005〜015 implementation. The following rows contain only the remaining current gaps after adjudication.

| ID | Improvement | Status | Target |
|---|---|---|---|
| OP-091 | Structured Knowledge Candidate / Rejected Pattern / Quality Evidence / Promotion Decision contracts | Roadmap reserved | TASK-017 |
| OP-092 | Multi-dimensional conditions/counterexample/sample/effect/rework/time/human-acceptance confidence model | Roadmap reserved | TASK-017 |
| OP-093 | Typed Critic/Builder/Owner/Undo/Tester/recurrence/deviation causal Evidence linkage | Roadmap reserved | TASK-017 |
| OP-094 | Cross-Task/Project Reproduction Matrix and privacy-preserving federated Evidence aggregation | Roadmap reserved | TASK-017 |
| OP-095 | Non-compensable Safety/Security/Rights/Privacy/Authority Hard Reject gates | Roadmap reserved | TASK-017 |
| OP-096 | Review-gated promotion/demotion/invalidation/quarantine; score is never authority | Roadmap reserved | TASK-017 |
| OP-097 | Signed/versioned Knowledge Distribution Pack and last-known-good rollback using SecurityOS/ReleaseOS | Roadmap reserved | TASK-017 |
| OP-098 | Consumer/Project isolation, minimization, opt-in/redacted federated export and retention | Roadmap reserved | TASK-017 |
| OP-099 | Knowledge regression/drift/quarantine and exact-revision Impact-driven rollback evidence | Roadmap reserved | TASK-017 |
| OP-100 | CREATIVE/Video Production domain metric provider for QA/re-edit/rework/work-time Evidence | Roadmap reserved | TASK-017 |

TASK-016 remains `NEXT / NOT_STARTED / NOT_AUTHORIZED`. TASK-017 is queued after TASK-016 and is also `NOT_STARTED / NOT_AUTHORIZED`. No TASK-018 is created.


## Consumer Knowledge Evolution Fast-Track Addendum — 2026-08-11

This addendum preserves TASK-016/017 numbering while preventing knowledge loss from already-running BAI VIDEO PRODUCTION. Pattern C manual ZIP ingestion is a TASK-016 Phase 0 enabling bridge; Pattern A Hub is TASK-017 automation; Pattern B direct local ingestion is deferred.

| ID | Improvement | Status | Target |
|---|---|---|---|
| OP-101 | Source-neutral Knowledge Evidence / Candidate / Snapshot contracts usable by A/B/C | Planning reserved | TASK-016 Phase 0 -> TASK-017 core |
| OP-102 | Pattern C manual ZIP intake, provenance recovery, secret/privacy exclusion and Knowledge Intake Package | Fast-track planning reserved | TASK-016 Phase 0 |
| OP-103 | First BAI VIDEO PRODUCTION knowledge extraction with reusable/rejected-pattern review | Fast-track planning reserved | TASK-016 Phase 0 |
| OP-104 | PostgreSQL-backed one-VPS Knowledge Hub with evidence-submit-only producer identity and idempotent submission | Roadmap reserved | TASK-017 |
| OP-105 | Common normalization/generalization/dedup/conflict/supersession and governed promotion | Roadmap reserved | TASK-017 |
| OP-106 | Direct local adapter over the proven Common Ingestion Core | Deferred roadmap | TASK-017 late |

Knowledge Hub v1 target infrastructure cost is 1,500–2,500 JPY/month with a hard ceiling of 3,000 JPY/month. Canonical Knowledge remains private-Git authoritative. No TASK-018 is created.


## TASK-017 GitHub Actions Live Gate Addendum — 2026-08-11

| ID | Improvement | Status | Target |
|---|---|---|---|
| OP-114 | Trusted GitHub-hosted Docker/PostgreSQL live rehearsal when local Docker is unavailable | Implemented locally; remote Evidence pending | TASK-017 Phase 0 |
| OP-115 | Fork-safe split between static PR contracts and trusted live container execution; prohibit `pull_request_target` | Implemented | TASK-017 Phase 0 |
| OP-116 | CI-generated deployment runtime lock candidate consumed by Docker `npm ci` and retained as review artifact | Implemented locally; accepted lock commit pending | TASK-017 Phase 0 |
| OP-117 | Commit/run-bound sanitized CI live-gate Evidence for Judge review | Implemented locally; remote Evidence pending | TASK-017 Phase 0 |

## TASK-018 Codex Autonomy P0 Allocation — 2026-08-13

The later explicit Owner Directive supersedes prior “No TASK-018” planning statements for current routing only. TASK-017 is paused at `07af447`; its scope and Evidence remain intact.

| ID | Improvement | Status | Target |
|---|---|---|---|
| OP-118 | Context Cost Observatory with estimate/observed/billed separation | P0 implementation active | TASK-018 Phase B |
| OP-119 | Context Manifest duplicate/stale/unused measurement and CONTEXT_OVERFETCH | P0 implementation active | TASK-018 Phase B |
| OP-120 | Stale-safe Handoff Bootstrap and Source of Truth resolution | P0 next phase | TASK-018 Phase C |
| OP-121 | Authorized runnable queue and Human Gate Parking | P0 planned | TASK-018 Phase D |
| OP-122 | Safe checkpoint, compressed handoff and Session Rotation | P0 planned | TASK-018 Phase E |
| OP-123 | Protocol-independent Dynamic Capability exposure and bounded Codex adapter | P0 foundation/planned | TASK-018 Phase D/F |
| OP-124 | BAI VIDEO PRODUCTION autonomy consumer pilot without runtime dependency | Separate Consumer/native gate | TASK-018 Phase G |
| OP-125 | Balanced Execution: two-cycle review cap and gate-based advancement | Active governance control | TASK-018 all phases |

WebMCP remains Experimental. Visual Compliance remains Consumer-owned. Release, Tag, Deploy, paid execution, credit purchase/top-up and unauthorized native mutation remain outside this allocation.
