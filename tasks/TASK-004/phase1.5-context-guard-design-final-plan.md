# TASK-004 Phase 1.5 — Context Guard MVP: Integrated Design and Final Plan

## 1. Document Control

| Item | Value |
|---|---|
| Authoring Role | Builder |
| Active Project / Task | `/home/baisound/projects/javascript-roulette` / `TASK-004` |
| Phase | `1.5 — Context Guard MVP` |
| Owner authorization | Integrated design and Final Plan creation: `AUTHORIZED` |
| Implementation authorization | `NOT_AUTHORIZED` |
| Allowed persistent output | This file only |
| Result | `PHASE1_5_DESIGN_FINAL_PLAN_READY_WITH_CONDITIONS` |

This combined artifact replaces neither the Phase 1 Final Plan nor any historical
evidence. It defines a bounded Context Guard MVP only; it does not authorize
implementation, review, judgment, Git, Status, Registry, Runtime State, or
Phase 5A activity.

## 2. Context Guard Preflight for This Design

```yaml
context_preflight:
  requested_inputs:
    - README-Builder.md
    - Evidence-Specification.md
    - Authority-Specification.md
    - phase1.5-context-guard-kickoff.md
    - foundation-improvement-integration-plan.md
    - final-plan.md
    - src/lifecycle/phase1/index.mjs
    - tests/lifecycle/phase1/lifecycle-store.test.mjs
    - package.json
    - .gitignore
  selected_inputs:
    - README-Builder.md
    - Evidence-Specification.md
    - Authority-Specification.md
    - phase1.5-context-guard-kickoff.md
    - foundation-improvement-integration-plan.md
    - final-plan.md
    - package.json
    - .gitignore
  excluded_inputs:
    - src/lifecycle/phase1/index.mjs
    - tests/lifecycle/phase1/lifecycle-store.test.mjs
  duplicate_inputs: []
  total_selected_files: 8
  total_selected_bytes: 73728
  estimated_input_tokens: 29492
  estimated_output_tokens: 7000
  expected_sections: 16
  decision: PASS_WITH_REDUCTION
```

`total_selected_bytes` and both token values are conservative estimates, not
measurements. The Builder read each mandatory input once as directed. The Phase 1
source and test were then excluded from the retained design context because their
only required conclusions are already recorded here: Phase 1 has separate source
and tests, its public exports include `canonicalJson` and `checksum`, and its
existing lifecycle semantics and 88-test regression must remain unchanged. They
are neither duplicate nor irrelevant; they are excluded after necessary
compatibility facts were extracted, avoiding retention of their full contents.
No Phase 5A evidence was read.

The reduction makes the estimated input remain below the proposed `32,000`-token
hard limit and preserves every required design authority. A future implementation
preflight must re-inventory actual inputs and may not reuse these estimates.

## 3. Objective, Boundary, and Invariants

The Context Guard estimates and constrains input and output before a Role is
activated or an artifact is generated. It is fail-closed: incomplete inventory,
unknown canonical authority, unreadable required input, unresolved duplicate, or
an unsatisfied hard limit blocks activation.

In scope: inventory, file metadata, content-hash duplicate detection, input
classification and selection, byte/token/output estimates, limits, five
decisions, scoped Owner overrides, evidence creation, and a Role-activation
preflight entry point.

Out of scope: pricing, billing, Cost Ledger, daily/monthly budgets, provider or
model selection, retries as a billing concern, Phase 1.7/1.8 features, and
TASK-006 Advanced Guard. `max_review_depth` and `max_revision_cycles` are retained
solely to constrain context growth.

Phase 1 lifecycle semantics, canonical state files, fixtures, D-01 through D-06,
and the existing 88 tests are immutable compatibility targets. Context Guard is
an independent preflight and must not invoke, alter, or persist Phase 1 lifecycle
runtime state.

## 4. Exact Defaults and Override Bounds

