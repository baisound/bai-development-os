# TASK-006 BAI Development OS Orchestration & Automation Foundation Detailed Design Ver.1.0

## Document Control

| Item | Value |
| --- | --- |
| Document | TASK-006 Orchestration & Automation Foundation Detailed Design |
| Version | 1.0 |
| Status | CURRENT_CANONICAL / COMPLETED_IMPLEMENTATION |
| Date | 2026-08-08 |
| Product Root | `/home/baisound/bai-development-os` |
| Development Profile | `DEV_4_FOUNDATION_CRITICAL` |
| Predecessor | TASK-005 Knowledge Operating System Ver.1.2 / COMPLETED |
| Parent Architecture | BAI Development OS Architecture Ver.2.7 at design start; Ver.2.8 after completion synchronization |
| Authority | Owner direct instruction to proceed with TASK-006 detailed design and development |
| Permanent Model Policy | UNCHANGED |

# 1. Purpose

TASK-006 turns the completed Lifecycle and Knowledge foundations into a governed execution substrate that can discover projects and documents, resolve runtime/project/risk/knowledge context, construct bounded role startup packages, compile instructions, support safe restart and reliability, synchronize derived documentation, execute authorized automation, and validate end-to-end governance.

The subsystem is deliberately not an unrestricted autonomous agent. It must make automation faster for already-authorized, reversible, scope-bound work while retaining explicit Owner gates for irreversible, external-side-effect, publication, deletion and policy-changing actions.

# 2. Responsibility Boundary

## 2.1 TASK-006 Owns

- Workspace/project/document discovery indexes and deterministic resolution.
- Runtime/environment/shell/root probe resolution from current evidence.
- Project and adaptive risk/profile resolution.
- TASK-005 Knowledge resolution integration for role startup.
- Role Startup Package and instruction compilation.
- Owner Authorization Proposal generation and approval validation.
- Retry/session/restart/worktree evidence helpers.
- Canonical document resolution and authorized derived-document synchronization.
- Advanced execution guards for context/model/prompt/budget optimization.
- Conditional automation planning, scheduling, normalization and gate evaluation.
- Verified TASK-004 Completion Outbox consumption for derived synchronization.
- Sandbox-only runtime mutation/fault-injection probes.

## 2.2 TASK-006 Does Not Own

- TASK-004 Lifecycle canonical state authority.
- TASK-005 Knowledge content/governance authority.
- Owner authorization authority.
- External connector execution owned by TASK-008.
- Monitoring/dashboard product surfaces owned by TASK-007.
- Distribution/release compatibility owned by TASK-010.
- General supply-chain hardening owned by TASK-009.

## 2.3 Authority Invariants

1. Registry is an index, never content authority.
2. Automation may propose Lifecycle action but cannot silently mutate canonical Lifecycle state.
3. Knowledge Pack must pass TASK-004 Context Manifest before role execution.
4. Owner Proposal is not Owner Authorization.
5. Runtime facts come from current probe evidence, not UI labels or historical assumptions.
6. Normal authorized/reversible/scope-bound implementation must not require redundant Owner confirmation.
7. Irreversible, external-side-effect, publication, deletion and policy actions require Owner approval.
8. Mutation/fault-injection probes require explicit authorization and an isolated sandbox.
9. Derived-sync failure after canonical completion produces `SYNC_PENDING`; it never rolls canonical completion back.
10. Permanent model-routing vendor policy is unchanged by TASK-006.

# 3. Fifteen-Phase Internal Roadmap

