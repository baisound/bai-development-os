# TASK-014 — BAI Development OS Adaptive Governance Calibration & Policy Learning Detailed Design Ver.1.0

## 1. Document Control

| Item | Value |
|---|---|
| Task | TASK-014 |
| Subsystem | CalibrationOS |
| Version | 1.0 |
| Development Profile | DEV_4_FOUNDATION_CRITICAL |
| Status | CURRENT_CANONICAL / COMPLETED |
| Effective date | 2026-08-08 |
| Parent Architecture | BAI Development OS Architecture Ver.2.24 |
| Previous dependency | TASK-004〜013 COMPLETED |
| Next route | TASK-015 / NOT_STARTED / NOT_AUTHORIZED |

## 2. Purpose

TASK-014 implements an evidence-driven calibration loop for BAI Development OS. The goal is to reduce unnecessary governance cost, noise, retries, stale checks and excessive review while preserving fixed authority and safety floors. CalibrationOS produces recommendations and governed policy candidates; it is not a self-authorizing policy engine.

The canonical flow is:

`Evidence → Analytics/Diagnostics → Recommendation → Policy Candidate → Safety Review → Counterfactual Replay → Shadow Evaluation → Owner + Policy Authorization → Advisory Activation`

## 3. Authority Boundary

CalibrationOS MUST NOT:

- rewrite DEV safety floors automatically;
- alter permanent model-routing policy;
- grant Owner, Lifecycle, Knowledge, Security, Release, Maintenance or Extension authority;
- disable external-action authorization;
- promote SIMULATED/DECLARED evidence into REAL execution evidence;
- treat OFFICIAL Extension classification as execution trust;
- bypass ExtensionOS Capability Broker or sandbox requirements;
- mutate a canonical subsystem merely because a recommendation exists.

A recommendation has `authority_effect=NONE`. Activation requires explicit Owner and Policy authorization references plus successful evaluation gates.

## 4. Evidence Model

Calibration Evidence is an immutable checksummed event with:

- evidence id, observed time, project/task scope;
- subsystem and metric;
- finite numeric value and optional unit;
- evidence class: `REAL / SANDBOX / SIMULATED / DECLARED`;
- evidence weight;
- source/source reference;
- dimensions/attributes;
- content checksum.

REAL and SANDBOX constitute verified evidence for actionable recommendations. SIMULATED and DECLARED may contribute weak historical context but cannot alone satisfy the verified-sample floor.

## 5. Monitoring Feedback Adapter

Numeric TASK-007 Monitoring Events may be normalized into Calibration Evidence. Monitoring remains observation authority only. The adapter preserves project/task/time/metric/source provenance and maps Monitoring components into the relevant Calibration subsystem. Non-numeric events are rejected rather than guessed.

## 6. Analytics and Evidence Sufficiency

Calibration analytics provide:

- sample count and verified sample count;
- weighted mean;
- min/max and P10/P25/P50/P75/P90/P95/P99;
- explicit insufficient-evidence reasons;
- robust median/MAD anomaly detection;
- derived SLI/SLO evaluation.

Every catalog parameter declares both a total-sample floor and verified-sample floor. A missing floor produces `INSUFFICIENT_EVIDENCE`; no fallback guessed value is generated.

## 7. Cross-Subsystem Calibration Catalog

The baseline catalog contains bounded advisory parameters spanning all accumulated TASK-014 ownership:

| Subsystem | Baseline calibration examples |
|---|---|
| Governance | review-cycle cap, revalidation ratio |
| Knowledge | confidence threshold, freshness window |
| Automation | retry depth, successful context-token budget |
| Monitoring | alert deduplication window |
| Integration | timeout and retry count |
| Security | replay window and secret lease TTL recommendations |
| Release | canary percentage and soak duration |
| Conformance | evidence freshness and REAL-execution priority |
| Maintenance | scan cadence and checkpoint retention |
| Extension | timeout, concurrency limit and Provider health floor |

