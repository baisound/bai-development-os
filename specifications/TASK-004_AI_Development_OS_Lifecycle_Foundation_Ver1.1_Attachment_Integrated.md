<!--
AI-readable canonical copy generated from the adjacent DOCX.
Source file: TASK-004_AI_Development_OS_Lifecycle_Foundation_Φ⌐│τ┤░Φ¿¡Φ¿êµ¢╕_Ver1.1_πâ¼πâôπâÑπâ╝σÅìµÿáτëê.docx
Source SHA-256: 895eb9126b7365ebc600944fe5a17c2b0fc4d02aadeb7d5c9c25cc1230419cf9
The DOCX remains the human-readable copy. Verify both copies when content differs.
-->

# TASK-004 詳細設計書 Ver.1.1

レビュー反映版：Lifecycle Foundation／Status・Phase・Gate・Authorizationの分離設計

| 項目 | 内容 |
| --- | --- |
| 対象 | AI Development OS TASK-004 |
| 前提 | AI Development OS v2.1 Alpha |
| 状態 | レビュー反映設計案。task.md作成前の基礎仕様 |
| 目的 | 全自動化に耐えられる状態・再開・終了・Context・Cost・Model基盤を定義 |

# 第1章　目的・範囲・完成条件

目的：TASKの現在状態、現在工程、判定結果、認可状態を混同せず記録し、安全な進行・停止・再開・完了・Archiveを可能にする。

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

| 用語 | 説明 |
| --- | --- |
| Task Lifecycle Status | TASK全体の生存・進行可能性を示す。DRAFT、ACTIVE、PAUSED等。 |
| Current Phase | 現在実施中または待機中の工程。DESIGN、TESTING等。 |
| Gate Status | 次工程へ進む条件の判定状態。PASS、NOT_READY等。 |
| Authorization Status | 実行認可の状態。AUTHORIZED、PENDING等。 |
| Orthogonal Model／直交モデル | 互いに別の意味を持つ値を一つの状態名へ混ぜず、独立フィールドで表す設計。 |
| Canonical Status Record | 現在値を示す正本Snapshot。 |
| Transition Log | 状態変更を追記専用で残す監査履歴。 |
| Revision | Status Recordの更新番号。競合更新防止に使う。 |
| Lease／一時更新権 | 特定Agentが短時間だけStatus更新権を保持する仕組み。 |
| Trust Boundary／信頼境界 | どの情報が命令として有効で、どの情報が参考資料に留まるかの境界。 |

# 第3章　全体データモデル

| 次元 | 主な値 | 意味 |
| --- | --- | --- |
| task_status | DRAFT / ACTIVE / PAUSED / BLOCKED / STALLED / COMPLETED / CANCELLED / REJECTED / ARCHIVED | TASK全体の状態 |
| current_phase | TASK_DEFINITION / DESIGN / FINAL_PLAN / IMPLEMENTATION_AUTHORIZATION / IMPLEMENTATION / TESTING / IMPLEMENTATION_REVIEW / FINAL_JUDGMENT / POLICY_REVIEW / CLOSURE / ARCHIVE | 現在工程 |
| gate_status | NOT_EVALUATED / READY / NOT_READY / PASS / FAIL / NOT_CONFIRMED / BLOCKED | 工程ゲート判定 |
| authorization_status | NOT_REQUIRED / PENDING / AUTHORIZED / DENIED / EXPIRED / REVOKED | 認可状態 |
| archive_status | NOT_ELIGIBLE / REVIEW_PENDING / READY / DEFERRED / ARCHIVED | Archive判定 |
| knowledge_handoff_status | NOT_EVALUATED / NONE / CANDIDATE_PRESENT / REVIEW_REQUIRED | TASK-005への受け口 |

採用理由：工程を状態名へ埋め込む方式より、状態数の爆発を防ぎ、Phase追加時もLifecycle Statusを変更せず拡張できる。

# 第4章　Task Lifecycle Status

| Status | 意味 | 進行可否 | 主な遷移 |
| --- | --- | --- | --- |
| DRAFT | Task定義が未承認 | 不可 | ACTIVE / CANCELLED |
| ACTIVE | 通常進行中 | 可 | PAUSED / BLOCKED / STALLED / COMPLETED / CANCELLED / REJECTED |
| PAUSED | Ownerまたは運用判断による意図的停止 | 不可 | ACTIVE / CANCELLED |
| BLOCKED | 外部条件・権限・Evidence不足で停止 | 不可 | ACTIVE / CANCELLED |
| STALLED | 処理は開始されたが進捗が止まった | 不可 | ACTIVE / BLOCKED / CANCELLED |
| COMPLETED | Closure Readinessを満たし完了 | 原則不可 | ARCHIVED |
| CANCELLED | Ownerが取消 | 不可 | 終端 |
| REJECTED | Judge等による最終却下 | 不可 | 終端。再設計は新Task |
| ARCHIVED | Archive ReadinessとVERIFY完了 | 不可 | 終端 |

