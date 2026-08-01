# Test Report

## Metadata

- Authoring Role: Tester
- Active Project: `/home/baisound/projects/javascript-roulette`
- Active Task: `TASK-004`
- Phase: Phase 1 — Canonical State Foundation / TESTING
- Created At: 2026-07-27
- Tester Result: `FAIL`
- Task-specific summary: `TEST_FAIL`

## Objective and Scope

保存済みのPhase 1実装をFinal Planと独立に照合し、Node `v24.18.0`、Linux WSL2、同一ext4 filesystemの範囲で、状態遷移、認可、証拠、revision、lease/fencing、原子更新、Recovery、および監査データを検証した。Builder自己申告は独立PASS根拠として使用していない。

テスト実行で使用した一時Task directoryはOS一時領域に作成し、各手順の`finally`で再帰削除した。保存済みruntime state、実装、既存テスト、仕様、履歴Artifactは変更していない。

## Test Scope and Environment

- Working directory: `/home/baisound/projects/javascript-roulette`
- Authorized environment observed: Node `v24.18.0`; `Linux 6.18.33.2-microsoft-standard-WSL2 x86_64 GNU/Linux`
- Filesystem observed: repository root、`src`、`docs/ai-team`はいずれも同じdevice `66876076`、`stat -fc` type `ext2/ext3`（Builder記録のext4対象として扱われたLinux filesystem）。
- Baseline: `78eccfcd5fc08dedee88ee179085c1e179945440`
- Current `HEAD`: `78eccfcd5fc08dedee88ee179085c1e179945440`。今回、commit又はpushを行っていない。
- Non-Linux/WSL2又は別filesystemの原子性・durabilityは実行対象外であり、Residual Riskである。

## Evidence Reviewed

- `AGENTS.md`、`PROJECT.md`
- `docs/ai-team/tasks/TASK-004/task.md`
- `docs/ai-team/tasks/TASK-004/final-plan.md`
- `docs/ai-team/tasks/TASK-004/final-plan-consistency-check.md`（`FINAL_PLAN_PASS`）
- `docs/ai-team/tasks/TASK-004/implementation-report.md`
- Tester Role、Common README、Workflow、Authority、Evidence、Artifact、Vocabulary仕様
- `src/lifecycle/phase1/index.mjs`
- `tests/lifecycle/phase1/lifecycle-store.test.mjs`
- `docs/ai-team/lifecycle/phase1/{schemas,config,tasks/TASK-004}/`

## Changed Files and Protected Files Finding

### Procedure

```text
git status --short && git rev-parse HEAD && git diff --name-status 78eccfcd5fc08dedee88ee179085c1e179945440 && git log -1 --format='%H %s' && node --version && uname -srmo && stat -fc '%T %d' . src docs/ai-team
```

- Execution Status: `EXECUTED`
- Observation Status: `OBSERVED`
- Exit code: `0`
- Actual output included `HEAD=78eccfcd5fc08dedee88ee179085c1e179945440`, Node `v24.18.0`, matching device IDs, and only these untracked paths:
  - `docs/ai-team/lifecycle/`
  - `docs/ai-team/tasks/TASK-004/implementation-report.md`
  - `src/lifecycle/`
  - `tests/lifecycle/`

The observed implementation paths are within the Phase 1 Final Plan path boundary. `git diff --name-status <baseline>` was empty because the implementation is untracked; `git status` is therefore the boundary evidence. No protected-path modification, Phase 2–6 runtime implementation, TASK-005/TASK-006 implementation, new commit, or push was observed. This Tester created only this report.

## Verification Results

