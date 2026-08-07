# Retest Report 05 — Cycle 5 Durable Append Independent Retest

## Document Control
- Authoring Role: Tester
- Session Name: Cycle 5 durable append independent retest restart 1
- Active Project: `/home/baisound/projects/javascript-roulette`
- Active Task: `TASK-004`
- Retest Cycle 5 Authorization: `AUTHORIZED`
- Result: `RETEST_FAIL`

## Environment and Scope
- CWD: `/home/baisound/projects/javascript-roulette`
- OS: `Linux 6.18.33.2-microsoft-standard-WSL2 x86_64 GNU/Linux`; Node: `v26.4.0`.
- Filesystem: `/dev/sdd`, `ext4`, `rw,relatime,discard,errors=remount-ro,data=ordered`.
- Fixture: `${PROJECT_ROOT}/.lifecycle-phase1-fixtures/fixture-*`; every fixture reported `ext4 /dev/sdd`, not Windows mount or tmpfs.
- Allowed artifact created: `/home/baisound/projects/javascript-roulette/docs/ai-team/tasks/TASK-004/retest-report-05.md`.
- Tester production/test source changes: none. Existing reports/history/schema/Foundation changes: none. Changes outside allowed file: none. Commit/push: not performed.

## Inputs
- `implementation-review.md`, `implementation-fix-report.md`, `final-plan-amendment-d05-d06.md`, `src/lifecycle/phase1/index.mjs`, and `tests/lifecycle/phase1/lifecycle-store.test.mjs` were read.
- Builder asserts that a matching existing Event is not re-appended and that an unconfirmed post-Snapshot state remains `RECOVERY_REQUIRED`. Independent observation below shows APPLIED recovery instead auto-commits an existing unsynced Event and deletes recovery evidence.

## Commands and Evidence
| Command/procedure | CWD | Exit | Duration | Status | Observed output/result |
|---|---|---:|---:|---|---|
| `node --version && uname -srmo && findmnt -T . -o TARGET,SOURCE,FSTYPE,OPTIONS && node --check src/lifecycle/phase1/index.mjs && node --check tests/lifecycle/phase1/lifecycle-store.test.mjs && node --test tests/lifecycle/phase1/lifecycle-store.test.mjs && test ! -e .lifecycle-phase1-fixtures` | project root | 0 | 5.151 s; test 862.541478 ms | EXECUTED / OBSERVED | Node v26.4.0; WSL2; `/dev/sdd ext4 rw`; syntax checks passed; 15 pass / 0 fail; all fixture diagnostics `ext4 /dev/sdd`; `fixture-base-absent`. |
| Temporary-fixture crash-boundary probe: construct `APPLIED` journal, append valid pending Event bytes without log-file or directory sync, invoke a fresh `recover()` | project root | 0 | 4.200 s | EXECUTED / OBSERVED | `UNSYNCED_EXISTING_EVENT_RECOVERY journal_exists=false revision=2`; `fixture-base-absent`. |

The probe generated only a same-filesystem temporary fixture, removed it in `finally`, and did not modify production source, tests, schema, existing artifacts, or persistent fixtures.

## IC4-01 Results
- Pre-append integrity: OBSERVED. `transition()` obtains the prior checksum; `recover()` and durable append invoke `verifyLogIntegrity()`.
- Append order: OBSERVED. `appendEventIfMissing()` opens append mode, writes, calls `durability.syncFile(logPath)`, then `syncDirectory(dir)`.
- Re-read and normal commit: OBSERVED. Normal test passed and source re-reads exact parsed `transition_id`, Event checksum, checksum chain, and resulting revision before `VERIFIED`, then `COMMITTED`.
- Event file-sync failure: PASS. Injected `EPERM` produced explicit `DURABILITY_SYNC_FAILED`, revision 2, `RECOVERY_REQUIRED`, retained Journal/Lease/event temporary evidence, at most one Event, and `COMMIT_STATE_UNKNOWN` on recovery.
- Event directory-sync failure: PASS with the same asserted Safe Stop properties.
- Sync-unconfirmed existing-event recovery: FAIL. The independent probe's existing Event was valid but had no sync acknowledgement. `recover()` did not re-append it, but deleted the Journal (`journal_exists=false`) and retained revision 2. This is inferred commit, not `RECOVERY_REQUIRED`.
- Evidence preservation for uncertain canonicality: FAIL. The same path deletes Journal and Lease instead of retaining Snapshot/Event/Journal/Lease evidence and stopping no-write.
- Normal `PREPARED → APPLIED → VERIFIED → COMMITTED`, checksum/snapshot-log consistency, and Lease/candidate cleanup: OBSERVED in the normal ext4 test.

## D-01–D-06 Regression
- D-01/D-02: PASS — same-phase rework, revision conflict, schema/actor/evidence identity, and fencing rejection.
- D-03: PASS — PREPARED crash recovery preserved original revision and released Lease.
- D-05: PASS within covered cases — APPLIED crash duplicate avoidance, tampered Journal Safe Stop, and five pre-Snapshot durability injections.
- D-06: PASS within covered cases — append-only tamper and duplicate detection.
- Phase 1 total: 15 PASS / 0 FAIL. This does not supersede the independently reproduced recovery defect.

## Defect
### IC5-01 — APPLIED recovery auto-commits an Event with unconfirmed durability
- Severity: HIGH.
- Mechanism: `recover()` calls `appendEventIfMissing()` for APPLIED. A matching Event makes that method return before file/directory sync. Recovery then writes `VERIFIED` and removes Journal/Lease under its verified cleanup path.
- Impact: A crash after Event bytes reach page cache but before the durability acknowledgement can be converted into commit while the confirmation boundary is unknowable; forensic recovery evidence is deleted.
- Required correction: persist a durable acknowledgement sufficient to prove Event append before APPLIED recovery may advance. If Event existence is known but sync confirmation is not, retain all Snapshot/Event/Journal/Lease/candidate evidence, remain `RECOVERY_REQUIRED`, write no repair/append/cleanup, and return `COMMIT_STATE_UNKNOWN`. Add this exact write-before-sync crash-boundary test.

## Residual Risk and Conclusion
- Separate residual risk: physical power-loss durability beyond successful fsync on WSL2/ext4 is not established by unit testing.
- Critical: 0. High: 1 (`IC5-01`).
- PASS-class requirements are unmet because IC4-01 recovery behavior must be safe and Critical/High must be zero.
- Recommended next role: Builder (advisory only; no Role started).
- Recommended next artifact: new authorized Builder implementation-fix artifact.
- Gate Readiness: `NOT_READY`.
- Owner Approval Required: `YES`.