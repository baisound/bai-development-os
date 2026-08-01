# Builder Proposal

## Metadata

- Authoring Role: Builder
- Active Project: `/home/baisound/projects/javascript-roulette`
- Active Task: `TASK-004`
- Phase: Phase 1 — Canonical State Foundation（設計）
- Created At: 2026-07-27
- Implementation Authorization: NOT_AUTHORIZED

## Objective

TASK-004 Phase 1として、Taskの現在状態を唯一の正本で安全に記録・検証・遷移するためのCanonical Status Record、Append-only Transition Log、Revision、Lease、原子的更新プロトコルを設計する。

本提案は、状態を一つの複合ラベルへ混在させず、`task_status`、`current_phase`、`gate_status`、`authorization_status`、`archive_status`を直交して保持する。現在値の正本はCanonical Status Recordだけとし、Transition Log、Registry、Dashboard、Prompt、会話要約は正本にしない。

## Evidence Reviewed

- `/home/baisound/AGENTS.md`
- `/home/baisound/projects/javascript-roulette/PROJECT.md`
- `/home/baisound/projects/javascript-roulette/docs/ai-team/common/README-Common.md`
- `/home/baisound/projects/javascript-roulette/docs/ai-team/common/Vocabulary-Specification.md`
- `/home/baisound/projects/javascript-roulette/docs/ai-team/common/Authority-Specification.md`
- `/home/baisound/projects/javascript-roulette/docs/ai-team/common/Evidence-Specification.md`
- `/home/baisound/projects/javascript-roulette/docs/ai-team/common/Artifact-Specification.md`
- `/home/baisound/projects/javascript-roulette/docs/ai-team/common/Workflow-Specification.md`
- `/home/baisound/projects/javascript-roulette/docs/ai-team/roles/README-Builder.md`
- `/home/baisound/projects/javascript-roulette/docs/ai-team/architecture/AI_Development_OS_Architecture_設計書_Ver1.1_統合準備版.docx`（`word/document.xml`を読取）
- `/home/baisound/projects/javascript-roulette/docs/ai-team/specifications/TASK-004_AI_Development_OS_Lifecycle_Foundation_詳細設計書_Ver1.1_レビュー反映版.docx`（`word/document.xml`を読取）
- `/home/baisound/projects/javascript-roulette/docs/ai-team/reviews/TASK-004_TASK-005_責務境界_統合設計レビュー_Ver1.0.docx`（`word/document.xml`を読取）
- `/home/baisound/projects/javascript-roulette/docs/ai-team/tasks/TASK-004/task.md`
- `/home/baisound/projects/javascript-roulette/docs/ai-team/templates/builder-proposal.template.md`

## Current State

- `task.md`は `APPROVED_FOR_DESIGN`、Routing EnvelopeのGate Readinessは`PASS`である。
- 現在は`TASK_DEFINITION_COMPLETE`（既存WorkflowのRouting上の段階）であり、Phase 1の設計成果物作成が認可されている。
- これは将来のCanonical Status Recordにおける`current_phase` enumではない。Canonicalモデル導入後、現行のRouting表現は互換マッピングで`TASK_DEFINITION`または`DESIGN`へ明示的に変換する。
- 実装、System File更新、Archive運用、TASK-005のKnowledge設計は認可されていない。

## Constraints

- Canonical Core RoleはOrchestrator、Builder、Critic、Tester、Judge、Project Policy Agentの6 Roleを維持する。Lifecycle Managerは、必要なら原子的更新を担うSystem Componentであり、新しいRoleではない。
- Evidence First、Safe Stop、Historical Integrity、正本一意性、Revision+Lease、VERIFY-before-COMMITを満たす。
- 既存TASK-001～003の成果物は変更しない。移行は新Recordと既存Evidenceへの参照で行う。
- `archive_status`はPhase 1でenum、整合性、非運用境界だけを定義する。Archive Readiness、移動、Manifest、Retention、Rollback、実Archive遷移の規則はPhase 5の責務である。
- Pause、Block、Stallの再開、Checkpoint、Context、Cost、Model Routing、Automation、Closure、Archive、Knowledge Asset／Graph／Resolutionは実装・運用設計の対象外である。

