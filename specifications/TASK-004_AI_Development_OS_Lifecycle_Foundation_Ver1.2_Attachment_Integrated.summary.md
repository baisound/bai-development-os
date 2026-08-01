# TASK-004 AI Development OS Lifecycle Foundation Ver.1.2 添付資料統合版 — Summary

## 1. Document Identity

- **Task:** TASK-004
- **Title:** AI Development OS Lifecycle Foundation
- **Version:** Ver.1.2 Attachment Integrated
- **Foundation:** AI Development OS v2.1 Alpha
- **Purpose:** TASKの状態、工程、判定、認可、再開、完了、Archive、Context、Cost、Model Controlを、機械判定可能な形で管理する。
- **Source Scope:** 添付されたTASK-004初版、TASK-004 Ver.1.1レビュー反映版、レビュー報告書、TASK-004／TASK-005責務境界レビューのみ。
- **Excluded:** 添付資料作成後の実装結果、Fix Cycle、テスト実績、現在進行中のDocumentation Synchronization、新規ロードマップ決定。

## 2. Canonical Design Choice

TASK-004では、以下の4次元を一つの状態へ混在させず、独立して管理する。

| Dimension | Purpose |
|---|---|
| `task_status` | TASK全体の生存・進行状態 |
| `current_phase` | 現在の作業工程 |
| `gate_status` | 次工程へ進む条件の判定 |
| `authorization_status` | 実行認可の状態 |

**重要:** `Gate PASS` は実行認可と同義ではない。実装は `authorization_status = AUTHORIZED` の場合だけ開始できる。

## 3. Task Lifecycle Status

主なLifecycle Status:

- `DRAFT`
- `ACTIVE`
- `PAUSED`
- `BLOCKED`
- `STALLED`
- `COMPLETED`
- `CANCELLED`
- `REJECTED`
- `ARCHIVED`

### Invariants

- `COMPLETED`、`CANCELLED`、`REJECTED`、`ARCHIVED` を同一Task IDで `ACTIVE` に戻してはならない。
- 完了後の追加作業は新しいTask IDで扱う。
- `PAUSED`、`BLOCKED`、`STALLED` は原因と再開条件を区別する。
- `ARCHIVED` 後のEvidenceはread-onlyとする。

## 4. Current Phase

標準Phase:

1. `TASK_DEFINITION`
2. `DESIGN`
3. `FINAL_PLAN`
4. `IMPLEMENTATION_AUTHORIZATION`
5. `IMPLEMENTATION`
6. `TESTING`
7. `IMPLEMENTATION_REVIEW`
8. `FINAL_JUDGMENT`
9. `POLICY_REVIEW`
10. `CLOSURE`
11. `ARCHIVE`

Phase変更は、Artifact完成とGate判定だけでは成立しない。Canonical Status Record更新後のVERIFYまで完了する必要がある。

## 5. Core Artifacts

TASK-004が管理する主なArtifact:

- Canonical Status Record
- Transition Log
- Resume Checkpoint
- Context Manifest
- Cost Budget
- Cost Reservation
- Actual Usage Ledger
- Model Routing Record
- Closure Readiness Record
- Archive Readiness Record
- Rollback／Recovery Evidence

## 6. Canonical Status Record

Canonical Status Recordは現在状態の唯一の正本であり、会話、README、個別Agentの要約より優先する。

主要項目:

- Schema version
- Revision
- Task／Project ID
- Parent／Dependency Task
- Task Status
- Current Phase
- Gate Status
- Authorization Status
- Archive Status
- Status reason
- Updated by
- Authoritative Evidence
- Blocking items
- Accepted risks
- Next eligible phases
- Checkpoint reference
- Context Manifest reference
- Cost Budget／Ledger reference
- Model Routing reference
- Knowledge handoff status
- Verification result
- Content checksum

## 7. Transition and Atomic Update

標準更新プロトコル:

1. `PREPARE`
2. `AUTHORIZE`
3. `ACQUIRE LEASE`
4. `APPLY`
5. `VERIFY`
6. `COMMIT`
7. `RELEASE LEASE`
8. Failure時は元Recordを保持し、失敗Evidenceを追記

### Mandatory Controls

- `expected_revision` 不一致は競合として拒否する。
- 短期Leaseで同時更新を制御する。
- last-write-winsによる上書きを禁止する。
- Historical Evidenceを直接書き換えない。
- 不明状態では推測せず `NOT_CONFIRMED` または `BLOCKED` とする。

## 8. Pause, Block, Stall and Emergency Stop

| State | Meaning |
|---|---|
| `PAUSED` | Ownerまたは運用判断による意図的停止 |
| `BLOCKED` | 外部条件、権限、Evidence不足による停止 |
| `STALLED` | 処理開始後に進捗が停止した状態 |

OwnerはEmergency Stopを発行できる。解除には明示的なOwner指示を必要とする。

長時間処理では、開始時刻、最終進捗、Heartbeat、期待完了時刻、実行主体を記録する。

## 9. Resume and Rollback

Resume Checkpointには最低限以下を含める。

- Status revision
- 保存時Status／Phase
- 最後に完了した処理
- 次に実行すべき処理
- 必須ファイル
- Git working tree state
- Environment fingerprint
- Running processes
- External dependencies
- Authorization snapshot
- Budget snapshot
- 未確認事項

Rollbackは履歴Evidenceの削除ではなく、承認済みの補正遷移として記録する。

