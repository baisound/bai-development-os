# BAI Development OS Post-TASK-011 Roadmap Refinement Ver.1.0

## Decision

TASK-011 remains `COMPLETED`. Implementation and Critic findings are allocated to TASK-012 through TASK-015 without reopening ConformanceOS core and without creating TASK-016. Additional REAL platform/provider runs are future certification evidence, not a reason to mislabel current simulated targets as complete.

## TASK-012

Add the following ConformanceOS self-maintenance scope:

- `conformance fsck` across Fixture, Matrix, Consumer execution evidence, Isolation/Fairness/Provider/Upgrade/Portability reports, Certification records and baseline checksums.
- Evidence freshness and environment-drift detection so an old REAL result cannot silently prove a materially changed runtime, filesystem, provider or Consumer revision.
- Detection/quarantine of orphan fixtures, missing Consumer roots, stale capability declarations, broken evidence references, duplicate run identities, truncated result sets and checksum-mismatched Certifications.
- Recovery classification for interrupted Consumer runs and partially written Certification artifacts; ambiguous execution results remain unproven rather than being guessed PASS.
- Deterministic Certification rebuild from immutable verified run evidence without upgrading `DECLARED`/`SIMULATED` evidence into `REAL`/`SANDBOX`.
- Baseline-diff reports that distinguish product regression, environment drift, provider drift and expected declared-scope change.
- Safe cleanup/retention for expired derived matrices, temporary sandbox workspaces and superseded Certification caches while retaining audit evidence required by policy.
- Re-execution proposals for stale or incomplete platform/provider evidence; automatic execution remains bounded by Runner trust/sandbox policy and authorization.
- Quarantine and Owner escalation when a previously certified project loses required evidence or its current environment can no longer be proven equivalent.

**Acceptance direction:** Conformance evidence remains trustworthy over time; maintenance may rebuild derived certification but never fabricate execution proof or silently preserve a stale PASS.

## TASK-013

Preserve TASK-013's original Domain Adapter / Plugin SDK mission and add ConformanceOS extension points:

- Platform Probe Provider SDK for OS, architecture, runtime, filesystem and capability discovery.
- Consumer Runner Provider SDK for bounded `NODE_TEST`, `NODE_SCRIPT`, `NPM_SCRIPT` and future domain-specific contract modes without exposing an arbitrary shell.
- Sandbox Provider SDK for local process isolation, container isolation and OS-native sandbox implementations.
- Fixture Provider / Generator SDK for project-local, official and community Consumer fixtures with explicit trust classification.
- Provider Conformance Adapter SDK for real API/service/backend capability and failure-semantic verification.
- Filesystem/Runtime Probe adapters for case sensitivity, symlink behavior, atomic rename, permissions and platform-specific constraints.
- Evidence Export/Import Provider for signed machine-readable Conformance results without treating imported evidence as REAL unless its execution provenance verifies.
- Windows and macOS native Runner/Probe providers so currently simulated targets can gain REAL evidence without core ConformanceOS edits.
- Cloud/lab execution adapters may provision or invoke external environments only through TASK-008 IntegrationOS with explicit external-side-effect authorization.
- Every provider declares capability manifest, supported evidence level, trust/sandbox requirement, version compatibility, resource budget and failure contract.
- Add provider conformance kits proving root confinement, command-mode restrictions, evidence classification and failure isolation.

**Acceptance direction:** new platforms, runtimes, sandboxes and provider labs are added through bounded adapters and evidence contracts, not through special cases in ConformanceOS core.

## TASK-014

Add evidence-driven ConformanceOS calibration:

- Measure flaky Consumer/Provider/Portability probes and distinguish infrastructure instability from product regression.
- Calibrate evidence-freshness windows by risk, environment volatility and Consumer criticality while preserving explicit stale-evidence disclosure.
- Calibrate weighted fairness and noisy-neighbor thresholds from observed shared-resource behavior.
- Measure false PASS, false FAIL and excessive CONDITIONAL outcomes against later verified evidence.
- Recommend which OS/architecture/filesystem/provider combinations deserve REAL execution next, using risk, usage, change history, cost and coverage gaps.
- Calibrate adversarial fixture selection and Certification depth so DEV-0〜4 profiles receive proportional evidence without weakening CORE/FOUNDATION floors.
- Evaluate C0〜C5 Certification usefulness and threshold friction; changes remain recommendation-driven and versioned.
- Detect blind spots where many simulated/declarative results create misleading apparent coverage.
- Use counterfactual replay to compare alternate coverage matrices, fairness thresholds and probe policies before adopting them.

Mandatory evidence floors MUST NOT be auto-weakened: `DECLARED`/`SIMULATED` can never be learned into `REAL`; C2+ still requires successful REAL/SANDBOX execution; root confinement, trusted/sandboxed execution and authority boundaries remain fixed safety constraints.

## TASK-015

Extend the optional Distributed Orchestration & Event Fabric with ConformanceOS execution:

- Remote Conformance Worker identity, capability advertisement and attestation for OS, architecture, runtime, filesystem, sandbox and provider access.
- Capability-aware scheduling that sends a fixture only to workers satisfying its declared execution requirements.
- Signed run request/result envelopes with project, fixture revision, worker identity, environment fingerprint, correlation id, checksum and evidence classification.
- Worker lease/heartbeat/fencing so a stale worker cannot publish authoritative late results after ownership transfer or cancellation.
- At-least-once run dispatch with idempotent run identity and duplicate-result suppression.
- Late-result quarantine when fixture revision, policy, trust, key version or required environment changed while the run was executing.
- Secure artifact/evidence transfer with checksum/signature verification and explicit size/cost limits.
- Cross-machine fairness and quota coordination for expensive Consumer, provider and portability test matrices.
- Remote Windows/macOS/Linux workers can contribute REAL evidence only after worker attestation and Runner/Sandbox contracts verify; remote location alone does not upgrade evidence class.
- Partition, worker crash, duplicate dispatch, clock skew, stale capability advertisement, compromised worker, lost result and replay-storm fault matrices.
- External cloud/lab provisioning remains a TASK-008 governed external side effect; TASK-015 coordinates already-authorized distributed execution rather than granting access itself.

**Acceptance direction:** distributed labs can accumulate real heterogeneous platform/provider evidence while retaining the same trust/evidence rules as local TASK-011; single-machine Conformance remains first-class.

## Authority Boundary

- TASK-011 remains completed.
- TASK-012 is `NEXT / NOT_STARTED / NOT_AUTHORIZED`.
- TASK-013 through TASK-015 remain `PROPOSED / NOT_STARTED / NOT_AUTHORIZED`.
- External cloud/lab provisioning remains governed by TASK-008 IntegrationOS.
- No TASK-016 is created.