| Limit | Exact value / unit | Type | Trigger decision | Override | Valid scope / expiry | Required override evidence |
|---|---:|---|---|---|---|---|
| `max_files_per_role` | `12` files | Hard | `OWNER_OVERRIDE_REQUIRED` | Yes | One role, one session, one preflight; expires after 60 minutes | selected paths/checksums, extra-file purpose, revised inventory |
| `max_total_input_bytes` | `131072` bytes | Hard | `OWNER_OVERRIDE_REQUIRED` | Yes | Same; 60 minutes | calculated total, mandatory-input rationale, rejected reductions |
| `max_estimated_input_tokens` | `32000` estimated tokens | Hard | `OWNER_OVERRIDE_REQUIRED` | Yes | Same; 60 minutes | estimation method, margin, selected checksums, reduction analysis |
| `max_estimated_output_tokens` | `8000` estimated tokens | Hard | `SPLIT_REQUIRED`; override only if splitting cannot preserve authority | Yes | One named artifact, one session; 60 minutes | section/output estimate, split analysis, target path |
| `max_artifact_sections` | `16` sections | Soft | `SPLIT_REQUIRED` when size or readability would be impaired | Yes | One named artifact; 60 minutes | section inventory and traceability reason |
| `max_single_artifact_bytes` | `65536` bytes | Hard | `SPLIT_REQUIRED`; then `OWNER_OVERRIDE_REQUIRED` if indivisible | Yes | One named artifact; 60 minutes | projected bytes, split plan, mandatory-content rationale |
| `max_review_depth` | `1` independent review | Hard | `OWNER_OVERRIDE_REQUIRED` | Yes | One additional named review; 60 minutes | prior findings, unresolved risk, expected distinct value |
| `max_revision_cycles` | `1` Builder revision | Hard | `OWNER_OVERRIDE_REQUIRED` | Yes | One additional named revision; 60 minutes | prior review, exact correction scope, remaining findings |

Overrides are single-use and limit-specific. They cannot be issued by a Role,
cannot disable multiple limits, cannot transfer to another session or Role, and
are invalid when the selected input checksum set changes.

## 5. Estimation, Classification, and Selection

### Token estimation

The preferred MVP method reads a supported UTF-8 text file as bytes, calculates
`ceil(utf8_bytes / 3)`, then applies a 20% safety margin:
`ceil(ceil(bytes / 3) * 1.20)`. It deliberately reports `estimated_tokens`, never
actual provider tokens. The fallback for text whose byte read succeeds but whose
encoding is unsupported is `ceil(bytes * 0.5) * 1.20`, rounded up; this is
intentionally pessimistic. Unknown binary files and unreadable files are not
estimated: required ones cause `HARD_STOP`; optional ones are excluded and
recorded. Character-count estimation is permitted only when byte collection is
unavailable for a confirmed UTF-8 string, using `ceil(characters * 0.5 * 1.20)`;
it must identify itself as a fallback.

Output estimate is a planned upper bound: sum the requested sections' estimated
tokens, add 20%, then compare with output-token and artifact-byte limits.

### Fixed classifications

| Class | Read / full read | Excludable | Override | Evidence record |
|---|---|---|---|---|
| `MANDATORY_CANONICAL` | Allowed / full when bounded | No | Only to exceed a limit | path, authority basis, checksum, estimate |
| `MANDATORY_CURRENT_TASK` | Allowed / full when bounded | No | Only to exceed a limit | path, task relevance, checksum, estimate |
| `CONDITIONAL_SUPPORTING` | Allowed / excerpt first | Yes | No | purpose and selected/excluded result |
| `HISTORICAL_EVIDENCE` | Allowed / excerpt or sample only | Yes unless directly authoritative | Yes if full read is required | historical basis, sample rule, reason |
| `DUPLICATE` | Metadata/hash only after first copy | Yes | No | duplicate key and retained canonical path |
| `IRRELEVANT` | No | Yes | No | exclusion reason |
| `UNREADABLE` | No further read | Required input: no; optional: yes | Owner action only if required | error, path, requiredness |
| `UNKNOWN` | No | No until classified | Owner clarification | uncertainty and Safe Stop |

