# README for AI Agents

BAI Development OS is a standalone product rooted at `/home/baisound/bai-development-os`.

## Default Entry Point

Read in this order:

1. `registry/current-state.md`
2. `registry/ai-context-pack.md`
3. `registry/context-loading-rules.md`
4. `PROJECT.md`
5. `tasks/<ACTIVE_TASK>/<ACTIVE_TASK>.summary.md`
6. Adaptive Development Profile result
7. `roles/README-<REQUIRED_ROLE>.md` only for Roles required by that profile
8. Exact source sections required by the assignment

## Product Boundary

Do not treat `/home/baisound/projects/javascript-roulette` as the OS root. Consumer repositories keep project-local source and evidence only.

## Adaptive Development Rule

Do not mechanically run every Role for every change. Use DEV-0 through DEV-4 to select the necessary design, review, testing, and evidence depth. Core/foundation changes require stronger assurance; small peripheral changes use compressed governance.

## Model Policy Boundary

Adaptive Development Governance changes workflow depth, not permanent model-selection policy.


## TASK-004 Completed Lifecycle Contract

TASK-004 is the completed Lifecycle Foundation baseline. Use current Architecture `architecture/BAI_Development_OS_Architecture_Ver2.14.md` for product-level routing and `specifications/TASK-004_BAI_Development_OS_Lifecycle_Foundation_Ver1.6.md` for the TASK-004 Lifecycle contract. Recovery, Context, Cost/Model, Closure/Archive, dependency/migration, and System Sync are formalized runtime capabilities. Do not reopen TASK-004 to add future features; route new work to TASK-005+ or a new follow-up Task.

Adaptive Development Governance still changes workflow depth rather than permanent model-selection policy.


## TASK-005 Completed Knowledge Contract

TASK-005 is completed. Load `tasks/TASK-005/TASK-005.summary.md` and the Ver.1.2 Knowledge canonical only when Knowledge behavior is relevant. Knowledge Pack is a TASK-004 Context Source and never a Context Manifest authority. Do not use Workspace Registry as Knowledge content authority. TASK-006 Orchestration & Automation, TASK-007 Monitoring & Dashboard, and TASK-008 External Integration are completed. TASK-009 Security / Supply Chain / Integrity Hardening is completed. The next route is TASK-010 Release / Distribution / Consumer Upgrade OS.


## TASK-006 Automation Baseline

Load `tasks/TASK-006/TASK-006.summary.md` and the Ver.1.0 automation canonical when Registry/Runtime/Resolver/Startup/Automation behavior is relevant. Registry is an index, Automation cannot self-authorize, and Lifecycle/Knowledge canonical authority remain TASK-004/TASK-005. Runtime export: `AutomationOS`.


## TASK-007 Monitoring Baseline

TASK-007 is completed. Load `tasks/TASK-007/TASK-007.summary.md` and Monitoring Ver.1.0 only when observability behavior is relevant. Dashboard/Alert/Snapshot/Trend are read-only derived state and never canonical authority. Post-TASK-007 productization belongs TASK-009〜015; TASK-008 now provides the external notification/connector execution baseline. Current Architecture canonical is Ver.2.17.


## TASK-008 External Integration Baseline

TASK-008 is completed. Load `tasks/TASK-008/TASK-008.summary.md` and External Integration Ver.1.0 only for connector/external-side-effect work. `IntegrationOS` resolves connector capabilities, authorization, credential references, idempotency, retry/timeout/rate controls, Cost Guard reservations, license context, trust normalization, inbound webhook verification, audit and Monitoring. A successful connector response is never canonical merely because execution succeeded. Runtime export: `IntegrationOS`. TASK-009 and TASK-010 are completed. TASK-011 is next and remains unauthorized until separately activated.

## Consolidated Roadmap Authority

Architecture Ver.2.18 Part XV is the sole current consolidated roadmap scope for TASK-011〜015; TASK-009/TASK-010 are completed. Historical post-TASK-004/005/006/007/008 roadmap sections remain for provenance but MUST NOT be interpreted independently as current complete scope. The lossless audit preserves all 44 accumulated source sections; TASK-013 remains fundamentally the cross-domain Domain Adapter / Plugin SDK.

## TASK-009 loading rule

TASK-009 is completed. Load `tasks/TASK-009/TASK-009.summary.md` and `specifications/TASK-009_BAI_Development_OS_Security_Integrity_Ver1.0.md` only when security/integrity behavior is relevant. `SecurityOS` is a shared protection/verification layer, not authorization or canonical domain authority. Current Architecture is Ver.2.17; TASK-010 is completed and TASK-011 is next.


## Post-TASK-009 routing note

Use Architecture Ver.2.18 Part XV for future TASK-011〜015 scope. The roadmap lossless baseline is 44 source sections. TASK-009/TASK-010 are completed; historical refinements must not be re-added as duplicate tasks.


## TASK-010 Current Context

TASK-010 is completed. Load `tasks/TASK-010/TASK-010.summary.md`, then `specifications/TASK-010_BAI_Development_OS_Release_Distribution_Upgrade_Ver1.0.md` when release/distribution/upgrade behavior is relevant. `ReleaseOS` owns release metadata, compatibility/migration planning and local governed release mutation, but does not grant Owner authorization or publish external releases by itself. Current Architecture is Ver.2.17. TASK-011 is next and remains unstarted/unauthorized.


## Post-TASK-010 Roadmap Refinement

TASK-010 remains completed. Architecture Ver.2.18 Part XV directly consolidates TASK-010-derived scope into TASK-011〜015: cross-platform/provider release conformance, release fsck/stale-lock recovery, release provider SDKs, adaptive canary/rollback/acquisition calibration, and optional distributed rollout coordination. Current roadmap lossless baseline: `44 / 44`. TASK-011 remains next and unauthorized.
