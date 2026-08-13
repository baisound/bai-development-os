# TASK-018 Phase A — Current OS Audit

Date: `2026-08-13`  
Result: `AUDIT_PASS / SAFE_P0_INSERTION_POINT_CONFIRMED`

## Git and handoff resolution

- Current branch at intake: `main`.
- Current HEAD: `07af4470397e85ccdf86ec57b6b7c00c6992b974`.
- `main...origin/main`: `0 / 0` using the locally configured remote-tracking ref.
- Worktree at intake: clean; staged and unstaged diffs empty.
- P0 handoff Manifest: every listed SHA-256 and byte count matched.
- TASK-017 transport patch SHA-256: `721c9593bf8fa07c59b5b49f6690dd73ceeae33da2fa2b586cc58757b6d2e0dc` matched its handoff.
- Patch source commit `3add23b` is not present in this checkout.

Decision: the clean merge baseline is a safe checkpoint. The pending TASK-017 patch is parked intact. P0 insertion does not overwrite or renumber TASK-016/TASK-017.

## Registry state

- Architecture: Ver.2.28.
- TASK-004 through TASK-015: completed.
- TASK-016: Phase 0 completed; Phase 1+ not authorized.
- TASK-017: active Phase 0; Public TLS staging implementation is canonical at this checkout; VPS/native and production gates remain separate.
- `TASK-018` was unused before the 2026-08-13 Owner Directive. Earlier “No TASK-018” roadmap text is superseded only for this explicit P0 allocation; historical artifacts remain unchanged.

## DEV Profile recalculation

Selector input:

- System Scale `FOUNDATION`
- Feature Scale `LARGE`
- Criticality `FOUNDATION`
- Failure Impact `CRITICAL`
- Reversibility `HARD`
- Novelty `NEW_ARCHITECTURE`
- Change Kind `ARCHITECTURE`
- security, authorization, state machine, cross-project contract and external-side-effect flags enabled

Result: score `40`, `DEV_4_FOUNDATION_CRITICAL`. Required roles are Builder, independent Critic, independent Tester and Judge; required coverage includes unit, negative/boundary, integration, regression, contract, fault/recovery and consumer fixture where applicable.

## Existing module map

| Required concern | Existing owner | Phase A decision |
|---|---|---|
| token estimation / read inventory | `src/context-guard/` | reuse estimator and inventory identity |
| canonical Context Manifest / trust | `src/context-control/` | extend; do not create a second manifest system |
| usage/cost reservation | `src/cost-guard/` | keep provider/cost ledger separate from estimates |
| bounded execution | `src/governance/execution-budget-policy.mjs` | extend in a later bounded phase |
| task/action ordering | `src/automation/scheduler.mjs` | extend for Task graph and parking; no new scheduler core |
| startup / Allowed Paths | `src/automation/startup.mjs` | reuse for role activation |
| external capabilities | `src/integration/registry.mjs` and gateway | canonical protocol-independent boundary candidate |
| authorization | Lifecycle/Owner records plus `src/security/authorization.mjs` | preserve; Codex is not authority |
| model routing | `src/model-control/` | route by capability; profile does not rewrite vendor policy |
| durable evidence | existing subsystem evidence stores | reuse immutable/checksummed patterns |
| crash recovery | `src/lifecycle/recovery/` | extend after bootstrap/rotation design |

## Capability Architecture finding

IntegrationOS already has capability manifests, policy evaluation, idempotency, retry, cost binding, audit and credential boundaries, but it is connector-oriented and does not yet model dynamic Builder/Critic/Judge discovery by lifecycle Gate. Phase D must add a protocol-independent internal capability view without turning WebMCP names into canonical IDs or giving Codex unrestricted shell authority.

## Platform capability probe

- Scheduled/recurring Automation configuration is exposed by the current Codex app: `AVAILABLE_FOR_LATER_ADAPTER_PROBE`.
- Automation was not created or executed during Phase A.
- Task-level machine-readable billing tokens: `UNCONFIRMED`.
- Stable provider-observed token API: `UNCONFIRMED`.
- Automatic fresh-task/thread creation at rotation: `UNCONFIRMED / MUST_NOT_BE_ASSUMED`.
- Review Queue machine contract: `UNCONFIRMED`.
- Local repository branch access: confirmed for the current desktop execution environment.
- Offline/sleep behavior, duplicate schedule execution and credit-limit behavior: not safely proven; later adapter tests must fail closed.

## P0 boundaries accepted

Context Cost Observatory and Handoff Bootstrap are the first executable units. Automation, WebMCP, paid providers and Consumer-native actions are not first units and cannot become critical dependencies.

