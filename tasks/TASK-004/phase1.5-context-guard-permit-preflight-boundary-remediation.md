# TASK-004 Phase 1.5 — F-CG-01 Permit Issuance Fail-closed Boundary Remediation

## Document Control

| Item | Value |
|---|---|
| Authoring Role | Builder |
| Active Project / Task | `javascript-roulette` / `TASK-004` |
| Phase | `1.5 — Context Guard Core MVP` |
| Objective | Correct only F-CG-01 by requiring verified persisted Canonical Preflight evidence at Permit issuance and Gateway validation boundaries. |
| Authorization | Owner-authorized implementation remediation for F-CG-01 only. Tester re-test, Critic re-review, Judge, and Git writes are not authorized. |
| Result | `PHASE1_5_PERMIT_PREFLIGHT_BOUNDARY_COMPLETE_WITH_CONDITIONS` |

## Role Activation

Builder acted only under the supplied bounded authorization. No Tester, Critic,
Judge, Git add, commit, push, tag, release, Status, Registry, Phase 1.6, or Phase
5A action was started.

## Runtime／Baseline

The mandatory preflight ran from `/home/baisound/projects/javascript-roulette`
with exit code `0`. `$HOME=/home/baisound`, Linux, ext4, branch `main`, HEAD
`eb37ebd4900eb7192d72ab74a761e56d46f378a1`, and zero staged changes were
confirmed.

## Current Worktree Boundary

The pre-existing worktree consisted only of the recorded Phase 1.5 allowlist:
`.gitignore`, Context Guard schemas, Phase 1.5 artifacts, `src/context-guard/`,
and `tests/context-guard/`. This remediation changes only existing Context Guard
source, tests, and relevant schemas, then creates this single authorized Builder
artifact.

## Exact Finding Extraction

| Field | Record |
|---|---|
| Finding ID | `F-CG-01` |
| Title | Missing required output measurements default to zero and can issue a Permit |
| Severity | `HIGH` |
| Exact evidence | `evaluateLimits` had been fixed to return `HARD_STOP` for missing/invalid output estimates, but `issueRoleActivationPermit` accepted no Preflight or output estimates, defaulted to `PASS`, and wrote a Permit. The Gateway then consumed that Permit and activated the Role. |
| Existing unsafe API path | `issueRoleActivationPermit({ session, project_id, task_id, role, session_id, selected_inputs })` → default `PASS` Permit → `activateRoleWithPermit`. |
| Missing issuance inputs | Canonical Preflight result, persisted-evidence checksum, decision binding, three required output estimates, selected-input/root/config bindings. |
| Gateway gap | It validated only the Permit and consumption state; it did not require/re-read matching Preflight evidence before consumption. |
| Affected files | `permit.mjs`, `activation-gateway.mjs`, Permit/Gateway tests, Preflight and Permit schemas, error codes. |
| Closure criteria | Missing/invalid estimates and absent/forged Preflight evidence cannot issue a Permit or activate a Role; only verified `PASS` / `PASS_WITH_REDUCTION` Preflight evidence can. |
| Required tests | Permit issuance negative cases, Gateway pre-consumption rejection, canonical `PASS`, `PASS_WITH_REDUCTION`, and existing Override path regression. |

## Remediation Scope

The change is limited to the F-CG-01 Permit issuer / validator / Gateway
fail-closed boundary. F-CG-02 and F-CG-03 behavior was not redesigned. No Phase
1.6 transfer, Cost Guard, Phase 1.7+, Phase 5A, or unrelated refactor was added.

## Previous Unsafe Permit Flow

```text
Caller selected inputs
→ issueRoleActivationPermit(... default PASS)
→ immutable Permit
→ Gateway validation and consumption
→ Role activation handoff
```

The prior flow did not require a Preflight Result, persisted Preflight evidence, or
the three required output estimates.

## Canonical Permit Issuance Flow

```text
Canonical Context Guard Preflight
→ immutable preflight-result.json or override repreflight-result.json
→ file and parent-directory sync
→ verified reread and checksum validation
→ identity / input-set / root-set / config / decision / estimate validation
→ Permit issuance
```

`issueRoleActivationPermit` now requires `preflight_result` and
`preflight_result_checksum`; there is no default decision. The persisted evidence
is reread instead of trusting the caller's object.

## Preflight Result Contract

Canonical preflight evidence now has strict runtime-required fields:

```text
result_id
project_id, task_id, role, session_id
decision
selected_input_set_checksum
trusted_root_set_checksum
guard_config_checksum
estimated_output_tokens
estimated_artifact_bytes
expected_artifact_sections
measured_values
exceeded_limits
permit_issuance_allowed
role_activation_allowed
safe_stop
issued_at
result_checksum
content_checksum
```

