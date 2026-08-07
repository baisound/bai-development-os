# TASK-004 Phase 2 — Recovery Control Implementation and Verification

## Scope
Implemented Resume Checkpoint, PAUSED/BLOCKED/STALLED distinctions, Emergency Stop resume authority, state-specific Resume evidence, Rollback planning, and Canonical Lifecycle integration.

## Runtime
- `src/lifecycle/recovery/index.mjs`
- Extended `src/lifecycle/phase1/index.mjs` with explicit `operation_domain: RECOVERY` transitions while preserving legacy Phase-1 behavior.
- `schemas/lifecycle/resume-checkpoint.schema.json`

## Safety properties
- Checkpoints are checksum-bound and invalidate on Status revision, Phase, Git branch/commit, environment, authorization, budget, canonical source, or expiry changes.
- BLOCKED resume requires verified condition resolution.
- STALLED resume requires environment recovery, hypothesis change, or handoff.
- PAUSED resume requires Owner direction or scheduled-time evidence.
- Emergency Stop resume always requires explicit Owner authorization.
- Irreversible/external rollback requires compensating action and authorization.

## Verification
Positive, negative, tamper, invalidation, resume-condition, rollback, and Canonical Store integration tests implemented under `tests/lifecycle/recovery/` and `tests/integration/task004-late-phases.test.mjs`.

Result: `PHASE_2_TECHNICALLY_COMPLETED`