## Design Decisions

### 1. 正本と責務

- Canonical Status Recordは一Taskにつき一つだけ存在する現在Snapshotの正本である。
- Transition Logは同一Taskの状態変更試行を時系列に追記する監査履歴である。Snapshotを再構成・検証できるが、単独で現在値を決めない。
- Lifecycle Manager（System Component）は、認可された更新要求に対するRevision照合、Lease、検証、Commitを一つの更新窓口として実行する。Builder、Critic、Tester、Judge、Project Policy Agentは各自の権限内でEvidenceまたは遷移提案を作成できるが、更新を自己承認しない。
- OrchestratorはRoutingと状態確認を行うが、Judgeの判断、Ownerの認可、Testerの観測を代行しない。
- Registryは将来の索引であり、Status RecordまたはLogの正本ではない。Registry不整合は正本を変更せず再構築対象とする。

### 2. 正確なenum

#### `task_status`

| 値 | 日本語の意味 |
|---|---|
| `DRAFT` | Task定義が未承認で、通常の実行を開始できない。 |
| `ACTIVE` | Taskが通常進行中である。 |
| `PAUSED` | 意図的に停止中である。再開運用はPhase 2で定義する。 |
| `BLOCKED` | Evidence、権限、依存関係等の解消待ちである。解除運用はPhase 2で定義する。 |
| `STALLED` | 開始済み処理の進捗が停止している。検出・復旧運用はPhase 2で定義する。 |
| `COMPLETED` | Closureの正式条件を満たして完了した状態。到達条件はPhase 5で定義する。 |
| `CANCELLED` | OwnerがTaskを取り消した終端状態。 |
| `REJECTED` | Judgeまたは権限を持つ決定者が最終却下した終端状態。再設計は新Task IDで行う。 |
| `ARCHIVED` | Archiveの正式VERIFYが完了した終端状態。到達条件はPhase 5で定義する。 |

#### `current_phase`

| 値 | 日本語の意味 |
|---|---|
| `TASK_DEFINITION` | Task定義を作成・承認する工程。 |
| `DESIGN` | Builder Proposal、Critic Review、Builder Response、Judgeの設計判断を行う工程。 |
| `FINAL_PLAN` | 承認済み設計をFinal Planへ統合し、整合性確認する工程。 |
| `IMPLEMENTATION_AUTHORIZATION` | Final Plan PASS後に実装認可を判定する工程。 |
| `IMPLEMENTATION` | 明示認可済みScopeを実装する工程。 |
| `TESTING` | Testerが独立して観測・検証する工程。 |
| `IMPLEMENTATION_REVIEW` | Criticが実装を独立レビューする工程。 |
| `FINAL_JUDGMENT` | Judgeが最終実装判断を行う工程。 |
| `POLICY_REVIEW` | Project Policy Agentが必要なPolicyのDETECT、PROPOSE、承認済みUPDATE、VERIFYを扱う工程。 |
| `CLOSURE` | Closure ReadinessとClosure Recordを扱う工程。詳細はPhase 5。 |
| `ARCHIVE` | Archive ReadinessとArchive Recordを扱う工程。詳細はPhase 5。 |

#### `gate_status`

| 値 | 日本語の意味 |
|---|---|
| `NOT_EVALUATED` | Gateをまだ評価していない。 |
| `READY` | 判定に必要な入力が揃い、評価可能である。 |
| `NOT_READY` | 必須入力または前提が不足し、評価を開始できない。 |
| `PASS` | 観測済みEvidenceにより次工程の条件を満たす。 |
| `FAIL` | 観測済みEvidenceにより条件を満たさない。 |
| `NOT_CONFIRMED` | Evidence不足または読取不能で判定できない。 |
| `BLOCKED` | 外部条件等により評価・進行を安全に行えない。 |

#### `authorization_status`