## 4.1 状態不変条件

- COMPLETED、CANCELLED、REJECTED、ARCHIVEDを同じTask IDでACTIVEへ戻さない。

- 完了後の追加作業は新Task IDを作成する。

- PAUSEDは意図的停止、BLOCKEDは解除条件待ち、STALLEDは進捗停止として区別する。

- ARCHIVED後のEvidenceはread-onlyとする。

# 第5章　Current Phase

| Phase | 開始条件 | 主要成果物 | 終了条件 |
| --- | --- | --- | --- |
| TASK_DEFINITION | DRAFT | task.md | Owner承認 |
| DESIGN | ACTIVEかつTask定義済み | builder-proposal / critic-review / builder-response / judge-decision | Judge設計結果 |
| FINAL_PLAN | 設計承認済み | final-plan / consistency-check | FINAL_PLAN_PASS |
| IMPLEMENTATION_AUTHORIZATION | Final Plan PASS | authorization record | AUTHORIZEDまたはDENIED |
| IMPLEMENTATION | AUTHORIZED | implementation-reportまたはhandoff | Builder完了/停滞 |
| TESTING | 実装Evidence有り | test-report / retest-report | Tester Result |
| IMPLEMENTATION_REVIEW | Tester Evidence有り | implementation-review | Critic Result |
| FINAL_JUDGMENT | QA Evidence完備 | final-implementation-decision | Judge Result |
| POLICY_REVIEW | Implementation承認 | project-policy-review / policy verification | VERIFY PASS |
| CLOSURE | Policy完了 | closure-readiness / closure-record | COMPLETEDまたはBlock |
| ARCHIVE | COMPLETED | archive-readiness / archive-record | ARCHIVEDまたはDEFERRED |

## 5.1 Phase Entry／Exit Action

- Entry Action：必要Context Manifest、Budget、Authorization、担当Role、期待Artifactを作成する。

- Exit Action：Artifactの存在・Authoring Role・Result・未解決項目を確認し、Transition Proposalを作成する。

- Phase変更はGate PASSだけでなくCanonical Status更新VERIFYまで完了して成立する。

# 第6章　Gate StatusとAuthorization Status

| 分類 | 値 | 意味 |
| --- | --- | --- |
| Gate | NOT_EVALUATED | 未判定 |
| Gate | READY | 判定材料が揃った |
| Gate | NOT_READY | 材料不足 |
| Gate | PASS | 進行条件を満たす |
| Gate | FAIL | 確認された不合格 |
| Gate | NOT_CONFIRMED | Evidence不足で判断不能 |
| Gate | BLOCKED | 外部条件等で判定不能 |
| Authorization | NOT_REQUIRED | 認可不要 |
| Authorization | PENDING | 承認待ち |
| Authorization | AUTHORIZED | 認可済み |
| Authorization | DENIED | 拒否 |
| Authorization | EXPIRED | 期限切れ |
| Authorization | REVOKED | 撤回 |

重要：Gate PASSは実行認可と同義ではない。Final Plan PASS後でもAuthorizationがAUTHORIZEDになるまで実装不可。

# 第7章　Canonical Status Record

| 項目 | 説明 | 型 | 必須 |
| --- | --- | --- | --- |
| record_schema_version | Record形式の版 | string | 必須 |
| revision | 更新競合防止用の連番 | integer | 必須 |
| task_id | Task ID | string | 必須 |
| project_id | Project ID | string | 必須 |
| parent_task_id | 親Task。なければnull | string\|null | 必須 |
| dependency_task_ids | 前提Task一覧 | array | 必須 |
| task_status | Lifecycle Status | enum | 必須 |
| current_phase | Current Phase | enum | 必須 |
| gate_status | 現在Gate | enum | 必須 |
| authorization_status | 現在認可 | enum | 必須 |
| archive_status | Archive状態 | enum | 必須 |
| status_reason | 現在値の理由 | string | 必須 |
| entered_at | 現在Status/Phaseへ入った時刻 | datetime | 必須 |
| updated_by | 更新主体 | string | 必須 |
| authoritative_evidence | 根拠Artifact | array | 必須 |
| blocking_items | Block一覧 | array | 必須 |
| accepted_risks | Accepted Risk参照 | array | 必須 |
| next_eligible_phases | 次候補Phase | array | 必須 |
| checkpoint_reference | Resume Checkpoint | string\|null | 必須 |
| context_manifest_reference | Context Manifest | string | 必須 |
| cost_budget_reference | Budget | string\|null | 必須 |
| cost_ledger_reference | 実績Ledger | string\|null | 必須 |
| model_routing_reference | Model Routing | string\|null | 必須 |
| knowledge_handoff_status | Knowledge候補状態 | enum | 必須 |
| last_verified_at | 最終VERIFY時刻 | datetime | 必須 |
| verification_result | VERIFY結果 | enum | 必須 |
| content_checksum | 内容同一性確認値 | string | 必須 |

