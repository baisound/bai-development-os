# TASK-021 — Final Plan and Owner Authorization

## Decisions

- Task allocation: `TASK-021 / BAI-OS-DESIGN-ONLY-CLOSURE-001`.
- Priority: `P0 / OWNER_DIRECTED`.
- Baseline: remote `main` at `8e13c81a986adbe41be7cfa6f4ffa8bb72ab40fc`.
- Design authority: `AUTHORIZED` by the 2026-08-27 Owner request.
- Implementation authority: `AUTHORIZED` only for the fail-closed Lifecycle, queue-binding, schema, migration, tests, documentation and Evidence defined below.
- Publication authority: `DRAFT_PR_AUTHORIZED` by the later Owner sleep instruction; protected-main merge, Release, Tag and Deploy remain unauthorized.

## Ordered plan

1. Preserve the dirty TASK-017 checkout and work only in the isolated TASK-021 worktree/branch.
2. Canonicalize Task identity, design and roadmap insertion.
3. Complete three independent design Critic audits, apply required fixes and obtain Judge readiness.
4. Implement record-schema `1.2.0` compatibility, explicit classification, direct design-only completion, Context binding and audit receipt.
5. Implement Canonical-to-queue binding that rejects projection-only completion.
6. Add migration/rollback and Consumer execution guidance.
7. Run focused, negative, dependency/queue integration, boundary/roadmap and full regression tests.
8. Run three implementation Critic passes, fix findings, record Judge/Evidence and create a local checkpoint.

## Allowed files

- `architecture/BAI_Development_OS_Post_TASK020_Design_Only_Closure_Roadmap_Refinement_Ver1.0.md`
- `specifications/TASK-021_BAI_Development_OS_Design_Only_Canonical_Closure_Lifecycle_Ver1.0.md`
- `tasks/TASK-021/**`
- `src/lifecycle/phase1/index.mjs`
- `src/lifecycle/phase1/**`
- `src/lifecycle/migration.mjs`
- `src/automation/canonical-status-binding.mjs`
- `src/automation/autonomous-queue.mjs`
- `src/automation/index.mjs`
- `src/dependency/index.mjs`
- `lifecycle/phase1/config/transition-matrix.json`
- `lifecycle/phase1/schemas/canonical-status-record.schema.json`
- `schemas/lifecycle/design-only-closure-*.schema.json`
- `schemas/lifecycle/design-only-authority-attestation.schema.json`
- `schemas/lifecycle/design-only-archive-authority.schema.json`
- `schemas/lifecycle/design-only-operation-bundle.schema.json`
- `schemas/lifecycle/canonical-status-*.schema.json`
- `schemas/lifecycle/design-only-critic-evidence.schema.json`
- `schemas/lifecycle/legacy-completion-attestation.schema.json`
- `schemas/lifecycle/lifecycle-event-1.2.schema.json`
- `tests/lifecycle/phase1/design-only-closure.test.mjs`
- `tests/lifecycle/phase1/design-only-closure-schema.test.mjs`
- `tests/lifecycle/phase1/lifecycle-store.test.mjs`
- `tests/lifecycle/migration.test.mjs`
- `tests/automation/canonical-status-binding.test.mjs`
- `tests/automation/autonomous-queue.test.mjs`
- `tests/dependency/dependency.test.mjs`
- `tests/integration/task021-design-only-closure.test.mjs`
- `package.json`
- `registry/autonomy-failure-registry.json`
- `PROJECT.md`
- `README-AI.md`
- `registry/current-state.md`
- `registry/ai-context-pack.md`
- `registry/operational-improvements.md`
- `registry/document-registry.yaml`

## Forbidden effects

Direct main push, protected-main merge, Release, Deploy, Tag, Production Activation, Consumer mutation, external/native/paid execution, credentials, real queue activation and destructive cleanup are forbidden. The Owner sleep instruction authorizes branch push and Draft PR creation without another confirmation.

## Implementation authorization condition

The Owner directive supplies bounded implementation authority, but implementation activation is conditional on the corrected detailed design receiving three independent Critic results with unresolved Critical/High `0/0` and a Judge `PASS_DESIGN_READY_FOR_IMPLEMENTATION`. The initial R1 review failed and did not activate implementation.

SecurityOS authorization/path primitives may be imported without modification. If they prove insufficient and a change under `src/security/**` is required, work MUST stop for an Allowed Files amendment.
