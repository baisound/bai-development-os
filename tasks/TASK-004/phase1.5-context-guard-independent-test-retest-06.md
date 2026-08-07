# TASK-004 Phase 1.5 — Context Guard Core MVP Independent Tester Re-test 06
## Baseline Override Eligibility

## 1. Document Control

| Item | Value |
|---|---|
| Authoring Role | Tester |
| Active Project / Task | `javascript-roulette` / `TASK-004` |
| Phase | `1.5 — Context Guard Core MVP` |
| Objective | Independently re-test the authorized F-CG-02 baseline Override eligibility remediation. |
| Authorization | Owner-authorized Tester re-test only. Source, tests, schemas, configuration, existing evidence, runtime state, and Git writes were prohibited. |
| Allowed persistent output | This newly created artifact only |
| Result | `PHASE1_5_TEST_RETEST_06_REVISION_REQUIRED` |

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
- `phase1.5-context-guard-independent-critic-rereview-01.md`
- `phase1.5-context-guard-baseline-override-eligibility-remediation.md`
- `phase1.5-context-guard-independent-test-retest-05.md`
- Current Context Guard implementation, targeted Permit tests, package scripts, and
  the protected-evidence manifest in
  `phase1.5-context-guard-tester-remediation-01.md`.

Builder remediation claims were treated as inputs only. The current implementation,
tests, recorded evidence manifest, and command results below were independently
observed.

## 3. Preflight and Worktree Boundary

All preflight commands ran from `/home/baisound/projects/javascript-roulette`:

```bash
set -eu
test "$HOME" = "/home/baisound"
test "$(uname -s)" = "Linux"
test "$(findmnt -n -o FSTYPE -T .)" = "ext4"
test "$(git branch --show-current)" = "main"
test "$(git rev-parse HEAD)" = "eb37ebd4900eb7192d72ab74a761e56d46f378a1"
test -z "$(git diff --cached --name-only)"
git diff --name-status
git ls-files --others --exclude-standard | sort
```

| Check | Execution Status | Observed result | Result |
|---|---|---|---|
| Runtime / baseline | `EXECUTED` | `$HOME=/home/baisound`, Linux, ext4, `main`, and HEAD `eb37ebd4900eb7192d72ab74a761e56d46f378a1` all matched. | PASS |
| Stage boundary | `EXECUTED` | No staged path was reported. | PASS |
| Tracked-change boundary | `EXECUTED` | Only `.gitignore` was modified. | PASS |
| Untracked-change boundary | `EXECUTED` | All reported paths were Phase 1.5 schemas, task evidence, Context Guard source, or Context Guard tests; no unknown path was observed. | PASS |
| Artifact collision | `EXECUTED` | `phase1.5-context-guard-independent-test-retest-06.md` was absent before creation. | PASS |

## 4. F-CG-02 Baseline Eligibility and Single-Limit Checks

| Required check | Independent observation | Result |
|---|---|---|
| Baseline preflight before Override application | `persistAndConsumeOverride` calls `runBaselinePreflight` before it creates `override-record.json` or builds the Override configuration. | PASS |
| Baseline decision | `runBaselinePreflight` requires exactly `OWNER_OVERRIDE_REQUIRED`. | PASS |
| Single exceeded limit | The baseline requires `result.exceeded_limits.length === 1`. | PASS |
| Eligible limit / Override target match | The baseline requires `result.override_eligible_limit === override.overridden_limit`; Permit verification also requires the unique baseline exceeded limit to equal the Override target. | PASS |
| Original limit / trusted configuration match | The baseline and Permit validation require `override.original_limit` to equal the unmodified default trusted configuration value. | PASS |
| Baseline `PASS` Override rejection | Targeted negative test rejects the already-passing baseline before Permit issuance. | PASS |
| `PASS_WITH_REDUCTION`, `SPLIT_REQUIRED`, and `HARD_STOP` Override rejection | The baseline requires `OWNER_OVERRIDE_REQUIRED`; all other decisions therefore reject before Override persistence and Permit issuance. The Permit unit test separately confirms `SPLIT_REQUIRED` and `HARD_STOP` cannot issue a Permit. | PASS |
| Zero / multiple / non-eligible input-limit failure | Zero failures yields baseline `PASS`; multiple unresolved input failures yield `HARD_STOP`; only one configured eligible input limit can yield `OWNER_OVERRIDE_REQUIRED`. | PASS |
| Security / path-security failure | `evaluateLimits` maps `security_failure` to `HARD_STOP`; input collection enforces trusted roots and path safety before baseline evaluation. No Override eligibility path exists for those failures. | PASS |
| Wrong target / wrong original limit | Targeted negative test rejects both cases before Permit issuance. | PASS |
| Invalid approved limit | Schema/runtime validation rejects non-integer or below-minimum values, and rejects an approved limit below the original limit. | PASS |

