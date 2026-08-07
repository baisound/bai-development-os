# TASK-004 BAI Development OS Lifecycle Foundation Ver.1.5 — Phase 1.6–1.8 Foundation Milestone Integrated

## Document Control

```yaml
document:
  document_id: TASK-004-Lifecycle-Foundation
  version: "1.5"
  status: CURRENT_CANONICAL
  authority: machine_canonical_authority
  baseline_version: "1.4"
  baseline_coverage:
    result: VER1_2_COVERAGE_PASS_WITH_CLARIFICATIONS
    missing_items: 0
    conflicts: 0
  human_companion: /home/baisound/bai-development-os/specifications/TASK-004_BAI_Development_OS_Lifecycle_Foundation_Ver1.5.docx
  machine_path: /home/baisound/bai-development-os/specifications/TASK-004_BAI_Development_OS_Lifecycle_Foundation_Ver1.5.md
  summary_path: /home/baisound/bai-development-os/specifications/TASK-004_BAI_Development_OS_Lifecycle_Foundation_Ver1.5.summary.md
  baseline_commit: 3ce360ba5cef063cd046d88ce007d42c0b54a275
  coverage_evidence: /home/baisound/bai-development-os/tasks/TASK-004/phase1.6-to-1.8-completion-record.md
```

## Authority and Scope

This Markdown is the machine canonical authority for this document set. It inherits Ver.1.3 and integrates P0.0 Product Boundary Correction and P0.1 Adaptive Development Governance without rewriting historical Evidence. The DOCX is a human canonical companion. The Summary is a navigation entrypoint only. Any disagreement among these files MUST result in a no-write Safe Stop and subsequent independent consistency review.

## Inherited Lifecycle Foundation Ver.1.2 Content

添付資料統合版：Lifecycle Foundation／Status・Phase・Gate・Authorization・TASK-005責務境界

| **項目** | **内容**                                                                                                                           |
|----------|------------------------------------------------------------------------------------------------------------------------------------|
| 対象     | AI Development OS TASK-004                                                                                                         |
| 前提     | AI Development OS v2.1 Alpha                                                                                                       |
| 状態     | 添付資料統合設計案。Ver.1.1レビュー反映版を正本候補として、初版・レビュー報告・TASK-004/TASK-005責務境界レビューの非重複内容を統合 |
| 目的     | 全自動化に耐えられる状態・再開・終了・Context・Cost・Model基盤と、TASK-005との責務・連携境界を実装可能な粒度で定義                 |
| 統合基準 | Ver.1.1レビュー反映版を本文基盤とし、初版の非競合概念、レビュー報告の未反映強化事項、責務境界レビューの確定事項を補完              |
| 対象資料 | TASK-004初版／TASK-004 Ver.1.1レビュー反映版／TASK-004レビュー報告書 Ver.1.0／TASK-004・TASK-005責務境界統合設計レビュー Ver.1.0   |
| 対象外   | 添付資料に含まれない後続実装結果、現在進行中のDocumentation Synchronization、将来の追加決定                                        |

# 第1章　目的・範囲・完成条件

**目的：**TASKの現在状態、現在工程、判定結果、認可状態を混同せず記録し、安全な進行・停止・再開・完了・Archiveを可能にする。

## 1.1 対象範囲

- Task Lifecycle StatusとCurrent Phase

- Gate StatusとAuthorization Status

- Canonical Status RecordとTransition Log

- Pause、Block、Stall、Resume、Rollback

- Closure ReadinessとArchive Readiness

- Context Manifest、Trust Boundary、Freshness、Invalidation

- Cost Budget、Reservation、Actual Usage Ledger

- Model Capability Profile、Routing、Fallback、Escalation

- 親子TASK・依存TASK・Manual Override・Emergency Stop

## 1.2 対象外

- Knowledge Assetの正式Schema：TASK-005

- 自律実行エンジン：TASK-006

- 可視化Dashboard：TASK-007

- 外部Connector／MCP：TASK-008

## 1.3 完成条件

- Status、Phase、Gate、Authorizationを独立して機械判定できる。

- 全遷移が追記専用履歴へ残る。

- 複数Agentの同時更新で上書き事故が起きない。

- 中断・停滞・外部Blockを区別して安全に再開できる。

- Context・Cost・Modelの判断理由を監査できる。

- ClosureとArchiveを別々に判定できる。

- 既存TASKのHistorical Evidenceを変更せず適用できる。

# 第2章　用語と直交モデル

| **用語**                     | **説明**                                                                 |
|------------------------------|--------------------------------------------------------------------------|
| Task Lifecycle Status        | TASK全体の生存・進行可能性を示す。DRAFT、ACTIVE、PAUSED等。              |
| Current Phase                | 現在実施中または待機中の工程。DESIGN、TESTING等。                        |
| Gate Status                  | 次工程へ進む条件の判定状態。PASS、NOT_READY等。                          |
| Authorization Status         | 実行認可の状態。AUTHORIZED、PENDING等。                                  |
| Orthogonal Model／直交モデル | 互いに別の意味を持つ値を一つの状態名へ混ぜず、独立フィールドで表す設計。 |
| Canonical Status Record      | 現在値を示す正本Snapshot。                                               |
| Transition Log               | 状態変更を追記専用で残す監査履歴。                                       |
| Revision                     | Status Recordの更新番号。競合更新防止に使う。                            |
| Lease／一時更新権            | 特定Agentが短時間だけStatus更新権を保持する仕組み。                      |
| Trust Boundary／信頼境界     | どの情報が命令として有効で、どの情報が参考資料に留まるかの境界。         |

# 第3章　全体データモデル

| **次元**                 | **主な値**                                                                                                                                                                   | **意味**           |
|--------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------|
| task_status              | DRAFT / ACTIVE / PAUSED / BLOCKED / STALLED / COMPLETED / CANCELLED / REJECTED / ARCHIVED                                                                                    | TASK全体の状態     |
| current_phase            | TASK_DEFINITION / DESIGN / FINAL_PLAN / IMPLEMENTATION_AUTHORIZATION / IMPLEMENTATION / TESTING / IMPLEMENTATION_REVIEW / FINAL_JUDGMENT / POLICY_REVIEW / CLOSURE / ARCHIVE | 現在工程           |
| gate_status              | NOT_EVALUATED / READY / NOT_READY / PASS / FAIL / NOT_CONFIRMED / BLOCKED                                                                                                    | 工程ゲート判定     |
| authorization_status     | NOT_REQUIRED / PENDING / AUTHORIZED / DENIED / EXPIRED / REVOKED                                                                                                             | 認可状態           |
| archive_status           | NOT_ELIGIBLE / REVIEW_PENDING / READY / DEFERRED / ARCHIVED                                                                                                                  | Archive判定        |
| knowledge_handoff_status | NOT_EVALUATED / NONE / CANDIDATE_PRESENT / REVIEW_REQUIRED                                                                                                                   | TASK-005への受け口 |

**採用理由：**工程を状態名へ埋め込む方式より、状態数の爆発を防ぎ、Phase追加時もLifecycle Statusを変更せず拡張できる。

# 第4章　Task Lifecycle Status

