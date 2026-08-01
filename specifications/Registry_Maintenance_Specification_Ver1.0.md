# Registry Maintenance Specification Ver.1.0

## 1. Definition

- **Registry**: AI開発プロセスにおける軽量な文書探索・優先読込・整合性確認のためのメタデータと索引の集合（例: `document-registry.yaml`）。
- **Current State Snapshot**: 現在のワークフロー、タスクの進行状況、直近の決定事項を要約し、常に最新のEvidenceに基づいて維持される状態記録。
- **Task Summary**: 各タスクの成果物や履歴、最新の状態を簡潔にまとめたAI向けの要約文書。
- **Maintenance**: これらのRegistry、Current State、Summaryが実際の正本文書やEvidenceと矛盾しないよう、整合性と鮮度を維持するための一連の管理プロセス。

## 2. Purpose

### Registryの目的
- **管理するもの**: AIが低コストかつ迅速に必要なContextをロードするためのメタデータ（パス、ハッシュ、バージョン、推奨読込方針など）、現在の状態、および要約。
- **管理しないもの**: 正本文書（Canonical Source）の内容そのもの。Registry自体は正本ではない。
- **SummaryとCanonical Sourceの関係**: Summaryはナビゲーションおよび読込補助のための文書であり、正本における厳密な定義や判定条件を置き換えるものではない。Binding Decision（拘束力のある決定）を下す際は必ずCanonical Sourceを参照する。
- **Hashが保証するもの／保証しないもの**: SHA-256ハッシュの完全一致は「ファイル内容（バイト列）が変更されていないこと」を保証する。しかし、その内容が現在のアーキテクチャに対して正しいか、あるいは権限として妥当であるかは保証しない。

## 3. Architecture

### 3.1 管理対象
最低限、以下のファイル群をMaintenanceの対象とする。
- `document-registry.yaml`
- `current-state.md`
- `ai-context-pack.md`
- `context-loading-rules.md`
- `role-context-matrix.yaml`
- `operational-improvements.md`
- `workspace-verification.md`
- 各文書の `*.summary.md`
- 各TASKの `TASK-xxx.summary.md`

### 3.2 Authority Model
各ドキュメントの権限と優先順位（競合時の解決基準）を明確にする。
- **Canonical Source**: 全ての決定の正本となる一次ソース（主にMarkdown）。
- **Human-readable Copy**: 人間向けのコピー（DOCX等）。競合時はCanonical Sourceが優先される。
- **Machine-readable Canonical Copy**: AI向けに整形された正本。
- **Historical Evidence**: 過去に確定された変更不可の記録。これらが最新の正本と矛盾する場合、歴史的記録としての事実が最優先される。
- **Current State Snapshot**: 現在のワークフロー状態の正確な要約。実際のEvidenceからのみ生成される。
- **Summary**: 読込補助。競合時はCanonical Sourceが優先される。
- **Registry Entry**: 索引およびキャッシュ管理用。権限は最も低い。

**競合時の優先順位**:
`Historical Evidence` >= `Canonical Source` > `Current State Snapshot` > `Summary` > `Registry Entry`

### 3.3 Staleness Model
RegistryエントリやSummaryの鮮度（Staleness）を以下の状態で管理する。

- **CURRENT**: 最新かつソースと整合性が検証済み。読込・更新可。
- **STALE**: 古いことが確認された状態。ソースからの更新が必要。読込は非推奨。
- **SUSPECTED_STALE**: 関連Evidenceが更新された等により古くなっている可能性がある状態。検証が必要。
- **CONFLICTED**: Canonical Sourceと内容やハッシュが矛盾している状態。Safe Stop条件。
- **MISSING_SOURCE**: 参照先のソースが存在しない。Safe Stop条件。
- **HASH_MISMATCH**: 記録されたSHA-256と実際のファイルハッシュが一致しない。更新または検証が必要。
- **UNVERIFIED**: Registryに追加・更新されたが整合性チェックが未完了。読込注意。

### 3.4 Current State 更新規則
`current-state.md` はAIとの会話履歴からの推測で更新してはならない。必ず保存済みのEvidenceから生成する。
**最低限保持する項目**:
- Active Project
- Active Task
- Current Phase
- Current Gate
- Latest Binding Decision
- Latest PASS
- Latest FAIL
- Blocking Issues
- Open Findings/Defects
- Next Role
- Next Artifact
- Implementation Authorization
- Fix Authorization
- Baseline Commit
- Last Updated
- Updated By
- Source Evidence
- Budget Status
- Context Status