# 第8章　Transition Logと原子的更新

## 8.1 Transition Log

| 項目 | 説明 |
| --- | --- |
| transition_id | 遷移一意ID |
| expected_revision | 更新前に期待するRevision |
| from_status / from_phase | 変更前 |
| to_status / to_phase | 変更後 |
| proposal_by | 提案者 |
| authorized_by | 承認者 |
| applied_by | 適用者 |
| evidence | 根拠 |
| result | APPLIED / REJECTED / VERIFICATION_FAILED |
| created_at | 記録時刻 |

## 8.2 更新プロトコル

1. PREPARE：現在Recordとexpected_revisionを読み、変更案を作成する。

1. AUTHORIZE：必要な権限とOwner承認を確認する。

1. ACQUIRE LEASE：短時間の更新権を取得する。

1. APPLY：新Record候補とTransition Log候補を作成する。

1. VERIFY：Artifact、参照、Schema、遷移規則を検証する。

1. COMMIT：VERIFY PASS時のみRevisionを増やし正本化する。

1. RELEASE LEASE：更新権を解放する。

1. FAILURE：元Recordを保持し、失敗Logだけを追記する。

## 8.3 同時更新

- expected_revisionが一致しない更新はCONFLICTとして拒否する。

- Leaseには所有者と有効期限を持たせる。

- 期限切れLeaseはOwnerまたはRecovery規則で解除する。

- Statusファイルを単純なlast-write-winsで上書きしない。

# 第9章　Pause・Block・Stall・Emergency Stop

| 状態 | 発生例 | 必須記録 | 再開条件 |
| --- | --- | --- | --- |
| PAUSED | ユーザーが翌日再開、優先順位変更 | pause_reason / resume_after / checkpoint | Owner指示または予定時刻 |
| BLOCKED | 権限待ち、外部API停止、Evidence不足 | blocking_owner / required_condition | 条件解消とVERIFY |
| STALLED | 同じコマンド反復、プロセス応答なし | last_progress_at / attempted_actions | Handoff・仮説変更・環境復旧 |

## 9.1 Emergency Stop

- Ownerは理由を問わず自動進行を即時停止できる。

- 新規外部呼出し、書込、公開処理を停止する。

- 実行中処理は安全停止可能なら停止し、不可なら監視下で完了待ちする。

- StatusをPAUSEDまたはBLOCKEDへ変更しCheckpointを作成する。

- Emergency Stop解除には明示的なOwner指示が必要。

# 第10章　Resume Checkpoint

| 項目 | 説明 |
| --- | --- |
| checkpoint_id | Checkpoint ID |
| status_revision | 作成時Revision |
| saved_status / phase | 保存時状態 |
| last_completed_action | 最後の完了処理 |
| next_action | 次処理 |
| required_files | 再開必須ファイル |
| working_tree_state | Git branch、commit、dirty files |
| environment_fingerprint | OS、依存、Tool Version |
| running_processes | 起動プロセスと確認方法 |
| external_dependencies | 外部API・サービス状態 |
| authorization_snapshot | 認可の有効性 |
| budget_snapshot | 残予算 |
| unconfirmed_items | 未確認事項 |
| invalidation_triggers | Checkpoint無効化条件 |

## 10.1 Checkpoint無効化条件

- Canonical仕様またはFinal Planが更新された。

- Git branch/commitが変わった。

- 依存関係・Tool Version・外部API仕様が変わった。

- Authorizationが期限切れ・撤回された。

- Cost Budgetが変更された。

- Checkpointの有効期限を超えた。

# 第11章　Rollback