| Phase | Capability | Completion Result |
| ---: | --- | --- |
| 1 | Registry / Discovery | deterministic, hash-bound indexes with root safety |
| 2 | Runtime / Environment / Shell / Root Resolution | probe-evidence runtime profile and command dialect |
| 3 | Activation Validation / Startup Package | bounded role startup contract and activation guard |
| 4 | Project / Risk Resolution | explicit project identity and adaptive DEV profile |
| 5 | TASK-005 Knowledge Resolver Integration | version-pinned Knowledge Pack through Context Manifest |
| 6 | Instruction Compiler | deterministic instruction package with authority bindings |
| 7 | Owner Decision Support | authorization proposal, never self-authorization |
| 8 | Reliability / Retry | bounded retry classification and changed-hypothesis requirement |
| 9 | Restart / Session / Worktree Evidence | safe restart validation and current Git evidence |
| 10 | Document Resolution | current canonical document resolution and conflict Safe Stop |
| 11 | Document Synchronization | authorized derived-view synchronization and verification |
| 12 | Probe / Mutation / Fault Injection | read probes plus authorized sandbox mutation/fault tests |
| 13 | Advanced Guard | context/model/prompt/cache/budget optimization boundary |
| 14 | Conditional Automation | scheduling, plan, gate, result, outbox and authority-aware automation |
| 15 | End-to-End Governance Validation | integrated Registry→Runtime→Knowledge→Startup→Instruction→Plan flow |

# 4. Phase 1 — Workspace Registry and Discovery

## 4.1 Registry Contract

Workspace Registry records paths, category, size, checksum and loading hints. It is disposable/rebuildable derived state and must never become the canonical content source.

`rebuildWorkspaceRegistry(root)`:

- scans explicit product-owned categories;
- excludes `.git`, `node_modules`, `dist` and non-product build artifacts;
- records SHA-256 and metadata;
- does not follow arbitrary symlinks;
- returns `content_authority: false`.

`verifyWorkspaceRegistry` detects missing files, checksum mismatch, size mismatch and root escape.

## 4.2 Multi-Project Project Index

`buildWorkspaceProjectIndex({ workspace_root, projects })` creates an explicit project index for the OS and consumers. Every project requires a unique `project_id`, canonical realpath and manifest hash. Project roots must remain under the declared workspace root.

This index solves the single-product-root limitation without turning the Registry into Project configuration authority.

## 4.3 Persisted Registry Mutation

`persistWorkspaceRegistry` requires explicit authorization and writes atomically to `.bai-os/workspace-registry.json`. `createRegistryUpdateProposal` allows preview/diff without mutation.

# 5. Phase 2 — Runtime, Environment, Shell and Root Resolution

Runtime resolution accepts only current probe evidence. Supported runtime profile fields include platform, architecture, shell, current working directory, workspace/project roots and capability evidence.

Rules:

- supported platform: linux, darwin, win32;
- supported shell includes bash/sh/zsh/fish/powershell/cmd;
- UI labels alone cannot establish runtime facts;
- project root must resolve inside workspace root;
- command dialect derives from resolved runtime, not guessed environment;
- `NOT_READY` or unknown readiness cannot pass via suffix/string heuristics.

# 6. Phase 3 — Activation Validation and Role Startup Package

`buildRoleStartupPackage` binds:

- project/task/role/phase;
- task/status revision and authorization facts;
- runtime profile and environment capabilities;
- adaptive development profile/risk;
- resolved Knowledge Pack;
- TASK-004 Context Manifest;
- model/independent-review routing facts;
- allowed/protected paths;
- stop conditions and expected outputs;
- prompt binding checksum.

`validateRoleActivation` revalidates task/phase/status revision, authorization, worktree and startup bindings immediately before activation. Any contradiction Safe Stops.

# 7. Phase 4 — Project and Risk Resolution

`resolveProject` uses explicit Registry/Project Index records and canonical roots. Ambiguous or missing project identity is not inferred.

`resolveRisk` delegates to TASK-004 Adaptive Development Governance. TASK-006 does not invent a second risk policy. The resulting DEV-0 through DEV-4 profile controls review/test/evidence depth while preserving mandatory safety floors.

# 8. Phase 5 — Knowledge Resolver Integration