| **Status** | **意味**                            | **進行可否** | **主な遷移**                                                  |
|------------|-------------------------------------|--------------|---------------------------------------------------------------|
| DRAFT      | Task定義が未承認                    | 不可         | ACTIVE / CANCELLED                                            |
| ACTIVE     | 通常進行中                          | 可           | PAUSED / BLOCKED / STALLED / COMPLETED / CANCELLED / REJECTED |
| PAUSED     | Ownerまたは運用判断による意図的停止 | 不可         | ACTIVE / CANCELLED                                            |
| BLOCKED    | 外部条件・権限・Evidence不足で停止  | 不可         | ACTIVE / CANCELLED                                            |
| STALLED    | 処理は開始されたが進捗が止まった    | 不可         | ACTIVE / BLOCKED / CANCELLED                                  |
| COMPLETED  | Closure Readinessを満たし完了       | 原則不可     | ARCHIVED                                                      |
| CANCELLED  | Ownerが取消                         | 不可         | 終端                                                          |
| REJECTED   | Judge等による最終却下               | 不可         | 終端。再設計は新Task                                          |
| ARCHIVED   | Archive ReadinessとVERIFY完了       | 不可         | 終端                                                          |

## 4.1 状態不変条件

- COMPLETED、CANCELLED、REJECTED、ARCHIVEDを同じTask IDでACTIVEへ戻さない。

- 完了後の追加作業は新Task IDを作成する。

- PAUSEDは意図的停止、BLOCKEDは解除条件待ち、STALLEDは進捗停止として区別する。

- ARCHIVED後のEvidenceはread-onlyとする。

# 第5章　Current Phase

| **Phase**                    | **開始条件**           | **主要成果物**                                                       | **終了条件**           |
|------------------------------|------------------------|----------------------------------------------------------------------|------------------------|
| TASK_DEFINITION              | DRAFT                  | task.md                                                              | Owner承認              |
| DESIGN                       | ACTIVEかつTask定義済み | builder-proposal / critic-review / builder-response / judge-decision | Judge設計結果          |
| FINAL_PLAN                   | 設計承認済み           | final-plan / consistency-check                                       | FINAL_PLAN_PASS        |
| IMPLEMENTATION_AUTHORIZATION | Final Plan PASS        | authorization record                                                 | AUTHORIZEDまたはDENIED |
| IMPLEMENTATION               | AUTHORIZED             | implementation-reportまたはhandoff                                   | Builder完了/停滞       |
| TESTING                      | 実装Evidence有り       | test-report / retest-report                                          | Tester Result          |
| IMPLEMENTATION_REVIEW        | Tester Evidence有り    | implementation-review                                                | Critic Result          |
| FINAL_JUDGMENT               | QA Evidence完備        | final-implementation-decision                                        | Judge Result           |
| POLICY_REVIEW                | Implementation承認     | project-policy-review / policy verification                          | VERIFY PASS            |
| CLOSURE                      | Policy完了             | closure-readiness / closure-record                                   | COMPLETEDまたはBlock   |
| ARCHIVE                      | COMPLETED              | archive-readiness / archive-record                                   | ARCHIVEDまたはDEFERRED |

## 5.1 Phase Entry／Exit Action

- Entry Action：必要Context Manifest、Budget、Authorization、担当Role、期待Artifactを作成する。

- Exit Action：Artifactの存在・Authoring Role・Result・未解決項目を確認し、Transition Proposalを作成する。

- Phase変更はGate PASSだけでなくCanonical Status更新VERIFYまで完了して成立する。

# 第6章　Gate StatusとAuthorization Status

| **分類**      | **値**        | **意味**               |
|---------------|---------------|------------------------|
| Gate          | NOT_EVALUATED | 未判定                 |
| Gate          | READY         | 判定材料が揃った       |
| Gate          | NOT_READY     | 材料不足               |
| Gate          | PASS          | 進行条件を満たす       |
| Gate          | FAIL          | 確認された不合格       |
| Gate          | NOT_CONFIRMED | Evidence不足で判断不能 |
| Gate          | BLOCKED       | 外部条件等で判定不能   |
| Authorization | NOT_REQUIRED  | 認可不要               |
| Authorization | PENDING       | 承認待ち               |
| Authorization | AUTHORIZED    | 認可済み               |
| Authorization | DENIED        | 拒否                   |
| Authorization | EXPIRED       | 期限切れ               |
| Authorization | REVOKED       | 撤回                   |

**重要：**Gate PASSは実行認可と同義ではない。Final Plan PASS後でもAuthorizationがAUTHORIZEDになるまで実装不可。

# 第7章　Canonical Status Record

| **項目**                   | **説明**                     | **型**       | **必須** |
|----------------------------|------------------------------|--------------|----------|
| record_schema_version      | Record形式の版               | string       | 必須     |
| revision                   | 更新競合防止用の連番         | integer      | 必須     |
| task_id                    | Task ID                      | string       | 必須     |
| project_id                 | Project ID                   | string       | 必須     |
| parent_task_id             | 親Task。なければnull         | string\|null | 必須     |
| dependency_task_ids        | 前提Task一覧                 | array        | 必須     |
| task_status                | Lifecycle Status             | enum         | 必須     |
| current_phase              | Current Phase                | enum         | 必須     |
| gate_status                | 現在Gate                     | enum         | 必須     |
| authorization_status       | 現在認可                     | enum         | 必須     |
| archive_status             | Archive状態                  | enum         | 必須     |
| status_reason              | 現在値の理由                 | string       | 必須     |
| entered_at                 | 現在Status/Phaseへ入った時刻 | datetime     | 必須     |
| updated_by                 | 更新主体                     | string       | 必須     |
| authoritative_evidence     | 根拠Artifact                 | array        | 必須     |
| blocking_items             | Block一覧                    | array        | 必須     |
| accepted_risks             | Accepted Risk参照            | array        | 必須     |
| next_eligible_phases       | 次候補Phase                  | array        | 必須     |
| checkpoint_reference       | Resume Checkpoint            | string\|null | 必須     |
| context_manifest_reference | Context Manifest             | string       | 必須     |
| cost_budget_reference      | Budget                       | string\|null | 必須     |
| cost_ledger_reference      | 実績Ledger                   | string\|null | 必須     |
| model_routing_reference    | Model Routing                | string\|null | 必須     |
| knowledge_handoff_status   | Knowledge候補状態            | enum         | 必須     |
| last_verified_at           | 最終VERIFY時刻               | datetime     | 必須     |
| verification_result        | VERIFY結果                   | enum         | 必須     |
| content_checksum           | 内容同一性確認値             | string       | 必須     |

# 第8章　Transition Logと原子的更新

## 8.1 Transition Log

| **項目**                 | **説明**                                 |
|--------------------------|------------------------------------------|
| transition_id            | 遷移一意ID                               |
| expected_revision        | 更新前に期待するRevision                 |
| from_status / from_phase | 変更前                                   |
| to_status / to_phase     | 変更後                                   |
| proposal_by              | 提案者                                   |
| authorized_by            | 承認者                                   |
| applied_by               | 適用者                                   |
| evidence                 | 根拠                                     |
| result                   | APPLIED / REJECTED / VERIFICATION_FAILED |
| created_at               | 記録時刻                                 |

## 8.2 更新プロトコル

1.  PREPARE：現在Recordとexpected_revisionを読み、変更案を作成する。

2.  AUTHORIZE：必要な権限とOwner承認を確認する。

3.  ACQUIRE LEASE：短時間の更新権を取得する。

4.  APPLY：新Record候補とTransition Log候補を作成する。

5.  VERIFY：Artifact、参照、Schema、遷移規則を検証する。

6.  COMMIT：VERIFY PASS時のみRevisionを増やし正本化する。

7.  RELEASE LEASE：更新権を解放する。

8.  FAILURE：元Recordを保持し、失敗Logだけを追記する。

## 8.3 同時更新

- expected_revisionが一致しない更新はCONFLICTとして拒否する。

- Leaseには所有者と有効期限を持たせる。

- 期限切れLeaseはOwnerまたはRecovery規則で解除する。

- Statusファイルを単純なlast-write-winsで上書きしない。

# 第9章　Pause・Block・Stall・Emergency Stop

