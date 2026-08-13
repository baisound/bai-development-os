# TASK-018 Phase F — Critic Review

Date: `2026-08-13`
Review cycle: `1 / 2`
Decision: `PASS_AFTER_FIX`

## Findings and response

1. `High` — a checksum-valid but structurally invalid Capability Probe could reach discovery if verification checked only its checksum. Fixed by deterministic structural reconstruction during verification and covered by a forged-checksum regression.
2. `High` — the initial external Gate decision lacked tamper and Authority Evidence binding; the run plan bound only its ID. Fixed by requiring a verified Authority Evidence checksum, Gate decision checksum, disjoint allow/deny lists, and embedding both Gate and Probe checksums in the plan.

## Required companion challenges

- Capability IDs are protocol-independent: PASS.
- Shell/Git access cannot silently become Authority: PASS; it is merely observed capability and requires an external Gate decision.
- Unauthorized/unknown capabilities hidden or fail closed: PASS.
- WebMCP production dependency: absent.
- Context cost cannot lower Safety floors: preserved by mandatory `safety_floor_passed`.
- Visual Compliance logic duplicated in Core: absent.
- Tool descriptions/external pages trusted as instructions: prohibited; `UNTRUSTED_DESCRIPTION` cannot support `AVAILABLE`.

Unresolved Critical: `0`
Unresolved High: `0`
