<!--
AI-readable canonical copy generated from the adjacent DOCX.
Source file: TASK-004_TASK-005_Φ▓¼σïÖσóâτòî_τ╡▒σÉêΦ¿¡Φ¿êπâ¼πâôπâÑπâ╝_Ver1.0.docx
Source SHA-256: 8f99f0081eb3b2afe1a2f71a9681d2f9c965116a7aa354fbdbd63aff86f61b98
The DOCX remains the human-readable copy. Verify both copies when content differs.
-->

# TASK-004／TASK-005 責務境界・統合設計レビュー

Lifecycle Foundation と Knowledge System の責務分離、データ連携、Sequence、Workspace Registry前提

| 項目 | 内容 |
| --- | --- |
| 対象 | TASK-004 詳細設計書 Ver.1.1／TASK-005 詳細設計書 Ver.1.1 |
| レビュー目的 | 重複・責務漏れ・将来の実装競合を防止し、TASK-006全自動化へ接続可能な境界を確定する |
| 総合判定 | BOUNDARY_APPROVED_WITH_REQUIRED_CLARIFICATIONS |
| 結論 | TASK-004は『Taskを安全に進めるOS』、TASK-005は『Knowledgeを安全に管理・適用するOS』として分離する |

# 第1章　最終責務定義

TASK-004：Task Lifecycle、Current Phase、Gate、Authorization、Resume、Rollback、Closure、Archive、Context、Cost、Modelを管理する。Taskの進行を安全に制御する。

TASK-005：Knowledge Asset、Taxonomy、Graph、Registry、Revision、Resolution、Knowledge Pack、Application、Verification、Promotion、Demotion、Impact Analysisを管理する。Knowledgeの品質と再利用を安全に制御する。

Workspace Registry：Workspace内に何が存在し、どこにあり、どれがCanonicalで、どのVersion・Statusかを示す機械可読な索引。TASK-006の前提基盤として設計する。

## 1.1 境界原則

- TASK-004はKnowledgeの中身を判定しない。

- TASK-005はTask Lifecycleの正式状態を変更しない。

- TASK-005はKnowledge Packを生成するが、Context Manifest全体はTASK-004が管理する。

- TASK-004はKnowledge PackをContext Sourceの一つとして採用・除外・参照する。

- Task ClosureはTASK-004が判定し、Knowledge Candidateの有無・引渡し結果だけを入力として利用する。

- Knowledge AssetのACTIVE化・INVALID化・Promotion等はTASK-005側のGovernanceが管理する。

- Workspace Registryは両TASKの正本を置き換えず、場所・種類・Version・Canonical参照だけを提供する。

# 第2章　Responsibility Matrix

| 機能 | TASK-004 | TASK-005 | Workspace Registry |
| --- | --- | --- | --- |
| Active Project / Active Task | 主責務 | 参照 | 索引 |
| Task Lifecycle Status | 主責務 | 参照 | 索引 |
| Current Phase / Gate / Authorization | 主責務 | 参照 | 索引 |
| Canonical Status Record | 主責務 | 参照 | 所在・版 |
| Transition Log | 主責務 | 参照 | 所在・版 |
| Resume / Rollback | 主責務 | Knowledge Pack再解決条件を参照 | 所在 |
| Closure / Archive | 主責務 | Candidate・Impact状態を参照 | 所在 |
| Context Manifest | 主責務 | Knowledge Packを入力提供 | 所在・版 |
| Context Trust Boundary | 主責務 | Source Trustを入力として利用 | 所在 |
| Cost Budget / Usage Ledger | 主責務 | Knowledge Resolution費用を記録 | 所在 |
| Model Routing | 主責務 | Knowledge処理に必要能力を通知 | 所在 |
| Knowledge Asset | 参照 | 主責務 | 所在・版 |
| Knowledge Status / Revision | 参照 | 主責務 | 所在・版 |
| Taxonomy / Knowledge Graph | 参照 | 主責務 | 所在・版 |
| Vocabulary Registry | 参照 | 主責務 | 所在・版 |
| Knowledge Resolution | 呼出・結果受領 | 主責務 | Resolver所在 |
| Knowledge Pack | Contextへ統合 | 主責務 | 所在・版 |
| Knowledge Application | Lifecycle Evidenceとして参照 | 主責務 | 所在 |
| Deviation / Verification | Closure入力として参照 | 主責務 | 所在 |
| Candidate抽出 | 引渡しタイミング管理 | 主責務 | 所在 |
| Promotion / Demotion | 参照 | 主責務 | 所在 |
| Invalid Knowledge Impact Analysis | Block/Follow-upを反映 | 主責務 | 所在 |
| Workspace全資産の発見 | 利用 | 利用 | 主責務 |

