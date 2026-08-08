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
7. Only the exact canonical source/modules required by the assignment

## Product and authority boundary

Consumer repositories such as `/home/baisound/projects/javascript-roulette` are reference/consumer projects, not the OS root. Derived Registry, Dashboard, Preview, Conformance and Maintenance outputs do not become Canonical authority. Adaptive Development Governance changes workflow depth, not permanent model-vendor policy.

## Current canonicals

- Architecture: `architecture/BAI_Development_OS_Architecture_Ver2.23.md`
- TASK-004 Lifecycle: Ver.1.6
- TASK-005 KnowledgeOS: Ver.1.2
- TASK-006 AutomationOS: Ver.1.0
- TASK-007 MonitoringOS: Ver.1.0
- TASK-008 IntegrationOS: Ver.1.0
- TASK-009 SecurityOS: Ver.1.0
- TASK-010 ReleaseOS: Ver.1.0
- TASK-011 ConformanceOS: Ver.1.0
- TASK-012 MaintenanceOS: Ver.1.0
- TASK-013 ExtensionOS / Domain Adapter / Plugin SDK: Ver.1.0

TASK-004〜013 are `COMPLETED`. TASK-014 is `NEXT / NOT_STARTED / NOT_AUTHORIZED`. TASK-015 remains `PROPOSED / NOT_STARTED / NOT_AUTHORIZED`.

## ExtensionOS loading rule

For TASK-013 behavior, load `tasks/TASK-013/TASK-013.summary.md` first. Load `specifications/TASK-013_BAI_Development_OS_Domain_Adapter_Plugin_SDK_Ver1.0.md` only for exact Manifest, Provider, lifecycle, Broker, Pack, Hook, Artifact, Registry or Conformance contracts. `OFFICIAL` is not execution trust by itself; executable Providers require implementation-checksum binding and either independent in-process trust or sandbox mediation. Extensions never self-grant external authorization.

## Roadmap authority

Architecture Ver.2.23 Part XV is the sole current consolidated roadmap scope. The lossless checker preserves `51 / 51` accumulated source sections. Historical roadmap addenda are provenance only and must not override Part XV. For TASK-014/015 scope, read Part XV; do not reconstruct current scope by merging historical fragments manually.

## Current verification baseline

- ExtensionOS: `161 / 161 PASS`
- Full OS: `1059 / 1059 PASS`
- JavaScript Roulette Consumer: `10 / 10 PASS`
- Extension Conformance: `10 schemas / 8 reference domains / 12 shared contracts PASS`
- Roadmap: `51 / 51 PASS`
- Security / Release / Conformance / Maintenance / Boundary: PASS

## Safety reminders

- Do not infer authorization from a Task status, Plugin trust label, successful test, connector response, preview or repair plan.
- Do not treat SIMULATED/DECLARED Conformance evidence as REAL execution evidence.
- Do not weaken Context Guard, Security floors or Owner gates to make a test pass.
- Do not execute untrusted Plugin code in-process; sandbox-required capability must stay sandboxed.
- Do not persist executable function objects as trusted Registry state; restored executable Extensions require Provider reattachment/re-enable.
