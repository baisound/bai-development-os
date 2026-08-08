# TASK-012 — BAI Development OS Self-Maintenance, Drift Detection & Safe Auto-Repair Detailed Design Ver.1.0

## 1. Document Control

```yaml
document_id: TASK-012-SELF-MAINTENANCE
version: "1.0"
status: CURRENT_CANONICAL
task_status: COMPLETED
development_profile: DEV_4_FOUNDATION_CRITICAL
architecture_parent: BAI Development OS Architecture Ver.2.21
machine_path: specifications/TASK-012_BAI_Development_OS_Self_Maintenance_Ver1.0.md
human_companion: specifications/TASK-012_BAI_Development_OS_Self_Maintenance_Ver1.0.docx
summary_path: specifications/TASK-012_BAI_Development_OS_Self_Maintenance_Ver1.0.summary.md
```

## 2. Purpose and authority boundary

TASK-012 makes long-lived BAI Development OS state diagnosable and safely maintainable without turning a repair engine into a second source of authority. MaintenanceOS may inspect, classify, plan, checkpoint, repair verified low-risk derived state, verify, rollback and quarantine. It does not grant Lifecycle authorization, rewrite Trust, manufacture Canonical evidence, weaken Security Profiles, reinterpret external side effects or fabricate Conformance execution proof.

## 3. Internal implementation phases

1. Maintenance Finding / Fsck contracts.
2. Repair classification and Owner boundary.
3. Durable single-use execution state.
4. Checkpoint / rollback / quarantine.
5. Drift / retention / cleanup.
6. Security Journal maintenance.
7. Knowledge / Monitoring / Integration / Security adapters.
8. Release lock / installed-state maintenance.
9. Conformance evidence freshness / rebuild boundaries.
10. Critic hardening, fault tests, conformance and full regression.

## 4. Runtime module map

`src/maintenance/` contains errors/constants/util, Finding, Fsck, Repair, Checkpoint, Quarantine, Drift, Retention, built-in adapters/handlers, subsystem adapters, Service and root index. Product root exports `MaintenanceOS`; package export `./maintenance` is public.

## 5. Finding and fsck contract

A Maintenance Finding is immutable/checksummed and identifies adapter, code, severity, subject, artifact classification, repair class, risk flags, action and evidence. Severity is INFO/WARNING/HIGH/CRITICAL. Fsck executes unique adapters and returns deterministic `PASS / DEGRADED / BLOCKED`. Adapter errors fail closed. Fsck is read-only unless audit is explicitly requested.

## 6. Artifact and repair classes

Artifact classes: `CANONICAL / AUTHORITY / TRUST / DERIVED / CACHE / TEMPORARY / EXTERNAL`.

Repair classes: `NONE / AUTO_REVERSIBLE / OWNER_REQUIRED / QUARANTINE_ONLY`.

Any authority, trust, canonical, destructive/data-loss or ambiguous external-side-effect finding is elevated away from automatic repair regardless of adapter suggestion. Automatic mutation is only for bounded, reversible, verified derived/cache/temporary state.

## 7. Repair Plan integrity and Owner authorization

Repair Plans bind to Fsck report id/checksum. Owner-required execution requires an explicit non-empty `owner_authorization_ref`; a boolean is insufficient. Owner-blocked plans are not consumed, allowing later execution under valid authorization evidence.

## 8. Mandatory pre-execution revalidation

Every `AUTO_REVERSIBLE` or `QUARANTINE_ONLY` handler MUST provide `revalidate()`. Revalidation occurs immediately before mutation. Missing revalidation fails with `MAINTENANCE_REPAIR_REVALIDATION_REQUIRED`; changed precondition fails with `MAINTENANCE_REPAIR_PRECONDITION_CHANGED`. This prevents stale Repair Plans from mutating changed state.

## 9. Durable single-use execution state

Execution state is stored under `.bai-os/maintenance/executions/<repair_plan_id>.json` using exclusive creation. States record `STARTED`, `EXECUTING_OPERATION` and `COMPLETED`. A completed or abandoned plan cannot run twice. An incomplete execution returns `MAINTENANCE_REPAIR_RECOVERY_REQUIRED`; MaintenanceOS never blindly retries an operation whose side-effect outcome is unknown. Abandon requires Owner authorization reference.

## 10. Checkpoint, verification and rollback

Before a repair, a handler can create a Maintenance checkpoint containing prior file presence, bytes and checksum. Handler flow is checkpoint → execute → verify. Verification failure attempts rollback only when rollback is explicitly supported. Corrupt checkpoints are rejected rather than trusted.

## 11. Quarantine

Quarantine moves existing regular files within trusted root into `.bai-os/maintenance/quarantine/<record>/...` with original path, reason and checksum evidence. Path/Symlink escape is rejected by SecurityOS. Missing quarantine handlers fail; they never report a false successful quarantine.

