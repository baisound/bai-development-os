# BAI Development OS — Post-TASK-006 Roadmap Refinement Ver.1.0

## Decision

TASK-006 completion produced orchestration hardening/productization requirements. Existing TASK-009〜014 are extended where responsibility is already clear. TASK-015 is newly reserved for Distributed Orchestration & Event Fabric because local Completion Outbox/idempotency is not a distributed coordinator and that capability does not fit cleanly inside Release, Conformance or Self-Maintenance.

## Allocation

| Task | Added future scope |
|---|---|
| TASK-009 | Crash-consistent derived sync/Registry/outbox mutation, approval/outbox integrity, common sandbox/path security, runtime-output trust |
| TASK-010 | Automation/startup/approval/outbox schema compatibility, migration, bootstrap bundles, authorization-safe upgrade/downgrade |
| TASK-011 | Concurrent multi-consumer orchestration/isolation/authority/idempotency conformance |
| TASK-012 | Registry/outbox/runtime fsck, replay/DLQ, stale artifact cleanup, derived-sync repair |
| TASK-013 | Probe/resolver/startup/compiler/classifier/executor/sync/outbox plugin extension points |
| TASK-014 | Owner-gate, automation, retry, prompt compression and runtime-probe evidence calibration |
| TASK-015 | Durable distributed event fabric, leases, replay/DLQ, causal/project ordering, Saga compensation and distributed failure recovery |

All additions are `PROPOSED / NOT_STARTED / NOT_AUTHORIZED`. TASK-007 remains next.