| Check ID | Procedure | Expected Result | Actual Result | Execution Status | Observation Status | Result | Evidence / Limitation |
|---|---|---|---|---|---|---|---|
| T-01 | Builder automated command | All existing tests pass with actual counts | 4 pass, 0 fail, 0 skipped; duration `198.885698ms` | EXECUTED | OBSERVED | PASS | `node --test tests/lifecycle/phase1/lifecycle-store.test.mjs` exit 0 |
| T-02 | Syntax/whitespace/current worktree | Syntax and whitespace valid; observed paths only | `node --check` and `git diff --check` exit 0; current untracked paths as above | EXECUTED | OBSERVED | PASS | Combined command exit 0 |
| T-03 | Five-axis representation/static inspection | Five independent enum fields; no composite state | `task_status`, `current_phase`, `gate_status`, `authorization_status`, `archive_status` are independent enum properties | EXECUTED | OBSERVED | PASS | `index.mjs:5-11`, schema lines 12-16 |
| T-04 | DRAFT→ACTIVE and terminal→ACTIVE validation | DRAFT→ACTIVE allowed; terminal→ACTIVE rejected | Terminal→ACTIVE returned `TERMINAL_REOPEN_FORBIDDEN`; DRAFT→ACTIVE behavior is permitted by source logic | EXECUTED | PARTIALLY_OBSERVED | PASS | Terminal case executed; DRAFT rule source-inspected because supplied fixture is ACTIVE |
| T-05 | ACTIVE↔PAUSED/BLOCKED/STALLED | Phase 1 must reject these Phase 2-only business transitions | Each `ACTIVE→PAUSED/BLOCKED/STALLED` returned `UNDEFINED_TRANSITION` | EXECUTED | OBSERVED | PASS | Final Plan explicitly defers these operations to Phase 2; this is not a Phase 1 failure |
| T-06 | Required forward authorization | `IMPLEMENTATION_AUTHORIZATION→IMPLEMENTATION` requires valid `AUTHORIZED`, scoped evidence, and unexpired authority | Transition with `authorization_status=NOT_REQUIRED` was accepted | EXECUTED | OBSERVED | FAIL | Independent output: `{"forwardWithoutAuthorized":"ACCEPTED"}` |
| T-07 | Invalid/undefined and stale revision | Undefined edge and stale revision reject; failure leaves revision unchanged | Undefined skip and stale revision rejected; stale case retained revision 2 and added a rejection event | EXECUTED | OBSERVED | PASS | Existing suite plus independent output `staleRevision:"REVISION_CONFLICT"` |
| T-08 | Evidence/authorization/schema boundary | Reject wrong project, path traversal, malformed evidence, or absent authorization reference | `validateRecord` accepted wrong `project_id` and `{path:"../escape"}`; transition with absent authorization reference and bad evidence committed at revision 2 | EXECUTED | OBSERVED | FAIL | `recordValidation:"ACCEPTED_INVALID_PROJECT_AND_EVIDENCE"` and `unauthEvidenceTransition.committed:true` |
| T-09 | Lease/fencing precommit recheck | Re-read persisted lease holder/token/expiry/bound revision immediately before COMMIT; reject old/bad fencing | Test overwrote persisted lease with holder `attacker` and token 0 immediately before original check; transition nevertheless committed revision 3 | EXECUTED | OBSERVED | FAIL | `persistedLeaseTamperCommitted.committed:true`; implementation checks only in-memory lease at `index.mjs:160-162` |
| T-10 | Lease duration, one active lease, expiry, human/long work holding | 60 seconds, one active lease, no extension; no long-work holding | Static implementation fixes 60,000ms and `wx`; no explicit human-work API exists | EXECUTED | PARTIALLY_OBSERVED | NOT_CONFIRMED | Existing code has `open(...,"wx")` and 60s, but expiry/holder/fencing persistence is not safely enforced by T-09 |
| T-11 | VERIFY failure | Old snapshot/revision preserved; no commit; lease released | Forced `LEASE_INVALID`: revision remained 1; event `VERIFICATION_FAILED`, resulting revision null; lease absent; PREPARED journal remained | EXECUTED | OBSERVED | FAIL | `{"revision":1,"events":[{"outcome":"VERIFICATION_FAILED","failure_code":"LEASE_INVALID","resulting_revision":null}],"journalStillPresent":true,"leaseStillPresent":false}` |
| T-12 | Crash after PREPARED / candidate state | Recovery clears candidate/journal and releases lease; no committed revision | Recovery retained revision 1, but left active `lease.json` present | EXECUTED | OBSERVED | FAIL | `preparedRecovery:{leaseStillPresent:true,revision:1}` |
| T-13 | Crash after snapshot rename | Recover snapshot/log with no duplicate event | Existing independent automated test observed recovery at revision 2; it did not assert event count | EXECUTED | PARTIALLY_OBSERVED | NOT_CONFIRMED | Builder test is re-executed but its assertion is insufficient for no-duplicate proof |
| T-14 | Crash after LOG_APPENDED | Recovery retains one event and revision 2 | Recovery gave revision 2, one event, one unique transition ID | EXECUTED | OBSERVED | PASS | `logAppendedRecovery:{revision:2,events:1,uniqueIds:1}` |
| T-15 | Crash after VERIFY before commit / snapshot-before-event / lease-release boundary | Independently inject and verify every listed boundary | No distinct hook exists for “after full VERIFY before COMMIT”; `PREPARED` recovery itself fails lease release | PARTIALLY_EXECUTED | PARTIALLY_OBSERVED | NOT_CONFIRMED | Snapshot-before-event is covered by SNAPSHOT_RENAMED; full required boundary matrix is incomplete |
| T-16 | Failed-event taxonomy | Record required `INVALID_TRANSITION`, `REVISION_CONFLICT`, `LEASE_CONFLICT`, `LEASE_EXPIRED`, `AUTHORIZATION_REQUIRED`, `EVIDENCE_MISSING`, `VERIFY_FAILED`, `CHECKSUM_MISMATCH` without corrupting state | Source exposes different/incomplete names (`UNDEFINED_TRANSITION`, `LEASE_INVALID`, `AUTHORIZATION_MISSING`, `EVIDENCE_INVALID`, `CHECKSUM_INVALID`) and independent tests did not observe required missing cases | EXECUTED | PARTIALLY_OBSERVED | FAIL | Final Plan itself specifies different names for several requested labels; this is a specification/interface conflict, not a deferred Phase 2 item |
| T-17 | Actor audit, checksum and tamper resistance | 3 actors, self-excluding SHA-256, schema/version/tamper enforcement, append-only chain | Actor fields and self-excluding SHA-256 exist; record validation does not validate project ID, evidence references, authorization reference, time fields, or required schema fields beyond a subset | EXECUTED | OBSERVED | FAIL | `index.mjs:58-66`; JSON Schema only lists a limited required set |
| T-18 | Append-only/duplicate IDs and migration | Detect edited/reordered/duplicate JSONL; mapping is reference-only and TASK-003 untouched | Prototype logs empty; no log-chain verifier, duplicate-ID verifier, or migration-record validation was found; no TASK-003 change observed | EXECUTED | PARTIALLY_OBSERVED | NOT_CONFIRMED | Source only uses substring presence during append (`index.mjs:163-165`) |
| T-19 | Phase boundary scan | No runtime Phase 2–6/TASK-005/TASK-006 intrusion | Search found only Phase 1 enum/config references to `CLOSURE`; no TASK-005/006 runtime code | EXECUTED | OBSERVED | PASS | `rg` output recorded `CLOSURE` only in allowed enum/config |

