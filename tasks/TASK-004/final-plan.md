# Final Plan

## Metadata

- Authoring Role: Builder
- Active Project: `/home/baisound/projects/javascript-roulette`
- Active Task: `TASK-004`
- Phase: Phase 1 — Canonical State Foundation / FINAL_PLAN
- Created At: 2026-07-27
- Judge Result: `APPROVED_WITH_CONDITIONS`
- Implementation Authorization: `NOT_AUTHORIZED`

## Objective

Phase 1のCanonical Implementation Specification候補として、Taskの現在状態を唯一の正本として安全に更新する5状態軸、Snapshot、append-only Log、Revision、Lease、原子的更新、失敗・競合復旧を実装可能な粒度で確定する。Judge Binding Corrections 1〜6およびF-01〜F-03をすべて統合する。

## Evidence Reviewed

- `/home/baisound/AGENTS.md`
- `/home/baisound/projects/javascript-roulette/PROJECT.md`
- `docs/ai-team/tasks/TASK-004/task.md`
- `docs/ai-team/tasks/TASK-004/builder-proposal.md`
- `docs/ai-team/tasks/TASK-004/critic-review.md`
- `docs/ai-team/tasks/TASK-004/builder-response.md`
- `docs/ai-team/tasks/TASK-004/architecture-review.md`
- `docs/ai-team/tasks/TASK-004/judge-decision.md`
- `docs/ai-team/roles/README-Builder.md`
- `docs/ai-team/templates/final-plan.template.md`
- `docs/ai-team/common/README-Common.md`
- `docs/ai-team/common/Workflow-Specification.md`
- `docs/ai-team/common/Authority-Specification.md`
- `docs/ai-team/common/Evidence-Specification.md`
- `docs/ai-team/common/Artifact-Specification.md`
- `docs/ai-team/common/Vocabulary-Specification.md`

実装環境Evidence（2026-07-27、project rootで観測）: `node --version` は `v24.18.0`、`python3 --version` は `Python 3.12.3`、OSは `Linux 6.18.33.2-microsoft-standard-WSL2 x86_64`。本Planのfilesystem protocolは、このNode/WSL2/Linux環境に限定する。

## Approved Design Baseline

- Canonical Status RecordがTask現在値の唯一の正本、Transition Logが変更試行のappend-only監査履歴である。
- `task_status`、`current_phase`、`gate_status`、`authorization_status`、`archive_status`は直交する。Gate PASSはAuthorizationを代替しない。
- Lifecycle Managerは原子的更新を担うSystem Componentであり、Canonical 6 Roleを増やさない。
- Registryは将来の索引であり、Status Record、Log、Knowledge Assetの正本ではない。
- VERIFY失敗、競合、Evidence不足、権限不足、Commit不明は旧正本を保持してSafe Stopする。

## Scope and Implementation Boundary

### 今回実装するもの

1. 5状態軸のenumとSchema validation。
2. Canonical Status Record、Transition Request、Transition Event、Authorization／Actor／Evidence／Lease／Migration MappingのSchema。
3. Task Status Matrix、Current Phase Matrix、Rework Matrix、undefined transition reject。
4. Revision、expected revision、fencing token、短時間Lease、checksum、Transaction Journal。
5. `PREPARE → AUTHORIZE → ACQUIRE_LEASE → APPLY → VERIFY → COMMIT → RELEASE_LEASE`とCrash Recovery。
6. Phase 1のunit／integration test、およびlegacy mappingの参照専用検証。

### 今回実装しないもの

- Phase 2のPause／Block／Stall復旧、Resume、Checkpoint、Rollback運用。
- Phase 3のContext、Phase 4のCost／Model、Phase 5のClosure／Archive実行・Migration実行、Phase 6のSystem File同期。
- TASK-005のKnowledge Asset、Graph、Resolution、Pack、Governance。
- TASK-006のWorkspace Registry、Automation、Routing、`run_id`生成。
- README、Common、Role、Template、Architecture文書の更新。

`archive_status`はenum・整合性のみをPhase 1で扱う。`READY`、`DEFERRED`、`ARCHIVED`への業務遷移とArchive実行は拒否する。