| 値 | 日本語の意味 |
|---|---|
| `NOT_REQUIRED` | 当該遷移・操作には追加認可が不要である。 |
| `PENDING` | 必要な認可を待っている。 |
| `AUTHORIZED` | 対象Scope・期間・条件が明示的に認可済みである。 |
| `DENIED` | 認可が拒否された。 |
| `EXPIRED` | 期限付き認可が失効した。 |
| `REVOKED` | 以前の認可が明示的に撤回された。 |

#### `archive_status`

| 値 | 日本語の意味 |
|---|---|
| `NOT_ELIGIBLE` | Archiveを評価できる前提を満たしていない。 |
| `REVIEW_PENDING` | Archive Readinessの評価待ちである。 |
| `READY` | Archiveの候補条件は満たすが、Phase 1では運用・実行しない。 |
| `DEFERRED` | Archiveを意図的に延期した。理由をRecordへ残す。 |
| `ARCHIVED` | Archive完了を表す予約値。Phase 1では`task_status=ARCHIVED`へ遷移させる根拠として使用してはならない。 |

`archive_status`はTaskの生存状態ではなくArchive判定の独立軸である。Phase 1は`NOT_ELIGIBLE`をdefaultとし、`READY`、`DEFERRED`、`ARCHIVED`への業務遷移を有効化しない。

### 3. Canonical Status Record schema

保存形式はYAMLまたはJSONのどちらか一つをFinal Planで固定する。意味論とcanonical serializationは本設計に従い、表示上の整形差でchecksumが変わらないようにする。

| field | 型 | 必須 | default | nullable | 日本語の説明・validation |
|---|---|---:|---|---:|---|
| `record_schema_version` | string | はい | `"1.0"` | いいえ | Record schemaの互換性判定用。SemVer形式。 |
| `task_id` | string | はい | なし | いいえ | `^TASK-[0-9]{3,}$`。保存先Task IDと一致する。 |
| `project_id` | string | はい | なし | いいえ | Active ProjectのProject IDと完全一致する。 |
| `revision` | integer | はい | `1` | いいえ | 1以上。Commitごとに厳密に1増加する。 |
| `task_status` | enum | はい | `DRAFT` | いいえ | 上記`task_status` enum。 |
| `current_phase` | enum | はい | `TASK_DEFINITION` | いいえ | 上記`current_phase` enum。 |
| `gate_status` | enum | はい | `NOT_EVALUATED` | いいえ | 上記`gate_status` enum。 |
| `authorization_status` | enum | はい | `NOT_REQUIRED` | いいえ | 上記`authorization_status` enum。 |
| `archive_status` | enum | はい | `NOT_ELIGIBLE` | いいえ | 上記`archive_status` enum。Phase 1では非運用値の直接更新を拒否する。 |
| `status_reason` | string | はい | なし | いいえ | 1～2,000文字。状態・工程・Gate・認可変更の理由をEvidenceと対応付ける。 |
| `entered_at` | string (RFC 3339 UTC) | はい | 作成時刻 | いいえ | 現在の`task_status`または`current_phase`に入った時刻。 |
| `updated_at` | string (RFC 3339 UTC) | はい | 作成時刻 | いいえ | 最終Commit時刻。`entered_at`以上。 |
| `updated_by` | string | はい | なし | いいえ | 更新を適用したSystem Componentまたは認可済み主体の識別子。Role名だけではなく実行主体IDを含む。 |
| `authoritative_evidence` | array of EvidenceReference | はい | `[]` | いいえ | 根拠Artifactのpath、checksum、role、result、observed_atを持つ。状態を変えるCommitでは空配列を許可しない。 |
| `blocking_items` | array of BlockingItem | はい | `[]` | いいえ | 未解決の阻害事項。`task_status=BLOCKED`なら1件以上必須。Phase 2の復旧手順は含めない。 |
| `next_eligible_phases` | array of enum | はい | `[]` | いいえ | 現在のEvidenceから遷移候補となるPhase。Transition Matrixの許可集合の部分集合。 |
| `last_verified_at` | string (RFC 3339 UTC) | はい | 作成時刻 | いいえ | 直近のVERIFY完了時刻。 |
| `verification_result` | enum | はい | `NOT_CONFIRMED` | いいえ | `PASS`、`FAIL`、`NOT_CONFIRMED`のみ。未観測を`PASS`にしない。 |
| `content_checksum` | string | はい | なし | いいえ | checksum自身を除くcanonical serializationの`sha256:<lowercase-hex>`。 |

