# TASK-004 Phase 1.5 — Context Guard Core MVP Tester Remediation 01

## 1. Document Control

| Item | Value |
|---|---|
| Authoring Role | Builder |
| Active Project / Task | `javascript-roulette` / `TASK-004` |
| Phase | `1.5 — Context Guard Core MVP` |
| Authorization | Owner authorization: F-T1, F-T2, and protected-evidence manifest completion only |
| Result | `PHASE1_5_TESTER_REMEDIATION_01_COMPLETE` |

## 2. Role Activation

Builder acted only within the explicit remediation authorization. Tester, Critic, and
Judge were not started. No Git add, commit, push, tag, or release was performed.

## 3. Runtime／Baseline

The mandatory preflight was executed in `/home/baisound/projects/javascript-roulette`
on Linux with `$HOME=/home/baisound`, ext4, branch `main`, HEAD
`eb37ebd4900eb7192d72ab74a761e56d46f378a1`, and zero staged files (exit code 0).

## 4. Current Worktree Boundary

Pre-existing tracked/untracked paths were limited to the recorded Phase 1.5
allowlist: `.gitignore`, the four schemas, Phase 1.5 artifacts, `src/context-guard/`,
and `tests/context-guard/`. This remediation changed only existing allowlisted Context
Guard source/tests and this newly authorized Builder artifact.

## 5. Exact Finding Extraction

| ID | Title / Severity | Evidence and existing behavior | Expected behavior / affected files | Closure criteria and required tests |
|---|---|---|---|---|
| F-T1 | Five Guard Decisions Are Not Implemented / HIGH | `evaluateLimits` returned only strings `PASS`, `OWNER_OVERRIDE_REQUIRED`, or `SPLIT_REQUIRED`; `PASS_WITH_REDUCTION` and settled `HARD_STOP` were absent. | Implement a five-decision contract in `evaluate.mjs`, enforce Permit eligibility in `permit.mjs`, and test the decision boundary. | All five decisions are explicit, deterministic, and only `PASS`/`PASS_WITH_REDUCTION` may issue a Permit. |
| F-T2 | Allowed Read Roots Are Caller-Controlled Rather Than Enforced / HIGH | `collectInputInventory(candidates, allowedRoots)` passed a caller-provided root list to path validation. | Fix trusted production roots in `config.mjs`; consume them internally in `inventory.mjs`; bind their resolved checksum into a Permit. | Foundation/project roots accepted; caller-root injection, outside roots, relative/prefix/spoof/symlink roots, and environment additions rejected or ignored. |

## 6. Remediation Scope

Only F-T1 and F-T2 were remediated. No Phase 1.6 transfer requirement, Ledger fault
matrix, complete TOCTOU/static-bypass matrix, Cost Guard, Phase 5A, or architectural
scope amendment was changed.

## 7. Five Guard Decisions

`evaluateLimits` now returns the required immutable decision record:
`decision`, `role_activation_allowed`, `permit_issuance_allowed`,
`reduction_applied`, `excluded_inputs`, `split_reason`, `exceeded_limits`,
`override_eligible_limit`, `safe_stop`, and `evidence`.

- `PASS`: all measured input and output limits are within bounds.
- `PASS_WITH_REDUCTION`: only `DUPLICATE`, `IRRELEVANT`,
  `HISTORICAL_EVIDENCE`, or `CONDITIONAL_SUPPORTING` entries are excluded and
  no mandatory entry is removed.
- `SPLIT_REQUIRED`: output-token, artifact-byte, or section limit is exceeded.
- `OWNER_OVERRIDE_REQUIRED`: exactly one override-eligible mandatory-input limit
  remains exceeded.
- `HARD_STOP`: inventory/security/canonical conflict, unknown measurements, or
  unresolved/multiple hard-limit failure.

## 8. Decision Precedence

The implementation applies the required precedence:
`HARD_STOP` → `OWNER_OVERRIDE_REQUIRED` → `SPLIT_REQUIRED` →
`PASS_WITH_REDUCTION` → `PASS`. A security or inventory failure returns
`HARD_STOP` before every lower-priority condition.

## 9. Role Activation／Permit Behavior

Only `PASS` and settled `PASS_WITH_REDUCTION` can issue a Permit. `SPLIT_REQUIRED`,
`OWNER_OVERRIDE_REQUIRED`, and `HARD_STOP` issue none and cannot activate a Role.

