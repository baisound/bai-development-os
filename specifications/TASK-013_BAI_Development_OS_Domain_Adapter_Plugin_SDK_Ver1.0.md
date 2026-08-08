# TASK-013 — BAI Development OS Domain Adapter / Plugin SDK Detailed Design Ver.1.0

## 1. Document Control

```yaml
document_id: TASK-013-DOMAIN-ADAPTER-PLUGIN-SDK
version: "1.0"
status: CURRENT_CANONICAL
task_status: COMPLETED
development_profile: DEV_4_FOUNDATION_CRITICAL
architecture_parent: BAI Development OS Architecture Ver.2.23
machine_path: specifications/TASK-013_BAI_Development_OS_Domain_Adapter_Plugin_SDK_Ver1.0.md
human_companion: specifications/TASK-013_BAI_Development_OS_Domain_Adapter_Plugin_SDK_Ver1.0.docx
summary_path: specifications/TASK-013_BAI_Development_OS_Domain_Adapter_Plugin_SDK_Ver1.0.summary.md
```

## 2. Purpose

TASK-013 establishes `ExtensionOS`, the general Domain Adapter / Plugin SDK for extending BAI Development OS into Video, Audio, BGM/SE, Streaming, Unity, Web, Desktop, Automation and future domains without modifying OS Core. Knowledge, Orchestration, Monitoring, Integration, Security, Release, Conformance and Maintenance extension points are subordinate capabilities of the same extension boundary rather than separate plugin systems.

## 3. Authority boundary

An Extension may declare capabilities, policy/test/evidence packs, hooks and provider contracts. It never gains Lifecycle, Owner, Knowledge, Security, Release, Integration or Canonical authority by being installed or enabled. External/irreversible capabilities remain authorization-gated; sandbox-required capabilities cannot execute in-process; OpenAPI/MCP assistance creates a non-executable build-time plan only.

## 4. Extension lifecycle

The governed lifecycle is `discover → install → validate → enable → disable → upgrade → revoke → uninstall`. Discovery verifies checksummed manifests without executing provider code. Same-version content mutation is rejected. Downgrade is blocked unless explicitly allowed. Revoked Extensions cannot re-enable. Enabled dependents prevent changes that would break required dependency version/state contracts.

## 5. Extension Manifest

The immutable/checksummed Manifest binds Extension ID/version, domains, trust level, execution mode, implementation checksum, capabilities/operations, permissions, side-effect class, authorization/sandbox requirements, payload/runtime budgets, resource budgets, OS/platform/architecture compatibility, versioned Extension dependencies, Domain Pack IDs and subsystem hook types.

Trust levels are `OFFICIAL / COMMUNITY / PROJECT_LOCAL`. Execution modes are `DECLARATIVE / SANDBOXED / IN_PROCESS_TRUSTED`. A self-declared `OFFICIAL` value is descriptive metadata, not execution trust evidence.

## 6. Provider provenance and executable trust

Executable Extensions MUST declare a SHA-256 `implementation_checksum`. The runtime Provider MUST present the same implementation checksum and all declared capability handlers. Manifest checksum trust therefore also pins the expected implementation identity. Provider handler maps are snapshotted into immutable wrappers at registration so caller-side object mutation cannot replace implementation after validation.

`IN_PROCESS_TRUSTED` execution requires an independent checksum-pinned trust grant or verifier. Upgrade changes the Manifest checksum and therefore invalidates the previous in-process trust grant. `SANDBOXED` execution always passes through the configured Sandbox Runner.

## 7. Capability Broker

`CapabilityBroker` is the single executable capability boundary. It verifies enabled state, runtime dependencies, capability/operation, payload size, sandbox requirements, authorization references, optional authorization verification, permissions, max concurrency, runtime timeout and caller cancellation. External side effects require sandbox plus authorization. Declarative Extensions are never executable.

Timeout abort is propagated through `AbortSignal`. A non-cooperative provider that times out keeps its concurrency slot until its underlying operation actually settles; a timeout cannot create unbounded runaway concurrency. Timeout timers remain live so a provider with no other event-loop handles is still terminated by the configured runtime boundary.

## 8. Resource budgets

`max_concurrency` and runtime limits are actively enforced by the Broker. `max_memory_mb` is passed to Sandbox Providers and is advisory for explicitly trusted in-process code because same-process JavaScript cannot provide a hard per-plugin memory boundary. Hard memory enforcement belongs a Sandbox Provider, not a fake in-process guarantee.

## 9. Dependency safety

Dependencies support minimum/maximum Extension version and `require_enabled`. Runtime dependency state is rechecked for every invocation. Disabling or upgrading a dependency required to remain enabled is blocked while an enabled dependent exists. Upgrade that breaks a dependent version range is blocked. Revoking a dependency disables enabled dependents.

## 10. Durable Registry

Registry snapshots are sorted, immutable and checksummed. `saveExtensionRegistrySnapshot` persists them using SecurityOS trusted-path atomic writes; load verifies snapshot and every embedded Manifest. Executable Provider functions are never serialized. On restart, an executable Extension previously recorded as enabled is conservatively restored as `DISABLED` until a matching Provider is reattached and the Extension is explicitly enabled again. Declarative enabled state may be restored.

## 11. Domain Policy / Test / Evidence Packs

Versioned checksummed Domain Packs support `PROJECT_POLICY / TEST / EVIDENCE` and Security variants. Packs bind to installed Extension ID and declared domain; optional Manifest pack allowlists are enforced. Policy Packs cannot omit mandatory safety floors. Batch registration is transactional with respect to validation; an invalid/duplicate batch does not partially mutate the active pack set.

