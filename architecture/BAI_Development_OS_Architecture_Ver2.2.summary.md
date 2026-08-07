# AI Summary — BAI Development OS Architecture Ver.2.2

## Canonical Identity

- Status: `CURRENT_CANONICAL`
- Product: `BAI Development OS`
- Product Root: `/home/baisound/bai-development-os`
- Machine Canonical: `/home/baisound/bai-development-os/architecture/BAI_Development_OS_Architecture_Ver2.2.md`
- Human Companion: `/home/baisound/bai-development-os/architecture/BAI_Development_OS_Architecture_Ver2.2.docx`
- Supersedes: Architecture Ver.2.1
- Effective Date: `2026-08-08`

## Product Boundary

BAI Development OS is a standalone product. `javascript-roulette` is a Reference Consumer / Regression Project and is not the host of OS core.

- OS owns Lifecycle, Context Guard, Governance, shared Roles/specifications/schemas/templates/Registry, TASK-004 and future OS Tasks.
- Consumer projects own application source, project-local evidence, and a thin `.bai-os/` adapter.
- Historical Evidence may retain old `/home/baisound/projects/ai-team` and `javascript-roulette/docs/ai-team` paths; those are not current operational roots.

## Adaptive Development Governance

Profiles: `DEV_0_QUICK`, `DEV_1_LIGHT`, `DEV_2_STANDARD`, `DEV_3_HIGH_ASSURANCE`, `DEV_4_FOUNDATION_CRITICAL`.

Selection considers system scale, feature scale, criticality, failure impact, breadth, reversibility, novelty, and high-risk boundaries.

Safety floors:
- `CORE` >= DEV-3
- `FOUNDATION` or `CRITICAL` = DEV-4
- token economy never weakens required critical testing/review
- permanent model-routing policy is unchanged

## Verification

- OS tests: `134 PASS / 0 FAIL`
- Product boundary: `BOUNDARY_CHECK_PASS`
- JavaScript Roulette: `10 PASS / 0 FAIL`
- Reference consumer build: `PASS`

## Roadmap

- TASK-005: Knowledge OS
- TASK-006: Registry / Resolver / Automation
- TASK-007: Monitoring & Dashboard
- TASK-008: External Integration
- TASK-009: not currently defined

## Load Rule

Use this summary for navigation only. Binding design authority is the Ver.2.2 Markdown. DOCX is the human companion.
