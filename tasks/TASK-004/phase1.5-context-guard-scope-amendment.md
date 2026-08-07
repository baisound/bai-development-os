# TASK-004 Phase 1.5 — Context Guard MVP Scope Amendment

## 1. Document Control

| Item | Value |
|---|---|
| Authoring Role | Orchestrator, recording Owner Scope Decision |
| Active Project / Task | `/home/baisound/projects/javascript-roulette` / `TASK-004` |
| Phase | `1.5 — Context Guard Core MVP` |
| Objective | Stop further Phase 1.5 implementation remediation and record the reduced scope plus mandatory Phase 1.6 P0 transfer. |
| Implementation Authorization | `NOT_CHANGED` |
| Commit Authorization | `NOT_AUTHORIZED` |
| Allowed persistent output | This new artifact only |
| Result | `PHASE1_5_SCOPE_AMENDMENT_RECORDED_WITH_CONDITIONS` |

This Scope Amendment is an Owner decision record. It does not declare Phase 1.5
complete, close the transferred High findings, approve a commit, or authorize
implementation, test execution, runtime-state creation, Git operations, Phase 1.6,
Phase 2, or Phase 5A.

## 2. Evidence Reviewed and Procedure

The following saved evidence was readable and reviewed:

- `projects/ai-team/roles/README-Orchestrator.md`
- `projects/ai-team/common/Evidence-Specification.md`
- `projects/ai-team/common/Authority-Specification.md`
- `phase1.5-context-guard-kickoff.md`
- `phase1.5-context-guard-design-final-plan.md`
- `phase1.5-context-guard-design-final-plan-revision-01.md`
- `phase1.5-context-guard-owner-decisions.md`
- `phase1.5-context-guard-owner-decisions-addendum-01.md`
- `phase1.5-context-guard-implementation-report.md`
- `phase1.5-context-guard-implementation-remediation-01.md`
- `phase1.5-context-guard-implementation-remediation-02.md`

Procedure: read-only review of the listed canonical artifacts, comparison of their
recorded scope, result, test evidence, remediation budget, and unresolved findings.
No source, test, schema, configuration, runtime, Status, Registry, Git, command,
or test action was performed by this Scope Amendment.

## 3. Recorded Current Evidence

The latest Builder artifact,
`phase1.5-context-guard-implementation-remediation-02.md`, records:

```yaml
latest_result: PHASE1_5_IMPLEMENTATION_REMEDIATION_02_OWNER_DECISION_REQUIRED
reported_passes:
  context_guard_tests: 13_PASS
  phase_1_regression: 88_PASS
  application_regression: 10_PASS
  evidence_no_replace: PASS
  durable_override: PASS
  permit_concurrent_consumption_basic: PASS
  path_identity_strengthening: PASS
  symlink_replacement_safe_stop: PASS
  static_gateway_executor_boundary: PASS
  bypass_environment_scan: PASS
  allowlist_compliance: PASS
remaining_high_count: 2
additional_remediation: PROHIBITED
```

These are recorded Builder observations, not independent verification by this
Orchestrator action. The cited artifact also records no Git add, commit, push,
tag, or release. The Owner-provided `git_diff_check: PASS` is recorded as a scope
input only; no Git command was run here.

## 4. Owner Decision 5 — Phase 1.5 Scope Reduction

Phase 1.5 is formally limited to `Context Guard Core MVP`.

```yaml
phase_1_5:
  required_capabilities:
    - requested_selected_excluded_input_inventory
    - file_count
    - utf8_byte_count
    - estimated_input_tokens
    - estimated_output_tokens
    - duplicate_detection
    - canonical_input_priority
    - historical_input_reduction
    - mandatory_input_preservation
    - five_guard_decisions
    - exact_limit_boundaries
    - owner_override_durable_evidence
    - evidence_no_replace
    - allowed_root_containment
    - symlink_rejection
    - basic_toctou_safe_stop
    - estimated_measured_separation
  explicitly_not_completed_in_phase_1_5:
    - foundation_wide_role_activation_enforcement
    - complete_permit_ledger_fault_matrix
    - complete_role_activation_uncertainty_recovery
    - complete_activation_entry_adapter_matrix
    - exhaustive_unregistered_entry_detection
    - exhaustive_role_activation_toctou_matrix
```

Phase 1.5 must not be represented as a complete Foundation-wide Role activation
enforcement solution. No additional Phase 1.5 implementation remediation is
authorized; the two consumed remediation cycles remain final for this phase.

## 5. Owner Decision 6 — Mandatory Transfer to Phase 1.6

The following are mandatory `PHASE_1_6_P0` requirements for the Foundation Guard
MVP. They may not be downgraded to optional or deferred requirements in Phase 1.6:

```yaml
phase_1_6_mandatory_p0:
  - foundation_wide_role_activation_gateway
  - exact_adapter_inventory_for_all_activation_entries
  - unregistered_entry_fail_closed
  - internal_executor_import_enforcement
  - immutable_permit_integration
  - complete_permit_event_ledger_failure_matrix
  - append_and_sync_uncertainty_handling
  - stale_lease_authority_boundary
  - complete_concurrent_consumption_matrix
  - complete_role_activation_toctou_matrix
  - static_bypass_matrix
phase_2: BLOCKED_UNTIL_PHASE_1_6_COMPLETE
phase_5a: PAUSED_UNTIL_PHASE_1_6_COMPLETE
```

This is a transfer of mandatory work, not a risk acceptance, waiver, or claim that
the transferred protections are already implemented.

## 6. High Finding Disposition

```yaml
finding_disposition:
  complete_ledger_fault_uncertainty_matrix:
    phase_1_5_status: TRANSFERRED_NOT_CLOSED
    destination: PHASE_1_6_P0
    ignored: false
    risk_accepted: false
  complete_toctou_and_unregistered_entry_matrix:
    phase_1_5_status: TRANSFERRED_NOT_CLOSED
    destination: PHASE_1_6_P0
    ignored: false
    risk_accepted: false
```

The two High findings remain unresolved. They are outside the reduced Phase 1.5
Core MVP responsibility, but remain blocking for any assertion that Foundation-wide
Role activation enforcement is complete, and for starting Phase 2 or Phase 5A.

## 7. Phase 1.5 Completion-Review Candidate Boundary

Phase 1.5 Core MVP may be submitted for Completion Review only when a future
independent validation confirms all of the following:

```yaml
completion_candidate_conditions:
  - implemented_scope_matches_reduced_scope
  - context_guard_tests_13_pass
  - phase_1_tests_88_pass
  - application_tests_10_pass
  - evidence_integrity_pass
  - git_diff_check_pass
  - allowlist_compliance_pass
  - no_critical_or_high_inside_reduced_scope
  - transferred_highs_are_recorded_as_phase_1_6_p0
```

This artifact records the candidate criteria only. It is not a Completion Review,
does not independently confirm the reported test results, and does not change
Task Lifecycle, Project Status, or Knowledge Asset Status.

## 8. Validation

| Check | Result / basis |
|---|---|
| Additional remediation authorized | PASS: prohibited by the current Owner decision. |
| Remaining High marked `CLOSED` | PASS: both are `TRANSFERRED_NOT_CLOSED`. |
| Remaining High treated as accepted risk | PASS: `risk_accepted: false`; `ignored: false`. |
| Reduced Phase 1.5 Core MVP scope | PASS: required and explicitly excluded capability lists are recorded. |
| Phase 1.6 P0 transfer | PASS: all mandatory P0 requirements are explicitly recorded. |
| Phase 2 / Phase 5A block | PASS: both remain blocked pending Phase 1.6 completion. |
| Source/tests/schemas/configuration/runtime/Git modified | PASS: none by this Scope Amendment. |
| New artifact count | PASS: one. |
| Lint | PASS: IDE diagnostics for this new Markdown artifact report no errors. No project lint command was executed. |

## 9. Unresolved Items and Known Limitations

- The two transferred High findings are not closed and are not verified by this
  artifact.
- Recorded passing tests and Git-diff status are inherited evidence, not a fresh,
  independent test or Git verification.
- Completion eligibility remains `NOT_CONFIRMED` until the authorized independent
  Completion Review process evaluates the reduced scope.
- Implementation and commit authorization remain unchanged; neither is granted.

## 10. Routing Envelope and Completion Pause

| Field | Value |
|---|---|
| Current Phase | Phase 1.5 Scope Amendment recorded; Completion Review candidate only |
| Gate Readiness | `NOT_READY` |
| Active Project | `javascript-roulette` |
| Active Task | `TASK-004` |
| Authorization Status | Authorized only to create this Scope Amendment; implementation authorization `NOT_CHANGED`, commit authorization `NOT_AUTHORIZED` |
| Next Role | Tester, only after separate Owner instruction |
| Reason | Verify reduced Phase 1.5 scope only; confirm transferred requirements are not falsely claimed complete; confirm Phase 1.6 P0 handoff is explicit. |
| Files To Read | This amendment; latest implementation/remediation evidence; applicable Tester/common specifications; exact reduced-scope implementation evidence. |
| Allowed Files | One separately authorized Tester artifact only. |
| Prohibited Files | Source, tests, schemas, configuration, runtime state, Status, Registry, Git, historical evidence, Phase 1.6, Phase 2, and Phase 5A files. |
| Exact Prompt To Send | Not issued. Owner confirmation is required before Tester activation. |
| Expected Artifact | A separately authorized Phase 1.5 reduced-scope Tester report. |
| Validation | Verify the reduced scope, recorded transfer status, evidence integrity, test evidence, allowlist compliance, and no false Foundation-wide completion claim. |
| Stop Conditions | Missing authority/evidence, a claim that transferred High findings are closed, a request for remediation, implementation/commit action, or any Phase 1.6/2/5A start. |
| Next Gate | Owner-authorized Tester validation; no automatic continuation. |

Completion pause: do not start Tester, Critic, Judge, Git operations, Phase 1.6,
or Phase 5A. Stop pending Owner confirmation.