| **状態** | **発生例**                          | **必須記録**                             | **再開条件**                |
|----------|-------------------------------------|------------------------------------------|-----------------------------|
| PAUSED   | ユーザーが翌日再開、優先順位変更    | pause_reason / resume_after / checkpoint | Owner指示または予定時刻     |
| BLOCKED  | 権限待ち、外部API停止、Evidence不足 | blocking_owner / required_condition      | 条件解消とVERIFY            |
| STALLED  | 同じコマンド反復、プロセス応答なし  | last_progress_at / attempted_actions     | Handoff・仮説変更・環境復旧 |

## 9.1 Emergency Stop

- Ownerは理由を問わず自動進行を即時停止できる。

- 新規外部呼出し、書込、公開処理を停止する。

- 実行中処理は安全停止可能なら停止し、不可なら監視下で完了待ちする。

- StatusをPAUSEDまたはBLOCKEDへ変更しCheckpointを作成する。

- Emergency Stop解除には明示的なOwner指示が必要。

# 第10章　Resume Checkpoint

| **項目**                | **説明**                        |
|-------------------------|---------------------------------|
| checkpoint_id           | Checkpoint ID                   |
| status_revision         | 作成時Revision                  |
| saved_status / phase    | 保存時状態                      |
| last_completed_action   | 最後の完了処理                  |
| next_action             | 次処理                          |
| required_files          | 再開必須ファイル                |
| working_tree_state      | Git branch、commit、dirty files |
| environment_fingerprint | OS、依存、Tool Version          |
| running_processes       | 起動プロセスと確認方法          |
| external_dependencies   | 外部API・サービス状態           |
| authorization_snapshot  | 認可の有効性                    |
| budget_snapshot         | 残予算                          |
| unconfirmed_items       | 未確認事項                      |
| invalidation_triggers   | Checkpoint無効化条件            |

## 10.1 Checkpoint無効化条件

- Canonical仕様またはFinal Planが更新された。

- Git branch/commitが変わった。

- 依存関係・Tool Version・外部API仕様が変わった。

- Authorizationが期限切れ・撤回された。

- Cost Budgetが変更された。

- Checkpointの有効期限を超えた。

# 第11章　Rollback

| **種別**        | **復元対象**     | **方式**                | **不可逆性**                 |
|-----------------|------------------|-------------------------|------------------------------|
| Code            | 実装差分         | Git commit/revert/stash | 外部公開済み変更は補償処理   |
| Status          | 誤Status/Phase   | 新Revisionで復元        | 過去Logは削除不可            |
| Policy          | 仕様・README     | 承認済み旧版へ復元      | 利用済み影響を確認           |
| Archive         | 移動・参照       | 復元＋Index修復         | 削除済み外部資産は別対応     |
| External Action | 公開・送信・課金 | Compensating Action     | 完全Rollback不能の場合を明示 |

**Compensating Action／補償処理：**元に戻せない操作に対して、取消通知・逆操作・修正版公開などで影響を補う処理。

# 第12章　Closure Readiness

| **分類**  | **確認事項**                                                |
|-----------|-------------------------------------------------------------|
| Technical | 設計、Final Plan、実装、Tester、Critic、Judgeの有効Evidence |
| Quality   | Critical/High未解決なし。例外は明示承認                     |
| Policy    | 必要UPDATEとVERIFY PASS                                     |
| Status    | Canonical Status Record最新、Transition Log整合             |
| Risk      | Accepted Risk、Deferred、Resolvedを区別                     |
| Follow-up | 延期作業は新Task候補                                        |
| Knowledge | Knowledge Candidateの有無と引渡し                           |
| Resources | 起動プロセス停止、Temporary file、Secrets、未保存差分確認   |
| Cost      | Actual Usage確定、未精算費用なし                            |
| Owner     | 必要な最終承認                                              |

## 12.1 Closure Result

- CLOSURE_READY

- CLOSURE_BLOCKED

- CLOSURE_NOT_CONFIRMED

- CLOSURE_NOT_APPLICABLE（CANCELLED/REJECTED等）

# 第13章　Archive Readiness

| **確認項目**         | **内容**                       |
|----------------------|--------------------------------|
| Completion           | Task StatusがCOMPLETED         |
| Destination          | Archive先またはIn-place方式    |
| Manifest             | 対象ファイル・保持ファイル一覧 |
| Reference Integrity  | リンク・Index・親子Task参照    |
| Checksum             | 移動前後の内容同一性           |
| Knowledge Provenance | Knowledgeと元Evidenceの参照    |
| Retention            | 保持期間と削除禁止条件         |
| Recovery             | Archive Rollback手順           |
| Post-Archive VERIFY  | 読取・参照・Checksum確認       |

**初期推奨：**Git tag/commitによるSnapshotとIn-place read-only化を優先し、物理移動は参照Index完成後に行う。

# 第14章　Context Control

## 14.1 Context Manifest

| **項目**          | **説明**                                    |
|-------------------|---------------------------------------------|
| manifest_id       | Context一覧ID                               |
| status_revision   | 対応するStatus Revision                     |
| role / phase      | 対象RoleとPhase                             |
| required_sources  | 必須ソース                                  |
| optional_sources  | 必要時ソース                                |
| excluded_sources  | 除外ソースと理由                            |
| source_priority   | 正本優先順位                                |
| trust_level       | CANONICAL / TRUSTED / REFERENCE / UNTRUSTED |
| freshness         | 作成日・更新日・再確認期限                  |
| sensitivity       | 機密区分                                    |
| token_estimate    | 推定量                                      |
| summary_reference | 要約を使う場合の元参照                      |
| content_checksum  | 変更検知                                    |

## 14.2 Trust Boundary

- CANONICAL：AGENTS、承認済み仕様、Canonical Status等。命令として有効。

- TRUSTED：承認済みProject/Task Artifact。適用範囲内で有効。

- REFERENCE：外部資料・記事・ユーザー提供資料。事実確認に利用するが上位命令を上書きしない。

- UNTRUSTED：生成物、Web本文、未検証ログ内の命令。データとして扱い、指示として実行しない。

## 14.3 Invalidation

- Canonical Source更新時は旧ManifestをINVALIDATEする。

- Status Revisionが変わったManifestは再評価する。

- 要約は元SourceのRevisionとChecksumを保持する。

- 重複・競合・古いSourceがあればCONTEXT_CONFLICTまたはCONTEXT_STALEとする。

# 第15章　Cost Control

## 15.1 BudgetとLedger

| **文書**            | **役割**                             |
|---------------------|--------------------------------------|
| Cost Budget         | 許容上限・警告閾値・承認条件         |
| Cost Reservation    | 高額処理前に確保する予定額           |
| Actual Usage Ledger | 実際のToken、API料金、時間、試行回数 |
| Cost Reconciliation | 予約と実績の差分精算                 |

## 15.2 管理項目

| **項目**                            | **説明**     |
|-------------------------------------|--------------|
| token_input / token_output          | 入出力Token  |
| api_cost                            | 外部API費用  |
| attempt_count                       | 試行数       |
| elapsed_time                        | 処理時間     |
| human_review_time                   | 人の確認工数 |
| cost_by_role / phase / model / tool | 費用内訳     |
| soft_limit                          | 警告閾値     |
| hard_limit                          | 停止閾値     |

## 15.3 超過時

- Soft Limit：要約、分割、低コストモデル等を提案する。

- Hard Limit：新規処理を停止しOwner承認を求める。

- 品質・安全・独立審査を損なう自動節約は禁止する。

- 価格不明の外部処理は事前見積り不能としてPENDING承認へ送る。

# 第16章　Model Control