The Override re-preflight preserves its pre-existing baseline and Override checksum
fields in addition to this contract. `context-preflight.schema.json` was aligned to
the ordinary canonical Preflight record.

## Required Output Estimates

`estimated_output_tokens`, `estimated_artifact_bytes`, and
`expected_artifact_sections` are present in both the Preflight evidence and Permit.
Runtime validation requires each to be a safe non-negative integer. Missing,
`undefined`, `null`, `NaN`, infinity, negative, fractional, or wrong-type values
cannot satisfy Permit issuance. No nullish conversion, caller fallback, default
estimate, or default `PASS` path exists.

## Decision Eligibility

The issuer obtains the decision only from verified persisted Preflight evidence.
Only `PASS` and `PASS_WITH_REDUCTION`, with both Permit and activation eligibility
set to `true` and `safe_stop` set to `false`, can issue a Permit. `SPLIT_REQUIRED`,
`OWNER_OVERRIDE_REQUIRED`, `HARD_STOP`, unknown, missing, or altered decisions are
rejected.

## Persisted Preflight Evidence

The issuer reads the expected evidence filename (`preflight-result.json`, or the
existing `repreflight-result.json` for the Override path) through
`readVerifiedEvidence`. It verifies immutable `content_checksum`, explicit
`result_checksum`, exact runtime field set, project/task/role/session, selected
input-set checksum, trusted root-set checksum, and guard-config checksum before
creating a Permit. Missing evidence, checksum mismatch, fake caller objects, or
binding mismatch rejects issuance.

## Permit Explicit Binding

Each new Permit now explicitly includes:

```text
preflight_result_id
preflight_result_checksum
guard_decision
estimated_output_tokens
estimated_artifact_bytes
expected_artifact_sections
selected_input_set_checksum
trusted_root_set_checksum
guard_config_checksum
```

These fields are covered by Permit `content_checksum`. Existing Override fields and
the existing `permit_binding` remain present and are validated.

## Gateway Revalidation

Before Permit consumption, `validateRoleActivationPermit` rereads the persisted
Preflight evidence and verifies its checksum; compares result ID, decision, all
three estimates, selected-input set, trusted root set, guard configuration, expiry,
and unused state; then retains existing Override binding validation. Missing
Preflight bindings are treated as legacy Permit rejection. Gateway returns
`CONTEXT_GATEWAY_PREFLIGHT_VERIFICATION_FAILED` without consuming the Permit or
executing the Role handoff when that validation fails.

## Public API Boundary

- Permit issuance requires `preflight_result` and `preflight_result_checksum`.
- `decision = 'PASS'` was removed.
- Estimate defaults of zero do not exist.
- No test helper was exported from the public Context Guard index.
- No environment bypass, Gateway fallback route, or legacy-Permit compatibility
  route was added.

## Error Contract

The Context Guard error registry now distinguishes:

```text
CONTEXT_PREFLIGHT_RESULT_REQUIRED
CONTEXT_PREFLIGHT_EVIDENCE_REQUIRED
CONTEXT_PREFLIGHT_RESULT_INVALID
CONTEXT_PREFLIGHT_CHECKSUM_MISMATCH
CONTEXT_PREFLIGHT_BINDING_MISMATCH
CONTEXT_OUTPUT_ESTIMATION_REQUIRED
CONTEXT_OUTPUT_ESTIMATION_INVALID
CONTEXT_PERMIT_DECISION_INELIGIBLE
CONTEXT_PERMIT_PREFLIGHT_BINDING_MISSING
CONTEXT_GATEWAY_PREFLIGHT_VERIFICATION_FAILED
CONTEXT_LEGACY_PERMIT_REJECTED
```

These errors are fail-closed: no automatic fallback occurs, Permit issuance stops,
and Gateway activation does not proceed.

## Static Boundary Verification

Executed from `/home/baisound/projects/javascript-roulette`:

```bash
rg "decision\s*=\s*['\"]PASS['\"]|decision:\s*['\"]PASS['\"]" src/context-guard --glob "*.mjs"
rg "issueRoleActivationPermit\(" src/context-guard --glob "*.mjs"
rg "CONTEXT_GUARD_DISABLED|DISABLE_CONTEXT_GUARD|process\.env" src/context-guard --glob "*.mjs"
```

Observed results:

- Default `PASS` assignment: no matches.
- Production issuer declarations/call sites: one declaration only; no omitted
  production issuer call site.
