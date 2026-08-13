# BAI Development OS — Codex Autonomy P0 Roadmap Refinement Ver.1.0

## Document Control

- Status: `CURRENT_CANONICAL_ROADMAP_SUPPLEMENT`
- Effective date: `2026-08-13`
- Design Identity: `BAI-OS-AUTONOMY-001`
- Canonical Task Identity: `TASK-018`
- Priority: `P0 / MAXIMUM / OWNER_PRIORITY`
- Parent Architecture: `BAI Development OS Architecture Ver.2.28`
- Owner intent: `IMPLEMENTATION_REQUESTED`

This supplement changes current execution priority and insertion order. It does not delete or renumber TASK-016 or TASK-017, and it does not rewrite their historical artifacts.

## Owner roadmap decision

The explicit 2026-08-13 Owner Directive supersedes the earlier planning statement that no TASK-018 was created. A genuinely separate foundation boundary now exists: safe Codex autonomous development, Context Cost Observatory, Handoff Bootstrap, Human Gate Parking and Session Rotation.

The new route is:

```text
TASK-017 current safe checkpoint at 07af447
  -> PAUSE TASK-017 execution
  -> preserve unapplied Remaining Deployment Gates patch as parked handoff work
  -> TASK-018 / BAI-OS-AUTONOMY-001 P0
       A. Current OS Audit / Architecture
       B. Context Cost Observatory
       C. Handoff Bootstrap Guard
       D. Autonomous Queue / Human Gate Parking
       E. Session Rotation
       F. Bounded Codex Automation Adapter
       G. BAI VIDEO PRODUCTION Consumer Pilot
       H. Hardening / Knowledge Loop
  -> Owner/OS decision on resuming parked TASK-017 Phase 0
  -> TASK-016 Phase 1+ and TASK-017 Phase 1+ only under their own later authorization
```

## Explicit current-point pause record

TASK-017 is paused at a safe repository checkpoint for P0 insertion:

- Current canonical checkout: `07af4470397e85ccdf86ec57b6b7c00c6992b974`.
- Public TLS Staging Gate implementation is included in that checkout.
- Real VPS staging execution remains pending and is not performed by this refinement.
- The verified Remaining Deployment Gates transport patch remains outside the checkout, unapplied and preserved with SHA-256 `721c9593bf8fa07c59b5b49f6690dd73ceeae33da2fa2b586cc58757b6d2e0dc`.
- Production certificate issuance, Firewall/public activation, offsite upload, Product credentials and real Product ingestion remain blocked by their existing gates.

`PAUSED` here means roadmap execution is temporarily suspended at a safe checkpoint. It does not mean TASK-017 is cancelled, completed, renumbered, or stripped of existing authority/evidence.

## Balanced Execution policy

TASK-018 is DEV-4, but governance depth must help completion rather than create an endless Critic loop.

- Design Critic and implementation Critic remain required at the DEV-4 safety floor.
- Each bounded Phase has a maximum of two review/fix cycles.
- If unresolved Critical/High findings are zero and the Phase gate tests pass, proceed to the next authorized implementation unit.
- Medium/Low findings that do not violate Authority, Security, data integrity or acceptance criteria are recorded as bounded follow-up or accepted residual; they do not automatically restart the whole workflow.
- After the cycle cap, unresolved issues become an explicit blocker/escalation, not another automatic full Builder -> Critic restart.
- Review independence is required for activation/final judgement; routine local implementation progress does not stop for repeated ceremonial reviews when no new risk or artifact change exists.

## Scope boundary

P0 owns the autonomy foundation and Canonical Capability alignment. WebMCP remains Experimental and optional. Visual Compliance remains a BAI VIDEO PRODUCTION-owned consumer capability after the autonomy foundation. This supplement grants no Release, Tag, Deploy, paid-provider, production, native-external or protected-main push authority.

