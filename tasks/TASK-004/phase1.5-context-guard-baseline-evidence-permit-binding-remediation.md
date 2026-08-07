# TASK-004 Phase 1.5 — F-CG-02 Baseline Evidence / Permit Binding Remediation

## Document Control
| Item | Value |
|---|---|
| Authoring Role | Builder |
| Active Project / Task | `javascript-roulette` / `TASK-004` |
| Phase | `1.5 — Context Guard Core MVP` |
| Objective | Close only the two F-CG-02 residual contract omissions reported by Independent Tester Re-test 06. |
| Authorization | Owner-authorized implementation remediation only; Tester re-test, Critic re-review, Judge, and Git writes are not authorized. |

## Role Activation
Builder acted within the Owner-provided limited remediation authorization. No Tester, Critic, Judge, Git add, commit, push, tag, release, Phase 1.6, or Phase 5A action was started.

## Runtime／Baseline
The mandated preflight ran from `/home/baisound/projects/javascript-roulette` with exit code `0`. `$HOME=/home/baisound`, Linux, ext4, branch `main`, HEAD `eb37ebd4900eb7192d72ab74a761e56d46f378a1`, and zero staged changes were confirmed.

## Current Worktree Boundary
The pre-existing modified/untracked paths were limited to the recorded Phase 1.5 allowlist: `.gitignore`, the four Context Guard schemas, Phase 1.5 artifacts, `src/context-guard/`, and `tests/context-guard/`. This remediation modified only the two existing allowlisted Context Guard source files and one existing allowlisted test file, then created this authorized Builder artifact.

## Exact Residual Finding Extraction
| Finding ID | Previous status | Residual defect ID | Exact evidence | Existing → required field set | Affected files | Closure criteria / required tests |
|---|---|---|---|---|---|---|
| F-CG-02 | `PARTIALLY_RESOLVED` | `baseline_preflight_evidence_fields_missing` | Re-test 06 §5 recorded no `measured_values`, `configured_limits`, or plural `override_eligible_limits` in `baseline-preflight-result.json`. | Existing decision/checksums/singular eligible limit → required measured values, trusted configured limits, canonical fixed eligible-limit list, identity, issue time, and baseline checksum. | `override.mjs`, `permit.mjs`, Permit tests | Persisted baseline must validate exact keys/types, recompute decision/exceeded limits, and reject mutations. |
| F-CG-02 | `PARTIALLY_RESOLVED` | `permit_explicit_override_binding_fields_missing` | Re-test 06 §5 recorded that only an indirect Override checksum bound the three override values. | Existing nested checksum binding → explicit Permit `overridden_limit`, `baseline_original_limit`, and `approved_limit`, plus explicit evidence checksums and final decision. | `permit.mjs`, Permit tests | All Baseline/Override/Re-preflight/Permit equalities must validate and mutations must reject. |

## Remediation Scope
Only the two residual F-CG-02 durable-evidence and explicit-binding omissions were changed. F-CG-01, F-CG-03, the Override flow, trusted-root enforcement, five Guard decisions, Phase 1.6 transfer work, Cost Guard, Phase 1.7+, and Phase 5A were not changed.

## Previous Baseline Evidence Contract
The baseline record contained project/task/role/session identity, decision, singular eligible limit, exceeded limits, input/root/config checksums, and generic immutable-evidence checksum. It did not retain the values used to make the decision or the required plural eligible-limit evidence.

## Completed Baseline Evidence Contract
`baseline-preflight-result.json` now contains `baseline_result_id`, project/task/role/session, decision, exceeded limits, singular eligibility result, `override_eligible_limits`, `measured_values`, `configured_limits`, selected-input/root/config checksums, `issued_at`, `baseline_result_checksum`, and the immutable-record `content_checksum`.

## Measured Values
`measured_values` has the exact required key set: `selected_file_count`, `total_input_bytes`, `estimated_input_tokens`, `estimated_output_tokens`, `expected_artifact_sections`, and `estimated_artifact_bytes`. Values are safe non-negative integers obtained from the selected inventory or required output estimates; persisted validation rejects missing, unknown, non-numeric, `NaN`, and infinite values and rechecks the inventory-derived values.

## Configured Limits
`configured_limits` has the exact trusted-config key set: `max_files_per_role`, `max_total_input_bytes`, `max_estimated_input_tokens`, `max_estimated_output_tokens`, `max_artifact_sections`, and `max_single_artifact_bytes`. The writer derives it from `DEFAULT_CONTEXT_GUARD_CONFIG`; the validator rejects any value that differs from that trusted configuration and verifies the full Guard-config checksum.

## Override Eligible Limits
`override_eligible_limits` is generated from the fixed, sorted three-limit allowlist: `max_estimated_input_tokens`, `max_files_per_role`, and `max_total_input_bytes`. It cannot receive caller additions, has no security/path limit, is part of both baseline checksums, and is required to include the actually exceeded Override target.