| **評価軸**            | **説明**                               |
|-----------------------|----------------------------------------|
| Capability            | 推論、コード、長文、音声・画像等の能力 |
| Context Capacity      | 必要Contextを保持できるか              |
| Tool Support          | 必要Tool・Connectorを利用できるか      |
| Privacy / Sensitivity | 機密データを扱える契約・環境か         |
| Reliability           | 失敗率、出力安定性                     |
| Independence          | Critic/Judgeの独立性を維持できるか     |
| Cost / Latency        | 費用と速度                             |
| Availability          | 利用可能性、Rate Limit                 |
| Deprecation Risk      | 提供終了・仕様変更リスク               |

## 16.1 Routing Result

- MODEL_ROUTE_READY

- MODEL_ROUTE_FALLBACK

- MODEL_ROUTE_ESCALATION_REQUIRED

- MODEL_ROUTE_NOT_CONFIRMED

- MODEL_ROUTE_BLOCKED

## 16.2 独立性

- Builderの内部会話をCritic/Judgeへ自動継承しない。

- Critic/Judgeは保存済みArtifactを基に独立評価する。

- 同一モデル利用時も別Session・別Prompt・独立Contextを使用する。

# 第17章　親子TASK・依存関係

| **関係**            | **意味**                 | **挙動**           |
|---------------------|--------------------------|--------------------|
| parent_task_id      | 上位Task                 | 子Task完了を集約   |
| dependency_task_ids | 開始前提Task             | 未完了ならBLOCKED  |
| blocks_task_ids     | このTaskが止めているTask | Status変更時に通知 |
| follow_up_task_ids  | 完了後の別Task           | 元Taskは再開しない |

- 循環依存を禁止する。

- 親Task COMPLETED条件に子Taskの必須完了条件を定義する。

- 依存TaskがCANCELLED/REJECTEDの場合、代替条件またはOwner判断を求める。

# 第18章　Role責務

| **Role**             | **責務**                                                                   |
|----------------------|----------------------------------------------------------------------------|
| Orchestrator         | Status/Phase/Gate/Authorization確認、Context/Cost/Model判定、Routing、停止 |
| Builder              | 実装・Handoff・Checkpoint・Rollback情報                                    |
| Tester               | 独立Verification、Persistent Process、Resume後再検証                       |
| Critic               | 遷移矛盾、適用漏れ、Lifecycle/Context/Cost/Model上の問題                   |
| Judge                | 設計・Final Plan・Implementationの拘束的判断                               |
| Project Policy Agent | Policy UPDATE/VERIFY、Closure/Archive入力、Status整合                      |
| Owner                | Task承認、重要認可、Emergency Stop、予算超過、Closure/Archive承認          |

**更新主体：**Roleは必ずしもCanonical Status Recordを直接編集しない。初期実装ではOrchestratorまたは専用Status Update処理を単一更新窓口とする。

# 第19章　成果物

| **成果物**                               | **内容**                                     |
|------------------------------------------|----------------------------------------------|
| lifecycle-specification.md               | Status、Phase、Gate、Authorization、遷移規則 |
| canonical-status-record.yaml             | 現在Snapshot                                 |
| transition-log.jsonl                     | 追記専用遷移履歴。JSONLは1行1JSONの履歴形式  |
| resume-checkpoint.yaml                   | 再開情報                                     |
| closure-readiness.md / closure-record.md | Closure判定と実施                            |
| archive-readiness.md / archive-record.md | Archive判定と実施                            |
| context-manifest.yaml                    | Context一覧と信頼境界                        |
| cost-budget.yaml / cost-ledger.jsonl     | 上限と実績                                   |
| model-routing.yaml                       | Model選択と理由                              |
| block-record.md / stall-handoff.md       | Block・Stall記録                             |

# 第20章　異常系とRecovery

| **異常**               | **処理**                             |
|------------------------|--------------------------------------|
| Revision Conflict      | 再読込し再提案。自動上書き禁止       |
| Lease残留              | 期限・Owner確認後解除                |
| VERIFY Failure         | Commitせず失敗Log。必要ならRollback  |
| StatusとArtifact不一致 | BLOCKED/NOT_CONFIRMEDでStatus Review |
| Context Injection      | UNTRUSTEDとして命令を無効化          |
| Checkpoint不一致       | Checkpoint無効化し再作成             |
| Cost Ledger欠落        | 新規有料処理停止                     |
| Model unavailable      | 許可済みFallbackまたはOwner判断      |
| Emergency Stop         | 新規副作用を停止しCheckpoint作成     |

# 第21章　移行方針

- TASK-001～003の既存Artifactは変更しない。

- TASK-004以降は新Statusモデルを完全適用する。

- TASK-003のClosure/Archiveは新Artifactを追加して補完する。

- 旧Result・旧Next Phase記述はHistorical Evidenceとして保持する。

- Current truthはCanonical Status Recordで示す。

# 第22章　受入基準

- StatusとPhaseを独立変更・検証できる。

- 不正な遷移とRevision競合を拒否できる。

- PAUSED/BLOCKED/STALLEDから正しい条件でResumeできる。

- Emergency Stopが即時に新規副作用を止める。

- Context内の未信頼命令が上位仕様を上書きしない。

- BudgetとActual Usageを照合できる。

- Model選択理由とFallback理由を説明できる。

- Closure時にプロセス・Secrets・未保存差分を確認できる。

- Archive前後Checksumと参照整合性が一致する。

- 親子・依存Taskの循環を検出できる。

# 第23章　採用・却下・保留

| **区分** | **事項**                            | **理由**                 |
|----------|-------------------------------------|--------------------------|
| 採用     | Status/Phase/Gate/Authorization分離 | 状態爆発と意味混同を防止 |
| 採用     | Snapshot＋Transition Log            | 現在値と監査履歴を両立   |
| 採用     | Revision＋Lease                     | 同時更新事故を防止       |
| 採用     | PAUSED/BLOCKED/STALLED分離          | 再開条件が異なる         |
| 採用     | Trust Boundary                      | 資料内命令の誤実行を防止 |
| 採用     | Budget＋Actual Ledger               | 予算だけでは実績監査不能 |
| 却下     | 工程ごとにLifecycle Statusを増やす  | 拡張時に状態数が爆発     |
| 却下     | last-write-wins                     | Agent同時更新で正本破壊  |
| 却下     | COMPLETEDを再開                     | 履歴の正本性を損なう     |
| 保留     | 専用Status Manager Agent            | TASK-006実装方式で判断   |
| 保留     | 物理Archive自動移動                 | 参照Index実装後          |

# 第24章　レビュー後の次工程

9.  本Ver.1.1をTASK-004 task.md作成の入力とする。

10. task.mdでは、まずPhase 1としてStatus/Phase/Gate/AuthorizationとTransition Protocolを対象にする。

11. Builder ProposalでYAML Schema、Transition Matrix、Lock/Lease方式を具体化する。

12. Criticは状態漏れ、循環、競合、権限、Recoveryを重点レビューする。

13. Judge承認後にFinal Planを作成する。

14. README・Common・Role・Templateの更新は承認済みFinal Planに従う。

# 第25章　添付資料統合による補完アーキテクチャ

本章は、TASK-004初版およびレビュー報告書に記載され、Ver.1.1本文では独立章として明示されていなかった非競合事項を補完する。Ver.1.1の直交モデルを優先し、初版の工程名をLifecycle Statusとして扱う旧モデルは採用しない。

## 25.1 レイヤー構造

