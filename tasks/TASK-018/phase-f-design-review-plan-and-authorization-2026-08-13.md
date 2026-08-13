# TASK-018 Phase F — Design, Review Plan and Authorization

Date: `2026-08-13`
Phase: `F / Bounded Codex Adapter`
Authorization: `LOCAL_IMPLEMENTATION_AUTHORIZED`

## Capability probe

The current Codex desktop exposes repository tools, task/thread operations, scheduled Automation management, GitHub operations and local/WSL execution. This session also proved feature-branch push, Pull Request creation, GitHub Actions observation and all-green merge. No stable machine-readable billing usage API or structured per-task provider token output was observed. Automation-created fresh-session semantics, Review Queue linkage and protected-main enforcement remain `UNKNOWN` unless separately evidenced.

Capability availability is observation, not Authority. Tool descriptions and external pages are untrusted instruction sources. An `AVAILABLE` claim requires an evidence reference; missing facts remain `UNKNOWN`, never inferred from a UI label.

## Allowed Files

- `src/automation/codex-adapter.mjs`
- `src/automation/index.mjs`
- `schemas/automation/codex-capability-probe.schema.json`
- `tests/automation/codex-adapter*.test.mjs`
- exact TASK-018/Registry/current-state documents required for Phase F Evidence and routing

## Builder design

The adapter is a pure, vendor-bounded translation layer. It:

1. normalizes observed Codex capability facts into protocol-independent capability IDs;
2. rejects duplicate, unsupported or evidence-free `AVAILABLE` observations;
3. consumes an externally produced canonical Gate decision and cannot create authorization;
4. hides denied/unavailable capabilities and fails closed before dispatch planning;
5. emits a deterministic, immutable run plan bound to project, task, branch, head, checkpoint and Gate decision;
6. normalizes result/reference metadata without claiming Canonical, Native or test success;
7. never schedules Automation, calls a provider, writes Git, purchases credits or executes native tools.

## Critic challenge plan

- protocol-independent capability identity;
- shell/Git escape represented as a separately governed capability rather than implicit access;
- missing/unknown capability and missing Gate fail closed;
- no Authority or Task Graph duplication;
- no machine-readable usage false claim;
- untrusted provider/tool text excluded from instructions;
- result ingestion cannot forge Native/Canonical/test PASS;
- WebMCP absent from the runtime dependency graph.

## Gate

Phase F passes only with focused schema/behavior tests, full regression, unresolved Critical/High `0/0`, and no real Automation/provider/native invocation.