## 12. Artifact validation, preview and quality gate

Domain artifact handling routes through Broker-bound capabilities. Direct function registration that would bypass Extension trust/permission/authorization controls is not allowed. Preview output is explicitly `DERIVED_NON_CANONICAL`; a successful preview or quality result does not become Canonical content authority.

## 13. Subsystem hooks

Extension hooks cover `KNOWLEDGE / ORCHESTRATION / MONITORING / INTEGRATION / SECURITY / RELEASE / CONFORMANCE / MAINTENANCE`. Hook type and capability must be declared in the Manifest. Ordering is deterministic. Required hook failure stops the pipeline; optional hook failure degrades with evidence. Duplicate Hook IDs are rejected.

## 14. Reference domains

ExtensionOS ships declarative reference contracts for eight parent domains: `VIDEO`, `AUDIO`, `BGM_SE`, `STREAMING`, `UNITY`, `WEB`, `DESKTOP`, `AUTOMATION`. They demonstrate the common extension shape without granting execution or hardcoding domain-specific behavior into Core.

## 15. Conformance contract

Conformance verifies Manifest integrity, compatibility, required capabilities, Domain Pack checksum/type, Provider implementation provenance/handler completeness, sandbox boundary and independent in-process trust evidence. Sandboxed execution without a real sandbox probe remains `CONDITIONAL`; self-declared official trust without independent proof remains `CONDITIONAL`. An in-process Extension declaring any sandbox-required capability fails Conformance.

## 16. OpenAPI / MCP assisted adapter planning

`createContractAssistedAdapterPlan` accepts OpenAPI or MCP source references and emits only `NON_EXECUTABLE_BUILD_TIME_PLAN` with `authority_effect=NONE`. It may propose Manifest/capability/conformance drafts but is explicitly prohibited from enabling an Extension, granting permission/authorization, publishing or executing a Provider automatically.

## 17. Security / Integration boundary

Vault, KMS/HSM, signing, DLP, egress, supply-chain, Connector/Auth/Transport and other production providers use the same Extension contract. Their actual side effects remain governed by SecurityOS and IntegrationOS. Provider packages cannot self-authorize or bypass external-action gates.

## 18. Release / Conformance / Maintenance extension boundary

Platform installers, package managers, artifact sources, migration handlers, platform probes, Consumer runners, sandboxes, fixture generators, Maintenance adapters, precondition providers, reconcilers, checkpoint/quarantine/retention/drift/verifier providers all use the same Manifest/Capability/Trust/Conformance boundary. This prevents separate incompatible plugin architectures from emerging in each subsystem.

## 19. Critic findings resolved

1. Self-declared OFFICIAL trust enabled in-process execution → independent checksum-pinned trust required.
2. Sandbox-required capability could execute in-process → prohibited in Broker and Conformance.
3. Artifact direct function registration bypassed Broker → artifact binding routes through capabilities.
4. Packs/Hooks insufficiently bound to Manifest → Extension/domain/type/capability binding enforced.
5. Dependency was ID-only → version and required-enabled contracts added.
6. Timeout did not propagate cancellation → AbortSignal forwarding added.
7. Provider object could mutate after installation → immutable Provider snapshot.
8. Trust grant survived Extension upgrade by ID → Manifest checksum-pinned grant.
9. Declared max concurrency not enforced → Broker concurrency gate.
10. Timed-out non-cooperative operation released slot too early → slot retained until actual settlement.
11. Unref timeout could fail to fire for handle-less pending Provider → runtime timeout kept live.
12. Invalid Pack batch could partially mutate → transactional validation.
13. Duplicate hooks accepted → rejected.
14. Executable Manifest trusted without binding actual Provider implementation → implementation checksum binding.
15. Enabled dependency upgrade could silently violate `require_enabled` → upgrade blocked until dependent disabled.
16. Conformance counted tampered Packs or incomplete Provider handlers → integrity/contract verification added.
17. Extension Registry was process-memory-only → SecurityOS atomic durable snapshot + conservative restore.

Blocking Critic findings: `0`.

## 20. Verification baseline

- TASK-013 Extension suite: `161 / 161 PASS`.
- Full BAI Development OS: `1059 / 1059 PASS`.
- JavaScript Roulette Consumer: `10 / 10 PASS`.
- Extension Conformance: `10 schemas / 8 reference domains / 12 shared contracts PASS`.
- Roadmap Consolidation: `51 / 51 PASS`.
- Maintenance / Conformance / Release / Security conformance: PASS.
- Product Boundary: PASS.
- Root `ExtensionOS` export: PASS.

## 21. Accepted residual and future ownership

TASK-013 completes the general local Extension SDK and execution boundary. Domain/vendor-specific production Provider packages remain independently implementable Extensions and do not require Core changes. Evidence-driven plugin selection, trust/friction/resource/calibration policy belongs TASK-014. Remote/distributed Extension discovery, worker execution, registry propagation and distributed capability coordination belong TASK-015. Single-machine ExtensionOS remains a first-class deployment mode.

## 22. Completion route

TASK-013 is `COMPLETED`. TASK-014 — Adaptive Governance Calibration & Policy Learning is `NEXT / NOT_STARTED / NOT_AUTHORIZED`. TASK-015 remains `PROPOSED / NOT_STARTED / NOT_AUTHORIZED`.