# 第3章　Context ManifestとKnowledge Packの境界

Context Manifest：現在Role・Phaseが読む全情報を列挙するTASK-004の成果物。仕様、Task Artifact、Knowledge Pack、外部資料、Source Trust、機密性、Token量を含む。

Knowledge Pack：TASK-005が特定Task・Role・Phase向けに選択し、Asset Revisionを固定したKnowledge一式。

## 3.1 正式処理順序

1. TASK-004がActive Task、Role、Current Phase、Context Budget、Sensitivity、Tool Versionを確定する。

1. TASK-004がKnowledge Resolution Requestを作成してTASK-005へ渡す。

1. TASK-005がRegistry、Taxonomy、Graph、Status、Version、Trustを基にResolutionを実行する。

1. TASK-005がKnowledge PackとResolution Resultを返す。

1. TASK-004がKnowledge PackをContext Manifestの一Sourceとして登録する。

1. TASK-004が他のCanonical Specification、Task Artifact、External Referenceと統合する。

1. TASK-004がContext Trust Boundary、重複、Token、機密性、Freshnessを最終確認する。

1. Context Manifestを基にRole Promptまたは実行Contextを構築する。

## 3.2 禁止する逆転

- TASK-005がAGENTS、PROJECT、Task Artifactを含むContext Manifest全体を生成してはならない。

- TASK-004がKnowledge AssetのScore、Promotion、Revision選択を独自実装してはならない。

- Knowledge PackをRole Promptへ直接投入し、Context Manifestの監査を迂回してはならない。

# 第4章　Trust Modelの境界

| 概念 | TASK-004 | TASK-005 |
| --- | --- | --- |
| 評価対象 | Contextへ投入するSource全体 | Knowledgeの根拠SourceとAsset自体 |
| 主な値 | CANONICAL / TRUSTED / REFERENCE / UNTRUSTED | CANONICAL / OFFICIAL / VERIFIED_INTERNAL / USER_OBSERVED / EXTERNAL_REFERENCE / AI_INFERRED / UNTRUSTED |
| 判断目的 | 命令として有効か、参照のみか、除外か | Knowledgeの信頼度・審査要否・自動適用可否 |
| 最終責任 | Context Guard | Knowledge Governance |

連携ルール：TASK-005のSource Trustは、TASK-004のContext Trust判定の入力になる。ただし、Official Knowledge Assetであっても、対象Taskに不適切・古い・機密過剰ならContextから除外できる。

# 第5章　Statusの境界

| 対象 | TASK-004 Status | TASK-005 Status |
| --- | --- | --- |
| 管理単位 | Task | Knowledge Asset |
| 例 | ACTIVE / PAUSED / BLOCKED / COMPLETED | CANDIDATE / ACTIVE / STALE / INVALID |
| 正本 | Canonical Status Record | Knowledge Asset Current Revision |
| 履歴 | Transition Log | Knowledge Event Log |
| 終了 | COMPLETED / CANCELLED / REJECTED / ARCHIVED | DEPRECATED / INVALID / ARCHIVED |
| 再開 | PAUSED/BLOCKED/STALLEDからResume | STALE再検証、DRAFT/REVIEW継続 |

- Knowledge AssetがINVALIDになってもTask Statusを自動的に変更しない。

- Impact Analysisで重大影響が確認された場合、TASK-005が影響通知を出し、TASK-004が対象TaskをBLOCKEDまたはFollow-up Task化する。

- TaskがARCHIVEDされても、そのTask由来Knowledge Assetは独立Lifecycleを継続できる。

# 第6章　Knowledge Candidateの所有権

| 段階 | 所有責務 | 説明 |
| --- | --- | --- |
| 候補発生 | 各Role | 実装・Test・Review・Judge・Policyから候補を申告 |
| 候補引渡し | TASK-004 | Closure前にCandidateの有無、保存場所、引渡し完了を確認 |
| Candidate内容管理 | TASK-005 | 分類、重複、Source、機密、Review |
| ACTIVE化 | TASK-005 Governance | 独立Reviewと必要承認 |
| Task Closureへの影響 | TASK-004 | 必須Candidate引渡し未完了ならClosure Block可能 |

