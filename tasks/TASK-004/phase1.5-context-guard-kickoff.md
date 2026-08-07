# TASK-004 Phase 1.5 — Context Guard MVP Kickoff

## 1. Document Control

| Item | Value |
|---|---|
| Authoring Role | Orchestrator |
| Active Project | `/home/baisound/projects/javascript-roulette` |
| Active Task | `TASK-004` |
| Runtime Interface | `INLINE_CHAT_LINUX` |
| Phase | `Phase 1.5 — Context Guard MVP` |
| Owner Authorization | `AUTHORIZED` — Kickoff Artifact creation only |
| Implementation Authorization | `NOT_AUTHORIZED` |
| Allowed persistent output | This file only |
| Result | `PHASE1_5_KICKOFF_READY_WITH_CONDITIONS` |

This artifact defines the Phase 1.5 kickoff boundary only. It does not authorize
design, a Final Plan, implementation, testing, review, judgment, status or
registry updates, Git operations, or resumption of Phase 5A.

## 2. Owner-Provided Baseline

```yaml
project_root: /home/baisound/projects/javascript-roulette
branch: main
baseline_commit: eb37ebd4900eb7192d72ab74a761e56d46f378a1
worktree: CLEAN
phase_1: COMPLETED
phase_1_5: NOT_STARTED
phase_5a: PAUSED_BY_OWNER_PRIORITY
implementation_status: NOT_AUTHORIZED
```

The baseline is Owner-provided evidence. No Git command was run, and this artifact
does not independently confirm branch, commit, or worktree state.

## 3. Fixed Objective and Priority

```yaml
objective:
  primary: >
    Role起動前およびArtifact作成前に、読み込むContext量と出力規模を制限し、
    不要なEvidence読込、巨大Prompt、巨大Artifact、無制限Review反復を防止する。
  priority: HIGHEST
  blocking_rule: >
    Phase 1.5未完了の状態ではPhase 2以降および停止中のPhase 5Aを再開しない。
```

Phase 1.5 is positioned immediately after completed Phase 1 and before Phase 2.
Phase 5A remains `PAUSED_BY_OWNER_PRIORITY`. This MVP is a Context Guard only; it
must not introduce a Cost Guard, provider pricing, model routing, billing, or a
Cost Ledger.

## 4. Scope Boundary

### Included MVP capabilities

```yaml
context_guard_mvp:
  preflight:
    - required_input_inventory
    - file_count_estimation
    - total_byte_estimation
    - estimated_input_token_count
    - estimated_output_token_count
    - artifact_section_count_estimation
  limits:
    - max_files_per_role
    - max_total_input_bytes
    - max_estimated_input_tokens
    - max_estimated_output_tokens
    - max_artifact_sections
    - max_single_artifact_bytes
    - max_review_depth
    - max_revision_cycles
  behavior:
    - unnecessary_input_rejection
    - duplicate_evidence_detection
    - canonical_input_priority
    - historical_evidence_sampling
    - split_artifact_requirement
    - safe_stop_before_role_activation
    - owner_override_requirement
  evidence:
    - context_budget_estimate
    - selected_inputs
    - excluded_inputs
    - exclusion_reason
    - estimated_output_size
    - guard_result
```

### Explicit exclusions

- Actual pricing, provider-specific price tables, daily or monthly budget control.
- Model-price selection, provider switching, billed-token or retry-cost aggregation.
- Cost Ledger implementation.
- Phase 1.7, Phase 1.8, or TASK-006 Advanced Guard capabilities.
- Source, test, schema, configuration, Runtime State, Registry, Status, and Git
  changes in this kickoff.

## 5. Context Guard Preflight Contract

Before each Role activation or Artifact creation, the designated implementation
must create a bounded, inspectable preflight record.

1. List the required candidate inputs with path, authority class, purpose, size,
   and duplicate fingerprint where available.
2. Count selected files and sum selected bytes.
3. Estimate input tokens and intended output tokens using a documented,
   conservative, reproducible estimation rule.
4. Estimate the target artifact's section count and maximum bytes.
5. Classify inputs as canonical, trusted current evidence, historical evidence,
   or excluded/untrusted.
6. Apply the limits in Section 6 and record one decision from Section 7.
7. Activate a Role only after `PASS`. All other decisions stop activation until
   their permitted remediation is completed and re-evaluated.

