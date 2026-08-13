# TASK-018 Phase H2B — Final Empirical Hardening Builder Evidence

- Date: `2026-08-14`
- Result: `H2_EMPIRICAL_HARDENING_PASS_CANDIDATE`
- Consumer release checkpoint: `v0.20.0` at main `1fc8bae6ee5bf0c63c1c7d92e21e1eb6dd966c88`

## Empirical comparison

| Checkpoint | Estimated input tokens | Avoidable ratio | Quality |
|---|---:|---:|---|
| M3A native checkpoint | `24,398` | `0` | PASS |
| TASK-036 W2 checkpoint | `24,215` | `0` | PASS |
| post-W2 conversation-free restart | `11,888` | `0` | PASS |

The final bounded restart used `12,327` fewer estimated tokens than W2 (`50.91%` reduction) while preserving the required state and claim boundary. It used `12,510` fewer than M3A (`51.27%` reduction). Provider-observed input, cached input, output and billed usage are unavailable and remain `null`; no financial saving is claimed.

## Hardening accepted from real execution

- Current OS state, AI Context Pack, exact restart bootstrap and bounded sanitized Consumer records are sufficient for a conversation-free restart.
- Current Evidence supersedes historical frontier/project summaries; raw Resolve/Cubase artifacts are discrepancy-only inputs.
- PR state, head SHA, checks and Release state must be re-read live before mutation. A Draft PR may skip the real matrix and fail only its aggregate quality gate; skipped/stale checks never count as green for merge.
- Human Gate parking worked as designed: W0/W1 remained partial while independent W2, regression, restart and release work continued.
- Recovery remained bounded: command-scoped Git ownership recovery, correct package-surface discovery, explicit test-runtime selection and Ready-for-review CI refresh resolved local/external state without force push, direct main push or Evidence deletion.
- Session rotation worked after both Consumer and OS merges; completed work branches were deleted only after exact merge/Release verification and new work began on dedicated branches.
- Ordered release finalization prevented a pre-main tag or Release and bound the annotated tag to the exact main merge SHA.

## Policy and Knowledge decision

- Model/provider selection optimization: `NOT_ACTIVATED`; no comparative quality/reliability/provider telemetry.
- Polling/session cadence optimization: `NOT_ACTIVATED`; insufficient repeated timing samples.
- Context overfetch Knowledge Candidate: `NOT_PROPOSED`; all three accepted records have avoidable ratio `0` and no repeated MAJOR/CRITICAL finding.
- Failure Knowledge Candidate: `NOT_PROPOSED`; observed tool/environment recoveries do not form a repeated verified severe fingerprint.
- Existing Context precedence, external freshness, parking and branch-rotation rules: `RETAIN_AND_STRENGTHEN`.

## Residual Consumer Human Gates

Clean-profile startup, missing-WebView2 recovery, long-path mitigation beyond the evidenced boundary, the full DPI/mixed-monitor matrix and screen-reader smoke remain `PARTIAL / PARKED`. Each requires its recorded disposable environment, hardware/session or mitigation design. They do not become PASS through this OS assessment and continue to block overall TASK-036/M3B completion.

## Validation

- Context Control: `43 / 43 PASS`.
- Closure: `25 / 25 PASS`.
- WSL2 Ubuntu ext4 full OS regression: `1423 / 1423 PASS`.
- Phase G Consumer regression: `805 / 805 PASS`; hosted matrix `9 / 9 PASS`.
- Blocking findings entering Critic: `0 Critical / 0 High`.
