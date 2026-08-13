# TASK-018 Phase I1 — Exact BAI Development OS Release Decision

- Date: `2026-08-14`
- Repository: `baisound/bai-development-os`
- Decision basis main: `16991d71b06a85acb9b2f8ba2a16d4d33ba8c689`
- Previous tag: `v1.0.0` at `8dc8b47890ec3fdaf454c9ea1708bf16cc7b075a`
- Existing GitHub Releases: `0`
- Decision: `EXACT_OS_RELEASE_DECISION_ESTABLISHED / VERSION_1_1_0 / STABLE`
- Version: `1.1.0`
- Annotated tag: `v1.1.0`
- Release name: `BAI Development OS v1.1.0`
- Channel: `stable`
- Release target: exact future main merge SHA containing this decision, final readiness and Completion Record

## SemVer decision

TASK-018 adds the backward-compatible Codex autonomy foundation: Context Cost Observatory, stale-safe Handoff Bootstrap, Human Gate Parking, Session Rotation/recovery, bounded capability Adapter, safety-first routing, operational contracts and empirically hardened Pilot rules. It does not intentionally remove or break the public TASK-004〜017 contracts. A minor increment from `1.0.0` to `1.1.0` is therefore exact; a patch would understate the added capability and a major increment is not justified.

## Release artifact decision

The repository package is private and has no standalone runtime binary or npm publication workflow. This repository Release is therefore `GIT_SOURCE_RELEASE_ONLY`:

- annotated Git tag bound to exact merged main SHA;
- GitHub-generated source archives;
- durable Release notes and Completion/verification Evidence in the tagged tree.

No Consumer-installable ReleaseOS bundle is declared for this repository source checkpoint. A ReleaseOS signed upgrade bundle/signing ceremony is `NOT_APPLICABLE_TO_THIS_SOURCE_ONLY_RELEASE`, not silently claimed as PASS. Future binary/package distribution requires its own configured long-lived signing identity, trust anchor, artifact inventory and ceremony; no ephemeral key is invented for this release.

## Required order

1. Finalize `1.1.0` metadata, readiness result, Completion Record and release notes on the I1 branch.
2. Run full WSL2 regression, focused Closure/Release tests, document registry and PR CI/conformance.
3. Merge only the exact all-green PR head into `main`; verify exact main merge SHA.
4. Create and push annotated tag `v1.1.0` at that SHA.
5. Create stable GitHub Release `BAI Development OS v1.1.0` from the tagged release notes.
6. Verify tag dereference, Release state/source assets and branch cleanup.

Direct main push, force push, Deploy, Production Activation and paid Provider execution remain prohibited. TASK-017 remains paused. Consumer TASK-036 W0/W1 remains partial under its exact Human Gates and is not broadened by the OS release.