## Commands and Actual Automated Results

### Existing automated tests and static checks

Working directory: `/home/baisound/projects/javascript-roulette`

```text
node --test "tests/lifecycle/phase1/lifecycle-store.test.mjs" && node --check "src/lifecycle/phase1/index.mjs" && git diff --check && git diff --name-only && git status --short
```

- Execution Status: `EXECUTED`
- Observation Status: `OBSERVED`
- Exit code: `0`
- Actual test output: `tests 4`, `pass 4`, `fail 0`, `cancelled 0`, `skipped 0`, `todo 0`.
- Actual worktree output was the four untracked allowed paths listed above.

### Independent runtime procedures

All ran from the same working directory using `node --input-type=module` and inline scripts; each script used `mkdtemp` below `tmpdir()` and removed its directory in `finally`.

1. Negative validation, stale revision, malformed authorization/evidence, persisted-lease tamper, PREPARED recovery:
   - Execution Status: `EXECUTED`; Observation Status: `OBSERVED`; exit code `0`.
   - Actual output:

```json
{"recordValidation":"ACCEPTED_INVALID_PROJECT_AND_EVIDENCE","unauthEvidenceTransition":{"revision":2,"committed":true},"staleRevision":"REVISION_CONFLICT","stalePreserves":{"revision":2,"logLines":2},"persistedLeaseTamperCommitted":{"revision":3,"committed":true},"preparedCrash":"SIMULATED_CRASH","preparedRecovery":{"journalRemoved":true,"leaseStillPresent":true,"revision":1}}
```

2. Forward authorization, deferred status operations, terminal rejection, LOG_APPENDED recovery, scope scan:
   - Execution Status: `EXECUTED`; Observation Status: `OBSERVED`; exit code `0`.
   - Actual output:

```json
{"forwardWithoutAuthorized":"ACCEPTED","ACTIVE_TO_PAUSED":"UNDEFINED_TRANSITION","ACTIVE_TO_BLOCKED":"UNDEFINED_TRANSITION","ACTIVE_TO_STALLED":"UNDEFINED_TRANSITION","terminalToActive":"TERMINAL_REOPEN_FORBIDDEN","logAppendedCrash":"SIMULATED_CRASH","logAppendedRecovery":{"revision":2,"events":1,"uniqueIds":1}}
```

3. Forced verification failure:
   - Execution Status: `EXECUTED`; Observation Status: `OBSERVED`; exit code `0`.
   - Actual output:

```json
{"revision":1,"events":[{"outcome":"VERIFICATION_FAILED","failure_code":"LEASE_INVALID","resulting_revision":null}],"journalStillPresent":true,"leaseStillPresent":false}
```

## Crash Recovery and Lease/Fencing Findings

- `SNAPSHOT_RENAMED` recovery is covered by the existing suite but lacks a no-duplicate assertion: `NOT_CONFIRMED`.
- `LOG_APPENDED` recovery independently passed for one event and one unique ID.
- `PREPARED` recovery fails to release the lease. A subsequent writer can be blocked until expiry; this violates the planned cleanup/release behavior.
- Full VERIFY failure preserves the old snapshot and revision and releases the lease, but leaves a PREPARED journal until later recovery. The planned safe-stop cleanup behavior is therefore incomplete.
- The pre-COMMIT check does not re-read the persisted lease; modifying the stored holder/fencing token did not prevent commit. This invalidates the required fencing guarantee.
- No separate reproducible hook proves the post-full-VERIFY/pre-COMMIT boundary. It is `NOT_CONFIRMED`, not PASS.

## Actor, Checksum, Schema, and Migration Findings

The implementation contains the three actor fields and canonical JSON self-excluding SHA-256 construction. Those positive structural observations do not compensate for the observed validation bypass:

- `project_id` is not checked against the active project.
- Evidence path containment, evidence checksum format/content, and authorization structure/expiry/scope are not validated.
- The JSON Schema has only a subset of Final Plan required fields and no `additionalProperties` or reference-integrity constraints.
- Transition log checksum chaining is written but no complete reader/verifier validates append-only order, duplicates, or tampering.
- Empty prototype migration mapping leaves reference-only behavior and TASK-003 non-modification unconfirmed beyond the observed no-change boundary.

## Defect List

| ID | Severity | Finding | Evidence |
|---|---|---|---|
| D-01 | Critical | Authorization is bypassable: a forward transition into `IMPLEMENTATION` succeeds with `NOT_REQUIRED`; malformed/missing authorization and evidence also commit. | T-06, T-08 |
| D-02 | High | Persisted lease holder/fencing token is not re-read before COMMIT, allowing an old/tampered lease candidate to commit. | T-09 |
| D-03 | High | PREPARED crash recovery leaves the active lease, violating release/recovery availability guarantees. | T-12 |
| D-04 | High | Record/schema/evidence validation omits Final Plan required integrity controls, including active project and evidence path constraints. | T-08, T-17 |
| D-05 | Medium | VERIFY-failure cleanup leaves a journal; full crash boundary coverage and no-duplicate evidence are incomplete. | T-11, T-13, T-15 |
| D-06 | Medium | Required failure-code vocabulary is absent or conflicts with Final Plan terminology; append-only/tamper/duplicate/migration verification is unproven. | T-16, T-18 |

## Persistent Process, HTTP, Browser, Accessibility, and Security Verification

No server, browser UI, or accessibility surface is in the Phase 1 implementation scope; these procedures are `NOT_EXECUTED` / `NOT_OBSERVED` and are not used as PASS evidence. Security-relevant filesystem data validation was tested in T-08 and failed.

## Retest Need

Retest is required after authorized Builder fixes for D-01 through D-04. At minimum, rerun all existing tests and independent cases for authorization expiry/scope/evidence, persisted holder/fencing, PREPARED recovery cleanup, all failure-event codes, tampered/reordered/duplicate logs, and every planned crash boundary.

## Residual Risk

- Node/WSL2/ext4 same-filesystem semantics are the only tested environment. Other filesystems remain out of scope and are not a PASS claim.
- The local `stat -fc` filesystem label is `ext2/ext3`; the authorized ext4 assertion is based on the environment constraint/Builder evidence, not independently proved by this command.
- Durable `fsync` behavior across power loss was not reproducible in this test environment.

## Result

`FAIL`

## Unresolved Items

- D-01 Critical and D-02–D-04 High remain unresolved. Unsafe or destructive further testing was stopped.
- The requested failed-event labels conflict in part with the Final Plan error model; reconciliation requires authorized design/implementation handling, not Tester interpretation.
- Full append-only/tamper/migration and crash-boundary proof remains `NOT_CONFIRMED`.

## Known Limitations

This report does not authorize fixes, implementation, role routing, closure, archive, commit, or push. It records only independently observed evidence from the saved implementation and temporary runtime tests.

## Handoff Information

Return this Tester artifact to the Orchestrator. Advisory recommendation: preserve the `FAIL` result, keep the Critical/High defects visible, and require authorized remediation followed by a Tester retest artifact before any final implementation judgment.
