# TASK-004 Phase 1.5 — Context Guard Core MVP Independent Tester Re-test 07
## Baseline Evidence and Permit Binding

## 1. Document Control

| Item | Value |
|---|---|
| Authoring Role | Tester |
| Active Project / Task | `javascript-roulette` / `TASK-004` |
| Phase | `1.5 — Context Guard Core MVP` |
| Objective | Independently verify the F-CG-02 Baseline Evidence Completeness and Explicit Permit Override Binding remediation. |
| Authorization | Owner-authorized Tester re-test only. Source, tests, schemas, configuration, existing evidence, runtime state, and Git writes were prohibited. |
| Allowed persistent output | This newly created artifact only |
| Result | `PHASE1_5_TEST_RETEST_07_PASS` |

No production source, tests, schemas, configuration, existing evidence, runtime
state, or Git state was modified by this Tester re-test. No Critic, Judge, Git
write, status/Registry update, Phase 1.6, Phase 5A, or source/test remediation was
started.

## 2. Inputs and Evidence Reviewed

- `projects/ai-team/roles/README-Tester.md`
- `projects/ai-team/common/README-Common.md`
- `projects/ai-team/common/Vocabulary-Specification.md`
- `projects/ai-team/common/Authority-Specification.md`
- `projects/ai-team/common/Evidence-Specification.md`
- `projects/ai-team/common/Artifact-Specification.md`
- `PROJECT.md` and `docs/ai-team/tasks/TASK-004/task.md`
- `phase1.5-context-guard-scope-amendment.md`
- `phase1.5-context-guard-independent-test-retest-06.md`
- `phase1.5-context-guard-baseline-evidence-permit-binding-remediation.md`
- Current `override.mjs`, `permit.mjs`, `evaluate.mjs`, `config.mjs`, targeted
  Permit tests, package scripts, and the protected-evidence manifest in
  `phase1.5-context-guard-tester-remediation-01.md`.

Builder assertions were treated as inputs only. The current implementation, tests,
protected-evidence manifest, and command results below were independently observed.

## 3. Preflight and Worktree Boundary

All preflight commands ran from `/home/baisound/projects/javascript-roulette`.

| Check | Execution Status | Observed result | Result |
|---|---|---|---|
| Runtime / baseline | `EXECUTED` | `$HOME=/home/baisound`, Linux, ext4, `main`, and HEAD `eb37ebd4900eb7192d72ab74a761e56d46f378a1` all matched. | PASS |
| Stage boundary | `EXECUTED` | No staged path was reported. | PASS |
| Tracked-change boundary | `EXECUTED` | Only `.gitignore` was modified. | PASS |
| Untracked-change boundary | `EXECUTED` | All reported paths were Phase 1.5 schemas, task evidence, Context Guard source, or Context Guard tests; no unknown path was observed. | PASS |
| Artifact collision | `EXECUTED` | `phase1.5-context-guard-independent-test-retest-07.md` was absent before creation. | PASS |

## 4. Baseline Evidence Field Verification

`baseline-preflight-result.json` has an exact-key validator, immutable exclusive
creation, excluding-self `baseline_result_checksum`, generic immutable
`content_checksum`, and verified reread before Override-backed Permit issuance.

| Field group | Independent observation | Result |
|---|---|---|
| `measured_values` | Exact required keys are present: `selected_file_count`, `total_input_bytes`, `estimated_input_tokens`, `estimated_output_tokens`, `expected_artifact_sections`, and `estimated_artifact_bytes`. Validation requires safe non-negative integers, which excludes missing values, `NaN`, `Infinity`, and negative values. Selected-input metrics are recomputed and compared after reread. | PASS |
| `configured_limits` | Exact required trusted-config keys are present: `max_files_per_role`, `max_total_input_bytes`, `max_estimated_input_tokens`, `max_estimated_output_tokens`, `max_artifact_sections`, and `max_single_artifact_bytes`. Values are compared to `DEFAULT_CONTEXT_GUARD_CONFIG` and its guard-config checksum. | PASS |
| `override_eligible_limits` | Exact fixed canonical order is `max_estimated_input_tokens`, `max_files_per_role`, `max_total_input_bytes`; validation rejects caller additions, duplicates, non-canonical order, and security/path values. | PASS |
| Checksum coverage | Baseline-result and immutable-record checksums cover the measured values, configured limits, eligibility list, decision, exceeded limits, identity, and checksums. | PASS |

