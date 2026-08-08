# BAI Development OS — TASK-015 Distributed Orchestration & Event Fabric — Detailed Design Ver.1.0

## Document Control

- Task: `TASK-015`
- Status: `CURRENT_CANONICAL / COMPLETED`
- Development Profile: `DEV_4_FOUNDATION_CRITICAL`
- Parent Architecture: `BAI Development OS Architecture Ver.2.26`
- Effective date: `2026-08-08`
- Runtime package: `bai-development-os@1.0.0`
- Root export: `DistributedOS`
- Subpath export: `./distributed`

## 1. Purpose

TASK-015 is the optional distributed execution and event-fabric layer of BAI Development OS. It extends the local deterministic foundations of TASK-004 through TASK-014 to multi-process, multi-machine and high-scale topologies without replacing their authority, safety, trust or evidence semantics.

The design deliberately does **not** make distributed operation mandatory. A single-machine project continues to use LifecycleOS, AutomationOS, MonitoringOS, IntegrationOS, SecurityOS, ReleaseOS, ConformanceOS, MaintenanceOS, ExtensionOS and CalibrationOS directly. `DistributedService` is disabled by default and incurs no durable broker or remote coordination activity until explicitly enabled.

## 2. Non-goals

TASK-015 does not:

- claim globally exactly-once message delivery;
- claim globally atomic transactions across unrelated machines/providers;
- replace TASK-004 Lifecycle canonical state;
- replace Owner or Policy authorization with worker quorum;
- upgrade Evidence authority because it crossed a network;
- grant external credentials or provider access;
- create a second Security, Release, Maintenance, Extension or Calibration authority path;
- require a particular queue, cloud, database or orchestration vendor;
- make remote execution a prerequisite for small projects.

## 3. Core Architecture

The implemented path is:

`Canonical local OS state → Versioned Distributed Envelope → Durable/Pluggable Transport → Worker capability + attestation selection → Lease/Epoch/Fencing → At-least-once dispatch → Idempotent effect acknowledgement → Trace/Evidence aggregation → Quarantine / Retry / DLQ / Replay / Saga / Rollout recovery`.

Authority remains outside transport. Transport carries already-authorized work and evidence; it never creates authorization.

## 4. Distributed Event Envelope

`createDistributedEventEnvelope()` creates immutable checksummed events containing:

- event id and event type;
- source and source node;
- project/task/revision binding;
- correlation and causation identity;
- partition key and optional sequence;
- semantic idempotency key;
- UTC observation metadata/time source;
- policy version and activation epoch;
- Evidence class where applicable;
- authorization and worker-attestation references;
- deadline and resource budget;
- payload and content checksum.

The envelope is transport-neutral. `signDistributedEventEnvelope()` and `verifySignedDistributedEventEnvelope()` reuse SecurityOS Ed25519 envelope primitives when cryptographic provenance is required.

## 5. Delivery Semantics

The canonical transport contract is **at-least-once delivery**. TASK-015 never describes delivery itself as globally exactly once.

Exactly-once **effect** is approached by consumer-side semantic idempotency. The reference durable broker records `(consumer_id, idempotency_key)` effect acknowledgements. Re-delivery of an already acknowledged effect returns the prior acknowledgement rather than applying the effect again.

A different payload/checksum reusing an existing event id or idempotency key is a collision and fails closed.

## 6. Durable Reference Broker

The reference local durable broker persists `.bai-os/distributed/broker-state.json` under SecurityOS trusted-root and atomic-write rules.

It maintains:

- PENDING / IN_FLIGHT / ACKNOWLEDGED / DEAD_LETTER event state;
- attempt count and replay count;
- claim owner and acknowledgement deadline;
- fencing token binding;
- effect acknowledgements;
- retry/dead-letter state;
- a tamper-evident operation hash chain;
- whole-state checksum and atomic replacement verification.

The reference broker is a correctness baseline, not a claim that one JSON document is an appropriate high-scale remote broker.

## 7. Transport Adapter Contract

`createDistributedTransportAdapter()` standardizes remote/local queue adapters without selecting a vendor. Every adapter exposes publish, claim, acknowledge, fail and health operations and must declare `AT_LEAST_ONCE` delivery.

A production implementation may bind this contract to a managed queue, database-backed broker, offline-forwarder or another transport, provided the adapter preserves TASK-015 idempotency, authorization, fencing, evidence and failure contracts.

## 8. Claim, Retry, Dead Letter and Replay

A consumer claim transitions one event to `IN_FLIGHT`, increments attempt count and stores an acknowledgement deadline. Failure before the configured attempt ceiling schedules a retry. Exhaustion transitions the event to `DEAD_LETTER`.

Expired claims are recovered deterministically. Dead-letter replay is explicit and bounded. A replay limit prevents poison events from creating unbounded replay storms.