重要：TASK-004はCandidateをKnowledge Assetとして承認しない。TASK-005はCandidate処理のために元TaskのLifecycleを勝手に再開しない。

# 第7章　End-to-End Sequence

| 順序 | 主体 | 処理 | 責務 |
| --- | --- | --- | --- |
| 1 | Owner / Orchestrator | Task定義・承認 | TASK-004 |
| 2 | TASK-004 | Status=ACTIVE、Phase設定、Budget/Model/Context要求準備 | TASK-004 |
| 3 | TASK-004→TASK-005 | Knowledge Resolution Request | 境界 |
| 4 | TASK-005 | Knowledge検索・競合・Version評価 | TASK-005 |
| 5 | TASK-005→TASK-004 | Knowledge Pack＋Resolution Result | 境界 |
| 6 | TASK-004 | Context Manifestへ統合・Trust/Token検査 | TASK-004 |
| 7 | Orchestrator | Builder/Critic/Tester/JudgeへRouting | TASK-004 |
| 8 | 各Role | Artifact作成・Knowledge Application/Deviation記録 | 両方 |
| 9 | Tester/Critic/Judge | Knowledge Verificationを含む独立評価 | 両方 |
| 10 | Project Policy | Policy更新・Knowledge Candidate確認 | 両方 |
| 11 | TASK-004 | Closure Readiness判定 | TASK-004 |
| 12 | TASK-005 | Candidate Review・Asset化は独立継続 | TASK-005 |
| 13 | TASK-004 | Completed→Archive Readiness | TASK-004 |
| 14 | Workspace Registry | 新規Artifact/Asset/Status所在をIndex更新 | Registry |

# 第8章　Data Flow

```text
Workspace Registry
  ├─ Canonical Specification Locations
  ├─ Project / Task Index
  ├─ Template / Role Index
  └─ Knowledge Repository Index
           │
           ▼
TASK-004: Lifecycle / Context Request
           │
           ├── Active Task / Role / Phase / Budget / Sensitivity / Tool Version
           ▼
TASK-005: Knowledge Resolution
           │
           ├── Vocabulary Registry
           ├── Taxonomy / Knowledge Graph
           ├── Asset Revision / Status / Trust
           └── Usage / Effectiveness
           ▼
Knowledge Pack
           │
           ▼
TASK-004: Context Manifest + Context Guard
           │
           ▼
Orchestrator Prompt / Role Execution
           │
           ▼
Artifacts + Application / Deviation / Verification
           │
           ├── Task Lifecycle Evidence → TASK-004
           └── Knowledge Candidate / Usage Event → TASK-005
```

# 第9章　Workspace Registry詳細位置づけ

定義：Workspace全体の資産を発見するための機械可読な索引。資産内容の正本ではなく、正本への参照・種類・版・Status・Checksumを管理する。

## 9.1 Registryが管理するもの

- Project Index：Project ID、Root、PROJECT.md、Status Record。

- Task Index：Task ID、Project、Status Record、Parent/Dependency。

- Specification Index：Common、Role、Lifecycle、Knowledge等のCanonical Path。

- Template Index：Template名、対応Artifact、Version、Path。

- Artifact Index：Artifact Type、Task、Authoring Role、Path、Checksum。

- Knowledge Index：Repository、Vocabulary、Graph、Asset Current Revisionへの参照。

- Role Index：Role名、Specification Path、利用可能Tool・権限。

## 9.2 Registryが管理しないもの

- Taskの正式状態そのもの：Canonical Status Recordが正本。

- Knowledge本文・状態そのもの：Knowledge Assetが正本。

- Role権限の詳細：Role Specificationが正本。

- Artifact本文：各Artifactファイルが正本。

## 9.3 推奨実施時期

結論：TASK-006の前提基盤として実施する。ただしTASK-004/005では、将来Registryへ登録可能なID・Path・Version・Checksum項目を成果物へ持たせる。

## 9.4 TASK番号案

- 案A：TASK-006のPhase 1としてWorkspace Registryを設計・実装し、その後にAutomation Engineへ進む。

- 案B：TASK-006をWorkspace Registry、TASK-007をAutomationへ繰り下げる。