## 5. Baseline Recalculation and Safe Stop

`validatePersistedBaseline` rereads the immutable record, verifies exact field sets
and checksums, recomputes selected-input measurements, validates trusted
configuration/root/input identity, and reruns `evaluateLimits` from the persisted
measurement values and trusted configuration. The recomputed decision, exceeded
limits, and singular eligible limit must equal the stored values.

The targeted test independently exercised rejection for changed measurement,
missing measurement, unknown configured limit, invalid `NaN` measurement, changed
eligible-limit list, changed exceeded limit, changed decision, and checksum-invalid
evidence. Each rejected before valid Override-backed Permit validation or role
activation.

Result: PASS.

## 6. Explicit Permit Binding and Cross-artifact Equality

The Override-backed Permit record contains these individual fields, rather than
only embedding them in one checksum:

```text
overridden_limit
baseline_original_limit
approved_limit
baseline_preflight_result_checksum
override_record_checksum
repreflight_result_checksum
trusted_root_set_checksum
selected_input_set_checksum
guard_config_checksum
final_guard_decision
```

Validation requires all of the following:

```text
permit.overridden_limit
  = baseline.exceeded_limits[0]
  = override_record.overridden_limit

permit.baseline_original_limit
  = baseline.configured_limits[permit.overridden_limit]
  = override_record.original_limit
  = trusted_config[permit.overridden_limit]

permit.approved_limit
  = override_record.approved_limit
  = re-preflight applied configuration for the overridden limit
```

The valid targeted path produced one Permit, with
`overridden_limit=max_files_per_role`, `baseline_original_limit=12`,
`approved_limit=13`, and `final_guard_decision=PASS`; Permit validation passed.

Result: PASS.

## 7. Mutation Rejection

The targeted Permit test covers missing explicit Permit fields, wrong overridden
limit, wrong original limit, wrong approved limit, malformed baseline fields,
changed baseline decision/exceeded limit/eligible list/measurements/configured
limits, and a forged nested re-preflight checksum. Static inspection confirms
Permit validation also rereads and compares the baseline, Override, re-preflight,
input-set, root-set, and guard-config checksums, and verifies the Permit
`content_checksum`.

Any mismatch returns a Context Guard error before a valid Permit can be accepted or
role activation can proceed.

Result: PASS.

## 8. Prior-Finding Regression and Scope Amendment

| Check | Observation | Result |
|---|---|---|
| F-CG-01 | Missing or invalid output estimation remains `HARD_STOP`; full Context Guard regression passed. | PASS |
| F-CG-03 | Override Schema/runtime timestamp checks remain exercised by targeted Permit tests. | PASS |
| Canonical re-preflight / callback rejection | Override flow retains internal canonical preflight/re-preflight and rejects untrusted callback arguments. | PASS |
| Trusted roots / five decisions | Fixed trusted roots and five Guard decisions remain present; full Context Guard regression passed. | PASS |
| Baseline-PASS / multiple-limit rejection | Targeted Permit tests retain rejection before Permit issuance. | PASS |
| Phase 1.6 transfers | No false claim of completed Permit Ledger, TOCTOU, activation-entry, or Foundation-wide enforcement was observed. These remain transferred work and are not counted as Phase 1.5 failures. | PASS |

## 9. Required Test Execution

All commands ran from `/home/baisound/projects/javascript-roulette`.