## Canonical State Model

| Field | Exact values | 日本語の意味 |
|---|---|---|
| `task_status` | `DRAFT`, `ACTIVE`, `PAUSED`, `BLOCKED`, `STALLED`, `COMPLETED`, `CANCELLED`, `REJECTED`, `ARCHIVED` | Taskの生存・進行可能性。Phase 2／5対象値もenum整合性のため保持する。 |
| `current_phase` | `TASK_DEFINITION`, `DESIGN`, `FINAL_PLAN`, `IMPLEMENTATION_AUTHORIZATION`, `IMPLEMENTATION`, `TESTING`, `IMPLEMENTATION_REVIEW`, `FINAL_JUDGMENT`, `POLICY_REVIEW`, `CLOSURE`, `ARCHIVE` | 現在の工程。 |
| `gate_status` | `NOT_EVALUATED`, `READY`, `NOT_READY`, `PASS`, `FAIL`, `NOT_CONFIRMED`, `BLOCKED` | 次工程条件のEvidence評価。 |
| `authorization_status` | `NOT_REQUIRED`, `PENDING`, `AUTHORIZED`, `DENIED`, `EXPIRED`, `REVOKED` | 対象操作の認可状態。 |
| `archive_status` | `NOT_ELIGIBLE`, `REVIEW_PENDING`, `READY`, `DEFERRED`, `ARCHIVED` | Archive判定の独立軸。Phase 1では`NOT_ELIGIBLE`のみが業務上の有効値。 |

不変条件: 終端の`COMPLETED`、`CANCELLED`、`REJECTED`、`ARCHIVED`は同Task IDで`ACTIVE`または実行Phaseへ戻れない。後続作業は新Task IDで行う。`task_status=BLOCKED`なら`blocking_items`は1件以上、`archive_status=ARCHIVED`なら`task_status=ARCHIVED`でなければならない。

## Data Schemas

すべての時刻はRFC 3339 UTC、IDはUUID v4または既存Task ID、checksumは`sha256:`＋64桁小文字hexとする。必須は「fieldが存在する」こと、nullableは`null`を明示可能であることを表す。

### Canonical Status Record

| English name | 型 | 必須 / nullable | 制約・日本語説明 | 例 |
|---|---|---|---|---|
| `record_schema_version` | string | 必須 / 非null | 固定`1.1.0`。F-03統合版。 | `"1.1.0"` |
| `task_id`, `project_id` | string | 必須 / 非null | Task IDは`^TASK-[0-9]{3,}$`、Project IDはActive Projectと一致し不変。 | `"TASK-004"` |
| `record_revision` | integer | 必須 / 非null | 1以上、Commit成功ごとに1だけ増加。 | `8` |
| 5状態軸 | enum | 必須 / 非null | 上表の各enumだけを受理。 | `"ACTIVE"` |
| `status_reason` | string | 必須 / 非null | 1〜2000文字、Reason CodeとEvidenceに対応。 | `"Final Plan consistency check requested."` |
| `entered_at`, `updated_at`, `last_verified_at` | RFC 3339 string | 必須 / 非null | `updated_at >= entered_at`。 | `"2026-07-27T07:00:00Z"` |
| `requested_by`, `authorized_by`, `applied_by` | Actor Identity | 必須 / 非null | F-03。要求、認可、機械的適用を分離する。 | 下記参照 |
| `authorization_reference` | Authorization Reference | 必須 / 非null | `NOT_REQUIRED`でも適用規則を記録。 | 下記参照 |
| `authoritative_evidence` | Evidence Reference[] | 必須 / 非null | 状態変更Commitは空配列不可。 | `[{...}]` |
| `blocking_items` | object[] | 必須 / 非null | default `[]`。BLOCKED時は非空。 | `[]` |
| `next_eligible_phases` | current_phase[] | 必須 / 非null | Matrixで許可された候補の部分集合。 | `["FINAL_PLAN"]` |
| `verification_result` | `PASS`\|`FAIL`\|`NOT_CONFIRMED` | 必須 / 非null | 未観測をPASSにしない。 | `"PASS"` |
| `last_transition_id` | UUID | 必須 / 非null | 最新のCOMMITTED Eventへ参照。 | `"..."` |
| `content_checksum` | string | 必須 / 非null | 本fieldを除くcanonical JSONのSHA-256。 | `"sha256:..."` |

