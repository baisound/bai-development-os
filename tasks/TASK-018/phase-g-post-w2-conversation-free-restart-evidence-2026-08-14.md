# TASK-018 Phase G — Post-W2 Conversation-free Restart Evidence

- Date: `2026-08-14`
- Audit task/run: `019ffc2c-12dc-7891-af27-837a2eeffdce` / `codex-phase-g-post-w2-20260814-root-01`
- OS repository HEAD before Evidence write: `f3617da991d580f5ea1391581652a9012635521a`
- Consumer: `baisound/bai_video_production`
- Consumer branch: `feature/task-036-phase-g-w2`
- Consumer HEAD: `b30da2298a47cad49d650133b6ab2ccf78f11c29`
- Consumer PR: `https://github.com/baisound/bai_video_production/pull/20`
- Decision: `POST_W2_CONVERSATION_FREE_RESTART_PASS`

## Independence and source record

This run received only the Owner request naming the three ordered OS sources. It did not receive a prose summary copied from the originating Phase G conversation. Repository state, the bootstrap, the three bounded Consumer reports and current read-only Git/GitHub state were sufficient to reconstruct the checkpoint.

| Order | Source | SHA-256 | Estimated tokens |
|---:|---|---|---:|
| 1 | `registry/current-state.md` | `06b89d06fa27417c767f54d61f13210f6c5ef37af9f0e72a0c71221a1be32626` | 3,217 |
| 2 | `registry/ai-context-pack.md` | `3187fd738f48646d8afafc86bbea44c8ff0849b065dcfe08d0c6ad274cedbf37` | 2,467 |
| 3 | `tasks/TASK-018/phase-g-post-w2-conversation-free-restart-bootstrap-2026-08-14.md` | `e019bd8b59b64291dc3ad4959c181073890dacfa9055875f44f493b9bb136ec5` | 839 |
| 4 | Consumer `docs/ai-team/current-state.md` | `42ba1f77d310102e4eebe54155d266e7e88f3523d3a9209bb35632cdb7729b3c` | 3,284 |
| 5 | Consumer `docs/ai-team/tasks/TASK-036/phase-g-w0-w1-parking-decision-2026-08-14.md` | `77225d46d4ab077605f726b93fff5ef4a4917b55a18a7566338769cf9624bfa7` | 849 |
| 6 | Consumer `docs/ai-team/tasks/TASK-036/phase-g-w2-runtime-binding-report.md` | `dcf5035ee7ffa6a3e3453647b35be3262cabc38f4f9ab57592345f629094e993` | 1,232 |

The three Consumer hashes exactly match the bootstrap. The full Consumer Roadmap, `PROJECT.md` and machine Evidence were not needed to decide the restart audit; bounded release-order excerpts were consulted only after the audit passed to make the separately recorded release decision.

## First read-only action and recovery

The first action queried OS and Consumer repository roots, branch, HEAD, status/remotes, Consumer package version/tags, PR #20/checks and latest GitHub Release. The OS query recovered clean local `main` at `f3617da991d580f5ea1391581652a9012635521a`. The Consumer Git portion initially stopped because Git rejected the sandbox account as a dubious owner, and the initial package probe incorrectly expected a root `package.json`.

No repository configuration was changed. The retry used command-scoped `git -c safe.directory=D:/BAI/TASK007`, read the Python package version from `pyproject.toml`, and performed GitHub reads with the authenticated host configuration. This recovered the required state without Consumer mutation.

## Expected versus recovered state

| Item | Expected | Recovered | Result |
|---|---|---|---|
| OS local/remote `main` | current canonical checkout | local and GitHub `main` both `f3617da991d580f5ea1391581652a9012635521a` | PASS |
| Consumer branch | `feature/task-036-phase-g-w2` | exact match | PASS |
| Consumer HEAD / PR head | `b30da2298a47cad49d650133b6ab2ccf78f11c29` | local HEAD and PR #20 head exact match | PASS |
| Consumer tracked/staged diff | no tracked mutation required | both empty; 75 pre-existing untracked native artifacts preserved | PASS WITH OBSERVED UNTRACKED STATE |
| PR #20 | open unless GitHub proves otherwise | `OPEN`, `MERGEABLE`, not merged, nine checks PASS | PASS |
| package/latest formal release | `0.19.0` / `v0.19.0` | `pyproject.toml` `0.19.0`; latest Release and newest remote tag `v0.19.0` | PASS |
| TASK-010/011/012 native gates | PASS | recovered as PASS from current Consumer state | PASS |
| TASK-036 W2 | `PACKAGED_NATIVE_E2E_PASS` | exact claim recovered | PASS |
| TASK-036 W0/W1 | `PARTIAL / PARKED_TO_PHASE_H2` | exact claim recovered; no parked case promoted | PASS |
| Overall TASK-036 / M3B | unclaimed | `NATIVE_VALIDATED`, `DESKTOP_SHELL_NATIVE_UX_PASS` and `MINIMUM_EDITING_PRODUCT_MVP_PASS` remain unclaimed | PASS |

## Context usage fields

- estimated input tokens: `11,888` (`CHARACTER_HEURISTIC`)
- provider-reported input tokens: `null`
- provider-reported cached input tokens: `null`
- provider-reported output tokens: `null`
- billed tokens: `null`
- duplicate/stale/avoidable ratio: `0 / 0 / 0`

Unknown provider and billing values remain `null`; none is represented as zero or inferred from the character estimate.

## Boundary and result

No Consumer file, Git ref, PR, release metadata, tag or GitHub Release was changed. No paid execution, Deploy or Production Activation occurred. The audit has no hidden dependency on the originating conversation and is `PASS`. This result authorizes only the subsequent final Context Cost comparison and exact release decision recorded in separate durable artifacts.