推奨：案A。Registryは全自動化の一部かつ前提であるため、TASK-006内の最初のPhaseとして扱う。既存ロードマップ番号の変更を最小化できる。

# 第10章　統合インターフェース

| インターフェース | 送信元 | 送信先 | 必須内容 |
| --- | --- | --- | --- |
| Knowledge Resolution Request | TASK-004 | TASK-005 | Task/Role/Phase、Scope、Tool Version、Environment、Sensitivity、Token Budget |
| Knowledge Resolution Result | TASK-005 | TASK-004 | Result、Pack ID、Conflict、Missing Mandatory、Cost Estimate |
| Knowledge Pack | TASK-005 | TASK-004 | Asset ID+Revision、Required Actions、Verification Steps、Checksum |
| Knowledge Usage Event | 各Role/TASK-004 | TASK-005 | Task、Pack、Asset、Applied/Deviated、Outcome |
| Knowledge Candidate Handoff | TASK-004 | TASK-005 | Candidate Path、Source Task、Sensitivity、Closure Relevance |
| Invalid Knowledge Impact Notice | TASK-005 | TASK-004 | Asset Revision、Affected Tasks、Severity、Required Action |
| Registry Update Event | TASK-004/005 | Workspace Registry | Resource ID、Type、Path、Version、Status、Checksum |

# 第11章　統合失敗時の処理

| 失敗 | TASK-004処理 | TASK-005処理 |
| --- | --- | --- |
| Knowledge Resolution不可 | MandatoryならBLOCK、任意ならNOT_CONFIRMEDでOwner判断 | 不足・競合・権限理由を返す |
| Knowledge Pack期限切れ | Context Manifest無効化・再要求 | 新Revisionで再生成 |
| Context Budget超過 | Mandatory保持、Advisory圧縮 | 優先順位・要約候補を返す |
| Invalid Knowledge通知 | 影響TaskをBLOCK/Follow-up候補 | Impact Analysis継続 |
| Usage Event書込失敗 | Closure前に修復対象 | Ledger整合を回復 |
| Registry不整合 | 正本ファイルを優先しIndex再構築 | 正本参照を再通知 |

# 第12章　受入基準

- TASK-004とTASK-005の同名概念が、異なる意味・責務として説明されている。

- Knowledge PackがContext Manifestへ一方向に統合され、逆にContext全体をTASK-005が所有しない。

- Source TrustとContext Trustを別評価できる。

- Task StatusとKnowledge Statusを独立運用できる。

- Knowledge Candidateの引渡しがTask ClosureとKnowledge Approvalを混同しない。

- Invalid Knowledge通知から対象TaskのBlockまたはFollow-upを生成できる。

- Workspace Registryが正本ではなくIndexであることを維持できる。

- End-to-End Sequenceの各処理に唯一の主責務がある。

# 第13章　採用・却下・保留事項

| 区分 | 事項 | 理由 |
| --- | --- | --- |
| 採用 | Knowledge Pack→Context Manifest | Knowledge選択とContext統合の責務を分離 |
| 採用 | Source TrustとContext Trustの分離 | 根拠の信頼性と今回の採用可否は別 |
| 採用 | Candidate HandoffとApprovalの分離 | Task ClosureとKnowledge Governanceを混同しない |
| 採用 | Workspace RegistryをTASK-006 Phase 1 | 全自動化前提であり番号変更を避ける |
| 採用 | RegistryはIndexのみ | 正本重複を防止 |
| 却下 | TASK-005がContext Manifest全体を生成 | Lifecycle責務を侵食 |
| 却下 | TASK-004がKnowledge Scoreを独自計算 | Knowledge Governanceと重複 |
| 却下 | Task ARCHIVEDでKnowledgeも自動Archive | Lifecycleが独立 |
| 保留 | Registryの保存形式 | YAML/JSON/DBはTASK-006で選定 |
| 保留 | Registry専用Role | Automation設計で判断 |

# 第14章　次工程

1. 本責務境界をTASK-004・TASK-005の共通前提として固定する。

1. TASK-004 task.mdへ、Knowledge Resolution Request／Context統合／Candidate Handoffの受け口を記載する。

1. TASK-005 task.mdへ、Resolution Result／Knowledge Pack／Usage Event／Impact Noticeの提供責務を記載する。

1. TASK-006 Phase 1としてWorkspace Registryをロードマップへ明記する。

1. 次にTASK-004 task.mdを正式作成する。