| **層**                  | **主責務**                                                                     | **主な成果物**                                                   |
|-------------------------|--------------------------------------------------------------------------------|------------------------------------------------------------------|
| Role Layer              | 誰が何を行えるかを定義する。                                                   | Role Specification                                               |
| Workflow Layer          | 通常工程の順序とGateを定義する。                                               | Workflow Specification                                           |
| Lifecycle Control Layer | Status・Phase・Gate・Authorization・遷移・Resume・Closure・Archiveを制御する。 | Lifecycle Specification／Canonical Status Record／Transition Log |
| Context Control Layer   | 必要情報の選択・信頼境界・重複・Freshness・無効化を制御する。                  | Context Manifest／Context Check                                  |
| Cost Control Layer      | 費用上限・予約・実績・精算を管理する。                                         | Cost Budget／Reservation／Actual Usage Ledger                    |
| Model Control Layer     | 能力・機密性・Tool・独立性・費用・可用性に基づくModel選択を管理する。          | Model Routing Record                                             |

## 25.2 Timeout・Heartbeat・STALLED判定

- 長時間処理は、開始時刻、最終進捗時刻、Heartbeat、期待完了時刻、実行主体を記録する。

- Heartbeat欠落またはTimeout超過だけで直ちに失敗扱いにせず、実行プロセス、外部依存、成果物更新有無を確認する。

- 進捗が停止していると確認された場合はSTALLEDとし、last_progress_at、attempted_actions、running_processes、必要なHandoffを記録する。

- STALLEDからの再開は、環境復旧、仮説変更、または明示的HandoffのEvidenceを必要とする。

## 25.3 Irreversible Actionの事前承認

- 公開、削除、外部送信、課金、外部状態変更など、完全Rollbackできない操作は実行前に明示的なAuthorizationを必要とする。

- 事前記録には、対象、影響、取消可能性、Compensating Action、費用、承認者、実行者を含める。

- 事前承認がない場合はGate PASSであっても実行してはならない。

# 第26章　TASK-004とTASK-005の責務境界

TASK-004／TASK-005責務境界・統合設計レビュー Ver.1.0の確定事項を統合する。TASK-004は「Taskを安全に進めるOS」、TASK-005は「Knowledgeを安全に管理・適用するOS」として分離する。

## 26.1 最終責務定義

| **対象**           | **主責務**                                                                                                                                                    | **禁止される越境**                                                       |
|--------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------|
| TASK-004           | Task Lifecycle、Status、Phase、Gate、Authorization、Resume、Rollback、Closure、Archive、Context、Cost、Modelを管理する。                                      | Knowledge Assetの内容・Score・Promotion・Revisionを独自に確定しない。    |
| TASK-005           | Knowledge Asset、Taxonomy、Graph、Registry、Revision、Resolution、Knowledge Pack、Application、Verification、Promotion、Demotion、Impact Analysisを管理する。 | Task Lifecycleの正式状態を変更しない。Context Manifest全体を生成しない。 |
| Workspace Registry | Workspace内の資産の所在、種類、Version、Status、Canonical参照、Checksumを索引する。                                                                           | Task Status、Knowledge本文、Role権限、Artifact本文の正本を置き換えない。 |

## 26.2 境界原則

- TASK-005はKnowledge Packを生成するが、Context Manifest全体はTASK-004が管理する。

- TASK-004はKnowledge PackをContext Sourceの一つとして採用・除外・参照する。

- Task ClosureはTASK-004が判定し、Knowledge Candidateの有無と引渡し結果を入力として利用する。

- Knowledge AssetのACTIVE化、INVALID化、Promotion、DemotionはTASK-005のGovernanceが管理する。

- Knowledge AssetがINVALIDになってもTask Statusを自動変更しない。重大影響は通知し、TASK-004がBLOCKEDまたはFollow-up Task化を判断する。

- TaskがARCHIVEDされても、そのTask由来Knowledge Assetは独立Lifecycleを継続できる。

## 26.3 Responsibility Matrix（主要項目）

| **機能**                                | **TASK-004**         | **TASK-005**                   | **Workspace Registry** |
|-----------------------------------------|----------------------|--------------------------------|------------------------|
| Active Project／Active Task             | 主責務               | 参照                           | 索引                   |
| Task Lifecycle Status                   | 主責務               | 参照                           | 所在・版               |
| Canonical Status Record／Transition Log | 主責務               | 参照                           | 所在・版               |
| Resume／Rollback                        | 主責務               | Knowledge Pack再解決条件を参照 | 所在                   |
| Closure／Archive                        | 主責務               | Candidate・Impact状態を提供    | 所在                   |
| Context Manifest                        | 主責務               | Knowledge Packを入力提供       | 所在・版               |
| Cost Budget／Usage Ledger               | 主責務               | Resolution費用を記録           | 所在                   |
| Model Routing                           | 主責務               | 必要能力を通知                 | 所在                   |
| Knowledge Asset／Revision／Status       | 参照                 | 主責務                         | 所在・版               |
| Knowledge Resolution                    | 呼出・結果受領       | 主責務                         | Resolver所在           |
| Knowledge Pack                          | Contextへ統合        | 主責務                         | 所在・版               |
| Candidate抽出                           | 引渡しタイミング管理 | 内容管理・審査                 | 所在                   |

# 第27章　Context ManifestとKnowledge Packの統合インターフェース

## 27.1 正式処理順序

15. TASK-004がActive Task、Role、Current Phase、Context Budget、Sensitivity、Tool Versionを確定する。

16. TASK-004がKnowledge Resolution Requestを作成し、TASK-005へ渡す。

17. TASK-005がRegistry、Taxonomy、Graph、Status、Version、Trustを基にResolutionを実行する。

18. TASK-005がKnowledge PackとResolution Resultを返す。

19. TASK-004がKnowledge PackをContext Manifestの一Sourceとして登録する。

20. TASK-004がCanonical Specification、Task Artifact、External Referenceと統合する。

21. TASK-004がTrust Boundary、重複、Token、機密性、Freshnessを最終確認する。

22. Context Manifestを基にRole Promptまたは実行Contextを構築する。

## 27.2 禁止する逆転

- TASK-005がAGENTS、PROJECT、Task Artifactを含むContext Manifest全体を生成してはならない。

- TASK-004がKnowledge AssetのScore、Promotion、Revision選択を独自実装してはならない。

- Knowledge PackをContext Manifestの監査を迂回してRole Promptへ直接投入してはならない。

## 27.3 統合インターフェース

| **インターフェース**          | **送信元** | **送信先** | **必須内容**                                                                   |
|-------------------------------|------------|------------|--------------------------------------------------------------------------------|
| Knowledge Resolution Request  | TASK-004   | TASK-005   | Task／Role／Phase、Scope、Tool Version、Environment、Sensitivity、Token Budget |
| Knowledge Resolution Result   | TASK-005   | TASK-004   | Result、Pack ID、選択Revision、除外理由、Conflict、Trust、Cost                 |
| Knowledge Candidate Handoff   | TASK-004   | TASK-005   | Source Task、Evidence、Candidate概要、Sensitivity、Closure影響                 |
| Knowledge Impact Notification | TASK-005   | TASK-004   | Invalid Asset、影響Task／Artifact、Severity、再確認要求                        |

# 第28章　Workspace Registryの位置づけ

Workspace Registryは、Workspace全体の資産を発見するための機械可読な索引であり、各資産内容の正本ではない。

## 28.1 管理対象

- Project Index：Project ID、Root、PROJECT.md、Status Record。

- Task Index：Task ID、Project、Status Record、Parent／Dependency。

- Specification Index：Common、Role、Lifecycle、Knowledge等のCanonical Path。

- Template Index：Template名、対応Artifact、Version、Path。

- Artifact Index：Artifact Type、Task、Authoring Role、Path、Checksum。

- Knowledge Index：Repository、Vocabulary、Graph、Asset Current Revisionへの参照。

- Role Index：Role名、Specification Path、利用可能Tool・権限。

