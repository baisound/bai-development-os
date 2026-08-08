# BAI Development OS — Context Loading Rules

## 1. Default order

1. `registry/current-state.md`
2. `registry/ai-context-pack.md`
3. `PROJECT.md`
4. Relevant completed Task summary
5. Exact canonical specification/source modules/tests needed for the decision

Do not load the whole Architecture or every prior Task by default.

## 2. Current architecture and roadmap

Architecture Ver.2.26 is current. Part XV preserves the sole consolidated roadmap authority with `54 / 54` source sections. TASK-004〜015 are completed. No TASK-016 exists unless a later explicit Owner decision creates one.

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