### Transition Request

`TransitionRequest`は正本ではない候補である。`request_id` (UUID)、`task_id` (string)、`expected_revision` (integer >=1)、`from`／`to` (5状態軸object)、`reason_code` (Error/Reason code)、`reason` (string)、`requested_by` (Actor Identity)、`authorization_reference`、`evidence[]`、`created_at`を必須・非nullとする。例: `{"expected_revision":8,"from":{"current_phase":"TESTING"},"to":{"current_phase":"IMPLEMENTATION"},"reason_code":"REWORK_TEST_FAILURE"}`。

### Transition Event

`TransitionEvent`はJSONLの1行であり、`event_schema_version="1.1.0"`、`transition_id`、`task_id`、`expected_revision`、`resulting_revision`（`COMMITTED`時のみinteger、他はnull）、`from`、`to`、`outcome`（`COMMITTED`／`REJECTED`／`VERIFICATION_FAILED`／`RECOVERED`）、`reason_code`、`reason`、3 Actor Identity、Authorization Reference、Evidence Reference[]、`lease_id`（非Commitでnull可）、`fencing_token`（非Commitでnull可）、`created_at`、`verified_at`（null可）、`previous_entry_checksum`、`entry_checksum`を持つ。既存行の編集・削除・順序変更は禁止する。

### Authorization Reference

`authorization_id` (string、必須)、`authority_type` (`RULE`／`JUDGE`／`OWNER`、必須)、`authority_path` (string、必須)、`authority_checksum` (checksum、必須)、`decision` (string、必須)、`effective_at` (RFC 3339、必須)、`expires_at` (RFC 3339|null、必須field)を持つ。`authorization_status=NOT_REQUIRED`では`authorization_id="SYSTEM_RULE"`、`authority_type="RULE"`、適用したRule path/checksumを記録する。`AUTHORIZED`はscope pathと期限が明示されたEvidenceを必要とする。

### Actor Identity

`actor_id` (string、必須・非null)、`actor_type` (`ROLE`／`SYSTEM_COMPONENT`／`OWNER`、必須・非null)、`role_id` (string|null、必須field)、`session_id` (string|null、必須field)、`run_id` (string|null、必須field)を持つ。`actor_type=ROLE`なら`role_id`は6 Core Roleのいずれか、`SYSTEM_COMPONENT`／`OWNER`なら`role_id=null`。`run_id`／`session_id`は監査参照であり、生成・認証・Routingを実装しない。

### Evidence Reference

`path` (project-relative string)、`checksum`、`authoring_role`、`result`、`observed_at`を必須・非nullとする。pathはActive Project外を参照できない。実装認可Evidenceはallowed-file scopeと期限を含む。

### Lease Record

`lease_id` (UUID)、`task_id`、`holder` (Actor Identity)、`bound_revision` (integer)、`fencing_token` (integer)、`acquired_at`、`expires_at`、`purpose="CANONICAL_STATE_COMMIT"`、`nonce` (128-bit random hex)を必須・非nullとする。timeoutは**60秒、延長なし**とする。fencing tokenはTaskごとの単調増加整数で、より小さいtokenのCommitを拒否する。

### Migration Mapping Record

`mapping_id`、`source_task_id`、`legacy_expression`、`mapped_state`（5状態軸）、`confidence` (`HIGH`／`MEDIUM`／`LOW`)、`source_evidence[]`、`mapped_by` (Actor Identity)、`created_at`、`checksum`を必須とする。`LOW`はCommitせず`gate_status=NOT_CONFIRMED`でOwner判断を必要とする。既存Artifactは読取・参照だけで変更しない。

## Exact File Plan

実装認可後のPhase 1だけで作成する予定のpath:

| 用途 | path |
|---|---|
| Shared JSON Schema | `docs/ai-team/lifecycle/phase1/schemas/canonical-status-record.schema.json` および関連schema |
| Prototype fixtures | `docs/ai-team/lifecycle/phase1/prototype/fixtures/` |
| Runtime source | `src/lifecycle/phase1/` |
| Runtime tests | `tests/lifecycle/phase1/` |
| Task canonical state | `docs/ai-team/lifecycle/phase1/tasks/<TASK-ID>/canonical-status.json` |
| Append-only log | `docs/ai-team/lifecycle/phase1/tasks/<TASK-ID>/transition-log.jsonl` |
| Transaction journal | `docs/ai-team/lifecycle/phase1/tasks/<TASK-ID>/transaction-journal.json` |
| Active lease | `docs/ai-team/lifecycle/phase1/tasks/<TASK-ID>/lease.json` |
| Migration records | `docs/ai-team/lifecycle/phase1/tasks/<TASK-ID>/migration-mapping.jsonl` |

Registry接続はPhase 1で実装しない。将来のRegistryが索引化できるよう、`task_id`、`project_id`、schema version、path、checksumを各正本に保持するだけとし、Registry file、event、lookup、writeは作成しない。

## Architecture and Data Flow

1. RoleまたはSystem ComponentがTransition Requestを作る。
2. Lifecycle Managerが現在Record、Log末尾、Journal、Leaseを読み、checksumとrevisionを検証する。
3. AUTHORIZEでEvidence、authority、scope、期限を照合する。承認待ちは`PENDING`を別Transactionで記録後、Leaseなしで待つ。
4. Commitに必要な短時間だけLeaseを取得し、候補Record/Event/Journalを生成する。
5. VERIFYでSchema、Matrix、Evidence、Actor、Authorization、revision、Lease、fencing token、checksumを再検証する。
6. COMMITはJournalを使いSnapshotとLogを整合させ、成功後にLeaseを解放する。

## Transition Rules

### Task Status Matrix

`DRAFT→ACTIVE/CANCELLED/REJECTED`、`ACTIVE→ACTIVE/CANCELLED/REJECTED`はPhase 1実装対象。`ACTIVE↔PAUSED/BLOCKED/STALLED`はenum validationのみでPhase 2まで業務遷移を拒否する。`ACTIVE→COMPLETED`、`COMPLETED→ARCHIVED`はPhase 5まで拒否する。終端状態は自己監査更新以外の遷移を拒否し、`→ACTIVE`は常に`TERMINAL_REOPEN_FORBIDDEN`で拒否する。

### Current Phase Matrix

通常前進は `TASK_DEFINITION→DESIGN→FINAL_PLAN→IMPLEMENTATION_AUTHORIZATION→IMPLEMENTATION→TESTING→IMPLEMENTATION_REVIEW→FINAL_JUDGMENT→POLICY_REVIEW→CLOSURE→ARCHIVE` の隣接edgeのみ許可する。各edgeは`task_status=ACTIVE`、必要Artifactが存在しchecksum一致、対応Gateが`PASS`、必要Authorizationが有効であることを要求する。Phase skipは`PHASE_SKIP_FORBIDDEN`で拒否する。

### F-01 Rework Matrix