`EvidenceReference`は`path`（string、必須）、`checksum`（`sha256:`形式、必須）、`authoring_role`（6 Core RoleまたはOwner、必須）、`result`（string、必須）、`observed_at`（RFC 3339 UTC、必須）を持つ。`BlockingItem`は`id`、`reason`、`required_condition`、`reported_at`を必須とする。

Phase 2以降のCheckpoint、Context Manifest、Budget、Ledger、Model Route、Knowledge Handoffへの参照欄はPhase 1 Recordに追加しない。将来はschema versionを増やす互換的拡張でのみ追加し、未知フィールドを黙って正本として解釈しない。

### 4. Append-only Transition Log

LogはJSON Lines（1行1JSON object）とし、既存行を更新・削除・並べ替えない。各行は、Commit成功・拒否・VERIFY失敗を含む全ての遷移試行を監査可能にする。

```json
{
  "log_schema_version": "1.0",
  "transition_id": "uuid",
  "task_id": "TASK-004",
  "expected_revision": 4,
  "resulting_revision": 5,
  "from": {"task_status":"ACTIVE","current_phase":"DESIGN","gate_status":"READY","authorization_status":"NOT_REQUIRED","archive_status":"NOT_ELIGIBLE"},
  "to": {"task_status":"ACTIVE","current_phase":"DESIGN","gate_status":"PASS","authorization_status":"NOT_REQUIRED","archive_status":"NOT_ELIGIBLE"},
  "outcome": "COMMITTED",
  "reason": "Critic review evidence passed the design gate.",
  "evidence": [{"path":".../critic-review.md","checksum":"sha256:..."}],
  "proposal_by": {"role":"Orchestrator","actor_id":"..."},
  "authorized_by": {"authority_type":"RULE","authority_reference":"..."},
  "applied_by": {"component":"Lifecycle Manager","actor_id":"..."},
  "lease_id": "uuid",
  "created_at": "2026-07-27T00:00:00Z",
  "verified_at": "2026-07-27T00:00:01Z",
  "previous_entry_checksum": "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "entry_checksum": "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
}
```

`outcome`は`COMMITTED`、`REJECTED`、`VERIFICATION_FAILED`のいずれかとする。`REJECTED`と`VERIFICATION_FAILED`では`resulting_revision`を`null`にし、`failure_code`、`failure_reason`、`observed_at`を必須とする。`previous_entry_checksum`は先行行の`entry_checksum`（先頭行は固定値`sha256:GENESIS`）であり、`entry_checksum`は自身を除くcanonical JSONのSHA-256である。これにより削除・並べ替え・内容変更を検出できる。

## Architecture and Data Flow

1. 認可された主体が、目的、変更前後候補、Evidence、`expected_revision`を含むTransition Proposalを作成する。
2. Lifecycle Managerが唯一のCanonical Status Recordを読み、schema、checksum、Task/Project境界、現在revisionを確認する。
3. Policy／Authority根拠を確認し、必要なOwnerまたはJudge等の決定をEvidenceReferenceで確認する。
4. 短命Leaseを取得後、候補Recordと候補Log行を作成する。
5. VERIFYがschema、checksum、Evidence、Transition Matrix、不変条件、期待revisionを再確認する。
6. VERIFYが`PASS`の場合だけ、新revisionのRecordと`COMMITTED` Log行を同一Commit単位で永続化する。
7. Leaseを必ず解放する。失敗時は旧Recordを保持し、失敗Logだけを追記して安全停止する。

この流れの入力はEvidenceと現在Snapshotであり、会話内容、Dashboard、Registry、Prompt要約は補助情報に留める。

### Atomic Update Protocol

