# BAI Development OS Architecture Ver.2.29 — AI Summary

- Status: `CURRENT_CANONICAL`
- Historical baseline: Architecture Ver.2.28
- TASK-004〜015: `COMPLETED`
- TASK-016: `ACTIVE / PHASE0_COMPLETED / PHASE1+ NOT_AUTHORIZED`
- TASK-017: `ACTIVE / PHASE0_PAUSED_AT_07AF447 / PRODUCTION_ACTIVATION_BLOCKED`
- TASK-018: `ACTIVE / P0_MAXIMUM / BAI-OS-AUTONOMY-001`
- New route: Context Cost Observatory -> Handoff Bootstrap -> Queue/Human Gate -> Rotation -> bounded Codex Adapter -> Consumer Pilot -> Hardening
- Safe checkpoint: `07af4470397e85ccdf86ec57b6b7c00c6992b974`
- Preserved TASK-017 patch SHA-256: `721c9593bf8fa07c59b5b49f6690dd73ceeae33da2fa2b586cc58757b6d2e0dc`
- Governance: DEV-4 with maximum two review/fix cycles per bounded Phase; required PASS plus Critical/High `0/0` advances work
- Capability boundary: protocol-independent Canonical Capability and dynamic Gate filtering; WebMCP remains Experimental
- Consumer boundary: Visual Compliance remains BAI VIDEO PRODUCTION-owned; OS remains development governance, not Consumer runtime dependency
- Hard prohibitions: direct main push, Release, Tag, Deploy, paid execution, credit purchase/top-up, unauthorized native mutation
- Roadmap preservation: prior `56 / 56` source scope retained; TASK-018 is a later explicit Owner allocation

Read the machine Markdown for complete Authority, pause/resume, Allowed Files and phase-gate contracts.