| Check | Exact command / procedure | Execution Status | Observed result | Result |
|---|---|---|---|---|
| Baseline evidence fields / explicit Permit binding target | `node --test tests/context-guard/context-guard.permit.test.mjs` | `EXECUTED` | The remediation's single targeted test file covers both categories: 6 passed, 0 failed; exit 0. | PASS |
| Context Guard regression | `node --test tests/context-guard/*.test.mjs` | `EXECUTED` | 27 passed, 0 failed; exit 0. | PASS |
| Phase 1 regression | `node --test tests/lifecycle/phase1/lifecycle-store.test.mjs` | `EXECUTED` | 88 passed, 0 failed; exit 0. | PASS |
| Syntax | `node --check src/context-guard/override.mjs && node --check src/context-guard/permit.mjs && node --check tests/context-guard/context-guard.permit.test.mjs` | `EXECUTED` | Exit 0. | PASS |
| Application regression | `npm test` | `EXECUTED` | 10 passed, 0 failed; exit 0. A non-failing npm `devdir` deprecation warning was observed. | PASS |
| Whitespace | `git diff --check` | `EXECUTED` | Exit 0. | PASS |
| Fixture cleanup | `test ! -e .context-guard-runtime; test ! -e .lifecycle-phase1-fixtures` | `EXECUTED` | Neither directory existed after test execution. | PASS |
| Lint | `package.json` inspection | `NOT_EXECUTED` | No `lint` script exists. | NOT_APPLICABLE |

## 10. Protected Evidence Verification

The ten manifest paths in `phase1.5-context-guard-tester-remediation-01.md` were
checked with `sha256sum -c`. Each output was `OK`.

```yaml
protected_evidence:
  expected_count: 10
  found_count: 10
  modified: 0
  removed: 0
  renamed: 0
  checksum_mismatches: 0
```

Result: PASS.

## 11. Result and Handoff

```yaml
result: PHASE1_5_TEST_RETEST_07_PASS
technical_result: PASS
finding_counts:
  critical: 0
  high: 0
  medium: 0
  low: 0
prior_finding_status:
  F-CG-01: CLOSED
  F-CG-02: CLOSED
  F-CG-03: CLOSED
known_limitations:
  - Lint is NOT_APPLICABLE because package.json has no lint script.
  - This result verifies the authorized reduced Phase 1.5 Core MVP scope only; it does not certify transferred Phase 1.6 work.
```

## 12. Required Parent Output

```text
Completed Role: Tester
Session: Inline Chat Linux / Independent Tester Re-test 07
Result: PHASE1_5_TEST_RETEST_07_PASS
Created File: docs/ai-team/tasks/TASK-004/phase1.5-context-guard-independent-test-retest-07.md

F-CG-01 Status: CLOSED
F-CG-02 Status: CLOSED
F-CG-03 Status: CLOSED

Baseline Evidence Fields: PASS
Baseline Recalculation: PASS
Permit Explicit Binding: PASS
Cross-artifact Equality: PASS
Mutation Rejection: PASS
Successful Path: PASS

Permit Target Tests: 6 PASS / 0 FAIL
Context Guard: 27 PASS / 0 FAIL
Phase 1: 88 PASS / 0 FAIL
Application: 10 PASS / 0 FAIL
Protected Evidence: PASS — 10 found; 0 modified, removed, renamed, or checksum mismatches
Lint Status: NOT_APPLICABLE — package.json has no lint script

Critical / High / Medium / Low: 0 / 0 / 0 / 0

Critic Re-review Readiness: NOT_AUTHORIZED
Commit Readiness: NOT_AUTHORIZED
Recommended Next Role: Owner / Orchestrator decision
Recommended Next Artifact: Owner-authorized Critic Re-review 02 artifact, if directed
Gate Readiness: PASS for this authorized Tester Re-test 07 only
Owner Approval Required: YES
```

Completion pause: stop pending Owner confirmation. Do not start source/test/schema
changes, Critic Re-review 02, Judge, Git add/commit, push/tag/release, status or
Registry updates, Phase 1.6, or Phase 5A.