| 段階 | 必須処理 | 失敗時の挙動 |
|---|---|---|
| `PREPARE` | Recordを読み、checksum・schema・`expected_revision`・提案差分を検証する。 | 更新せず`REJECTED` Logを追記し、`CONFLICT`または`NOT_CONFIRMED`として停止する。 |
| `AUTHORIZE` | 遷移に必要なRole、Judge、Owner、既存承認Recordを確認する。 | 更新せず`REJECTED` Logを追記する。認可不足を推測で補わない。 |
| `ACQUIRE_LEASE` | current revisionに束縛した排他Leaseを取得する。 | 更新せず競合として拒否する。 |
| `APPLY` | 非正本の候補Recordと候補Log行を生成する。旧Recordには書き込まない。 | 候補を破棄し、失敗Logを追記する。 |
| `VERIFY` | schema、enum、checksum、Evidence、権限、Matrix、不変条件、Lease有効性を検証する。 | 旧Recordを保持し、`VERIFICATION_FAILED` Logを追記してLeaseを解放する。 |
| `COMMIT` | VERIFY `PASS`のときだけrevisionを1増やし、Recordと`COMMITTED` Logを不可分に永続化する。 | Commit不能なら正本置換を行わず、復旧可能な失敗Logを追記して停止する。 |
| `RELEASE_LEASE` | 成功・失敗・例外の全経路でLeaseを解放する。 | 解放不能なら期限満了まで新規更新を拒否し、Recovery手順へ渡す。 |

`VERIFY`失敗は旧Canonical Status Recordを決して置換しない。失敗Logを残すことは、失敗候補を正本化することではない。

### Lease lifecycle, timeout, recovery

Leaseは`lease_id`、`task_id`、`owner_actor_id`、`acquired_at`、`expires_at`、`bound_revision`、`purpose`、`nonce`を持つ。`bound_revision`は取得時のCanonical revisionと一致し、Lease保持者だけがそのrevisionに対するCommitを試行できる。

- Lease取得前に`expected_revision == current.revision`を確認し、同一Taskの有効Leaseがあれば取得を拒否する。
- 初期timeoutは5分とし、更新延長は同一owner、未失効、同一`bound_revision`、進行中の検証Evidenceを満たす場合に限り1回、最大5分まで許可する。延長回数はLogへ記録する。
- Leaseの期限満了後、Recovery主体はRecord checksum、revision、既存Leaseの期限、途中Commitの有無を再読して確認する。途中Commitが観測できなければ期限切れLeaseを無効化し、`LEASE_EXPIRED`の拒否／復旧Logを追記できる。
- 期限満了だけを根拠に候補をCommitしてはならない。元の提案者は新しい`expected_revision`でPREPAREから再提案する。
- owner不明、時計不整合、checksum不一致、途中Commitの可能性がある場合はLeaseを奪取せず、`gate_status=NOT_CONFIRMED`または`BLOCKED`を提案してSafe Stopする。

### Revision conflict example

Recordの`revision=7`をAgent AとAgent Bが読んだ場合、双方の`expected_revision`は7となる。AがLeaseを取得しVERIFY後にCommitするとRecordはrevision 8になる。BはLease取得時またはCommit直前の再読で`expected_revision=7`とcurrent revision 8の不一致を検出し、更新を拒否する。Bは旧候補をlast-write-winsで上書きせず、新revisionと最新Evidenceを読み直して新Proposalを作成する。

## Validation, Security, Accessibility, and State Rules

### State invariants

