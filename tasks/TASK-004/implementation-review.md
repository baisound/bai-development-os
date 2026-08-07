# Implementation Review — Fix Cycle 4 Durability Sync Safe Stop

## Document Control

- **Authoring Role**: Critic
- **Active Project**: `/home/baisound/projects/javascript-roulette`
- **Active Task**: `TASK-004`
- **Phase**: `IMPLEMENTATION_REVIEW`（Fix Cycle 4後）
- **Objective / Scope**: `syncFile()` の `EPERM` / `EINVAL` および `syncDirectory()` の `EPERM` / `EINVAL` / `EISDIR` を成功として扱う処理が除去されたこと、ならびに D-05/D-06 の durability、Safe Stop、append-only、recovery 要件への実装適合性を、実装と有限な独立実行結果から評価する。Builder/Tester の結論は独立根拠として用いない。

## Role Activation

- **Foundation Root**: `/home/baisound/projects/ai-team`
- **Project Root**: `/home/baisound/projects/javascript-roulette`
- **Project AI Team Root**: `/home/baisound/projects/javascript-roulette/docs/ai-team`
- **Role Specification**: `/home/baisound/projects/ai-team/roles/README-Critic.md`
- **Role Specification SHA-256**: `610d3e652e437c3c14ec4bb12c0aef749893af27c70b1202ec62ee88e780e1b0`
- **Evidence Specification**: `/home/baisound/projects/ai-team/common/Evidence-Specification.md`
- **Evidence Specification SHA-256**: `a81b65133bc45ca7e044e7484229f2b1731be85c25508b425852e23fed4759c6`
- **Allowed modification**: `docs/ai-team/tasks/TASK-004/implementation-review.md` の作成のみ。
- **Prohibited modifications**: production source、tests、package/config、Builder/Tester/Judge/Policy artifacts、既存 Evidence、Foundation、および上記以外の全ファイル。未追跡の `src/lifecycle/phase1/**` と `tests/lifecycle/phase1/**` は Owner 承認済み既存 Phase 1 実装として保持し、変更・削除・初期化しない。
- **Artifact path**: `docs/ai-team/tasks/TASK-004/implementation-review.md`
- **Role Activation Result**: `READY`。指定された Foundation Role/Common、`AGENTS.md`、`PROJECT.md`、`task.md`、Final Plan と D-05/D-06 Amendment、Consistency Check、Fix Report、Retest 03/04、対象 source/test はすべて可読だった。

## Evidence Reviewed

- `/home/baisound/AGENTS.md`
- `/home/baisound/projects/ai-team/roles/README-Critic.md`
- `/home/baisound/projects/ai-team/common/README-Common.md`
- `/home/baisound/projects/ai-team/common/Vocabulary-Specification.md`
- `/home/baisound/projects/ai-team/common/Authority-Specification.md`
- `/home/baisound/projects/ai-team/common/Evidence-Specification.md`
- `/home/baisound/projects/ai-team/common/Artifact-Specification.md`
- `/home/baisound/projects/ai-team/common/Workflow-Specification.md`
- `/home/baisound/projects/javascript-roulette/PROJECT.md`
- `docs/ai-team/tasks/TASK-004/task.md`
- `docs/ai-team/tasks/TASK-004/final-plan.md`（特に Physical persistence and crash recovery、Error Model、Test Requirements）
- `docs/ai-team/tasks/TASK-004/final-plan-amendment-d05-d06.md`
- `docs/ai-team/tasks/TASK-004/final-plan-consistency-check-amendment-d05-d06.md`
- `docs/ai-team/tasks/TASK-004/implementation-fix-report.md`（Builder の主張であり、独立根拠にはしない）
- `docs/ai-team/tasks/TASK-004/retest-report-03.md`（Tester の主張であり、独立根拠にはしない）
- `docs/ai-team/tasks/TASK-004/retest-report-04.md`（今回の Review 実施許可の根拠。技術的結論の独立根拠にはしない）
- `src/lifecycle/phase1/index.mjs`
- `tests/lifecycle/phase1/lifecycle-store.test.mjs`

