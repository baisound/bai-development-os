# TASK-018 Phase G — W2 Context Cost and Merge Gate Decision

- Date: `2026-08-14`
- Consumer: `baisound/bai_video_production`
- Consumer branch: `feature/task-036-phase-g-w2`
- Consumer HEAD: `b30da2298a47cad49d650133b6ab2ccf78f11c29`
- Consumer PR: `https://github.com/baisound/bai_video_production/pull/20`
- Decision: `W2_CONTEXT_ACCOUNTING_PASS / W0_W1_REMAINDER_PARKED / PR20_MERGE_BLOCKED_BY_RESTART_AND_RELEASE_ORDER`

## Accepted progress

- TASK-036 W2 reached `PACKAGED_NATIVE_E2E_PASS` on a dedicated Windows/Resolve sandbox route.
- The packaged route completed trusted Project launch, ingest, cached network-free local ASR, Subtitle, Human Cut Review/approval, exact Resolve apply, native Render QA and atomic EDITOR_WORK publication.
- Consumer WSL2 Ubuntu regression passed `805 / 805`; focused atomic handoff/launcher/runtime tests passed `25 / 25`.
- PR #20 is Ready for review and `MERGEABLE`; all nine hosted CI/security/release-metadata checks passed at W2 commit `77a2cc9`, and the documentation-only parking commit `b30da22` triggers a fresh required CI run.
- BAI Development OS focused Context Control passed `43 / 43`; the isolated WSL2 ext4 full regression passed `1423 / 1423`; Document Registry verification passed `666 / missing 0 / hash-size mismatch 0` after the restart bootstrap was registered.
- The untested W0/W1 environment matrix is formally parked to H2 at Consumer commit `b30da22`; those cases remain partial and are not treated as PASS.

## Context Cost checkpoint

The machine-readable record is `phase-g-w2-pilot-context-cost-checkpoint-2026-08-14.json`.

- estimated input tokens: `24,215` (`CHARACTER_HEURISTIC`)
- provider-reported input tokens: `null`
- provider-reported cached tokens: `null`
- provider-reported output tokens: `null`
- billed tokens: `null`
- prior Phase G records: `6,818` estimated tokens
- Consumer canonical state/roadmap: `14,895` estimated tokens
- TASK-036 reports/native Evidence: `2,502` estimated tokens
- duplicate/stale/avoidable ratio: `0 / 0 / 0`
- `CONTEXT_OVERFETCH`: none in the bounded recorded source set

This is a W2 accounting checkpoint, not the final G-E18 comparison. The required post-W2 conversation-free restart has not run, so its bootstrap cost and any measured reduction remain `PENDING`; no estimate is presented as provider or billing data.

## Merge gate

PR #20 must not be merged yet. The Consumer Roadmap Ver.1.13 orders the remaining work as:

1. capture post-W2 conversation-free restart and final Pilot Context Cost Evidence;
2. make the exact release decision;
3. finalize release metadata if authorized;
4. rerun regression/CI and merge through PR.

The prior restart Evidence audited PR #19 at `1f328776e980a08b59b7a9fd62c5c30ffbba01d5`; it truthfully reconstructed W2 as not wired. It cannot prove recovery of the new W2 state at `77a2cc9`. A new conversation/run with no inherited chat history is therefore required.

## Current boundary and next safe unit

- W0/W1 remain partial, while their clean-profile, missing-WebView2, long-path, full DPI/mixed-monitor and screen-reader remainder is formally parked to H2 without a PASS claim.
- Overall TASK-036 `NATIVE_VALIDATED`, `DESKTOP_SHELL_NATIVE_UX_PASS` and `MINIMUM_EDITING_PRODUCT_MVP_PASS` remain unclaimed.
- Package/latest formal release remains `0.19.0`; `0.20.0` remains only a candidate.
- No merge, tag, GitHub Release, Deploy, Production Activation or paid-provider execution is authorized by this checkpoint.
- Next safe unit: use `phase-g-post-w2-conversation-free-restart-bootstrap-2026-08-14.md` in an independent fresh task/run, then produce the final Context Cost comparison.
