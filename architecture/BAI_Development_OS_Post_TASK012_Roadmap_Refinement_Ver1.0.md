# BAI Development OS Post-TASK-012 Roadmap Refinement Ver.1.0

- Effective date: 2026-08-08
- Source: completed TASK-012 MaintenanceOS implementation and independent Critic findings
- Status: ACTIVE_ROADMAP_RECORD
- Implementation authorization: NONE
- TASK-012: remains COMPLETED
- Next route: TASK-013 (`NEXT / NOT_STARTED / NOT_AUTHORIZED`)

## Decision

TASK-012 closed the common local MaintenanceOS lifecycle and intentionally left domain/provider-specific proof and reconciliation, evidence-driven maintenance-policy calibration, and distributed repair/recovery semantics to later roadmap owners. These findings are incorporated into TASK-013 through TASK-015 without reopening TASK-012 and without creating TASK-016.

## TASK-013

_Historical source: `BAI_Development_OS_Post_TASK012_Roadmap_Refinement_Ver1.0.md — TASK-013`_

Preserve TASK-013's original Domain Adapter / Plugin SDK mission and add MaintenanceOS extension points:

- Maintenance Adapter SDK for domain/provider-specific `inspect`, `verify`, `plan`, `repair`, `rollback`, `quarantine` and `reconcile` capabilities without moving domain authority into MaintenanceOS core.
- Atomic Precondition Provider contract that can prove the exact state/version/checksum/lease/ETag or equivalent condition required immediately before a repair mutation.
- Reconciliation Provider contract for opaque domain or external side effects where generic MaintenanceOS cannot infer whether a crashed operation actually occurred.
- Checkpoint/Snapshot Provider SDK for databases, object stores, package managers, cloud services and domain artifacts with explicit reversibility and retention semantics.
- Quarantine Provider SDK for domain-specific safe isolation while preserving provenance and preventing quarantined content from being mistaken for canonical state.
- Retention/Compaction Provider contract for subsystem-specific ledgers, caches, indexes and evidence stores with protected-artifact declarations.
- Drift Detector Provider SDK for semantic/domain drift that cannot be detected by generic checksum comparison alone.
- Repair Verification Provider contract that proves post-repair invariants independently from the mutating handler.
- External reconciliation adapters may read or mutate provider state only through TASK-008 IntegrationOS and its explicit external-side-effect authorization boundary.
- Provider manifests MUST declare trust level, artifact classes, authority touched, side-effect class, idempotency/replay semantics, rollback capability, sandbox requirement, resource budget and conformance tests.
- Add Maintenance Provider conformance kits covering stale-plan rejection, crash ambiguity, double execution, rollback failure, quarantine integrity and root/sandbox confinement.

**Acceptance direction:** new domain-specific maintenance/reconciliation behavior is supplied through bounded plugins with explicit proof contracts; generic MaintenanceOS never guesses opaque side-effect state and TASK-013 remains the parent Domain Adapter / Plugin SDK rather than becoming maintenance-only.

## TASK-014

_Historical source: `BAI_Development_OS_Post_TASK012_Roadmap_Refinement_Ver1.0.md — TASK-014`_

Add evidence-driven MaintenanceOS calibration while preserving fixed safety floors:

- Calibrate non-mandatory finding severity thresholds from verified recurrence, impact, repair success, rollback frequency and false-positive/false-negative evidence.
- Calibrate evidence freshness windows by subsystem volatility, criticality and change rate without allowing stale evidence to masquerade as current proof.
- Recommend maintenance cadence for fsck, drift scans, retention sweeps, replay/lease cleanup and integrity verification from observed change frequency and operational cost.
- Calibrate retention and checkpoint sizing from rollback demand, audit requirements, storage cost and recovery time objectives while never deleting protected Canonical/Authority/Trust evidence automatically.
- Measure automatic repair success, rollback success, quarantine frequency, Owner escalation yield and repeated-repair recurrence to detect ineffective repair policies.
- Detect repair loops and policy oscillation where the same finding is repeatedly fixed and reintroduced; recommend root-cause investigation or stronger conformance gates.
- Calibrate safe revalidation windows and stale-plan sensitivity from verified state-change rates; immediate required preconditions remain mandatory for mutations.
- Prioritize maintenance work by risk reduction per cost/token/time so low-value scans do not consume foundation-level governance continuously.
- Use counterfactual replay to compare alternate AUTO/OWNER/QUARANTINE classifications before policy adoption.
- Recommend when a repair should become a preventive Release/Conformance/Knowledge/Security rule instead of remaining recurring maintenance.

