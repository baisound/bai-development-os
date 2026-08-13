# BAI Development OS Codex Automation Adapter Specification Ver.1.0

Status: `CURRENT_TASK018_OPERATIONAL_CONTRACT`

## Scope

The adapter maps OS Core plans to Codex-specific capability facts and normalizes results. It contains no business logic, owns no Authority and performs no dispatch in the implemented P0 boundary.

## Capability probe

Providers are `CODEX_AUTOMATION` or `CODEX_MANUAL`; environments are local desktop, cloud or unknown. Capability IDs are protocol-independent dotted identifiers. `AVAILABLE` requires trusted observed/provider Evidence; untrusted descriptions cannot prove availability. Probe content is deterministic, sorted, immutable and checksum-bound.

## Gate and discovery

Discovery requires a checksum-valid external Gate decision with Authority verified, Safety Floor passed and explicit allowed/denied capabilities. Denied, unavailable and unknown capabilities are absent. Shell access cannot expand this set.

## Bounded run plan

A plan binds project, Task, branch, HEAD, checkpoint/checksum, Gate decision/checksum, capability probe checksum, capability ID and root prompt reference. Previous-conversation dependency is forbidden and `dispatch_performed` is always `false`.

An external executor may dispatch only after its own current Authority, credential, network, paid/native and schedule gates. The adapter never purchases credits, changes top-up, deploys, releases or mutates a Consumer native application.

## Result normalization

Statuses are PASS, FAIL, PARKED or UNKNOWN. PASS or test PASS requires Evidence. Normalized results are `canonical: false`, `native_evidence: false` and `requires_judge: true`. A review-queue reference is metadata, not approval.

## Scheduling and recovery

Initial topology is one coordinator/worker with an exact Session Lease. No unconditional polling is required. Duplicate runs, provider/usage limits, stale leases and missed schedules suspend or replan without duplicate dispatch. Cadence optimization waits on empirical Pilot Evidence.