Catalog strategies use deterministic percentile/mean transforms with explicit bounds and rounding. Catalog output is recommendation evidence, not automatic configuration mutation.

## 8. Adaptive Development Governance Diagnostics

CalibrationOS compares DEV profile outcomes using token cost, lead time, defect escape, Critic findings, test failures and Owner override frequency.

`POSSIBLE_OVER_GOVERNANCE` is advisory only. It may suggest that small reversible work is receiving more ceremony than evidence justifies, but it cannot lower a safety floor.

`UNDER_ASSURANCE_SAFETY_FLOOR` is blocking when:

- FOUNDATION or CRITICAL work runs below DEV-4;
- CORE or MULTI_PROJECT work runs below DEV-3.

Policy A/B/A/B oscillation detection surfaces unstable tuning. Calibration opportunities can be ranked by risk reduction divided by operational cost/time.

## 9. Policy Candidate Contract

A Policy Candidate binds:

- candidate id and creation time;
- base policy version;
- source Calibration Report checksum;
- selected adjustments;
- current and proposed values;
- confidence/evidence references/rationale;
- safety evaluation results;
- mandatory evaluation requirements;
- candidate content checksum.

The baseline activation requirements are both `COUNTERFACTUAL` and `SHADOW`.

## 10. Immutable Safety Floors

CalibrationOS blocks weakening or bypass of the following classes:

- Governance safety/Owner floors;
- Knowledge MANDATORY enforcement;
- Automation Owner-required action classes;
- mandatory Monitoring integrity/privacy alerts;
- Integration external authorization and credential secrecy;
- mandatory Security and RESTRICTED-data boundaries;
- Release signing/security/mandatory compatibility gates;
- Conformance evidence-class definitions and REAL execution floors;
- Maintenance mutation preconditions, Owner gates and single-use repair semantics;
- Extension Core Authority, execution authorization and Capability Broker requirements.

Special hard floors preserve DEV minimum ranks and explicitly forbid enabling `extension.core_authority.override_allowed` or disabling Capability Broker mediation.

## 11. Counterfactual Replay

Counterfactual evaluation replays historical cases through a Candidate-bound evaluator. Every case returns baseline and proposed cost/quality/risk plus mandatory-violation status.

A Candidate fails when it increases aggregate risk, causes a quality regression beyond configured tolerance, introduces any mandatory violation, fails safety review or lacks enough evaluation cases.

The result is checksummed and bound to the exact Candidate checksum.

## 12. Shadow Evaluation

Shadow evaluation applies the same comparison contract to non-authoritative proposed decisions alongside the active path. Shadow output cannot change the active policy. It must pass before activation, making low-cost experiments possible without changing canonical runtime behavior.

## 13. Authorized Activation

Activation requires:

1. Candidate checksum verification;
2. `safety_decision=ALLOW`;
3. PASS Counterfactual evaluation bound to that Candidate;
4. PASS Shadow evaluation bound to that Candidate;
5. non-empty `owner_authorization_ref`;
6. non-empty `policy_authorization_ref`.

Only after all six gates may an optional `policy_applier` receive the activation record. The applier is an integration boundary, not a hidden CalibrationOS write path.

## 14. Durable Calibration Ledger

When a root is configured, CalibrationOS persists `EVIDENCE`, `POLICY_CANDIDATE`, `POLICY_EVALUATION` and `POLICY_ACTIVATED` records in a root-confined ledger.

The ledger is:

- lock protected;
- hash chained;
- atomically replaced;
- reread and verified after append;
- tamper detecting.

Derived snapshots contain only activated advisory policy values. Candidate existence alone never changes the snapshot.

## 15. Knowledge / Automation / Monitoring Integration

TASK-014 supports evidence-driven recommendations for Knowledge effectiveness/freshness, automation retry/context efficiency, Owner-gate friction, Monitoring noise/anomalies and SLI/SLO views. These inputs remain derived observations and never replace each subsystem's canonical authority.

