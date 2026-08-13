# TASK-018 Phase I0 — Repository Release Plan Draft

Status: `EXECUTED / V1_1_0_RELEASE_PUBLICATION_VERIFIED`

- Repository: `https://github.com/baisound/bai-development-os`
- Default branch: `main`
- Version: `1.1.0`
- Git tag: `v1.1.0`
- Release name: `BAI Development OS v1.1.0`
- Channel: `stable`
- Release artifacts: `GIT_SOURCE_RELEASE_ONLY / GitHub source archives`

## Required execution order after I1 eligibility

1. Verify merged clean `main` and exact repository state.
2. Re-run full OS/Consumer/Pilot/Recovery gates.
3. Record exact Owner Closure/version/tag/Release decision.
4. Verify the source-only artifact decision, exact repository state and rollback boundary; no unsigned Consumer-installable bundle is claimed.
5. Create annotated tag, push tag and create the stable GitHub Release.
6. Verify published tag/Release and source archives against the exact commit.

Execution evidence: `tasks/TASK-018/phase-i1-release-publication-evidence-2026-08-14.md`.