## 9. Worker Identity and Capability Advertisement

Remote workers publish checksummed advertisements containing worker/node identity, environment fingerprint, capabilities, allowed project set, trust state, attestation reference and optional Provider implementation checksums.

Trust states are `ATTESTED`, `UNATTESTED` and `REVOKED`. `ATTESTED` requires an attestation reference. Capability eligibility rejects missing capability, disallowed project, revoked worker, required-attestation failure and Provider checksum mismatch.

The advertisement is a scheduling input; it is not itself a source of Owner authority.

## 10. Lease, Epoch and Fencing

`issueDistributedLease()` produces scope-bound leases containing owner identity, strictly increasing epoch, unique fencing token and expiry.

A renewed/ownership-transferred lease must advance epoch. Run leases are bound to `run:<run_id>`; rollout leases are bound to `rollout:<rollout_id>`. A token from another run or stale epoch is rejected.

This prevents a stale coordinator/worker from continuing authoritative work after ownership transfer.

## 11. Remote Run Contract

`createRemoteRunRequest()` supports Conformance, Calibration Counterfactual/Shadow, Extension, Maintenance, Integration, Release and generic remote jobs.

Requests bind:

- run and idempotency identity;
- project/task/correlation;
- exact subject checksum;
- policy/trust versions;
- activation epoch;
- worker capabilities/attestation requirements;
- Provider checksums;
- authorization reference;
- deadline and resource budget.

`createRemoteRunResult()` binds the result back to the exact request and exact worker/environment fingerprint.

## 12. Evidence Classification and Remote Trust

Remote location never upgrades Evidence class. A REAL remote result requires an `ATTESTED` worker. SANDBOX, SIMULATED and DECLARED results retain their original class.

The transport layer does not convert simulation into real execution, nor does a worker vote make evidence authoritative.

## 13. Late Result Quarantine

`evaluateRemoteResultFreshness()` explicitly quarantines results when any relevant state changed in flight:

- subject/binding checksum;
- policy version;
- trust version;
- activation epoch;
- lease epoch;
- fencing token;
- request deadline;
- worker revocation.

Late data remains available as evidence/diagnostic material but cannot silently become current authoritative output.

## 14. Distributed Trace and Metric Aggregation

Distributed Event Envelopes carry correlation/causation and time-source fields so monitoring does not infer causality from wall-clock timestamps alone.

`aggregateDistributedMetric()` provides:

- idempotent duplicate suppression;
- collision rejection;
- observed/missing source coverage;
- partition uncertainty;
- maximum absolute clock-skew metadata;
- mean and P95 aggregation;
- optional SLI/SLO result.

Missing workers are represented as missing coverage, not healthy zeroes.

## 15. Partition Semantics

`evaluateDistributedPartition()` enforces explicit behavior:

- if current canonical state is provably current: proceed;
- Security/Authority/Trust/Release/Maintenance/external-side-effect-sensitive promotion without current proof: fail closed;
- non-sensitive operation may continue already-known-good local state where explicitly allowed;
- otherwise defer.

This prevents network availability from weakening safety policy.

## 16. Quota, Backpressure and Cost Boundaries

`DistributedQuotaGuard` limits queue depth, in-flight operations, replay count and estimated cost reservation. This prevents telemetry floods, replay storms, remote evaluation storms or Provider fan-out from becoming unbounded resource/cost centers.

The guard is a distributed-layer admission boundary. Actual model/provider accounting continues to use TASK-004 Cost Guard where authoritative cost ledger integration is required.

## 17. Saga and Compensation

`createDistributedSaga()` defines a dependency DAG. `executeDistributedSaga()` executes ready steps and compensates completed steps in reverse order after failure when compensators exist.

The result distinguishes complete compensation from `SAGA_RECOVERY_REQUIRED`. TASK-015 does not claim global ACID rollback when underlying providers do not support it.

Canonical Lifecycle transitions remain TASK-004-owned even when a Saga coordinates several projects.

## 18. Staged / Canary Rollout

`createDistributedRolloutPlan()` requires:

- explicit canary cohort;
- target checksum;
- Owner authorization reference;
- Policy authorization reference;
- activation epoch;
- bounded parallelism metadata;
- soak duration;
- optional known-good rollback target.

Promotion cannot occur before canary PASS and completion of the configured soak window. Regression or failure triggers rollback when a known-good target exists, otherwise the rollout blocks.

## 19. Policy Divergence

`detectPolicyDivergence()` compares worker policy versions with the canonical activated version and returns an explicit divergent worker set. Mixed policy state is never silently treated as converged.

Reconciliation means routing workers back toward the canonical authorized version; divergence itself does not authorize a new version.

## 20. Distributed CalibrationOS