### 3.5 Summary 更新規則
全文の再生成ではなく、差分および必要箇所のみを更新する設計とする。
**最低限保持する項目**:
- Document Identity
- Authority
- Source Hash
- Purpose
- Scope
- Mandatory Rules
- Prohibited Actions
- Current State
- Open Issues
- Role Loading Guidance
- Required Full-Source Conditions

### 3.6 Registry Entry Schema
`document-registry.yaml` の各項目定義。
- `document_id`: パスから生成した安定識別子。権限や正本性を意味しない。
- `path`: ai-teamルートからの相対パス。
- `title`: 文書タイトル（Markdownの先頭見出し等）。
- `category`: 文書の責務分類（例: architecture, summary, review）。
- `version`: 文書のバージョン番号。
- `authority`: 正本、写し、Evidence、補助索引などの位置付け。
- `importance_level`: A=毎回、B=条件付き、C=必要時、D=監査時のみ。
- `sha256`: ファイル内容のSHA-256（変更検出用）。
- `size_bytes`: ファイルサイズ（読込コスト見積り用）。
- `preferred_loading`: 推奨読込方針。
- `source_document`: 元となるCanonical Sourceのパス。
- `summary_path`: 対応するSummaryのパス。
- `status`: 最新の鮮度状態（CURRENT, STALE等）。
- `last_verified_at`: 最終検証日時。
- `verified_by`: 検証したActor/Role。
- `supersedes`: 置き換えた旧Document ID。
- `superseded_by`: これを置き換えた新Document ID。

## 4. Principles

### 4.1 Cost and Context Rules
Registry Maintenance自体が高コストとならないよう、以下の原則を遵守する。
- 全文書の毎回再読を禁止する。
- MetadataおよびHashを優先して検証する。
- 変更が検出された文書だけを再処理する。
- Summary-firstを徹底し、必要な場合のみCanonical Sourceへアクセスする。
- DOCXの再抽出は原則禁止とする。
- 1回のMaintenance対象数上限を設定し（例: 最大5〜10ファイルまで）、超過時はバッチ処理へ移行する。
- Token/Cost Budget超過時は直ちにSafe Stopする。
- Batch処理（全体再構築）とIncremental処理（差分更新）を明確に使い分ける。

### 4.2 Historical Integrity
- 過去のRegistry Snapshotを改変してはならない。
- 過去のSummaryを上書きする場合は、Versionおよび履歴規則に従って記録を残す。
- Task Evidence（完了済みの歴史的アーティファクト）は変更しない（Append-only）。
- Superseded（陳腐化・置き換え）情報を明確に保持する。
- 不要になった文書は削除ではなくArchiveを優先する。
- 変更理由と参照したEvidenceを必ず記録する。

## 5. Lifecycle

### 5.1 Update Triggers
以下のイベントが発生した場合、RegistryまたはSummaryの更新をトリガーする。
- 新規文書追加
- 文書削除 / 文書移動
- Version変更 / 内容変更
- SHA-256変更
- Authority変更
- Task状態変更 / Gate変更
- Authorization変更
- 新しいFinding / Defectの発見
- Judge Decisionの確定
- Final Plan変更 / Amendment追加
- Implementation / Test結果の出力
- Closure / Archiveプロセスの進行
- Operational Improvement追加

## 6. Roles & Responsibilities

### 6.1 Update Responsibility
通常RoleがRegistryを直接自由編集する設計にはしない。プロセスを明確に分離する。
- `requested_by` (Orchestrator, Builder, Critic 等): Registryの不整合や更新の必要性をDETECTし提案する。
- `authorized_by` (Owner, Judge, Project Policy): 更新内容をEvidenceに基づき承認する。
- `applied_by` (Orchestrator, 将来のRegistry Maintenance Component): 承認された変更を適用する。
- `verified_by` (Orchestrator, Project Policy): 適用結果が整合していることを検証する。

## 7. Workflow

### 7.1 Maintenance Workflow
以下の標準フローでRegistryを更新する。

1. **DETECT**
   - **Input**: 現状のRegistry, Current State, 新規Evidence。
   - **Actor**: Orchestrator / Component。
   - **Stop Condition**: Hash Mismatch等の不整合が閾値を超える場合。
2. **PROPOSE**
   - **Actor**: Orchestrator。
   - **Required Evidence**: 変更の原因となるCanonical Source。
3. **AUTHORIZE**
   - **Actor**: Judge / Project Policy / Owner。
   - **Allowed Change**: 提案されたメタデータ・Summaryの差分更新のみ。