The positive test path independently executed one valid baseline
`OWNER_OVERRIDE_REQUIRED` case for `max_files_per_role`, with matching
`original_limit` and a single increased approved limit. It persisted and reread the
Override, ran canonical re-preflight to `PASS`, issued one Permit, and validated it.

## 5. Baseline Evidence and Permit Binding

| Required baseline-evidence / binding item | Independent observation | Result |
|---|---|---|
| Immutable exclusive create and reread | `writeImmutableEvidence` uses exclusive `wx`, fsyncs, rereads, and verifies excluding-self SHA-256; baseline evidence is written through that function. | PASS |
| Baseline decision, exceeded limits, selected-input checksum, trusted-root checksum, guard-config checksum, baseline checksum | All are recorded or derivable from the verified record checksum, and are reread during Override Permit verification. | PASS |
| `measured_values` in baseline record | `runBaselinePreflight` writes no `measured_values` field. | FAIL |
| `configured_limits` in baseline record | `runBaselinePreflight` writes no `configured_limits` field. | FAIL |
| `override_eligible_limits` in baseline record | The record writes only singular `override_eligible_limit`, not the required `override_eligible_limits` evidence field. | FAIL |
| Checksum mismatch / missing baseline evidence safe stop | `readVerifiedEvidence` rejects checksum mismatch; Permit issue and validation reread `baseline-preflight-result.json`, so a missing or invalid record rejects. | PASS |
| Permit checksum binding | Binding includes baseline, Override, re-preflight, root-set, selected-input-set, guard-config checksums and final decision. | PASS |
| Permit explicit limit-value binding | The Permit binding does not contain explicit `overridden_limit`, `baseline_original_limit`, or `approved_limit` fields. Those values are integrity-bound indirectly through the reread Override record checksum, but the required minimum explicit binding fields are absent. | FAIL |
| Mutation resistance | Baseline / Override / re-preflight checksum changes, root/input/config changes, and decision mismatch reject on reread and validation. The absent baseline evidence fields and explicit Permit limit fields cannot be independently verified as required persisted/bound values. | PARTIALLY_OBSERVED |

F-CG-02 therefore remains `PARTIALLY_RESOLVED`: its eligibility decision and
single-limit enforcement are implemented, but its mandatory durable baseline
evidence and complete Permit binding contract are incomplete.

## 6. Prior-Finding Regression and Scope Amendment

| Check | Observation | Result |
|---|---|---|
| F-CG-01 | Missing or invalid required output measurements produce `HARD_STOP`; full Context Guard regression passed. | PASS |
| F-CG-03 | Override Schema/runtime timestamp validation remains exercised by the target Permit tests; all target tests passed. | PASS |
| Callback rejection / canonical re-preflight | Untrusted callback arguments are rejected; canonical inventory, selection, baseline, durable Override, and re-preflight code paths are present and executed. | PASS |
| Trusted roots / five decisions | Current code retains fixed trusted roots and five decision behavior; full Context Guard tests passed. | PASS |
| Phase 1.6 transfers | No false claim that the Permit Ledger, TOCTOU, activation-entry, or Foundation-wide enforcement transfers are implemented was observed. They remain outside this Phase 1.5 result. | PASS |

## 7. Required Test Execution

All commands ran from `/home/baisound/projects/javascript-roulette`.

