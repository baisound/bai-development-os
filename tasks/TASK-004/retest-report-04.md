# Retest Report 04 — Fix Cycle 4 Durability Sync Safe Stop

## Document Control

- Authoring Role: Tester
- Active Project: `/home/baisound/projects/javascript-roulette`
- Active Task: `TASK-004`
- Phase: `TESTER_VALIDATION` (Fix Cycle 4 Retest)
- Objective: `syncFile()`／`syncDirectory()` の同期失敗が明示的な Safe Stop となり、Canonical Snapshot を誤って確定しないことを、Builder の主張とは独立に検証する。

## Scope / Object

- Runtime: `src/lifecycle/phase1/index.mjs`
- Test: `tests/lifecycle/phase1/lifecycle-store.test.mjs`
- 対象: D-01〜D-06、特に `syncFile` の `EPERM`／`EINVAL`、および `syncDirectory` の `EPERM`／`EINVAL`／`EISDIR` 時の durability Safe Stop。
- 対象外: 実電源断による device persistence barrier、ext4/WSL2 以外の filesystem、Phase 2〜6。

## Evidence Reviewed

- `/home/baisound/projects/ai-team/roles/README-Tester.md`
- `/home/baisound/projects/ai-team/common/README-Common.md`
- `/home/baisound/projects/ai-team/common/Vocabulary-Specification.md`
- `/home/baisound/projects/ai-team/common/Authority-Specification.md`
- `/home/baisound/projects/ai-team/common/Evidence-Specification.md`
- `/home/baisound/projects/ai-team/common/Artifact-Specification.md`
- `/home/baisound/projects/ai-team/common/Workflow-Specification.md`
- `/home/baisound/AGENTS.md`
- `/home/baisound/projects/javascript-roulette/PROJECT.md`
- `docs/ai-team/tasks/TASK-004/task.md`
- `docs/ai-team/tasks/TASK-004/final-plan.md`（filesystem protocol、D-01〜D-04 関連節）
- `docs/ai-team/tasks/TASK-004/final-plan-amendment-d05-d06.md`
- `docs/ai-team/tasks/TASK-004/final-plan-consistency-check-amendment-d05-d06.md`
- `docs/ai-team/tasks/TASK-004/implementation-fix-report.md`（Builder input。独立証拠としては扱わない）
- `src/lifecycle/phase1/index.mjs`
- `tests/lifecycle/phase1/lifecycle-store.test.mjs`

## Role Activation Record

- Active Role: `Tester`
- Foundation Root: `/home/baisound/projects/ai-team`
- Project Root: `/home/baisound/projects/javascript-roulette`
- Project AI Team Root: `/home/baisound/projects/javascript-roulette/docs/ai-team`
- Role Specification: `/home/baisound/projects/ai-team/roles/README-Tester.md`
- Role Specification SHA-256: `a8069da59e25512b2d05105ba1fcce83f9a55c23ca42cc5979eb2ed9840917b5`
- Evidence Specification: `/home/baisound/projects/ai-team/common/Evidence-Specification.md`
- Evidence Specification SHA-256: `a81b65133bc45ca7e044e7484229f2b1731be85c25508b425852e23fed4759c6`
- Allowed modification file: `docs/ai-team/tasks/TASK-004/retest-report-04.md` のみ。
- Role Activation Result: `READY`

## Environment

- Working directory: `/home/baisound/projects/javascript-roulette`
- Node: `v26.4.0`
- OS: `Linux PC-BAIS 6.18.33.2-microsoft-standard-WSL2 x86_64`
- Project filesystem command: `findmnt -T . -o TARGET,SOURCE,FSTYPE,OPTIONS`
- Observed output: `/`, `/dev/sdd`, `ext4`, `rw,relatime,discard,errors=remount-ro,data=ordered`
- Fixture mechanism: `createFixture()` creates `${PROJECT_ROOT}/.lifecycle-phase1-fixtures/fixture-*`; each test executes `findmnt -T <fixture> -no FSTYPE,SOURCE` and asserts `ext4`, rejecting `/mnt/` and `tmpfs`.

## Commands and Observed Output

| Command | Exit | Execution Status | Observation Status | Observed output |
|---|---:|---|---|---|
| `findmnt -T . -o TARGET,SOURCE,FSTYPE,OPTIONS` | 0 | `EXECUTED` | `OBSERVED` | `/dev/sdd`, `ext4`, `rw,relatime,discard,errors=remount-ro,data=ordered` |
| `node --version; uname -a; findmnt -T . -no FSTYPE,SOURCE,OPTIONS` | 0 | `EXECUTED` | `OBSERVED` | `v26.4.0`; WSL2 Linux; `ext4 /dev/sdd rw,relatime,discard,errors=remount-ro,data=ordered` |
| `node --check src/lifecycle/phase1/index.mjs` | 0 | `EXECUTED` | `OBSERVED` | 出力なし |
| `node --check tests/lifecycle/phase1/lifecycle-store.test.mjs` | 0 | `EXECUTED` | `OBSERVED` | 出力なし |
| `node --test tests/lifecycle/phase1/lifecycle-store.test.mjs` | 0 | `EXECUTED` | `OBSERVED` | `tests 13`, `pass 13`, `fail 0`, `duration_ms 806.856789`。全 fixture の diagnostic は `ext4 /dev/sdd`。 |
| fixture cleanup probe | 0 | `EXECUTED` | `OBSERVED` | `.lifecycle-phase1-fixtures` は不在（`fixture-base-absent`）。 |