1. `task_id`、`project_id`、保存先Task境界は一致し、Commit後に変更しない。
2. `revision`は1以上の単調増加整数で、成功Commitごとにちょうど1増える。拒否・VERIFY失敗はrevisionを増やさない。
3. RecordとLogのchecksumはcanonical serializationのSHA-256で検証する。checksum不一致は`NOT_CONFIRMED`としてCommitを停止する。
4. 全`COMMITTED` Log行は、actor、reason、Evidence、authorization、timestamp、expected revision、resulting revision、Lease IDを持つ。
5. `task_status`、`current_phase`、`gate_status`、`authorization_status`、`archive_status`は別フィールドであり、一方の値から他方を暗黙変更しない。
6. `gate_status=PASS`は`authorization_status=AUTHORIZED`を意味しない。実装はFinal Plan PASS、明示認可、許可Scopeの全てが揃うまで開始しない。
7. `COMPLETED`、`CANCELLED`、`REJECTED`、`ARCHIVED`から同一Task IDの`ACTIVE`への遷移を禁止する。後続作業は新Task IDへ分離する。
8. `task_status=BLOCKED`は空でない`blocking_items`を必要とする。
9. `archive_status=ARCHIVED`なら`task_status=ARCHIVED`でなければならない。ただしPhase 1では当該値へのCommit自体を拒否する。
10. `verification_result=PASS`は実行済みかつ観測済みのVERIFY Evidenceを必須とし、未実行・未観測をPASSと報告しない。

### Transition Matrix

`✓`はPhase 1で構造的に許可する候補、`P2`／`P5`はenum整合性のみを保持し運用・実装を後続Phaseへ留保、`—`は拒否である。全候補はGate、Authorization、Evidence、Revision、Lease、VERIFYを満たして初めてCommitできる。

| From `task_status` | To `DRAFT` | `ACTIVE` | `PAUSED` | `BLOCKED` | `STALLED` | `COMPLETED` | `CANCELLED` | `REJECTED` | `ARCHIVED` |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `DRAFT` | — | ✓ | — | — | — | — | ✓ | ✓ | — |
| `ACTIVE` | — | ✓（直交軸のみ） | P2 | P2 | P2 | P5 | ✓ | ✓ | — |
| `PAUSED` | — | P2 | ✓（直交軸のみ） | P2 | P2 | — | P2 | P2 | — |
| `BLOCKED` | — | P2 | P2 | ✓（阻害事項更新のみ） | P2 | — | P2 | P2 | — |
| `STALLED` | — | P2 | P2 | P2 | ✓（監査更新のみ） | — | P2 | P2 | — |
| `COMPLETED` | — | — | — | — | — | ✓（監査更新のみ） | — | — | P5 |
| `CANCELLED` | — | — | — | — | — | — | ✓（監査更新のみ） | — | — |
| `REJECTED` | — | — | — | — | — | — | — | ✓（監査更新のみ） | — |
| `ARCHIVED` | — | — | — | — | — | — | — | — | ✓（監査更新のみ） |

Phase遷移は通常、`TASK_DEFINITION → DESIGN → FINAL_PLAN → IMPLEMENTATION_AUTHORIZATION → IMPLEMENTATION → TESTING → IMPLEMENTATION_REVIEW → FINAL_JUDGMENT → POLICY_REVIEW → CLOSURE → ARCHIVE`の前方遷移のみを候補とする。設計差戻しやFixのLoopは、既存Workflowに従いEvidenceを添えて前工程へ戻ることができるが、最終的な許可条件はPhase 1実装前にCritic／Judgeが確認する。`COMPLETED`または`ARCHIVED`後のPhaseを実行工程へ戻すことはできない。

### Invalid transition examples

- `task_status=COMPLETED`から`ACTIVE`へ変更する要求：Historical Integrityに反するため`REJECTED`。
- `gate_status=PASS`だけで`current_phase=IMPLEMENTATION`へ進める要求：`authorization_status=AUTHORIZED`および実装ScopeのEvidenceがないため`REJECTED`。
- `archive_status=READY`だけで`task_status=ARCHIVED`へ変更する要求：Phase 5のArchive EvidenceとVERIFYがなく、Phase 1の非運用境界にも反するため`REJECTED`。
- Log行を訂正するため既存JSONL行を編集する要求：append-only不変条件に反するため`REJECTED`。訂正は新しいLog行と新revisionで表す。
- `expected_revision`なし、またはcurrent revisionと一致しない更新：`CONFLICT`として`REJECTED`。

### Failure behavior