## 28.2 管理しない対象

- Taskの正式状態そのもの。Canonical Status Recordが正本である。

- Knowledge本文・状態そのもの。Knowledge Asset Current Revisionが正本である。

- Role権限の詳細。Role Specificationが正本である。

- Artifact本文。各Artifactファイルが正本である。

## 28.3 実施時期の設計案

責務境界レビューでは、Workspace RegistryをTASK-006のPhase 1として設計・実装し、その後にAutomation Engineへ進む案を推奨している。これは本統合版に含まれる設計案であり、実装済みを意味しない。

# 第29章　レビュー指摘の反映確認

## 29.1 必須修正事項 M-01〜M-12

| **ID** | **指摘**                                      | **統合版での反映先** | **判定** |
|--------|-----------------------------------------------|----------------------|----------|
| M-01   | Lifecycle StatusとPhaseの分離                 | 第2〜6章             | 反映済み |
| M-02   | Canonical Status RecordとTransition Logの分離 | 第7〜8章             | 反映済み |
| M-03   | Revision・Leaseによる同時更新制御             | 第8章                | 反映済み |
| M-04   | 原子的更新とVERIFY                            | 第8章                | 反映済み |
| M-05   | PAUSED／BLOCKED／STALLEDの区別                | 第4・9章             | 反映済み |
| M-06   | Context Trust Boundary                        | 第14章               | 反映済み |
| M-07   | BudgetとActual Usage Ledgerの分離             | 第15章               | 反映済み |
| M-08   | Model Routingの安全条件                       | 第16章               | 反映済み |
| M-09   | Closure時の資源解放確認                       | 第12章               | 反映済み |
| M-10   | Archive参照整合性とChecksum                   | 第13章               | 反映済み |
| M-11   | 親子TASK・依存TASK                            | 第17章               | 反映済み |
| M-12   | Manual Override／Emergency Stop               | 第9章                | 反映済み |

## 29.2 強化事項 E-01〜E-08

| **ID** | **強化事項**                  | **統合版での反映先** | **判定**       |
|--------|-------------------------------|----------------------|----------------|
| E-01   | Phase Entry／Exit Actions     | 第5章                | 反映済み       |
| E-02   | Timeout／Heartbeat            | 第25章25.2           | 本統合版で補完 |
| E-03   | Checkpoint有効期限・無効化    | 第10章               | 反映済み       |
| E-04   | Irreversible Actionの事前承認 | 第25章25.3           | 本統合版で補完 |
| E-05   | Role Independence             | 第16章16.2           | 反映済み       |
| E-06   | Context Invalidation          | 第14章14.3           | 反映済み       |
| E-07   | Cost Reservation              | 第15章               | 反映済み       |
| E-08   | Model Deprecation             | 第16章の評価軸       | 反映済み       |

# 第30章　統合根拠・版選定・非採用事項

## 30.1 添付資料の時系列と役割

| **資料**                                              | **役割**                                                    | **採否**           | **統合方針**                                                            |
|-------------------------------------------------------|-------------------------------------------------------------|--------------------|-------------------------------------------------------------------------|
| TASK-004 詳細設計書 初版                              | 最初の統合設計。Lifecycle工程を状態名へ含む旧モデルを採用。 | 一部採用           | レイヤー構造・設計原則等の非競合事項だけを継承。旧状態モデルは不採用。  |
| TASK-004 詳細設計書レビュー報告書 Ver.1.0             | 初版の必須修正M-01〜M-12、強化E-01〜E-08を提示。            | 採用               | Ver.1.1への反映を確認し、未明示だったE-02・E-04を補完。                 |
| TASK-004 詳細設計書 Ver.1.1 レビュー反映版            | 直交モデル、監査履歴、同時更新、Pause／Stall等を反映。      | 本文基盤として採用 | 本統合版の主要本文と表を継承。                                          |
| TASK-004／TASK-005 責務境界・統合設計レビュー Ver.1.0 | 責務分離、Data Flow、Workspace Registry前提を確定。         | 採用               | TASK-004に関係する境界・Interface・Registry位置づけを第26〜28章へ統合。 |
| TASK-005 詳細設計書 初版／Ver.1.1                     | Knowledge側の詳細設計。                                     | 参照のみ           | TASK-004へKnowledge内部Schemaを重複統合せず、責務境界確認にのみ使用。   |

## 30.2 最新版の判定

- TASK-004単体設計の本文基盤は、レビュー必須修正を反映したVer.1.1レビュー反映版とする。

- ただし、Ver.1.1作成後に責務境界レビューで確定したTASK-005連携とWorkspace Registryの位置づけは、Ver.1.1単体には含まれていないため本統合版で補完する。

- ファイルサイズの大小は版の新旧を示さない。章構成、レビュー反映状況、責務境界確定内容を基準に判定する。

## 30.3 明示的に統合しない内容

- 初版の工程名とLifecycle Statusを一体化した状態モデル。Ver.1.1の直交モデルにより置換済みである。

- TASK-005のKnowledge Asset Schema、Resolution Algorithm、Governanceの詳細。TASK-005の責務として保持する。

- 添付資料に含まれない後続の実装結果、Fix Cycle、Test結果、現在進行中のDocumentation Synchronization。

- 将来の自動化について、添付資料を超える新規決定や実装済み表現。

# 付録A　版履歴

| **版**  | **位置づけ**   | **主な変更**                                                                                          | **状態** |
|---------|----------------|-------------------------------------------------------------------------------------------------------|----------|
| 初版    | 初期統合設計   | Lifecycle・Closure・Archive・Resume・Context・Cost・Modelを統合                                       | 履歴     |
| Ver.1.1 | レビュー反映版 | Status／Phase／Gate／Authorization分離、Transition Log、Lease、Pause／Stall、Trust、Cost Ledger等     | 本文基盤 |
| Ver.1.2 | 添付資料統合版 | レビュー未明示強化事項、TASK-005責務境界、統合Interface、Workspace Registry位置づけ、反映確認表を統合 | 本書     |


# Part II — Ver.1.3 Current State Integration

## 31. Implemented Phase 1 Artifacts

The following Phase 1 artifacts and controls are approved and implemented within the tested WSL2/ext4 boundary: Canonical Status Record, append-only Transition Log, Transaction Journal, Lease, transaction directory, migration mapping, three-actor attribution, fencing, authorization enforcement, and evidence enforcement.

## 32. Journal State Model

```text
PREPARED → APPLIED → VERIFIED → COMMITTED
                 ↘
                  RECOVERY_REQUIRED

Terminal states: ABORTED, SUPERSEDED
```

| State | Meaning | Allowed next states | Prohibited / Safe Stop |
|---|---|---|---|
| `PREPARED` | Journal persisted before snapshot application | `APPLIED`, `ABORTED`, `RECOVERY_REQUIRED` | direct `COMMITTED` |
| `APPLIED` | Snapshot applied; durable event sequence pending | `VERIFIED`, `ABORTED`, `RECOVERY_REQUIRED` | direct `COMMITTED` |
| `VERIFIED` | Exact event, checksum chain, identity, revision, and acknowledgement verified | `COMMITTED`, `RECOVERY_REQUIRED` | cleanup before commit |
| `COMMITTED` | Durable completion acknowledgement persisted | terminal cleanup permitted | return to `PREPARED` |
| `ABORTED` / `SUPERSEDED` | terminal non-commit outcome | terminal | recovery commit without authorization |
| `RECOVERY_REQUIRED` | commit state unknown or evidence incomplete | owner-authorized idempotent recovery only | inferred repair or commit |

