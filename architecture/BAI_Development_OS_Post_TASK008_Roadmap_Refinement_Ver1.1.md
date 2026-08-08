# BAI Development OS — Post-TASK-008 Roadmap Refinement Ver.1.1

- Effective date: 2026-08-08
- Source: completed TASK-008 External Integration implementation and Critic findings
- Status: ACTIVE_ROADMAP_RECORD
- Implementation authorization: NONE
- TASK-008: remains COMPLETED
- Next route: TASK-009 (`NOT_STARTED / NOT_AUTHORIZED`)

## Decision

TASK-008-derived productization work is assigned to existing TASK-009〜015. No TASK-016 is created because the identified capabilities fit the existing Security, Release, Conformance, Self-Maintenance, Plugin SDK, Calibration and Distributed Event responsibilities.

## Allocation

| Task | Added scope |
|---|---|
| TASK-009 | Credential/Vault lifecycle, signing, durable webhook replay, connector sandbox/egress/DLP, connector supply-chain integrity |
| TASK-010 | Connector SemVer/compatibility matrix, contract tests, canary/rollback, provider/API and credential-reference migration |
| TASK-011 | Multi-project/tenant isolation, quota fairness, real-provider conformance, webhook ownership/routing |
| TASK-012 | Integration fsck, audit/idempotency reconciliation, Cost reservation repair, dead-letter/replay, derived-state rebuild |
| TASK-013 | Connector SDK, auth strategy plugins, pagination/batch/streaming/webhook helpers, capability negotiation and conformance kit |
| TASK-014 | Adaptive retry/backoff/timeout/rate/circuit-breaker/provider-health and authorization-friction calibration |
| TASK-015 | Distributed idempotency/rate quotas/webhook queue/worker leases/cancellation/cost coordination |

TASK-015 remains optional; lightweight local IntegrationOS remains the default for simple projects.
