# TASK-004 Phase 1.5 — Context Guard Core MVP Independent Test Report

## 1. Document Control

| Item | Value |
|---|---|
| Authoring Role | Tester |
| Active Project / Task | `javascript-roulette` / `TASK-004` |
| Phase | `1.5 — Context Guard Core MVP` |
| Authorization | Owner-authorized Tester review only |
| Allowed persistent output | This artifact only |
| Result | `PHASE1_5_TEST_REVISION_REQUIRED` |

This report evaluates only the reduced Context Guard Core MVP defined by
`phase1.5-context-guard-scope-amendment.md`. It does not require the complete
Permit Ledger Fault Matrix, TOCTOU Matrix, Activation Entry Matrix, or any
requirement transferred to Phase 1.6 to be complete.

## 2. Inputs Reviewed

- Scope Amendment.
- Implementation Report and Remediation 01 / 02.
- Phase 1.5 revised final plan, Context Guard source, tests, schemas, and
  `.gitignore`.
- `task.md`, `PROJECT.md`, and the applicable Tester role requirements provided
  for this review.

## 3. Independent Procedures and Observed Results

| Check | Procedure / evidence | Execution Status | Result |
|---|---|---|---|
| Context Guard test suite | `node --test tests/context-guard/*.test.mjs` | `EXECUTED` | PASS — 13 passed, 0 failed |
| Phase 1 regression | `node --test tests/lifecycle/phase1/lifecycle-store.test.mjs` | `EXECUTED` | PASS — 88 passed, 0 failed |
| Application regression | `npm test` | `EXECUTED` | PASS — 10 passed, 0 failed |
| Syntax | `node --check` for every Context Guard source and test module | `EXECUTED` | PASS |
| Lint / diagnostics | IDE diagnostics for Context Guard source, tests, and schemas | `EXECUTED` | PASS — no errors |
| Diff whitespace | `git diff --check` | `EXECUTED` | PASS |
| Allowlist | Current changed/untracked paths were compared with the Phase 1.5 allowlist | `EXECUTED` | PASS — observed paths are `.gitignore`, four schemas, Phase 1.5 artifacts, `src/context-guard/`, and `tests/context-guard/` |
| Recorded protected Evidence SHA-256 | `sha256sum` for the five protected artifacts whose expected hashes are recorded in `phase1.5-context-guard-design-judge-decision-02.md` | `EXECUTED` | PASS — all five current hashes exactly match their recorded values |
| Remaining protected Evidence SHA-256 | Compare the claimed ten-file protected set against a complete, immutable baseline manifest | `PARTIALLY_EXECUTED` | `NOT_CONFIRMED` — the implementation/remediation reports state that ten files were protected but do not identify all ten paths and expected hashes |

The five independently matched SHA-256 values are:

- `phase1.5-context-guard-design-final-plan-revision-01.md`:
  `55d673624e577a9981286de5ec6385c1b849ea4099d093b866ff1e1bee4b5e51`
- `phase1.5-context-guard-design-rereview-01.md`:
  `e64f93ab79beb472c92e61a7a73e27366fd382708882970ab8bd9819f9df2c62`
- `phase1.5-context-guard-owner-decisions.md`:
  `68fdf00449e272a000afc84ed9944821e68cb04044bcf943512b2e24314e6c2b`
- `phase1.5-context-guard-design-judge-decision.md`:
  `f1c4df6adb26192b2e17c718b651cb03dcd332f7f6d8b5b8a120d94f23ae2d09`
- `phase1.5-context-guard-owner-decisions-addendum-01.md`:
  `401dbe371049cfa7832f3f238ef69e91604592ed67122c9baaffbc044058873c`

## 4. Reduced-Scope Conformance Findings

### F-T1 — Five Guard Decisions Are Not Implemented

| Field | Observation |
|---|---|
| Severity | HIGH |
| Scope | Phase 1.5 required capability: `five_guard_decisions` |
| Evidence | `evaluateLimits` returns only `PASS`, `OWNER_OVERRIDE_REQUIRED`, or `SPLIT_REQUIRED`. `PASS_WITH_REDUCTION` is neither produced nor handled as an activation-eligible settled decision. `HARD_STOP` exists only as an error code / rejection path, not as a Guard decision result. |
| Test evidence | The 13-test suite passes, but its unit test asserts only `PASS`, `OWNER_OVERRIDE_REQUIRED`, and `SPLIT_REQUIRED`. |
| Impact | The required Core MVP decision model is incomplete; a reduced-input success flow cannot be represented and the five-decision requirement cannot be independently confirmed. |
| Required correction | Implement and test each reduced-scope Guard decision with exact boundary and activation behavior, including a settled `PASS_WITH_REDUCTION` path and an explicit `HARD_STOP` decision result. |

### F-T2 — Allowed Read Roots Are Caller-Controlled Rather Than Enforced

| Field | Observation |
|---|---|
| Severity | HIGH |
| Scope | Phase 1.5 required capability: `allowed_root_containment` |
| Evidence | `collectInputInventory(candidates, allowedRoots)` accepts arbitrary caller-provided roots and passes them to `resolveAndValidateInputPath`. No module defines or enforces the approved roots. |
| Impact | Containment is enforced only relative to a caller-selected root. A caller can nominate an otherwise unauthorized root, so the Core MVP does not enforce the approved allowed-root boundary. |
| Required correction | Define the approved root set in trusted Context Guard configuration, reject caller-supplied roots outside it, and add independent tests for attempted unauthorized-root selection. |

## 5. Phase 1.6 Transfer Verification

| Check | Result |
|---|---|
| Complete Permit Ledger Fault Matrix falsely recorded as completed in Phase 1.5 | PASS — Remediation 02 explicitly states that the full matrix is not implemented. |
| Complete TOCTOU / static-bypass matrices falsely recorded as completed in Phase 1.5 | PASS — Remediation 02 explicitly states that the full matrices remain incomplete. |
| Transferred High findings recorded as closed or accepted | PASS — Scope Amendment records both as `TRANSFERRED_NOT_CLOSED`, `PHASE_1_6_P0`, and not risk accepted. |
| Foundation-wide activation enforcement claimed complete | PASS — Scope Amendment expressly prohibits that representation. |

These transferred requirements are not the reason for the Phase 1.5 result.

## 6. Result, Unresolved Items, and Completion Pause

Top-level Result: `PHASE1_5_TEST_REVISION_REQUIRED`.

The test commands and basic evidence checks pass, but F-T1 and F-T2 are missing
required Context Guard Core MVP capabilities. Complete protected-Evidence
integrity is additionally `NOT_CONFIRMED` because a complete baseline manifest
for the claimed ten-file set was not available.

No source, test, schema, configuration, runtime state, Git state, or historical
artifact was modified. No Critic, Judge, Git, Phase 1.6, Phase 2, or Phase 5A
action was started. Stop pending Owner direction.