## 10. Trusted Allowed Read Roots

Production input inventory now has the API boundary
`collectInputInventory(candidates)`. It resolves only the fixed trusted paths:

```text
/home/baisound/projects/ai-team
/home/baisound/projects/javascript-roulette
```

The prior caller-supplied `allowedRoots` parameter is absent; an extra JavaScript
argument has no authority and is ignored.

## 11. Trusted Configuration Authority

The configuration is fixed in `config.mjs`. It requires absolute, existing,
non-symlink directories, resolves each by `realpath`, does not read environment
variables, and is not exported by the public Context Guard index. Root additions
cannot be made by Role, adapter, CLI, or Owner override. Path-security rejection is
not overrideable.

## 12. Root Set Binding

`issueRoleActivationPermit` records the SHA-256 checksum of the sorted resolved
trusted Root Set. `validateRoleActivationPermit` recomputes it and rejects a Permit
whose root-set binding no longer matches. Root changes therefore require a fresh
preflight and Permit.

## 13. Files Changed

- `src/context-guard/config.mjs`
- `src/context-guard/inventory.mjs`
- `src/context-guard/evaluate.mjs`
- `src/context-guard/permit.mjs`
- `src/context-guard/path-safety.mjs`
- `tests/context-guard/context-guard.unit.test.mjs`
- `tests/context-guard/context-guard.integration.test.mjs`
- `tests/context-guard/context-guard.path-safety.test.mjs`
- `tests/context-guard/context-guard.permit.test.mjs`

## 14. Files Created

- `docs/ai-team/tasks/TASK-004/phase1.5-context-guard-tester-remediation-01.md`

## 15. Allowlist Compliance

PASS. All source and test paths are in the existing implementation allowlist; the
only new evidence file is the explicitly authorized report above.

## 16. Targeted Tests

`node --test` ran the unit, integration, path-safety, and Permit test files:
19 passed, 0 failed (exit code 0). Coverage includes all five decisions, reduction
classes, mandatory preservation, output split triggers, security/inventory/canonical
hard stops, precedence, Permit eligibility, configured roots, outside paths, relative
paths, prefix spoofing, symlink roots, and ignored environment roots.

## 17. Context Guard Full Tests

`node --test tests/context-guard/*.test.mjs`: 24 passed, 0 failed (exit code 0).

## 18. Phase 1 Regression

`node --test tests/lifecycle/phase1/lifecycle-store.test.mjs`: 88 passed, 0 failed
(exit code 0).

## 19. Application Regression

`npm test`: 10 passed, 0 failed (exit code 0). npm emitted a non-failing
`devdir` configuration deprecation warning.

## 20. Protected Evidence Manifest

The protected set is the original ten Phase 1.5 design/Owner artifacts, excluding
implementation and remediation reports. `sha256_before` was captured at the start
of this manifest-completion procedure; the after value was rechecked after this
report was created.