Selection is deterministic: Role specification → Authority specification →
Evidence specification → current Task Definition → current approved plan → current
source/tests → current review finding → supporting evidence → historical evidence.
For every candidate, deduplicate by `sha256:<content bytes>` plus the authority
class and logical purpose; filenames alone never establish identity. The current
artifact is the current task artifact explicitly identified by the task/phase and
authority record. Historical evidence is immutable, superseded, or not designated
current. A canonical conflict, missing authority designation, or conflicting
same-purpose hashes produces `HARD_STOP`.

When the byte budget is exceeded, remove in this order: `IRRELEVANT`, `DUPLICATE`,
non-authoritative `HISTORICAL_EVIDENCE`, then `CONDITIONAL_SUPPORTING`. Mandatory
canonical and current-task inputs are never silently removed.

## 6. Decision and Error Contract

| Decision | Trigger | Role activation | Allowed / prohibited action | Evidence / approval / retry |
|---|---|---|---|---|
| `PASS` | Complete estimates, resolved classes/duplicates, all hard limits satisfied | Allowed | Execute the bounded activation; no unlisted input or scope expansion | Complete preflight; no approval; a changed inventory requires new preflight |
| `PASS_WITH_REDUCTION` | Removing permitted duplicate, historical, or supporting input makes the plan bounded | Not yet allowed | Apply the recorded reduction and re-evaluate; do not activate on the interim decision | before/after inventories and reason; no approval; retry once with the reduced inventory |
| `SPLIT_REQUIRED` | Planned artifact exceeds output/size/section constraints but separable artifacts preserve authority | Not allowed | Produce a bounded split proposal; do not write the oversized artifact | projected parts/dependencies; no approval for proposal; re-preflight each part |
| `OWNER_OVERRIDE_REQUIRED` | A mandatory bounded operation exceeds a hard limit and a scoped exception is safe | Not allowed | Request the exact override; do not proceed or self-authorize | exceeded limit, alternatives, override record; Owner approval; one re-evaluation after issue |
| `HARD_STOP` | Estimation/inventory incomplete, required input unreadable, canonical conflict/unknown, unresolved duplicate, or no safe override | Not allowed | Preserve findings and request clarification; no artifact or implementation | error evidence; no automatic retry—only changed evidence or Owner direction |

| Error code | Trigger | Retryable | Safe stop / Owner action | Required evidence |
|---|---|---|---|---|
| `CONTEXT_INPUT_UNREADABLE` | Required input cannot be read | No | Stop; Owner supplies accessible authority | path and read error |
| `CONTEXT_INVENTORY_INCOMPLETE` | Required metadata or candidate is absent | Yes after correction | Stop | missing fields/paths |
| `CONTEXT_ESTIMATION_FAILED` | Byte/token/output estimate unavailable | Yes after corrected input | Stop | method and failure |
| `CONTEXT_CANONICAL_SOURCE_UNKNOWN` | Current authority cannot be identified | No | Stop; Owner clarifies | conflicting/missing authority |
| `CONTEXT_DUPLICATE_INPUTS_UNRESOLVED` | Same-purpose inputs conflict or cannot be deduplicated | No | Stop | hash/purpose comparison |
| `CONTEXT_FILE_LIMIT_EXCEEDED` | File count exceeds limit | Yes with reduction/override | Stop activation | counts and selected list |
| `CONTEXT_BYTE_LIMIT_EXCEEDED` | Bytes exceed limit | Yes with reduction/override | Stop activation | totals/method |
| `CONTEXT_INPUT_TOKEN_LIMIT_EXCEEDED` | Estimated input tokens exceed limit | Yes with reduction/override | Stop activation | estimate/margin |
| `CONTEXT_OUTPUT_TOKEN_LIMIT_EXCEEDED` | Estimated output exceeds limit | Yes by split/override | Stop artifact generation | output plan |
| `CONTEXT_ARTIFACT_SECTION_LIMIT_EXCEEDED` | Section count exceeds soft limit and impairs review | Yes by split | Stop oversized artifact | section list |
| `CONTEXT_ARTIFACT_SIZE_LIMIT_EXCEEDED` | Projected bytes exceed hard limit | Yes by split/override | Stop artifact generation | byte projection |
| `CONTEXT_REVIEW_DEPTH_EXCEEDED` | More than one independent review requested | No without override | Stop | prior review record |
| `CONTEXT_REVISION_CYCLE_EXCEEDED` | More than one revision requested | No without override | Stop | prior revision record |
| `CONTEXT_SPLIT_REQUIRED` | Decision is split | Yes after split preflight | No unsplit output | split plan |
| `CONTEXT_OWNER_OVERRIDE_REQUIRED` | Safe scoped exception exists | No until approval | Request Owner record | exceeded limit/alternatives |
| `CONTEXT_OWNER_OVERRIDE_INVALID` | Scope, expiry, checksum, role, or use is invalid | No | Stop | override comparison |
| `CONTEXT_HARD_STOP` | Any fail-closed condition | No | Stop | underlying error evidence |

