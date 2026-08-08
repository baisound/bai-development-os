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

- Architecture: `architecture/BAI_Development_OS_Architecture_Ver2.27.md`
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
- TASK-014 CalibrationOS / Adaptive Governance Calibration & Policy Learning: Ver.1.0
- TASK-015 DistributedOS / Distributed Orchestration & Event Fabric: Ver.1.0
- TASK-016 Resilience / Recovery / Scalability Certification OS: proposed next route, not yet canonical implementation

TASK-004〜015 are `COMPLETED`. TASK-016 is `NEXT / NOT_STARTED / NOT_AUTHORIZED` by the explicit Post-TASK-015 roadmap refinement.

## CalibrationOS loading rule

For TASK-014 behavior, load `tasks/TASK-014/TASK-014.summary.md` first. Load `specifications/TASK-014_BAI_Development_OS_Adaptive_Governance_Calibration_Policy_Learning_Ver1.0.md` only for exact Evidence, Analytics, Recommendation, Candidate, Safety Floor, Counterfactual, Shadow, Activation or Ledger contracts. Recommendations have no authority effect; SIMULATED/DECLARED evidence cannot independently satisfy verified-evidence floors; activation requires Owner and Policy authorization.

## Roadmap authority

Architecture Ver.2.27 Part XV is the sole current consolidated roadmap scope. The lossless checker preserves `55 / 55` accumulated source sections. Historical roadmap addenda are provenance only and must not override Part XV. For TASK-015 scope, read Part XV; do not reconstruct current scope by merging historical fragments manually.

## Current verification baseline

- DistributedOS: `73 / 73 PASS`
- Full OS: `1188 / 1188 PASS`
- JavaScript Roulette Consumer: `10 / 10 PASS`
- Distributed Conformance: `10 schemas / 13 shared contracts PASS`
- Calibration / Extension / Maintenance / Conformance / Release / Security Conformance: PASS
- Roadmap: `55 / 55 PASS`
- Product Boundary: PASS

## Safety reminders

- Do not infer authorization from a Task status, Plugin trust label, successful test, connector response, preview or repair plan.
- Do not treat SIMULATED/DECLARED Conformance evidence as REAL execution evidence.
- Do not weaken Context Guard, Security floors or Owner gates to make a test pass.
- Do not execute untrusted Plugin code in-process; sandbox-required capability must stay sandboxed.
- Do not persist executable function objects as trusted Registry state; restored executable Extensions require Provider reattachment/re-enable.
- Do not activate a Calibration Candidate without PASS Counterfactual + Shadow evaluations and both Owner/Policy authorization references.
- Do not automatically lower DEV, Security, Release, Conformance, Maintenance or Extension safety floors in response to cost/noise findings.


Post-TASK-014 refinement: TASK-015 owns distributed CalibrationOS evidence/evaluation/rollout coordination. TASK-015 is completed. A later explicit Post-TASK-015 Owner refinement creates TASK-016 for resilience/recovery/scalability certification; it does not reopen TASK-015.

## TASK-015 DistributedOS

TASK-015 is completed. For distributed work load the TASK-015 summary/specification first. Distributed mode is opt-in and disabled by default; transport/worker state never replaces subsystem authority.


## TASK-016 next-route loading rule

TASK-016 is not started or authorized. For planning only, load `tasks/TASK-016/TASK-016.summary.md`, then `architecture/BAI_Development_OS_Post_TASK015_Roadmap_Refinement_Ver1.0.md`. Do not infer implementation authorization from NEXT status. Real destructive chaos/fault injection requires a separately bound Owner authorization even after TASK-016 implementation begins.