| 種別 | 復元対象 | 方式 | 不可逆性 |
| --- | --- | --- | --- |
| Code | 実装差分 | Git commit/revert/stash | 外部公開済み変更は補償処理 |
| Status | 誤Status/Phase | 新Revisionで復元 | 過去Logは削除不可 |
| Policy | 仕様・README | 承認済み旧版へ復元 | 利用済み影響を確認 |
| Archive | 移動・参照 | 復元＋Index修復 | 削除済み外部資産は別対応 |
| External Action | 公開・送信・課金 | Compensating Action | 完全Rollback不能の場合を明示 |

Compensating Action／補償処理：元に戻せない操作に対して、取消通知・逆操作・修正版公開などで影響を補う処理。

# 第12章　Closure Readiness

| 分類 | 確認事項 |
| --- | --- |
| Technical | 設計、Final Plan、実装、Tester、Critic、Judgeの有効Evidence |
| Quality | Critical/High未解決なし。例外は明示承認 |
| Policy | 必要UPDATEとVERIFY PASS |
| Status | Canonical Status Record最新、Transition Log整合 |
| Risk | Accepted Risk、Deferred、Resolvedを区別 |
| Follow-up | 延期作業は新Task候補 |
| Knowledge | Knowledge Candidateの有無と引渡し |
| Resources | 起動プロセス停止、Temporary file、Secrets、未保存差分確認 |
| Cost | Actual Usage確定、未精算費用なし |
| Owner | 必要な最終承認 |

## 12.1 Closure Result

- CLOSURE_READY

- CLOSURE_BLOCKED

- CLOSURE_NOT_CONFIRMED

- CLOSURE_NOT_APPLICABLE（CANCELLED/REJECTED等）

# 第13章　Archive Readiness

| 確認項目 | 内容 |
| --- | --- |
| Completion | Task StatusがCOMPLETED |
| Destination | Archive先またはIn-place方式 |
| Manifest | 対象ファイル・保持ファイル一覧 |
| Reference Integrity | リンク・Index・親子Task参照 |
| Checksum | 移動前後の内容同一性 |
| Knowledge Provenance | Knowledgeと元Evidenceの参照 |
| Retention | 保持期間と削除禁止条件 |
| Recovery | Archive Rollback手順 |
| Post-Archive VERIFY | 読取・参照・Checksum確認 |

初期推奨：Git tag/commitによるSnapshotとIn-place read-only化を優先し、物理移動は参照Index完成後に行う。

# 第14章　Context Control

## 14.1 Context Manifest

| 項目 | 説明 |
| --- | --- |
| manifest_id | Context一覧ID |
| status_revision | 対応するStatus Revision |
| role / phase | 対象RoleとPhase |
| required_sources | 必須ソース |
| optional_sources | 必要時ソース |
| excluded_sources | 除外ソースと理由 |
| source_priority | 正本優先順位 |
| trust_level | CANONICAL / TRUSTED / REFERENCE / UNTRUSTED |
| freshness | 作成日・更新日・再確認期限 |
| sensitivity | 機密区分 |
| token_estimate | 推定量 |
| summary_reference | 要約を使う場合の元参照 |
| content_checksum | 変更検知 |

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

| 文書 | 役割 |
| --- | --- |
| Cost Budget | 許容上限・警告閾値・承認条件 |
| Cost Reservation | 高額処理前に確保する予定額 |
| Actual Usage Ledger | 実際のToken、API料金、時間、試行回数 |
| Cost Reconciliation | 予約と実績の差分精算 |

## 15.2 管理項目

| 項目 | 説明 |
| --- | --- |
| token_input / token_output | 入出力Token |
| api_cost | 外部API費用 |
| attempt_count | 試行数 |
| elapsed_time | 処理時間 |
| human_review_time | 人の確認工数 |
| cost_by_role / phase / model / tool | 費用内訳 |
| soft_limit | 警告閾値 |
| hard_limit | 停止閾値 |

## 15.3 超過時

- Soft Limit：要約、分割、低コストモデル等を提案する。

- Hard Limit：新規処理を停止しOwner承認を求める。

- 品質・安全・独立審査を損なう自動節約は禁止する。

- 価格不明の外部処理は事前見積り不能としてPENDING承認へ送る。

# 第16章　Model Control

| 評価軸 | 説明 |
| --- | --- |
| Capability | 推論、コード、長文、音声・画像等の能力 |
| Context Capacity | 必要Contextを保持できるか |
| Tool Support | 必要Tool・Connectorを利用できるか |
| Privacy / Sensitivity | 機密データを扱える契約・環境か |
| Reliability | 失敗率、出力安定性 |
| Independence | Critic/Judgeの独立性を維持できるか |
| Cost / Latency | 費用と速度 |
| Availability | 利用可能性、Rate Limit |
| Deprecation Risk | 提供終了・仕様変更リスク |

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