## 16. Integration / Security / Release Integration

Connector latency/retry evidence, provider reliability, security replay/lease evidence, release canary/soak outcomes and rollback/compatibility observations can produce bounded recommendations. Credential secrecy, external authorization, signing/trust and mandatory compatibility floors remain immutable.

## 17. Conformance / Maintenance Integration

Conformance evidence freshness and coverage-priority recommendations preserve REAL/SANDBOX semantics. Maintenance cadence/checkpoint recommendations preserve mutation preconditions, repair-plan single-use, immediate revalidation and Owner gates. Calibration may identify repair-policy oscillation but cannot execute repair.

## 18. ExtensionOS Calibration Additions

TASK-013-derived improvements are absorbed into TASK-014 rather than creating another task:

- Provider success/failure/timeout/cancellation/throttling and latency analysis;
- timeout/concurrency/resource-budget recommendations;
- Provider-health and equivalent-provider advisory comparison;
- authorization/permission friction analysis;
- trust/conformance freshness and upgrade/revoke recovery evidence;
- repeated failure-loop, noisy hook and artifact-gate improvement recommendations.

OFFICIAL/COMMUNITY/PROJECT_LOCAL remains classification only. In-process trust remains independently checksum-pinned; sandbox-required capability remains sandboxed; Capability Broker and external authorization remain mandatory.

## 19. Failure Model

CalibrationOS fails closed on:

- malformed or non-numeric evidence;
- unknown subsystem/evidence class;
- checksum tamper;
- insufficient total/verified evidence;
- illegal safety-floor adjustment;
- Candidate/evaluation binding mismatch;
- risk or mandatory regression in replay/shadow;
- missing Owner or Policy authorization;
- corrupt durable ledger;
- root path escape.

## 20. Critic Findings Resolved

The implementation explicitly addresses the likely high-risk failure modes:

- simulated/declarative data cannot independently authorize learned policy;
- recommendation generation has no authority effect;
- safety floors are checked independently of recommendation confidence;
- both historical counterfactual and live-shadow proof are required;
- Candidate and Evaluation checksums prevent stale/mismatched evidence reuse;
- policy activation requires two independent authorization references;
- active policy snapshot derives only from activation records;
- CalibrationOS does not mutate permanent model policy;
- extension trust classification cannot be learned into execution trust;
- over-governance findings are advisory while under-assurance is blocking.

Blocking Critic findings after correction: `0`.

## 21. Verification Baseline

- CalibrationOS dedicated tests: `56 / 56 PASS`.
- Full BAI Development OS: `1115 / 1115 PASS`.
- Calibration Conformance: `6 schemas / 10 subsystems / 20 catalog parameters PASS`.
- Product/Roadmap/other subsystem gates are recorded in TASK-014 final Test Report after document synchronization.

## 22. Accepted Residual and TASK-015 Ownership

TASK-015 owns optional distributed execution/event fabric, including distributed Calibration Evidence transport, remote worker identity, fencing, replicated Extension Registry coordination, late-result quarantine and distributed backpressure. Single-machine CalibrationOS remains the first-class baseline.

Long-horizon statistical/ML learners, vendor-specific models and production policy appliers may be added later behind the same Evidence → Candidate → Safety → Evaluation → Authorization contract. They are not required for TASK-014 completion.

## 23. Completion Route

TASK-014 completion requires:

- implementation and dedicated/full regression PASS;
- cross-subsystem catalog and safety-floor conformance;
- current Architecture promotion to Ver.2.24;
- current-state/context/README/Registry synchronization;
- MD/DOCX detailed-design synchronization and visual QA;
- Architecture DOCX synchronization and visual QA;
- final completion evidence with blocking Critic findings = 0;
- TASK-015 remaining explicitly unstarted/unauthorized.