## Baseline Evidence Validation
On Permit issue and validation, the persisted baseline is reread through immutable checksum verification and then requires the exact record and nested key sets, valid values, matching project/task/role/session/input/root/config identity, canonical eligible-limit allowlist, recomputed exceeded limits, recomputed decision, and valid baseline-result checksum. Any mismatch throws a Context Guard error, preventing Permit issuance or role activation.

## Previous Permit Contract
The Permit had a nested `permit_binding` with baseline, Override, re-preflight, root, selected-input, and config checksum references. The three Override values were only recoverable indirectly through the reread Override record.

## Completed Permit Binding
Override-backed Permit records now expose these individual fields: `baseline_preflight_result_checksum`, `override_record_checksum`, `repreflight_result_checksum`, `trusted_root_set_checksum`, `selected_input_set_checksum`, `guard_config_checksum`, `overridden_limit`, `baseline_original_limit`, `approved_limit`, and `final_guard_decision`. The nested binding remains for compatibility and is cross-validated against the explicit Permit values.

## Cross-artifact Value Equality
Validation requires `permit.overridden_limit = baseline.exceeded_limits[0] = override.overridden_limit`; `permit.baseline_original_limit = baseline.configured_limits[overridden_limit] = override.original_limit = trusted_config[overridden_limit]`; and `permit.approved_limit = override.approved_limit = re-preflight applied configuration`. Re-preflight must have an eligible final decision of `PASS` or `PASS_WITH_REDUCTION`.

## Checksum Contract
The baseline result checksum covers decision, exceeded limits, eligible-limit allowlist, measurements, configured limits, selected-input/root/config checksums, identity, and issue time. Generic immutable `content_checksum` additionally protects the complete stored record. Permit generic `content_checksum` now covers all explicit Override fields and checksum bindings; validation rereads and compares every referenced immutable evidence record.

## Files Changed
- `src/context-guard/override.mjs`
- `src/context-guard/permit.mjs`
- `tests/context-guard/context-guard.permit.test.mjs`

## Files Created
- `docs/ai-team/tasks/TASK-004/phase1.5-context-guard-baseline-evidence-permit-binding-remediation.md`

## Allowlist Compliance
PASS. All modified source/test paths are in the existing Phase 1.5 implementation allowlist, and this report is the only new evidence file. No schema change was required because runtime validation is the active record-validation boundary.

## Targeted Test Commands
`node --test tests/context-guard/context-guard.permit.test.mjs` and `node --check src/context-guard/override.mjs && node --check src/context-guard/permit.mjs && node --check tests/context-guard/context-guard.permit.test.mjs` ran from `/home/baisound/projects/javascript-roulette`.

## Targeted Test Results
PASS: Permit binding tests reported `6` passed and `0` failed. They cover required baseline maps, checksum mutation, missing/unknown/wrong baseline data, caller-added/security eligibility, recomputation mismatch, missing explicit Permit fields, and wrong explicit Override values. Syntax checks exited `0`.

## Context Guard Full Tests
PASS: `node --test tests/context-guard/*.test.mjs` reported `27` passed and `0` failed (exit `0`). This is the observed count; it was not adjusted to a target count.

## Phase 1 Regression
PASS: `node --test tests/lifecycle/phase1/lifecycle-store.test.mjs` reported `88` passed and `0` failed (exit `0`).

## Application Regression
PASS: `npm test` reported `10` passed and `0` failed (exit `0`). A non-failing npm `devdir` deprecation warning was observed.

## Protected Evidence Integrity
PASS: all ten manifest paths were present and `sha256sum -c` returned `OK` for each. `expected_count: 10`, `found_count: 10`, `modified: 0`, `removed: 0`, `renamed: 0`, and `checksum_mismatches: 0`.

## Lint Status
`NOT_APPLICABLE`: `package.json` has no lint script. Replacement checks passed: JavaScript syntax checks, fixture cleanup (`.context-guard-runtime` and `.lifecycle-phase1-fixtures` absent), and `git diff --check` (exit `0`).

## Remaining Findings
Builder confirms the two reported F-CG-02 residual omissions are implemented and covered by Builder-run regression tests. F-CG-02 is not independently closed in this session; independent Tester re-test and Critic re-review remain required and unauthorized. F-CG-01 and F-CG-03 were not modified.

## Critical／High／Medium／Low Counts
For this Builder remediation observation: `0 / 0 / 0 / 0`. This is not an independent Tester or Critic conclusion.

## Remediation Result
`PHASE1_5_BASELINE_EVIDENCE_PERMIT_BINDING_COMPLETE_WITH_CONDITIONS`

## Tester Re-entry Conditions
Tester may enter only under separate Owner authorization to independently inspect the persisted baseline contract, explicit Permit fields, cross-artifact equality, mutation rejection, full regressions, and protected-evidence integrity.

## Critic Re-entry Conditions
Critic may enter only after separately authorized Tester evidence is available. No Critic re-review was started here.

## Commit Status
No Git add, commit, push, tag, release, or other Git write was performed. Read-only preflight and required `git diff --check` were executed.

## Owner Approval Required
YES. Stop pending Owner confirmation. Do not automatically start Tester Re-test 07, Critic Re-review 02, Judge, Git operations, status/registry updates, Phase 1.6, or Phase 5A.