- Environment bypass symbols: no matches.
- Gateway has no Preflight-validation bypass; Permit validation occurs before
  consumption.
- Legacy Permit fields are explicitly rejected.

## Files Changed

- `src/context-guard/errors.mjs`
- `src/context-guard/permit.mjs`
- `src/context-guard/override.mjs`
- `src/context-guard/activation-gateway.mjs`
- `tests/context-guard/context-guard.permit.test.mjs`
- `tests/context-guard/context-guard.gateway.test.mjs`
- `docs/ai-team/context-guard/phase1.5/schemas/context-preflight.schema.json`
- `docs/ai-team/context-guard/phase1.5/schemas/role-activation-permit.schema.json`

## Files Created

- `docs/ai-team/tasks/TASK-004/phase1.5-context-guard-permit-preflight-boundary-remediation.md`

## Allowlist Compliance

PASS. All implementation changes are within the existing Phase 1.5 Context Guard
source, test, and schema allowlist. This report is the sole newly created evidence
file. No protected evidence was modified.

## Targeted Test Commands

Executed from `/home/baisound/projects/javascript-roulette`:

```bash
node --test tests/context-guard/context-guard.permit.test.mjs
node --test tests/context-guard/context-guard.gateway.test.mjs
node --check src/context-guard/permit.mjs
node --check src/context-guard/override.mjs
node --check src/context-guard/activation-gateway.mjs
```

## Targeted Test Results

PASS:

- Permit / Preflight boundary: `7` passed, `0` failed.
- Gateway Preflight binding: `2` passed, `0` failed.
- Syntax checks: exit `0`.

Coverage includes missing Preflight, missing/persisted-invalid estimates, ineligible
decision, fake caller Preflight, legacy/missing Permit binding, result-ID mismatch,
estimate mismatch, decision mutation, standard `PASS`, `PASS_WITH_REDUCTION`, and
the existing Override path.

## Context Guard Full Tests

`node --test tests/context-guard/*.test.mjs`: `29` passed, `0` failed, exit `0`.

## Phase 1 Regression

`node --test tests/lifecycle/phase1/lifecycle-store.test.mjs`: `88` passed, `0`
failed, exit `0`.

## Application Regression

`npm test`: `10` passed, `0` failed, exit `0`. A non-failing npm `devdir`
deprecation warning was observed.

## Protected Evidence Integrity

PASS. The ten manifest paths were present after implementation and their observed
SHA-256 values exactly matched the protected-evidence manifest:

```yaml
expected_count: 10
found_count: 10
modified: 0
removed: 0
renamed: 0
checksum_mismatches: 0
```

Fixture cleanup passed: `.context-guard-runtime/` and
`.lifecycle-phase1-fixtures/` were absent after test execution.

## Lint Status

`NOT_APPLICABLE`: `package.json` has no lint script. JavaScript syntax checks,
fixture cleanup, `git diff --check`, and IDE diagnostics for changed files passed.

## Remaining Findings

No additional Builder-observed Critical, High, or Medium defect was found within
the authorized F-CG-01 boundary. F-CG-02 and F-CG-03 remain unchanged by design;
their prior closure requires independent revalidation, not a Builder claim. Phase
1.6 transfers remain `TRANSFERRED_NOT_CLOSED`.

## Critical／High／Medium／Low Counts

Builder implementation observation for F-CG-01: `0 / 0 / 0 / 0`. This is not an
independent Tester or Critic conclusion.

## Remediation Result

`PHASE1_5_PERMIT_PREFLIGHT_BOUNDARY_COMPLETE_WITH_CONDITIONS`

The implementation and Builder-run tests satisfy the authorized F-CG-01 boundary
contract. Conditions: independently re-test the changed behavior and independently
re-review F-CG-01; neither was started in this session.

## Tester Re-entry Conditions

A separately authorized Tester should execute the targeted Permit/Gateway tests and
full regressions; verify negative paths do not issue or consume a Permit; verify
the three estimate and Preflight evidence bindings; check the Override regression;
and recheck protected evidence / cleanup.

## Critic Re-entry Conditions

A separately authorized Critic should inspect the issuer, validator, Gateway,
Preflight evidence, schemas, and tests to confirm that no default-`PASS`,
unpersisted-Preflight, legacy-Permit, or Preflight-validation bypass remains.

## Commit Status

No Git add, commit, push, tag, release, or other Git write was performed. `git diff
--check` passed.

## Owner Approval Required

YES. Stop pending Owner confirmation. Do not automatically start Tester re-test,
Critic re-review, Judge, Git operations, Status/Registry update, Phase 1.6, or
Phase 5A.