| From → To | 判定 | 必須Evidence / Gate / Authorization | Reason Code / Commit前VERIFY |
|---|---|---|---|
| `DESIGN→DESIGN` | 許可 | Builder ResponseまたはJudge再設計要求、`FAIL`または`NOT_CONFIRMED`、追加認可不要 | `REWORK_DESIGN`; matrix、Evidence、revision、LeaseをVERIFY |
| `FINAL_PLAN→FINAL_PLAN` | 許可 | Consistency Checkの`FINAL_PLAN_REVISION_REQUIRED`、`FAIL`、追加認可不要 | `REWORK_FINAL_PLAN`; 同上 |
| `FINAL_PLAN→DESIGN` | 条件付き許可 | 承認済み設計変更を要するJudge `REVISION_REQUIRED`、再設計Scope、`FAIL`/`NOT_CONFIRMED` | `REDESIGN_REQUIRED`; Judge EvidenceとScopeをVERIFY |
| `IMPLEMENTATION_AUTHORIZATION→FINAL_PLAN` | 条件付き許可 | `DENIED`／`EXPIRED`／`REVOKED`またはPlan不足Evidence、`FAIL`/`NOT_CONFIRMED` | `AUTHORIZATION_PLAN_REWORK`; 実装開始EvidenceがないことをVERIFY |
| `TESTING→IMPLEMENTATION` | 条件付き許可 | Tester `FAIL`、`gate_status=FAIL`、有効`AUTHORIZED`とbounded repair scope | `REWORK_TEST_FAILURE`; Authorization期限・scopeをVERIFY |
| `IMPLEMENTATION_REVIEW→IMPLEMENTATION` | 条件付き許可 | Critic `REVISION_REQUIRED`、`FAIL`、有効`AUTHORIZED` | `REWORK_REVIEW_FINDING`; 同上 |
| `FINAL_JUDGMENT→IMPLEMENTATION` | 条件付き許可 | Judge `IMPLEMENTATION_FIX_REQUIRED`、`FAIL`、有効`AUTHORIZED` | `REWORK_JUDGE_FIX`; 同上 |
| `FINAL_JUDGMENT→IMPLEMENTATION_REVIEW` | 条件付き許可 | Judgeが追加Critic Reviewを明示、`NOT_CONFIRMED`、実装変更なし | `REVIEW_EVIDENCE_REQUIRED`; Judge EvidenceをVERIFY |
| `POLICY_REVIEW→POLICY_REVIEW` | 条件付き許可 | Policy VERIFY failure Evidence、`FAIL`、Policy update authority | `REWORK_POLICY_VERIFY`; Phase 5/6運用を実装しない |
| `POLICY_REVIEW→IMPLEMENTATION` | 条件付き許可 | Policy findingが実装修正を明示、`FAIL`、有効`AUTHORIZED` | `REWORK_POLICY_IMPLEMENTATION`; scopeをVERIFY |
| `CLOSURE→POLICY_REVIEW` または修正Phase | 条件付き許可 | Closure Evidenceが不足・失敗、`FAIL`/`NOT_CONFIRMED`、該当Phaseの権限 | `REWORK_CLOSURE_INPUT`; Closure運用自体はPhase 5 |

上記以外、EvidenceなしRework、終端Taskの実行Phase復帰は`UNDEFINED_TRANSITION`または`TERMINAL_REOPEN_FORBIDDEN`で拒否する。Reworkは`task_status`を暗黙変更しない。

## Concurrency, Lease, and Atomic Update

### F-02 Lease rules

Leaseは`ACQUIRE_LEASE`からCOMMIT成功または失敗時`RELEASE_LEASE`までの60秒以内の機械的Canonical更新だけに使う。人間承認待ち、長時間Builder作業、テスト、外部API待機、再試行待機、実装処理中はLeaseを取得・保持してはならない。期限切れ、holder不一致、revision不一致、fencing token不一致は候補を破棄し`LEASE_INVALID` Eventを追記する。

COMMIT直前に、Lease ID、holder、expiry、bound revision、fencing token、Record revision、expected revision、Record/Event checksum、Authorization期限、Evidence checksumを再読する。一つでも不一致ならCommitせず旧Recordを保持する。

### Physical persistence and crash recovery

保存形式は**canonical JSON UTF-8**、Snapshotは整列key・無空白・末尾LFなし、Logは同じcanonical JSONの1行＋LFとする。checksum対象はJSON objectからchecksum fieldを除いたbytesである。

Node `v24.18.0` on Linuxで、同一Task directory内の`fs.open(path, "wx")`（Lease作成）、`FileHandle.sync()`、同一filesystem内の`fs.rename()`、directory `fsync`を使う。Journalを先に永続化するため、SnapshotとLogが単一renameで同時に置換できない問題をRecovery可能にする。

