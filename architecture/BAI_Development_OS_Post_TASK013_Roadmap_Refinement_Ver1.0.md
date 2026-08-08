# BAI Development OS Post-TASK-013 Roadmap Refinement Ver.1.0

- Effective date: 2026-08-08
- Source: completed TASK-013 ExtensionOS implementation and Critic findings
- Status: ACTIVE_ROADMAP_RECORD
- TASK-013: remains COMPLETED
- Integration rule: no new TASK-016; residuals are absorbed into TASK-014 and TASK-015.

## TASK-014

Add ExtensionOS evidence-driven calibration without moving execution authority into learned policy:

- Measure Provider success/failure/timeout/cancellation/throttling, latency, concurrency pressure, payload size, resource-budget exhaustion and Capability Broker denial reasons by Extension/capability/version.
- Recommend advisory timeout, concurrency and resource-budget values from verified REAL/SANDBOX evidence; insufficient evidence remains explicit and cannot be replaced by self-declaration.
- Compare equivalent Provider implementations on verified cost, latency, reliability and conformance evidence as advisory routing input only; CalibrationOS cannot silently replace the selected Provider or bypass Project Policy.
- Measure authorization/permission friction and distinguish redundant denials from prevented unsafe execution without weakening external-side-effect authorization, sandbox or Capability Broker requirements.
- Track trust/conformance freshness, upgrade/revoke/disable recovery outcomes and implementation-checksum churn; recommend revalidation or sandboxing when evidence becomes stale or unstable.
- Detect repeated Extension failure loops, unstable upgrades, noisy optional hooks, artifact-gate false blocks and ineffective Domain Pack recommendations; propose targeted Conformance/Test/Policy improvements.
- Shadow and counterfactual replay Extension recommendations before activation and bind results to exact Policy Candidate checksum/version.
- OFFICIAL/COMMUNITY/PROJECT_LOCAL classification never becomes execution trust through calibration. In-process trust still requires independent checksum-pinned proof; sandbox-required capability remains sandbox-required.
- Mandatory floors remain immutable: Core Authority cannot be overridden, Manifest cannot self-grant authority, Capability Broker mediation cannot be disabled, external side effects remain authorization-bound and mandatory Pack/Security floors cannot be learned away.

**Acceptance direction:** ExtensionOS becomes cheaper and more reliable from evidence while trust, authorization, sandbox and Core Authority boundaries remain invariant.

## TASK-015

Add optional distributed ExtensionOS coordination only for topologies that require remote workers or multiple machines:

- Distributed Registry replication uses version/checksum/epoch metadata and never treats eventually replicated state as stronger authority than the canonical Registry owner.
- Remote Extension Worker identity, capability advertisement, Provider implementation checksum and trust attestation are verified before scheduling.
- Distributed capability execution carries correlation/idempotency identity, policy version, Manifest checksum, authorization binding, deadline/cancellation and resource budget.
- Lease/fencing semantics prevent stale workers from continuing capability execution after ownership transfer; late results are quarantined when policy, trust, Manifest or Provider state changed in flight.
- Shared quotas/backpressure prevent one Extension/provider/project from exhausting remote worker, provider or Cost Guard capacity.
- Remote sandbox execution preserves the same Capability Broker and external-side-effect boundary as local execution; distribution never becomes an authority bypass.
- Registry/Provider rollout supports staged propagation and rollback evidence instead of assuming globally atomic upgrade.
- Failure matrix covers coordinator crash, worker crash, duplicate dispatch, stale fencing token, partition, late result, provider mismatch, trust rotation and repair/reconciliation ambiguity.
- Single-machine ExtensionOS remains the default and must not inherit distributed coordination cost when topology does not require it.

**Acceptance direction:** TASK-015 may distribute Extension execution without weakening TASK-013/TASK-014 local safety, while small projects keep the simpler single-machine path.