Historical evidence is sampled only when it is not the direct authority for the
requested operation. A sample must identify the sampling rule and preserve the
ability to request a specific omitted artifact when needed. Canonical input always
takes precedence over summaries, duplicates, and historical convenience copies.

## 6. Initial Guard Defaults

These are conservative Owner-changeable MVP defaults. They are proposals, not
currently implemented limits.

| Limit | Recommended value | Limit type | Rationale | Owner override | Override evidence |
|---|---:|---|---|---|---|
| `max_files_per_role` | 12 files | Hard | Keeps each activation reviewable and discourages broad discovery reads. | Yes | exact additional paths, purpose, authority class, and revised inventory |
| `max_total_input_bytes` | 128 KiB | Hard | Prevents accidental inclusion of large documents while permitting normal focused specifications. | Yes | byte calculation, selected/excluded lists, and necessity statement |
| `max_estimated_input_tokens` | 32,000 tokens | Hard | Leaves room for a bounded response and avoids context saturation. | Yes | reproducible estimate method, result, and reduction alternatives considered |
| `max_estimated_output_tokens` | 8,000 tokens | Hard | Keeps role artifacts concise and independently reviewable. | Yes | required content inventory and justified target size |
| `max_artifact_sections` | 16 sections | Soft | Encourages a compact artifact without preventing clear mandatory structure. | Yes | section list and why splitting would harm traceability |
| `max_single_artifact_bytes` | 64 KiB | Hard | Prevents a single unreadable evidence object and supports targeted review. | Yes | projected bytes, split analysis, and exact continuation plan |
| `max_review_depth` | 1 independent review | Hard | The MVP permits one Critic review; repeated review loops require explicit Owner control. | Yes | unresolved finding inventory and expected added value |
| `max_revision_cycles` | 1 cycle | Hard | Revision is exceptional, not assumed; it prevents unbounded redesign. | Yes | prior review result, bounded correction scope, and Owner approval |

An override is valid only when it is explicit, scoped to the activation or artifact,
records the evidence listed above, and is obtained before the affected Role starts.
An override cannot silently expand Phase 1.5 into a Cost Guard or another phase.

## 7. Guard Decision Model

| Decision | Trigger | Allowed next action | Prohibited next action | Required evidence | Owner approval |
|---|---|---|---|---|---|
| `PASS` | All counts and estimates are known; no hard limit is exceeded; duplicates and authority classes are resolved. | Activate the specified Role or create the bounded artifact. | Adding unlisted inputs or changing output scope without a new preflight. | Complete preflight record and selected/excluded lists. | No |
| `PASS_WITH_REDUCTION` | A non-authoritative input can be excluded, summarized, sampled, or replaced by canonical evidence so limits are met. | Apply the recorded reduction, rerun preflight, then proceed only if it becomes `PASS`. | Role activation based solely on this interim result. | Before/after inventory, exclusion reason, and new estimate. | No |
| `SPLIT_REQUIRED` | A required artifact exceeds section or single-artifact-size limits, but separable bounded artifacts can preserve authority. | Propose a split plan and rerun preflight for each part. | Creating an oversized artifact or activating downstream Roles. | proposed parts, dependencies, sizes, and authority preservation analysis. | No |
| `OWNER_OVERRIDE_REQUIRED` | A required canonical input or necessary output exceeds a hard limit, or the permitted review/revision budget would be exceeded. | Stop and request an explicit scoped Owner override; rerun preflight after it is recorded. | Role activation, artifact creation beyond the limit, or treating a recommendation as approval. | limit exceeded, alternatives rejected, scope, duration, and override evidence requirements. | Yes |
| `HARD_STOP` | Counts or estimates cannot be determined; required authority is unknown; duplicate conflict remains; canonical and historical evidence cannot be distinguished; or required override is absent. | Preserve observed evidence and request clarification or Owner authorization. | Any Role activation, new downstream artifact, implementation, or phase progression. | observed failure or missing information and safe-stop reason. | No, unless resolving it requires an override |

## 8. Required Role-Activation Order

```text
Task Definition
↓
Context Inventory
↓
Context Guard Preflight
↓
PASS only
↓
Role Activation
```

Do not activate a Role when any of the following is true:

- Input file count cannot be determined.
- Total selected bytes cannot be calculated.
- Input or output token estimate cannot be made using the documented method.
- A limit is exceeded.
- Duplicate evidence remains unresolved.
- Canonical and historical evidence cannot be distinguished.
- A required Owner override has not been obtained.

## 9. Minimal Artifact and Role Chain

The following is the maximum ordinary chain. It minimizes artifacts by combining
the Builder's design and Final Plan where that combination remains safe and
traceable. It does not authorize the chain to begin.

```yaml
artifact_budget:
  design_artifacts_max: 1
  critic_reviews_max: 1
  final_plan_artifacts_max: 1
  implementation_reports_max: 1
  tester_reports_max: 1
  critic_implementation_reviews_max: 1
  judge_decisions_max: 1
```

```text
Orchestrator — Kickoff
↓
Builder — Design and Final Plan combined where safe
↓
Critic — Single independent review
↓
Owner Approval
↓
Builder — Implementation
↓
Tester
↓
Critic
↓
Judge
↓
Owner Approval
↓
Phase 1.5 single commit
```

Any revision beyond the one permitted cycle, or any additional artifact beyond the
budget, requires a new Context Guard Preflight and explicit Owner reauthorization.
The single-commit requirement is a future completion condition only; this kickoff
performs no Git operation.

## 10. Implementation Preconditions and Stop Conditions

Implementation remains `NOT_AUTHORIZED`. It may not begin until the authorized
design and Final Plan chain has completed, independent review and binding approval
requirements are satisfied, an explicit implementation authorization with bounded
file scope is recorded, and the applicable Context Guard Preflight result is
`PASS`.

Safe-stop before implementation or Role activation when:

- the preflight result is not `PASS`;
- Scope extends beyond Context Guard MVP;
- a Cost Guard, pricing, model-selection, or billing capability is proposed;
- implementation authorization is absent, expired, ambiguous, or unbounded;
- review depth or revision-cycle limit is exceeded without Owner approval;
- a protected path would be read or changed without authority;
- Phase 2 or Phase 5A resumption is requested before Phase 1.5 completion.

## 11. Completion Criteria

Phase 1.5 can be evaluated as complete only when all of the following are
independently evidenced:

- Context Guard Preflight is implemented and mandatory before Role activation.
- Limit exceedance produces Safe Stop.
- Owner overrides are recorded before use.
- Input selection, exclusions, and exclusion reasons are recorded.
- Oversized artifacts can be required to split.
- Review and revision counts are enforceable.
- The full Phase 1 regression passes.
- Independent Tester, Critic, and Judge results pass with unresolved Critical and
  High findings at zero.
- The Phase 1.5 implementation is in one approved, phase-only commit and the
  worktree is clean.

## 12. Validation of This Kickoff

| Check | Result | Basis |
|---|---|---|
| Phase placement | PASS | Phase 1.5 is defined after completed Phase 1 and before Phase 2. |
| Phase 5A pause | PASS | This artifact retains `PAUSED_BY_OWNER_PRIORITY`. |
| Scope confinement | PASS | Only Context Guard MVP is specified; Cost Guard functions are excluded. |
| Artifact minimization | PASS | One-artifact maxima and combined Builder design/Final Plan option are defined. |
| Review and revision limits | PASS | One review and one revision cycle are default hard limits. |
| Implementation authorization | PASS | Recorded as `NOT_AUTHORIZED`. |
| Allowed persistent output | PASS | This kickoff is the sole authorized new file. |
| Baseline Git state | NOT_CONFIRMED | Owner-provided only; Git commands are prohibited for this kickoff. |
| Lint | NOT_CONFIRMED | No Markdown linter command or approved lint configuration was provided; no lint command was run. |

## 13. Conditions and Completion Pause

The result is `PHASE1_5_KICKOFF_READY_WITH_CONDITIONS` because the Owner-provided
baseline has not been independently verified and no project-specific Markdown lint
procedure was supplied. Neither condition authorizes a broader operation.

After this artifact is created, stop for Owner confirmation. Do not start:

- Context Guard design or Final Plan;
- implementation;
- Tester, Critic, or Judge work;
- Git operations;
- Phase 1.6;
- Phase 5A resumption.

## 14. Result

`PHASE1_5_KICKOFF_READY_WITH_CONDITIONS`