| failure | 安全な挙動 |
|---|---|
| schema／enum／checksum不一致 | Commitを停止し、旧Recordを保持する。観測済み不一致なら`FAIL`、原因未確定なら`NOT_CONFIRMED`を記録する。 |
| Evidence欠落または参照不能 | 認可・進行を推測せず、`NOT_CONFIRMED`または`BLOCKED`を提案する。 |
| 権限不足・認可期限切れ | `REJECTED` Logを追記し、正本を変更しない。必要なら`authorization_status`の変更を別の認可済みProposalとして扱う。 |
| revision conflict／有効Lease競合 | last-write-winsを行わず、候補を破棄して再読・再提案する。 |
| VERIFY失敗 | `VERIFICATION_FAILED` Logを追記し、旧Record・旧revisionを保持してLeaseを解放する。 |
| CommitまたはLease解放の成否が不明 | 二重Commitを試みず、再読・checksum・Log連鎖確認までSafe Stopする。 |

## File Boundaries

### Allowed Files

- `/home/baisound/projects/javascript-roulette/docs/ai-team/tasks/TASK-004/builder-proposal.md`

### Prohibited Files

- `src/**`
- `README*`
- `docs/ai-team/templates/**`
- `docs/ai-team/common/**`
- `docs/ai-team/roles/**`
- `/home/baisound/AGENTS.md`
- TASK-001～003の全成果物
- 他Project
- 上記Allowed Files以外のすべて

## Commands or Procedures

- 必読Markdown資料を読み、Active Project、Active Task、Role、権限、成果物構造を確認した。
- 必読DOCX 3件は、プロジェクトrootから`python3`、`zipfile`、`xml.etree.ElementTree`で`word/document.xml`の段落テキストのみを読取した。DOCX内部およびその他のファイルは変更していない。
- 本Proposal作成後、対象ファイルのみを読み返してテンプレート必須見出し、Phase 1境界、必須設計項目、Allowed File範囲を確認する。

## Compatibility and Rollback

### Migration compatibility

- TASK-001～003はHistorical Evidenceとして不変に保持する。旧Artifact、旧Status記述、旧Next Actionは削除・修正・再ラベルしない。
- 移行が必要になった場合は、新しいCanonical Status Recordを作成し、`authoritative_evidence`から既存Artifactをpathとchecksumで参照する。
- 旧複合表現は、例として`DESIGN_IN_PROGRESS → task_status=ACTIVE, current_phase=DESIGN`、`IMPLEMENTATION_READY → ACTIVE, IMPLEMENTATION_AUTHORIZATION`、`TASK COMPLETE → COMPLETED, CLOSURE`のように新Recordで明示マッピングする。推測不能な旧値は`gate_status=NOT_CONFIRMED`としてOwner判断へ送る。
- `record_schema_version`のmajor変更は明示的migration procedure、旧新Recordのchecksum、Log参照、独立VERIFYを必要とする。minor追加は既存必須フィールドの意味を変えず、unknown fieldを無視して正本状態を変更してはならない。

### Rollback boundary

Phase 1でのStatus訂正は、過去RecordやLogを巻き戻して書き換えない。誤Commitが検証済みの場合も、新revisionで正しい状態へ遷移し、理由と旧transitionへの参照をLogへ追記する。ファイル配置のRollback、Archive Rollback、外部副作用の補償、CheckpointからのResumeは本Phaseの設計対象外である。

## Completion Criteria

- 全enum、型、必須性、default、nullability、validationを日本語説明付きで定義した。
- Canonical Status RecordとAppend-only Transition Logの正本・監査責務を分離した。
- Revision、expected revision、Lease、timeout、Recovery、競合例を定義した。
- `PREPARE → AUTHORIZE → ACQUIRE_LEASE → APPLY → VERIFY → COMMIT → RELEASE_LEASE`を定義し、VERIFY失敗時に正本を置換しないことを規定した。
- Transition Matrix、不変条件、無効遷移、checksum、audit fields、移行互換性、unit/integration test戦略、却下案を含めた。
- Phase 2以降とTASK-005の設計・実装を混入させていない。

