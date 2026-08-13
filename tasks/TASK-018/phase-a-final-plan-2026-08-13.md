# TASK-018 Phase A — Final Plan

Status: `FINAL_PLAN_PASS`

## Roadmap and pause precondition

The canonical supplement `architecture/BAI_Development_OS_Codex_Autonomy_P0_Roadmap_Refinement_Ver1.0.md` inserts TASK-018 at P0 and pauses TASK-017 at clean checkpoint `07af447`. The pending TASK-017 transport patch remains preserved and unapplied.

## Implementation order

1. Context Cost Observatory.
2. Handoff Bootstrap.
3. Queue / Human Gate Parking.
4. Session Rotation.
5. Bounded Codex Adapter.
6. BAI VIDEO PRODUCTION Pilot under separate Consumer/native authority.
7. Hardening / Knowledge loop.

## Balanced Execution

- Maximum two Critic/fix cycles per bounded Phase.
- Required tests PASS and unresolved Critical/High `0/0` permits advancement.
- Medium/Low findings block only when they affect acceptance, Authority, Security or integrity; otherwise record them as residual/follow-up.
- Re-review requires changed implementation/evidence or new material risk.
- Cycle-cap exhaustion becomes an explicit escalation, not another automatic loop.

## Phase B Allowed Files

- `src/context-control/index.mjs`
- `src/context-control/context-cost-observatory.mjs`
- `schemas/context-control/context-cost-record.schema.json`
- `tests/context-control/context-cost-observatory.test.mjs`
- `tests/context-control/context-cost-schema.test.mjs`
- `tasks/TASK-018/**`
- `architecture/BAI_Development_OS_Codex_Autonomy_P0_Roadmap_Refinement_Ver1.0.md`
- `registry/current-state.md`
- `registry/ai-context-pack.md`
- `registry/context-loading-rules.md`
- `registry/document-registry.yaml`
- `registry/operational-improvements.md`
- `PROJECT.md`
- `README-AI.md`

TASK-016/TASK-017 historical artifacts, Consumer/native artifacts, Release/Deploy/Tag surfaces and Phase C+ source modules are protected.

## Phase B contracts

- Pure deterministic measurement; no file/network/provider reads.
- Canonical checksum excludes its own checksum field.
- Estimated, provider-observed and billed usage use distinct nullable fields.
- Unavailable values remain `null`, never substituted with zero.
- Quality FAIL produces efficiency score zero; unknown quality produces unavailable efficiency.
- Duplicate/stale/unused avoidable ratios produce `CONTEXT_OVERFETCH` findings under validated policy thresholds.

## Validation and exit

Unit/negative/schema contract tests, ContextControl regression, impacted Context Guard/Cost Guard/Governance/Automation regression, full `npm test`, `git diff --check`, Allowed Files inspection and secret-safe evidence are required before `CONTEXT_OBSERVABILITY_MVP_PASS`.

Rollback removes/disables the new pure Observatory API without changing existing ContextControl behavior. Stop on authority conflict, unknown local changes, out-of-scope changes, unclassified test failure, secret exposure, paid/native need, Deploy/Production request, or direct-main-push request. Tag/Release are deferred to post-completion Closure and do not authorize Phase B publication by themselves.