```yaml
protected_evidence:
  - { path: docs/ai-team/tasks/TASK-004/phase1.5-context-guard-kickoff.md, size: 13298, sha256_before: 6db9b07bcb485ea2b6dd3860d43eac52e4195786d616b02f110d4f06ae258671, sha256_after: 6db9b07bcb485ea2b6dd3860d43eac52e4195786d616b02f110d4f06ae258671, classification: PRESERVED_PHASE1_5_EVIDENCE, modified: false }
  - { path: docs/ai-team/tasks/TASK-004/phase1.5-context-guard-design-final-plan.md, size: 23913, sha256_before: 58cbc95a213389b68140d016f9f3e774b66e1c8043ffde88139b8db07b5539ee, sha256_after: 58cbc95a213389b68140d016f9f3e774b66e1c8043ffde88139b8db07b5539ee, classification: PRESERVED_PHASE1_5_EVIDENCE, modified: false }
  - { path: docs/ai-team/tasks/TASK-004/phase1.5-context-guard-design-final-plan-revision-01.md, size: 25454, sha256_before: 55d673624e577a9981286de5ec6385c1b849ea4099d093b866ff1e1bee4b5e51, sha256_after: 55d673624e577a9981286de5ec6385c1b849ea4099d093b866ff1e1bee4b5e51, classification: PRESERVED_PHASE1_5_EVIDENCE, modified: false }
  - { path: docs/ai-team/tasks/TASK-004/phase1.5-context-guard-design-review.md, size: 11348, sha256_before: 93e002427da10dd58d4b8564bbed43d8946cbad17448b0085a2d83a08cb93067, sha256_after: 93e002427da10dd58d4b8564bbed43d8946cbad17448b0085a2d83a08cb93067, classification: PRESERVED_PHASE1_5_EVIDENCE, modified: false }
  - { path: docs/ai-team/tasks/TASK-004/phase1.5-context-guard-design-rereview-01.md, size: 15279, sha256_before: e64f93ab79beb472c92e61a7a73e27366fd382708882970ab8bd9819f9df2c62, sha256_after: e64f93ab79beb472c92e61a7a73e27366fd382708882970ab8bd9819f9df2c62, classification: PRESERVED_PHASE1_5_EVIDENCE, modified: false }
  - { path: docs/ai-team/tasks/TASK-004/phase1.5-context-guard-design-judge-decision.md, size: 17171, sha256_before: f1c4df6adb26192b2e17c718b651cb03dcd332f7f6d8b5b8a120d94f23ae2d09, sha256_after: f1c4df6adb26192b2e17c718b651cb03dcd332f7f6d8b5b8a120d94f23ae2d09, classification: PRESERVED_PHASE1_5_EVIDENCE, modified: false }
  - { path: docs/ai-team/tasks/TASK-004/phase1.5-context-guard-design-judge-decision-02.md, size: 9671, sha256_before: 6fe0401749e0835eab91727a9d00dc836afbe313ffe17ff70805028098b17f54, sha256_after: 6fe0401749e0835eab91727a9d00dc836afbe313ffe17ff70805028098b17f54, classification: PRESERVED_PHASE1_5_EVIDENCE, modified: false }
  - { path: docs/ai-team/tasks/TASK-004/phase1.5-context-guard-design-judge-decision-02-retry-01.md, size: 11780, sha256_before: 4b9c8aa4526ba743ee9d91cebbfb6a0bf7be667a6b2f77b883977019e19be778, sha256_after: 4b9c8aa4526ba743ee9d91cebbfb6a0bf7be667a6b2f77b883977019e19be778, classification: PRESERVED_PHASE1_5_EVIDENCE, modified: false }
  - { path: docs/ai-team/tasks/TASK-004/phase1.5-context-guard-owner-decisions.md, size: 11250, sha256_before: 68fdf00449e272a000afc84ed9944821e68cb04044bcf943512b2e24314e6c2b, sha256_after: 68fdf00449e272a000afc84ed9944821e68cb04044bcf943512b2e24314e6c2b, classification: PRESERVED_PHASE1_5_EVIDENCE, modified: false }
  - { path: docs/ai-team/tasks/TASK-004/phase1.5-context-guard-owner-decisions-addendum-01.md, size: 21578, sha256_before: 401dbe371049cfa7832f3f238ef69e91604592ed67122c9baaffbc044058873c, sha256_after: 401dbe371049cfa7832f3f238ef69e91604592ed67122c9baaffbc044058873c, classification: PRESERVED_PHASE1_5_EVIDENCE, modified: false }
```

## 21. Protected Evidence Integrity

PASS: file count 10; SHA-256 before/after values match; additions, deletions, and
renames within the protected set are 0; existing evidence modifications are 0.

## 22. Remaining Findings

F-T1 and F-T2 are remediated by Builder evidence. The Phase 1.6-transferred Ledger
and complete TOCTOU/static-bypass requirements remain `TRANSFERRED_NOT_CLOSED` and
were not changed or represented as Phase 1.5 completion.

## 23. Critical／High／Medium／Low Counts

Within the reduced Phase 1.5 scope: Critical 0, High 0, Medium 0, Low 0. This is a
Builder remediation observation, not an independent Tester conclusion.

## 24. Remediation Result

`PHASE1_5_TESTER_REMEDIATION_01_COMPLETE`

## 25. Independent Tester Re-entry Conditions

Owner may separately authorize Tester re-entry to independently verify F-T1/F-T2,
the reduced-scope boundary, the full protected-evidence manifest, and the recorded
test commands. Tester rerun was not started in this session.

## 26. Commit Status

Git add, commit, push, tag, and release were not performed.

## 27. Owner Approval Required

YES. Stop pending Owner direction. No Tester, Critic, Judge, Git operation, Phase
1.6, Phase 5A, or status/registry update was started.
