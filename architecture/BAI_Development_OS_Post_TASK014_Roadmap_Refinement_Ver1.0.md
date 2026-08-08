# BAI Development OS Post-TASK-014 Roadmap Refinement Ver.1.0

- Effective date: 2026-08-08
- Source: completed TASK-014 CalibrationOS implementation, final verification, Critic findings and post-completion architecture review
- Status: ACTIVE_ROADMAP_RECORD
- TASK-014: remains COMPLETED
- Integration rule: TASK-014 is not reopened. New residuals are absorbed into existing TASK-015 where they require distributed topology. No TASK-016 is created because no independent product boundary is justified by the current findings.

## TASK-015

Extend the optional Distributed Orchestration & Event Fabric with governed distributed CalibrationOS coordination while keeping single-machine CalibrationOS first-class:

- Add a versioned Distributed Calibration Evidence Envelope carrying evidence id/checksum, source project/node/worker, subsystem/metric, evidence class, observation time/time-source metadata, policy version, correlation/idempotency identity and worker attestation where applicable.
- Deduplicate replayed or replicated Evidence before aggregation so at-least-once transport cannot amplify confidence, sample counts or recommendation weight.
- Preserve provenance and evidence class across transport. Remote location, replication or aggregation never upgrades DECLARED/SIMULATED evidence into REAL/SANDBOX evidence.
- Support cohort/topology-aware baselines so heterogeneous workers, providers, operating systems or regions are not blindly merged into one misleading global baseline. Cross-cohort aggregation must expose missing/partial coverage explicitly.
- Add distributed SLI/SLO and anomaly aggregation with gap detection, clock-skew metadata and partition-aware uncertainty instead of treating missing remote Evidence as healthy Evidence.
- Propagate Policy Candidates by exact candidate checksum, policy version and activation epoch. Replication is distribution of an already-authorized candidate, not a new authority source.
- Coordinate remote Counterfactual and Shadow evaluations with signed/checksummed run requests/results, exact Candidate binding, worker/environment fingerprinting, idempotent run identity and duplicate-result suppression.
- Quarantine late evaluation or activation results when Candidate checksum, policy version, trust state, worker lease, evidence baseline or authorization changed while remote work was in flight.
- Add staged/canary distributed policy rollout with explicit cohort state, soak/promotion criteria, bounded parallelism and rollback to the last known-good activated policy when post-activation SLO/risk evidence regresses.
- Add distributed activation lease/epoch/fencing so a stale coordinator cannot continue rollout after ownership transfer. Owner and Policy authorization remain canonical prerequisites and are never replaced by worker quorum.
- Detect distributed policy divergence across workers/projects and reconcile toward the canonical activated version with explicit drift evidence rather than silently accepting mixed policy state.
- Add tamper-evident distributed calibration checkpoint/receipt strategy. Local hash-chained ledgers remain authoritative for their records; cross-machine aggregation must not falsely claim one globally atomic append-only ledger when the transport cannot provide that guarantee.
- Add quota/backpressure and Cost Guard integration for Evidence volume, remote evaluations, replay storms and calibration rollout so adaptive governance cannot become an unbounded distributed cost center.
- Define partition semantics: already-safe local known-good policy may continue where allowed, while Security/Authority/Trust-sensitive promotion fails closed when current candidate/authorization/epoch state cannot be proven.
- Add a fault matrix for coordinator crash, worker crash, duplicate Evidence, duplicate evaluation dispatch, stale fencing token, mixed policy versions, partition, clock skew, missing cohort Evidence, late result, rollback storm and replay storm.
- Keep distributed calibration opt-in. Single-machine/single-project Consumers must not pay broker, quorum-like coordination, replication or remote-evaluation cost when topology does not require it.

### Improvement requirements inherited from TASK-014

The distributed implementation must also productize the following TASK-014 lessons without creating a parallel CalibrationOS:

- Recommendation explainability must preserve the Evidence lineage, current value, proposed value, bounds, diagnostic reason and Safety Floor decision used for every Candidate.
- Confidence must remain decomposable into evidence sufficiency, freshness, coverage and evaluation outcome rather than a single opaque model score.
- Activated policy rollout must be observable after activation; regression evidence must trigger rollback recommendation or configured governed rollback, never silent self-mutation.
- Policy/version drift, stale activation, evaluation expiry and evidence freshness must remain explicit operational states.
- Long-horizon learned models or vendor-specific ML may be plugged behind the existing Evidence → Candidate → Safety → Evaluation → Authorization contract, but may not introduce a second authority path.

**Acceptance direction:** TASK-015 may distribute Evidence collection, evaluation, policy propagation and staged activation without weakening TASK-014 safety/authorization semantics. Distributed operation improves scale and resilience while small projects retain the lower-cost local path.

## Task-allocation decision

No TASK-016 is created by this refinement. Explainability, confidence decomposition, post-activation observation and rollback are acceptance requirements of the distributed CalibrationOS path, while optional learned-model implementations remain Extension/Calibration implementations behind already-defined authority boundaries. Creating a new task now would duplicate TASK-014/TASK-015 responsibility and increase governance cost without a clean new product boundary.