4. **UPDATE**
   - **Actor**: Component / Orchestrator。
   - **Output**: 変更後のRegistry/Summary。
5. **VERIFY**
   - **Actor**: Orchestrator / Project Policy。
   - **Stop Condition**: Consistency Checksに1つでも失敗した場合。
6. **COMMIT**
   - **Actor**: Component。
   - **Output**: 永続化された最新の状態。

### 7.2 Consistency Checks
最低限、以下の項目を検証（VERIFY）する。
- Registry Pathが実在すること。
- SHA-256が実際のファイルと一致すること。
- Version情報が一致すること。
- SummaryのSource PathとSource HashがCanonical Sourceと一致すること。
- Authority分類がArtifact Specificationと一致すること。
- Current Stateが最新の拘束的成果物（Evidence）と完全に一致すること。
- Next Role / Next ArtifactがWorkflow Specificationと一致すること。
- 削除済み文書を参照していないこと。
- 重複するDocument IDが存在しないこと。
- 同一文書に対する複数Canonical指定がないこと。
- DOCXとMarkdownの正本関係が明確であること。
- Historical Evidenceを上書きしていないこと。

### 7.3 Failure Behavior
異常検知時は、Registryを中途半端な状態で正本扱いしない。
- **Source missing / Duplicate ID**: Safe Stopし、Orchestratorへエラーを返す。
- **Hash mismatch / Summary outdated**: STATUSを `HASH_MISMATCH` または `STALE` に設定し、自動更新プロセスへ移行。
- **Canonical conflict / Current State conflict**: 競合状態（`CONFLICTED`）としてマークし、Judgeの介入を要求。
- **Write failure / Partial update / Session timeout**: トランザクションをロールバックし、前回の安全なSnapshotを維持。
- **Budget exceeded / Empty command**: 即時Safe Stop。

## 8. Metrics
Maintenanceの有効性を評価するため、以下を測定する。
- Registry Entry数 / Summary数
- Stale数 / Hash mismatch数 / Missing Source数
- Context Load削減率（推定）
- Full Document Load回数
- Cache Hit率（Summaryで解決できた割合）
- Maintenance Cost / Maintenance Tokens
- Average Update Time

## 9. Anti-Patterns
- **毎回全ファイルを読む**: ContextとCostの無駄。
- **Summaryを正本としてJudge判定する**: Binding Decisionは必ずCanonical Sourceで行う。
- **会話内容だけでCurrent Stateを更新する**: Evidence不在の更新は禁止。
- **Hash一致だけで内容理解済みと判断する**: ハッシュは変更の有無のみを示す。
- **Roleが自由にAuthorityを書き換える**: Authorizationを迂回する行為。
- **Historical Evidenceを最新状態へ書き換える**: Append-only原則の違反。
- **DOCXを毎回抽出する**: 重い処理の反復。Markdownキャッシュを優先する。
- **複数Roleが同時にRegistryを書き換える**: 競合と不整合の原因。

## 10. Best Practices
- **Summary-first**: 常にSummaryから入り、詳細が必要な場合のみCanonical Sourceをロードする。
- **Evidence-based Generation**: Current Stateは常に確立されたファイルから抽出して生成する。
- **Incremental Updates**: 全文生成ではなく、変更箇所だけを部分的に更新する。

## 11. Acceptance Criteria
以下の基準を機械検証可能な状態で満たすこと。
- すべてのRegistry Pathが存在する。
- Document ID重複0件。
- Canonical conflict 0件。
- Hash mismatch 0件。
- Current Stateが最新Evidenceと一致する。
- Summary Source Hashが一致する。
- Protected Historical Evidenceの変更0件。
- 全文読込なしで通常Maintenanceが完了可能である。

## 12. Architect Notes

### Deferred Items (今回は実装しないもの)
- Registry自動更新スクリプト
- Git Hook / CI検証の統合
- Artifact Cache実装
- Cost API連携
- Session Restart
- 自動Role Routing
- 自動Archive
- 外部Databaseへの保存

## 13. References
- Context Loading Rules (`context-loading-rules.md`)
- Artifact Specification
- Authority Specification
- Evidence Specification
- Workflow Specification

---

**Specification Result**: READY_FOR_REVIEW
**Critical/High未解決件数**: 0
**Deferred Items**: Registry自動更新スクリプト, Git Hook, CI検証, Artifact Cache実装, Cost API連携, Session Restart, 自動Role Routing, 自動Archive, 外部Database
**Recommended Next Step**: Critic (Registry Governance Review)
**Implementation Authorization**: NOT_AUTHORIZED
