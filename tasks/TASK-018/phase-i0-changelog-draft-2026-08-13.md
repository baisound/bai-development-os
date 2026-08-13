# TASK-018 Phase I0 — Changelog Draft

Status: `FINALIZED_FOR_1_1_0 / I1_PR_MERGE_TAG_RELEASE_PENDING`

Exact release decision: `1.1.0 / v1.1.0 / stable / GIT_SOURCE_RELEASE_ONLY`.

## Added

- Context Cost Observatory and `CONTEXT_OVERFETCH` Evidence path.
- stale-safe Handoff Bootstrap and conversation-free compressed Handoff.
- Autonomous Queue with Human Gate Parking and Design-only enforcement.
- bounded Session Rotation, checkpoint, single-worker Lease and fail-closed Recovery.
- capability-probed, non-dispatching Codex Adapter.
- Safety-first Routing with normalized input/Evidence binding.
- Operator/Consumer/Handoff/Context/Codex specifications and Failure Registry.

## Safety

- no Authority creation, protected-main direct push, automatic paid/native execution, Deploy or Production Activation;
- Consumer runtime remains independent;
- TASK-036 W0/W1 and overall M3B remain unclaimed.
