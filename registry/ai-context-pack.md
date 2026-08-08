# BAI Development OS — AI Context Pack

## Current authority

- Architecture: `BAI Development OS Architecture Ver.2.27 CURRENT_CANONICAL`
- Product root: `/home/baisound/bai-development-os`
- Reference Consumer: `/home/baisound/projects/javascript-roulette`
- TASK-004〜015: `COMPLETED`
- Next Task: `TASK-016 Resilience, Recovery & Scalability Certification OS / NEXT / NOT_STARTED / NOT_AUTHORIZED`
- Roadmap authority: Architecture Ver.2.27 Part XV, `55 / 55 PASS`

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
- Full OS: `1188 / 1188 PASS`
- Consumer: `10 / 10 PASS`
- Distributed Conformance: `10 schemas / 13 shared contracts PASS`
- Roadmap: `55 / 55 PASS`
- Security / Release / Conformance / Maintenance / Extension / Calibration / Product Boundary: PASS
- Blocking Critic findings: `0`

## Loading guidance

Use summaries first. For distributed behavior, start with `tasks/TASK-015/TASK-015.summary.md`, then load the TASK-015 canonical specification and only the relevant `src/distributed/` module/tests. Part XV is current roadmap scope provenance; Parts XVI〜XXVII record completion history; Part XXVIII records the explicit Post-TASK-015 TASK-016 allocation. Do not load the complete Architecture by default.

For local-only work, do not load or enable DistributedOS unless topology requires it. For exact subsystem authority, load the owning TASK-004〜014 canonical. A distributed envelope, worker advertisement, queue receipt, quorum-like agreement or high confidence score is coordination/evidence only and never replaces Owner/Policy/Security authority.


## TASK-016 planning context

TASK-016 is not authorized for implementation. Its bounded purpose is to certify the already-completed OS under reproducible failure, recovery, mixed-version and sustained-load scenarios. Prefer deterministic simulation first; real cluster/lab execution is optional evidence and requires existing Integration/Extension authorization. Production infrastructure is not TASK-016 authority.