## 7. Owner Override Contract

```yaml
context_override:
  override_id: UUIDv4
  project_id: javascript-roulette
  task_id: TASK-004
  role: exact canonical role name
  session: non-empty session identifier
  overridden_limit: one default-limit key
  original_limit: integer
  approved_limit: integer
  justification: non-empty bounded reason
  selected_input_checksums: [sha256-prefixed checksum]
  issued_at: RFC3339 UTC
  expires_at: RFC3339 UTC, maximum issued_at + 60 minutes
  single_use: true
  owner_authority: immutable Owner authorization reference
```

Validation rejects missing fields, a different project/task/role/session, expired
time, non-positive or lower replacement limit, more than one overridden limit,
changed selected-input checksums, or a previously consumed ID. The override is
stored as immutable historical evidence in the Phase 1.5 evidence location; it
never changes Status or Registry and is not inherited by the next Role.

## 8. Architecture and Exact File Plan

All paths below are future implementation paths; none is created or changed by
this design artifact.

| Path | Action | Responsibility / public exports | Reads / writes / dependencies | Errors / tests |
|---|---|---|---|---|
| `src/context-guard/index.mjs` | New | Public `runContextPreflight`, `assertRoleActivationAllowed` | Reads request/config; writes no files; imports local modules | propagates all `CONTEXT_*`; covered by integration tests |
| `src/context-guard/config.mjs` | New | `DEFAULT_CONTEXT_GUARD_CONFIG`, `validateConfig` | Reads supplied config only; no writes | invalid config → `CONTEXT_INVENTORY_INCOMPLETE`; unit |
| `src/context-guard/inventory.mjs` | New | `collectInputInventory`, `classifyInput`, `deduplicateInputs`, `selectInputs` | Reads candidate files/metadata; no writes; `node:fs/promises`, `node:crypto`, `node:path` | unreadable/unknown/duplicate errors; unit |
| `src/context-guard/estimate.mjs` | New | `estimateInputTokens`, `estimateOutput`, `estimateArtifactBytes` | Reads collected byte metadata only; no writes | estimation errors; unit |
| `src/context-guard/evaluate.mjs` | New | `evaluateLimits`, `makeDecision`, `createPreflightEvidence` | Reads config/inventory/estimates; writes no files | limit/decision errors; unit |
| `src/context-guard/override.mjs` | New | `validateOverride`, `consumeOverride` | Reads override and selected checksums; writes only the caller-provided immutable evidence path after authorization | override errors; unit/integration |
| `src/context-guard/errors.mjs` | New | `ContextGuardError`, `CONTEXT_ERROR_CODES` | No I/O | all error-code tests |

`index.mjs` is the sole public entry. No module imports or changes
`src/lifecycle/phase1/index.mjs`; compatibility is enforced by regression tests.
Role activation integration is a caller-facing guard: callers must invoke
`assertRoleActivationAllowed(result)` before starting a Role. A non-`PASS` result
throws `ContextGuardError` and no downstream role operation is invoked.

