# TASK-020 — Final Plan and Owner Implementation Authorization

## Owner authorization

Owner directive: create a BAI DEVELOPMENT OS development branch, create the design document, adjust the roadmap, and then perform development.

Decision: `TASK020_FOUNDATION_IMPLEMENTATION_AUTHORIZED`.

## Ordered plan

1. Canonicalize TASK-020 identity, design and roadmap allocation.
2. Implement pure immutable contracts and schemas.
3. Implement deterministic state transitions, authority intersection, fencing and bounded recovery decisions.
4. Implement durable in-process/store-neutral producer/target delivery contracts without external effects.
5. Implement branch lifecycle and Product completion guards.
6. Synchronize exports and Role/Workflow policy.
7. Run focused tests, boundary/roadmap checks and full regression.
8. Record implementation Evidence; publication remains separate.

## Allowed files

- `architecture/BAI_Development_OS_Post_TASK019_Autonomous_Worklane_Roadmap_Refinement_Ver1.0.md`
- `specifications/TASK-020_BAI_Development_OS_Autonomous_Worklane_Durable_Dispatch_Ver1.0.md`
- `tasks/TASK-020/**`
- `src/automation/**`
- `schemas/automation/**`
- `tests/automation/**`
- `tests/integration/task020*.test.mjs`
- `roles/README-Orchestrator.md`
- `roles/README-Builder.md`
- `roles/README-Tester.md`
- `roles/README-Critic.md`
- `roles/README-Judge.md`
- `common/Workflow-Specification.md`
- `registry/current-state.md`
- `registry/ai-context-pack.md`
- `registry/operational-improvements.md`
- `PROJECT.md`
- `README-AI.md`
- `package.json`

Document Registry synchronization is deferred until the changed set is final and validated; historical files are not rewritten.

## Forbidden effects

- direct push to main;
- Release, Deploy or Production Activation;
- Consumer repository mutation;
- external/native/paid effect execution;
- destructive cleanup outside tests;
- activation or migration of real running lanes.

## Validation

- schema validation and exact state-transition negative tests;
- focused automation and TASK-020 integration tests;
- product boundary and roadmap checks;
- full `npm test` regression;
- diff scope and secret/private-path scan.