## Commands and Procedures

| Procedure / Command | Working directory | Exit | Observed result | Result |
|---|---|---:|---|---|
| Source/test/approved-plan の静的読解 | `/home/baisound/projects/javascript-roulette` | N/A | `syncFile` / `syncDirectory` は例外を `DURABILITY_SYNC_FAILED` に正規化し、旧来の errno 成功フォールバックは存在しない。一方、COMMITTED Event の log append は `writeFile` のみで durability sync を呼ばない。 | `OBSERVED` |
| `sha256sum /home/baisound/projects/ai-team/roles/README-Critic.md /home/baisound/projects/ai-team/common/Evidence-Specification.md && node --check src/lifecycle/phase1/index.mjs && node --check tests/lifecycle/phase1/lifecycle-store.test.mjs && findmnt -T . -o TARGET,SOURCE,FSTYPE,OPTIONS && node --test tests/lifecycle/phase1/lifecycle-store.test.mjs` | `/home/baisound/projects/javascript-roulette` | 0 | Role/Evidence SHA は Role Activation 記載値。構文検査は両方成功。project root は `/dev/sdd` の `ext4`、`rw`。13 tests pass / 0 fail。各 fixture diagnostic は `ext4 /dev/sdd`。 | `EXECUTED` / `OBSERVED` |
| `test ! -e .lifecycle-phase1-fixtures` | `/home/baisound/projects/javascript-roulette` | 0 | `fixture-base-absent`。テスト後の fixture base 残存なし。 | `EXECUTED` / `OBSERVED` |

実行したテストは一時 fixture を生成するが、上記 cleanup probe で永続 fixture が残存しないことを確認した。commit / push は実行していない。

## Findings

### IC4-01 — COMMITTED Event の永続化が fsync されない

- **Severity**: HIGH
- **Evidence**:
  - `final-plan.md` の Physical persistence and crash recovery は、COMMIT で Event を「append+fsync」し、その後 Journal を永続化する順序を要求する。
  - `final-plan-amendment-d05-d06.md` は、Snapshot/Event の整合を確認した `VERIFIED` の後にのみ `COMMITTED` を許し、D-06 で append-only log の checksum chain を要求する。
  - `src/lifecycle/phase1/index.mjs` の `appendEventIfMissing()` は `writeFile(this.logPath, ...)` を実行するだけで、log file または log directory に対する `syncFile` / `syncDirectory` を呼ばない。続く `transition()` は、メモリ上で読める Event を確認しただけで Journal を `VERIFIED`、次に `COMMITTED` とし、Journal/Lease を削除する。
  - 独立実行の 13 tests は PASS だが、`syncFile` 注入は call 3、`syncDirectory` 注入は call 2 に固定され、いずれも Snapshot rename より前の失敗を検査する。Event append の durability sync が存在しないため、Event append 後の fsync failure を注入・検証できない。
- **Impact**: Event write が OS page cache で成功に見えた後、媒体永続化前に process/host failure が起きると、Snapshot は新 revision、Journal は既に削除、Log には COMMITTED Event がない状態になり得る。この状態では D-05 の Snapshot/Journal/Lease safe recovery と D-06 の append-only audit chain がともに保証されず、次回の検証で `COMMIT_STATE_UNKNOWN` になっても、Commit 時点で成功を返した不整合を回復できない。
- **Required Correction**:
  1. Event append を append-only の file-handle 操作で実装し、Event bytes の `FileHandle.sync()` と対象 directory sync を完了してから Journal を `VERIFIED` / `COMMITTED` に進める。
  2. append、file sync、directory sync、Journal stage sync のいずれかが失敗した場合、Snapshot rename 前なら `ABORTED`、rename 後なら `RECOVERY_REQUIRED` とし、Lease、candidate、Journal の処理を Amendment の Crash Recovery Matrix に従わせる。失敗した cleanup 自体は成功と見なさず No-write Safe Stop を維持する。
  3. `appendEventIfMissing()` の string `includes` 判定を、parse 済み Event の厳密な `transition_id` 比較に置換する。任意の reason/evidence text に同じ文字列が存在しても Event を見落とさないようにする。
