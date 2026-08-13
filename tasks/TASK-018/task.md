# TASK-018 — Codex Autonomous Development Control Plane

- Design Identity: `BAI-OS-AUTONOMY-001`
- Priority: `P0 / MAXIMUM / OWNER_PRIORITY`
- Status: `ACTIVE / PHASE_A_ARCHITECTURE_ACCEPTED / PHASE_B_IMPLEMENTATION_AUTHORIZED`
- Development Profile: `DEV_4_FOUNDATION_CRITICAL`
- Parent Authority: Owner Directive dated `2026-08-13`

## Objective

Extend the existing BAI Development OS with a repository-centric autonomous development control plane: Context Cost Observatory, stale-safe Handoff Bootstrap, authorized runnable queue, Human Gate Parking, Session Rotation, and a bounded Codex Automation adapter.

The implementation extends Context Guard, Context Control, Cost Guard, Execution Budget, Model Control, AutomationOS, IntegrationOS, SecurityOS, Evidence and Recovery. It does not create a second authority system.

## Priority insertion

`TASK-016` and `TASK-017` retain their identities. The current clean `07af447` checkout is a safe checkpoint. The unapplied TASK-017 remaining-gates patch is preserved as pending work and is not consumed, discarded, or renumbered by this Task.

Canonical execution-order supplement: `architecture/BAI_Development_OS_Codex_Autonomy_P0_Roadmap_Refinement_Ver1.0.md`. TASK-017 is explicitly paused at that checkpoint until the TASK-018 P0 route reaches an authorized resume decision.

## Required order

1. Existing OS audit and capability probe.
2. Context Cost Observatory.
3. Handoff Bootstrap Guard.
4. Autonomous Queue and Human Gate Parking.
5. Session Rotation.
6. Bounded Codex Automation Adapter.
7. BAI VIDEO PRODUCTION consumer pilot.
8. Hardening and Knowledge loop.

## Hard boundaries

- No direct push to protected `main`, force push, Release, Tag, Deploy, production activation, paid-provider execution, credit purchase/top-up, or unauthorized native mutation.
- No unknown local-change discard and no `git add .`.
- Estimated context usage, provider-observed usage, and billed usage remain separate.
- WebMCP remains an Experimental adapter, never a P0 runtime dependency.
- Visual Compliance remains owned by BAI VIDEO PRODUCTION as a later consumer capability.
- Phase 1 starts with one autonomous worker.
- Review/fix cycles are capped at two per bounded Phase. Zero unresolved Critical/High plus passing gates advances the work; Medium/Low residuals do not automatically restart the whole workflow.

## Read first

1. `tasks/TASK-018/TASK-018.summary.md`
2. `tasks/TASK-018/phase-a-current-os-audit-2026-08-13.md`
3. `tasks/TASK-018/phase-a-final-plan-2026-08-13.md`
4. `tasks/TASK-018/owner-implementation-authorization-2026-08-13.md`
