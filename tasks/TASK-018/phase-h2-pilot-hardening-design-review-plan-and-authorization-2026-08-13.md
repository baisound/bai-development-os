# TASK-018 Phase H2 — Pilot Hardening Design, Review Plan and Authorization

Date: `2026-08-13`
Authorization: `OWNER_AUTHORIZED_CONTINUOUS_P0_DEVELOPMENT`
Status: `H2A_EMPIRICAL_CHECKPOINT_AUTHORIZED / H2B_TASK036_EVIDENCE_PENDING`

## Purpose

Apply only observations proven by the real BAI VIDEO PRODUCTION M3A Pilot. This bounded H2A checkpoint may harden context loading, supersession handling, external-state freshness and branch/session rotation. It must not infer TASK-036 completion or activate model/provider/cadence policy from one sample.

## Allowed Files

- exact TASK-018 H2 design, Evidence, Critic and Judge records;
- `registry/current-state.md`;
- `registry/ai-context-pack.md`;
- `registry/context-loading-rules.md`;
- `registry/document-registry.yaml`;
- I0 Evidence/readiness records affected by the accepted Pilot checkpoint.

## Builder design

1. Bind the accepted Consumer checkpoint to exact main SHA and PR checks.
2. Prefer current-state, Roadmap Ver.1.12 and latest Evidence over superseded project summaries/frontier documents.
3. Load raw native artifacts only for a specific discrepancy; normal restart uses sanitized Evidence.
4. Reverify GitHub PR/branch state instead of trusting a repository sentence about a future PR step.
5. Rotate from the completed M3A branch to a dedicated TASK-036 W2 branch after all-green merge.
6. Compare Context Cost honestly: estimated values only; observed/cache/output/billed usage remains unavailable.
7. Do not activate model choice, polling cadence or Knowledge promotion from this single Pilot checkpoint.

## Gate

`H2A_PILOT_HARDENING_CHECKPOINT_PASS` requires accepted native/regression/restart/Context Evidence, no false TASK-036/M3B claim, deterministic restart routing and unresolved Critical/High `0/0`. Full `H2_EMPIRICAL_HARDENING_PASS` still requires TASK-036 W2 and a final empirical assessment.