Normal transition MUST follow the displayed sequence. `APPLIED → COMMITTED` is forbidden. Inconsistent state, unknown acknowledgement, or missing evidence MUST Safe Stop without writes. Journal and Lease cleanup MUST occur only after `COMMITTED`.

## 33. Durable Commit Protocol

1. Create Snapshot candidate.
2. Persist Journal `PREPARED`.
3. Apply Snapshot.
4. Persist Journal `APPLIED`.
5. Append Event.
6. Synchronize Event Log file.
7. Synchronize Event Log directory.
8. Re-read Event exactly.
9. Verify checksum chain, `transition_id`, and `resulting_revision`.
10. Persist durable acknowledgement.
11. Persist Journal `VERIFIED`.
12. Persist Journal `COMMITTED`.
13. Only then clean up Journal and Lease.

Every step MUST be ordered and evidenced. The presence of an Event alone MUST NOT imply durability. Failure before Snapshot replacement MUST abort safely; uncertainty after Snapshot replacement MUST retain evidence and return `COMMIT_STATE_UNKNOWN` / `RECOVERY_REQUIRED`.

## 34. Event Durability Acknowledgement

The acknowledgement MUST contain `transition_id`, `entry_checksum`, `resulting_revision`, `event_appended`, `log_file_synced`, `log_directory_synced`, and `event_verified`.

- Each acknowledgement stage MUST be the Boolean value `true`; the string `"true"` is invalid.
- Identity fields MUST exactly match Journal, Event, and Snapshot.
- `resulting_revision` MUST exactly match the resulting Snapshot revision.
- Out-of-order acknowledgement, unknown fields, malformed types, missing fields, and impossible combinations MUST be rejected or Safe Stop.
- No Role may infer durability from Event existence alone.

## 35. Recovery Authority and No-write Safe Stop

`COMMIT_STATE_UNKNOWN` MUST preserve the Journal, Lease, Snapshot, Event, and temporary Event evidence. The state is `RECOVERY_REQUIRED` until Recovery Authority is present.

MUST NOT: guess a repair, infer a commit, append a duplicate Event, increment a revision twice, delete retained evidence, or execute a recovery commit without authorization.

Idempotent recovery is permitted only after complete acknowledgement and exact identity correlation. Recovery Authority is mandatory before leaving `RECOVERY_REQUIRED`.

## 36. D-01 through D-06 Closure

| Requirement | Design | Implementation | Verification | Status |
|---|---|---|---|---|
| D-01 Authorization / Evidence enforcement | Approved | Enforced at mutation boundary | Independent regression | `CLOSED` |
| D-02 Superseded transaction / Fencing | Approved | Revision conflict and fencing protection | Independent regression | `CLOSED` |
| D-03 PREPARED recovery / Lease cleanup | Approved | Safe recovery and bounded cleanup | Independent regression | `CLOSED` |
| D-04 task_id validation | Approved | Strict task/schema validation | Independent regression | `CLOSED` |
| D-05 VERIFY failure cleanup / Crash Recovery | Approved | Durable acknowledgement and retained-evidence Safe Stop | 88 tests and probes | `CLOSED` |
| D-06 Append-only / Tamper / Duplicate / Migration Validation | Approved | Chain, duplicate, tamper, and mapping validation | 88 tests and probes | `CLOSED` |

## 37. High Finding Closure

| Finding | Closure | Status |
|---|---|---|
| IC4-01 | File and directory synchronization, exact re-read, retained evidence on uncertainty | `CLOSED` |
| IC5-01 | Event existence alone is insufficient; complete acknowledgement and exact identity are required | `CLOSED` |
| IC6-01 | Literal Boolean acknowledgement stages, strict field schema, exact identity, and impossible-order rejection | `CLOSED` |

## 38. Verification Evidence

```yaml
verification:
  full_tests:
    passed: 88
    failed: 0
  independent_probes:
    passed: 23
    failed: 0
  implementation_review: IMPLEMENTATION_PASS
  final_judgment: IMPLEMENTATION_APPROVED
  project_policy: POLICY_PASS_WITH_CONDITIONS
  critical: 0
  high: 0
  baseline_commit: 3ce360ba5cef063cd046d88ce007d42c0b54a275
```

## 39. Residual Risk

Residual risks are not Critical or High closure items: Node versions other than v24.18.0; observed verification difference with Node v26.4.0; non-WSL2 environments; non-ext4 or different filesystems; physical power loss; device persistence barriers; distributed transactions; and unverified platforms or runtimes. Outside the evidence boundary, the system MUST Safe Stop rather than infer persistence or recovery.

## 40. Runtime Lessons Learned

Inline Chat is a Linux runtime; Agent Window is a Windows-host runtime. Runtime Probe MUST occur before Role Activation. Environment MUST NOT be inferred from UI or prior sessions. Workspace Environment and Agent Runtime are distinct. Linux-native Tasks MUST use Inline Chat, and shell dialect MUST follow the resolved runtime.

## 41. Evidence Classification

| Class | Rule |
|---|---|
| Historical Evidence | immutable decision, plan, report, review, or judgment |
| Worktree Evidence | readable local evidence; may be tracked or untracked |
| Generated Evidence | output produced by a verified procedure |
| Transient Evidence | runtime output requiring preservation before it expires |
| Registry Record | index only; not content authority |
| Runtime State | current process/environment observation; not a durable decision |
| Tracked / Untracked / Staged / Unstaged | Git/worktree classifications that MUST NOT be conflated with existence or authority |

Untracked Evidence MUST NOT be treated as nonexistent.

## 42. Machine Requirements and Acceptance Criteria

This document MUST state authority, inputs, outputs, preconditions, postconditions, state, transition, invariants, MUST/MUST NOT/SHOULD rules, error codes, Safe Stop, evidence requirements, authorization requirements, recovery authority, acceptance criteria, residual risk, and document references.

Error codes include `COMMIT_STATE_UNKNOWN`, `RECOVERY_REQUIRED`, and `DOCUMENT_CONSISTENCY_UNKNOWN`. A failed consistency, unreadable baseline, unknown state, or authority gap MUST cause a no-write Safe Stop. Acceptance requires all D-01 through D-06 and IC4-01 through IC6-01 `CLOSED`, verification `88 PASS / 0 FAIL` and `23 / 23 PASS`, Critical/High `0/0`, baseline commit and coverage evidence references, and matching document identity across the document set.

## Inherited Ver.1.3 Canonical Promotion Record

- Promotion status: `CURRENT_CANONICAL`
- Promotion effective date: `2026-07-31`
- Promotion authority: Owner (`AUTHORIZED`)
- Cross-format consistency result: `CROSS_FORMAT_CONSISTENCY_PASS`
- Critical / High: `0 / 0`
- Consistency evidence: `/home/baisound/bai-development-os/tasks/TASK-004/cross-format-consistency-check.md`
- Registry synchronization: `IN_PROGRESS`
- Commit / Push / Tag / Release: `NOT_EXECUTED`
- Completion Review / Archive: `NOT_STARTED`

## 43. Inherited Version History

| Version | Status | Change |
|---|---|---|
| 1.2 | Historical immutable attachment baseline | Integrated lifecycle design and TASK-005 boundary |
| 1.3 | `CURRENT_CANONICAL` | Adds approved Phase 1 implementation, durability, recovery, verification, runtime, and evidence-classification knowledge |


# Part III — Ver.1.4 Product Extraction & Adaptive Development Integration

## 44. TASK-004 Canonical Ownership

TASK-004 is an OS-product Task. Its canonical root is `/home/baisound/bai-development-os/tasks/TASK-004`. The former location below `javascript-roulette/docs/ai-team/tasks/TASK-004` is historical provenance only. New TASK-004 artifacts MUST be created in the standalone OS repository.

## 45. Product/Consumer Trust Boundary