## 9. Minimal Schemas and Evidence Persistence

Use three JSON Schemas only, all with draft `2020-12`, version `1.0.0`, and
`additionalProperties: false`. Nested input/evidence items are definitions inside
the Preflight schema, not separate schemas.

| Schema path | Required fields / producer / consumer | Validation error | Checksum |
|---|---|---|---|
| `docs/ai-team/context-guard/phase1.5/schemas/context-guard-config.schema.json` | all eight defaults; Builder config producer; guard validator consumer | `CONTEXT_INVENTORY_INCOMPLETE` | No: static code default is authoritative |
| `docs/ai-team/context-guard/phase1.5/schemas/context-preflight.schema.json` | request identity, role/session, requested/selected/excluded inventories, byte/token/output/section estimates, decision, timestamp; guard producer; role-activation integration and Tester consumer | corresponding inventory/estimate/limit error | Yes: evidence checksum covers normalized record excluding itself |
| `docs/ai-team/context-guard/phase1.5/schemas/context-override.schema.json` | every field in Section 7; Owner producer; override validator consumer | `CONTEXT_OWNER_OVERRIDE_INVALID` | Yes: immutable override checksum |

Preflight and override evidence are append-only creation records under
`docs/ai-team/context-guard/phase1.5/evidence/`. The runtime must create only a
new uniquely named record after `PASS` or after an Owner-issued override; it must
not rewrite earlier records. No Registry, Status, or Phase 1 fixture is used.

## 10. Test Plan and Commands

| Test path | Coverage |
|---|---|
| `tests/context-guard/context-guard.unit.test.mjs` | inventory/count/bytes, unreadable input, same-content different filename, estimation margin and unsupported input, all classifications and selection order, each threshold/exact-boundary/one-over/multiple-over, all five decisions, every error code, valid/expired/wrong-task/wrong-role/changed-checksum/reused override |
| `tests/context-guard/context-guard.integration.test.mjs` | role activation blocked except after `PASS`, reduction and split flows, immutable evidence creation, override single use, no Phase 1 state/fixture dependency |
| `tests/lifecycle/phase1/lifecycle-store.test.mjs` | existing D-01–D-06 and Phase 1 regression; unchanged |
| `tests/roulette-core.test.mjs` | existing application regression; unchanged |

Future verification commands, run from
`/home/baisound/projects/javascript-roulette`, are:

```bash
node --test tests/context-guard/context-guard.unit.test.mjs
node --test tests/context-guard/context-guard.integration.test.mjs
node --test tests/lifecycle/phase1/*.test.mjs
npm test
```

The existing Phase 1 test evidence records 88 passing tests; this plan requires a
fresh observed run and does not claim it has run here.

## 11. Exact Implementation Allowlist

No file below is changed in the design phase. A later explicit implementation
authorization must bound work to exactly these paths:

```yaml
new_source:
  - src/context-guard/index.mjs
  - src/context-guard/config.mjs
  - src/context-guard/inventory.mjs
  - src/context-guard/estimate.mjs
  - src/context-guard/evaluate.mjs
  - src/context-guard/override.mjs
  - src/context-guard/errors.mjs
modified_source: []
new_tests:
  - tests/context-guard/context-guard.unit.test.mjs
  - tests/context-guard/context-guard.integration.test.mjs
modified_tests: []
new_schemas:
  - docs/ai-team/context-guard/phase1.5/schemas/context-guard-config.schema.json
  - docs/ai-team/context-guard/phase1.5/schemas/context-preflight.schema.json
  - docs/ai-team/context-guard/phase1.5/schemas/context-override.schema.json
configuration: []
implementation_evidence:
  - docs/ai-team/tasks/TASK-004/phase1.5-context-guard-implementation-report.md
```

No wildcard authorizes a file. In particular, Phase 1 source/tests, package files,
`.gitignore`, Status, Registry, and Runtime State are excluded.

## 12. Minimal Implementation Sequence