| Stage | 永続化処理 |
|---|---|
| PREPARE | Record/Log末尾を読み、checksum・expected revisionを確認。 |
| AUTHORIZE | Authorization ReferenceとEvidenceを検証。待機ならLeaseなしで`PENDING`をCommit。 |
| ACQUIRE_LEASE | `lease.json`を`wx`で作成しfsync。tokenは前回より大きい値。 |
| APPLY | 新Snapshot tempとEvent tempを同一directoryにwrite+fsync。`transaction-journal.json`を`PREPARED`としてwrite+fsync。 |
| VERIFY | 全Schema、Matrix、Actor、Authorization、Lease、fencing、checksum、temp bytesを再検証。 |
| COMMIT | Snapshot tempをrename+directory fsync、Journalを`SNAPSHOT_RENAMED`へfsync、Eventが未存在ならappend+fsync、Journalを`LOG_APPENDED`へfsync、両方を再読して`COMMITTED`へfsync。 |
| RELEASE_LEASE | Leaseをunlink+directory fsync後、Journalを削除+directory fsync。 |

Recoveryは起動前にJournalを検査する。`PREPARED`はtempを削除、`SNAPSHOT_RENAMED`は同じ`transition_id`のLog Event有無を確認して欠ける場合だけappend、`LOG_APPENDED`はSnapshot/Event checksumとrevisionを再検証してJournalを清掃する。いずれも不一致・Commit状態不明なら書込みを停止し`COMMIT_STATE_UNKNOWN`としてSafe Stopする。未確認primitiveに依存しないため、Node/OS環境が上記を満たさない場合は実装を開始しない。

## Validation Procedure and Error Model

VERIFYはSchema、ID境界、全enum、Record revision、expected revision、Matrix、Reason Code、Evidence path/checksum、Authorization、Actor整合、Lease/fencing、SnapshotとCOMMITTED Eventの3 Actor一致、canonical checksum、Journal状態を検証する。

| Code | 日本語 | retry | 必須処理 |
|---|---|---|---|
| `UNDEFINED_TRANSITION` | Matrix外遷移 | 不可 | REJECTED Event、旧Snapshot保持 |
| `PHASE_SKIP_FORBIDDEN` | Phase飛越し | 不可 | REJECTED Event |
| `TERMINAL_REOPEN_FORBIDDEN` | 終端Task再開 | 不可 | 新Taskを要求 |
| `REVISION_CONFLICT` | expected revision不一致 | 可 | 再読後に新Request |
| `LEASE_INVALID` | Lease期限・holder・token不一致 | 可 | 候補破棄、再PREPARE |
| `AUTHORIZATION_MISSING` | 権限Evidence不足 | 不可 | PENDING/NOT_CONFIRMED、Lease解放 |
| `EVIDENCE_INVALID` | Evidence欠落・checksum不一致 | 不可 | FAIL/NOT_CONFIRMED、Commit停止 |
| `VERIFY_FAILED` | VERIFY不合格 | 条件付き | 旧Snapshot保持、失敗Event追記 |
| `COMMIT_STATE_UNKNOWN` | Crash等でCommit状態不明 | 不可 | Journal Recovery完了までSafe Stop |

## Schema Evolution and Legacy Migration

SchemaはSemVerを用い、F-03のActor fields導入を`1.1.0`とする。major変更はMigration Mapping、旧新checksum、append-only Event、独立VERIFYを必須とする。既存TASK-001〜003は変更しない。`DESIGN_IN_PROGRESS→ACTIVE/DESIGN`、`IMPLEMENTATION_READY→ACTIVE/IMPLEMENTATION_AUTHORIZATION`、`TASK COMPLETE→COMPLETED/CLOSURE`は`MIGRATION_MAPPING`として新Recordへ参照で記録し、曖昧なlegacy値は`NOT_CONFIRMED`で停止する。

## Implementation Procedure

1. Shared schemaとruntime sourceのpathを作成し、enum・Schema validator・canonical serializerを実装する。
2. Actor／Authorization／Evidence／Lease／Migration Schemaを実装する。
3. Task/Phase/Rework Matrix validatorとError Modelを実装する。
4. Lease、fencing token、Journal、Node filesystem protocolを実装する。
5. Crash recoveryとappend-only Log verifierを実装する。
6. 下記Test Planを実行し、Builderはimplementation-reportまたはhandoffを作成する。

## Test Requirements