Mandatory floors MUST NOT be auto-weakened: Canonical/Authority/Trust mutation, destructive repair, ambiguous external state, explicit Owner gates, single-use Repair Plans, precondition revalidation, integrity verification and recovery-after-crash requirements remain fixed.

**Acceptance direction:** MaintenanceOS becomes cheaper and less noisy over time while repair authority and safety guarantees remain invariant and policy changes remain versioned, explainable and governed.

## TASK-015

_Historical source: `BAI_Development_OS_Post_TASK012_Roadmap_Refinement_Ver1.0.md — TASK-015`_

Extend the optional Distributed Orchestration & Event Fabric with MaintenanceOS coordination:

- Distributed Maintenance Worker identity, capability advertisement and attestation for adapters, repair classes, checkpoint backends and reconciliation providers.
- Distributed repair lease with owner identity, lease epoch, heartbeat and fencing token so a stale worker cannot continue a repair after ownership transfer.
- Durable globally unique Repair Execution identity and single-use semantics across machines, preserving TASK-012 replay protection under at-least-once dispatch.
- Signed fsck/finding/repair/result envelopes bound to project, plan revision, worker, policy version, environment fingerprint and correlation identity.
- Cross-machine checkpoint and quarantine coordination with explicit ownership, checksum/signature verification and protected retention state.
- Distributed revalidation immediately before mutation, including remote generation/version/ETag/lease checks where the provider supports them.
- Late-result quarantine when policy, trust, authority, artifact revision or repair ownership changed while a remote operation was in flight.
- Saga-style repair/reconciliation for multi-node state with explicit compensation; do not claim globally atomic repair when underlying systems cannot provide it.
- Partition semantics that block Canonical/Trust/Authority-sensitive repair when current lease, trust, policy or target state cannot be proven.
- Distributed external-side-effect reconciliation through authorized TASK-008 IntegrationOS adapters; ambiguous provider outcome remains RECOVERY_REQUIRED until reconciled.
- Shared maintenance cost/quota/backpressure controls so repair storms, fsck sweeps and rebuilds cannot exhaust worker or provider capacity.
- Fault matrices for coordinator crash, worker crash, duplicate dispatch, stale fencing token, partial checkpoint, split-brain, lost result, partition, reconciliation ambiguity and repair storm.
- Single-machine MaintenanceOS remains a first-class default; distributed repair is enabled only when topology actually requires it.

**Acceptance direction:** TASK-012 single-machine safety properties remain valid under remote/distributed maintenance, with fencing and evidence preventing duplicate or stale repair effects; distributed complexity is optional rather than imposed on small projects.

## Authority Boundary

- TASK-012 remains `COMPLETED`.
- TASK-013 remains `NEXT / NOT_STARTED / NOT_AUTHORIZED`.
- TASK-014 and TASK-015 remain `PROPOSED / NOT_STARTED / NOT_AUTHORIZED`.
- Domain/external reconciliation that can perform provider side effects remains behind TASK-008 IntegrationOS authorization.
- TASK-013 plugins may prove or execute bounded maintenance behavior but cannot grant Owner authority or weaken TASK-012 safety classifications.
- TASK-014 may recommend policy changes but cannot auto-weaken mandatory repair safety floors.
- TASK-015 remains optional for single-machine projects.
- No TASK-016 is created.