| Stage | Allowed files | Entry / exit criteria | Tests | Stop / rollback boundary |
|---|---|---|---|---|
| 1. Constants and errors | `errors.mjs`, `config.mjs`, config schema, unit test | approved authorization; defaults and error enum validated | default/config tests | invalid default; delete only new Stage-1 files |
| 2. Inventory | `inventory.mjs`, preflight schema, unit test | Stage 1 passes; deterministic metadata/hash/classification/selection | inventory/duplicate/classification tests | unknown canonical/required unreadable; remove new files only |
| 3. Estimation and limits | `estimate.mjs`, `evaluate.mjs`, unit test | Stage 2 passes; safe estimates and all decisions validate | boundary/decision tests | any underestimated or undefined path; remove new files only |
| 4. Override and evidence | `override.mjs`, override schema, integration test | Stage 3 passes; scope/expiry/single-use verified | override/evidence tests | invalid immutable evidence protocol; remove new files only |
| 5. Activation integration | `index.mjs`, integration test | Stage 4 passes; only `PASS` permits activation | activation tests | any Phase 1 import/state coupling; remove new files only |
| 6. Regression and report | all allowlisted tests and implementation report | Stages 1–5 pass; no unauthorized path changed | commands in Section 10 | any failure; preserve evidence and hand off, do not alter Phase 1 |

Each stage is additive. The rollback boundary is removal of only uncommitted,
newly-created Phase 1.5 paths; it must never restore, alter, or rely on a Phase 1
canonical state.

## 13. Artifact Chain, Gates, and Acceptance

```yaml
artifacts:
  kickoff: 1
  integrated_design_final_plan: 1
  design_review: 1
  design_revision: 1
  implementation_report: 1
  tester_report: 1
  implementation_review: 1
  final_judgment: 1
```

One independent Critic review and at most one Builder revision are permitted. If
the Critic identifies an additional unresolved High issue after the allowed
revision, stop and report to the Owner; do not create an iterative artifact chain.

Acceptance requires implemented inventory, duplicate detection, safe estimates,
limit evaluation, all five decisions, Owner override validation, mandatory
pre-activation enforcement, and fail-closed behavior; fresh Phase 1/D-01–D-06/
88-test regression success; dedicated tests; independent Tester, Critic, and Judge
pass; zero unresolved Critical/High; a Phase 1.5-only commit; clean worktree; and
no Phase 2 or Phase 5A start.

## 14. Authorization and Unresolved Items

```yaml
implementation_status: NOT_AUTHORIZED
phase_2: BLOCKED
phase_5a: PAUSED_BY_OWNER_PRIORITY
```

Implementation needs a separate Owner authorization after the one permitted
independent design review, any allowed revision, and the applicable approval gate.
This artifact does not create that authority.

Unresolved but non-blocking-for-review items: actual schema-validator dependency
choice is deliberately unspecified; the implementation must use existing platform
capabilities or obtain a separate approved dependency change. Actual preflight
bytes/tokens will be observed only during implementation. Baseline Git state is
Owner-provided and remains unverified because Git operations are prohibited.

## 15. Validation Record

| Check | Result |
|---|---|
| This design used the required bounded preflight | `PASS_WITH_REDUCTION` |
| Context Guard-only scope | PASS |
| Exact defaults, decisions, paths, tests, and commands | PASS |
| Minimal schema count | PASS: three schemas |
| Review/revision limit | PASS: one each |
| New persistent artifact count | PASS: one |
| Source/tests/schemas/config/runtime/status/registry/Git changed | PASS: none |
| Implementation authorization | `NOT_AUTHORIZED` |
| Lint diagnostics for this artifact | PASS: no IDE linter errors |

## 16. Result and Completion Pause

`PHASE1_5_DESIGN_FINAL_PLAN_READY_WITH_CONDITIONS`

The condition is that the preflight byte/token totals are design estimates, not
runtime observations; a later implementation preflight must recompute them from
actual selected files. Stop for Owner confirmation. Do not begin Design Critic
Review, Design Revision, implementation, Tester, Critic, Judge, Git operations,
Phase 1.6, or Phase 5A resumption.