The Lifecycle Foundation distinguishes Workspace Root `/home/baisound`, OS Product Root `/home/baisound/bai-development-os`, and Consumer Project Root `/home/baisound/projects/<consumer>`. A consumer MUST NOT become canonical owner of shared OS code. Historical path references inside immutable Evidence are not operational authority.

## 46. Adaptive Development Profile Integration

Profiles are `DEV_0_QUICK`, `DEV_1_LIGHT`, `DEV_2_STANDARD`, `DEV_3_HIGH_ASSURANCE`, and `DEV_4_FOUNDATION_CRITICAL`. Inputs include system scale, feature scale, criticality, failure impact, breadth, reversibility, novelty, and high-risk boundaries.

The profile controls design depth, Critic/Tester/Judge requirements, test classes/density, evidence depth, review-cycle cap, and localized revalidation scope.

Safety invariants:
1. `CORE` work MUST be at least DEV-3.
2. `FOUNDATION` or `CRITICAL` work MUST be DEV-4.
3. Token/cost optimization MUST NOT waive required safety/security/authorization/state/migration/recovery/boundary/integration/regression testing.
4. Low-risk work SHOULD NOT receive foundation-level ceremony.
5. Local remediation SHOULD re-run impacted gates/tests plus profile-required regression.
6. This does not change permanent model-routing policy.

## 47. Extraction Verification Baseline

- OS tests: `134 PASS / 0 FAIL`
- Boundary check: `BOUNDARY_CHECK_PASS`
- Reference consumer tests: `10 PASS / 0 FAIL`
- Reference consumer build: `PASS`
- Registry at extraction verification: `0 missing / 0 hash-or-size mismatches`

These results do not authorize a later Phase and do not mean TASK-004 overall Completion, Closure, or Archive.

## 48. Documentation and Registry Invariants

Current Lifecycle Foundation triplet:

- Human: `/home/baisound/bai-development-os/specifications/TASK-004_BAI_Development_OS_Lifecycle_Foundation_Ver1.4.docx`
- Machine: `/home/baisound/bai-development-os/specifications/TASK-004_BAI_Development_OS_Lifecycle_Foundation_Ver1.4.md`
- Summary: `/home/baisound/bai-development-os/specifications/TASK-004_BAI_Development_OS_Lifecycle_Foundation_Ver1.4.summary.md`

Ver.1.3 remains a superseded historical canonical baseline. DOCX/MD/Summary/Registry mismatch causes `DOCUMENT_CONSISTENCY_UNKNOWN` and no-write Safe Stop.

## Ver.1.4 Canonical Promotion Record

- Status: `CURRENT_CANONICAL`
- Effective date: `2026-08-08`
- Authority: Owner-directed repository/product extraction
- Supersedes: Lifecycle Foundation Ver.1.3
- Consistency evidence: `/home/baisound/bai-development-os/tasks/TASK-004/product-extraction-documentation-consistency-check.md`
- Registry: `CURRENT_AFTER_PRODUCT_EXTRACTION`
- Commit / Push / Tag / Release: `NOT_EXECUTED`

## 49. Version History

| Version | Status | Change |
|---|---|---|
| 1.2 | Historical immutable baseline | Integrated lifecycle design and TASK-005 boundary |
| 1.3 | Superseded canonical baseline | Phase 1 implementation, durability, recovery, runtime, evidence classification |
| 1.4 | `CURRENT_CANONICAL` | Standalone product ownership, consumer boundary, adaptive profiles and extraction verification |

# Part IV — Phase 1.6–1.8 Foundation Milestone

This Part supersedes earlier current-state statements that Phase 1.6 is not started. It does not rewrite historical authorization/review Evidence and does not mark TASK-004 overall complete.

## 47. Milestone status

| Phase | Result | Completion boundary |
| --- | --- | --- |
| 1.6 Foundation Guard | `TECHNICALLY_COMPLETED_MVP` | R1 complete Permit matrix, R2 complete TOCTOU matrix, R3 Activation Entry Registry, R4 Foundation-wide Gateway enforcement. |
| 1.7 Cost Guard | `TECHNICALLY_COMPLETED_MVP` | Task/Role/Session reservation + actual ledger, Soft/Hard budget, atomic concurrency boundary. |
| 1.8 Execution Budget | `TECHNICALLY_COMPLETED_MVP` | Retry, review depth, artifact size, per-call model cost, Quota/Billing Hard Stop. |
| TASK-004 overall | `ACTIVE` | Phase 2 onward remains. |

## 48. Foundation activation contract

A governed activation MUST have a classified Activation Entry and a persisted canonical Permit. The Permit MUST bind requester identity, phase, scope, correlation ID, registry identity, and Task/Phase state identity. Registry and Task/Phase state MUST be revalidated immediately before use. Durable Foundation audit MUST succeed before Gateway consumption and internal runtime handoff.

Unknown/unregistered entry, state mutation, registry mutation, Permit mutation/unknown/revoked/expired/consumed state, unsupported Permit version, invalid clock, ledger uncertainty, audit uncertainty, or direct-executor bypass MUST fail closed.

The operational Foundation Guard state is not Canonical Lifecycle state and MUST NOT create a Transition Log entry by itself.

## 49. Cost Guard contract

### 49.1 Budget scopes

Task, Role, and Session budgets are independently evaluated for input tokens, output tokens, and micro-USD cost.

### 49.2 Reservation protocol

Before an expensive execution:

1. validate budget and binding;
2. read verified Cost Ledger;
3. include Actual + active reservations in projected usage;
4. decide PASS / SOFT_LIMIT / HARD_STOP;
5. if executable, append `RESERVATION_CREATED` in the same exclusive ledger transaction;
6. after execution, append exactly one `ACTUAL_RECORDED` or `RESERVATION_RELEASED` terminal event.

Two concurrent reservations MUST NOT both overcommit the same budget. Two concurrent settlement attempts MUST NOT create two terminal outcomes.

### 49.3 Failure behavior

Malformed budget/usage/binding, ledger corruption, write/read uncertainty, or hard-budget excess is fail-closed. A lock conflict is currently a safe failure; lock lease recovery is later hardening.

## 50. Phase 1.8 execution-depth contract

Execution control evaluates retry attempts, review cycles, artifact bytes, per-call model cost, and Quota/Billing failures.

- values above hard limits -> `HARD_STOP`;
- values at the exact hard limit -> executable;
- values near limits -> `SOFT_LIMIT`;
- Quota/Billing error -> no blind automatic retry;
- Adaptive Development Profile may tighten review-cycle cap;
- permanent model-selection policy -> `UNCHANGED`.

This mechanism exists to prevent both under-governance and governance/token overuse. CORE work is never downgraded below its Adaptive Development Governance safety floor merely to save tokens.

## 51. Evidence and review

Binding implementation evidence:

- `phase1.6-foundation-guard-final-plan.md`
- `phase1.6-foundation-guard-implementation-and-verification.md`
- `phase1.7-cost-guard-final-plan.md`
- `phase1.7-cost-guard-implementation-and-verification.md`
- `phase1.8-execution-budget-final-plan.md`
- `phase1.8-execution-budget-implementation-and-verification.md`
- `phase1.6-to-1.8-final-verification.md`
- `phase1.6-to-1.8-completion-record.md`

Critic-oriented review in the implementation run identified and remediated two blocking defects before completion: weak persisted Permit canonical identity verification and a Cost reservation overcommit race.

## 52. Next lifecycle boundary

The next planned TASK-004 scope is Phase 2: Checkpoint / Pause / Block / Stall / Resume / Rollback. Phase 1.6–1.8 completion does not itself authorize Phase 2 and does not imply Closure or Archive eligibility.

