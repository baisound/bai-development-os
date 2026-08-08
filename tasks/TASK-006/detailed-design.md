# TASK-006 Detailed Design Record

The implementation canonical is:

`specifications/TASK-006_BAI_Development_OS_Orchestration_Automation_Foundation_Ver1.0.md`

## Design Decision

- Development profile: `DEV_4_FOUNDATION_CRITICAL`.
- Internal phases: all 15 phases from Foundation Improvement Integration Plan are retained.
- Architecture: compose TASK-004 Lifecycle/Guard and TASK-005 Knowledge rather than duplicate their authority.
- Registry: rebuildable index; explicit multi-project index added for reusable consumers.
- Runtime: probe evidence only; no UI-label inference.
- Safe automation: already-authorized + reversible + scope-bound + no external side effect can proceed without duplicate Owner confirmation.
- Dangerous action: Owner gate retained for irreversible/external/policy/publish/send/delete/global-promotion/unknown classes.
- Completion sync: verified outbox consumer is idempotent and cannot roll canonical completion back.
- Probe/fault mutation: authorization + isolated sandbox mandatory.
- Permanent model-selection policy: unchanged.

## Design Authorization

The Owner explicitly instructed movement into TASK-006 detailed design and development in the current conversation. This authorizes the bounded TASK-006 implementation while preserving TASK-004/TASK-005 authority contracts.