TASK-015 reuses TASK-014 Calibration Evidence objects unchanged inside `Distributed Calibration Evidence Envelope` records.

The envelope preserves:

- original Evidence id/checksum/class;
- subsystem/metric/project/task;
- source node/worker/cohort;
- environment fingerprint;
- time source and clock skew;
- policy version;
- idempotency identity;
- worker attestation reference.

`aggregateDistributedCalibrationEvidence()` deduplicates at-least-once transport and reports cohort coverage/missing cohorts/clock-skew uncertainty while preserving original Evidence authority.

## 21. Distributed Calibration Explainability

`createDistributedPolicyCandidateEnvelope()` binds to the exact TASK-014 Candidate checksum and source report. It carries per-adjustment:

- Evidence lineage;
- current and proposed values;
- confidence;
- rationale/diagnostic reason;
- Evidence summary where available;
- independently recomputed Safety Floor decision.

`decomposeDistributedConfidence()` keeps confidence inspectable as evidence sufficiency, freshness, coverage and evaluation outcome rather than a single opaque model score.

## 22. Security / Release / Conformance / Maintenance / Extension Composition

TASK-015 supplies shared distribution semantics rather than implementing a second copy of each OS:

- SecurityOS supplies signing, trust, secret and path-integrity primitives;
- ReleaseOS local transactions remain authoritative per consumer while TASK-015 coordinates cohorts and fencing;
- ConformanceOS remote REAL evidence requires attested worker/environment binding;
- MaintenanceOS remote repair uses run/repair leases, late-result quarantine and partition fail-closed behavior;
- ExtensionOS remote execution remains Capability Broker/authorization/sandbox governed; Provider checksum may be advertised and required during worker selection;
- IntegrationOS remains the authority for actual external side effects and credentials.

## 23. Tamper-evident Checkpoint Receipts

`createDistributedCheckpointReceipt()` records local scope, node, revision/checksum, canonical epoch and previous receipt checksum. The statement explicitly says the receipt is a tamper-evident local receipt and **not** a globally atomic ledger.

This makes the consistency guarantee precise rather than overstating the transport.

## 24. Local-first Cost Model

`DistributedService` defaults to `enabled=false`. Distributed publish/claim/ack/replay/health paths fail with `DISTRIBUTED_MODE_NOT_ENABLED` until explicitly activated.

Therefore a small Consumer does not pay broker, lease, remote scheduling, replication or distributed evaluation cost simply because the package includes TASK-015.

## 25. Failure Model

TASK-015 explicitly handles/reports:

- duplicate delivery;
- idempotency collision;
- worker crash / expired claim;
- coordinator ownership transfer;
- stale lease/fencing token;
- request expiry;
- late result;
- policy/trust/epoch drift;
- worker revocation;
- DLQ poison events;
- replay storms;
- queue/inflight/cost pressure;
- network partition;
- missing cohort/source evidence;
- clock skew;
- rollout regression;
- incomplete Saga compensation;
- broker/checkpoint tampering.

Unknown external provider outcome remains recovery/reconciliation-required rather than guessed success.

## 26. Critic Findings Resolved During Implementation

The implementation review identified and corrected two pre-completion defects:

1. Remote Run initially accepted a valid worker lease without binding the lease scope to the exact run id. This could allow lease reuse across jobs. The final implementation requires `scope=run:<run_id>`.
2. Rollout initially recorded `soak_ms` but did not enforce elapsed soak time before promotion. The final implementation stores `soak_started_at` and blocks premature promotion.

Additional hardening added during review includes pluggable transport contract validation, distributed metric gap/SLO aggregation, explicit partition semantics, operation hash chaining and checkpoint receipts.

Blocking Critic findings after correction: `0`.

## 27. Verification Baseline

- TASK-015 DistributedOS dedicated/integration tests: `73 / 73 PASS`.
- Full BAI Development OS: `1188 / 1188 PASS`.
- JavaScript Roulette Consumer: `10 / 10 PASS`.
- Product Boundary: `PASS` after restoring the reference Consumer from the TASK-014 complete snapshot for the isolated ZIP validation environment.
- Distributed Conformance: `10 schemas / 13 shared contracts PASS`.
- Existing Security / Release / Conformance / Maintenance / Extension / Calibration Conformance: `PASS`.
- Roadmap Consolidation: required to remain lossless after final Architecture synchronization.

## 28. Completion and Future Allocation

TASK-015 completes the currently defined TASK-004〜015 roadmap. No TASK-016 is created by completion itself.

Future distributed vendor adapters, production queue implementations, real remote workers, multi-region deployments and learned-model implementations are product/provider extensions behind the completed contracts. They do not justify changing Core authority unless a later explicitly authorized roadmap decision creates a new product boundary.
