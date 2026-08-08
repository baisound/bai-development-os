# BAI Development OS — Context Loading Rules

## 1. Default order

1. `registry/current-state.md`
2. `registry/ai-context-pack.md`
3. `PROJECT.md`
4. Active/completed Task summary relevant to the assignment
5. Exact canonical sections/modules needed for the decision

Do not load the whole Architecture or every prior Task by default.

## 2. Current architecture and roadmap

Architecture Ver.2.25 is current. Part XV is the sole consolidated roadmap authority and preserves `54 / 54` accepted source sections. For TASK-015 scope, load Part XV first. Historical roadmap/addendum sections are provenance only.

## 3. Completed subsystem loading

For TASK-004〜014, load `tasks/TASK-XXX/<summary>` first where available, then the corresponding specification only if exact runtime contracts are needed. Never use a historical completion note to override a later current canonical.

For Calibration behavior, start with `tasks/TASK-014/TASK-014.summary.md`; then load `specifications/TASK-014_BAI_Development_OS_Adaptive_Governance_Calibration_Policy_Learning_Ver1.0.md` and only the relevant `src/calibration/` modules/tests. For Extension behavior, continue to use the TASK-013 summary/specification and only relevant `src/extension/` modules/tests.

## 4. Evidence and authority

A successful test, Plugin trust label, Connector result, Conformance report, Preview, Repair Plan, Registry entry or Dashboard value is evidence/derived state, not authorization or Canonical truth. Preserve Lifecycle/Owner/Knowledge/Security/Release authority boundaries.

## 5. Context Economy

Use DEV-0〜DEV-4 to select review/test/context depth. Do not raise Context Guard limits to accommodate duplicated history. Prefer current summaries and exact source sections. Historical evolution is loaded only when investigating provenance, regressions or supersession.

## 6. Extension and Calibration execution context

Do not load or execute provider implementation merely to discover a Manifest. Executable Extension code requires implementation-checksum binding. `IN_PROCESS_TRUSTED` requires independent trust evidence; `SANDBOXED` must execute through a Sandbox Runner. Sandbox-required capability cannot be converted to in-process execution for convenience. External side effects remain governed by IntegrationOS/Owner authorization. Calibration recommendations and Candidate state are advisory only. Do not load a recommendation as active policy unless it has PASS Counterfactual + Shadow evidence, matching Candidate checksums and explicit Owner/Policy authorization records.


For TASK-015 distributed CalibrationOS scope, load Architecture Ver.2.25 Part XV subsection 145.11 first. Load `architecture/BAI_Development_OS_Post_TASK014_Roadmap_Refinement_Ver1.0.md` only for provenance/audit. Do not create TASK-016 from TASK-014 residuals unless a later Owner decision identifies a genuinely independent product boundary.