| Check | Exact command / procedure | Execution Status | Observed result | Result |
|---|---|---|---|---|
| Override-baseline eligibility target | `node --test tests/context-guard/context-guard.permit.test.mjs` | `EXECUTED` | 6 passed, 0 failed; exit 0. | PASS |
| Context Guard regression | `node --test tests/context-guard/*.test.mjs` | `EXECUTED` | 27 passed, 0 failed; exit 0. | PASS |
| Syntax | `node --check src/context-guard/override.mjs && node --check src/context-guard/permit.mjs && node --check tests/context-guard/context-guard.permit.test.mjs` | `EXECUTED` | Exit 0. | PASS |
| Phase 1 regression | `node --test tests/lifecycle/phase1/lifecycle-store.test.mjs` | `EXECUTED` | 88 passed, 0 failed; exit 0. | PASS |
| Application regression | `npm test` | `EXECUTED` | 10 passed, 0 failed; exit 0. A non-failing npm `devdir` deprecation warning was observed. | PASS |
| Whitespace | `git diff --check` | `EXECUTED` | Exit 0. | PASS |
| Fixture cleanup | `test ! -e .context-guard-runtime; test ! -e .lifecycle-phase1-fixtures` | `EXECUTED` | Neither directory existed after test execution. | PASS |
| Lint | `package.json` inspection | `NOT_EXECUTED` | No `lint` script exists. | NOT_APPLICABLE |

## 8. Protected Evidence Verification

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

## 9. Result, Findings, and Handoff

```yaml
result: PHASE1_5_TEST_RETEST_06_REVISION_REQUIRED
technical_result: FAIL
finding_counts:
  critical: 0
  high: 1
  medium: 0
  low: 0
prior_finding_status:
  F-CG-01: CLOSED
  F-CG-02: PARTIALLY_RESOLVED
  F-CG-03: CLOSED
unresolved_items:
  - baseline-preflight-result.json lacks measured_values, configured_limits, and override_eligible_limits.
  - Permit binding lacks explicit overridden_limit, baseline_original_limit, and approved_limit fields.
known_limitations:
  - Lint is NOT_APPLICABLE because package.json has no lint script.
  - This verification is limited to the authorized Phase 1.5 Core MVP scope and does not certify transferred Phase 1.6 work.
```

The observed mandatory baseline-evidence and explicit Permit-binding omissions are
inside F-CG-02's authorized Phase 1.5 contract. They prevent F-CG-02 closure and
prevent `PHASE1_5_TEST_RETEST_06_PASS` or
`PHASE1_5_TEST_RETEST_06_PASS_WITH_CONDITIONS`.

## 10. Required Parent Output

```text
Completed Role: Tester
Session: Inline Chat Linux / Independent Tester Re-test 06
Result: PHASE1_5_TEST_RETEST_06_REVISION_REQUIRED
Created File: docs/ai-team/tasks/TASK-004/phase1.5-context-guard-independent-test-retest-06.md

F-CG-01 Status: CLOSED
F-CG-02 Status: PARTIALLY_RESOLVED
F-CG-03 Status: CLOSED

Baseline Preflight: PASS — required before Override application
Baseline Decision Eligibility: PASS
Single Exceeded Limit: PASS
Baseline Evidence: FAIL — required measured_values, configured_limits, and override_eligible_limits are absent
Permit Binding: FAIL — explicit overridden_limit, baseline_original_limit, and approved_limit fields are absent
Original PASS Override Rejection: PASS

Context Guard: 27 PASS / 0 FAIL
Phase 1: 88 PASS / 0 FAIL
Application: 10 PASS / 0 FAIL
Protected Evidence: PASS — 10 found; 0 modified, removed, renamed, or checksum mismatches
Lint Status: NOT_APPLICABLE — package.json has no lint script

Critical / High / Medium / Low: 0 / 1 / 0 / 0

Critic Re-review Readiness: NOT_AUTHORIZED
Commit Readiness: NOT_AUTHORIZED
Recommended Next Role: Owner / Orchestrator decision
Recommended Next Artifact: Owner-authorized F-CG-02 remediation or clarification artifact
Gate Readiness: FAIL for F-CG-02 completion; no completion gate is authorized
Owner Approval Required: YES
```

Completion pause: stop pending Owner confirmation. Do not start source/test/schema
changes, Critic Re-review 02, Judge, Git add/commit, push/tag/release, status or
Registry updates, Phase 1.6, or Phase 5A.
