# BAI Development OS — Context Loading Rules

## 1. Default order

1. `registry/current-state.md`
2. `registry/ai-context-pack.md`
3. Active P0 Roadmap supplement and active Task summary
4. Bound Final Plan and Implementation Authorization
5. `PROJECT.md` only when the decision needs broader Product context
6. Exact canonical specification/source modules/tests needed for the decision

Do not load the whole Architecture or every prior Task by default.

## 2. Current architecture and roadmap

Architecture Ver.2.29 is current. Part XV preserves the consolidated `56 / 56` source history and Part XXX integrates the Owner-directed TASK-018 P0 route. TASK-004〜015 are completed. TASK-016 remains `ACTIVE / PHASE0_COMPLETED / PHASE1+ NOT_AUTHORIZED`; TASK-017 is paused at its safe checkpoint. Historical routing statements remain provenance, not current execution state.

## 3. Completed subsystem loading

For TASK-004〜015, load `tasks/TASK-XXX/<summary>` first, then the corresponding specification only when exact runtime contracts are required. Never use historical completion/refinement notes to override a later current canonical.

For DistributedOS behavior, start with `tasks/TASK-015/TASK-015.summary.md`, then `specifications/TASK-015_BAI_Development_OS_Distributed_Orchestration_Event_Fabric_Ver1.0.md` and only relevant `src/distributed/` modules/tests.

## 4. Evidence and authority

A successful test, Plugin trust label, Connector result, Conformance report, Preview, Repair Plan, Registry entry, Dashboard value, distributed Event, Worker advertisement, Lease or remote result is evidence/derived/coordination state, not authorization or Canonical truth. Preserve Lifecycle/Owner/Knowledge/Security/Release/Maintenance/Calibration authority boundaries.

## 5. Context Economy

Use DEV-0〜DEV-4 to select review/test/context depth. Do not raise Context Guard limits to accommodate duplicated history. Prefer current summaries and exact source sections. Historical evolution is loaded only for provenance, regression or supersession investigations.

## 6. Extension, Calibration and Distributed execution context

Executable Extension code requires implementation-checksum binding and the Capability Broker. Calibration recommendations/Candidates are advisory until exact Counterfactual + Shadow + Owner + Policy gates pass.

DistributedOS is disabled by default. Do not enable it for local/single-machine work merely because the package supports it. When enabled, preserve at-least-once semantics, semantic idempotency, exact run/rollout lease scopes, fencing, Worker attestation for REAL evidence, late-result quarantine, partition fail-closed rules and quota/backpressure. Distribution cannot upgrade Evidence class, create external authorization or replace an owning subsystem's canonical state.


## 7. TASK-016 planning context

For TASK-016 planning, load `tasks/TASK-016/TASK-016.summary.md`, then `tasks/TASK-016/phase0-consumer-knowledge-capture-bridge-detailed-design.md`, then `architecture/BAI_Development_OS_Consumer_Knowledge_Evolution_Roadmap_Refinement_Ver1.0.md`; load `architecture/BAI_Development_OS_Post_TASK015_Roadmap_Refinement_Ver1.0.md` only when the original resilience allocation is needed. Do not load the complete Architecture by default. Do not load all distributed history by default. TASK-016 NEXT status is not implementation authorization. Destructive real-environment fault injection must remain disabled unless a separately bound Owner authorization, blast-radius limit, cost limit and Emergency Stop are present.


## 8. TASK-017 planning context

TASK-017 Phase 0 is paused at `07af447` for TASK-018 P0. When TASK-017 resume is explicitly selected, load `tasks/TASK-017/phase0-development-pause-and-resume-decision-2026-08-13.md`, then `TASK-017.summary.md`, then `knowledge-evolution-detailed-roadmap.md`, and only the exact gate design/evidence needed. Re-audit the preserved patch and current Git before mutation. Production VPS/DNS/TLS/real credential activation remains separately gated and Production Activation is `BLOCKED`.

## 9. TASK-018 P0 planning and execution context

TASK-018 is the completed P0 route. Load the Roadmap supplement, TASK-018 summary and exact closure record only when TASK-018 provenance is required. Do not load all Automation/Integration/Security history by default.

For the current roadmap position, load `architecture/BAI_Development_OS_Current_Roadmap_Position_Supplement_2026-08-14.md` before interpreting historical `current route` statements in Architecture Part XXX or the original P0 Roadmap supplement. The position supplement changes status markers only; it does not allocate the next roadmap or authorize TASK-017 resume.

For current Consumer status, first load `tasks/TASK-018/post-release-bvp-r2-r4-consumer-supplement-2026-08-14.md`. It records BAI VIDEO PRODUCTION current main `7d6486059c468009042e4c186d54b566d6e1477e`, completed R2/R3 promotions, the hosted-closed bounded R4 local Comfy adapter and its narrower native H3 `PARKED_TO_SAFE_RUNTIME_REVIEW` boundary. Then load `tasks/TASK-018/post-release-bvp-v0.20.1-consumer-supplement-2026-08-14.md` only for exact release-code SHA `c2e12d59f869a6b612848aab7ba8319e9cb8a4b4`, stable Release `v0.20.1` and TASK-036/M3B provenance. For Phase G/H2 chronology, then load the H2B Judge, `tasks/TASK-018/phase-g-consumer-release-closure-evidence-2026-08-14.md`, the final Pilot Context Cost and only the exact earlier parked W0/W1 Evidence needed. Do not reload raw Resolve/Cubase artifacts or private Prompt content unless a discrepancy requires exact Consumer-local inspection. A Draft PR's skipped matrix or stale checks never count as merge-ready; require fresh checks for the exact non-draft head.

Use Balanced Execution: two review/fix cycles maximum per bounded Phase. Zero unresolved Critical/High plus required PASS permits advancement; unchanged artifacts do not justify repeated Critic execution.

For H1.2 routing work, load `src/automation/safety-first-routing.mjs`, its output schema and focused tests plus the Context Cost validator. Do not load or inspect the BAI VIDEO PRODUCTION checkout. Context Cost may order only routes that already pass exact Authority, Safety, DEV, capability, quality, reliability, provider and budget requirements.

For autonomy operation and integration questions, load the exact Ver.1.0 Operator/Consumer/Handoff/Context/Codex specification and `registry/autonomy-failure-registry.json`; do not reload the P0 handoff pack or all source modules by default.

TASK-018 is complete. For Closure or release verification, load `tasks/TASK-018/phase-i1-release-publication-evidence-2026-08-14.md` first, then the exact I1 decision, final-readiness JSON and Completion Record only as needed. Stable source-only `v1.1.0` targets exact main SHA `81a8445ab8a94fd75034e4c25b63eb7849f5608c`; that historical publication did not itself broaden TASK-036/M3B claims. The later Consumer supplement independently records their closure and does not alter the OS tag. TASK-017 resume still requires its separate pause/resume route and current Git re-audit.