- **Validation**:
  - Event append の file sync、append 後 directory sync、Journal `VERIFIED` / `COMMITTED` sync の各点で `EPERM` と `EINVAL` を注入する negative tests を追加する。
  - 各 test で、Snapshot/revision、Journal stage、Lease、candidate、COMMITTED Event 不在、failure Event、再起動 recovery の no-write Safe Stop を確認する。
  - 既存 Event 内の非 `transition_id` field に次 request の ID を含め、対象 COMMITTED Event が必ず 1 件 append される test を追加する。
- **Status**: `UNRESOLVED`

### IC4-02 — 旧 errno の握りつぶしは対象経路から除去され、pre-rename Safe Stop は確認できた

- **Severity**: LOW
- **Evidence**:
  - `src/lifecycle/phase1/index.mjs` の `writeDurable()` と `syncDirectory()` は任意の下位同期例外を `DURABILITY_SYNC_FAILED` として送出する。`EPERM` / `EINVAL` / `EISDIR` を成功として return する分岐は読解対象にない。
  - 独立実行の five injected tests（syncFile: `EPERM`, `EINVAL`; syncDirectory: `EPERM`, `EINVAL`, `EISDIR`）は全て PASS。各 test は revision=1、byte-identical Snapshot、Lease 不在、空 candidate directory、`ABORTED` journal、`DURABILITY_SYNC_FAILED` failure Event、COMMITTED Event 不在を assertion する。
- **Impact**: 指定された pre-rename injection 経路では durability 失敗を成功として扱わず、Canonical Snapshot/revision の誤確定を防ぐ。
- **Required Correction**: なし。ただし IC4-01 の補正により post-append/post-rename の全 durability point を同じ不変条件で検証すること。
- **Validation**: IC4-01 の追加 negative tests と全 Phase 1 regression。
- **Status**: `RESOLVED`（限定された pre-rename injection scope のみ）

## Confirmed

- Role activation に必要な指定 Evidence は可読で、Critic artifact 作成の scope は確認できた。
- Fixture は project root と同じ `/dev/sdd` / `ext4` の rw filesystem で生成され、実行後に fixture base は残存しなかった。
- 指定された五つの injected errno は現在の試験対象位置では `DURABILITY_SYNC_FAILED` Safe Stop となり、`VERIFIED` / `COMMITTED` へ進まない。
- D-01〜D-06 の既存 13 test ケースは本レビューの独立実行で PASS した。

## Unconfirmed

- 実デバイス障害、device persistence barrier 前の電源断、および ext4/WSL2 以外の filesystem における durability は本レビューでは証明していない。
- COMMITTED Event append 後の file/directory sync failure は実装に sync point がなく、negative test でも観測されていない。

## Unresolved Items

- **IC4-01 (HIGH)**: COMMITTED Event の append+fsync と、その失敗時の D-05/D-06 準拠 Safe Stop/recovery が未実装・未検証。

## Known Limitations

- 本レビューは Owner が許可した既存未追跡 Phase 1 source/test を読み取り、有限 command を実行しただけであり、source、tests、config、既存 Evidence、Foundation を変更していない。
- テストの PASS は pre-rename injection と ext4 fixture 上の挙動を示すが、IC4-01 の実装不在を相殺しない。
- Critic は実装認可、最終承認、次 Role の起動、Closure/Archive 判断を行わない。

## Result

`REVISION_REQUIRED`

HIGH finding が 1 件未解決であるため、Result を `PASS` としない。

## Advisory Handoff

IC4-01 の修正には、承認済みの bounded implementation scope に基づく Builder の対応と、event append 後を含む独立 Retest が必要である。この記載は advisory であり、Role routing または実装 authorization を構成しない。
