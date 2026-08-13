# TASK-018 Phase G — Consumer Release Closure Evidence

- Date: `2026-08-14`
- Consumer: `baisound/bai_video_production`
- Pull request: `https://github.com/baisound/bai_video_production/pull/20`
- Metadata-bearing head: `3e43b550ad3eb1db9c6b51843c0051d692c1732c`
- Exact main merge SHA: `1fc8bae6ee5bf0c63c1c7d92e21e1eb6dd966c88`
- Annotated tag: `v0.20.0`
- Tag object: `398ff06c938044c28c588a2faa2f68fc5109ee73`
- Tag target: `1fc8bae6ee5bf0c63c1c7d92e21e1eb6dd966c88`
- Stable Release: `https://github.com/baisound/bai_video_production/releases/tag/v0.20.0`
- Release workflow: `https://github.com/baisound/bai_video_production/actions/runs/31730365365`
- Decision: `PHASE_G_CONSUMER_RELEASE_INTEGRATION_PASS`

## Ordered execution evidence

1. The exact release decision selected `0.20.0 / v0.20.0 / stable` with the W0/W1 and TASK-036 claim boundaries preserved.
2. The feature branch finalized the five canonical package/version surfaces plus the trusted launcher, Shell default, Changelog, current state, Roadmap and bounded release notes.
3. Windows focused regression passed `44 / 44`; release metadata conformance passed for `0.20.0`; `git diff --check` passed.
4. An isolated WSL2 Ubuntu ext4 checkout passed compileall and the full Consumer regression `805 / 805` after metadata finalization.
5. Commit `3e43b550ad3eb1db9c6b51843c0051d692c1732c` was pushed to PR #20. The fresh hosted matrix passed `9 / 9`, including Ubuntu and Windows Python 3.11/3.12/3.13, release metadata, dependency audit and secret scan.
6. PR #20 merged without direct main push. GitHub produced exact main merge SHA `1fc8bae6ee5bf0c63c1c7d92e21e1eb6dd966c88`.
7. Annotated tag `v0.20.0` was created only after merge. Its dereferenced remote target exactly equals the main merge SHA.
8. The repository's formal Release workflow ran against that exact SHA and passed checkout, dependency setup, pytest, compileall, build, tag/version verification and GitHub Release publication.
9. The published Release is stable, non-draft and non-prerelease. It contains the wheel `sha256:beb861614a89e13836506ec7ff02c8ae5a4c24bb6f04420f266f9705e0e4205d` and source archive `sha256:63188c2c011ce1335d3bcde9a89e0ca06938c36084e016fd114299e765a94984`.
10. The merged feature branch was deleted from origin and locally only after Release verification. Local raw/untracked Native Evidence remained preserved.

## Truthful boundary

The formal Release claims TASK-010/011/012 backend native PASS and TASK-036 W2 `SHELL_INTEGRATED / PACKAGED_NATIVE_E2E_PASS` only for the evidenced bounded environment. TASK-036 W0/W1 remains `PARTIAL / PARKED_TO_PHASE_H2`. Overall TASK-036 `NATIVE_VALIDATED`, `DESKTOP_SHELL_NATIVE_UX_PASS`, `MINIMUM_EDITING_PRODUCT_MVP_PASS`, M3B completion, Deploy and Production Activation remain unclaimed.

No paid Provider execution, credit purchase, auto-top-up change, force push, direct main push, Deploy or Production Activation occurred.

## Routing result

Phase G Consumer release integration is closed. TASK-018 remains active: Phase H2 empirical hardening and the separate I1 exact BAI Development OS closure/version/tag/Release decision are still required.
