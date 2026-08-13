# TASK-018 Phase G — Exact Consumer Release Decision

- Date: `2026-08-14`
- Consumer: `baisound/bai_video_production`
- Decision basis HEAD: `b30da2298a47cad49d650133b6ab2ccf78f11c29`
- Pull request: `https://github.com/baisound/bai_video_production/pull/20`
- Decision: `EXACT_CONSUMER_RELEASE_DECISION_ESTABLISHED / VERSION_0_20_0 / METADATA_FINALIZATION_AUTHORIZED`
- Version: `0.20.0`
- Annotated tag: `v0.20.0`
- Release name: `BAI Video Production v0.20.0`
- Channel: `stable`
- Release target: exact `main` merge SHA `1fc8bae6ee5bf0c63c1c7d92e21e1eb6dd966c88`

## Execution outcome — 2026-08-14

`PHASE_G_CONSUMER_RELEASE_INTEGRATION_PASS`. Metadata head `3e43b550ad3eb1db9c6b51843c0051d692c1732c` passed isolated WSL2 `805 / 805` and the fresh hosted matrix `9 / 9`. PR #20 merged at the exact target SHA above. Annotated tag `v0.20.0` dereferences to that SHA, the formal Release workflow passed, and the stable non-draft/non-prerelease GitHub Release was published. The merged feature branch was then removed remotely and locally. The claim boundary below is unchanged.

## Decision

Release the accepted Phase G increment as the backward-compatible minor release `0.20.0`. The delta from formal release `v0.19.0` adds substantial new editing, production-control and packaged desktop integration capabilities without Evidence of an intentional breaking public contract. A patch increment would understate that scope; a major increment is not justified.

This decision authorizes only release metadata finalization on the Consumer work branch and the ordered verification/integration steps below. It does not claim that the current `b30da22` commit already contains finalized `0.20.0` metadata, and it does not itself merge, tag or publish.

## Truthful release boundary

The `0.20.0` release may claim:

- TASK-010/011/012 backend native gates PASS;
- TASK-036 W2 `SHELL_INTEGRATED / PACKAGED_NATIVE_E2E_PASS` for the evidenced bounded Windows/Resolve environment;
- trusted packaged launch through ingest, cached network-free FasterWhisper, Subtitle, Human Cut Review/approval, exact Resolve apply, native Render QA and atomic EDITOR_WORK publication;
- hosted PR #20 checks PASS at decision time.

It must not claim:

- overall TASK-036 `NATIVE_VALIDATED`;
- `DESKTOP_SHELL_NATIVE_UX_PASS`;
- `MINIMUM_EDITING_PRODUCT_MVP_PASS` or M3B completion;
- clean-profile, missing-WebView2, long-path, full DPI/mixed-monitor or screen-reader PASS;
- Deploy or Production Activation.

Release notes must state that WebView2 Runtime is an installed prerequisite, a normal local install path is required, executable path length `166` passed while `245` failed, and the complete DPI/mixed-monitor/screen-reader matrix remains parked to Phase H2.

## Required execution order

1. Finalize `0.20.0` package/project/changelog release metadata on `feature/task-036-phase-g-w2` without broadening claims.
2. Re-run the required Consumer regression and hosted CI/security/release-metadata checks.
3. Merge PR #20 only when the metadata-bearing head is all green and merge policy is satisfied.
4. Verify the exact resulting `main` merge SHA and clean release state.
5. Create and push annotated tag `v0.20.0` at that exact SHA, then publish `BAI Video Production v0.20.0` on the stable channel.
6. Verify the published tag and GitHub Release against the exact merge SHA.

Any failed regression/check, changed claim boundary, non-mergeable PR, version collision or external-state drift invalidates execution and requires a new read-only decision check. Direct push to `main`, force push, paid execution, Deploy and Production Activation remain prohibited.

## Effects performed by this decision

- Consumer mutation: `false`
- PR merge: `false`
- tag creation/push: `false`
- GitHub Release creation: `false`
- Deploy / Production Activation: `false / false`

TASK-018 OS closure and its own version/tag/Release decision remain separate and blocked by Phase H2/I1 requirements.