- Unit: 全enum、required/nullability、Actor type/role整合、`SYSTEM_RULE`、checksum、Schema evolution。
- Unit: F-01の全許可／拒否edge、Phase skip、EvidenceなしRework、終端再開拒否。
- Unit: 60秒Lease、待機中Lease禁止、fencing token、Commit直前再検証、expiry候補破棄。
- Unit: VERIFY失敗が旧Snapshot bytes/revisionを変更しないこと。
- Integration: 同revisionの二Requestで一方だけCommit、もう一方が`REVISION_CONFLICT`となること。
- Integration: Crashを`PREPARED`、`SNAPSHOT_RENAMED`、`LOG_APPENDED`で注入し、Recovery後のSnapshot/Log整合と重複Eventなしを確認する。
- Integration: SnapshotとCOMMITTED Eventのrequested/authorized/applied Actor、Authorization、Evidence、revisionが一致すること。
- Integration: Legacy mappingが旧Artifactを変更せず参照のみを追加すること。

## Rollback or Recovery

過去SnapshotまたはLogを上書きしてRollbackしない。誤Commitの訂正は新revisionと新Eventで行う。Journal Recoveryが不確定、checksum不一致、Lease競合未解決なら書込みを止める。Archive、外部副作用、Checkpoint、ResumeのRollbackは本Phaseの対象外である。

## Security, Accessibility, and State Requirements

状態データはActive Project内に限定し、Evidence pathのpath traversal、外部path、未信頼命令を拒否する。SecretをRecord、Log、Evidence本文に保存しない。UIは本Phaseで実装しないためアクセシビリティのUI要件は発生しない。監査フィールドは最小限の識別子のみを保持する。

## OP-001 and Deferred Items

OP-001（Canonical Document Reading Rules）は`Artifact-Specification.md`に記録済みのワンライナーDOCX読取手順を運用Evidenceとして維持する。Architecture Ver.1.2へのDocument Parsing Strategy反映は候補であり、本Phase実装、Architecture更新、Policy UPDATEには含めない。

Deferred Items: Review Framework Specification、Review Mode命名標準、`builder-response-<review-mode>.md`、TASK Completion Review、Architecture Ver.1.2、TASK-005以降のKnowledge/Runtime、Phase 2〜6。これらをPhase 1のruntime、schema、状態遷移へ混入させない。

## Completion Criteria

- Binding Corrections 1〜6を実装・テスト可能な規則として本Planへ統合した。
- F-01の完全なCurrent Phase/Rework Matrix、F-02の短時間Lease、F-03の3 Actor分離を定義した。
- 物理形式、path、serialization、Journal、atomic primitives、timeout、crash recoveryをNode/WSL2環境Evidenceに基づき固定した。
- Phase 1外の機能、実装認可、System File更新を含めない。

## Authorization Status

Final Plan creation is authorized. Implementation Authorization is `NOT_AUTHORIZED`。Judgeの`FINAL_PLAN_PASS`、明示的`AUTHORIZED`、bounded allowed-file scopeが揃うまで、`src/**`、`tests/**`、schema、runtime、状態ファイルは作成・変更しない。

## Result

Final Plan Result: `READY_FOR_CONSISTENCY_CHECK`

## Judge Conditions F-01〜F-03

- F-01: 反映済み。Current Phase Matrix、Rework Matrix、Evidence／Gate／Authorization／Reason Code／VERIFYを定義した。
- F-02: 反映済み。60秒・延長なし・Transaction限定Lease、待機禁止、fencing、Commit直前再検証、Recoveryを定義した。
- F-03: 反映済み。`requested_by`／`authorized_by`／`applied_by`、Actor Identity、Snapshot/Log照合を定義した。

## Critical / High Unresolved Issues

- Critical: 0
- High: 0

## Unresolved Items

- Final Plan Consistency Checkは未実施であり、`FINAL_PLAN_PASS`は未取得である。
- Node/WSL2以外のruntimeでのatomic primitive互換性は確認していない。その環境ではこのPlanをそのまま実装せず、再設計判断を要する。

## Known Limitations

本Planは実装・テスト結果、Archive／Closure完了、Policy UPDATE、Registry接続、Automationを示さない。

## Handoff or Next-Gate Information

- Next Role: Judge
- Next Artifact: `final-plan-consistency-check.md`
