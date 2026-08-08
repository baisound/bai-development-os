# BAI Development OS — AI Context Pack

## Current authority

- Architecture: `BAI Development OS Architecture Ver.2.23 CURRENT_CANONICAL`
- Product root: `/home/baisound/bai-development-os`
- Reference Consumer: `/home/baisound/projects/javascript-roulette`
- TASK-004〜013: `COMPLETED`
- TASK-014: `NEXT / NOT_STARTED / NOT_AUTHORIZED`
- TASK-015: `PROPOSED / NOT_STARTED / NOT_AUTHORIZED`
- Roadmap authority: Architecture Ver.2.23 Part XV, `51 / 51 PASS`

## Current subsystem map

- TASK-004 `LifecycleOS`: lifecycle, guards, context, cost/model, recovery, closure/system sync.
- TASK-005 `KnowledgeOS`: governed knowledge assets/resolution/packs/effectiveness.
- TASK-006 `AutomationOS`: registry/runtime/startup/instruction/automation/outbox.
- TASK-007 Monitoring: verified derived metrics/alerts/trends/dashboard.
- TASK-008 `IntegrationOS`: governed external capability/credential/side-effect boundary.
- TASK-009 `SecurityOS`: trusted path, secrets, signing, journal, ledger, replay, network/DLP/supply-chain/sandbox primitives.
- TASK-010 `ReleaseOS`: signed release/version/compatibility/migration/install/update/rollback.
- TASK-011 `ConformanceOS`: multi-project compatibility/isolation/fairness/provider/portability/certification.
- TASK-012 `MaintenanceOS`: read-only fsck, drift, safe repair, durable execution, rollback/quarantine/retention.
- TASK-013 `ExtensionOS`: common Domain Adapter / Plugin SDK.

## TASK-013 realized contract

ExtensionOS is the single plugin architecture for Video, Audio, BGM/SE, Streaming, Unity, Web, Desktop, Automation and provider extensions for all completed subsystems. It uses immutable checksummed Manifest contracts, Provider implementation-checksum binding, checksum-pinned in-process trust, sandbox mediation, compatibility/dependency lifecycle, Capability Broker authorization/permission/resource gates, Domain Policy/Test/Evidence Packs, artifact validation/preview/quality gates, subsystem hooks, durable checksummed Registry snapshots and Extension Conformance.

OpenAPI/MCP assistance emits a non-executable build-time adapter plan with no authority effect. Domain/vendor-specific production providers are Extensions, not Core branches.

## Evidence baseline

- TASK-013: `161 / 161 PASS`
- Full OS: `1059 / 1059 PASS`
- Consumer: `10 / 10 PASS`
- Extension Conformance: `10 schemas / 8 domains / 12 shared contracts PASS`
- Roadmap: `51 / 51 PASS`
- Security / Release / Conformance / Maintenance / Product Boundary: PASS
- Blocking Critic findings: `0`

## Loading guidance

Use summaries first. Load a completed TASK canonical only when its exact behavior is implicated. For future TASK-014/015, load Architecture Ver.2.23 Part XV. Historical Architecture Parts VI〜XIV and post-TASK addenda are provenance and must not independently determine current scope or routing.
