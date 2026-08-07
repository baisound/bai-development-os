# BAI Development OS — Current State

## Snapshot

- Product: `BAI Development OS`
- Canonical Product Root: `/home/baisound/bai-development-os`
- Former Foundation Root: `/home/baisound/projects/ai-team` — superseded by P0.0 product extraction
- Reference Consumer: `/home/baisound/projects/javascript-roulette`
- Active OS Task: `TASK-004 — AI Development OS Lifecycle Foundation`
- Current Corrective Scope: `P0.0 Repository / Product Boundary Correction` + `P0.1 Adaptive Development Governance`
- Historical Architecture Baseline: `AI Development OS Architecture Ver.2.1`
- Current Operational Addendum: `BAI_Development_OS_Product_Boundary_and_Adaptive_Governance_Addendum_Ver1.0.md`
- TASK-004 Canonical Lifecycle: `ACTIVE / DESIGN`
- Canonical Gate: `FAIL` (unchanged historical lifecycle record)
- Completion Review: `TASK_COMPLETION_REVISION_REQUIRED`
- Closure: `NOT_CONFIRMED`
- Archive: `NOT_ELIGIBLE`
- Phase 1: technically completed and Judge-approved
- Phase 1.5: reduced-scope Context Guard Core MVP, `APPROVED_WITH_CONDITIONS`
- Phase 1.6: transferred work package `PHASE_1_6_P0`; historical authorization artifacts preserved; implementation not started by this extraction
- Phase 5A: `PAUSED_BY_OWNER_PRIORITY`
- Phase 2: `BLOCKED`
- Model-routing policy: unchanged by Adaptive Development Governance
- Last Updated: `2026-08-08`

## Product Boundary Correction

The OS is no longer hosted inside `javascript-roulette`.

### BAI Development OS owns

- reusable Lifecycle implementation,
- Context Guard implementation,
- governance and adaptive development profiles,
- common authority/evidence/workflow rules,
- shared Role specifications,
- reusable schemas and templates,
- OS registry and architecture/specifications,
- TASK-004 and future OS Tasks.

### JavaScript Roulette owns

- application source,
- project-specific configuration,
- project-local TASK-001 through TASK-003 evidence,
- `.bai-os/project.json` consumer adapter.

## Current Verification in Extraction Working Tree

- BAI Development OS test suite: `134 PASS / 0 FAIL`
- Product boundary check: `BOUNDARY_CHECK_PASS`
- Document registry: `94 documents / 0 missing / 0 hash-or-size mismatches`
- JavaScript Roulette regression suite after extraction: `10 PASS / 0 FAIL`
- JavaScript Roulette Vite direct build: `PASS`
- `npm run build` via copied ZIP `node_modules/.bin/vite`: invalid ZIP-flattened symlink; `node_modules` is excluded from the final migration package and must be recreated with `npm ci` after placement.

## Adaptive Development Governance

Implemented foundation:

- `src/governance/adaptive-development-profile.mjs`
- `schemas/governance/adaptive-development-profile.schema.json`
- `tests/governance/adaptive-development-profile.test.mjs`
- `specifications/Adaptive_Development_Governance_Specification_Ver1.0.md`

Profiles:

- `DEV_0_QUICK`
- `DEV_1_LIGHT`
- `DEV_2_STANDARD`
- `DEV_3_HIGH_ASSURANCE`
- `DEV_4_FOUNDATION_CRITICAL`

The selector varies design depth, Critic/Tester/Judge requirements, test density, review-cycle cap, evidence depth, and revalidation scope according to system scale, feature scale, criticality, failure impact, reversibility, novelty, and high-risk boundaries. It explicitly does not change permanent model-routing policy.

## Roadmap

- TASK-005: Knowledge OS — `PROPOSED / NOT_STARTED`
- TASK-006: Workspace Registry / Resolver / Automation — `PROPOSED / NOT_STARTED`
- TASK-007: Monitoring & Dashboard — `PROPOSED / NOT_STARTED`
- TASK-008: External Integration — `PROPOSED / NOT_STARTED`
- TASK-009: not defined in the current canonical OS roadmap

## Git Lineage

- Standalone OS history base: former `baisound/ai-team` repository, HEAD at extraction input `14d304c`.
- Imported OS implementation/evidence provenance: `baisound/javascript-roulette`, source history including `1caa275` Phase 1.5 milestone and later project HEAD evidence.
- Target GitHub repository name: `baisound/bai-development-os`.
- JavaScript Roulette retains its repository name and becomes a consumer/reference regression project.

## Next Routing

1. Apply/extract the prepared repository layout under `/home/baisound`.
2. Rename GitHub repository `baisound/ai-team` to `baisound/bai-development-os`.
3. Update the OS local `origin` URL.
4. Run `npm test` and `npm run check:boundaries` in the OS repository.
5. Run `npm ci`, `npm test`, and `npm run build` in JavaScript Roulette.
6. Commit the product extraction in each repository with provenance references.
7. Resume TASK-004 Phase 1.6 only through its valid authority path; product extraction does not silently authorize Phase 1.6 implementation.