## 12. Drift detection

Representation drift compares required MD/DOCX/Summary/Registry/schema/template surfaces. Missing rebuildable representation can be a reversible repair candidate. Conflicting semantic checksums are Canonical-sensitive semantic drift and require Owner review. A deterministic drift fingerprint supports trend/comparison without making the fingerprint authoritative content.

## 13. Retention, cleanup and compaction safety

Retention plans may remove only expired, unprotected derived/cache/temporary material. Canonical, Authority, audit, rollback-required and policy-retained evidence remains protected. Monitoring/Knowledge/Release compaction must preserve provenance and verification contracts.

## 14. Security Journal recovery

Stale PREPARED transactions may be rolled back automatically only where Journal semantics prove target mutation has not begun. Interrupted COMMITTING transactions are CRITICAL/Canonical and Owner-required. Maintenance does not choose rollback versus completion by guess.

## 15. Knowledge maintenance adapter

Knowledge repository verification covers revision/current/event/usage/Pack integrity using existing Knowledge verification. Canonical Knowledge corruption is Owner-required. Rebuildable derived indexes/caches may be regenerated only from verified canonical Knowledge. Pending transaction state remains governed by Security Journal evidence.

## 16. Monitoring and Integration maintenance adapters

Monitoring ledger corruption is treated as derived/audit-sensitive evidence and may be quarantined/rebuilt only where retained verified source permits it. Integration audit corruption is Authority-sensitive and Owner-required. External call ambiguity is never resolved by assuming success or failure.

## 17. Security maintenance adapter

Security signed-ledger or Trust corruption is CRITICAL/Owner-required. Security repository fsck can classify transactions, stale replay state, secret leases and signed evidence, but automatic repair cannot replace Trust anchors or weaken mandatory Security floors.

## 18. Release maintenance and stale lock model

Release operation lock format is upgraded to structured version 1.1 containing lock name, PID, host, random owner token and acquisition time. Automatic reclaim requires same verified host, owner token, valid PID, process confirmed dead and sufficient age. Legacy PID-only or unknown-host locks are ambiguous and not auto-deleted. Release state adapter detects missing rollback checkpoint/attestation inconsistency but never fabricates rollback history.

## 19. Conformance evidence maintenance

Certification checksum, freshness and environment fingerprint may be inspected. Stale REAL evidence can trigger re-execution proposal but is never silently preserved as current proof. Maintenance may rebuild Certification only from immutable verified execution evidence and MUST NOT promote DECLARED/SIMULATED evidence into REAL/SANDBOX.

## 20. Maintenance Service and audit

Maintenance Service exposes inspect → plan → repair. Inspection is side-effect-free by default. Explicit audit mode may append Maintenance events through integrity-protected logging after fsck, avoiding a verifier that changes the state it is verifying by default.

## 21. Critic findings resolved

1. False quarantine success when handler absent → explicit FAILED.
2. Fsck mutated inspected root → read-only default.
3. Repair Plan replay/double execution → durable single-use state.
4. Interrupted repair blindly retriable → RECOVERY_REQUIRED.
5. Owner gate boolean-only → owner_authorization_ref.
6. Owner-blocked plan consumed → preflight leaves it reusable.
7. Auto repair stale-state race → mandatory revalidate immediately before mutation.
8. Release stale-lock timeout/PID ambiguity → structured lock and conservative reclaim.
9. CACHE classification accidentally Owner-required → derived/cache/temporary classification corrected.
10. Conformance checksum noncanonical → canonical deterministic hash.
11. COMMITTING transaction automatic completion risk → kept Owner-required/fail-closed.

Blocking Critic findings: `0`.

## 22. Verification baseline

- Maintenance dedicated tests: `75 / 75 PASS`.
- Full BAI Development OS: `898 / 898 PASS`.
- JavaScript Roulette Consumer: `10 / 10 PASS`.
- `check:maintenance`: PASS, `7 schemas / 6 shared contracts`.
- Security: PASS, 9 schemas.
- Release: PASS, 8 schemas.
- Conformance: PASS, 10 schemas.
- Roadmap: `48 / 48 PASS`.
- Product Boundary: PASS.

## 23. Accepted residual and future ownership

TASK-013 owns provider/domain-specific atomic preconditions, rebuilders and reconciliation plugins. TASK-014 owns adaptive freshness/retention/cadence/threshold calibration. TASK-015 owns distributed repair leases, fencing, remote recovery and cross-machine reconciliation. Opaque domain/external side effects remain unresolved until a domain-specific reconciler proves state; generic MaintenanceOS fails closed.

## 24. Completion route

TASK-012 is `COMPLETED`. TASK-013 — Domain Adapter / Plugin SDK is `NEXT / NOT_STARTED / NOT_AUTHORIZED`. TASK-014〜015 remain `PROPOSED / NOT_STARTED / NOT_AUTHORIZED`.