### Unit and integration test strategy

実装認可後のPhase 1テストは、少なくとも次を独立して検証する。

- Unit: 全enumの受理／未知値拒否、必須・nullable・default、RFC 3339、ID形式、checksum再計算、EvidenceReference、BlockingItem、各不変条件。
- Unit: Transition Matrixの許可／拒否、終端状態から`ACTIVE`への拒否、GateとAuthorizationの独立性、`archive_status`のPhase 1非運用拒否。
- Unit: `expected_revision`不一致、二重Lease、有効期限、延長上限、期限切れ後の再確認、Lease owner不一致の拒否。
- Unit: VERIFY失敗時にRecordのbytes・revision・checksumが不変で、`VERIFICATION_FAILED` Logだけが追記されること。
- Integration: 複数更新者が同revisionを提案した競合で一方だけがCommitでき、後者は上書きせず拒否されること。
- Integration: Record Commitと`COMMITTED` Log行の不可分性、Log checksum連鎖、途中書込・Commit不明時のSafe Stopを検証すること。
- Integration: 旧TASK Artifactを変更せず、新RecordのEvidence参照だけでlegacy mappingを表現できること。

## Rejected Alternatives

| 却下案 | 理由 |
|---|---|
| 工程ごとに`task_status`を増やす | 状態数が爆発し、Task生存状態と工程・Gate・認可の意味が混同される。 |
| last-write-wins | 同時Agent更新でCanonical Sourceを無音で破壊する。 |
| Snapshotだけを保持する | 遷移理由、拒否、失敗、監査可能性を失う。 |
| Logだけを現在状態の正本にする | 現在値の決定に全履歴再生と曖昧な競合解決を必要とし、正本一意性を弱める。 |
| Leaseだけでrevisionを持たない | timeout後・再試行時・分散更新時に古い候補を検出できない。 |
| VERIFY後にLogを任意に書く | Commitとの原子性と監査連鎖を失う。 |
| Lifecycle Managerを第7のCore Roleにする | 既存のCanonical 6 Roleを変え、実行Componentと判断Roleを混同する。 |
| RegistryをStatusの正本にする | Registryは索引であり、Index不整合がTask現在状態の破壊につながる。 |
| Phase 1でArchive運用・Knowledge Resolutionを実装する | 承認済みPhase分割とTASK-004/TASK-005の責務境界を越える。 |

## Authorization Status

Design artifact creation is authorized by the approved TASK-004 task definition. Implementation Authorization is `NOT_AUTHORIZED`。本Proposalは実装認可、Policy UPDATE、Closure、Archiveの承認を作らない。

## Result

PASS — 指定されたPhase 1の設計Proposalを作成した。実装・System File変更・他Task成果物の変更は行っていない。

## Unresolved Items

- Canonical Status Recordの最終物理保存形式（YAMLまたはJSON）、正確な保存path、atomic filesystem primitiveはFinal Planで、実装環境・Crash recovery要件をEvidenceに基づいて確定する。
- `PAUSED`、`BLOCKED`、`STALLED`の詳細な再開条件、Checkpoint、RollbackはPhase 2で設計する。
- `COMPLETED`、`ARCHIVED`の到達条件、Archive Procedure、Retention、Migration実行はPhase 5で設計する。
- Registry登録、AutomationによるRouting、Knowledge Resolution／Knowledge PackはTASK-005／TASK-006の責務であり、本Proposalでは未設計である。

## Known Limitations

本ProposalはPhase 1の設計であり、実行可能なSchema、永続化、排他制御、テストコードをまだ提供しない。物理実装の前に、Critic Review、Builder Response、Judge Decision、Final Plan、FINAL_PLAN_PASS、明示的Implementation Authorization、bounded allowed-file scopeが必要である。

## Handoff or Next-Gate Information

Orchestratorは本ProposalのAuthoring Role、Evidence Reviewed、Phase 1境界、Allowed File範囲、Resultを確認後、CriticへDetailed Design ReviewをRoutingする。BuilderはCriticまたはJudgeの結論を先取りしない。