| 関係 | 意味 | 挙動 |
| --- | --- | --- |
| parent_task_id | 上位Task | 子Task完了を集約 |
| dependency_task_ids | 開始前提Task | 未完了ならBLOCKED |
| blocks_task_ids | このTaskが止めているTask | Status変更時に通知 |
| follow_up_task_ids | 完了後の別Task | 元Taskは再開しない |

- 循環依存を禁止する。

- 親Task COMPLETED条件に子Taskの必須完了条件を定義する。

- 依存TaskがCANCELLED/REJECTEDの場合、代替条件またはOwner判断を求める。

# 第18章　Role責務

| Role | 責務 |
| --- | --- |
| Orchestrator | Status/Phase/Gate/Authorization確認、Context/Cost/Model判定、Routing、停止 |
| Builder | 実装・Handoff・Checkpoint・Rollback情報 |
| Tester | 独立Verification、Persistent Process、Resume後再検証 |
| Critic | 遷移矛盾、適用漏れ、Lifecycle/Context/Cost/Model上の問題 |
| Judge | 設計・Final Plan・Implementationの拘束的判断 |
| Project Policy Agent | Policy UPDATE/VERIFY、Closure/Archive入力、Status整合 |
| Owner | Task承認、重要認可、Emergency Stop、予算超過、Closure/Archive承認 |

更新主体：Roleは必ずしもCanonical Status Recordを直接編集しない。初期実装ではOrchestratorまたは専用Status Update処理を単一更新窓口とする。

# 第19章　成果物

| 成果物 | 内容 |
| --- | --- |
| lifecycle-specification.md | Status、Phase、Gate、Authorization、遷移規則 |
| canonical-status-record.yaml | 現在Snapshot |
| transition-log.jsonl | 追記専用遷移履歴。JSONLは1行1JSONの履歴形式 |
| resume-checkpoint.yaml | 再開情報 |
| closure-readiness.md / closure-record.md | Closure判定と実施 |
| archive-readiness.md / archive-record.md | Archive判定と実施 |
| context-manifest.yaml | Context一覧と信頼境界 |
| cost-budget.yaml / cost-ledger.jsonl | 上限と実績 |
| model-routing.yaml | Model選択と理由 |
| block-record.md / stall-handoff.md | Block・Stall記録 |

# 第20章　異常系とRecovery

| 異常 | 処理 |
| --- | --- |
| Revision Conflict | 再読込し再提案。自動上書き禁止 |
| Lease残留 | 期限・Owner確認後解除 |
| VERIFY Failure | Commitせず失敗Log。必要ならRollback |
| StatusとArtifact不一致 | BLOCKED/NOT_CONFIRMEDでStatus Review |
| Context Injection | UNTRUSTEDとして命令を無効化 |
| Checkpoint不一致 | Checkpoint無効化し再作成 |
| Cost Ledger欠落 | 新規有料処理停止 |
| Model unavailable | 許可済みFallbackまたはOwner判断 |
| Emergency Stop | 新規副作用を停止しCheckpoint作成 |

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

| 区分 | 事項 | 理由 |
| --- | --- | --- |
| 採用 | Status/Phase/Gate/Authorization分離 | 状態爆発と意味混同を防止 |
| 採用 | Snapshot＋Transition Log | 現在値と監査履歴を両立 |
| 採用 | Revision＋Lease | 同時更新事故を防止 |
| 採用 | PAUSED/BLOCKED/STALLED分離 | 再開条件が異なる |
| 採用 | Trust Boundary | 資料内命令の誤実行を防止 |
| 採用 | Budget＋Actual Ledger | 予算だけでは実績監査不能 |
| 却下 | 工程ごとにLifecycle Statusを増やす | 拡張時に状態数が爆発 |
| 却下 | last-write-wins | Agent同時更新で正本破壊 |
| 却下 | COMPLETEDを再開 | 履歴の正本性を損なう |
| 保留 | 専用Status Manager Agent | TASK-006実装方式で判断 |
| 保留 | 物理Archive自動移動 | 参照Index実装後 |

# 第24章　レビュー後の次工程

1. 本Ver.1.1をTASK-004 task.md作成の入力とする。

1. task.mdでは、まずPhase 1としてStatus/Phase/Gate/AuthorizationとTransition Protocolを対象にする。

1. Builder ProposalでYAML Schema、Transition Matrix、Lock/Lease方式を具体化する。

1. Criticは状態漏れ、循環、競合、権限、Recoveryを重点レビューする。

1. Judge承認後にFinal Planを作成する。

1. README・Common・Role・Templateの更新は承認済みFinal Planに従う。