`resolveTaskKnowledge` delegates to TASK-005 Knowledge Repository/Resolver and produces a version-pinned Knowledge Pack. TASK-006 records:

- `context_ingestion_required: true`;
- `registry_is_knowledge_authority: false`.

The Pack is converted into a TRUSTED TASK-004 Context Source and included in Context Manifest before execution. Registry lookup cannot bypass Knowledge Governance.

# 9. Phase 6 — Instruction Compiler

`compileOrchestratorInstruction` deterministically combines Startup Package, assignment, expected outputs, constraints, allowed/protected paths, stop conditions and authority facts into an execution instruction.

The compiler must not manufacture authorization, task status or Knowledge. It compiles already-resolved canonical facts.

# 10. Phase 7 — Owner Decision Support

`createOwnerAuthorizationProposal` creates a bounded proposal containing requested action, rationale, scope, expiry, risk and proposed authorization effect.

Binding fields:

- `owner_approval_required: true`;
- `authorization_granted: false`.

`validateOwnerApproval` verifies identity/scope/expiry and rejects invalid timestamps. Owner Decision Support is explanatory/proposal infrastructure; it is not a substitute Owner.

# 11. Phase 8 — Reliability and Retry

`classifyRetry` separates transient vs deterministic failure and applies bounded retry rules.

- transient failures may be retried within limits;
- deterministic failures require a changed hypothesis/input before retry;
- external-side-effect retry requires Owner control;
- exhausted retry budget Safe Stops.

This works with TASK-004 Execution Budget Guard rather than creating a separate unlimited loop.

# 12. Phase 9 — Session, Restart and Worktree Evidence

TASK-006 uses TASK-004 recovery/checkpoint APIs for restart planning and validation. It does not redefine canonical lifecycle recovery.

`resolveWorktreeEvidence` obtains current Git facts from the repository instead of trusting stale prose. Session records bind project/task/role/startup identity and can be used to validate continuity after interruption.

# 13. Phase 10 — Canonical Document Resolution

`resolveCanonicalDocument` chooses a current canonical document only when version/status/authority are unambiguous. Conflicting current canonicals Safe Stop.

`buildCanonicalDocumentManifest` records selected canonical files and detects duplicate current versions. `verifyCanonicalDocumentSet` and `checkCrossFormatConsistency` support MD/DOCX/Summary/Registry synchronization checks without granting mutation authority.

# 14. Phase 11 — Authorized Documentation Synchronization

`createDocumentationSyncProposal` previews derived-view changes. `applyAuthorizedDocumentationSync` requires authorization and is limited to derived/document synchronization paths; canonical authority-bearing writes are forbidden by this API.

TASK-004 System Sync verification is reused. Writes are root/symlink safe and prevalidated.

Residual: multi-file derived document synchronization is fail-safe but not a single power-loss-atomic transaction. Journal/recovery belongs to TASK-009/TASK-012.

# 15. Phase 12 — Runtime Probe, Mutation and Fault Injection

`runRuntimeProbeSet` provides read-only evidence collection.

`executeSandboxMutationProbe` requires:

- explicit authorization;
- sandbox root;
- target confined inside sandbox.

`runFaultInjection` additionally requires `sandbox_only: true`. Production fault injection is refused. This allows reliability validation without normalizing destructive project mutation.

# 16. Phase 13 — Advanced Guard

TASK-006 composes existing guard subsystems instead of replacing them.

## 16.1 Dynamic Context Optimization

`optimizeContext` delegates to TASK-004 Context Control. Required canonical/trusted sources cannot be silently removed merely to save tokens.

## 16.2 Model Selection With Policy

`selectModelWithPolicy` consumes TASK-004 Model Control facts and execution requirements. It does not permanently redefine provider/vendor policy.

## 16.3 Prompt Compression

`compressPrompt` supports any positive output budget and records whether truncation/compression occurred. Arbitrary minimum prompt length is deliberately not imposed.

## 16.4 Dynamic Budget Optimization