## 10. Closure and Archive

### Closure Readiness

Taskを `COMPLETED` としてよいか判定する。

確認対象:

- 必須成果物
- Gate結果
- 未解決Critical／High
- Accepted Risk
- Knowledge Candidate引渡し
- 実行中プロセス
- 未保存差分
- Secrets
- 一時ファイル
- Resource cleanup

### Archive Readiness

完了済みTaskを履歴保存領域へ移せるかを別途判定する。

確認対象:

- 参照整合性
- Index／Registry更新
- Checksum
- Read-only化
- Active Evidenceとして残す必要性

`COMPLETED` と `ARCHIVED` を同一視してはならない。

## 11. Context Control

Context Manifestは現在Role／Phaseが読む全情報を管理する。

最低限の管理項目:

- Source
- Canonical／Trusted／Reference／Untrusted
- Sensitivity
- Token量
- Freshness
- Version
- Checksum
- Invalidation condition

Knowledge PackはContext Sourceの一つであり、Context Manifest全体を置き換えない。

## 12. Cost Control

Cost Controlでは以下を分離する。

- Budget
- Reservation
- Actual Usage Ledger
- Remaining amount
- External API cost
- Retry count
- Processing time

高額処理は事前Reservationを必要とし、超過時は停止またはOwner判断へ送る。

## 13. Model Control

Model Routingの判断軸:

- Capability
- Cost
- Context length
- Tool support
- Sensitivity
- Availability
- Independent review requirement
- Deprecation／replacement status

Judge／Critic等の独立性は、Session、Context、Model Routingの分離で維持する。

## 14. Irreversible Actions

公開、削除、外部送信、課金、外部状態変更など、完全Rollbackできない操作は事前Authorizationを必須とする。

記録項目:

- 対象
- 影響
- 取消可能性
- Compensating Action
- 費用
- 承認者
- 実行者

## 15. TASK-004 and TASK-005 Boundary

### TASK-004

Task Lifecycle、Status、Phase、Gate、Authorization、Resume、Rollback、Closure、Archive、Context、Cost、Modelを管理する。

### TASK-005

Knowledge Asset、Taxonomy、Graph、Revision、Resolution、Knowledge Pack、Application、Verification、Promotion、Demotion、Impact Analysisを管理する。

### Prohibited Boundary Violations

- TASK-004はKnowledge AssetのScore、Promotion、Revisionを独自に確定しない。
- TASK-005はTask Lifecycleの正式状態を変更しない。
- TASK-005はContext Manifest全体を生成しない。
- Knowledge PackをContext Manifestの監査を迂回してRole Promptへ直接投入しない。

## 16. Knowledge Integration Sequence

1. TASK-004がTask、Role、Phase、Budget、Sensitivity、Tool Versionを確定
2. TASK-004がKnowledge Resolution Requestを送信
3. TASK-005がResolutionを実行
4. TASK-005がKnowledge PackとResultを返却
5. TASK-004がKnowledge PackをContext Manifestへ登録
6. TASK-004が他のCanonical Sourceと統合
7. TASK-004がTrust、重複、Token、Sensitivity、Freshnessを検査
8. Context ManifestからRole Prompt／Execution Contextを構築

## 17. Workspace Registry

Workspace Registryは正本そのものではなく、正本への機械可読な索引である。

管理対象:

- Project Index
- Task Index
- Specification Index
- Template Index
- Artifact Index
- Knowledge Index
- Role Index
- Canonical Path
- Version
- Status
- Checksum

管理しない対象:

- Taskの正式状態
- Knowledge本文・正式状態
- Role権限の詳細
- Artifact本文

設計案では、Workspace RegistryをTASK-006のPhase 1として実施する。

## 18. Review Coverage

### Mandatory Review Findings

`M-01`〜`M-12`はすべて統合済み。

主な内容:

- Lifecycle StatusとPhaseの分離
- Status RecordとTransition Logの分離
- Revision／Lease
- Atomic Update／VERIFY
- PAUSED／BLOCKED／STALLED
- Context Trust Boundary
- Cost Budget／Ledger分離
- Model safety
- Closure resource cleanup
- Archive checksum
- Parent／Dependency Task
- Manual Override／Emergency Stop

### Enhancement Findings

`E-01`〜`E-08`はすべて統合済み。

特にVer.1.2で明示補完:

- Timeout／Heartbeat
- Irreversible Actionの事前承認

## 19. Source Version Resolution

本文基盤はTASK-004 Ver.1.1レビュー反映版。

Ver.1.2では以下を統合:

- 初版の非競合レイヤー概念
- レビュー報告書の未明示強化事項
- TASK-004／TASK-005責務境界
- Knowledge連携Interface
- Workspace Registryの位置づけ
- Review finding coverage matrix

ファイルサイズは最新版判定の根拠にしない。内容、レビュー反映状況、責務境界確定内容を基準にする。

## 20. Explicit Exclusions

本Summaryおよび統合本文には以下を含めない。

- 添付資料後の実装結果
- Fix Cycle
- テスト実績
- 現在進行中のDocumentation Synchronization
- 添付資料を超える新規決定
- TASK-005内部Schemaの重複記載

## 21. Full Document Reference

詳細なSchema、表、受入基準、採用・却下・保留事項、全章構成は次を参照する。

`TASK-004_AI_Development_OS_Lifecycle_Foundation_Ver1.2_Attachment_Integrated.md`