`tests/lifecycle/phase1/` に存在する `*.test.mjs` は `lifecycle-store.test.mjs` の1ファイルのみであることを確認した。従って上記 `node --test` は検出可能な全 Phase 1 テストを実行した。

## Verification Findings

### Fixture filesystem

- Result: `PASS`
- `findmnt` により repository と fixture が `/dev/sdd` の `ext4` であることを観測した。
- test output の13個すべての fixture diagnostic が `ext4 /dev/sdd` だった。
- rw mount options を project root で観測した。test helper は Windows mount と tmpfs を明示的に拒否する。

### `syncFile()` failure Safe Stop

- Result: `PASS`
- `syncFile EPERM` と `syncFile EINVAL` の2テストが PASS。
- 実測したテスト assertion は、`DURABILITY_SYNC_FAILED`、revision `1`、byte-identical Snapshot、Lease 不在、空の candidate transaction directory、`ABORTED` journal と failure code、`VERIFICATION_FAILED` event、`COMMITTED` event 不在である。
- よって過去の `EPERM`／`EINVAL` 握りつぶしが成功として扱われる挙動は、この注入経路では観測されなかった。

### `syncDirectory()` failure Safe Stop

- Result: `PASS`
- `syncDirectory EPERM`、`syncDirectory EINVAL`、`syncDirectory EISDIR` の3テストが PASS。
- 各テストは `syncFile` failure と同じ Safe Stop 不変条件（明示的 `DURABILITY_SYNC_FAILED`、Snapshot/revision 不変、Lease cleanup、`ABORTED` journal、failure event、candidate cleanup、`COMMITTED` 不在）を assertion している。
- よって過去の `EPERM`／`EINVAL`／`EISDIR` 握りつぶしが成功として扱われる挙動は、この注入経路では観測されなかった。

### Normal ext4 transition

- Result: `PASS`
- `authorized ext4 normal transition still commits` が PASS。
- ext4 fixture 上で正常遷移の resulting revision `2` と非空の `last_transition_id` を assertion している。

### D-01〜D-06 regression

| Design area | Independent observed test result |
|---|---|
| D-01 | same-phase rework commit と revision conflict rejection: PASS |
| D-02 | tampered fencing token rejection、COMMITTED event 不在: PASS |
| D-03 | PREPARED crash recovery、original revision と Lease release: PASS |
| D-04 | invalid actor/schema/evidence/task identity rejection: PASS |
| D-05 | APPLIED crash recovery、tampered APPLIED journal Safe Stop、5 durability failure injections: PASS |
| D-06 | append-only log tampering と duplicate transition detection: PASS |

## Fixture Cleanup

- Execution Status: `EXECUTED`
- Observation Status: `OBSERVED`
- 各 fixture は test の `t.after` で root と fixture base を再帰削除する実装である。
- テスト完了後の probe で fixture base が不在であることを観測した。永続 fixture は残存していない。

## Protected-file Compliance

- Tester が変更した永続ファイルは本 artifact のみ。
- production source、tests、package/lock/config、Builder/Critic/Judge/Policy artifacts、Foundation、既存 evidence は変更していない。
- `git status --short -- src/lifecycle/phase1 tests/lifecycle/phase1 docs/ai-team/tasks/TASK-004/retest-report-04.md` は `src/lifecycle/phase1/` と `tests/lifecycle/phase1/` を既存の未追跡として表示した。これらは Owner が保持を明示決定した対象であり、削除・初期化・変更は行っていない。
- commit / push は実行していない。

## Residual Risks

- 実電源断で device persistence barrier に到達する前の durability は、今回の unit test では立証できない。
- 検証結果は WSL2 Linux、同一 `/dev/sdd` ext4、rw mount に限定される。tmpfs、Windows mount、または異なる filesystem には適用しない。
- failure injection はテストに注入した `syncFile`／`syncDirectory` 例外を対象とし、実デバイス障害を再現したものではない。

## Unresolved Items

- 新規の Critical または High finding は観測されなかった。
- 上記 residual risks の解消には、本 scope 外の環境・電源断検証または別途承認された手順が必要である。

## Known Limitations

- 本 artifact は Tester の技術検証記録であり、implementation completion、Closure、Archive、または最終承認を決定しない。

## Result

`PASS`

## Advisory Handoff

- 推奨 Next Role: Orchestrator（推薦のみ。Tester は起動・routing を行わない。）
- 本 retest と residual risks を、後続の独立 review / judgment で評価することを推奨する。