`optimizeDynamicBudget` respects TASK-004 Cost/Execution Budget Guard. Optimization is advisory/bounded and cannot bypass hard limits.

# 17. Phase 14 — Conditional Automation Engine

## 17.1 Action Classification

Automatically executable categories include read/search/design proposal/test-without-external-side-effect/verify.

`IMPLEMENT_WRITE` may proceed without a second Owner confirmation only when all are true:

- Lifecycle authorization is already `AUTHORIZED`;
- scope is explicitly bound;
- change is reversible;
- no external side effect exists.

Owner approval remains mandatory for:

- irreversible changes;
- external side effects;
- policy updates;
- publication/send actions;
- delete actions;
- global Knowledge promotion;
- unknown action classes.

## 17.2 Automation Plan

`createAutomationPlan` always exposes:

- `lifecycle_mutation_authority: false`;
- `knowledge_content_authority: false`.

The plan is an execution plan, not an authority grant.

## 17.3 Scheduler and Gate Evaluation

Scheduler provides dependency-aware topological ordering, cycle/missing-dependency rejection, runnable/waiting selection, deadline checks, result normalization and deterministic gate evaluation.

# 18. Completion Outbox Consumer

`validateVerifiedOutboxEvent` accepts only `VERIFIED_DURABLE_OUTBOX` events that bind task/revision/checksum to a verified canonical read and PASS gate.

`consumeDerivedSyncOutbox`:

- requires authorization;
- writes idempotency acknowledgements under `.bai-os/automation/derived-sync-acks.jsonl`;
- prevents duplicate reapplication;
- returns `DERIVED_SYNC_PENDING` on derived sync failure;
- always records `canonical_completion_rolled_back: false`.

Canonical TASK completion cannot be undone because a derived view failed to update.

# 19. End-to-End Service Flow

`prepareAutomationRun` composes the subsystem as:

```text
Workspace Registry / Project Index
        ↓
Runtime Probe / Environment Resolution
        ↓
Project + Adaptive Risk Resolution
        ↓
TASK-005 Knowledge Resolution
        ↓
TASK-004 Context Manifest
        ↓
Role Startup Package
        ↓
Instruction Compiler
        ↓
Automation Plan
        ↓
Owner Proposal only when required
        ↓
Authorized Execution / Verification
```

At no point does the service self-authorize.

# 20. Public Runtime Layout

```text
src/automation/
  util.mjs
  registry.mjs
  runtime.mjs
  resolution.mjs
  startup.mjs
  instruction.mjs
  reliability.mjs
  documents.mjs
  advanced-guard.mjs
  engine.mjs
  probe.mjs
  outbox.mjs
  scheduler.mjs
  service.mjs
  index.mjs
```

Public package export: `bai-development-os/automation`; root namespace: `AutomationOS`.

# 21. Canonical Machine Schemas

- `schemas/automation/authorization-proposal.schema.json`
- `schemas/automation/automation-plan.schema.json`
- `schemas/automation/canonical-document-manifest.schema.json`
- `schemas/automation/derived-sync-ack.schema.json`
- `schemas/automation/role-startup-package.schema.json`
- `schemas/automation/runtime-profile.schema.json`
- `schemas/automation/session-record.schema.json`
- `schemas/automation/workspace-project-index.schema.json`
- `schemas/automation/workspace-registry.schema.json`

All are JSON Schema Draft 2020-12 contracts.

# 22. Testing Strategy — DEV-4

TASK-006 is foundation-critical. Required assurance covers:

- Registry checksum/size/root and symlink boundaries;
- multi-project index ambiguity/root escape;
- runtime probe evidence and NOT_READY false-positive prevention;
- project/risk resolver determinism;
- Knowledge Pack → Context Manifest boundary;
- startup task/phase/revision/auth/worktree mismatch;
- invalid/expired Owner approval;
- bounded transient/deterministic retries;
- restart/session/worktree evidence;
- duplicate/conflicting current canonical documents;
- documentation sync authorization/root boundaries;
- prompt/context/model/budget guard composition;
- already-authorized implementation vs redundant Owner gate;
- unknown/irreversible/external/policy action Safe Stop;
- sandbox-only mutation/fault injection;
- verified outbox, checksum binding and idempotency;
- derived-sync failure without canonical completion rollback;
- scheduler cycle/missing dependency/deadline handling;
- end-to-end authority preservation;
- all schema contracts;
- full TASK-004/TASK-005 regression and Product Boundary regression.

# 23. Blocking Critic Findings Resolved

1. Runtime readiness formerly used a suffix-style check that could misread `NOT_READY` as ready. It now requires exact known readiness values.
2. Owner approval expiry validation accepted an invalid timestamp path. Invalid timestamps now fail validation.
3. Treating every `IMPLEMENT_WRITE` as Owner-gated would recreate over-governance. Already-authorized, reversible, scope-bound, no-external-side-effect implementation is now automatable; dangerous classes retain Owner gates.
4. A single-root Registry was insufficient for a reusable OS. Explicit multi-project Project Index support was added.
5. Prompt compression had an arbitrary minimum size that rejected legitimate small work. It now supports any positive budget.

Blocking Critic findings at completion: `0`.

# 24. Accepted Residual / Deferred Scope

- Multi-file derived documentation sync is not one crash-atomic filesystem transaction; TASK-009/TASK-012 own journaling/recovery/repair hardening.
- Outbox acknowledgement is a local derived JSONL/idempotency ledger, not a distributed transaction coordinator.
- Monitoring dashboards/metrics remain TASK-007.
- External service/connector execution remains TASK-008.
- Supply-chain/security hardening remains TASK-009.
- Release/distribution compatibility remains TASK-010.
- Multi-consumer conformance lab remains TASK-011.
- Adaptive policy calibration remains TASK-014.

# 25. Acceptance Criteria

1. Workspace Registry/Project Index are deterministic, verifiable and non-authoritative.
2. Runtime/project/root facts require current probe evidence and root confinement.
3. Startup Package binds Task/Phase/Role/Runtime/Risk/Knowledge/Context/Auth/Evidence.
4. Knowledge integration cannot bypass TASK-005 Governance or TASK-004 Context Manifest.
5. Instruction Compiler cannot manufacture authorization.
6. Owner Proposal cannot self-grant authorization.
7. Retry and restart behavior are bounded and evidence-based.
8. Canonical document conflicts fail closed.
9. Documentation sync requires authorization and cannot use this API to overwrite authority-bearing canonical state.
10. Production destructive mutation/fault injection is refused.
11. Already-authorized safe implementation is not redundantly Owner-gated.
12. Dangerous/unknown actions require Owner approval or Safe Stop.
13. Verified Completion Outbox consumption is idempotent and cannot roll back canonical completion.
14. TASK-004 Lifecycle canonical state is never directly owned by TASK-006.
15. TASK-005 Knowledge content authority is never owned by Registry/Automation.
16. All machine schemas validate as Draft 2020-12.
17. TASK-006 dedicated tests, full OS regression, Product Boundary and Consumer regression pass.
18. Canonical MD/DOCX/Summary/Registry/Current State are synchronized.

# 26. Completion Record

TASK-006 implementation is completed on 2026-08-08 under `DEV_4_FOUNDATION_CRITICAL`. All fifteen internal phases have executable runtime surfaces. The final dedicated automation suite passes `116 / 116`; the complete BAI Development OS suite passes `425 / 425`; Product Boundary and root `AutomationOS` export pass. Final Consumer and document/Registry QA evidence is recorded in TASK-006 completion artifacts.

TASK-006 completion does not automatically start TASK-007. The next canonical route becomes TASK-007 — Monitoring & Dashboard, subject to its own implementation instruction/authority.
