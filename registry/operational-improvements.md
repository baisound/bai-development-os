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

TASK-011 remains `COMPLETED`. Architecture Ver.2.20 Part XV directly incorporates four TASK-011-derived future sections: Conformance evidence/certification self-maintenance in TASK-012; Runner/Probe/Sandbox/Fixture/Provider SDKs in TASK-013; evidence/coverage/certification calibration in TASK-014; and optional remote/distributed Conformance execution in TASK-015. Roadmap preservation is `48 / 48 PASS`. TASK-012 remains `NEXT / NOT_STARTED / NOT_AUTHORIZED`; TASK-013〜015 remain future and unauthorized.
