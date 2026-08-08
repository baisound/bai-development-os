# BAI Development OS Architecture Ver.2.24 — TASK-014 Adaptive Governance Calibration & Policy Learning Completion

## Document Control

```yaml
document:
  document_id: AI-Development-OS-Architecture
  version: "2.24"
  status: CURRENT_CANONICAL
  authority: machine_canonical_authority
  human_companion: /home/baisound/bai-development-os/architecture/BAI_Development_OS_Architecture_Ver2.24.docx
  machine_path: /home/baisound/bai-development-os/architecture/BAI_Development_OS_Architecture_Ver2.24.md
  summary_path: /home/baisound/bai-development-os/architecture/BAI_Development_OS_Architecture_Ver2.24.summary.md
  historical_baseline: BAI Development OS Architecture Ver.2.23
  baseline_commit: 606ea45
  coverage_evidence: /home/baisound/bai-development-os/tasks/TASK-014/task014-final-completion-record.md
```

## Authority, Scope, and Preconditions

This Markdown is the machine canonical authority for this draft document set. The human DOCX is its human canonical companion; the Summary is a context-economy entrypoint and MUST NOT replace this Markdown for rules, constraints, states, or stop conditions.

Inputs are Architecture Ver.2.0, TASK-004 Ver.1.2 Attachment Integrated, the approved TASK-004 implementation evidence, and the Owner-authorized Documentation Synchronization v2 instruction. Historical baselines and Task evidence are read-only. The precondition is a successful Runtime Probe before role activation. A document inconsistency, missing input, unreadable evidence, or baseline checksum change MUST produce a Safe Stop and Owner escalation.

## Current-State Supersession Notice

The inherited Ver.2.0 and Ver.2.1 material below is preserved as historical architecture content. Parts VII–XIV preserve TASK-005 through TASK-008 completion and the chronological evolution of post-TASK-004 roadmap proposals. **Part XV remains the single consolidated roadmap authority. Ver.2.24 preserves all 53 accumulated roadmap source sections; Part XVI records TASK-009 completion, Part XVII its refinement, Part XVIII records TASK-010 completion, Part XIX its refinement, Part XX records TASK-011 ConformanceOS completion, Part XXI records the post-TASK-011 roadmap refinement, Part XXII records TASK-012 MaintenanceOS completion, Part XXIII records the post-TASK-012 roadmap refinement, Part XXIV records TASK-013 ExtensionOS completion, and Part XXV records TASK-014 CalibrationOS completion.** Historical Evidence remains unmodified; older contradictory status statements are historical facts, not current routing rules.

## Inherited Architecture Ver.2.0 Content

# AI Development OS Architecture 設計書 Ver.2.0

持続可能開発・Context Economy・Lifecycle実証状況を統合した全体アーキテクチャ

| 項目 | 内容 |
| --- | --- |
| 文書種別 | AI Development OS 全体アーキテクチャ親設計書 |
| 位置づけ | TASK-004以降の全サブシステム設計・task.md・実装判断の親ドキュメント。Ver.1.1の全内容を保持し、2026-07-27時点の実証状況と持続可能開発方針を統合する。 |
| 前提 | AI Development OS v2.1 Alpha、TASK-004 Ver.1.1、TASK-005 Ver.1.1、両者の責務境界レビュー、TASK-004 Phase 1実証Evidence |
| 目的 | 各TASKを一つのOperating Systemとして統合し、安全性・正本性・監査可能性に加えて、Context効率・API費用・Session継続性を制御する。 |
| 対象 | プログラム開発、動画制作、音響制作、配信、自動化、AIコンテンツ制作などの全Project |
| 最重要原則 | 実装者・保守者・将来のAIが同じ全体像を共有し、責務重複・正本競合・自動化事故・Context肥大・予算超過を防ぐ。 |
| 本版 | Ver.2.0 持続可能開発・現状記録統合版 |
| 基準日 | 2026-07-27 |
| 継承元 | Ver.1.1 統合準備版（既存内容は削除せず継承） |
| 現在の最優先 | TASK-004 Phase 1を完了し、その直後にContext Economy／Cost GuardをP0として設計・実装する |

# 第1章　エグゼクティブサマリー

AI Development OSは、複数のAI Roleと人間のOwnerが、設計・実装・検証・判断・学習を安全かつ再現可能に進めるためのOperating Systemである。単一のAgentへすべてを任せるのではなく、Workspace、Governance、Lifecycle、Knowledge、Automation、Monitoring、Integrationを分離し、各層が正本・権限・Evidence・停止条件を持つ。

## 1.1 本設計書が解決する問題

- TASK-004・TASK-005・TASK-006以降の位置づけが分散し、全体構成を一枚で説明できない。

- Lifecycle、Knowledge、Context、Registry、Automationの責務境界が曖昧だと、複数Agentが同じ処理を重複実装する。

- 正本が複数存在すると、どの状態・Knowledge・仕様が現在有効か判断できない。

- 全自動化では、誤った状態遷移、古いKnowledge、Context過大、予算超過、外部副作用を機械的に防ぐ必要がある。

- プログラム開発だけでなく、動画・音声・BGM・SEなど異なるDomainへ適用できる拡張性が必要である。

## 1.2 最終アーキテクチャの要点

- Workspace LayerがProjectと共通仕様の境界を持つ。

- Governance LayerがAuthority、Policy、Vocabulary、Role、Evidence、Artifactを管理する。

- Lifecycle OSがTaskの進行・停止・再開・完了・Archiveを管理する。

- Knowledge OSが知識の分類・版管理・検索・適用・検証・再発防止を管理する。

- Workspace Registryが正本の場所・種類・Version・Statusを示す索引となる。

- Automation EngineがRegistry・Lifecycle・Knowledgeを利用してRole間を自律Routingする。

- Monitoring Layerが状態・品質・費用・停滞・Knowledge Debtを可視化する。

- Integration LayerがGitHub、MCP、外部AI、動画・音響Tool等へ接続する。

- Human Authority LayerがOwner承認、Emergency Stop、重大例外判断を担う。

- ContextとToken／API費用をCPU・Memoryと同じ有限資源として扱い、必要Artifactだけを読み、予算上限で自動停止できる持続可能開発を中核要件とする。

# 第2章　用語定義

| 用語 | 説明 |
| --- | --- |
| AI Development OS | AIと人間による開発・制作・検証・学習を、Role、State、Evidence、Policyで制御する運用基盤。 |
| Operating System／OS | ここではPC用OSではなく、複数AIとToolが安全に仕事を進めるための共通制御基盤を意味する。 |
| Workspace | 複数Projectと共通仕様を含む最上位作業領域。例：BAISOUND/。 |
| Project | 独立した目的・制約・成果物を持つ作業単位。例：javascript-roulette、動画制作全自動化。 |
| Task | Project内で完了条件を持つ個別作業単位。TASK-004等。 |
| Layer／層 | 責務を分離するためのアーキテクチャ上の区分。 |
| Subsystem／サブシステム | OSを構成する独立責務の機能群。Lifecycle OSやKnowledge OS等。 |
| Canonical／正本 | 現在の正式な判断根拠となる唯一の記録。 |
| Registry／索引 | 正本の内容ではなく、正本がどこにあり、何で、どのVersionかを示す一覧。 |
| Governance／ガバナンス | 誰が何を提案・承認・更新・失効できるかを定める管理規則。 |
| Lifecycle | Taskが定義されてから完了・Archiveされるまでの状態と遷移。 |
| Context | AIが現在の作業を理解するために読み込む仕様・Artifact・Knowledge・Evidence。 |
| Knowledge Asset | 検索・版管理・審査・適用・失効が可能な単位で保存されたKnowledge。 |
| Automation Engine | Task状態と規則に基づき、次のRole・処理・停止を自動判断する実行制御。 |
| Policy Engine | Authority・Safety・Project Policy・例外規則を評価する機能。 |
| Role Engine | Builder、Critic、Tester、Judge等のRole仕様と実行条件を解決する機能。 |
| Prompt Assembly | Context Manifest、Knowledge Pack、Role仕様、Task入力を統合して実行Promptを構築する処理。 |
| Evidence | 判断・検証・状態遷移の根拠となるArtifact、ログ、結果。 |
| Artifact | Task中に生成される設計書、Report、Decision、Code等の成果物。 |
| Owner | 重大認可、予算、例外、Emergency Stop、最終方針を決定する人間。 |

# 第3章　アーキテクチャ原則

| ID・原則 | 詳細 |
| --- | --- |
| P-01 正本一意性 | Task Status、Knowledge、Role、Policy等は、それぞれ一つのCanonical Sourceを持つ。Registryや要約は正本にならない。 |
| P-02 責務分離 | LifecycleはTask進行、Knowledgeは知識、Registryは索引、Automationは実行制御を担当する。 |
| P-03 独立審査 | Builder、Critic、Tester、Judgeは保存済みArtifactを基に独立評価し、会話内推測へ依存しない。 |
| P-04 Evidence First | 状態遷移・承認・完了はEvidenceで判定する。会話上の『完了した』だけでは進めない。 |
| P-05 Human Authority | 重大なPolicy変更、予算超過、Mandatory例外、不可逆操作はOwner承認を必要とする。 |
| P-06 Safe Stop | 不明、競合、Evidence不足、権限不足、Budget超過時は自動進行より安全停止を優先する。 |
| P-07 Historical Integrity | 完了済みArtifactや過去Revisionを直接書き換えず、新しいRecord・Revision・Follow-up Taskで補正する。 |
| P-08 Minimal Context | RoleとPhaseに必要な情報だけを読み込み、重複・古い・未信頼情報を除外する。 |
| P-09 Continuous Learning | 成功・失敗・Deviation・VerificationをKnowledgeへ還元し、同じ間違いを繰り返さない。 |
| P-10 Explainability | AIが何を選び、なぜ進み、なぜ止まり、どのKnowledgeを使ったか説明できる。 |
| P-11 Domain Extensibility | プログラム、動画、音響、配信等のDomain固有Knowledgeを共通OS上で扱える。 |
| P-12 No Silent Weakening | Project・Tool・Task固有規則は、上位の安全・権限・Evidence規則を黙って弱めない。 |

# 第4章　レイヤー構成

| Layer | 構成要素 | 主責務 |
| --- | --- | --- |
| L0 Human Authority Layer | Owner、Reviewer、Domain Expert | 承認、例外、Emergency Stop、重大判断 |
| L1 Workspace Layer | Workspace Root、Project Boundary | 共通仕様とProject固有資産の物理・論理境界 |
| L2 Registry & Discovery Layer | Workspace Registry | Project、Task、Specification、Role、Template、Artifact、Knowledgeの索引 |
| L3 Governance Layer | Authority、Policy、Vocabulary、Evidence、Artifact | 権限、語彙、正本、監査、変更管理 |
| L4 Lifecycle OS | TASK-004 | Status、Phase、Gate、Authorization、Context、Cost、Model、Resume、Closure、Archive |
| L5 Knowledge OS | TASK-005 | Taxonomy、Graph、Vocabulary Registry、Asset Revision、Resolution、Pack、再発防止 |
| L6 Automation Layer | TASK-006 | Scheduler、Orchestrator、Prompt Assembly、Role Routing、Recovery |
| L7 Role Execution Layer | Builder、Critic、Tester、Judge、Project Policy | 設計、実装、検証、審査、Policy Review |
| L8 Monitoring & Observability | TASK-007 | Dashboard、KPI、Alert、Audit、Knowledge Debt、Cost可視化 |
| L9 Integration Layer | TASK-008 | GitHub、MCP、外部AI、動画・音響Tool、通知 |
| L10 Project Domain Layer | 各Project | JavaScript、PHP、AI動画、AI SE、AI BGM等の固有実装 |

## 4.1 全体レイヤー図

```text
┌─────────────────────────────────────────────────────────────┐
│ L0 Human Authority: Owner / Reviewer / Domain Expert         │
├─────────────────────────────────────────────────────────────┤
│ L1 Workspace: Root / Project Boundary                        │
├─────────────────────────────────────────────────────────────┤
│ L2 Workspace Registry: Discovery / Index                     │
├─────────────────────────────────────────────────────────────┤
│ L3 Governance: Authority / Policy / Vocabulary / Evidence    │
├──────────────────────────────┬──────────────────────────────┤
│ L4 Lifecycle OS (TASK-004)   │ L5 Knowledge OS (TASK-005)   │
│ Status / Phase / Context     │ Asset / Graph / Resolution   │
│ Cost / Model / Closure       │ Pack / Learning / Impact     │
├──────────────────────────────┴──────────────────────────────┤
│ L6 Automation Engine (TASK-006)                              │
│ Scheduler / Orchestrator / Prompt Assembly / Recovery        │
├─────────────────────────────────────────────────────────────┤
│ L7 Role Execution: Builder / Critic / Tester / Judge / Policy│
├─────────────────────────────────────────────────────────────┤
│ L8 Monitoring / Dashboard / Audit / Alerts (TASK-007)        │
├─────────────────────────────────────────────────────────────┤
│ L9 Integrations / MCP / GitHub / External AI (TASK-008)      │
├─────────────────────────────────────────────────────────────┤
│ L10 Project Domains: Software / Video / Audio / Streaming    │
└─────────────────────────────────────────────────────────────┘
```

# 第5章　コンポーネントアーキテクチャ

| Component | 主責務 | 主な正本・成果物 |
| --- | --- | --- |
| Workspace Manager | Workspace Root、Project Boundary、共通仕様Pathを管理 | AGENTS.md、Workspace config |
| Workspace Registry | 資産の所在、Type、Version、Status、Checksumを索引化 | registry files / index |
| Policy Engine | Authority、Safety、Project Policy、例外を評価 | Policy Rules、Approval Record |
| Role Engine | Role仕様、入力、出力、禁止事項、独立性を解決 | Role Specifications |
| Lifecycle Manager | Task Status、Phase、Gate、Authorization、Resume、Closureを管理 | Canonical Status Record、Transition Log |
| Context Manager | Context Manifest、Trust、Freshness、Token、Sensitivityを管理 | Context Manifest |
| Cost Manager | Budget、Reservation、Actual Usage、Reconciliation | Cost Budget、Ledger |
| Model Router | 能力、Context、Privacy、Cost、AvailabilityでModelを選択 | Model Routing Record |
| Knowledge Manager | Knowledge Asset、Revision、Status、Promotion、Impactを管理 | Knowledge Repository |
| Knowledge Resolver | Taskに必要なKnowledgeを決定的に選択 | Resolution Record、Knowledge Pack |
| Prompt Assembler | Role仕様、Task、Context、Knowledge Packを統合 | Execution Prompt |
| Automation Orchestrator | 次処理、Role Routing、停止、Retry、Recoveryを制御 | Execution Plan、Run Log |
| Artifact Manager | Template適用、Artifact ID、Checksum、Authoring Roleを管理 | Task Artifacts |
| Verification Engine | Schema、Link、Checksum、Result、Gateを確認 | Verification Reports |
| Monitoring Engine | Status、Cost、Quality、Stall、Knowledge Debtを集計 | Dashboard、Alerts |
| Integration Gateway | GitHub、MCP、API、Tool呼出しを統制 | Connector Records |

# 第6章　正本・索引・派生物の所有関係

| 対象 | Canonical Source | Index | 派生物 |
| --- | --- | --- | --- |
| Workspace運用規則 | AGENTS.md | Workspace Registry | 要約・Prompt |
| Role権限・責務 | Role Specification | Role Index | Role Prompt |
| Project固有制約 | PROJECT.md | Project Index | Context Summary |
| Task現在状態 | Canonical Status Record | Task Index | Dashboard |
| Task遷移履歴 | Transition Log | Task Index | Audit Report |
| Knowledge現在版 | Knowledge Asset Current Revision | Knowledge Index | Human-readable View |
| Knowledge履歴 | Knowledge Event Log / Revisions | Knowledge Index | Metrics |
| Context投入内容 | Context Manifest | Artifact Index | Prompt |
| Task向けKnowledge | Knowledge Pack | Knowledge Index | Prompt section |
| Cost上限 | Cost Budget | Task Index | Warning |
| Cost実績 | Actual Usage Ledger | Monitoring Index | Dashboard |
| Model選択 | Model Routing Record | Task Index | Execution Config |
| Artifact本文 | 各Artifact File | Artifact Index | 要約・Report |

禁止：Index、Dashboard、Prompt、要約をCanonical Sourceとして逆利用してはならない。

# 第7章　Governance Architecture

## 7.1 Governance対象

- Authority：誰が提案・承認・更新・撤回できるか。

- Policy：Workspace・Project・Taskで守る規則。

- Vocabulary：用語、Status、Result、Type、Aliasの正式定義。

- Evidence：判断根拠の品質、来歴、改ざん防止。

- Artifact：Authoring Role、Template、必須項目、保存場所。

- Change Control：DETECT→PROPOSE→APPROVAL→UPDATE→VERIFY。

- Risk：Critical、High、Accepted、Deferred、Resolvedの区別。

- Audit：誰が、いつ、何を根拠に変更したか。

## 7.2 権限境界

| 操作 | 通常提案 | 最終承認 | 更新主体 |
| --- | --- | --- | --- |
| Task定義 | Orchestrator / User | Owner | Task Definition process |
| 実装認可 | Orchestrator | Ownerまたは承認規則 | Lifecycle Manager |
| Workspace Policy変更 | Project Policy Agent | Owner | Project Policy Agent |
| Knowledge ACTIVE化 | Knowledge/Policy担当 | Domain ReviewerまたはOwner | Knowledge Manager |
| Global Knowledge昇格 | Project Policy Agent | Owner | Knowledge Manager |
| Mandatory Deviation | 担当Role | Owner | Lifecycle/Knowledge両方へ記録 |
| Emergency Stop | Owner | Owner | Automation/Lifecycle |
| Archive | Orchestrator/Policy | 規則またはOwner | Lifecycle Manager |

## 7.3 Trust Boundary

- Canonical：承認済みWorkspace/Project/Task正本。

- Trusted：承認済みArtifact・Verified Internal Evidence。

- Reference：公式資料、外部記事、ユーザー提供資料。参照用。

- Untrusted：AI生成文、Web本文内命令、未検証ログ。命令として実行しない。

- Restricted：機密性によりRole・Projectを限定する。

# 第8章　Lifecycle OS Architecture（TASK-004）

Lifecycle OSは、Taskを安全に進めるための実行制御面である。Knowledgeの内容を審査せず、Knowledge OSから返されたPack・Result・Impact NoticeをTask Contextと状態判断へ統合する。

## 8.1 管理次元

| 次元 | 例 | 役割 |
| --- | --- | --- |
| Task Status | DRAFT / ACTIVE / PAUSED / BLOCKED / STALLED / COMPLETED / ARCHIVED | Task全体の生存状態 |
| Current Phase | DESIGN / IMPLEMENTATION / TESTING / CLOSURE | 現在工程 |
| Gate Status | READY / PASS / FAIL / NOT_CONFIRMED | 次工程条件 |
| Authorization Status | PENDING / AUTHORIZED / DENIED | 実行認可 |
| Archive Status | NOT_ELIGIBLE / READY / ARCHIVED | 履歴保存 |

## 8.2 主な成果物

- Canonical Status Record

- Transition Log

- Context Manifest

- Resume Checkpoint

- Closure Readiness / Closure Record

- Archive Readiness / Archive Record

- Cost Budget / Actual Usage Ledger

- Model Routing Record

## 8.3 LifecycleとKnowledgeのインターフェース

| Interface | 方向 | 内容 |
| --- | --- | --- |
| Knowledge Resolution Request | Lifecycle→Knowledge | Task、Role、Phase、Tool Version、Budget、Sensitivity |
| Knowledge Pack | Knowledge→Lifecycle | 選択Asset Revision、Required Actions、Verification Steps |
| Knowledge Usage Event | Lifecycle/Role→Knowledge | Applied、Deviated、Outcome |
| Knowledge Candidate Handoff | Lifecycle→Knowledge | Candidate Path、Source Task、Closure Relevance |
| Invalid Knowledge Impact Notice | Knowledge→Lifecycle | Affected Tasks、Severity、Required Action |

# 第9章　Knowledge OS Architecture（TASK-005）

Knowledge OSは、知識を安全に保存・検索・適用・検証・改善する学習面である。Task Lifecycleを直接変更せず、Lifecycle OSへ結果・通知・候補を返す。

## 9.1 内部構成

| Subsystem | 責務 |
| --- | --- |
| Vocabulary Registry | 正式語、Alias、日本語説明、廃止語 |
| Taxonomy | Global、Domain、Technology、Specialization、Tool、Project、Task |
| Knowledge Graph | Requires、Exception、Conflict、Supersedes、Derived From等 |
| Asset Repository | Asset Current Revision、Past Revisions、Human-readable View |
| Event Log | 作成、Review、承認、利用、失効、置換 |
| Knowledge Resolver | Task条件から決定的に選択 |
| Knowledge Pack Builder | Role/Phase向けPackを版固定 |
| Usage & Effectiveness | 利用結果、Verification、Outcome |
| Failure & Recurrence | Failure Case、Fingerprint、Gap Analysis |
| Impact Manager | 誤Knowledge利用先の抽出・再確認 |
| Promotion/Demotion | Scope昇格・縮小・条件付き化 |

## 9.2 Knowledge種類

- PRINCIPLE、GOOD_PRACTICE、PROHIBITION

- SUCCESS_CASE、FAILURE_CASE、LESSON_LEARNED

- ADR、PROCEDURE、TEMPLATE

- QUALITY_CRITERION、TROUBLESHOOTING

## 9.3 強制力

- MANDATORY：安全・契約・権限・必須品質。原則逸脱不可。

- CONDITIONAL_MANDATORY：条件一致時に必須。

- ADVISORY：推奨。Deviation理由を記録。

- REFERENCE：参考事例。

# 第10章　Workspace Registry Architecture（TASK-006 Phase 1）

定義：Workspace全体の資産を発見する機械可読な索引。資産内容の正本ではない。

## 10.1 Registry構成

| Registry | 主な項目 |
| --- | --- |
| Project Index | project_id、root、PROJECT.md、status record |
| Task Index | task_id、project_id、status、parent/dependency、path |
| Specification Index | spec_id、canonical_path、schema/version、status |
| Role Index | role_id、spec_path、authority、supported_tools |
| Template Index | template_id、artifact_type、version、path |
| Artifact Index | artifact_id、task、role、path、checksum |
| Knowledge Index | asset_id、revision、status、repository path |
| Connector Index | connector_id、capability、authority、status |

## 10.2 Registry更新原則

- 正本作成・移動・Version変更後にRegistry Update Eventを発行する。

- Registry更新失敗でも正本は失われない。

- Registry不整合時は正本をScanして再構築できる。

- RegistryはStatusやKnowledge本文を直接編集しない。

## 10.3 実施時期

確定方針：TASK-006のPhase 1としてWorkspace Registryを設計・実装し、Phase 2でAutomation Engineを構築する。

# 第11章　Automation Architecture（TASK-006）

## 11.1 Automation Engineの責務

- Workspace Registryから必要資産を発見する。

- Lifecycle OSから現在Status・Phase・Gate・Authorizationを取得する。

- Knowledge OSへResolutionを要求する。

- Context ManifestとPromptを組み立てる。

- 適切なRole・Model・ToolへRoutingする。

- Artifact生成後にSchema・Evidence・Resultを検証する。

- GateとPolicyに基づき次処理、停止、再試行、Escalationを判断する。

- PAUSED、BLOCKED、STALLED、Emergency Stopへ安全に遷移する。

## 11.2 Automation内部コンポーネント

| Component | 責務 |
| --- | --- |
| Scheduler | 実行順序・待機・期限 |
| Orchestrator Core | 状態・規則に基づくRouting |
| Prompt Assembler | Role＋Context＋Knowledge＋Taskを統合 |
| Execution Adapter | Model・Tool・Connector呼出し |
| Result Normalizer | 出力をArtifact Schemaへ正規化 |
| Gate Evaluator | Result・Evidence・Authorization評価 |
| Retry Controller | 再試行上限、Hypothesis変更 |
| Recovery Manager | Checkpoint、Resume、Rollback |
| Human Approval Queue | Owner承認待ち |
| Run Log | 実行履歴とCorrelation ID |

## 11.3 全自動化してよいこと／止めること

| 分類 | 自動化可 | Owner確認 |
| --- | --- | --- |
| 読取・検索 | 原則可 | Restricted情報は権限確認 |
| 設計提案 | 可 | 重大方針採用はJudge/Owner |
| 実装 | 認可済みScope内 | 不可逆・広範変更 |
| Test | 可 | 外部課金・本番副作用 |
| Policy UPDATE | 不可 | Owner承認必須 |
| Knowledge ACTIVE化 | 条件付き | Global/MandatoryはOwner/Domain Review |
| 公開・送信・削除 | 原則不可 | 明示承認 |
| Emergency Stop | Ownerが即時実行 | 解除もOwner |

# 第12章　Role Execution Architecture

| Role | 主責務 | 独立性要件 | 主出力 |
| --- | --- | --- | --- |
| Orchestrator | Active Project/Task確認、Routing、Status/Context/Cost/Model管理 | 実装判断と審査判断を代行しない | Execution Plan、Status Update |
| Builder | 設計・実装・修正 | Critic/Judgeの判断を先取りしない | Proposal、Final Plan、Implementation |
| Critic | 欠陥・矛盾・Risk検出 | Builderの意図ではなくArtifactを評価 | Critic Review、Implementation Review |
| Tester | 実行・観察・再現性検証 | Builder報告をPASS根拠にしない | Test Report、Retest |
| Judge | 拘束的判断 | 独立ContextとEvidence | Decision、Consistency Check |
| Project Policy Agent | Policy gap、UPDATE、VERIFY | 提案と承認を混同しない | Policy Review |
| Domain Reviewer | 専門知識の正確性審査 | Project利害よりEvidence優先 | Domain Review |
| Owner | 最終Authority | AI判断を必要に応じ拒否 | Approval、Emergency Stop |

## 12.1 Role Prompt構築

1. Workspace/ProjectのCanonical Rulesを読み込む。

1. Role Specificationを読み込む。

1. Canonical StatusとCurrent Phaseを読み込む。

1. Taskに必要なArtifactだけを読み込む。

1. Knowledge PackをContext Manifest経由で読み込む。

1. Authority、Allowed Files、Stop Conditions、Expected Outputを付与する。

1. Prompt ChecksumとRun IDを記録する。

# 第13章　End-to-End Sequence

| 順序 | 主体 | 処理 |
| --- | --- | --- |
| 1 | Owner / Orchestrator | Task定義・Scope・完了条件を作成 |
| 2 | Lifecycle OS | Task Status、Phase、Budget、Model条件を初期化 |
| 3 | Registry | 必要Specification、Role、Template、Artifactの所在を解決 |
| 4 | Lifecycle→Knowledge | Knowledge Resolution Request |
| 5 | Knowledge OS | Asset検索、競合、Version、Trust評価 |
| 6 | Knowledge→Lifecycle | Knowledge Packを返却 |
| 7 | Context Manager | Canonical Rules、Task Artifact、Knowledge Packを統合 |
| 8 | Prompt Assembler | Role Promptを構築 |
| 9 | Automation Engine | Builder/Critic/Tester/Judge等を実行 |
| 10 | Artifact Manager | 成果物を保存・Index更新 |
| 11 | Verification Engine | Schema、Evidence、Result、Gateを確認 |
| 12 | Lifecycle OS | 次Phase、Block、Pause、Stall、Closureを判断 |
| 13 | Knowledge OS | Usage Event、Candidate、Failure、Effectivenessを記録 |
| 14 | Policy Engine | 必要Policy UPDATEとVERIFY |
| 15 | Lifecycle OS | Closure Readiness→COMPLETED |
| 16 | Knowledge OS | Candidate Reviewは独立Lifecycleで継続 |
| 17 | Lifecycle OS | Archive Readiness→ARCHIVED |
| 18 | Monitoring | 全Status、Cost、Quality、Knowledge Debtを更新 |

## 13.1 Sequence図

Owner
  │
  ▼
Task Definition
  │
  ▼
Lifecycle OS ───────► Workspace Registry
  │                         │
  │                         └── Canonical Paths / Versions
  │
  ├── Knowledge Resolution Request ───► Knowledge OS
  │                                      │
  │◄──────────── Knowledge Pack ─────────┘
  │
  ▼
Context Manifest / Prompt Assembly
  │
  ▼
Automation Engine
  │
  ├── Builder ─► Critic ─► Judge
  ├── Implementation ─► Tester ─► Critic ─► Judge
  └── Project Policy ─► VERIFY
  │
  ▼
Closure / Archive
  │
  ├── Usage / Candidate ───────────────► Knowledge OS
  └── Registry Update ─────────────────► Workspace Registry

# 第14章　Data Flow Architecture

[Canonical Specifications]
 AGENTS / Common / Roles / PROJECT
              │
              ▼
      [Workspace Registry]
              │ discovery
              ▼
       [Lifecycle Context Request]
              │
              ├──────────────────────┐
              ▼                      ▼
      [Task Artifacts]       [Knowledge Resolver]
                                      │
                                      ▼
                               [Knowledge Pack]
              └──────────────┬───────┘
                             ▼
                     [Context Manifest]
                             │
                             ▼
                     [Prompt Assembly]
                             │
                             ▼
                       [Role Execution]
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
        [Task Artifacts]             [Usage / Candidate]
              │                             │
              ▼                             ▼
       [Verification / Gate]          [Knowledge OS]
              │
              ▼
      [Status / Closure / Archive]
              │
              ▼
          [Monitoring]

## 14.1 データ分類

| Data Type | 例 | 主な保護 |
| --- | --- | --- |
| Canonical Control Data | Status、Policy、Role、Knowledge Current Revision | Revision、Checksum、Authority |
| Historical Evidence | Past Artifact、Transition Log、Event Log | Append-only、read-only |
| Operational Data | Run Log、Process、Heartbeat | Retention、Correlation ID |
| Derived Data | Dashboard、要約、Prompt | 正本参照、再生成可能 |
| Sensitive Data | Secrets、個人情報、顧客情報 | Restricted、Do Not Store |
| External Reference | Official Docs、Web、User Files | Trust分類、引用制限 |

# 第15章　Safety・Failure・Recovery Architecture

| Failure | 例 | 処理 |
| --- | --- | --- |
| Canonical Conflict | 同じ対象に複数正本候補 | 停止しAuthority/Version/Checksum確認 |
| Revision Conflict | 同時更新 | expected_revision不一致で拒否 |
| Context Injection | 外部文書内の命令 | UNTRUSTEDとして無効化 |
| Mandatory Knowledge Missing | 必須Knowledge不足 | Task開始またはGateをBLOCK |
| Invalid Knowledge | 誤Knowledge判明 | INVALID＋Impact Analysis＋Follow-up |
| Budget Exceeded | Token/API/時間超過 | Hard Stop＋Owner判断 |
| Model Unavailable | Model停止・Rate Limit | 許可済みFallbackまたはBLOCK |
| Stalled Execution | 進捗停止・同じ処理反復 | Checkpoint＋Handoff＋仮説変更 |
| External Side Effect | 公開・送信・課金 | 事前認可、不可逆なら補償処理 |
| Registry Corruption | Index不整合 | Canonical Sourceから再構築 |
| Archive Integrity Failure | Link/Checksum不一致 | Rollbackまたは参照修復 |
| Emergency Stop | Owner停止 | 新規副作用停止、Checkpoint、PAUSED |

## 15.1 Recovery階層

- Retry：同じ条件で成功可能な一時障害。上限あり。

- Fallback：別Model・Tool・手順へ切替。

- Resume：Checkpointから安全に再開。

- Rollback：直前の安全な状態へ戻す。

- Compensating Action：不可逆操作の影響を別操作で補う。

- Follow-up Task：完了済みTaskを再開せず、新Taskで修正。

- Human Escalation：OwnerまたはDomain Expertへ判断委譲。

# 第16章　Monitoring・Observability Architecture（TASK-007）

| 監視領域 | 主な指標 |
| --- | --- |
| Lifecycle | Active/Paused/Blocked/Stalled、Phase滞留時間、Gate失敗率 |
| Quality | Critical/High Issue、Test PASS率、Retest回数 |
| Automation | 自動進行率、Human Approval待ち、Retry/Fallback |
| Context | Token量、重複率、Stale/Conflict、Mandatory欠落 |
| Cost | Budget、Actual、Role/Model/Tool別費用 |
| Model | 成功率、Latency、Fallback、Availability |
| Knowledge | Application率、Verification率、Recurrence率、STALE率、Knowledge Debt |
| Registry | Index不整合、再構築回数、Checksum失敗 |
| Integration | API Error、Rate Limit、外部Side Effect |
| Governance | Policy提案、承認待ち、VERIFY失敗、Deviation |

## 16.1 Alert Severity

- INFO：通常イベント、完了、予定切替。

- WARNING：Soft Budget、STALE Knowledge、Phase長期化。

- HIGH：Mandatory欠落、Repeated Stall、Policy VERIFY失敗。

- CRITICAL：正本破損、機密漏えい、不可逆誤操作、Emergency Stop。

# 第17章　Integration Architecture（TASK-008）

| Integration | 用途 | 制御点 |
| --- | --- | --- |
| GitHub | Commit、PR、Issue、Release | Branch、Approval、Token、Audit |
| MCP / Connector | 外部Tool機能 | Capability、Authority、File Boundary |
| External AI | 画像・動画・音声・BGM生成 | Cost、Prompt、License、Version |
| Video Tool | DaVinci Resolve等 | Project File、Render、Archive |
| Audio Tool | Cubase等 | Routing、Export、Plugin State |
| Communication | Slack、Gmail、Discord等 | 送信認可、機密、通知 |
| Storage | Drive、Repository、Archive | Access、Retention、Checksum |

## 17.1 Integration Gateway原則

- 外部ToolをRoleが直接無制限に呼ばず、Integration Gatewayで権限・費用・副作用を評価する。

- Connectorの利用可能CapabilityをRegistryへ登録する。

- 外部応答はReferenceまたはUntrustedとして受け取り、Canonical化にはReviewを必要とする。

- 公開・送信・削除・課金は明示Authorizationを要求する。

# 第18章　Domain適用アーキテクチャ

| Domain | Project例 | Lifecycle利用 | Knowledge利用 | Integration例 |
| --- | --- | --- | --- | --- |
| Software Development | PHP/Laravel、JavaScript | 設計→実装→Test→Review→Closure | Security、Version、Performance、Framework | GitHub、CI、Package Manager |
| AI Video Production | 動画全自動化 | 企画→素材→生成→編集→QA→公開準備 | Prompt、文字保持、破綻、Tool Version | Kling、Flow、DaVinci |
| AI SE Generation | 効果音制作 | 要件→生成→編集→品質→Asset化 | 長さ、Peak、Loop、用途、License | AI SE Tool、DAW |
| AI BGM Generation | BGM制作 | 構成→生成→Stem→MIX→QA | 尺、Structure、Loop、Stem、商用条件 | Suno、Cubase |
| AI Voice | 音声生成・収録 | 台本→生成/収録→整音→QA | 発音、Voice Identity、Noise、Rights | ElevenLabs、Fish Audio、Cubase |
| Streaming | 配信自動化 | 準備→Routing→配信→監視→終了 | OBS、Voicemeeter、Latency、障害 | OBS、TikTok、YouTube |

## 18.1 Domain追加手順

1. DomainをVocabulary RegistryへCandidate登録する。

1. PROJECT.mdでTechnology、Tool、Risk、Required Knowledgeを定義する。

1. Domain Reviewerを指定する。

1. Knowledge TaxonomyとQuality Criteriaを作成する。

1. Lifecycle Phaseの追加が必要か確認する。可能な限り既存Phaseを再利用する。

1. Integration Gatewayへ必要Capabilityを登録する。

1. 実証TaskでContext、Knowledge Pack、QA、Costを検証する。

# 第19章　推奨ディレクトリアーキテクチャ

BAISOUND/
├─ AGENTS.md
├─ docs/
│  └─ ai-team/
│     ├─ README.md
│     ├─ common/
│     ├─ roles/
│     ├─ architecture/
│     │  └─ AI-Development-OS-Architecture.md
│     ├─ lifecycle/
│     ├─ knowledge/
│     │  ├─ registry/
│     │  ├─ assets/
│     │  ├─ candidates/
│     │  ├─ packs/
│     │  ├─ usage/
│     │  └─ impact-reviews/
│     ├─ registry/
│     │  ├─ projects.yaml
│     │  ├─ tasks.yaml
│     │  ├─ specifications.yaml
│     │  ├─ roles.yaml
│     │  ├─ templates.yaml
│     │  └─ artifacts.yaml
│     └─ automation/
└─ projects/
   └─ <project-name>/
      ├─ PROJECT.md
      ├─ src/
      └─ docs/
         └─ ai-team/
            ├─ config/
            ├─ templates/
            └─ tasks/
               └─ <TASK-ID>/

注意：物理Pathは各TASKのFinal Planで確定する。本図は責務と配置の推奨を示し、現在の履歴Artifactを移動する指示ではない。

# 第20章　主要インターフェース仕様

| Interface | 主な入力 | 主な出力 |
| --- | --- | --- |
| Registry Lookup Request | resource_type、id、status、version_constraint | Resource Reference |
| Knowledge Resolution Request | task、role、phase、scope、tools、version、budget、sensitivity | Knowledge Resolution Result |
| Knowledge Pack | asset_id+revision、mandatory、actions、verification、checksum | Context Manager |
| Context Manifest | sources、trust、freshness、sensitivity、token、checksum | Prompt Assembler |
| Execution Request | role、prompt、model_route、allowed_tools、budget、timeout | Execution Result |
| Artifact Submission | artifact_type、authoring_role、task、result、checksum | Artifact Manager |
| Gate Evaluation Request | phase、required_artifacts、results、authorization | Gate Result |
| Status Transition Proposal | expected_revision、from/to、evidence、authorization | Transition Result |
| Knowledge Usage Event | pack、asset、applied/deviated、verification、outcome | Knowledge Usage Ledger |
| Registry Update Event | resource_id、type、path、version、status、checksum | Registry Update Result |
| Monitoring Event | correlation_id、severity、component、metric、evidence | Dashboard/Alert |

## 20.1 Correlation ID

定義：Task実行、Role呼出し、Artifact、Cost、External API、Monitoring Eventを一つの実行系列として追跡する識別子。

- すべてのAutomation Runへrun_idを付与する。

- 外部API呼出し、Artifact、Ledger、Event Logへ同じrun_idを記録する。

- Retryは親run_idとattempt番号を持つ。

# 第21章　非機能要件

| 要件 | 内容 |
| --- | --- |
| 安全性 | 不明時停止、Mandatory保護、Emergency Stop、不可逆操作認可 |
| 整合性 | Revision、Checksum、Append-only Log、正本一意性 |
| 監査性 | Actor、Time、Evidence、Reason、Approval、Run IDを追跡 |
| 再現性 | 使用Context、Knowledge Revision、Model、Tool Version、Promptを再現 |
| 可読性 | 専門用語・造語・YAML項目に日本語説明 |
| 拡張性 | 新Domain、Role、Tool、Phaseを既存正本を壊さず追加 |
| 保守性 | 重複除去、Registry、Promotion/Demotion、Deprecation |
| 性能 | 必要資産だけをIndexから取得し、全Workspace Scanを避ける |
| コスト効率 | Budget、Reservation、Actual、安価Model活用。ただし品質を損なわない |
| 可用性 | Model/Tool障害時のFallback・Pause・Resume |
| 機密性 | Sensitivity、Access、Do Not Store、最小Context |
| 移植性 | 特定AIベンダーやTool名に依存せずCapabilityで設計 |

# 第22章　Security・Privacy Architecture

- SecretsはKnowledge・Prompt・Artifactへ平文保存しない。

- Restricted Sourceは許可Role・ProjectだけがContextへ含める。

- 外部Prompt InjectionをUntrustedとして無効化する。

- External Connectorは最小権限・Capability単位で許可する。

- 公開・送信・削除はHuman Approval Queueを経由する。

- 個人情報・医療情報・顧客機密はRetention・Masking・Access Logを持つ。

- Knowledge Promotion時に機密情報がGlobalへ昇格しないよう審査する。

- Archiveには機密区分・保持期限・削除禁止条件を引き継ぐ。

# 第23章　ロードマップとTASK対応

| TASK | 状態 | 名称 | 本アーキテクチャ上の役割 |
| --- | --- | --- | --- |
| TASK-001 | 完了 | AI Team基盤 | Role・Artifactの基礎 |
| TASK-002 | 完了 | Workflow基盤 | Debate、Judge、Final Plan、QA |
| TASK-003 | 完了 | Workspace Architecture | Common、Roles、Templates、v2.1 Alpha |
| TASK-004 | 次 | Lifecycle Foundation | Status、Phase、Gate、Context、Cost、Model、Closure、Archive |
| TASK-005 | 予定 | Knowledge Operating System | Asset、Graph、Resolution、Learning、Impact |
| TASK-006 Phase 1 | 予定 | Workspace Registry | 資産索引・Discovery |
| TASK-006 Phase 2 | 予定 | Automation Engine | Scheduler、Routing、Prompt、Recovery |
| TASK-007 | 予定 | Monitoring & Dashboard | KPI、Alert、Audit、Visualization |
| TASK-008 | 予定 | External Integration | GitHub、MCP、外部AI、制作Tool |

## 23.1 リリース目安

- v2.1 Alpha：Workspace Architecture確立済み。

- TASK-004完了：Lifecycle Foundation milestone。

- TASK-005完了：Knowledge Operating System milestone。

- TASK-006完了：半自動～全自動運転のBeta候補。

- TASK-007/008：運用・接続を含む実用化段階。

## 23.2 2026-07-27以降の優先順位変更

- TASK-004 Phase 1の完了を最優先とし、途中でArchitecture Ver.2.0実装へ切り替えない。

- Phase 1完了直後に本設計書を更新し、Context Economy、Cost Guard、Role Session LifecycleをP0へ昇格する。

- P0基盤が成立するまで、TASK-005・TASK-006および新規の高コスト開発を開始しない。

- API費用上限・Context上限・Session再起動・必要章だけの読込を実装してから開発を再開する。

# 第24章　設計判断記録

| 区分 | 判断 | 理由 |
| --- | --- | --- |
| 採用 | Layered Architecture | 責務を分離し、各TASKの変更影響を限定できる |
| 採用 | Lifecycle OSとKnowledge OSの分離 | Task進行と知識管理の正本競合を防ぐ |
| 採用 | Workspace RegistryはIndexのみ | 正本を重複させない |
| 採用 | TASK-006 Phase 1にRegistry | 全自動化前の発見基盤が必要 |
| 採用 | Human Authority Layer | 不可逆操作・例外・予算の最終責任を保持 |
| 採用 | Prompt Assemblyを独立Component | Context・Knowledge・Roleを一箇所で監査 |
| 採用 | Monitoringを独立Layer | 運用状態と品質を制御ロジックから分離 |
| 採用 | Domain Layer | プログラム以外の動画・音響にも展開 |
| 却下 | 単一Agentが設計・実装・審査・完了を自己判断 | 独立性と監査性が失われる |
| 却下 | Registryを正本として利用 | Index不整合時に全正本が壊れる |
| 却下 | Knowledge Packを直接Promptへ投入 | Context Trust・Sensitivity・Token審査を迂回する |
| 却下 | 完了済みTaskを再開 | Historical Integrityを損なう |
| 保留 | Registryの保存形式 | TASK-006でYAML/JSON/DBを比較 |
| 保留 | 専用Knowledge Curator / Status Manager Role | 運用量とAutomation設計後に判断 |

# 第25章　AI・実装者が誤解しやすい点

| 質問・誤解 | 正しい理解 |
| --- | --- |
| Workspace RegistryはDatabaseの正本か | 違う。正本への索引であり、StatusやKnowledge本文は各Canonical Sourceが正本。 |
| Context ManifestとKnowledge Packは同じか | 違う。Knowledge PackはContext Manifestへ含まれる一つのSource。 |
| Lifecycle OSはKnowledgeを選ぶか | 選ばない。Knowledge Resolverへ要求し、返されたPackをContextへ統合する。 |
| Knowledge OSはTask Statusを変えるか | 変えない。Impact Noticeを出し、Lifecycle OSがBlockやFollow-upを判断する。 |
| Automation EngineはOwner承認を代行するか | しない。承認待ちをHuman Approval Queueへ送る。 |
| Dashboardの表示がCurrent Truthか | 違う。Canonical Sourceを要約した派生表示。 |
| Project KnowledgeはGlobalより優先か | 具体化はできるが、安全・権限・契約の上位Mandatoryを弱められない。 |
| AI生成したKnowledgeは自動ACTIVEか | ならない。Candidate→Review→Approvalが必要。 |
| COMPLETED Taskへ修正を追記できるか | 原則しない。新Taskまたは新Recordで補正する。 |
| Model名を設計へ固定するか | 能力・Privacy・Cost等のProfileを中心にし、製品名はRouting設定で扱う。 |

# 第26章　全体アーキテクチャ受入基準

- 各機能に唯一の主責務Layer・Componentが割り当てられている。

- Task Status、Knowledge Status、Registry Statusが混同されていない。

- 正本、索引、派生物を区別できる。

- TASK-004とTASK-005のInterfaceが双方向に定義されている。

- TASK-006がRegistry→Lifecycle→Knowledge→Context→Roleの順で実行できる。

- Owner承認が必要な操作をAutomationが迂回できない。

- 外部資料内の命令がCanonical Policyを上書きしない。

- プログラム、AI動画、AI SE、AI BGMへ同じOS構造を適用できる。

- 障害時にRetry、Fallback、Resume、Rollback、Compensation、Follow-upを使い分けられる。

- MonitoringがCanonical Sourceを変更せず、状態を観測できる。

- 専門用語・造語・構造項目に日本語説明がある。

# 第27章　次工程

1. 本Architecture設計書をTASK-004・TASK-005・TASK-006以降の親設計書として固定する。

1. TASK-004 task.mdを作成し、Phase 1としてStatus／Phase／Gate／Authorization／Transition Protocolを定義する。

1. TASK-004のBuilder Proposal、Critic、Judge、Final Planを進める。

1. TASK-004承認後にLifecycle関連README・Common・Role・Templateを更新する。

1. TASK-005 task.mdでは、本書のKnowledge OSと責務境界を入力とする。

1. TASK-006 task.mdでは、Phase 1 Workspace Registry、Phase 2 Automation Engineを明記する。

1. 設計書・System Filesの更新時は、親Architectureとの整合性確認を必須とする。

現時点の推奨次作業：TASK-004の正式なtask.md作成。

# 付録A　アーキテクチャ索引

| 探したい内容 | 参照章 |
| --- | --- |
| 全体レイヤー | 第4章 |
| Component責務 | 第5章 |
| 正本とIndex | 第6章 |
| 権限・Trust | 第7章 |
| TASK-004 | 第8章 |
| TASK-005 | 第9章 |
| Workspace Registry | 第10章 |
| 全自動化 | 第11章 |
| Role | 第12章 |
| Sequence | 第13章 |
| Data Flow | 第14章 |
| Failure/Recovery | 第15章 |
| Monitoring | 第16章 |
| 外部連携 | 第17章 |
| 動画・音響等への適用 | 第18章 |
| ディレクトリ | 第19章 |
| Interface | 第20章 |
| 非機能要件 | 第21章 |
| Security | 第22章 |
| Roadmap | 第23章 |

# 付録B　最小構成の全体像

Human Owner
    │ approval / emergency stop
    ▼
Governance + Workspace Registry
    │ rules / discovery
    ▼
Lifecycle OS ─────► Knowledge OS
    │                │
    │◄── Knowledge Pack
    ▼
Context Manifest + Prompt Assembly
    ▼
Automation Engine
    ▼
Builder / Critic / Tester / Judge / Policy
    ▼
Artifacts + Verification
    ├── Lifecycle Status / Closure / Archive
    └── Knowledge Usage / Candidate / Learning
    ▼
Monitoring + Integrations

## 27.1 Ver.2.0移行前の実行順序

1. 1. TASK-004 Phase 1のD-05／D-06限定Final Plan Amendmentを完成させる。

1. 2. Judge Consistency Check、Fix Cycle 3、独立Retest、Implementation Review、Final Judgmentを完了する。

1. 3. Phase 1完了記録とLessons Learnedを固定する。

1. 4. 本設計書のContext Economy／Cost Guard／Session Lifecycleを実装可能な仕様へ落とす。

1. 5. 低コスト基盤の導入後にTASK-005以降を再開する。

# 第28章　Ver.1.1統合準備改訂の目的

本章以降は、Ver.1.3 Alpha最終設計書、Ver.2.1 Alpha差分設計書、TASK-004／TASK-005詳細設計書、責務境界レビュー、整合性監査の結果をArchitecture Ver.1.0へ統合した追加仕様である。Ver.1.0のレイヤー・コンポーネント構造は維持しつつ、旧Canonical仕様との対応、移行規則、TASK-004を安全に開始するための契約を明文化する。

| 項目 | Ver.1.1での扱い |
| --- | --- |
| Architecture Ver.1.0 | 全面置換せず、基礎構造として継承 |
| Ver.1.3 Alpha Canonical章 | Role、Workflow、文書権威、成熟度、実証履歴の詳細正本として維持 |
| TASK-004 Ver.1.1 | Lifecycle OSの詳細正本候補 |
| TASK-005 Ver.1.1 | Knowledge OSの詳細正本候補 |
| 責務境界レビュー | LifecycleとKnowledgeの正式インターフェースとして採用 |
| 本Ver.1.1追加章 | 旧設計と新設計の対応・移行・安全開始契約 |

# 第29章　Canonical Reference Map

| Architecture Ver.1.1 | 参照する旧Canonical章 | 正本内容 |
| --- | --- | --- |
| Architecture 第3章 アーキテクチャ原則 | Ver.1.3 Alpha 第4章・第36章 | 文書権威、Evidence、正本性 |
| Architecture 第4～6章 レイヤー／Component／正本 | 第3章・第4章・第31章・第45章 | Workspace境界、成果物構造、AI Development OS定義 |
| Architecture 第7章 Governance | 第18章・第19章・第37章・第50章 | Policy、Risk、Knowledge Governance |
| Architecture 第8章 Lifecycle OS | 第21章・第32章・第41～44章 | 全体Lifecycle、QA Gate、TASK-004移行 |
| Architecture 第9章 Knowledge OS | 第46～52章 | Knowledge Layer、Asset、Lifecycle、KDD |
| Architecture 第10章 Registry | 第31章・第51章 | 成果物構造、Repository/Index |
| Architecture 第11～13章 Automation/Role/Sequence | 第2章・第5章・第10～16章・第30章 | Canonical 6 Role、標準Workflow、Prompt |
| Architecture 第15章 Safety/Recovery | 第13章・第34～39章 | 差戻し、Stall/Handoff、Evidence保全 |
| Architecture 第16章 Monitoring | 第23章・第52章 | 成熟度Roadmap、KDD Metrics |
| Architecture 第18章 Domain適用 | Ver.2.1 Alpha差分設計書 | 動画制作等のProject展開 |

参照原則：Architectureは全体構造と責務境界の正本であり、旧Canonical章の詳細工程・実証履歴を黙って置換しない。

# 第30章　Legacy-to-Current Mapping

## 30.1 旧7層から新11層への対応

| 旧7層 | 新Architecture | 統合時の意味 |
| --- | --- | --- |
| Human Layer | L0 Human Authority | Owner、Reviewer、Domain Expertへ詳細化 |
| AI Layer | L6 Automation＋L7 Role Execution | 制御とRole実行へ分離 |
| Knowledge Layer | L5 Knowledge OS | Taxonomy、Graph、Resolution、Impactへ詳細化 |
| Workflow Layer | L4 Lifecycle OS＋L6 Automation | 状態管理と自動実行へ分離 |
| Governance Layer | L3 Governance＋L0 Human Authority | Policy評価と最終Authorityを分離 |
| Repository Layer | L1 Workspace＋L2 Registry＋各Repository | 保存領域と索引を分離 |
| Infrastructure Layer | L9 Integration＋L10 Domain＋実行環境 | 外部接続とProject実装へ詳細化 |

## 30.2 旧Task状態から新直交モデルへの対応

| 旧表現 | task_status | current_phase | gate_status / authorization |
| --- | --- | --- | --- |
| DESIGN_IN_PROGRESS | ACTIVE | DESIGN | READYまたはNOT_EVALUATED |
| IMPLEMENTATION_READY | ACTIVE | IMPLEMENTATION_AUTHORIZATION | PASS / PENDING |
| IMPLEMENTATION_IN_PROGRESS | ACTIVE | IMPLEMENTATION | PASS / AUTHORIZED |
| CLOSURE_PENDING_POLICY | ACTIVE | POLICY_REVIEWまたはCLOSURE | READY / 必要認可 |
| TASK COMPLETE | COMPLETED | CLOSURE | PASS / AUTHORIZED |
| ARCHIVED | ARCHIVED | ARCHIVE | PASS / AUTHORIZED |
| BLOCKED | BLOCKED | 直前Phase保持 | BLOCKED |

変換原則：旧表現を削除せずHistorical Evidenceとして保持し、新Canonical Status Recordで直交モデルへ変換する。

## 30.3 Knowledgeの3軸モデル

| 軸 | 値の例 | 目的 |
| --- | --- | --- |
| Asset Status | CANDIDATE、DRAFT、UNDER_REVIEW、ACTIVE、STALE、DEPRECATED、INVALID、ARCHIVED | 現在利用できるか |
| Maturity Stage | EXPERIENCE、OBSERVATION、IDEA、KNOWLEDGE_ASSET、FRAMEWORK、STANDARD、ORGANIZATION_STANDARD | 知識がどの成熟段階か |
| Enforcement Level | MANDATORY、CONDITIONAL_MANDATORY、ADVISORY、REFERENCE | どの強さで適用するか |

STANDARDの扱い：旧Knowledge StatusのSTANDARDは、新設計ではMaturity Stageへ移し、ACTIVE等のAsset Statusと併用する。

# 第31章　Canonical 6 Roleと補助Roleの境界

| 分類 | Role / Capability | 扱い |
| --- | --- | --- |
| Canonical Core Role | Orchestrator、Builder、Tester、Critic、Judge、Project Policy Agent | 従来どおり6 Roleを唯一のCore Team Modelとする |
| Supplemental Review Role | Domain Reviewer | PHP、AI動画、AI BGM等で専門審査が必要な場合のみ追加 |
| Knowledge Capability | Knowledge Author、Knowledge Reviewer、Repository Steward | Core Roleまたは補助Roleが必要に応じて担う |
| Future Dedicated Role | Knowledge Curator、Status Manager | 運用量・自動化方式を検証後に追加判断 |

- Domain Reviewerを7番目の常設Canonical Roleとして扱わない。

- 補助RoleはCore Roleの最終判断権を代行しない。

- Judgeの拘束的判断、Project Policy AgentのPolicy提案・VERIFY、Ownerの最終Authorityを維持する。

## 31.1 Project Policy AgentとLifecycle Managerの責務分担

| 主体 | 責務 |
| --- | --- |
| Project Policy Agent | Status・Risk・Documentation Syncの更新要否を検出し、提案し、Policy UPDATE後の整合性をVERIFYする |
| Lifecycle Manager | 承認済み根拠に基づいてCanonical Status RecordとTransition Logを原子的に更新する |
| Owner | Policy変更、重大例外、Archive等の最終承認 |

# 第32章　Canonical Workflow Preservation

Architecture内のSequence図は全体俯瞰であり、Ver.1.3 Alpha第5章・第32章のCanonical Workflowを短縮・廃止・置換するものではない。以下の工程はTASK-004以降も必須である。

1. Active ProjectとActive Taskを確定する。

1. task.mdを作成し、OwnerがScope・制約・完了条件を承認する。

1. Builder Proposalを作成する。

1. Critic Reviewを作成する。

1. Builder Responseで各Issueへ回答する。

1. Judge Design Decisionを作成する。

1. 承認条件を反映してfinal-plan.mdを作成する。

1. JudgeがFinal Plan Consistency Checkを実施する。

1. FINAL_PLAN_PASSと明示的Implementation Authorizationを確認する。

1. Builderが実装する。

1. Testerが独立検証する。

1. Criticが独立Implementation Reviewを実施する。

1. 必要なFixとRetestを行う。

1. JudgeがFinal Implementation Decisionを作成する。

1. Project Policy Reviewを行い、必要時DETECT→PROPOSE→APPROVAL→UPDATE→VERIFYを実行する。

1. Closure Readiness、Canonical Status、Risk、Follow-up、Knowledge Candidateを確認する。

1. TASK COMPLETE後、Archive Readinessに従ってArchiveする。

実装時正本：Judge承認済みfinal-plan.mdを実装仕様の正本とする。古いProposalや会話履歴を実装根拠にしない。

認可分離：Judge設計承認・Final Plan PASS・Implementation Authorizationは別判定であり、いずれか一つだけで実装開始しない。

# 第33章　KDD・Human×AI Knowledge Heritage

Knowledge OSは、Ver.1.3 Alphaで定義したKnowledge Driven Development（KDD）とHuman × AI Collaborative Knowledge Systemを実装可能なSubsystemへ具体化したものである。

| 旧概念 | Ver.1.1での継承先 |
| --- | --- |
| Human × AI × Repository三位一体 | Human Authority＋Role Execution＋Knowledge Repository |
| Knowledge Creation Loop | Candidate→Review→Asset→Apply→Verify→Usage/Feedback |
| Knowledge Flywheel | Usage・Effectiveness・Failure・Promotion/Demotion |
| Organizational Second Brain | Workspace横断Knowledge Repository＋Registry |
| Knowledge-First Development | Task開始時のKnowledge ResolutionとKnowledge Pack |
| Knowledge Debt | Monitoring指標、STALE、Candidate backlog、Duplicate、Owner不在 |
| Knowledge Refactoring | Asset Revision、Merge、Split、Demotion、Supersede |
| Knowledge ROI | 再発率、再作業削減、Context準備時間、品質向上、費用削減 |
| KDD Manifesto | Architecture原則P-09 Continuous LearningとNo Silent Weakening |

## 33.1 Knowledge成熟段階

EXPERIENCE
  ↓
OBSERVATION
  ↓
IDEA
  ↓
DRAFT / REVIEW / EVIDENCE
  ↓
KNOWLEDGE_ASSET
  ↓
FRAMEWORK
  ↓
STANDARD
  ↓
ORGANIZATION_STANDARD
  ↓
CONTINUOUS_IMPROVEMENT

注意：この成熟段階はAsset Statusとは別軸である。成熟していてもSTALEやDEPRECATEDになることがある。

# 第34章　TASK-003 Migration Contract

TASK-003およびそれ以前のArtifactはHistorical Evidenceとして保持し、TASK-004の新仕様を遡及的に上書きしない。TASK-004では、移行用の新Artifactを追加する。

| 移行項目 | 必須処理 |
| --- | --- |
| 旧状態 | CLOSURE_PENDING_POLICY等をLegacy-to-Current Mappingで新直交モデルへ変換 |
| Canonical Status | TASK-003用の新Canonical Status Recordを作成 |
| Evidence | 既存Task Artifactを変更せずauthoritative_evidenceとして参照 |
| Risk | Accepted、Residual、Deferred、Resolvedを区別 |
| Policy | 必要なPolicy Review、UPDATE、VERIFYの実施状況を記録 |
| Closure | Closure Readinessを新仕様で判定 |
| Archive Destination | Archive先またはIn-place Archive方式を明示 |
| Archive Procedure | 移動、Index、Checksum、Rollback、Post-Archive VERIFYを定義 |
| Knowledge Candidate | TASK-003由来候補の有無とTASK-005への引渡し |

完了条件：TASK-003はTASK-004の移行Acceptanceを満たすまで、既存Evidenceを保持したまま参照可能状態とする。

# 第35章　Repository Migration

| 旧配置 | 新推奨配置 | 扱い |
| --- | --- | --- |
| BAISOUND/knowledge/ | BAISOUND/docs/ai-team/knowledge/ | Workspace共通AI Development OS資産として集約 |
| Project内の一時メモ | projects/<project>/docs/ai-team/tasks/<TASK-ID>/ | Task Evidenceとして保持 |
| Project固有Knowledge | Knowledge Assetのscope=PROJECTで共通Repositoryへ保存、またはProject配下に参照 | Final Planで確定 |

## 35.1 移行規則

1. 旧Pathの内容を一覧化し、Knowledge Asset、Evidence、一時メモへ分類する。

1. 内容を自動的にACTIVE Knowledgeへ変換しない。

1. 正式AssetはTASK-005 Reviewを通す。

1. 移動前後でChecksumと参照を確認する。

1. 旧Pathは移行完了まで削除せず、Deprecated PointerまたはREADMEを置く。

1. Workspace Registry完成後にCanonical PathをIndexへ登録する。

# 第36章　System File Synchronization Plan

| 更新対象 | TASK-004での更新 | TASK-005での更新 | 更新Gate |
| --- | --- | --- | --- |
| AGENTS.md | Lifecycle、Status、Authorization、Resume、Closure、Archiveの共通規則 | Knowledge優先順位、Mandatory、Deviation、Historical Evidence | 各Task Judge承認＋Policy Approval後 |
| README-Common | Context/Cost/Model、Canonical Status参照 | Knowledge Pack、Trust、Resolution | 各Task Policy UPDATE/VERIFY |
| Vocabulary Specification | Lifecycle Status、Phase、Gate、Authorization | Knowledge Type、Status、Maturity、Enforcement | Schema承認後 |
| Authority Specification | Status更新、Emergency Stop、Archive | Promotion、Global昇格、INVALID、Deviation | Authority Review後 |
| Evidence Specification | Transition、Checkpoint、Closure/Archive Evidence | Source Trust、Usage、Impact Evidence | Evidence Review後 |
| Artifact Specification | Lifecycle Artifact追加 | Knowledge Artifact追加 | Template整合確認後 |
| Workflow Specification | Canonical WorkflowとLifecycle連携 | Resolution/Application/Verification連携 | Final Plan後 |
| Role Specifications | 各RoleのTASK-004責務 | 各RoleのTASK-005責務 | Role Boundary Review後 |
| Templates | Status、Checkpoint、Closure、Archive | Candidate、Pack、Deviation、Impact | Template Test PASS後 |

更新禁止：Builder Proposalや設計レビューの途中でSystem Filesを先行更新しない。Judge承認済みFinal PlanとOwner/Policy承認後にまとめて更新し、VERIFYする。

# 第37章　TASK-004 Safe Execution Contract

TASK-004は、以下の安全契約をtask.md・Final Plan・実装・検証へ引き継ぐ。いずれかが欠ける場合、実装開始または完了判定を行わない。

| ID | 安全項目 | 必須条件 |
| --- | --- | --- |
| S-01 | Active Project/Task | 開始時にjavascript-roulette等の対象ProjectとTASK-004を明示 |
| S-02 | Protected Boundary | Active Project外・保護領域を明示許可なく検索・変更しない |
| S-03 | Historical Evidence | TASK-001～003のArtifactを直接変更しない |
| S-04 | Orthogonal State | task_status、current_phase、gate_status、authorization_statusを分離 |
| S-05 | Canonical Snapshot＋Log | 現在値はCanonical Status Record、履歴はTransition Log |
| S-06 | Concurrency | revision、expected_revision、leaseで同時更新を防止 |
| S-07 | Atomic Update | PREPARE→AUTHORIZE→LEASE→APPLY→VERIFY→COMMIT |
| S-08 | Safe Stop | PAUSED、BLOCKED、STALLED、Emergency Stopを区別 |
| S-09 | Implementation Gate | FINAL_PLAN_PASS＋明示Authorizationまで実装しない |
| S-10 | Context Safety | Duplicate Context Detector、Trust Boundary、Freshness、Sensitivityを実装 |
| S-11 | Cost/Model Safety | BudgetとActual Ledger、Capability-based Routing、Hard Stop |
| S-12 | Closure/Archive | Residual Risk、Follow-up、Knowledge Candidate、Archive Destination/Procedureを確認 |
| S-13 | TASK-003 Migration | 旧状態変換とEvidence保全をAcceptance Testに含める |
| S-14 | System Sync | README/Common/Role/Templateは承認後に更新・VERIFY |

## 37.1 TASK-004 Phase分割

| Phase | 対象 | 実装前Gate |
| --- | --- | --- |
| Phase 1 | Status／Phase／Gate／Authorization／Transition Protocol | Schema・Transition Matrix・Concurrency Review PASS |
| Phase 2 | Checkpoint／Pause／Block／Stall／Resume／Rollback | Failure/Recovery Review PASS |
| Phase 3 | Context Manifest／Duplicate Context／Trust／Freshness | Security/Context Review PASS |
| Phase 4 | Cost Budget／Actual Ledger／Model Routing | Cost/Privacy/Model Review PASS |
| Phase 5 | Closure／Archive／TASK-003 Migration | Migration/Archive Test PASS |
| Phase 6 | System File・Template同期 | Policy UPDATE＋VERIFY PASS |

分割理由：Lifecycle全体を一度に実装せず、正本状態と遷移基盤を先に確立し、その上へResume、Context、Cost、Closureを積み上げる。

# 第38章　TASK-004 Preflight Checklist

| 確認 | Preflight項目 |
| --- | --- |
| □ | Architecture Ver.1.1を親設計として指定した |
| □ | TASK-004 Ver.1.1詳細設計書を入力に指定した |
| □ | TASK-004/TASK-005責務境界を入力に指定した |
| □ | Ver.1.3 Alpha第5章・第32章・第41～44章をCanonical参照に指定した |
| □ | Active ProjectとAllowed Pathsを確定した |
| □ | TASK-001～003をRead-only Historical Evidenceとして扱う |
| □ | Task ScopeとOut of ScopeをOwnerが承認した |
| □ | Phase 1の成果物・Acceptance Criteriaを定義した |
| □ | Implementation Authorization前にsrc/・System Filesを変更しない |
| □ | Rollback PointとしてGit Commit/Tagを確認した |
| □ | Cost Budgetと時間上限を設定した |
| □ | Emergency Stop手順を確認した |

# 第39章　Ver.1.1統合準備版の最終判定

整合性判定：PASS。旧Canonical仕様と新Architectureの関係、移行、Role、Workflow、Knowledge成熟度、Repository、System File同期を明文化した。

TASK-004開始判定：READY_FOR_TASK_DEFINITION。まだ実装開始ではなく、正式task.md作成→Builder Proposal→Critic→Judge→Final Plan→Authorizationの順で進む。

禁止事項：この設計書完成をもってImplementation Authorizationと解釈しない。

# 第40章　2026-07-27時点の現在地（Canonical Progress Record）

本章は、TASK-004 Phase 1の実証状態を、会話ではなく設計書内の時点記録として残す。既存のTask Artifactが個別Evidenceの正本であり、本章はそれらを置き換えず、現在地を参照しやすくするProgress Recordである。

| 区分 | 現在状態 | 判定・補足 |
| --- | --- | --- |
| TASK | TASK-004 — Lifecycle Foundation | Phase 1 Canonical State Foundationを実証中 |
| 設計 | Final Plan PASS済み | 初版Final PlanとConsistency Checkは保持 |
| 実装 | 初回実装＋Fix Cycle 1／2完了 | D-01〜D-04は独立RetestでPASS |
| 独立検証 | RETEST_NOT_CONFIRMED | D-05 BLOCKING、D-06 NOT_CONFIRMED |
| 限定設計改訂 | Judge承認済み（条件付き） | design-amendment-d05-d06.md／judge-amendment-decision.md |
| 現在の次工程 | Final Plan Amendment作成 | その後Judge Consistency Check再実施 |
| 実装認可 | NOT_AUTHORIZED | Fix Cycle 3は未認可 |
| Implementation Review | NOT_ALLOWED | D-05／D-06解消前は進まない |
| Commit／Push | 設計BaselineのみCommit済み | 実装・Fix・Retestの現行差分は未Commit／未Push |

## 40.1 完了済みGate

- Task Definition、Builder Proposal、Detailed Design Review、Builder Responseを完了した。

- Architecture ReviewはARCHITECTURE_PASSとなった。

- Judge Design DecisionはAPPROVED_WITH_CONDITIONSとなり、F-01〜F-03をFinal Planへ統合した。

- Final Plan Consistency CheckはFINAL_PLAN_PASSとなった。

- 実装PreflightはNode v24.18.0／Linux WSL2／ext4／同一filesystemでPASSし、Ownerの限定認可後に実装した。

- D-01（Authorization／Evidence）・D-02（superseded／fencing）・D-03（PREPARED recovery）・D-04（task_id／Schema入口検証）は独立RetestでPASSした。

## 40.2 未完了Gate

- D-05：VERIFY失敗時のJournal cleanupおよびCrash Recoveryの完全検証。

- D-06：append-only、tamper、duplicate、MIGRATION_MAPPINGの完全検証。

- D-05／D-06限定Final Plan Amendmentの作成とJudge Consistency Check。

- Fix Cycle 3、独立Retest Cycle 3、Implementation Review、Final Judgment、Policy Review、Closure。

# 第41章　保持している正本・Evidence・実装資産の記録

本章は「何を残しているか」を明示する。各Artifactの本文・判定・履歴は個別ファイルが正本であり、本章は所在と役割を示す索引である。

## 41.1 設計・判断Evidence

| Artifact | 役割 | 状態 |
| --- | --- | --- |
| task.md | TASK-004のScope、Out of Scope、Acceptance、Stop Conditions | 保持・変更禁止 |
| builder-proposal.md | Phase 1初期設計提案 | 保持 |
| critic-review.md | Detailed Design Review | 保持 |
| builder-response.md | F-01〜F-03へのBuilder回答 | 保持 |
| architecture-review.md | Architecture Review | ARCHITECTURE_PASS |
| judge-decision.md | 設計採否 | APPROVED_WITH_CONDITIONS |
| final-plan.md | 初版実装正本 | FINAL_PLAN_PASS |
| final-plan-consistency-check.md | 初版Final Plan整合性判定 | FINAL_PLAN_PASS |
| design-amendment-d05-d06.md | D-05／D-06限定設計改訂案 | AMENDMENT_READY_FOR_JUDGE |
| judge-amendment-decision.md | 限定改訂採否 | AMENDMENT_APPROVED_WITH_CONDITIONS |

## 41.2 実装・検証Evidence

| Artifact | 役割 | 状態 |
| --- | --- | --- |
| implementation-report.md | 初回実装結果 | IMPLEMENTATION_COMPLETE_WITH_RESIDUAL_RISK |
| test-report.md | 独立初回テスト | TEST_FAIL |
| implementation-fix-report.md | Fix Cycle 1／2の累積修正記録 | 保持 |
| retest-report.md | 第1回Retest | RETEST_FAIL |
| retest-report-02.md | 第2回Retest | RETEST_NOT_CONFIRMED |
| Phase 1 runtime | src/lifecycle/phase1/** | 現行実装 |
| Phase 1 tests | tests/lifecycle/phase1/** | Builder test 10 PASS時点 |
| Schema／config／prototype state | docs/ai-team/lifecycle/phase1/** | 現行実装・試験資産 |

## 41.3 Git基準点と履歴保全

- 設計完了Baseline Commit：78eccfcd5fc08dedee88ee179085c1e179945440。

- Rollback Commitは同一Baselineを使用する。

- TASK-001〜TASK-003および既存TASK-004設計EvidenceはHistorical Evidenceとして変更しない。

- 限定改訂は既存Final Planを上書きせず、Amendment Artifactとして追加する。

- 現行実装差分は、Final Judgment前に無断でCommit／Pushしない。

# 第42章　2026-07-27に新たに判明・確定した事項

本章は、実運用によって新たに得られたOperational Knowledgeを記録する。採用済み・次版採用・検討中を混同しない。

| ID | 事項 | 状態 | 反映先 |
| --- | --- | --- | --- |
| OP-001 | Canonical Document Reading Rules | Artifact Specificationへ追記済み | Ver.2.0で正式統合 |
| OP-002 | Critic Roleを増やさずReview Modeで拡張 | Ver.1.2／2.0正式採用方針 | Review Framework |
| OP-003 | builder-response-<review-mode>.md命名 | 次版正式採用 | Artifact／Workflow |
| OP-004 | TASK Completion Review | 次版正式採用 | Closure Workflow |
| OP-005 | Role Session Lifecycle／Session Reset | P0候補 | Context／Runtime |
| OP-006 | Execution Timeout／Empty Command Detection | P0候補 | Stall／Recovery |
| COST-001 | OpenAI APIで約44 USD消費しQuota到達 | 重大運用Incident | Cost Guard設計根拠 |
| CTX-001 | 単一SessionでRoleを切替えるとContextが累積 | 根本原因として採用 | Context Economy |
| FMT-001 | DOCX毎回抽出は高コスト・不安定 | 改善対象 | AI用Markdown／Summary |

## 42.1 Role・Agent・Execution Modelの分離

- Roleは「何をするか」を定義する。Builder、Critic、Tester、Judge等はCanonical Roleとして維持する。

- Agentは「誰／どの実行主体がRoleを担うか」を示す。単一LLM、サブエージェント、外部Agent等を含む。

- Execution Modelは「どのように実行するか」を示す。Sequential、Multi-Agent、Distributed、Human Hybrid、Full Autonomousを区別する。

- 現在のCursor運用は、表面上別Agentが常駐する方式ではなく、単一SessionがRoleを順次切り替えるSequential Executionである可能性が高い。

- 物理Agent分離がなくてもRole分離は成立するが、Context分離・独立性・費用面では不十分である。

## 42.2 Session Stallの実証知見

- 空のShell commandが発行され、約10分間出力なしで停止する事象を確認した。

- 同じ試行を繰り返さず、安全停止して変更済みファイル・最後の成功点・未実行TestをCheckpoint化する必要がある。

- 新Sessionは最小のResume Packageから再開し、長い会話履歴を引き継がない。

# 第43章　Sustainable AI Development Architecture（最優先改訂）

AI Development OSは、安全であるだけでなく、継続可能な費用とContext量で運用できなければならない。本章ではCost、Context、Sessionを非機能要件ではなくArchitectureの第一級資源へ昇格する。

## 43.1 新しい中核原則

| 原則 | 内容 |
| --- | --- |
| Context is a Resource | ContextはCPU・Memoryと同じ有限資源であり、計測・割当・解放・再利用の対象とする。 |
| Tokens are Budget | TokenとAPI費用をTask・Role・Session単位で予算化する。 |
| Read Only What Is Needed | 全文読込を既定にせず、必要Artifact・必要章だけをLazy Loadする。 |
| Do Not Re-read Unchanged Content | Version／Hash一致時は再読せず、Canonical SummaryまたはCacheを使用する。 |
| Session Must Be Disposable | Sessionは常駐資産ではなく、Role実行単位で生成・終了・再起動できる。 |
| Evidence, Not Conversation | Role間Handoffは会話履歴ではなくCanonical ArtifactとContext Manifestで行う。 |
| Cost Failure Is a Stop Condition | Quota不足、予算超過、異常なContext増加は安全停止条件である。 |

## 43.2 Context Economy Subsystem

- Context Manifest：Roleごとの必読・任意・禁止Artifactを機械可読に列挙する。

- Canonical Summary：Architecture全文ではなくVersion、Hash、主要制約、変更章を要約する。

- Artifact Importance：A（毎回）／B（変更時）／C（初回・必要時）／D（Owner要求時）の読込階層を持つ。

- Smart Loader／Lazy Loading：Roleの目的に必要な章だけ読み、全文読込を禁止できる。

- Artifact Cache：Version／Hash一致時は既読内容を再送しない。

- Resume Package：Task ID、現在Gate、直近Artifact、Allowed／Protected Paths、残予算、次Actionだけを保持する。

## 43.3 Cost Guard

- Task Budget、Role Budget、Session Budgetを分離する。

- Prompt Tokens、Completion Tokens、推定費用、実費、再読回数、Cache Hit率、処理時間を記録する。

- Soft Limitでは警告とContext削減を行い、Hard Limitでは新規実行を停止する。

- Quota／Billing Errorを検出した場合は、成果物・Checkpointを保存し、Owner確認なしに再試行しない。

- 月次予算を超える運用は既定で拒否し、Ownerの明示認可を必要とする。

## 43.4 Role Session Lifecycle

1. OrchestratorがRole AssignmentとContext Manifestを作成する。

1. Roleごとに新規Sessionを起動する。

1. Roleは必要Artifactだけを読み、許可されたArtifactを作成する。

1. Role完了時にResume PackageとMetricsを保存する。

1. Sessionを終了・破棄する。

1. 次Roleは新規Sessionとして正本Artifactから開始する。

## 43.5 AI向けCanonical Format

- DOCXは人間向け閲覧版として保持する。

- AI実行時の優先形式はMarkdownまたは構造化JSONとする。

- DOCXとMarkdownの同期方法、Hash、Version、正本関係を定義する。

- AIは毎回DOCXをZIP展開・XML抽出せず、Machine-Readable Copyまたは必要章を読む。

- 差異を検出した場合は推測で続行せず、Canonical Conflictとして停止する。

# 第44章　費用Incidentと開発継続条件

OpenAI API利用で約44 USDを消費し、Quota exceededにより当月のAPI開発継続が困難になった。本件は単なる請求上の問題ではなく、Architecture上の重大な運用Incidentとして扱う。

## 44.1 根本原因

- 同一SessionがRoleを切り替え、Contextを累積した。

- Builder、Critic、Judge、Testerが同じArchitecture・Specification・Evidenceを繰り返し全文読込した。

- DOCX抽出、長文Prompt、複数Fix／Retest Cycleに対するCost上限がなかった。

- RoleごとのSession Budget、Task Budget、Hard Stop、Cacheが未実装だった。

- 進捗の正本がArtifactにあるにもかかわらず、会話Contextへ依存した。

## 44.2 即時方針

- TASK-004 Phase 1を除き、新規の高コスト実装を停止する。

- Phase 1完了後、設計書更新を行い、Context Economy／Cost Guardを最優先TASKとする。

- 有料APIを無制限に使う運用を廃止し、無料枠・定額枠・ローカル処理・低価格Modelを組み合わせる。

- 予算のない月は、設計・文書整理・ローカル検証を中心にし、API呼出しを前提にしない。

- 開発再開条件は、Task／Session予算、Hard Stop、Context Manifest、再読防止、Session Resetが利用可能であること。

## 44.3 目標

品質を維持しながらAPI費用を大幅に削減することを目標とする。ただし、特定の削減率を保証値とはせず、Metricsにより実測して改善する。

# 第45章　改訂後ロードマップ（P0優先）

| Priority | テーマ | 主な成果 | 開始条件 |
| --- | --- | --- | --- |
| P0-1 | Context Economy Foundation | Context Manifest、Summary、Importance、Lazy Loader、Cache | TASK-004 Phase 1完了 |
| P0-2 | Cost Manager／Budget Guard | Token・費用計測、Soft／Hard Limit、Quota Recovery | P0-1と並行設計可 |
| P0-3 | Role Session Lifecycle | Role別新規Session、Resume Package、Session Reset | Context Manifest確定後 |
| P0-4 | Stall／Timeout Recovery | Empty Command検出、Timeout、Checkpoint、再起動 | Session Lifecycleと統合 |
| P0-5 | AI Canonical Markdown | DOCX／Markdown同期、Hash、必要章読込 | 正本規則承認後 |
| P1 | Execution Model／Capability | Sequential／Multi-Agent等、Agent選択 | P0運用後 |
| P2 | TASK-005 Knowledge OS | 階層Knowledge、継続学習、再発防止 | 低コスト基盤稼働後 |
| P3 | TASK-006 Automation | Registry、Role起動、Routing、自動化 | Session Lifecycle稼働後 |

## 45.1 TASK-004 Phase 1完了までの直近工程

1. final-plan-amendment-d05-d06.mdを作成する。

1. Judgeがfinal-plan-consistency-check-amendment-d05-d06.mdを作成し、PASSを確認する。

1. OwnerがD-05／D-06限定Fix Cycle 3を認可する。

1. BuilderがFix Cycle 3を実装し、Testerがretest-report-03.mdで独立検証する。

1. PASS後にImplementation Review、Final Judgment、Policy Review、Completion Reviewへ進む。

1. Phase 1完了後、本Ver.2.0のP0設計を実装可能なTaskへ分解する。

# 第46章　非破壊統合・履歴保全ルール

- Ver.1.1までの章・表・設計判断は削除せず、本Ver.2.0へ継承する。

- 過去時点を記録した章は、現在仕様と異なってもHistorical Recordとして保持し、後続章から差分を示す。

- TASK-004の個別Artifactを本設計書へ全文複製せず、正本Artifactを参照する。

- 新たな方針は「採用済み」「次版採用」「候補」「Deferred」を明示し、混同しない。

- Final Plan、Judge Decision、Test Report等の既存Evidenceを遡及編集しない。

- 本章以降の更新もDETECT → PROPOSE → OWNER APPROVAL → UPDATE → VERIFYに従う。

## 46.1 本版の最終状態

| 項目 | 状態 |
| --- | --- |
| Architecture Version | Ver.2.0 持続可能開発・現状記録統合版 |
| TASK-004 Phase 1 | 進行中。D-05／D-06限定Final Plan Amendment待ち |
| P0 Cost／Context改革 | 設計方針を正式採用。実装はPhase 1完了後 |
| TASK-005／006 | P0基盤成立まで開始保留 |
| 既存内容 | 削除せず継承 |
| 次回更新 | TASK-004 Phase 1完了時のCompletion RecordとP0 Task分解 |


# Part II — Ver.2.1 Current Synchronization Addendum

## 47. Standard Execution Context

```yaml
execution_context:
  preferred_runtime_interface: INLINE_CHAT_LINUX
  workspace:
    os: linux
    distribution: Ubuntu
    environment: WSL2
    filesystem: ext4
    workspace_root: /home/baisound
  agent_runtime:
    interface: cursor_inline_chat
    os: linux
    shell: bash
    direct_linux_execution: true
  roots:
    product_root: /home/baisound/bai-development-os
    reference_consumer_root: /home/baisound/projects/javascript-roulette
```

MUST run a Runtime Probe before Role Activation. MUST determine Workspace Environment and Agent Runtime separately. MUST NOT infer either from UI, previous sessions, or path appearance. Linux-native Tasks MUST run in `INLINE_CHAT_LINUX`; PowerShell, cmd.exe, `wsl.exe`, UNC paths, and Windows-host execution are not approved substitutes for a Linux-native Task.

## 48. Cursor Runtime Interface Classification

| Interface | Classification | Runtime OS / Shell | Linux paths directly available | Linux-native approval |
|---|---|---|---|---|
| Cursor Inline Chat | `INLINE_CHAT_LINUX` | Linux / bash | true | true |
| Agent Window | `AGENT_WINDOW_WINDOWS_HOST` | Windows / PowerShell | false | false |

A Runtime Probe MUST record working directory, HOME, shell, operating system, roots, and command completion before a Role is activated. A shell dialect MUST match the resolved runtime.

## 49. Workspace, Product, and Consumer Boundaries

```text
/home/baisound/                        Workspace Root
├── bai-development-os/                Canonical BAI Development OS Product Root
└── projects/
    ├── javascript-roulette/           Reference Consumer / Regression Project
    └── other-projects/                Other Consumer Project Roots
```

The Workspace Root, OS Product Root, and Consumer Project Roots are distinct. BAI Development OS core MUST NOT be hosted inside a consumer repository. A resolver MUST NOT treat an untracked readable artifact as nonexistent and MUST NOT cross a consumer Project boundary without authority.

## 50. TASK-004 Phase 1 Current Completion Record

| Evidence | Current status |
|---|---|
| Baseline Commit | `3ce360ba5cef063cd046d88ce007d42c0b54a275` |
| D-01 through D-06 | `CLOSED` |
| IC4-01 through IC6-01 | `CLOSED` |
| Full test suite | `88 PASS / 0 FAIL` |
| Independent probes | `23 / 23 PASS` |
| Implementation review | `IMPLEMENTATION_PASS` |
| Final judgment | `IMPLEMENTATION_APPROVED` |
| Project policy | `POLICY_PASS_WITH_CONDITIONS` |
| Git baseline | `BASELINE_COMMIT_COMPLETE` |

This record is evidence-bounded to WSL2/ext4. It MUST NOT be interpreted as closure, archive, registry-update, documentation-consistency approval, commit, push, or authorization to start TASK-005 or TASK-006.

## 51. Documentation Architecture

A canonical document set contains a Human Canonical Companion (`.docx`), Machine Canonical Authority (`.md`), and Context Economy Summary (`.summary.md`). The Canonical Document Resolver MUST identify document ID, version, status, authority, and paths before loading a document. Historical Baselines remain immutable; Current Synchronization Outputs are `DRAFT_PENDING_CONSISTENCY_CHECK` until an independent cross-format consistency check passes.

Required controls: Version Coverage Gate, cross-format consistency check, historical-evidence protection, filename safety, and non-ASCII filename risk detection. A resolver MUST use the approved ASCII canonical paths and MUST Safe Stop on ambiguous, mojibake, or conflicting path identity.

## 52. Failure Knowledge Candidates — Not Registered

The following are candidates only; none is a Registry record or an implemented Knowledge Asset.

- Existing file falsely detected as missing
- Environment inferred before Runtime Probe
- Wrong Foundation path resolution
- Role specification path omission
- Historical Evidence output collision
- PowerShell / WSL command dialect mismatch
- Untracked Evidence treated as nonexistent
- Tester source modification
- Unsupported durability error suppression

## 53. Proposed Roadmap — Not Implemented

All roadmap entries have `status: PROPOSED`, `implementation: NOT_STARTED`, and `technical_authorization: NOT_AUTHORIZED`.

| Candidate Task | Proposed scope |
|---|---|
| TASK-000 | Project Bootstrap, Project Manifest, Project Type/Domain Classification, Project DNA, Risk Profile, Knowledge Pack Selection, Workspace Validation, Runtime Interface Detection |
| TASK-005 | Global/Domain/Project-local Knowledge, Failure Knowledge Registry, Lessons Learned, Pattern Library, ADR and Operational Decision Knowledge |
| TASK-006 | Project/Knowledge/Risk Resolver, Orchestrator Instruction Compiler, Owner Decision Support Generator, Role Startup Package Generator, Role Activation Validator, Runtime Interface/Environment/Shell/Root Resolvers, Environment Capability Matrix, Execution Reliability Layer, `INVALID_START`, Safe Restart/Retry, Worktree Evidence Resolver, Git Tracking Awareness, Runtime Probe/Mutation/Fault Injection, Canonical Document Resolver, Documentation Synchronizer, Cross-format Consistency Checker, Context/Cost Guard, Conditional Automation Controller |

## 54. Machine Rules and Acceptance Criteria

- MUST preserve baseline content and historical evidence.
- MUST distinguish implemented facts, approved decisions, proposed roadmap items, and residual risks.
- MUST NOT claim Registry registration, TASK-005/006 implementation, closure, archive, or cross-format approval.
- SHOULD minimize context by using the Summary only for navigation and this Markdown for binding detail.
- Error code `DOCUMENT_CONSISTENCY_UNKNOWN` requires no-write Safe Stop and Owner resolution.
- Acceptance requires matching Document ID, Version, Status, Scope, paths, coverage evidence, baseline commit, and current verification values across DOCX, Markdown, and Summary.

## Inherited Ver.2.1 Canonical Promotion Record

- Promotion status: `CURRENT_CANONICAL`
- Promotion effective date: `2026-07-31`
- Promotion authority: Owner (`AUTHORIZED`)
- Cross-format consistency result: `CROSS_FORMAT_CONSISTENCY_PASS`
- Critical / High: `0 / 0`
- Consistency evidence: `/home/baisound/bai-development-os/tasks/TASK-004/cross-format-consistency-check.md`
- Registry synchronization: `IN_PROGRESS`
- Commit / Push / Tag / Release: `NOT_EXECUTED`
- Completion Review / Archive: `NOT_STARTED`

## 55. Inherited Version History

| Version | Status | Change |
|---|---|---|
| 2.0 | Historical baseline | Sustainable development and historical progress integration |
| 2.1 | `CURRENT_CANONICAL` | Adds runtime interface controls, completed TASK-004 Phase 1 record, document-set model, failure candidates, and proposed roadmap |


# Part III — Ver.2.2 Product Extraction & Adaptive Governance Integration

## 56. Canonical Product Identity and Repository Boundary

BAI Development OS is a standalone reusable product. Its canonical product root is `/home/baisound/bai-development-os`. The former `/home/baisound/projects/ai-team` root is superseded operationally but retained in historical provenance. `/home/baisound/projects/javascript-roulette` is a Reference Consumer / Regression Project and MUST NOT host canonical reusable OS core.

| Asset class | Canonical owner |
|---|---|
| Lifecycle / Context Guard / Governance | BAI Development OS |
| Shared Roles / Authority / Evidence / Workflow | BAI Development OS |
| Shared schemas / templates / registry | BAI Development OS |
| TASK-004 and future OS Tasks | BAI Development OS |
| Application source / project-local evidence | Consumer repository |
| `.bai-os/` adapter | Consumer repository |

Historical Evidence that records former paths remains unchanged. New operational documents and Evidence MUST use the standalone product root.

## 57. Consumer Integration Contract

Consumer projects integrate through a thin adapter such as `<consumer-root>/.bai-os/project.json`. It may declare project identity, risk metadata, build/test commands, protected paths, project overrides, and OS compatibility, but MUST NOT duplicate OS core.

Reference regression flow: OS tests -> product-boundary check -> consumer contract validation -> `javascript-roulette` regression/build -> additional reference consumers when the selected risk/profile requires them.

## 58. Adaptive Development Governance

Development process depth is selected per change using system scale, feature scale, criticality, failure impact, change breadth, reversibility, novelty, and high-risk boundaries.

| Profile | Typical use | Assurance |
|---|---|---|
| `DEV_0_QUICK` | trivial peripheral/docs-only | local verification |
| `DEV_1_LIGHT` | small reversible feature/fix | focused tests/light review |
| `DEV_2_STANDARD` | normal feature | design + tests + bounded review |
| `DEV_3_HIGH_ASSURANCE` | core/high-impact | Critic + boundary/integration/regression |
| `DEV_4_FOUNDATION_CRITICAL` | foundation/critical | independent review + dense negative/boundary/integration/regression/fault testing |

Safety floors override token economy: `CORE` is at least DEV-3; `FOUNDATION` or `CRITICAL` is DEV-4. This mechanism does not change permanent model-routing policy.

Canonical assets: `src/governance/adaptive-development-profile.mjs`, `schemas/governance/adaptive-development-profile.schema.json`, `specifications/Adaptive_Development_Governance_Specification_Ver1.0.md`, and `tests/governance/adaptive-development-profile.test.mjs`.

## 59. Product Extraction Verification

- BAI Development OS: `134 PASS / 0 FAIL`
- Product boundary: `BOUNDARY_CHECK_PASS`
- JavaScript Roulette reference consumer: `10 PASS / 0 FAIL`
- JavaScript Roulette Vite build: `PASS`
- Registry at extraction verification: `0 missing / 0 hash-or-size mismatches`

Migration Evidence: `tasks/TASK-004/p0.0-product-boundary-correction.md`, `tasks/TASK-004/p0.1-adaptive-development-governance.md`, `tasks/TASK-004/p0.0-p0.1-extraction-verification.md`.

## 60. Documentation Canonicality After Extraction

Current architecture triplet:

- Human: `/home/baisound/bai-development-os/architecture/BAI_Development_OS_Architecture_Ver2.2.docx`
- Machine: `/home/baisound/bai-development-os/architecture/BAI_Development_OS_Architecture_Ver2.2.md`
- Summary: `/home/baisound/bai-development-os/architecture/BAI_Development_OS_Architecture_Ver2.2.summary.md`

Older document sets remain audit/history assets and may contain historical paths.

## Ver.2.2 Canonical Promotion Record

- Status: `CURRENT_CANONICAL`
- Effective date: `2026-08-08`
- Authority: Owner-directed repository/product extraction
- Supersedes: Architecture Ver.2.1
- Consistency evidence: `/home/baisound/bai-development-os/tasks/TASK-004/product-extraction-documentation-consistency-check.md`
- Registry: `CURRENT_AFTER_PRODUCT_EXTRACTION`
- Commit / Push / Tag / Release: `NOT_EXECUTED`

## 61. Version History

| Version | Status | Change |
|---|---|---|
| 2.0 | Historical baseline | Sustainable development and historical progress integration |
| 2.1 | Superseded canonical baseline | Runtime controls, Phase 1 record, documentation architecture |
| 2.2 | `CURRENT_CANONICAL` | Standalone product root, consumer boundary, P0.0/P0.1 integration and extraction verification |

# Part IV — TASK-004 Phase 1.6–1.8 Implementation Synchronization

This Part is current operational architecture and supersedes earlier roadmap statements where they describe Phase 1.6, Phase 1.7, or Phase 1.8 as not implemented. Historical sections remain evidence of their original point in time.

## 49. Current Foundation Milestone

As of 2026-08-08:

| Scope | Current result | Meaning |
| --- | --- | --- |
| TASK-004 Phase 1 | `TECHNICALLY_COMPLETED_AND_APPROVED` | Existing Lifecycle state/transition foundation remains in force. |
| TASK-004 Phase 1.5 | `APPROVED_WITH_CONDITIONS` | Context Guard Core MVP baseline. |
| TASK-004 Phase 1.6 | `TECHNICALLY_COMPLETED_MVP` | Foundation-wide activation enforcement implemented. |
| TASK-004 Phase 1.7 | `TECHNICALLY_COMPLETED_MVP` | Atomic Cost Guard implemented. |
| TASK-004 Phase 1.8 | `TECHNICALLY_COMPLETED_MVP` | Retry/review/artifact/model-call budget Hard Stops implemented. |
| TASK-004 overall | `ACTIVE` | Later phases remain. This is not TASK Completion/Closure/Archive. |
| Phase 2 | `NOT_STARTED` | This document does not authorize Phase 2 implementation. |

Owner implementation authority for Phase 1.6–1.8 is recorded in `tasks/TASK-004/phase1.6-to-1.8-owner-implementation-authorization.md`.

## 50. Phase 1.6 — Foundation Guard Architecture

Foundation Guard extends Context Guard from a single guarded activation path to a reusable OS-level activation contract.

### 50.1 Mandatory activation chain

`Activation Request -> Activation Entry Registry -> State Snapshot -> Permit Issue -> Permit Canonical Validation -> TOCTOU Revalidation -> Foundation Audit -> Context Guard Gateway -> Internal Executor`

No production Role activation surface may bypass this chain.

### 50.2 Binding contract

A Foundation Permit binds at minimum:

- activation entry ID and owner;
- requester identity;
- phase and scope;
- correlation ID;
- activation-entry registry revision and checksum;
- Task/Phase state revision and checksum;
- existing Context Guard project/task/role/session/input bindings.

The registry and Task/Phase state MUST be re-read/revalidated immediately before Permit consumption. Mismatch, uncertainty, corruption, unknown Permit, revoked Permit, unsupported Permit version, invalid clock, or audit durability failure MUST fail closed.

### 50.3 Fault and race contract

The executable design inventory contains the complete `PL-01..PL-28` Permit Ledger Fault Matrix and `T-01..T-17` TOCTOU Matrix. These matrices are contract metadata and are verified for completeness by tests. The current MVP directly exercises representative failure classes, mutation races, revocation, corruption, audit failure, and concurrent Permit consumption.

## 51. Phase 1.7 — Cost Guard Architecture

### 51.1 Budget dimensions

Cost Guard separates:

- Task Budget;
- Role Budget;
- Session Budget.

Each dimension can independently constrain input tokens, output tokens, and cost. Cost is persisted as integer micro-USD to avoid floating-point ledger ambiguity.

### 51.2 Reservation / Actual model

Execution is expected to reserve projected usage before the expensive operation, then settle the reservation with Actual usage or release it when unused.

`RESERVATION_CREATED -> ACTUAL_RECORDED | RESERVATION_RELEASED`

Active reservations are counted together with Actual usage when calculating projected budget consumption.

### 51.3 Atomicity requirement

Budget evaluation and reservation append MUST execute under the same exclusive ledger transaction. Reservation terminal settlement MUST also be atomic. A concurrent caller may fail closed on lock conflict, but two callers MUST NOT both pass and overcommit the same remaining budget.

### 51.4 Ledger integrity

Cost events use an append-only hash chain, exclusive write lock, file sync, and reread verification. Corruption, malformed binding, malformed usage, read/write uncertainty, or hard-budget breach is a Safe Stop condition.

## 52. Phase 1.8 — Execution Budget and Governance Depth Guard

Phase 1.8 bounds the development process itself.

### 52.1 Controlled resources

- retry attempts;
- Critic/fix review cycles;
- generated artifact byte estimate;
- estimated cost of a single model call;
- Quota/Billing automatic retry behavior.

Soft Limit generates a warning. Hard Limit prohibits continuation of that execution attempt.

### 52.2 Adaptive Development Governance integration

Adaptive Development Governance remains responsible for selecting development assurance depth (`DEV_0` through `DEV_4`). Phase 1.8 consumes the selected profile's review-cycle cap as a safety upper bound. It MUST NOT weaken the safety floor of CORE/FOUNDATION/CRITICAL work.

### 52.3 Model policy boundary

Phase 1.8 does **not** select models and does **not** permanently alter model-routing policy. `Model Cost Policy` at this phase means enforceable per-call/budget limits and Hard Stop behavior. Temporary high-performance model use during foundation development is an execution-time Owner choice, not canonical permanent policy.

### 52.4 MVP persistence boundary

Retry/review/artifact counters are currently evaluated from the caller-supplied execution snapshot. Persistent orchestration counters, checkpoint/resume binding, and automatic recovery belong to later Lifecycle/Automation integration. This is an explicit MVP boundary, not an implicit guarantee.

## 53. Phase 1.6–1.8 Verification Contract

The foundation milestone requires:

- existing Context Guard regressions remain green;
- Foundation Guard positive/negative/binding/race/audit tests;
- Cost Guard budget/boundary/tamper/concurrency tests;
- Phase 1.8 retry/review/artifact/model-cost/quota tests;
- Product Boundary check;
- root export/import verification;
- `git diff --check` before packaging/commit preparation.

The exact final test count and verification run are Evidence, not a permanent architecture constant, and are recorded in `tasks/TASK-004/phase1.6-to-1.8-final-verification.md`.

## 54. Corrected Near-Term Roadmap

The active order after this milestone is:

1. TASK-004 Phase 2 — Checkpoint / Pause / Block / Stall / Resume / Rollback.
2. TASK-004 Phase 3 — Context control expansion.
3. TASK-004 Phase 4 — Cost / Model control expansion and operational reconciliation.
4. TASK-004 Phase 5 — Closure / Archive / historical migration.
5. TASK-004 Phase 6 — System synchronization and policy/template convergence.
6. TASK-005 — Knowledge OS.
7. TASK-006 — Registry / Resolver / Automation.
8. TASK-007 — Monitoring & Dashboard.
9. TASK-008 — External Integration.

TASK-009 is not defined in the current canonical OS roadmap.



# Part V — TASK-004 Phase 2–6 Completion Synchronization

This Part is the current architecture for TASK-004 completion. Earlier roadmap/current-state statements are retained as historical point-in-time records but are superseded by this Part.

## 55. Final TASK-004 status

| Scope | Result |
| --- | --- |
| Phase 2 Recovery Control | `TECHNICALLY_COMPLETED` |
| Phase 3 Context Control | `TECHNICALLY_COMPLETED` |
| Phase 4 Cost / Model Control | `TECHNICALLY_COMPLETED` |
| Phase 5 Closure / Archive / Historical Migration | `TECHNICALLY_COMPLETED` |
| Phase 6 System Synchronization | `TECHNICALLY_COMPLETED` |
| TASK-004 | `COMPLETED` after final verification / closure record |
| Archive | Separate readiness boundary; in-place archive/tag occurs after repository commit/snapshot |

TASK-004 MUST NOT be reopened for ordinary future enhancement. New Lifecycle Foundation changes are handled by a follow-up Task so completed evidence remains immutable.

## 56. Phase 2 — Recovery Control Architecture

Recovery Control introduces an integrity-bound Resume Checkpoint and distinct safe-stop semantics.

### 56.1 Safe-stop state contract

- `PAUSED`: intentional stop. Resume requires Owner direction or valid scheduled-time evidence.
- `BLOCKED`: external condition/authority/evidence wait. Resume requires condition resolution plus VERIFY.
- `STALLED`: progress failure. Resume requires environment recovery, changed hypothesis, or explicit handoff.
- Emergency Stop creates a safe-stop checkpoint and always requires explicit Owner authorization to resume.

### 56.2 Checkpoint invalidation

A checkpoint is invalid when Status revision, Phase, Git branch/commit, environment/tool fingerprint, Authorization, Cost Budget, canonical source set/checksum, or expiry changes. Invalid checkpoints MUST NOT be silently resumed.

### 56.3 Rollback

Code/Status/Policy/Archive rollback is explicit. External or irreversible effects require a compensating action and appropriate Authorization. Historical Transition Log evidence is never deleted to simulate rollback.

Runtime: `src/lifecycle/recovery/index.mjs` plus explicit `RECOVERY` operation-domain integration in the Canonical Lifecycle Store.

## 57. Phase 3 — Context Control Architecture

Context Control owns Context Manifest construction, source classification, trust/freshness/sensitivity checks, conflict resolution, invalidation, and token accounting.

### 57.1 Instruction authority

- CANONICAL: instructions and facts; highest authority within scope.
- TRUSTED: approved scoped instructions/facts.
- REFERENCE: facts-only input; cannot override higher instructions.
- UNTRUSTED: data-only; embedded instructions are non-authoritative.

Equal-trust conflicting content for the same canonical identity is a `CONTEXT_CONFLICT`. Required stale content is `CONTEXT_STALE`. Source checksum or Status revision change invalidates the prior Manifest. Token and Sensitivity limits are fail-closed.

Runtime: `src/context-control/index.mjs` and `schemas/context-control/context-manifest.schema.json`.

## 58. Phase 4 — Cost / Model Control Architecture

The Phase 1.7 atomic Cost Guard is the cost-accounting foundation. Phase 4 adds Model Control and formal Lifecycle routing semantics.

Model eligibility evaluates Capability, Context Capacity, Tool Support, Privacy/Sensitivity, Reliability, Independence, Cost/Latency, Availability, and Deprecation. Results are `MODEL_ROUTE_READY`, `MODEL_ROUTE_FALLBACK`, `MODEL_ROUTE_ESCALATION_REQUIRED`, or `MODEL_ROUTE_BLOCKED`.

Critic/Judge independence requires stored-artifact evaluation and a separate Session when an independent review is required. Routing may respect a caller-supplied cost ceiling but does not hard-code permanent vendor/model selection. Adaptive Development Governance remains separate from permanent model policy.

Runtime: `src/model-control/index.mjs`, existing `src/cost-guard/`, and model profile schema.

## 59. Phase 5 — Closure / Archive / Migration Architecture

Closure and Archive remain separate decisions.

### 59.1 Closure

Closure Readiness verifies Technical, Quality, Policy, Status, Risk, Follow-up, Knowledge, Resources, Cost, and Owner dimensions. Unresolved Critical/High findings, unsettled costs, active processes, exposed secrets, or uncommitted changes block Closure. Completion Record creation requires `CLOSURE_READY` and Owner authorization.

### 59.2 Archive

Archive verifies file manifests/checksums, references, Knowledge provenance, retention, recovery, and post-archive readability. Archive path resolution is canonical-realpath confined to the declared Product Root; traversal and symlink escape are rejected. Physical movement is not required; initial policy favors commit/tag plus in-place historical retention.

### 59.3 Historical migration and dependencies

Legacy state mappings are evidence-bound and low-confidence mapping cannot be silently accepted. Parent/dependency graphs reject cycles and unmet prerequisites.

Runtime: `src/closure/`, `src/archive/`, `src/dependency/`, `src/lifecycle/migration.mjs`.

## 60. Phase 6 — System Synchronization Architecture

System Sync updates shared README/Common/Role/Template/Registry/Schema/Package surfaces only under explicit Policy Update authorization. VERIFY checks existence/content/checksum and uses canonical-realpath confinement so symlink escape cannot bypass Product Root.

TASK-004 completion synchronized the active system surfaces so the formal Lifecycle Foundation is no longer described as reserved future work.

Runtime: `src/system-sync/index.mjs` and `schemas/system-sync/system-sync-plan.schema.json`.

## 61. Adaptive development and token economy after TASK-004

Every future Task classifies changes into DEV-0 through DEV-4. Development depth, Critic/Tester/Judge involvement, test density, and evidence depth scale with system/feature size and criticality. Small peripheral changes MUST NOT receive foundation-level ceremony by default. CORE/FOUNDATION/CRITICAL work MUST NOT be downgraded merely to save tokens.

This rule is necessary for other projects to adopt BAI Development OS without inheriting disproportionate governance cost.

## 62. Final acceptance and next roadmap

TASK-004 final acceptance requires the full OS test suite, Product Boundary check, consumer regression, System Sync VERIFY, documentation/Registry consistency, Critical/High unresolved findings = 0/0, and Completion/Closure records.

After TASK-004 completion the canonical roadmap resumes at:

1. TASK-005 — Knowledge Operating System.
2. TASK-006 — Workspace Registry / Resolver / Automation.
3. TASK-007 — Monitoring & Dashboard.
4. TASK-008 — External Integration.

TASK-009 remains undefined unless separately designed and authorized.

## Ver.2.4 Canonical Promotion Record

- Status: `CURRENT_CANONICAL`
- Effective date: `2026-08-08`
- Supersedes: Architecture Ver.2.3
- Coverage evidence: `tasks/TASK-004/task004-final-completion-record.md`
- Commit / Push / Tag: prepared but not represented as executed inside the delivered worktree.

# Part VI — Post-TASK-008 Product Expansion Roadmap

## 63. Expansion decision

TASK-004をPhase 6まで完走した実装・Critic・回帰・文書同期・配布準備の過程で、Lifecycle Foundationそのものとは分離すべき一方、BAI Development OSを複数Projectへ安全に普及させるために将来独立機能として拡張すべき領域が明確になった。

本PartはTASK-004を再オープンしない。TASK-005〜008の既存順序を維持した上で、その後段にTASK-009〜014を追加する。すべて `PROPOSED / NOT_STARTED / NOT_AUTHORIZED` であり、本ロードマップ追加だけでは実装認可を意味しない。

## 64. TASK-009 — Security, Supply Chain & Integrity Hardening

**目的:** TASK-004で実際に発見したsymlink/root escapeのような境界事故を個別Fixで終わらせず、OS全体のSecurity/Integrity基盤へ昇格させる。

主な拡張候補:

- Trusted Root / canonical realpath / traversal / symlink / junction等の共通Path Safety Library化。
- Secret・credential・sensitive artifactの検知、保存・出力・Evidence化ポリシー。
- Lockfile / dependency integrity、SBOM、provenance、署名、checksum、release artifact integrity。
- Dependency/Vulnerability policyとRisk-based blocking。
- Untrusted input / generated artifact / external tool outputのtrust classification。
- Security regression pack、fault injection、boundary fuzzing、consumer-side security conformance。

**完了イメージ:** セキュリティ境界が各Component固有実装ではなく共通Policy/Runtime/Test Packとして再利用可能になる。

## 65. TASK-010 — Release, Distribution & Consumer Upgrade OS

**目的:** ローカルで完成したBAI Development OSを、複数Consumerへ再現可能に配布・導入・更新・Rollbackできる製品へする。

主な拡張候補:

- Semantic Versioning、Release Manifest、Changelog、Git tag/GitHub Releaseの標準化。
- Consumer側 `.bai-os/` のOS Version pin、互換範囲、migration requirement。
- Install / update / downgrade / rollback / migration command。
- package registry障害、offline、mirror、cache、air-gapped環境を考慮したDependency acquisition strategy。
- Release artifact checksum/signature/provenanceとpost-release VERIFY。
- Repository rename / remote migration / default branch / release channel検証。
- Breaking change detectionとupgrade preview/dry-run。

**背景:** TASK-004最終回帰時にConsumer buildがpackage registry環境へ依存して再現できないケースが発生した。この種の問題を「環境依存」で終わらせずDistribution品質として扱う。

## 66. TASK-011 — Multi-Project Conformance & Compatibility Lab

**目的:** `javascript-roulette` 単一Fixtureだけでなく、異なる規模・言語・DomainのProjectをBAI Development OSへ載せても基盤が過不足なく機能することを継続検証する。

主な拡張候補:

- Consumer Contract Test / Compatibility Matrix。
- `javascript-roulette`、`makeTikTokGiftMaster` 等のReference Consumer群。
- Small / Medium / Large、Low-risk / Core-criticalのProject fixtures。
- Install → Task execution → Recovery → Closure → UpgradeまでのE2E。
- OS Coreのconsumer repo混入、project-specific ruleのOS側流入を検知するBoundary test。
- Version間upgrade regression、backward compatibility、migration fixtures。
- Consumer Certification / Compatibility Levelの機械判定。

**完了イメージ:** 「このProjectを基盤へ載せられるか」を人の勘ではなくConformance Suiteで判定できる。

## 67. TASK-012 — Self-Maintenance, Drift Detection & Safe Auto-Repair

**目的:** Phase 6 System Syncを一回の同期機能から、長期運用時の正本Driftを発見・説明・安全に修復できる自己保守機能へ拡張する。

主な拡張候補:

- Canonical MD / DOCX / Summary / Registry / Schema / Template間のdrift detection。
- Registry hash/size/path/statusの継続整合確認。
- Missing/stale/duplicate/superseded document detection。
- Self-audit reportとimpact-scoped repair plan生成。
- DEV profileに応じた自動修復可否判定。Critical/authority変更はOwner承認を維持。
- Repair後の再ハッシュ、再レンダー、回帰、rollback checkpoint。
- Scheduled health checkとdrift trend。

**原則:** 自己修復はAuthorityを迂回しない。自動修復可能なのは機械的・低リスク・可逆なDriftに限定する。

## 68. TASK-013 — Domain Adapter / Plugin SDK

**目的:** BAI Development OSをsoftware開発専用に閉じず、動画・音声・BGM・SE・配信・Unity・Web・Desktop・Automation等へ同じ基盤を適用できる正式Extension機構を作る。

主な拡張候補:

- Adapter/Plugin manifestとCapability contract。
- Domain-specific Project Policy Pack / Test Pack / Evidence Pack。
- Tool connector abstractionとsandbox/boundary contract。
- Plugin lifecycle: discover / validate / enable / disable / upgrade / revoke。
- Domain固有artifactのvalidation、preview、quality gate。
- Core OSへDomain固有条件を埋め込まないExtension boundary。
- Official / Community / Project-local extensionのTrust Level。

**完了イメージ:** 新Domain対応のたびにOS Coreを書き換えず、Adapterを追加することで適用範囲を増やせる。

## 69. TASK-014 — Adaptive Governance Calibration & Policy Learning

**目的:** DEV-0〜DEV-4を固定ルールだけで運用せず、実運用Evidenceを使って「やり過ぎ」と「不足」の両方を継続的に校正する。ただし安全下限を自動で弱めない。

主な拡張候補:

- Change size / criticality / defect escape / Critic yield / test effectiveness / lead time / token-costの計測。
- Profile別の実績比較と過剰Review/過少Test検出。
- Review cycle、test depth、evidence depth、revalidation scopeの推奨値校正。
- Policy versioning、simulation、shadow evaluation、A/B相当の安全な比較。
- CORE/FOUNDATION/CRITICAL safety floorは自動降格禁止。
- Policy変更は説明可能な根拠とOwner/Policy authorizationを要求。
- TASK-005 Knowledge、TASK-007 Monitoringから得たEvidenceを利用するfeedback loop。

**完了イメージ:** Governanceコストを継続最適化しながら、重要機能の品質保証を犠牲にしない自己改善ループを持つ。

## 70. Expanded canonical roadmap

| Order | Task | Status | Primary outcome |
|---:|---|---|---|
| 1 | TASK-005 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Knowledge Operating System |
| 2 | TASK-006 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Workspace Registry / Resolver / Automation |
| 3 | TASK-007 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Monitoring & Dashboard |
| 4 | TASK-008 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | External Integration |
| 5 | TASK-009 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Security / Supply Chain / Integrity Hardening |
| 6 | TASK-010 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Release / Distribution / Consumer Upgrade OS |
| 7 | TASK-011 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Multi-Project Conformance & Compatibility Lab |
| 8 | TASK-012 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Self-Maintenance / Drift Detection / Safe Auto-Repair |
| 9 | TASK-013 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Domain Adapter / Plugin SDK |
| 10 | TASK-014 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Adaptive Governance Calibration & Policy Learning |

### 70.1 Dependency intent

- TASK-009はTASK-004のSecurity lessonsを一般化し、広範な配布前のHardening層となる。
- TASK-010はTASK-008 External IntegrationとTASK-009 Integrityを利用してRelease/Upgradeを成立させる。
- TASK-011はTASK-010の配布・versioningを使い複数Consumerで互換性を検証する。
- TASK-012はTASK-006 Automation、TASK-007 Monitoring、TASK-009 Integrityを利用する。
- TASK-013はTASK-008 IntegrationとTASK-011 ConformanceをExtension境界として利用する。
- TASK-014はTASK-005 KnowledgeとTASK-007 MonitoringのEvidenceを入力としてAdaptive Governanceを校正する。

TASK番号は上記用途として予約する。各Taskの正式開始時にtask.md、Authority、Gate、Adaptive Development Profileを個別に確定する。

## Ver.2.5 Canonical Promotion Record

- Status: `CURRENT_CANONICAL`
- Effective date: `2026-08-08`
- Supersedes: Architecture Ver.2.4
- Scope: Post-TASK-008 roadmap expansion only; TASK-004 completion evidence remains immutable.
- Expansion rationale: `architecture/BAI_Development_OS_Post_TASK008_Roadmap_Expansion_Ver1.0.md`
- Implementation authorization: `NONE`


# Part VII — TASK-005 Knowledge Operating System Completion

## 71. TASK-005 completion decision

TASK-005 is `COMPLETED`. The Knowledge Operating System is now an executable core subsystem rather than a future architecture placeholder. Its current machine canonical is `specifications/TASK-005_BAI_Development_OS_Knowledge_Operating_System_Ver1.2.md` with DOCX companion and Summary.

TASK-005 was implemented under `DEV_4_FOUNDATION_CRITICAL`. Permanent model-selection policy remains unchanged.

## 72. Knowledge OS runtime architecture

Knowledge OS owns governed reusable Knowledge, not Task Lifecycle state. Runtime is exported through `./knowledge` and `KnowledgeOS` from the root package.

Implemented surfaces:

1. Taxonomy and canonical vocabulary validation.
2. Immutable, sequential Knowledge Asset revisions with provenance, Source Trust, Sensitivity, Confidence, freshness and checksum.
3. Scope from GLOBAL through TASK plus Role/Phase/environment/project/tool applicability.
4. Evidence-bound Failure Knowledge with fingerprint and recurrence identity.
5. Pattern/Anti-pattern and ADR decision structures.
6. Deterministic resolver with Enforcement, specificity, Source Trust, confidence and revision ranking.
7. Conflict, supersedes and requires graph semantics.
8. Version-pinned, checksum-bound Knowledge Pack with token-budget trimming that never silently removes Mandatory Knowledge.
9. Usage, deviation, verification and effectiveness evidence.
10. Promotion/demotion, freshness/invalidation and Impact Analysis.
11. Governance transitions with independent Knowledge Reviewer and Owner safety floors for high-impact activation/invalidation.
12. Persistent repository, hash-chained Event/Usage ledgers and immutable Pack artifacts.

## 73. TASK-004 / TASK-005 boundary

The binding execution path is:

```text
Knowledge Resolution Request
        ↓
TASK-005 Resolver
        ↓
Version-pinned Knowledge Pack
        ↓
TASK-004 Context Source (TRUSTED)
        ↓
TASK-004 Context Manifest / Context Guard
        ↓
Role execution
        ↓
TASK-005 Usage / Verification / Effectiveness
```

Knowledge Pack MUST NOT bypass Context Manifest. TASK-005 MUST NOT directly mutate Task Lifecycle Status. When invalid/stale Knowledge affects prior consumers, TASK-005 emits Impact Analysis; TASK-004 or a future automation layer decides Task blocking/follow-up.

## 74. Knowledge authority and repository integrity

Workspace Registry remains an index and is not Knowledge content authority. The Knowledge Repository is the content authority for current/revisioned Assets. New ACTIVE/non-draft Assets cannot be introduced through raw persistence without explicit authorized import. Existing Status changes require a matching Governance Decision.

Repository safety includes:

- write-once revision files;
- current pointer revision/checksum validation;
- hash-chained Asset Event Log;
- current Asset ↔ latest Event consistency verification;
- hash-chained Usage Ledger;
- immutable checksum-bound Knowledge Pack artifacts;
- mutation locks;
- canonical realpath/root confinement on both read and write.

Interrupted multi-file persistence is fail-closed: a partial write can create an integrity mismatch, but verification rejects it. Automatic repair/journaling is deferred to TASK-009/TASK-012.

## 75. Failure Knowledge bootstrap

The fourteen Failure Knowledge candidates handed off from TASK-004 are present at `knowledge/seeds/task004-failure-candidates.json`. All are `CANDIDATE`; none are auto-promoted or auto-activated. Their future review follows the same Governance as any other Knowledge Asset.

## 76. TASK-005 final assurance

Final observed verification:

- Knowledge-specific tests: `75 / 75 PASS`.
- Full BAI Development OS suite: `309 / 309 PASS`.
- Product Boundary: `PASS`.
- Root Knowledge export: `PASS`.
- JavaScript Roulette Reference Consumer: `10 / 10 PASS`.
- Blocking Critic findings: `0`.

Critic findings resolved during implementation include current-pointer rollback detection, Governance-bypass prevention, persistent Usage/Pack evidence, Usage Ledger concurrency protection, and write-side symlink/root escape protection.

## 77. Canonical roadmap after TASK-005

| Order | Task | Current status | Primary outcome |
|---:|---|---|---|
| 1 | TASK-005 | COMPLETED | Knowledge Operating System |
| 2 | TASK-006 | NEXT / NOT_STARTED | Workspace Registry / Resolver / Automation |
| 3 | TASK-007 | PROPOSED / NOT_STARTED | Monitoring & Dashboard |
| 4 | TASK-008 | PROPOSED / NOT_STARTED | External Integration |
| 5 | TASK-009 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Security / Supply Chain / Integrity Hardening |
| 6 | TASK-010 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Release / Distribution / Consumer Upgrade OS |
| 7 | TASK-011 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Multi-Project Conformance & Compatibility Lab |
| 8 | TASK-012 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Self-Maintenance / Drift Detection / Safe Auto-Repair |
| 9 | TASK-013 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Domain Adapter / Plugin SDK |
| 10 | TASK-014 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Adaptive Governance Calibration & Policy Learning |

TASK-006 is the next route but is not silently started by TASK-005 completion.

## Ver.2.6 Canonical Promotion Record

- Status: `CURRENT_CANONICAL`
- Effective date: `2026-08-08`
- Supersedes: Architecture Ver.2.5
- Scope: TASK-005 Knowledge Operating System completion integration; Part VI roadmap reservations remain intact.
- Coverage evidence: `tasks/TASK-005/task005-final-completion-record.md`
- TASK-006 implementation authorization: `NONE BY THIS RECORD`


# Part VIII — Post-TASK-005 Roadmap Refinement

## 75. Refinement decision

TASK-005 Knowledge Operating System completion exposed several product-hardening needs that should not reopen TASK-005 and do not justify additional Task numbers. They are therefore allocated into the already-reserved TASK-009〜014 roadmap. TASK-006 remains the next canonical route; TASK-009〜014 remain `PROPOSED / NOT_STARTED / NOT_AUTHORIZED`.

The allocation principle is: preserve the existing roadmap, avoid duplicate responsibility, and move each residual to the future Task that already owns its system-level concern.

## 76. TASK-009 — Security, Supply Chain & Integrity Hardening: Knowledge integrity additions

Add the following Knowledge-specific hardening scope:

- Crash-consistent Knowledge mutation protocol using WAL/journal or equivalent commit fencing across revision file, current pointer and Asset Event.
- Recovery verification that distinguishes committed, prepared, orphaned and torn Knowledge mutations without guessing canonical state.
- Shared integrity primitives for Knowledge Event/Usage Ledgers, Pack manifests and repository pointers, including signature-ready canonical serialization.
- Cross-project sensitivity isolation for GLOBAL/WORKSPACE/PROJECT Knowledge so confidential Knowledge cannot leak through resolver results, Pack export, diagnostics or Evidence.
- Tamper/fault-injection tests covering interrupted writes, reordered writes, truncated ledgers, pointer rollback, malicious symlink/path substitution and untrusted imported Knowledge artifacts.

**TASK-005 residual closed by this future scope:** power-loss atomicity is currently fail-closed but not transactionally recovered.

## 77. TASK-010 — Release, Distribution & Consumer Upgrade OS: Knowledge distribution additions

Add the following Knowledge distribution scope:

- Portable Knowledge Pack export/import bundle with version, checksum, schema, provenance, sensitivity and compatibility manifest.
- Knowledge schema/taxonomy migration policy across BAI Development OS releases.
- Upgrade preview that reports Pack invalidation, superseded revisions, incompatible mandatory Knowledge and required re-resolution before consumer upgrade.
- Offline/cacheable Knowledge bundle distribution for consumers that cannot reach the canonical repository.
- Rollback semantics that restore compatible Knowledge views without silently reactivating invalid or superseded revisions.

**Outcome:** OS release compatibility includes Knowledge compatibility, not only runtime/API compatibility.

## 78. TASK-011 — Multi-Project Conformance & Compatibility Lab: Knowledge portability additions

Add the following cross-project Knowledge verification scope:

- Cross-project promotion fixtures that validate the evidence-diversity floor for GLOBAL Knowledge.
- Negative tests proving PROJECT/TASK scoped or sensitive Knowledge cannot contaminate unrelated consumers.
- Resolver conformance matrix across Small/Medium/Large and multiple Domain/reference consumers.
- Compatibility tests for Mandatory Knowledge, conflicting Knowledge, supersedes/requires graphs and version-pinned Packs across consumer upgrades.
- Machine-readable Knowledge Portability/Isolation certification as part of consumer conformance.

**Outcome:** reusable Knowledge is proven portable where intended and isolated where not intended.

## 79. TASK-012 — Self-Maintenance, Drift Detection & Safe Auto-Repair: Knowledge repository maintenance additions

Add the following Knowledge self-maintenance scope:

- Knowledge repository `fsck` covering revision/current/event/usage/Pack consistency.
- Journal-assisted recovery for interrupted mutation after TASK-009 introduces crash-consistent commit metadata.
- Detection and safe handling of orphan revisions, missing current pointers, unreachable Pack artifacts, truncated event chains and stale indexes.
- Rebuildable derived indexes/caches from immutable canonical Knowledge without changing authoritative revisions.
- Knowledge garbage-collection/compaction policy for expired CANDIDATE data, superseded derived artifacts and old Pack caches while retaining required historical Evidence.
- Repair plan + checkpoint + verify + rollback workflow; authority-bearing Knowledge state is never silently repaired.

**Outcome:** long-lived Knowledge repositories can diagnose and recover from drift instead of accumulating manual repair debt.

## 80. TASK-013 — Domain Adapter / Plugin SDK: Knowledge extension points

Add the following Knowledge plugin scope:

- Domain-specific taxonomy extension packs without modifying core vocabulary directly.
- Pluggable Failure fingerprint extractors, asset validators, applicability predicates and resolver ranking signals under declared capability boundaries.
- Domain-specific Knowledge schemas/templates and Pack renderers/compressors while retaining core provenance, sensitivity, enforcement and checksum contracts.
- Plugin compatibility/versioning rules for Knowledge Assets and Knowledge Packs.
- Trust classification for Official / Community / Project-local Knowledge extension providers.

**Outcome:** video, audio, Unity, Web, Desktop, streaming and automation projects can gain domain-aware Knowledge behavior without forking Knowledge OS core.

## 81. TASK-014 — Adaptive Governance Calibration & Policy Learning: Knowledge learning additions

Add the following Knowledge calibration scope:

- Measure resolver precision proxies from usage, deviation, verification, effectiveness, defect escape and recurrence Evidence.
- Calibrate non-mandatory ranking weights, confidence thresholds and freshness/decay recommendations from observed outcomes.
- Detect Knowledge that is frequently selected but ineffective, rarely used but high-value, repeatedly overridden, or associated with regressions.
- Shadow/simulation evaluation of ranking or freshness-policy changes before activation.
- Counterfactual replay against historical Resolution Requests to estimate selection changes and conflict/missing-mandatory risk.
- Automatic recommendations may adjust advisory ranking only; MANDATORY enforcement, safety floors, Owner authority and security boundaries cannot be weakened automatically.

**Outcome:** Knowledge OS becomes evidence-calibrated without turning operational telemetry into uncontrolled self-modifying policy.

## 82. Refined post-TASK-005 roadmap allocation

| Task | Existing product outcome | TASK-005-derived additions |
|---|---|---|
| TASK-009 | Security / Supply Chain / Integrity | crash-consistent Knowledge transaction, integrity primitives, sensitivity isolation, fault injection |
| TASK-010 | Release / Distribution / Upgrade | Knowledge Pack portability, schema/taxonomy migration, offline bundle, rollback compatibility |
| TASK-011 | Multi-Project Conformance | Knowledge portability/isolation certification, cross-project promotion and contamination tests |
| TASK-012 | Self-Maintenance / Drift Repair | Knowledge fsck, journal recovery, index rebuild, orphan handling, GC/compaction |
| TASK-013 | Domain Adapter / Plugin SDK | taxonomy/schema/fingerprint/ranker/Pack extension points |
| TASK-014 | Adaptive Governance Calibration | resolver effectiveness, confidence/freshness calibration, shadow/counterfactual evaluation |

No TASK-015 is created by this refinement. Creating another Task would duplicate existing roadmap responsibility and increase governance cost without adding a clean product boundary.

## Ver.2.7 Canonical Promotion Record

- Status: `CURRENT_CANONICAL`
- Effective date: `2026-08-08`
- Supersedes: Architecture Ver.2.6
- Scope: Post-TASK-005 roadmap refinement only. TASK-005 completion and implementation Evidence remain immutable.
- Implementation authorization for TASK-009〜014: `NONE`
- Next canonical development route: `TASK-006 — Workspace Registry / Resolver / Automation`

# Part IX — TASK-006 Orchestration & Automation Foundation Completion

## 83. TASK-006 completion decision

TASK-006 is `COMPLETED`. Workspace Registry / Resolver / Role Startup / Instruction Compilation / Reliability / Document Synchronization / Advanced Guard / Conditional Automation is now an executable BAI Development OS subsystem. Its machine canonical is `specifications/TASK-006_BAI_Development_OS_Orchestration_Automation_Foundation_Ver1.0.md` with DOCX companion and Summary.

TASK-006 was implemented under `DEV_4_FOUNDATION_CRITICAL`. Permanent model-selection policy remains unchanged.

## 84. Fifteen-phase runtime architecture

TASK-006 retains the 15-phase route defined by the Foundation Improvement Integration Plan and completes each phase:

1. Registry / Discovery.
2. Runtime / Environment / Shell / Root Resolution.
3. Activation Validation / Startup Package.
4. Project / Risk Resolution.
5. TASK-005 Knowledge Resolver Integration.
6. Instruction Compiler.
7. Owner Decision Support.
8. Reliability / Retry.
9. Restart / Session / Worktree Evidence.
10. Document Resolution.
11. Document Synchronization.
12. Probe / Mutation / Fault Injection.
13. Advanced Guard.
14. Conditional Automation.
15. End-to-End Governance Validation.

Runtime is exported through `./automation` and root namespace `AutomationOS`.

## 85. Canonical execution composition

```text
Workspace Registry / Multi-Project Index
        ↓
Runtime Probe / Environment / Root
        ↓
Project + Adaptive Risk Resolution
        ↓
TASK-005 Knowledge Resolver
        ↓
TASK-004 Context Manifest / Context Guard
        ↓
Role Startup Package
        ↓
Instruction Compiler
        ↓
Automation Plan
        ↓
Owner Proposal only when required
        ↓
Authorized Execution / Verification
```

Registry is an index and never content authority. TASK-006 may propose Lifecycle actions but does not own TASK-004 canonical Lifecycle state. TASK-006 consumes TASK-005 Knowledge but does not become Knowledge content/governance authority.

## 86. Adaptive automation authority boundary

Automation does not require a redundant Owner gate for an `IMPLEMENT_WRITE` when all of the following are already true:

- Lifecycle authorization is `AUTHORIZED`;
- execution scope is explicitly bound;
- change is reversible;
- no external side effect exists.

Owner approval remains mandatory for irreversible changes, external side effects, Policy updates, publish/send/delete actions, Global Knowledge promotion and unknown action classes.

This boundary is intentionally aligned with Adaptive Development Governance: small/safe authorized implementation can proceed quickly while high-impact actions retain human authority.

## 87. Runtime, mutation and failure-probe boundary

Runtime facts require current probe evidence. UI labels and historical assumptions cannot establish environment readiness. Project roots are realpath-confined beneath the declared workspace root.

Mutation probes and fault injection require explicit authorization and an isolated sandbox. Production-destructive fault injection is refused.

## 88. Completion Outbox and derived synchronization

TASK-006 consumes TASK-004 completion events only from `VERIFIED_DURABLE_OUTBOX` sources and binds event task/revision/checksum to a verified canonical read. Derived synchronization uses an idempotency acknowledgement ledger.

A derived sync failure returns `DERIVED_SYNC_PENDING`; `canonical_completion_rolled_back` is always false. Derived-system failure cannot reverse canonical Task completion.

## 89. Document and project discovery architecture

Workspace Registry records rebuildable metadata/checksums and can be persisted only through an authorized path. Multi-project Project Index explicitly represents OS and consumer roots without moving content authority into Registry.

Canonical document resolution rejects duplicate/conflicting current canonicals. Authorized Documentation Sync is confined to derived/document synchronization surfaces and reuses TASK-004 System Sync validation.

## 90. TASK-006 final assurance

Final implementation assurance before documentation synchronization:

- TASK-006 automation suite: `116 / 116 PASS`.
- Full BAI Development OS suite: `425 / 425 PASS`.
- Product Boundary: `PASS`.
- Root `AutomationOS` export: `PASS`.
- Automation JSON Schemas: `9 / 9 Draft 2020-12 PASS`.
- Blocking Critic findings: `0`.

Resolved Critic findings include exact runtime readiness matching, invalid approval-expiry rejection, removal of redundant Owner gating for already-authorized safe implementation, explicit multi-project Project Index support and removal of arbitrary prompt-compression minimum size.

Accepted residual: multi-file derived-document synchronization is not a single crash-atomic transaction. Canonical authority remains fail-safe; journaling/repair hardening belongs TASK-009/TASK-012.

## 91. Canonical roadmap after TASK-006

| Order | Task | Current status | Primary outcome |
|---:|---|---|---|
| 1 | TASK-005 | COMPLETED | Knowledge Operating System |
| 2 | TASK-006 | COMPLETED | Orchestration & Automation Foundation |
| 3 | TASK-007 | NEXT / NOT_STARTED | Monitoring & Dashboard |
| 4 | TASK-008 | PROPOSED / NOT_STARTED | External Integration |
| 5 | TASK-009 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Security / Supply Chain / Integrity Hardening |
| 6 | TASK-010 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Release / Distribution / Consumer Upgrade OS |
| 7 | TASK-011 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Multi-Project Conformance & Compatibility Lab |
| 8 | TASK-012 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Self-Maintenance / Drift Detection / Safe Auto-Repair |
| 9 | TASK-013 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Domain Adapter / Plugin SDK |
| 10 | TASK-014 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Adaptive Governance Calibration & Policy Learning |

TASK-007 becomes the next route but is not implicitly authorized by TASK-006 completion.

## Ver.2.8 Canonical Promotion Record

- Status: `CURRENT_CANONICAL`
- Effective date: `2026-08-08`
- Supersedes: Architecture Ver.2.7
- Scope: TASK-006 Orchestration & Automation Foundation completion integration; prior TASK-004/TASK-005 completion evidence and roadmap refinements remain historical/current inputs as applicable.
- Coverage evidence: `tasks/TASK-006/task006-final-completion-record.md`
- TASK-007 implementation authorization: `NONE BY THIS RECORD`


# Part X — Post-TASK-006 Roadmap Refinement

## 92. Refinement decision

TASK-006 Orchestration & Automation Foundation completed all fifteen internal phases and exposed productization needs that must not reopen TASK-006. Most findings belong naturally to the already-reserved TASK-009〜014 responsibilities. One finding does not: the current Completion Outbox acknowledgement is intentionally local and idempotent, not a distributed event/transaction coordinator. Distributed multi-node/multi-project orchestration therefore receives a separate product boundary as TASK-015.

This refinement does not authorize implementation. TASK-007 remains the next canonical development route. TASK-009〜015 remain `PROPOSED / NOT_STARTED / NOT_AUTHORIZED`.

The governing principle is the same as previous refinements: extend existing responsibility boundaries when they are clean; create a new Task only when forcing the capability into an existing Task would create architectural coupling or governance bloat.

## 93. TASK-009 — Security, Supply Chain & Integrity Hardening: orchestration integrity additions

Add the following TASK-006-derived hardening scope:

- Shared crash-consistent mutation primitive for derived multi-file synchronization, Workspace Registry persistence, Outbox acknowledgement and other authority-adjacent derived state. Use journal/WAL or equivalent prepare/commit fencing, root-confined temporary files and deterministic recovery.
- Tamper-evident Owner Approval envelopes with canonical serialization, checksum/signature readiness, nonce/replay protection, issuer/scope/expiry binding and secret-safe diagnostic rendering.
- Signed/hash-bound Completion Outbox event envelopes and acknowledgement records so local derived synchronization can detect truncation, reordering, forged event identity and replay.
- Common sandbox/path-security library for runtime probes, mutation probes, fault injection and derived sync, covering realpath, traversal, symlink/junction substitution and capability-scoped write roots.
- Trust classification for runtime probe output, external command output, generated manifests and imported Registry/Project Index artifacts before they can influence execution.
- Security/fault-injection pack for stale approvals, forged authorizations, malicious path substitution, interrupted registry writes, acknowledgement corruption and sandbox breakout attempts.

**TASK-006 residual addressed:** current multi-file derived synchronization is fail-safe but not crash-atomic, and approval/outbox integrity is local rather than cryptographically transport-ready.

## 94. TASK-010 — Release, Distribution & Consumer Upgrade OS: automation compatibility additions

Add the following TASK-006-derived release/upgrade scope:

- Version and compatibility contracts for Workspace Registry, Multi-Project Project Index, Role Startup Package, Owner Approval envelope, Automation Plan/Result, Completion Outbox and acknowledgement formats.
- Upgrade/downgrade migration tooling for `.bai-os/` automation state and derived indexes, including dry-run compatibility reports and rollback checkpoints.
- Release manifest that declares minimum/maximum consumer adapter versions, runtime probe capabilities, schema versions and migration requirements.
- Offline/cacheable bootstrap bundle for Runtime Probe definitions, schemas, startup templates and essential automation metadata.
- Breaking-change detection for action classification, Owner-gate semantics, startup bindings, outbox event shapes and automation result contracts.
- Migration rules that never silently broaden authorization, external-side-effect scope or Owner Approval validity during upgrade.

**Outcome:** automation compatibility becomes a versioned product contract rather than an implicit property of source-code compatibility.

## 95. TASK-011 — Multi-Project Conformance & Compatibility Lab: orchestration conformance additions

Add the following TASK-006-derived multi-consumer verification scope:

- Conformance matrix for multiple simultaneous Project Index entries with overlapping names, nested roots, different shells/runtimes and heterogeneous technology stacks.
- Negative tests proving one consumer's Role Startup Package, Owner Approval, Knowledge Pack, worktree evidence, derived sync or automation result cannot contaminate another consumer.
- Cross-project concurrency tests for Registry rebuild, Runtime Probe, conditional automation and completion-event consumption.
- Consumer fixtures for already-authorized safe implementation, dangerous-action Owner gating, sandbox mutation, restart/resume and derived-sync failure.
- Multi-consumer idempotency/replay tests proving Completion events remain exactly-once in effect even when delivery is at-least-once.
- Machine-readable Orchestration Compatibility Level covering Registry, Runtime, Startup, Authority, Automation and Outbox contracts.

**Outcome:** reusable orchestration is demonstrated under real multi-project contention, not only one-project-at-a-time fixtures.

## 96. TASK-012 — Self-Maintenance, Drift Detection & Safe Auto-Repair: automation maintenance additions

Add the following TASK-006-derived self-maintenance scope:

- Workspace Registry / Project Index `fsck`, deterministic rebuild and stale-index reconciliation from canonical project metadata.
- Local Completion Outbox acknowledgement audit, dead-letter queue, replay queue and idempotent repair for failed derived synchronization.
- Detection and cleanup proposals for expired Owner Authorization proposals, orphaned approval artifacts, stale Runtime Probe evidence and abandoned scheduled automation records.
- Crash-recovery/repair for multi-file derived documentation synchronization after TASK-009 supplies journal/commit metadata.
- Re-probe policy for stale Runtime/Environment evidence before automation executes; no stale cached readiness may silently become authority.
- Worktree/session evidence repair plans that remain derived and never rewrite canonical Task/Lifecycle evidence.
- Scheduled self-health verification for Registry drift, outbox backlog, repeated sync failure, stale probes and automation retry storms.

**Outcome:** TASK-006 derived/runtime state becomes diagnosable and repairable without turning derived data into canonical authority.

## 97. TASK-013 — Domain Adapter / Plugin SDK: orchestration extension additions

Add the following TASK-006-derived extension points:

- Pluggable Runtime Probes and environment detectors under explicit capability and trust contracts.
- Project Resolver / Risk signal adapters that feed, but cannot override, Adaptive Development Governance.
- Role Startup Package enrichers and Instruction Compiler stages with deterministic ordering and checksum binding.
- Action classifier / Automation executor plugins with declared side-effect classes, required authorization, rollback capability and sandbox requirements.
- Document synchronization providers, Completion Outbox consumers and notification/output adapters under bounded derived-state contracts.
- Domain-specific mutation/fault probes that remain sandbox-only unless a stronger explicitly authorized contract exists.
- Plugin manifest includes schema/version compatibility, trust level, required permissions and test/evidence pack.

**Outcome:** TASK-006 orchestration can expand to video/audio/Unity/Web/Desktop/streaming/automation domains without hard-coding domain execution logic into the core.

## 98. TASK-014 — Adaptive Governance Calibration & Policy Learning: automation calibration additions

Add the following TASK-006-derived calibration scope:

- Measure redundant Owner-gate rate, dangerous-action catch rate, false escalation rate and manual override frequency.
- Measure automation completion rate, retry/timeout overhead, fallback success, restart/resume effectiveness and derived-sync repair frequency.
- Evaluate Prompt Compression quality using task success, missing-context findings, re-read demand, token cost and defect escape rather than output length alone.
- Measure Runtime Probe cost/freshness, cache hit quality, stale-evidence rejection and project-resolution ambiguity.
- Calibrate advisory thresholds for safe `IMPLEMENT_WRITE` automation, retry depth, prompt/context compression and revalidation scope through shadow/simulation first.
- Detect governance patterns where small reversible work is over-gated or critical work is under-reviewed.
- Automatic policy learning may recommend changes, but cannot weaken Owner-required action classes, Lifecycle/Knowledge authority, security boundaries, CORE/FOUNDATION/CRITICAL assurance floors or external-side-effect gates.

**Outcome:** orchestration speed and cost can be tuned from evidence while fixed safety boundaries remain non-self-modifying.

## 99. TASK-015 — Distributed Orchestration & Event Fabric

**Status:** `PROPOSED / NOT_STARTED / NOT_AUTHORIZED`.

**Purpose:** Extend TASK-006's local deterministic orchestration into an optional distributed execution/event layer for multiple projects, workers or machines without pretending a local JSONL acknowledgement ledger is a distributed transaction coordinator.

Primary future scope:

- Versioned Event Envelope with event id, source, task/revision, project, causality/correlation id, sequence/partition key, checksum/signature metadata and idempotency key.
- Durable broker/transport abstraction supporting local queue, remote queue and offline-forwarding implementations without making any specific vendor canonical.
- At-least-once delivery with exactly-once **effect** through consumer idempotency; do not claim impossible global exactly-once delivery guarantees.
- Consumer lease/heartbeat, acknowledgement timeout, retry/backoff, dead-letter queue, replay and poison-event quarantine.
- Per-project ordering where required, causal ordering metadata, duplicate detection and bounded replay windows.
- Cross-project workflow DAG / Saga-style compensation for multi-step workflows; canonical Lifecycle transitions remain owned by TASK-004 and are never replaced by distributed coordinator state.
- Remote worker identity, capability advertisement and authorization binding; security primitives delegate to TASK-009.
- Event/queue health telemetry delegates to TASK-007 Monitoring; external connector transport delegates to TASK-008; release compatibility delegates to TASK-010; conformance fixtures delegate to TASK-011.
- Network partition, worker crash, duplicate delivery, delayed acknowledgement, split-brain/coordinator failover and replay fault-injection tests.
- Local-only mode remains supported; distributed fabric is an opt-in extension, not a prerequisite for simple projects.

**Completion image:** BAI Development OS can coordinate multiple consumers/workers with durable event semantics and recoverable cross-project workflows while retaining canonical authority boundaries and a lightweight single-machine mode.

## 100. Refined post-TASK-006 roadmap allocation

| Task | Existing product outcome | TASK-006-derived additions |
|---|---|---|
| TASK-009 | Security / Supply Chain / Integrity | crash-consistent derived-state commit, approval/outbox integrity, common sandbox/path security, untrusted runtime-output classification |
| TASK-010 | Release / Distribution / Upgrade | automation schema/startup/approval/outbox compatibility, migrations, bootstrap bundles, authorization-safe upgrades |
| TASK-011 | Multi-Project Conformance | concurrent multi-consumer orchestration, isolation, authority and outbox idempotency certification |
| TASK-012 | Self-Maintenance / Drift Repair | Registry/outbox/runtime-evidence fsck, replay/dead-letter, stale artifact cleanup, derived-sync recovery |
| TASK-013 | Domain Adapter / Plugin SDK | probe/resolver/compiler/classifier/executor/sync/outbox extension points |
| TASK-014 | Adaptive Governance Calibration | Owner-gate yield, automation/retry/prompt/probe cost and effectiveness calibration |
| TASK-015 | Distributed Orchestration & Event Fabric | durable event delivery, replay/DLQ, worker leases, cross-project Saga orchestration and distributed failure recovery |

TASK-015 is created because distributed orchestration is a clean product boundary not owned by Release, Conformance, Self-Maintenance or External Integration individually. It is intentionally optional and later than the current single-machine orchestration foundation.

## 101. Roadmap after TASK-006 refinement

| Order | Task | Current status | Primary outcome |
|---:|---|---|---|
| 1 | TASK-005 | COMPLETED | Knowledge Operating System |
| 2 | TASK-006 | COMPLETED | Orchestration & Automation Foundation |
| 3 | TASK-007 | NEXT / NOT_STARTED / NOT_AUTHORIZED | Monitoring & Dashboard |
| 4 | TASK-008 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | External Integration |
| 5 | TASK-009 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Security / Supply Chain / Integrity Hardening |
| 6 | TASK-010 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Release / Distribution / Consumer Upgrade OS |
| 7 | TASK-011 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Multi-Project Conformance & Compatibility Lab |
| 8 | TASK-012 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Self-Maintenance / Drift Detection / Safe Auto-Repair |
| 9 | TASK-013 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Domain Adapter / Plugin SDK |
| 10 | TASK-014 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Adaptive Governance Calibration & Policy Learning |
| 11 | TASK-015 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Distributed Orchestration & Event Fabric |

### 101.1 Dependency intent

- TASK-009 supplies integrity/security primitives consumed by later distribution, self-repair and distributed orchestration.
- TASK-010 versions and migrates automation contracts before large-scale consumer rollout.
- TASK-011 proves isolation and compatibility across multiple consumers.
- TASK-012 repairs derived/runtime state using TASK-009 integrity metadata and TASK-006 automation.
- TASK-013 exposes controlled extension points after External Integration and Conformance boundaries exist.
- TASK-014 uses TASK-007 Monitoring plus TASK-005/006 execution evidence to calibrate non-mandatory governance recommendations.
- TASK-015 composes TASK-006 orchestration with TASK-007 monitoring, TASK-008 external integration, TASK-009 security, TASK-010 release compatibility and TASK-011 conformance to provide optional distributed operation.

No Task in this refinement is automatically authorized. Formal task.md, authority, gate and Adaptive Development Profile are resolved only when each Task begins.

## Ver.2.9 Canonical Promotion Record

- Status: `CURRENT_CANONICAL`
- Effective date: `2026-08-08`
- Supersedes: Architecture Ver.2.8
- Scope: Post-TASK-006 roadmap refinement only. TASK-006 completion and implementation Evidence remain immutable.
- Coverage evidence: `tasks/TASK-006/task006-final-completion-record.md`
- TASK-009〜015 implementation authorization: `NONE`
- Next canonical development route: `TASK-007 — Monitoring & Dashboard`


# Part XI — TASK-007 Monitoring & Dashboard Completion

## 102. Completion decision

TASK-007 Monitoring & Dashboard is technically complete under `DEV_4_FOUNDATION_CRITICAL`. The implementation is a read-only derived observability layer over TASK-004 Lifecycle/Cost evidence, TASK-005 Knowledge evidence, TASK-006 Registry/Automation evidence and explicitly supplied verified operational observations.

The core invariant is unchanged from Architecture Chapter 16: Dashboard, Alert, Snapshot, Trend and Monitoring Event are not canonical sources. They summarize or audit authoritative/verified data and are rebuildable. TASK-007 has no authority to transition Lifecycle state, promote Knowledge, grant Owner authorization, rewrite canonical Registry content, repair canonical artifacts or send external notifications.

Canonical detailed design:

`specifications/TASK-007_BAI_Development_OS_Monitoring_Dashboard_Ver1.0.md`

## 103. Implemented Monitoring surfaces

| Surface | Implemented outcome |
|---|---|
| Event contract | Versioned, checksummed Monitoring Event with project/task/run/correlation identity |
| Derived event ledger | Root-confined append-only JSONL with record hash chain and post-write verification |
| Lifecycle | status/phase counts, phase age, gate failures |
| Quality | total/pass/fail/pass rate/retest |
| Automation | run/retry/stall/approval-waiting |
| Context | tokens, duplicate/stale/conflict, mandatory missing |
| Cost | actual, budget, utilization, Role/Model breakdown |
| Model | call/failure/latency/fallback |
| Knowledge | application/verification/recurrence/stale rates and Knowledge Debt |
| Registry | verify/checksum failure and rebuild |
| Integration | failure/rate-limit evidence surface |
| Governance | VERIFY failure, approval pending, deviation |
| System | critical incident and canonical-integrity incident surface |
| Provenance | source age, freshness, verification, checksum/revision metadata |
| Alerting | INFO/WARNING/HIGH/CRITICAL vocabulary, threshold evaluation, duplicate suppression |
| Health | HEALTHY / DEGRADED / AT_RISK / CRITICAL |
| Audit | filtered query and correlation trace |
| Trend | snapshot comparison and metric time series |
| Dashboard | project cards, multi-project workspace summary, standalone escaped HTML |

## 104. Source provenance and current-truth protection

A major TASK-007 design requirement is preventing a stale Dashboard from appearing authoritative.

- Canonical/ledger collectors verify Lifecycle checksum, Cost Ledger chain and Knowledge repository/usage ledger using the owning subsystem.
- Ad-hoc operational inputs remain `verified: false` unless the caller supplies verification metadata.
- Source metadata records observed time, verification state, checksum and revision where available.
- Stale source produces a derived `WARNING`.
- Unverified source produces a derived `HIGH` alert.
- Dashboard always carries `canonical_authority: false` and `derived_rebuildable: true`.

Monitoring does not repair or reclassify the source. Repair belongs TASK-012 and external collection/transport belongs TASK-008/TASK-015 as applicable.

## 105. Alert and health semantics

The implemented Alert Engine follows Chapter 16 severity intent:

- `INFO`: normal operational event classification.
- `WARNING`: soft budget, stale source, long-running phase or elevated advisory metric.
- `HIGH`: repeated stall, low quality, mandatory source/context missing, Registry/Governance verification failure, high model/integration failure rate.
- `CRITICAL`: critical system incident or canonical-integrity failure.

Health is a derived summary of the highest active alert severity:

- no WARNING+ → `HEALTHY`;
- WARNING → `DEGRADED`;
- HIGH → `AT_RISK`;
- CRITICAL → `CRITICAL`.

Alert identity is deterministic for the same project/task/value/threshold/time input. Duplicate derived alerts can be suppressed within a policy window; source Evidence is never deleted by deduplication.

## 106. Dashboard portability

TASK-007 deliberately does not make React, Grafana, Prometheus or another UI vendor canonical. The core emits a stable Dashboard model and a dependency-free standalone HTML renderer. Future UI/connector implementations can consume the model through TASK-008/TASK-013 without changing Monitoring authority.

The HTML renderer escapes supplied content and labels itself as a derived, non-authoritative view.

## 107. Multi-project monitoring

Workspace Dashboard consumes project snapshots and ranks health while preserving `project_id` and optional `task_id`. It does not merge canonical state or allow one project's evidence to authorize another project.

This surface is the observation input for future TASK-011 multi-project conformance and TASK-014 adaptive calibration.

## 108. TASK-007 final assurance

Final implementation assurance:

- TASK-007 dedicated Monitoring suite: `59 / 59 PASS`.
- Full BAI Development OS suite: `484 / 484 PASS`.
- JavaScript Roulette reference consumer: `10 / 10 PASS`.
- Product Boundary: `PASS`.
- Root `MonitoringOS` export: `PASS`.
- Monitoring JSON Schemas: `4 / 4 Draft 2020-12 parse PASS`.
- Blocking Critic findings after correction: `0`.

Resolved implementation findings include audit-query structuredClone callback misuse, missing source freshness/verification visibility, non-deterministic alert identity, insufficient cost/knowledge/quality metric detail, JSON-only dashboard surface and lack of verified canonical collectors.

Accepted residual: local Monitoring Event JSONL append is hash-verified but not journal-based crash-atomic. A partial tail is detected and rejected on verify. Journal/repair is deferred to TASK-009/TASK-012.

## 109. Canonical roadmap after TASK-007

| Order | Task | Current status | Primary outcome |
|---:|---|---|---|
| 1 | TASK-005 | COMPLETED | Knowledge Operating System |
| 2 | TASK-006 | COMPLETED | Orchestration & Automation Foundation |
| 3 | TASK-007 | COMPLETED | Monitoring & Dashboard |
| 4 | TASK-008 | NEXT / NOT_STARTED / NOT_AUTHORIZED | External Integration |
| 5 | TASK-009 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Security / Supply Chain / Integrity Hardening |
| 6 | TASK-010 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Release / Distribution / Consumer Upgrade OS |
| 7 | TASK-011 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Multi-Project Conformance & Compatibility Lab |
| 8 | TASK-012 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Self-Maintenance / Drift Detection / Safe Auto-Repair |
| 9 | TASK-013 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Domain Adapter / Plugin SDK |
| 10 | TASK-014 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Adaptive Governance Calibration & Policy Learning |
| 11 | TASK-015 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Distributed Orchestration & Event Fabric |

TASK-008 becomes the next route but is not implicitly authorized by TASK-007 completion.

## 110. Ver.2.10 Canonical Promotion Record

- Status: `CURRENT_CANONICAL`
- Effective date: `2026-08-08`
- Supersedes: Architecture Ver.2.9
- Scope: TASK-007 Monitoring & Dashboard completion integration. Prior TASK-004〜006 completion and roadmap refinements remain historical/current inputs as applicable.
- Coverage evidence: `tasks/TASK-007/task007-final-completion-record.md`
- TASK-008 implementation authorization: `NONE BY THIS RECORD`
- Next canonical development route: `TASK-008 — External Integration`

# Part XII — Post-TASK-007 Monitoring Roadmap Refinement

## 111. Refinement decision

TASK-007 is complete and MUST NOT be reopened for ordinary product expansion. Implementation and Critic review exposed monitoring capabilities that are intentionally outside the completed read-only Monitoring authority but should become explicit future product responsibilities.

This refinement does not move the core external-notification responsibility out of TASK-008. TASK-008 still owns Gmail/Slack/Discord/webhook/other external delivery and connector execution. The additions below start at TASK-009 and cover hardening, lifecycle, conformance, extension, calibration and distributed operation of monitoring data after connector delivery exists.

All additions remain `PROPOSED / NOT_STARTED / NOT_AUTHORIZED` and do not authorize implementation.

## 112. TASK-009 — Monitoring Security, Privacy & Integrity additions

Add the following TASK-007-derived hardening scope to Security / Supply Chain / Integrity Hardening:

- Crash-consistent Monitoring Event persistence using journal/WAL or equivalent commit fencing so interrupted appends can be recovered rather than only detected.
- Cryptographic provenance for Monitoring Event, Alert, Snapshot and exported audit bundles, including optional signing and signature verification.
- Common tamper-evident ledger verification, tail truncation/recovery policy and replay protection shared with Knowledge/Automation ledgers.
- Sensitive-field classification, redaction and disclosure policy for logs, prompts, paths, model metadata, user identifiers, credentials and external connector payloads before they enter observability surfaces.
- Secret/token leakage detection for Monitoring Events and diagnostic exports.
- Root/path/symlink confinement for monitoring retention, export and recovery locations.
- Security fault-injection for corrupted ledger tails, forged provenance, replayed events, malicious HTML/dashboard content and disclosure-policy violations.

**Acceptance direction:** monitoring integrity/privacy primitives are reusable across collectors and exporters, and an invalid or unverifiable source can never be silently promoted to trusted dashboard truth.

## 113. TASK-010 — Monitoring Release, Schema & Diagnostic Bundle compatibility additions

Add the following Monitoring compatibility scope to Release / Distribution / Consumer Upgrade OS:

- Semantic versioning and migration rules for Monitoring Event, Monitoring Policy, Snapshot and Dashboard Model schemas.
- Backward/forward compatibility matrix for stored Monitoring data across OS upgrade/downgrade.
- Upgrade preview that reports incompatible metrics, renamed fields, alert-policy changes and required retention migrations before mutation.
- Versioned offline diagnostic/support bundle format containing checksums, provenance, schema versions and redaction metadata.
- Export/import verification for dashboard snapshots, audit traces and historical monitoring bundles.
- Release regression fixtures proving that a supported Consumer can upgrade without losing interpretable historical monitoring evidence.
- Rollback behavior that preserves readable pre-upgrade monitoring history instead of rewriting historical records in place.

**Acceptance direction:** Monitoring history remains interpretable and verifiable across supported OS releases and offline troubleshooting workflows.

## 114. TASK-011 — Multi-project Monitoring Conformance additions

Add the following Monitoring-specific scope to Multi-Project Conformance & Compatibility Lab:

- Prove strict project/task identity isolation in Workspace Dashboard, audit query, correlation trace and alert deduplication.
- Detect cross-project metric contamination, evidence leakage and accidental authorization inference from another Consumer's monitoring state.
- Noisy-neighbor tests for one project producing excessive events, cardinality or alert volume without degrading unrelated project visibility.
- Metric-cardinality budgets and bounded label dimensions for high-volume Consumers.
- Comparable health semantics across Small/Medium/Large and Low-risk/Core-critical fixtures without forcing identical thresholds on unlike projects.
- Concurrent collector and dashboard tests across multiple Consumers, including partial failure of one project.
- Monitoring portability certification covering source provenance, time semantics, schema compatibility and isolation.

**Acceptance direction:** a multi-project dashboard can aggregate visibility while preserving authority, identity, resource and confidentiality boundaries for every Consumer.

## 115. TASK-012 — Monitoring Data Lifecycle, Repair & Rebuild additions

Add the following Monitoring self-maintenance scope to Self-Maintenance / Drift Detection & Safe Auto-Repair:

- Configurable retention classes for raw events, alerts, snapshots, traces and derived rollups.
- Safe compaction/rollup that preserves audit provenance and never rewrites canonical source Evidence.
- Journal/tail repair for incomplete Monitoring Event appends after TASK-009 integrity metadata is available.
- Rebuild Dashboard/Alert/Trend state deterministically from verified source events and canonical subsystem evidence.
- Detect orphan alerts, stale snapshots, invalid correlation indexes and derived-cache drift.
- Alert lifecycle cleanup for resolved/expired derived alerts without deleting source evidence.
- Backup/restore and fsck-style verification for monitoring repositories and diagnostic bundles.
- Storage-pressure policy with Safe Stop/escalation when retention requirements cannot be satisfied safely.
- Scheduled self-check for stale collectors, repeated verification failure, runaway event volume and retention backlog.

**Acceptance direction:** monitoring-derived state is disposable and rebuildable, while retained audit history remains verifiable under compaction, recovery and storage pressure.

## 116. TASK-013 — Monitoring Collector / Renderer / Exporter Plugin additions

Add the following extension points to Domain Adapter / Plugin SDK:

- Collector plugin contract for domain-specific metrics and verified source adapters.
- Metric-derivation plugin contract with declared input authority, units, cardinality and deterministic computation requirements.
- Alert-rule provider plugins that may add advisory rules but cannot weaken mandatory security/governance alerts.
- Dashboard renderer plugins for Web/Desktop/CLI/Grafana-like views without making a UI vendor canonical.
- Exporter plugins for OpenTelemetry/Prometheus-compatible or domain-specific telemetry formats under explicit capability and privacy contracts.
- Correlation enrichers that preserve existing trace identity and cannot forge canonical provenance.
- Plugin manifest requirements for schema versions, permissions, trust level, resource budgets, test pack and failure isolation.
- Sandboxed plugin failure behavior so one collector/renderer/exporter cannot corrupt the Monitoring core or another project.

**Acceptance direction:** monitoring presentation and domain collection can expand without embedding vendor/domain-specific code into the Monitoring core.

## 117. TASK-014 — Adaptive Monitoring Calibration, Anomaly & SLO additions

Add the following evidence-driven calibration scope to Adaptive Governance Calibration & Policy Learning:

- Learn advisory threshold recommendations from historical baselines while preserving fixed mandatory safety floors.
- Measure alert precision/recall proxies, false-positive rate, duplicate/noise rate, acknowledgement time and actionability.
- Detect alert fatigue and recommend dedup/suppression-window changes through shadow evaluation before activation.
- Baseline and anomaly detection for cost, latency, retry, failure, Knowledge Debt, context growth and phase duration.
- Optional seasonality/workload-aware baselines where sufficient evidence exists; insufficient evidence MUST remain explicit rather than guessed.
- Define derived SLI/SLO views for development reliability, quality, automation success and governance responsiveness; SLOs are operational targets, not canonical authority.
- Correlate threshold recommendations with defect escape, Critic findings, test failures, token cost and Owner interventions.
- Policy simulation/counterfactual replay against historical Monitoring Events before Owner-authorized policy change.
- Automatic learning may recommend but MUST NOT lower CORE/FOUNDATION/CRITICAL assurance floors or mandatory integrity/privacy alerts.

**Acceptance direction:** Monitoring becomes less noisy and more predictive over time without allowing learned policy to silently weaken required governance.

## 118. TASK-015 — Distributed Telemetry, Trace & High-availability additions

Expand Distributed Orchestration & Event Fabric with Monitoring-specific distributed operation:

- Distributed Monitoring Event transport with durable delivery, bounded retry and explicit backpressure.
- End-to-end trace/correlation propagation across project, worker, process and machine boundaries.
- Clock-skew/time-source metadata and ordering semantics so distributed latency and causality are not inferred from wall-clock timestamps alone.
- Duplicate/out-of-order event handling and idempotent aggregation.
- Collector lease/heartbeat and failover semantics; loss of a collector becomes visible rather than silently producing healthy-looking gaps.
- Partition-aware buffering and recovery after network outage, with explicit data-loss indicators when guarantees cannot be met.
- Horizontal aggregation of project health without merging canonical authority.
- Resource quotas for telemetry volume, queue depth and cardinality to prevent distributed observability from becoming an unbounded cost center.
- Distributed trace/audit replay tied to TASK-015 workflow/event identities.
- High-availability tests for worker crash, collector crash, queue outage, partial partition, clock skew and replay storms.

**Acceptance direction:** distributed monitoring extends the lightweight local TASK-007 model only when topology requires it; single-machine Consumers remain on the simpler local path.

## 119. TASK-008 boundary preserved

External alert delivery remains TASK-008 because connector execution is its primary product responsibility. TASK-009〜015 may harden, version, repair, extend, calibrate or distribute alert data, but they MUST NOT redefine TASK-008 connector authority.

Examples:

- `TASK-008`: send a HIGH alert to Slack/Gmail/webhook under authorized connector policy.
- `TASK-009`: sign/redact/verify the alert payload.
- `TASK-010`: keep the alert envelope compatible across releases.
- `TASK-011`: prove Project A's alert cannot leak to Project B.
- `TASK-012`: rebuild or repair derived alert state.
- `TASK-013`: provide new renderer/exporter/collector plugins.
- `TASK-014`: calibrate advisory threshold/noise policy.
- `TASK-015`: transport/trace alerts across distributed workers.

## 120. Refined canonical roadmap after TASK-007

| Order | Task | Current status | Monitoring-related future outcome |
|---:|---|---|---|
| 1 | TASK-005 | COMPLETED | Knowledge Operating System |
| 2 | TASK-006 | COMPLETED | Orchestration & Automation Foundation |
| 3 | TASK-007 | COMPLETED | Read-only Monitoring & Dashboard baseline |
| 4 | TASK-008 | NEXT / NOT_STARTED / NOT_AUTHORIZED | External connector and alert delivery |
| 5 | TASK-009 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Monitoring integrity, privacy, signing and crash consistency |
| 6 | TASK-010 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Monitoring schema/release compatibility and diagnostic bundles |
| 7 | TASK-011 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Multi-project monitoring isolation and noisy-neighbor conformance |
| 8 | TASK-012 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Retention, compaction, repair, rebuild and monitoring fsck |
| 9 | TASK-013 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Collector/metric/renderer/exporter plugin contracts |
| 10 | TASK-014 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Adaptive thresholds, anomaly, SLI/SLO and alert-fatigue calibration |
| 11 | TASK-015 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Distributed telemetry, trace, backpressure and HA collectors |

No item is implicitly authorized. TASK-008 remains the next canonical development route.

## 121. Ver.2.11 Canonical Promotion Record

- Status: `CURRENT_CANONICAL`
- Effective date: `2026-08-08`
- Supersedes: Architecture Ver.2.10
- Scope: post-TASK-007 roadmap refinement only; TASK-007 implementation/completion Evidence remains immutable.
- Coverage evidence: `tasks/TASK-007/task007-final-completion-record.md`
- Refinement record: `architecture/BAI_Development_OS_Post_TASK007_Roadmap_Refinement_Ver1.0.md`
- TASK-009〜015 implementation authorization: `NONE`
- TASK-008 implementation authorization: `NONE BY THIS RECORD`
- Next canonical development route: `TASK-008 — External Integration`
# Part XIII — TASK-008 External Integration Completion

## 118. Completion decision

TASK-008 External Integration is completed at the Ver.1.0 foundation baseline. The Integration Layer now has executable, tested governance rather than only a conceptual connector table.

The authoritative detailed design is `specifications/TASK-008_BAI_Development_OS_External_Integration_Ver1.0.md`.

## 119. Integration authority model

IntegrationOS is an execution boundary, not a new authority source.

- TASK-004 owns Lifecycle/Guard/Cost.
- TASK-005 owns Knowledge.
- TASK-006 owns Orchestration/Automation and requests integration work.
- TASK-007 observes Integration as derived Monitoring.
- TASK-008 owns Connector Manifest/Capability/Policy/Audit/Execution boundary.
- External providers never become canonical merely because a request succeeded.

Every normalized external response explicitly carries `canonical: false`. Connector trust can be UNTRUSTED, REFERENCE, REVIEW_REQUIRED or VERIFIED; canonical promotion remains a separate domain/governance decision.

## 120. Delivered Integration Gateway

The completed Gateway provides:

1. checksummed Connector Manifest and deterministic Registry;
2. capability/operation least-privilege resolution;
3. reference-only credentials and required-scope/expiry validation;
4. checksummed Integration Request and data classification;
5. full task/connector/capability/operation authorization binding for external side effects;
6. semantic idempotency fingerprint and collision Safe Stop;
7. bounded retry, AbortSignal timeout and lightweight local rate limiting;
8. TASK-004 Cost Guard reservation/actual/release integration;
9. license-sensitive external generation context;
10. noncanonical response trust normalization;
11. HMAC inbound webhook verification and untrusted reference conversion;
12. hash-chained sanitized Integration Audit;
13. TASK-007 Integration Monitoring events;
14. vendor-neutral GitHub/MCP/External AI/Communication/Storage reference profiles and service composition.

## 121. External action rule

Read/search operations may execute when capability, credential and data policy pass. External/irreversible actions require explicit authorization and idempotency by default. A generic `authorized: true` flag is insufficient: the approval must bind the actual task, connector, capability and operation.

Secrets are resolved only at runtime. Inline secret material is rejected from request payloads and credential references, and an adapter that echoes the input credential is blocked.

## 122. Cost, timeout and reliability composition

When configured with a Cost Budget, IntegrationOS reuses TASK-004 Cost Guard rather than maintaining a second cost ledger. It reserves estimated external cost before execution, records actual cost on success and releases the reservation on terminal failure.

Transient retry is allowed only when the capability is read/retry-safe or semantic idempotency protects an external effect. Timeout sends AbortSignal to the adapter. Process-local rate limiting is deliberately lightweight and does not claim distributed enforcement.

## 123. Inbound and outbound trust

Outbound normalized responses remain references. Inbound webhook transport may be cryptographically verified, but its payload is still represented as an UNTRUSTED, noncanonical Inbound Reference pending review. Transport authenticity and domain truth are intentionally different concepts.

## 124. TASK-008 assurance

Final implementation assurance at canonical promotion:

- TASK-008 dedicated Integration tests: `77 / 77 PASS`.
- Full BAI Development OS regression: `561 / 561 PASS`.
- IntegrationOS root export: `PASS`.
- Integration JSON schemas: `6 / 6 parse PASS`.
- Blocking Critic findings after correction: `0`.

Critic corrections include strict authorization binding, credential-reference revalidation, semantic idempotency collision detection, mandatory license terms provenance, timeout resource cleanup, AbortSignal propagation and direct TASK-004 Cost Guard integration.

## 125. Accepted residual and post-TASK-008 ownership

TASK-008 is not reopened for ordinary productization. Remaining expansion is owned by the reserved roadmap:

- TASK-009: audit/idempotency crash journal, signatures, credential lifecycle, durable webhook replay/security hardening;
- TASK-010: connector/schema/release compatibility and upgrade/downgrade migration;
- TASK-011: multi-project connector isolation/conformance;
- TASK-012: integration state/audit repair and deterministic rebuild;
- TASK-013: domain/vendor connector Plugin SDK;
- TASK-014: evidence-based retry/rate/timeout/authorization calibration;
- TASK-015: distributed connectors, durable queues/rate limits/leases/event fabric.

Local rate limiting remains process-local. Audit JSONL is fail-detecting rather than journal-recovering. Abort cancellation relies on adapters honoring the supplied AbortSignal.

## 126. Canonical roadmap after TASK-008

| Order | Task | Current status | Primary outcome |
|---:|---|---|---|
| 1 | TASK-005 | COMPLETED | Knowledge Operating System |
| 2 | TASK-006 | COMPLETED | Orchestration & Automation Foundation |
| 3 | TASK-007 | COMPLETED | Monitoring & Dashboard |
| 4 | TASK-008 | COMPLETED | External Integration |
| 5 | TASK-009 | NEXT / NOT_STARTED / NOT_AUTHORIZED | Security / Supply Chain / Integrity Hardening |
| 6 | TASK-010 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Release / Distribution / Consumer Upgrade OS |
| 7 | TASK-011 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Multi-Project Conformance & Compatibility Lab |
| 8 | TASK-012 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Self-Maintenance / Drift Detection / Safe Auto-Repair |
| 9 | TASK-013 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Domain Adapter / Plugin SDK |
| 10 | TASK-014 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Adaptive Governance Calibration & Policy Learning |
| 11 | TASK-015 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Distributed Orchestration & Event Fabric |

TASK-009 becomes the next route but is not automatically authorized by TASK-008 completion.

## 127. Ver.2.12 Canonical Promotion Record

- Status: `CURRENT_CANONICAL`
- Effective date: `2026-08-08`
- Supersedes: Architecture Ver.2.11
- Scope: TASK-008 External Integration completion integration.
- Coverage evidence: `tasks/TASK-008/task008-final-completion-record.md`
- TASK-009 implementation authorization: `NONE BY THIS RECORD`
- Next canonical development route: `TASK-009 — Security / Supply Chain / Integrity Hardening`

# Part XIV — Post-TASK-008 External Integration Roadmap Refinement

## 128. Refinement decision

TASK-008 is complete and MUST NOT be reopened for ordinary product expansion. Its implementation and Critic review exposed concrete security, lifecycle, compatibility, conformance, maintenance, extension, calibration and distributed-execution needs. Those needs are assigned to the already-reserved TASK-009〜015 boundaries rather than creating a new Task.

All additions below remain `PROPOSED / NOT_STARTED / NOT_AUTHORIZED`. This refinement changes roadmap scope only; it does not authorize TASK-009 or alter the completed TASK-008 authority model.

## 129. TASK-009 — External Integration Security, Identity & Integrity additions

Add the following TASK-008-derived scope to Security / Supply Chain / Integrity Hardening:

- Credential Provider/Vault abstraction with scoped secret leases, rotation, revocation, expiry, key/version identity and zero-secret persistence in normal OS artifacts.
- Support for KMS/HSM-backed signing or equivalent protected key providers without making a specific vendor canonical.
- Cryptographic signing/verification for Connector Manifest, Integration Audit checkpoints, authorization evidence and exportable integration bundles.
- Crash-consistent journal/WAL or equivalent commit fencing for Integration Audit and semantic idempotency state.
- Durable webhook replay protection using nonce/event-id persistence, expiry and deterministic duplicate rejection.
- Connector sandbox hardening: process/capability confinement, filesystem/path restrictions, environment-variable minimization and resource ceilings.
- Network egress policy with destination allowlists, protocol restrictions, private-address protection, redirect validation and SSRF/DNS-rebinding defenses.
- Payload disclosure policy and DLP-style scanning for credentials, tokens, private keys, personal data and restricted project artifacts before external transmission.
- Supply-chain provenance for connector packages/binaries, including checksum/signature/SBOM or equivalent evidence where available.
- Security fault-injection for forged authorization, credential revocation during execution, replayed webhooks, malicious redirects, connector compromise and audit-tail corruption.

**Acceptance direction:** an external connector can never gain more identity, network, filesystem, secret or data authority than its declared capability and bound authorization provide.

## 130. TASK-010 — Connector Release, Compatibility & Migration additions

Add the following TASK-008-derived scope to Release / Distribution / Consumer Upgrade OS:

- Semantic versioning for Connector Manifest, capabilities, request/response envelopes, credential-reference contracts and Integration Audit records.
- Connector compatibility matrix covering OS version, connector version, capability version and supported provider/API version.
- Contract-test fixtures for provider endpoint changes, field deprecations and authentication mechanism migrations.
- Upgrade preview that reports breaking capability, scope, credential, license, rate-limit or data-policy changes before mutation.
- Canary connector rollout and health-gated promotion with deterministic rollback to the previous known-good connector version.
- Credential-reference migration that changes identifiers/providers without copying raw secret material into release artifacts.
- Provider/API deprecation tracking and migration deadlines as release evidence rather than hidden runtime warnings.
- Versioned connector lock/manifest snapshot for reproducible Consumer environments and offline diagnosis.

**Acceptance direction:** a Consumer can upgrade, downgrade or replace a connector with explicit compatibility evidence and a rollback path instead of silently inheriting provider drift.

## 131. TASK-011 — Multi-Project / Multi-Tenant Integration Conformance additions

Add the following TASK-008-derived scope to Multi-Project Conformance & Compatibility Lab:

- Strict tenant/project isolation for credentials, authorization, idempotency keys, audit records, rate budgets, webhook routing and response references.
- Fairness/noisy-neighbor tests where one Consumer exhausts rate quota, retries aggressively or receives a webhook storm without starving unrelated Consumers.
- Shared-provider rate-limit partitioning and explicit project-level quota attribution.
- Real-provider sandbox/conformance profiles where safe and available, while retaining deterministic fake connectors for CI.
- Cross-provider failure matrix for throttling, auth expiry, partial outage, malformed response, pagination drift, slow streaming and provider-side duplicate delivery.
- Data-residency / region-policy conformance where connector metadata exposes storage or processing region.
- Capability-equivalence tests proving alternative providers satisfy the same OS contract without gaining hidden authority.
- Webhook ownership/routing tests proving one project's inbound event cannot be accepted by another project's endpoint or authorization context.

**Acceptance direction:** multi-project operation shares infrastructure without sharing authority, secrets, quota, identity or inbound-event ownership.

## 132. TASK-012 — Integration State Reconciliation, Repair & Recovery additions

Add the following TASK-008-derived scope to Self-Maintenance / Drift Detection / Safe Auto-Repair:

- `integration fsck` covering audit hash chains, idempotency records, rate-limit state, connector manifests, credential references and webhook replay state.
- Deterministic reconciliation of orphaned or stuck Cost Guard reservations created by interrupted external calls.
- Recovery of incomplete audit/idempotency transactions using TASK-009 journal metadata; never guess if commit state cannot be proven.
- Detection/quarantine of stale connector manifests, expired credential references, abandoned authorization evidence and unsupported provider versions.
- Rebuild derived Integration indexes and caches from verified source records without rewriting historical audit evidence.
- Safe cleanup/compaction of expired replay nonces, derived rate windows and obsolete connector cache entries with retention evidence.
- Dead-letter inspection and controlled replay for inbound/outbound integration operations that could not be safely completed.
- Health reconciliation that detects adapters ignoring AbortSignal, repeated timeout leakage or cost-reservation mismatches.

**Acceptance direction:** derived Integration state is repairable/rebuildable while ambiguous external side effects always Safe Stop for human or domain-specific reconciliation.

## 133. TASK-013 — Connector / Authentication / Transport Plugin SDK additions

Add the following TASK-008-derived extension scope to Domain Adapter / Plugin SDK:

- Stable Connector SDK with lifecycle hooks for install, validate, enable, disable, health-check, execute and uninstall.
- Authentication strategy plugins for API key, OAuth2/OIDC, service account, signed request and custom credential providers while keeping secrets reference-only.
- Capability negotiation so a connector advertises supported operations, retry/idempotency semantics, data classes, license needs and cost/rate metadata at activation.
- Pagination, batch, streaming and long-running-job adapter helpers with bounded resource use and consistent cancellation.
- Webhook/inbound-event adapter contract with verification, normalization, replay identity and trust classification hooks.
- OpenAPI/MCP or equivalent contract-assisted adapter generation as an optional build-time aid, never as automatic authority.
- Provider-specific error normalization into stable OS retry/auth/rate/license/data-policy categories.
- Plugin permission manifest, sandbox requirements, resource budgets, compatibility metadata and conformance test kit.

**Acceptance direction:** adding a provider should normally require a connector package plus declared contracts, not edits to IntegrationOS core.

## 134. TASK-014 — Adaptive Integration Policy Calibration additions

Add the following TASK-008-derived scope to Adaptive Governance Calibration & Policy Learning:

- Evidence-based recommendations for retry count, exponential backoff/jitter, timeout, local/distributed rate windows and concurrency limits per connector/capability.
- Circuit-breaker / provider-health scoring based on verified failure, latency and throttling evidence.
- Authorization-friction metrics: measure redundant Owner prompts versus prevented unsafe external effects without weakening mandatory external-action gates.
- Cost/latency/reliability comparison across equivalent providers as advisory routing evidence, not automatic canonical provider selection.
- Calibration of idempotency/retry safety classifications from observed duplicate or partial-effect incidents.
- Alerting for persistent credential expiry, webhook replay, timeout, rate-limit or license-context failures.
- Counterfactual replay against historical Integration Audit to evaluate alternative retry/timeout/rate policies before policy change.
- Mandatory floors for credential secrecy, authorization binding, restricted-data policy, license provenance and irreversible external effects MUST NOT be automatically weakened.

**Acceptance direction:** adaptive policy may reduce wasted retries, waiting and Owner interruption, but never learns away security or authority requirements.

## 135. TASK-015 — Distributed Integration & Event Fabric additions

Extend the optional Distributed Orchestration & Event Fabric with the following TASK-008-derived responsibilities:

- Distributed semantic idempotency store and deduplication for cross-process/cross-machine connector execution.
- Durable shared rate-limit/quota coordination across workers and projects, with fairness and provider-scope partitioning.
- Durable webhook ingestion queue with replay identity, ordering/causality metadata and backpressure.
- Worker leases/heartbeats for external jobs, explicit ownership transfer and abandoned-job recovery.
- At-least-once transport with exactly-once effect achieved through idempotent consumers where the provider semantics permit it.
- Distributed timeout/cancellation propagation and late-result quarantine.
- Cross-machine cost reservation ownership and reconciliation with TASK-004 Cost Guard.
- Network-partition behavior, duplicate delivery, worker crash, failover, queue backlog and replay-storm tests.
- Optional cross-region topology metadata without making multi-region deployment mandatory.

TASK-015 remains optional. Single-machine/single-project environments continue using TASK-008 local connector execution and process-local rate control until scale or topology actually requires distributed coordination.

## 136. Refined canonical roadmap after TASK-008

| Order | Task | Current status | TASK-008-derived addition |
|---:|---|---|---|
| 1 | TASK-009 | NEXT / NOT_STARTED / NOT_AUTHORIZED | credential/vault, signing, durable replay, connector sandbox/egress/DLP/supply-chain integrity |
| 2 | TASK-010 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | connector SemVer, compatibility, contract tests, canary/rollback, provider migration |
| 3 | TASK-011 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | tenant isolation, quota fairness, real-provider conformance, webhook ownership |
| 4 | TASK-012 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | integration fsck, reconciliation, dead-letter/replay, repair/rebuild |
| 5 | TASK-013 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | Connector SDK, auth/transport/webhook adapters, capability negotiation |
| 6 | TASK-014 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | adaptive retry/rate/timeout/circuit-breaker/provider-health calibration |
| 7 | TASK-015 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED | distributed idempotency/rate/webhook/job/cancellation/cost coordination |

No item is implicitly authorized. TASK-009 remains the next canonical route.

## 137. Ver.2.13 Canonical Promotion Record

- Status: `CURRENT_CANONICAL`
- Effective date: `2026-08-08`
- Supersedes: Architecture Ver.2.12
- Scope: post-TASK-008 External Integration roadmap refinement and Ver.2.12 machine-document synchronization correction.
- TASK-008 status: `COMPLETED` and not reopened.
- Refinement record: `architecture/BAI_Development_OS_Post_TASK008_Roadmap_Refinement_Ver1.1.md`
- TASK-009〜015 implementation authorization: `NONE BY THIS RECORD`
- Next canonical development route: `TASK-009 — Security / Supply Chain / Integrity Hardening`

# Part XV — Current Consolidated Roadmap Authority

## 138. Current-roadmap interpretation rule

This Part XV is the **single current scope authority** for the roadmap lineage. TASK-009 through TASK-012 are completed and governed by their completion Parts plus Detailed Designs; `TASK-013` through `TASK-015` use the consolidated future scopes in this Part, including the TASK-009-derived, TASK-010-derived, TASK-011-derived and TASK-012-derived additions accumulated through Ver.2.22. Parts VI, VIII, X, XII and XIV are immutable Historical Evolution records and MUST NOT be interpreted independently as current complete scope.

Historical statements elsewhere in this document such as `TASK-009 is not defined in the current canonical OS roadmap` and `TASK-009 remains undefined unless separately designed and authorized` describe an earlier point in time and are **explicitly superseded for current routing** by this Part XV. They remain unchanged only for audit history.

Consolidation rules:

- No requirement from the post-TASK-004, post-TASK-005, post-TASK-006, post-TASK-007 or post-TASK-008 roadmap sections is deleted by this consolidation.
- Each future Task has one Current Consolidated Scope below; later detailed design MAY refine implementation detail but MUST preserve or explicitly supersede every requirement with migration evidence.
- `TASK-013` remains fundamentally **Domain Adapter / Plugin SDK**; Knowledge, Orchestration, Monitoring and Connector plugin work are subordinate extension surfaces, not a replacement of the original cross-domain objective.
- `TASK-015` remains optional and topology-driven; local/single-machine operation stays first-class.
- All TASK-009〜015 remain `PROPOSED / NOT_STARTED / NOT_AUTHORIZED`; this consolidation does not activate implementation.

## 139. TASK-009 — Security, Supply Chain & Integrity Hardening — CURRENT CONSOLIDATED SCOPE

**Current ownership statement:** OS-wide security, identity, secret, integrity, path/network boundary, audit persistence and supply-chain hardening. Security controls are reusable primitives rather than component-local fixes.

**Status:** `COMPLETED`

### 139.1 Original product scope (TASK-004 completion baseline)

_Historical source: `## 64. TASK-009 — Security, Supply Chain & Integrity Hardening`_

**目的:** TASK-004で実際に発見したsymlink/root escapeのような境界事故を個別Fixで終わらせず、OS全体のSecurity/Integrity基盤へ昇格させる。

主な拡張候補:

- Trusted Root / canonical realpath / traversal / symlink / junction等の共通Path Safety Library化。
- Secret・credential・sensitive artifactの検知、保存・出力・Evidence化ポリシー。
- Lockfile / dependency integrity、SBOM、provenance、署名、checksum、release artifact integrity。
- Dependency/Vulnerability policyとRisk-based blocking。
- Untrusted input / generated artifact / external tool outputのtrust classification。
- Security regression pack、fault injection、boundary fuzzing、consumer-side security conformance。

**完了イメージ:** セキュリティ境界が各Component固有実装ではなく共通Policy/Runtime/Test Packとして再利用可能になる。

### 139.2 Knowledge OS additions (TASK-005-derived)

_Historical source: `## 76. TASK-009 — Security, Supply Chain & Integrity Hardening: Knowledge integrity additions`_

Add the following Knowledge-specific hardening scope:

- Crash-consistent Knowledge mutation protocol using WAL/journal or equivalent commit fencing across revision file, current pointer and Asset Event.
- Recovery verification that distinguishes committed, prepared, orphaned and torn Knowledge mutations without guessing canonical state.
- Shared integrity primitives for Knowledge Event/Usage Ledgers, Pack manifests and repository pointers, including signature-ready canonical serialization.
- Cross-project sensitivity isolation for GLOBAL/WORKSPACE/PROJECT Knowledge so confidential Knowledge cannot leak through resolver results, Pack export, diagnostics or Evidence.
- Tamper/fault-injection tests covering interrupted writes, reordered writes, truncated ledgers, pointer rollback, malicious symlink/path substitution and untrusted imported Knowledge artifacts.

**TASK-005 residual closed by this future scope:** power-loss atomicity is currently fail-closed but not transactionally recovered.

### 139.3 Orchestration & Automation additions (TASK-006-derived)

_Historical source: `## 93. TASK-009 — Security, Supply Chain & Integrity Hardening: orchestration integrity additions`_

Add the following TASK-006-derived hardening scope:

- Shared crash-consistent mutation primitive for derived multi-file synchronization, Workspace Registry persistence, Outbox acknowledgement and other authority-adjacent derived state. Use journal/WAL or equivalent prepare/commit fencing, root-confined temporary files and deterministic recovery.
- Tamper-evident Owner Approval envelopes with canonical serialization, checksum/signature readiness, nonce/replay protection, issuer/scope/expiry binding and secret-safe diagnostic rendering.
- Signed/hash-bound Completion Outbox event envelopes and acknowledgement records so local derived synchronization can detect truncation, reordering, forged event identity and replay.
- Common sandbox/path-security library for runtime probes, mutation probes, fault injection and derived sync, covering realpath, traversal, symlink/junction substitution and capability-scoped write roots.
- Trust classification for runtime probe output, external command output, generated manifests and imported Registry/Project Index artifacts before they can influence execution.
- Security/fault-injection pack for stale approvals, forged authorizations, malicious path substitution, interrupted registry writes, acknowledgement corruption and sandbox breakout attempts.

**TASK-006 residual addressed:** current multi-file derived synchronization is fail-safe but not crash-atomic, and approval/outbox integrity is local rather than cryptographically transport-ready.

### 139.4 Monitoring & Dashboard additions (TASK-007-derived)

_Historical source: `## 112. TASK-009 — Monitoring Security, Privacy & Integrity additions`_

Add the following TASK-007-derived hardening scope to Security / Supply Chain / Integrity Hardening:

- Crash-consistent Monitoring Event persistence using journal/WAL or equivalent commit fencing so interrupted appends can be recovered rather than only detected.
- Cryptographic provenance for Monitoring Event, Alert, Snapshot and exported audit bundles, including optional signing and signature verification.
- Common tamper-evident ledger verification, tail truncation/recovery policy and replay protection shared with Knowledge/Automation ledgers.
- Sensitive-field classification, redaction and disclosure policy for logs, prompts, paths, model metadata, user identifiers, credentials and external connector payloads before they enter observability surfaces.
- Secret/token leakage detection for Monitoring Events and diagnostic exports.
- Root/path/symlink confinement for monitoring retention, export and recovery locations.
- Security fault-injection for corrupted ledger tails, forged provenance, replayed events, malicious HTML/dashboard content and disclosure-policy violations.

**Acceptance direction:** monitoring integrity/privacy primitives are reusable across collectors and exporters, and an invalid or unverifiable source can never be silently promoted to trusted dashboard truth.

### 139.5 External Integration additions (TASK-008-derived)

_Historical source: `## 129. TASK-009 — External Integration Security, Identity & Integrity additions`_

Add the following TASK-008-derived scope to Security / Supply Chain / Integrity Hardening:

- Credential Provider/Vault abstraction with scoped secret leases, rotation, revocation, expiry, key/version identity and zero-secret persistence in normal OS artifacts.
- Support for KMS/HSM-backed signing or equivalent protected key providers without making a specific vendor canonical.
- Cryptographic signing/verification for Connector Manifest, Integration Audit checkpoints, authorization evidence and exportable integration bundles.
- Crash-consistent journal/WAL or equivalent commit fencing for Integration Audit and semantic idempotency state.
- Durable webhook replay protection using nonce/event-id persistence, expiry and deterministic duplicate rejection.
- Connector sandbox hardening: process/capability confinement, filesystem/path restrictions, environment-variable minimization and resource ceilings.
- Network egress policy with destination allowlists, protocol restrictions, private-address protection, redirect validation and SSRF/DNS-rebinding defenses.
- Payload disclosure policy and DLP-style scanning for credentials, tokens, private keys, personal data and restricted project artifacts before external transmission.
- Supply-chain provenance for connector packages/binaries, including checksum/signature/SBOM or equivalent evidence where available.
- Security fault-injection for forged authorization, credential revocation during execution, replayed webhooks, malicious redirects, connector compromise and audit-tail corruption.

**Acceptance direction:** an external connector can never gain more identity, network, filesystem, secret or data authority than its declared capability and bound authorization provide.

## 140. TASK-010 — Release, Distribution & Consumer Upgrade OS — CURRENT CONSOLIDATED SCOPE

**Current ownership statement:** Versioning, release, distribution, migration, compatibility, rollback and reproducibility for the OS plus Knowledge, Automation, Monitoring and Connector artifacts consumed by projects.

**Status:** `COMPLETED`

### 140.1 Original product scope (TASK-004 completion baseline)

_Historical source: `## 65. TASK-010 — Release, Distribution & Consumer Upgrade OS`_

**目的:** ローカルで完成したBAI Development OSを、複数Consumerへ再現可能に配布・導入・更新・Rollbackできる製品へする。

主な拡張候補:

- Semantic Versioning、Release Manifest、Changelog、Git tag/GitHub Releaseの標準化。
- Consumer側 `.bai-os/` のOS Version pin、互換範囲、migration requirement。
- Install / update / downgrade / rollback / migration command。
- package registry障害、offline、mirror、cache、air-gapped環境を考慮したDependency acquisition strategy。
- Release artifact checksum/signature/provenanceとpost-release VERIFY。
- Repository rename / remote migration / default branch / release channel検証。
- Breaking change detectionとupgrade preview/dry-run。

**背景:** TASK-004最終回帰時にConsumer buildがpackage registry環境へ依存して再現できないケースが発生した。この種の問題を「環境依存」で終わらせずDistribution品質として扱う。

### 140.2 Knowledge OS additions (TASK-005-derived)

_Historical source: `## 77. TASK-010 — Release, Distribution & Consumer Upgrade OS: Knowledge distribution additions`_

Add the following Knowledge distribution scope:

- Portable Knowledge Pack export/import bundle with version, checksum, schema, provenance, sensitivity and compatibility manifest.
- Knowledge schema/taxonomy migration policy across BAI Development OS releases.
- Upgrade preview that reports Pack invalidation, superseded revisions, incompatible mandatory Knowledge and required re-resolution before consumer upgrade.
- Offline/cacheable Knowledge bundle distribution for consumers that cannot reach the canonical repository.
- Rollback semantics that restore compatible Knowledge views without silently reactivating invalid or superseded revisions.

**Outcome:** OS release compatibility includes Knowledge compatibility, not only runtime/API compatibility.

### 140.3 Orchestration & Automation additions (TASK-006-derived)

_Historical source: `## 94. TASK-010 — Release, Distribution & Consumer Upgrade OS: automation compatibility additions`_

Add the following TASK-006-derived release/upgrade scope:

- Version and compatibility contracts for Workspace Registry, Multi-Project Project Index, Role Startup Package, Owner Approval envelope, Automation Plan/Result, Completion Outbox and acknowledgement formats.
- Upgrade/downgrade migration tooling for `.bai-os/` automation state and derived indexes, including dry-run compatibility reports and rollback checkpoints.
- Release manifest that declares minimum/maximum consumer adapter versions, runtime probe capabilities, schema versions and migration requirements.
- Offline/cacheable bootstrap bundle for Runtime Probe definitions, schemas, startup templates and essential automation metadata.
- Breaking-change detection for action classification, Owner-gate semantics, startup bindings, outbox event shapes and automation result contracts.
- Migration rules that never silently broaden authorization, external-side-effect scope or Owner Approval validity during upgrade.

**Outcome:** automation compatibility becomes a versioned product contract rather than an implicit property of source-code compatibility.

### 140.4 Monitoring & Dashboard additions (TASK-007-derived)

_Historical source: `## 113. TASK-010 — Monitoring Release, Schema & Diagnostic Bundle compatibility additions`_

Add the following Monitoring compatibility scope to Release / Distribution / Consumer Upgrade OS:

- Semantic versioning and migration rules for Monitoring Event, Monitoring Policy, Snapshot and Dashboard Model schemas.
- Backward/forward compatibility matrix for stored Monitoring data across OS upgrade/downgrade.
- Upgrade preview that reports incompatible metrics, renamed fields, alert-policy changes and required retention migrations before mutation.
- Versioned offline diagnostic/support bundle format containing checksums, provenance, schema versions and redaction metadata.
- Export/import verification for dashboard snapshots, audit traces and historical monitoring bundles.
- Release regression fixtures proving that a supported Consumer can upgrade without losing interpretable historical monitoring evidence.
- Rollback behavior that preserves readable pre-upgrade monitoring history instead of rewriting historical records in place.

**Acceptance direction:** Monitoring history remains interpretable and verifiable across supported OS releases and offline troubleshooting workflows.

### 140.5 External Integration additions (TASK-008-derived)

_Historical source: `## 130. TASK-010 — Connector Release, Compatibility & Migration additions`_

Add the following TASK-008-derived scope to Release / Distribution / Consumer Upgrade OS:

- Semantic versioning for Connector Manifest, capabilities, request/response envelopes, credential-reference contracts and Integration Audit records.
- Connector compatibility matrix covering OS version, connector version, capability version and supported provider/API version.
- Contract-test fixtures for provider endpoint changes, field deprecations and authentication mechanism migrations.
- Upgrade preview that reports breaking capability, scope, credential, license, rate-limit or data-policy changes before mutation.
- Canary connector rollout and health-gated promotion with deterministic rollback to the previous known-good connector version.
- Credential-reference migration that changes identifiers/providers without copying raw secret material into release artifacts.
- Provider/API deprecation tracking and migration deadlines as release evidence rather than hidden runtime warnings.
- Versioned connector lock/manifest snapshot for reproducible Consumer environments and offline diagnosis.

**Acceptance direction:** a Consumer can upgrade, downgrade or replace a connector with explicit compatibility evidence and a rollback path instead of silently inheriting provider drift.


### 140.6 SecurityOS additions (TASK-009-derived)

_Historical source: `BAI_Development_OS_Post_TASK009_Roadmap_Refinement_Ver1.0.md — TASK-010`_

Add the following release/security productization scope:

- Formal Release Signing Ceremony with explicit signer identity, trust anchor, approval evidence, key version and artifact set.
- Signed release manifest/update bundle that binds OS version, schemas, SBOM, dependency inventory, migration plan, checksums and rollback target.
- Trust-anchor bootstrap and rotation procedure that allows verification-key changes without silently trusting a new key.
- Migration compatibility for SecurityOS journal/WAL, Signed Ledger, Secret Reference, Supply-chain Manifest and Security Policy schema revisions.
- Key-rotation-aware upgrade/downgrade verification, including rollback to a release signed by an earlier still-trusted key.
- Security-profile compatibility matrix so upgrades cannot silently weaken required signing, DLP, egress, replay or sandbox policy.
- Reproducible release attestation and post-install VERIFY that proves the installed bits correspond to the declared manifest/SBOM.
- Air-gapped/offline secure update bundle with detached verification material and no dependency on live provider reachability.

**Acceptance direction:** a Consumer can upgrade, downgrade and rollback while preserving a continuous verifiable trust chain and without silently weakening SecurityOS policy.

## 141. TASK-011 — Multi-Project Conformance & Compatibility Lab — CURRENT CONSOLIDATED SCOPE

**Current ownership statement:** Machine-verifiable conformance across projects, domains, versions and providers, with strict isolation of authority, knowledge, monitoring, credentials, quotas and external-event ownership.

**Status:** `COMPLETED`

### 141.1 Original product scope (TASK-004 completion baseline)

_Historical source: `## 66. TASK-011 — Multi-Project Conformance & Compatibility Lab`_

**目的:** `javascript-roulette` 単一Fixtureだけでなく、異なる規模・言語・DomainのProjectをBAI Development OSへ載せても基盤が過不足なく機能することを継続検証する。

主な拡張候補:

- Consumer Contract Test / Compatibility Matrix。
- `javascript-roulette`、`makeTikTokGiftMaster` 等のReference Consumer群。
- Small / Medium / Large、Low-risk / Core-criticalのProject fixtures。
- Install → Task execution → Recovery → Closure → UpgradeまでのE2E。
- OS Coreのconsumer repo混入、project-specific ruleのOS側流入を検知するBoundary test。
- Version間upgrade regression、backward compatibility、migration fixtures。
- Consumer Certification / Compatibility Levelの機械判定。

**完了イメージ:** 「このProjectを基盤へ載せられるか」を人の勘ではなくConformance Suiteで判定できる。

### 141.2 Knowledge OS additions (TASK-005-derived)

_Historical source: `## 78. TASK-011 — Multi-Project Conformance & Compatibility Lab: Knowledge portability additions`_

Add the following cross-project Knowledge verification scope:

- Cross-project promotion fixtures that validate the evidence-diversity floor for GLOBAL Knowledge.
- Negative tests proving PROJECT/TASK scoped or sensitive Knowledge cannot contaminate unrelated consumers.
- Resolver conformance matrix across Small/Medium/Large and multiple Domain/reference consumers.
- Compatibility tests for Mandatory Knowledge, conflicting Knowledge, supersedes/requires graphs and version-pinned Packs across consumer upgrades.
- Machine-readable Knowledge Portability/Isolation certification as part of consumer conformance.

**Outcome:** reusable Knowledge is proven portable where intended and isolated where not intended.

### 141.3 Orchestration & Automation additions (TASK-006-derived)

_Historical source: `## 95. TASK-011 — Multi-Project Conformance & Compatibility Lab: orchestration conformance additions`_

Add the following TASK-006-derived multi-consumer verification scope:

- Conformance matrix for multiple simultaneous Project Index entries with overlapping names, nested roots, different shells/runtimes and heterogeneous technology stacks.
- Negative tests proving one consumer's Role Startup Package, Owner Approval, Knowledge Pack, worktree evidence, derived sync or automation result cannot contaminate another consumer.
- Cross-project concurrency tests for Registry rebuild, Runtime Probe, conditional automation and completion-event consumption.
- Consumer fixtures for already-authorized safe implementation, dangerous-action Owner gating, sandbox mutation, restart/resume and derived-sync failure.
- Multi-consumer idempotency/replay tests proving Completion events remain exactly-once in effect even when delivery is at-least-once.
- Machine-readable Orchestration Compatibility Level covering Registry, Runtime, Startup, Authority, Automation and Outbox contracts.

**Outcome:** reusable orchestration is demonstrated under real multi-project contention, not only one-project-at-a-time fixtures.

### 141.4 Monitoring & Dashboard additions (TASK-007-derived)

_Historical source: `## 114. TASK-011 — Multi-project Monitoring Conformance additions`_

Add the following Monitoring-specific scope to Multi-Project Conformance & Compatibility Lab:

- Prove strict project/task identity isolation in Workspace Dashboard, audit query, correlation trace and alert deduplication.
- Detect cross-project metric contamination, evidence leakage and accidental authorization inference from another Consumer's monitoring state.
- Noisy-neighbor tests for one project producing excessive events, cardinality or alert volume without degrading unrelated project visibility.
- Metric-cardinality budgets and bounded label dimensions for high-volume Consumers.
- Comparable health semantics across Small/Medium/Large and Low-risk/Core-critical fixtures without forcing identical thresholds on unlike projects.
- Concurrent collector and dashboard tests across multiple Consumers, including partial failure of one project.
- Monitoring portability certification covering source provenance, time semantics, schema compatibility and isolation.

**Acceptance direction:** a multi-project dashboard can aggregate visibility while preserving authority, identity, resource and confidentiality boundaries for every Consumer.

### 141.5 External Integration additions (TASK-008-derived)

_Historical source: `## 131. TASK-011 — Multi-Project / Multi-Tenant Integration Conformance additions`_

Add the following TASK-008-derived scope to Multi-Project Conformance & Compatibility Lab:

- Strict tenant/project isolation for credentials, authorization, idempotency keys, audit records, rate budgets, webhook routing and response references.
- Fairness/noisy-neighbor tests where one Consumer exhausts rate quota, retries aggressively or receives a webhook storm without starving unrelated Consumers.
- Shared-provider rate-limit partitioning and explicit project-level quota attribution.
- Real-provider sandbox/conformance profiles where safe and available, while retaining deterministic fake connectors for CI.
- Cross-provider failure matrix for throttling, auth expiry, partial outage, malformed response, pagination drift, slow streaming and provider-side duplicate delivery.
- Data-residency / region-policy conformance where connector metadata exposes storage or processing region.
- Capability-equivalence tests proving alternative providers satisfy the same OS contract without gaining hidden authority.
- Webhook ownership/routing tests proving one project's inbound event cannot be accepted by another project's endpoint or authorization context.

**Acceptance direction:** multi-project operation shares infrastructure without sharing authority, secrets, quota, identity or inbound-event ownership.


### 141.6 Security isolation and adversarial conformance additions (TASK-009-derived)

_Historical source: `BAI_Development_OS_Post_TASK009_Roadmap_Refinement_Ver1.0.md — TASK-011`_

Add the following multi-project SecurityOS conformance scope:

- Per-project Vault/Secret Reference isolation; a credential reference from Project A cannot resolve in Project B without explicit shared authority.
- Per-project signer, verification-key and trust-anchor isolation, including key-ID collision and wrong-key verification tests.
- Security Policy isolation for DLP, egress, replay, signing-required and sandbox requirements.
- Concurrent replay/idempotency race tests across multiple projects and providers.
- Shared infrastructure fairness tests where egress, signer, vault or security scanning resources are contended.
- Cross-project supply-chain provenance tests ensuring one Consumer cannot substitute another Consumer's approved manifest/SBOM.
- Real provider/container/security-backend conformance fixtures where safe sandboxes are available.
- Adversarial fixtures for path escape, secret confusion, forged signatures, stale trust anchors and mixed-project ledger records.

**Acceptance direction:** SecurityOS provides the same fail-closed guarantees under multi-project concurrency as it does in a single-project local environment.



### 141.7 Release portability and compatibility conformance additions (TASK-010-derived)

_Historical source: `BAI_Development_OS_Post_TASK010_Roadmap_Refinement_Ver1.0.md — TASK-011`_

Add the following ReleaseOS conformance scope:

- Cross-platform release matrix covering Linux, Windows, macOS/Unix-like environments where supported, plus WSL/containerized consumers where the project contract declares them.
- CPU/architecture compatibility fixtures for supported x64/ARM64-style targets without assuming one architecture is canonical.
- Filesystem-semantics fixtures covering case-sensitive/case-insensitive paths, symlink capability, permission differences, atomic rename behavior and constrained/network-mounted filesystems where supported.
- Package-manager / artifact-provider / release-source compatibility matrix using deterministic fake providers in CI and real provider sandboxes only where safe and available.
- Sequential upgrade-chain tests such as N-2 -> N-1 -> N, direct N-2 -> N where allowed, downgrade, rollback and mixed consumer-version operation.
- Multi-consumer Trust Anchor/key-rotation conformance proving a release accepted by one project cannot silently widen trust in another project.
- Offline/air-gapped, corrupt-cache, stale-mirror, unavailable-registry and partially available source acquisition fixtures.
- Security-profile non-weakening tests across heterogeneous consumers and historical installed-state migrations.
- Canary cohort conformance across multiple consumers, including one unhealthy cohort, partial compatibility and deterministic rollback evidence.

**Acceptance direction:** ReleaseOS portability is demonstrated across real platform/filesystem/provider variation instead of being inferred from one local machine or one package source.

## 142. TASK-012 — Self-Maintenance, Drift Detection & Safe Auto-Repair — CURRENT CONSOLIDATED SCOPE

**Current ownership statement:** Long-lived self-maintenance: drift detection, fsck, deterministic rebuild, reconciliation, retention/compaction, safe repair and rollback without silently changing authority-bearing canonical state.

**Status:** `COMPLETED`

### 142.1 Original product scope (TASK-004 completion baseline)

_Historical source: `## 67. TASK-012 — Self-Maintenance, Drift Detection & Safe Auto-Repair`_

**目的:** Phase 6 System Syncを一回の同期機能から、長期運用時の正本Driftを発見・説明・安全に修復できる自己保守機能へ拡張する。

主な拡張候補:

- Canonical MD / DOCX / Summary / Registry / Schema / Template間のdrift detection。
- Registry hash/size/path/statusの継続整合確認。
- Missing/stale/duplicate/superseded document detection。
- Self-audit reportとimpact-scoped repair plan生成。
- DEV profileに応じた自動修復可否判定。Critical/authority変更はOwner承認を維持。
- Repair後の再ハッシュ、再レンダー、回帰、rollback checkpoint。
- Scheduled health checkとdrift trend。

**原則:** 自己修復はAuthorityを迂回しない。自動修復可能なのは機械的・低リスク・可逆なDriftに限定する。

### 142.2 Knowledge OS additions (TASK-005-derived)

_Historical source: `## 79. TASK-012 — Self-Maintenance, Drift Detection & Safe Auto-Repair: Knowledge repository maintenance additions`_

Add the following Knowledge self-maintenance scope:

- Knowledge repository `fsck` covering revision/current/event/usage/Pack consistency.
- Journal-assisted recovery for interrupted mutation after TASK-009 introduces crash-consistent commit metadata.
- Detection and safe handling of orphan revisions, missing current pointers, unreachable Pack artifacts, truncated event chains and stale indexes.
- Rebuildable derived indexes/caches from immutable canonical Knowledge without changing authoritative revisions.
- Knowledge garbage-collection/compaction policy for expired CANDIDATE data, superseded derived artifacts and old Pack caches while retaining required historical Evidence.
- Repair plan + checkpoint + verify + rollback workflow; authority-bearing Knowledge state is never silently repaired.

**Outcome:** long-lived Knowledge repositories can diagnose and recover from drift instead of accumulating manual repair debt.

### 142.3 Orchestration & Automation additions (TASK-006-derived)

_Historical source: `## 96. TASK-012 — Self-Maintenance, Drift Detection & Safe Auto-Repair: automation maintenance additions`_

Add the following TASK-006-derived self-maintenance scope:

- Workspace Registry / Project Index `fsck`, deterministic rebuild and stale-index reconciliation from canonical project metadata.
- Local Completion Outbox acknowledgement audit, dead-letter queue, replay queue and idempotent repair for failed derived synchronization.
- Detection and cleanup proposals for expired Owner Authorization proposals, orphaned approval artifacts, stale Runtime Probe evidence and abandoned scheduled automation records.
- Crash-recovery/repair for multi-file derived documentation synchronization after TASK-009 supplies journal/commit metadata.
- Re-probe policy for stale Runtime/Environment evidence before automation executes; no stale cached readiness may silently become authority.
- Worktree/session evidence repair plans that remain derived and never rewrite canonical Task/Lifecycle evidence.
- Scheduled self-health verification for Registry drift, outbox backlog, repeated sync failure, stale probes and automation retry storms.

**Outcome:** TASK-006 derived/runtime state becomes diagnosable and repairable without turning derived data into canonical authority.

### 142.4 Monitoring & Dashboard additions (TASK-007-derived)

_Historical source: `## 115. TASK-012 — Monitoring Data Lifecycle, Repair & Rebuild additions`_

Add the following Monitoring self-maintenance scope to Self-Maintenance / Drift Detection & Safe Auto-Repair:

- Configurable retention classes for raw events, alerts, snapshots, traces and derived rollups.
- Safe compaction/rollup that preserves audit provenance and never rewrites canonical source Evidence.
- Journal/tail repair for incomplete Monitoring Event appends after TASK-009 integrity metadata is available.
- Rebuild Dashboard/Alert/Trend state deterministically from verified source events and canonical subsystem evidence.
- Detect orphan alerts, stale snapshots, invalid correlation indexes and derived-cache drift.
- Alert lifecycle cleanup for resolved/expired derived alerts without deleting source evidence.
- Backup/restore and fsck-style verification for monitoring repositories and diagnostic bundles.
- Storage-pressure policy with Safe Stop/escalation when retention requirements cannot be satisfied safely.
- Scheduled self-check for stale collectors, repeated verification failure, runaway event volume and retention backlog.

**Acceptance direction:** monitoring-derived state is disposable and rebuildable, while retained audit history remains verifiable under compaction, recovery and storage pressure.

### 142.5 External Integration additions (TASK-008-derived)

_Historical source: `## 132. TASK-012 — Integration State Reconciliation, Repair & Recovery additions`_

Add the following TASK-008-derived scope to Self-Maintenance / Drift Detection / Safe Auto-Repair:

- `integration fsck` covering audit hash chains, idempotency records, rate-limit state, connector manifests, credential references and webhook replay state.
- Deterministic reconciliation of orphaned or stuck Cost Guard reservations created by interrupted external calls.
- Recovery of incomplete audit/idempotency transactions using TASK-009 journal metadata; never guess if commit state cannot be proven.
- Detection/quarantine of stale connector manifests, expired credential references, abandoned authorization evidence and unsupported provider versions.
- Rebuild derived Integration indexes and caches from verified source records without rewriting historical audit evidence.
- Safe cleanup/compaction of expired replay nonces, derived rate windows and obsolete connector cache entries with retention evidence.
- Dead-letter inspection and controlled replay for inbound/outbound integration operations that could not be safely completed.
- Health reconciliation that detects adapters ignoring AbortSignal, repeated timeout leakage or cost-reservation mismatches.

**Acceptance direction:** derived Integration state is repairable/rebuildable while ambiguous external side effects always Safe Stop for human or domain-specific reconciliation.


### 142.6 Security repository maintenance and automated recovery additions (TASK-009-derived)

_Historical source: `BAI_Development_OS_Post_TASK009_Roadmap_Refinement_Ver1.0.md — TASK-012`_

Add the following SecurityOS self-maintenance scope:

- Security repository `fsck` covering Journal transactions, Signed Ledgers, replay state, Secret leases, Supply-chain manifests and trust metadata.
- Automatic classification of stale `PREPARED`, interrupted `COMMITTING`, committed-but-unverified and orphaned transaction state.
- Policy-governed recovery plans that can safely COMPLETE, quarantine or request Owner action without guessing canonical state.
- Signed-ledger compaction/checkpointing that preserves verifiable chain roots and historical auditability.
- Replay nonce/receipt expiry and compaction with protection against premature replay-window deletion.
- Secret lease expiry/revocation cleanup and detection of references pointing to missing/revoked providers.
- Supply-chain/SBOM cache refresh and stale-vulnerability-evidence detection.
- Cross-subsystem adoption audit that detects Knowledge/Automation/Monitoring/Integration paths bypassing required SecurityOS primitives.
- Quarantine for integrity-unknown artifacts plus deterministic rebuild where canonical source material still exists.

**Acceptance direction:** long-lived SecurityOS state can be verified, repaired or safely quarantined without weakening provenance or silently fabricating canonical truth.



### 142.7 Release state fsck, stale-lock recovery and lifecycle maintenance additions (TASK-010-derived)

_Historical source: `BAI_Development_OS_Post_TASK010_Roadmap_Refinement_Ver1.0.md — TASK-012`_

Add the following ReleaseOS self-maintenance scope:

- Stale release-operation lock detection using verifiable process/session/lease/heartbeat/age evidence rather than timeout-only guessing.
- Safe stale-lock reclamation with quarantine and Owner escalation when lock ownership cannot be proven dead.
- `release fsck` verification across installed state, signed manifest, journal, checkpoint, trust-anchor set, portable component bundles, cache and installation attestation.
- Recovery/reconciliation for interrupted install/update/downgrade/rollback transactions and partially written release checkpoints.
- Detection and quarantine of orphan release bundles, orphan checkpoints, undeclared cache entries, corrupt cache objects and stale migration plans.
- Trust Anchor / installed release / attestation reconciliation that never silently re-trusts an unknown key or weakens the active Security Profile.
- Deterministic regeneration of derived installation attestation and diagnostics from signed canonical release evidence.
- Safe garbage collection for obsolete bundles, caches and checkpoints while preserving configured rollback windows and audit retention.
- Repair plans that classify operations as automatic/reversible versus Owner-gated when canonical or trust-bearing state would change.
- Fault-injection fixtures for crash-after-lock, crash-after-checkpoint, crash-during-migration, disk-full/cache corruption and rollback interruption.

**Acceptance direction:** a crashed or long-lived ReleaseOS installation can be diagnosed and safely repaired without guessing lock ownership, trust state or rollback history.



### 142.8 Conformance evidence maintenance, certification drift and repair additions (TASK-011-derived)

_Historical source: `BAI_Development_OS_Post_TASK011_Roadmap_Refinement_Ver1.0.md — TASK-012`_

Add the following ConformanceOS self-maintenance scope:

- `conformance fsck` across Fixture, Matrix, Consumer execution evidence, Isolation/Fairness/Provider/Upgrade/Portability reports, Certification records and baseline checksums.
- Evidence freshness and environment-drift detection so an old REAL result cannot silently prove a materially changed runtime, filesystem, provider or Consumer revision.
- Detection/quarantine of orphan fixtures, missing Consumer roots, stale capability declarations, broken evidence references, duplicate run identities, truncated result sets and checksum-mismatched Certifications.
- Recovery classification for interrupted Consumer runs and partially written Certification artifacts; ambiguous execution results remain unproven rather than being guessed PASS.
- Deterministic Certification rebuild from immutable verified run evidence without upgrading `DECLARED`/`SIMULATED` evidence into `REAL`/`SANDBOX`.
- Baseline-diff reports that distinguish product regression, environment drift, provider drift and expected declared-scope change.
- Safe cleanup/retention for expired derived matrices, temporary sandbox workspaces and superseded Certification caches while retaining audit evidence required by policy.
- Re-execution proposals for stale or incomplete platform/provider evidence; automatic execution remains bounded by Runner trust/sandbox policy and authorization.
- Quarantine and Owner escalation when a previously certified project loses required evidence or its current environment can no longer be proven equivalent.

**Acceptance direction:** Conformance evidence remains trustworthy over time; maintenance may rebuild derived certification but never fabricate execution proof or silently preserve a stale PASS.

## 143. TASK-013 — Domain Adapter / Plugin SDK — CURRENT CONSOLIDATED SCOPE

**Current ownership statement:** The general Domain Adapter / Plugin SDK. Its original purpose remains primary: extend BAI Development OS to video, audio, BGM/SE, streaming, Unity, Web, Desktop, Automation and future domains without modifying OS Core. Knowledge, Orchestration, Monitoring and Connector SDK surfaces are subdomains of this one extension architecture.

**Status:** `COMPLETED`

### 143.1 Original product scope (TASK-004 completion baseline)

_Historical source: `## 68. TASK-013 — Domain Adapter / Plugin SDK`_

**目的:** BAI Development OSをsoftware開発専用に閉じず、動画・音声・BGM・SE・配信・Unity・Web・Desktop・Automation等へ同じ基盤を適用できる正式Extension機構を作る。

主な拡張候補:

- Adapter/Plugin manifestとCapability contract。
- Domain-specific Project Policy Pack / Test Pack / Evidence Pack。
- Tool connector abstractionとsandbox/boundary contract。
- Plugin lifecycle: discover / validate / enable / disable / upgrade / revoke。
- Domain固有artifactのvalidation、preview、quality gate。
- Core OSへDomain固有条件を埋め込まないExtension boundary。
- Official / Community / Project-local extensionのTrust Level。

**完了イメージ:** 新Domain対応のたびにOS Coreを書き換えず、Adapterを追加することで適用範囲を増やせる。

### 143.2 Knowledge OS additions (TASK-005-derived)

_Historical source: `## 80. TASK-013 — Domain Adapter / Plugin SDK: Knowledge extension points`_

Add the following Knowledge plugin scope:

- Domain-specific taxonomy extension packs without modifying core vocabulary directly.
- Pluggable Failure fingerprint extractors, asset validators, applicability predicates and resolver ranking signals under declared capability boundaries.
- Domain-specific Knowledge schemas/templates and Pack renderers/compressors while retaining core provenance, sensitivity, enforcement and checksum contracts.
- Plugin compatibility/versioning rules for Knowledge Assets and Knowledge Packs.
- Trust classification for Official / Community / Project-local Knowledge extension providers.

**Outcome:** video, audio, Unity, Web, Desktop, streaming and automation projects can gain domain-aware Knowledge behavior without forking Knowledge OS core.

### 143.3 Orchestration & Automation additions (TASK-006-derived)

_Historical source: `## 97. TASK-013 — Domain Adapter / Plugin SDK: orchestration extension additions`_

Add the following TASK-006-derived extension points:

- Pluggable Runtime Probes and environment detectors under explicit capability and trust contracts.
- Project Resolver / Risk signal adapters that feed, but cannot override, Adaptive Development Governance.
- Role Startup Package enrichers and Instruction Compiler stages with deterministic ordering and checksum binding.
- Action classifier / Automation executor plugins with declared side-effect classes, required authorization, rollback capability and sandbox requirements.
- Document synchronization providers, Completion Outbox consumers and notification/output adapters under bounded derived-state contracts.
- Domain-specific mutation/fault probes that remain sandbox-only unless a stronger explicitly authorized contract exists.
- Plugin manifest includes schema/version compatibility, trust level, required permissions and test/evidence pack.

**Outcome:** TASK-006 orchestration can expand to video/audio/Unity/Web/Desktop/streaming/automation domains without hard-coding domain execution logic into the core.

### 143.4 Monitoring & Dashboard additions (TASK-007-derived)

_Historical source: `## 116. TASK-013 — Monitoring Collector / Renderer / Exporter Plugin additions`_

Add the following extension points to Domain Adapter / Plugin SDK:

- Collector plugin contract for domain-specific metrics and verified source adapters.
- Metric-derivation plugin contract with declared input authority, units, cardinality and deterministic computation requirements.
- Alert-rule provider plugins that may add advisory rules but cannot weaken mandatory security/governance alerts.
- Dashboard renderer plugins for Web/Desktop/CLI/Grafana-like views without making a UI vendor canonical.
- Exporter plugins for OpenTelemetry/Prometheus-compatible or domain-specific telemetry formats under explicit capability and privacy contracts.
- Correlation enrichers that preserve existing trace identity and cannot forge canonical provenance.
- Plugin manifest requirements for schema versions, permissions, trust level, resource budgets, test pack and failure isolation.
- Sandboxed plugin failure behavior so one collector/renderer/exporter cannot corrupt the Monitoring core or another project.

**Acceptance direction:** monitoring presentation and domain collection can expand without embedding vendor/domain-specific code into the Monitoring core.

### 143.5 External Integration additions (TASK-008-derived)

_Historical source: `## 133. TASK-013 — Connector / Authentication / Transport Plugin SDK additions`_

Add the following TASK-008-derived extension scope to Domain Adapter / Plugin SDK:

- Stable Connector SDK with lifecycle hooks for install, validate, enable, disable, health-check, execute and uninstall.
- Authentication strategy plugins for API key, OAuth2/OIDC, service account, signed request and custom credential providers while keeping secrets reference-only.
- Capability negotiation so a connector advertises supported operations, retry/idempotency semantics, data classes, license needs and cost/rate metadata at activation.
- Pagination, batch, streaming and long-running-job adapter helpers with bounded resource use and consistent cancellation.
- Webhook/inbound-event adapter contract with verification, normalization, replay identity and trust classification hooks.
- OpenAPI/MCP or equivalent contract-assisted adapter generation as an optional build-time aid, never as automatic authority.
- Provider-specific error normalization into stable OS retry/auth/rate/license/data-policy categories.
- Plugin permission manifest, sandbox requirements, resource budgets, compatibility metadata and conformance test kit.

**Acceptance direction:** adding a provider should normally require a connector package plus declared contracts, not edits to IntegrationOS core.


### 143.6 Security provider and sandbox plugin additions (TASK-009-derived)

_Historical source: `BAI_Development_OS_Post_TASK009_Roadmap_Refinement_Ver1.0.md — TASK-013`_

Preserve TASK-013's original cross-domain Domain Adapter / Plugin SDK mission and add SecurityOS provider extension points:

- Secret/Vault Provider SDK for local stores and external secret managers.
- Signing Provider SDK for local Ed25519, cloud KMS, HSM and equivalent hardware-backed custody.
- Trust Anchor / Certificate / Verification-Key Provider abstraction.
- OS-native/container sandbox adapters with declared filesystem, environment, process, network and resource capabilities.
- DLP/Redaction scanner plugins with explicit sensitivity taxonomy and deterministic findings.
- Egress policy resolver and endpoint reputation/resolution plugins.
- Supply-chain scanner/SBOM/provenance provider plugins.
- Security provider capability manifest, trust level, version compatibility, resource budget, health probe and revocation lifecycle.
- Domain-specific Security Policy Pack / Security Test Pack / Security Evidence Pack extensions without embedding domain rules in Core SecurityOS.

**Acceptance direction:** real production security backends can replace reference/local implementations through governed plugins without changing SecurityOS callers or its authority boundaries.



### 143.7 Release / package-manager / distribution provider SDK additions (TASK-010-derived)

_Historical source: `BAI_Development_OS_Post_TASK010_Roadmap_Refinement_Ver1.0.md — TASK-013`_

Preserve TASK-013's original Domain Adapter / Plugin SDK mission and add the following ReleaseOS extension points:

- Platform Installer Provider contract for platform-specific install/update/remove mechanics while ReleaseOS retains manifest, authority, trust and rollback policy ownership.
- Package Manager Provider contract for ecosystem-specific dependency/package installation without making npm, pip, cargo, system packages or any other manager canonical.
- Artifact Repository / Release Source Provider contract for cache, mirror, registry, object-store and repository-release acquisition through declared capabilities.
- Repository Publication Adapter that delegates actual external publish/delete side effects to TASK-008 IntegrationOS and never self-authorizes publication.
- Migration Handler Plugin for component/schema migrations with declared source/target versions, reversibility, preflight and verification contract.
- Diagnostic / Attestation Export Provider for platform-native packaging of verified release evidence without changing its canonical meaning.
- Provider capability manifest covering supported platforms, architectures, filesystem assumptions, privilege requirements, offline behavior, rollback support and resource budget.
- Release-provider conformance kit requiring deterministic fake fixtures, sandbox execution and compatibility metadata before enablement.
- Provider lifecycle discover/validate/enable/disable/upgrade/revoke plus trust classification and isolation from ReleaseOS core.

**Acceptance direction:** adding a platform, package manager or artifact source normally requires a provider package and conformance evidence, not edits to ReleaseOS core contracts.



### 143.8 Conformance Provider / Runner / Fixture SDK additions (TASK-011-derived)

_Historical source: `BAI_Development_OS_Post_TASK011_Roadmap_Refinement_Ver1.0.md — TASK-013`_

Preserve TASK-013's original Domain Adapter / Plugin SDK mission and add ConformanceOS extension points:

- Platform Probe Provider SDK for OS, architecture, runtime, filesystem and capability discovery.
- Consumer Runner Provider SDK for bounded `NODE_TEST`, `NODE_SCRIPT`, `NPM_SCRIPT` and future domain-specific contract modes without exposing an arbitrary shell.
- Sandbox Provider SDK for local process isolation, container isolation and OS-native sandbox implementations.
- Fixture Provider / Generator SDK for project-local, official and community Consumer fixtures with explicit trust classification.
- Provider Conformance Adapter SDK for real API/service/backend capability and failure-semantic verification.
- Filesystem/Runtime Probe adapters for case sensitivity, symlink behavior, atomic rename, permissions and platform-specific constraints.
- Evidence Export/Import Provider for signed machine-readable Conformance results without treating imported evidence as REAL unless its execution provenance verifies.
- Windows and macOS native Runner/Probe providers so currently simulated targets can gain REAL evidence without core ConformanceOS edits.
- Cloud/lab execution adapters may provision or invoke external environments only through TASK-008 IntegrationOS with explicit external-side-effect authorization.
- Every provider declares capability manifest, supported evidence level, trust/sandbox requirement, version compatibility, resource budget and failure contract.
- Add provider conformance kits proving root confinement, command-mode restrictions, evidence classification and failure isolation.

**Acceptance direction:** new platforms, runtimes, sandboxes and provider labs are added through bounded adapters and evidence contracts, not through special cases in ConformanceOS core.


### 143.9 Maintenance Provider / Reconciler SDK additions (TASK-012-derived)

_Historical source: `BAI_Development_OS_Post_TASK012_Roadmap_Refinement_Ver1.0.md — TASK-013`_

Preserve TASK-013's original Domain Adapter / Plugin SDK mission and add MaintenanceOS extension points:

- Maintenance Adapter SDK for domain/provider-specific `inspect`, `verify`, `plan`, `repair`, `rollback`, `quarantine` and `reconcile` capabilities without moving domain authority into MaintenanceOS core.
- Atomic Precondition Provider contract that can prove the exact state/version/checksum/lease/ETag or equivalent condition required immediately before a repair mutation.
- Reconciliation Provider contract for opaque domain or external side effects where generic MaintenanceOS cannot infer whether a crashed operation actually occurred.
- Checkpoint/Snapshot Provider SDK for databases, object stores, package managers, cloud services and domain artifacts with explicit reversibility and retention semantics.
- Quarantine Provider SDK for domain-specific safe isolation while preserving provenance and preventing quarantined content from being mistaken for canonical state.
- Retention/Compaction Provider contract for subsystem-specific ledgers, caches, indexes and evidence stores with protected-artifact declarations.
- Drift Detector Provider SDK for semantic/domain drift that cannot be detected by generic checksum comparison alone.
- Repair Verification Provider contract that proves post-repair invariants independently from the mutating handler.
- External reconciliation adapters may read or mutate provider state only through TASK-008 IntegrationOS and its explicit external-side-effect authorization boundary.
- Provider manifests MUST declare trust level, artifact classes, authority touched, side-effect class, idempotency/replay semantics, rollback capability, sandbox requirement, resource budget and conformance tests.
- Add Maintenance Provider conformance kits covering stale-plan rejection, crash ambiguity, double execution, rollback failure, quarantine integrity and root/sandbox confinement.

**Acceptance direction:** new domain-specific maintenance/reconciliation behavior is supplied through bounded plugins with explicit proof contracts; generic MaintenanceOS never guesses opaque side-effect state and TASK-013 remains the parent Domain Adapter / Plugin SDK rather than becoming maintenance-only.

## 144. TASK-014 — Adaptive Governance Calibration & Policy Learning — CURRENT CONSOLIDATED SCOPE

**Current ownership statement:** Evidence-based calibration of adaptive governance, Knowledge resolution, automation, monitoring, integration, security, release, conformance, maintenance and Extension policies while preserving immutable safety/authority floors.

**Status:** `COMPLETED`

### 144.1 Original product scope (TASK-004 completion baseline)

_Historical source: `## 69. TASK-014 — Adaptive Governance Calibration & Policy Learning`_

**目的:** DEV-0〜DEV-4を固定ルールだけで運用せず、実運用Evidenceを使って「やり過ぎ」と「不足」の両方を継続的に校正する。ただし安全下限を自動で弱めない。

主な拡張候補:

- Change size / criticality / defect escape / Critic yield / test effectiveness / lead time / token-costの計測。
- Profile別の実績比較と過剰Review/過少Test検出。
- Review cycle、test depth、evidence depth、revalidation scopeの推奨値校正。
- Policy versioning、simulation、shadow evaluation、A/B相当の安全な比較。
- CORE/FOUNDATION/CRITICAL safety floorは自動降格禁止。
- Policy変更は説明可能な根拠とOwner/Policy authorizationを要求。
- TASK-005 Knowledge、TASK-007 Monitoringから得たEvidenceを利用するfeedback loop。

**完了イメージ:** Governanceコストを継続最適化しながら、重要機能の品質保証を犠牲にしない自己改善ループを持つ。

### 144.2 Knowledge OS additions (TASK-005-derived)

_Historical source: `## 81. TASK-014 — Adaptive Governance Calibration & Policy Learning: Knowledge learning additions`_

Add the following Knowledge calibration scope:

- Measure resolver precision proxies from usage, deviation, verification, effectiveness, defect escape and recurrence Evidence.
- Calibrate non-mandatory ranking weights, confidence thresholds and freshness/decay recommendations from observed outcomes.
- Detect Knowledge that is frequently selected but ineffective, rarely used but high-value, repeatedly overridden, or associated with regressions.
- Shadow/simulation evaluation of ranking or freshness-policy changes before activation.
- Counterfactual replay against historical Resolution Requests to estimate selection changes and conflict/missing-mandatory risk.
- Automatic recommendations may adjust advisory ranking only; MANDATORY enforcement, safety floors, Owner authority and security boundaries cannot be weakened automatically.

**Outcome:** Knowledge OS becomes evidence-calibrated without turning operational telemetry into uncontrolled self-modifying policy.

### 144.3 Orchestration & Automation additions (TASK-006-derived)

_Historical source: `## 98. TASK-014 — Adaptive Governance Calibration & Policy Learning: automation calibration additions`_

Add the following TASK-006-derived calibration scope:

- Measure redundant Owner-gate rate, dangerous-action catch rate, false escalation rate and manual override frequency.
- Measure automation completion rate, retry/timeout overhead, fallback success, restart/resume effectiveness and derived-sync repair frequency.
- Evaluate Prompt Compression quality using task success, missing-context findings, re-read demand, token cost and defect escape rather than output length alone.
- Measure Runtime Probe cost/freshness, cache hit quality, stale-evidence rejection and project-resolution ambiguity.
- Calibrate advisory thresholds for safe `IMPLEMENT_WRITE` automation, retry depth, prompt/context compression and revalidation scope through shadow/simulation first.
- Detect governance patterns where small reversible work is over-gated or critical work is under-reviewed.
- Automatic policy learning may recommend changes, but cannot weaken Owner-required action classes, Lifecycle/Knowledge authority, security boundaries, CORE/FOUNDATION/CRITICAL assurance floors or external-side-effect gates.

**Outcome:** orchestration speed and cost can be tuned from evidence while fixed safety boundaries remain non-self-modifying.

### 144.4 Monitoring & Dashboard additions (TASK-007-derived)

_Historical source: `## 117. TASK-014 — Adaptive Monitoring Calibration, Anomaly & SLO additions`_

Add the following evidence-driven calibration scope to Adaptive Governance Calibration & Policy Learning:

- Learn advisory threshold recommendations from historical baselines while preserving fixed mandatory safety floors.
- Measure alert precision/recall proxies, false-positive rate, duplicate/noise rate, acknowledgement time and actionability.
- Detect alert fatigue and recommend dedup/suppression-window changes through shadow evaluation before activation.
- Baseline and anomaly detection for cost, latency, retry, failure, Knowledge Debt, context growth and phase duration.
- Optional seasonality/workload-aware baselines where sufficient evidence exists; insufficient evidence MUST remain explicit rather than guessed.
- Define derived SLI/SLO views for development reliability, quality, automation success and governance responsiveness; SLOs are operational targets, not canonical authority.
- Correlate threshold recommendations with defect escape, Critic findings, test failures, token cost and Owner interventions.
- Policy simulation/counterfactual replay against historical Monitoring Events before Owner-authorized policy change.
- Automatic learning may recommend but MUST NOT lower CORE/FOUNDATION/CRITICAL assurance floors or mandatory integrity/privacy alerts.

**Acceptance direction:** Monitoring becomes less noisy and more predictive over time without allowing learned policy to silently weaken required governance.

### 144.5 External Integration additions (TASK-008-derived)

_Historical source: `## 134. TASK-014 — Adaptive Integration Policy Calibration additions`_

Add the following TASK-008-derived scope to Adaptive Governance Calibration & Policy Learning:

- Evidence-based recommendations for retry count, exponential backoff/jitter, timeout, local/distributed rate windows and concurrency limits per connector/capability.
- Circuit-breaker / provider-health scoring based on verified failure, latency and throttling evidence.
- Authorization-friction metrics: measure redundant Owner prompts versus prevented unsafe external effects without weakening mandatory external-action gates.
- Cost/latency/reliability comparison across equivalent providers as advisory routing evidence, not automatic canonical provider selection.
- Calibration of idempotency/retry safety classifications from observed duplicate or partial-effect incidents.
- Alerting for persistent credential expiry, webhook replay, timeout, rate-limit or license-context failures.
- Counterfactual replay against historical Integration Audit to evaluate alternative retry/timeout/rate policies before policy change.
- Mandatory floors for credential secrecy, authorization binding, restricted-data policy, license provenance and irreversible external effects MUST NOT be automatically weakened.

**Acceptance direction:** adaptive policy may reduce wasted retries, waiting and Owner interruption, but never learns away security or authority requirements.


### 144.6 Adaptive security-policy calibration additions (TASK-009-derived)

_Historical source: `BAI_Development_OS_Post_TASK009_Roadmap_Refinement_Ver1.0.md — TASK-014`_

Add the following evidence-driven SecurityOS calibration scope:

- Measure DLP false-positive/false-negative rates and recommend advisory tuning without auto-disabling mandatory secret classes.
- Calibrate replay-window and clock-skew tolerances from observed delivery behavior while preserving minimum anti-replay floors.
- Evaluate Secret lease TTL/rotation cadence against actual usage and operational interruption rates.
- Calibrate non-mandatory egress reputation/risk thresholds from verified incidents and false blocks.
- Evaluate supply-chain vulnerability thresholds, stale-evidence windows and remediation lead time.
- Measure signing/verification latency, provider reliability and Owner friction for secure operations.
- Detect recurring integrity/security failure patterns and propose targeted fault-injection or test-depth increases.
- Counterfactual replay of historical security decisions to estimate whether an alternative advisory policy would have reduced cost/friction without increasing accepted risk.
- Mandatory floors for secret handling, authorization, signature-required profiles, RESTRICTED data, irreversible actions and critical trust boundaries cannot be weakened automatically.

**Acceptance direction:** SecurityOS becomes less noisy and more efficient from evidence while mandatory security guarantees remain non-negotiable.



### 144.7 Adaptive release, canary, rollback and acquisition calibration additions (TASK-010-derived)

_Historical source: `BAI_Development_OS_Post_TASK010_Roadmap_Refinement_Ver1.0.md — TASK-014`_

Add the following evidence-based ReleaseOS calibration scope:

- Calibrate canary cohort size, rollout percentage and soak duration from verified failure/recovery evidence.
- Evaluate health-gate thresholds using false-promotion and false-rollback outcomes without weakening mandatory security/integrity gates.
- Calibrate rollback triggers from crash, regression, incompatibility and monitoring evidence while preserving Owner requirements for governed rollback/downgrade actions.
- Compare cache/mirror/registry acquisition reliability, latency and cost to recommend source ordering; source selection remains policy bounded.
- Measure migration success/failure, rollbackability and repair effort by component/schema version pair.
- Evaluate compatibility-rule strictness and false blocks; mandatory schema/security incompatibilities cannot be auto-relaxed.
- Recommend rollback-window/checkpoint-retention sizing from observed upgrade frequency and recovery needs while respecting audit/retention policy.
- Counterfactual replay of historical rollout decisions to estimate whether alternative cohort, soak or rollback policies would have reduced impact.
- Detect release-policy drift where local exceptions or provider behavior gradually diverge from the declared release contract.

**Acceptance direction:** ReleaseOS becomes faster and less disruptive from evidence while signing, trust, compatibility and authority safety floors remain non-negotiable.



### 144.8 Adaptive Conformance coverage and certification calibration additions (TASK-011-derived)

_Historical source: `BAI_Development_OS_Post_TASK011_Roadmap_Refinement_Ver1.0.md — TASK-014`_

Add evidence-driven ConformanceOS calibration:

- Measure flaky Consumer/Provider/Portability probes and distinguish infrastructure instability from product regression.
- Calibrate evidence-freshness windows by risk, environment volatility and Consumer criticality while preserving explicit stale-evidence disclosure.
- Calibrate weighted fairness and noisy-neighbor thresholds from observed shared-resource behavior.
- Measure false PASS, false FAIL and excessive CONDITIONAL outcomes against later verified evidence.
- Recommend which OS/architecture/filesystem/provider combinations deserve REAL execution next, using risk, usage, change history, cost and coverage gaps.
- Calibrate adversarial fixture selection and Certification depth so DEV-0〜4 profiles receive proportional evidence without weakening CORE/FOUNDATION floors.
- Evaluate C0〜C5 Certification usefulness and threshold friction; changes remain recommendation-driven and versioned.
- Detect blind spots where many simulated/declarative results create misleading apparent coverage.
- Use counterfactual replay to compare alternate coverage matrices, fairness thresholds and probe policies before adopting them.

Mandatory evidence floors MUST NOT be auto-weakened: `DECLARED`/`SIMULATED` can never be learned into `REAL`; C2+ still requires successful REAL/SANDBOX execution; root confinement, trusted/sandboxed execution and authority boundaries remain fixed safety constraints.


### 144.9 Adaptive maintenance policy and repair-efficiency calibration additions (TASK-012-derived)

_Historical source: `BAI_Development_OS_Post_TASK012_Roadmap_Refinement_Ver1.0.md — TASK-014`_

Add evidence-driven MaintenanceOS calibration while preserving fixed safety floors:

- Calibrate non-mandatory finding severity thresholds from verified recurrence, impact, repair success, rollback frequency and false-positive/false-negative evidence.
- Calibrate evidence freshness windows by subsystem volatility, criticality and change rate without allowing stale evidence to masquerade as current proof.
- Recommend maintenance cadence for fsck, drift scans, retention sweeps, replay/lease cleanup and integrity verification from observed change frequency and operational cost.
- Calibrate retention and checkpoint sizing from rollback demand, audit requirements, storage cost and recovery time objectives while never deleting protected Canonical/Authority/Trust evidence automatically.
- Measure automatic repair success, rollback success, quarantine frequency, Owner escalation yield and repeated-repair recurrence to detect ineffective repair policies.
- Detect repair loops and policy oscillation where the same finding is repeatedly fixed and reintroduced; recommend root-cause investigation or stronger conformance gates.
- Calibrate safe revalidation windows and stale-plan sensitivity from verified state-change rates; immediate required preconditions remain mandatory for mutations.
- Prioritize maintenance work by risk reduction per cost/token/time so low-value scans do not consume foundation-level governance continuously.
- Use counterfactual replay to compare alternate AUTO/OWNER/QUARANTINE classifications before policy adoption.
- Recommend when a repair should become a preventive Release/Conformance/Knowledge/Security rule instead of remaining recurring maintenance.

Mandatory floors MUST NOT be auto-weakened: Canonical/Authority/Trust mutation, destructive repair, ambiguous external state, explicit Owner gates, single-use Repair Plans, precondition revalidation, integrity verification and recovery-after-crash requirements remain fixed.

**Acceptance direction:** MaintenanceOS becomes cheaper and less noisy over time while repair authority and safety guarantees remain invariant and policy changes remain versioned, explainable and governed.

### 144.10 ExtensionOS calibration additions (TASK-013-derived)

_Historical source: `BAI_Development_OS_Post_TASK013_Roadmap_Refinement_Ver1.0.md — TASK-014`_

Add ExtensionOS evidence-driven calibration without moving execution authority into learned policy:

- Measure Provider success/failure/timeout/cancellation/throttling, latency, concurrency pressure, payload size, resource-budget exhaustion and Capability Broker denial reasons by Extension/capability/version.
- Recommend advisory timeout, concurrency and resource-budget values from verified REAL/SANDBOX evidence; insufficient evidence remains explicit and cannot be replaced by self-declaration.
- Compare equivalent Provider implementations on verified cost, latency, reliability and conformance evidence as advisory routing input only; CalibrationOS cannot silently replace the selected Provider or bypass Project Policy.
- Measure authorization/permission friction and distinguish redundant denials from prevented unsafe execution without weakening external-side-effect authorization, sandbox or Capability Broker requirements.
- Track trust/conformance freshness, upgrade/revoke/disable recovery outcomes and implementation-checksum churn; recommend revalidation or sandboxing when evidence becomes stale or unstable.
- Detect repeated Extension failure loops, unstable upgrades, noisy optional hooks, artifact-gate false blocks and ineffective Domain Pack recommendations; propose targeted Conformance/Test/Policy improvements.
- Shadow and counterfactual replay Extension recommendations before activation and bind results to exact Policy Candidate checksum/version.
- OFFICIAL/COMMUNITY/PROJECT_LOCAL classification never becomes execution trust through calibration. In-process trust still requires independent checksum-pinned proof; sandbox-required capability remains sandbox-required.
- Mandatory floors remain immutable: Core Authority cannot be overridden, Manifest cannot self-grant authority, Capability Broker mediation cannot be disabled, external side effects remain authorization-bound and mandatory Pack/Security floors cannot be learned away.

**Acceptance direction:** ExtensionOS becomes cheaper and more reliable from evidence while trust, authorization, sandbox and Core Authority boundaries remain invariant.

## 145. TASK-015 — Distributed Orchestration & Event Fabric — CURRENT CONSOLIDATED SCOPE

**Current ownership statement:** Optional distributed execution/event layer for multi-process, multi-machine or high-scale topologies. It MUST NOT burden single-machine or low-complexity consumers.

**Status:** `NEXT / NOT_STARTED / NOT_AUTHORIZED`

### 145.3 Orchestration & Automation additions (TASK-006-derived)

_Historical source: `## 99. TASK-015 — Distributed Orchestration & Event Fabric`_

**Status:** `PROPOSED / NOT_STARTED / NOT_AUTHORIZED`.

**Purpose:** Extend TASK-006's local deterministic orchestration into an optional distributed execution/event layer for multiple projects, workers or machines without pretending a local JSONL acknowledgement ledger is a distributed transaction coordinator.

Primary future scope:

- Versioned Event Envelope with event id, source, task/revision, project, causality/correlation id, sequence/partition key, checksum/signature metadata and idempotency key.
- Durable broker/transport abstraction supporting local queue, remote queue and offline-forwarding implementations without making any specific vendor canonical.
- At-least-once delivery with exactly-once **effect** through consumer idempotency; do not claim impossible global exactly-once delivery guarantees.
- Consumer lease/heartbeat, acknowledgement timeout, retry/backoff, dead-letter queue, replay and poison-event quarantine.
- Per-project ordering where required, causal ordering metadata, duplicate detection and bounded replay windows.
- Cross-project workflow DAG / Saga-style compensation for multi-step workflows; canonical Lifecycle transitions remain owned by TASK-004 and are never replaced by distributed coordinator state.
- Remote worker identity, capability advertisement and authorization binding; security primitives delegate to TASK-009.
- Event/queue health telemetry delegates to TASK-007 Monitoring; external connector transport delegates to TASK-008; release compatibility delegates to TASK-010; conformance fixtures delegate to TASK-011.
- Network partition, worker crash, duplicate delivery, delayed acknowledgement, split-brain/coordinator failover and replay fault-injection tests.
- Local-only mode remains supported; distributed fabric is an opt-in extension, not a prerequisite for simple projects.

**Completion image:** BAI Development OS can coordinate multiple consumers/workers with durable event semantics and recoverable cross-project workflows while retaining canonical authority boundaries and a lightweight single-machine mode.

### 145.4 Monitoring & Dashboard additions (TASK-007-derived)

_Historical source: `## 118. TASK-015 — Distributed Telemetry, Trace & High-availability additions`_

Expand Distributed Orchestration & Event Fabric with Monitoring-specific distributed operation:

- Distributed Monitoring Event transport with durable delivery, bounded retry and explicit backpressure.
- End-to-end trace/correlation propagation across project, worker, process and machine boundaries.
- Clock-skew/time-source metadata and ordering semantics so distributed latency and causality are not inferred from wall-clock timestamps alone.
- Duplicate/out-of-order event handling and idempotent aggregation.
- Collector lease/heartbeat and failover semantics; loss of a collector becomes visible rather than silently producing healthy-looking gaps.
- Partition-aware buffering and recovery after network outage, with explicit data-loss indicators when guarantees cannot be met.
- Horizontal aggregation of project health without merging canonical authority.
- Resource quotas for telemetry volume, queue depth and cardinality to prevent distributed observability from becoming an unbounded cost center.
- Distributed trace/audit replay tied to TASK-015 workflow/event identities.
- High-availability tests for worker crash, collector crash, queue outage, partial partition, clock skew and replay storms.

**Acceptance direction:** distributed monitoring extends the lightweight local TASK-007 model only when topology requires it; single-machine Consumers remain on the simpler local path.

### 145.5 External Integration additions (TASK-008-derived)

_Historical source: `## 135. TASK-015 — Distributed Integration & Event Fabric additions`_

Extend the optional Distributed Orchestration & Event Fabric with the following TASK-008-derived responsibilities:

- Distributed semantic idempotency store and deduplication for cross-process/cross-machine connector execution.
- Durable shared rate-limit/quota coordination across workers and projects, with fairness and provider-scope partitioning.
- Durable webhook ingestion queue with replay identity, ordering/causality metadata and backpressure.
- Worker leases/heartbeats for external jobs, explicit ownership transfer and abandoned-job recovery.
- At-least-once transport with exactly-once effect achieved through idempotent consumers where the provider semantics permit it.
- Distributed timeout/cancellation propagation and late-result quarantine.
- Cross-machine cost reservation ownership and reconciliation with TASK-004 Cost Guard.
- Network-partition behavior, duplicate delivery, worker crash, failover, queue backlog and replay-storm tests.
- Optional cross-region topology metadata without making multi-region deployment mandatory.

TASK-015 remains optional. Single-machine/single-project environments continue using TASK-008 local connector execution and process-local rate control until scale or topology actually requires distributed coordination.


### 145.6 Distributed security coordination additions (TASK-009-derived)

_Historical source: `BAI_Development_OS_Post_TASK009_Roadmap_Refinement_Ver1.0.md — TASK-015`_

Add the following optional distributed SecurityOS scope:

- Distributed replay/nonces with atomic check-and-record across workers and machines.
- Distributed trust-anchor/key-version propagation with explicit activation epoch and rollback rules.
- Distributed Secret lease coordination and revocation propagation.
- Signed event envelopes with worker identity, causal metadata and verification before side effects.
- Shared security-policy distribution with version pinning and rejection of stale policy workers.
- Distributed tamper-evident ledger/checkpoint strategy with deterministic duplicate handling.
- Remote worker attestation hooks and capability claims before receiving security-sensitive work.
- Cross-machine egress/rate/security quota coordination.
- Partition behavior that fails closed for security-critical operations when trust/replay/key state cannot be proven current.
- Crash/failover/key-rotation/replay-storm/partition test matrix for distributed SecurityOS.

**Acceptance direction:** when distributed topology is enabled, the security guarantees established by TASK-009 remain coherent across workers; single-machine operation remains the default and does not require this layer.



### 145.7 Distributed release coordination and staged rollout additions (TASK-010-derived)

_Historical source: `BAI_Development_OS_Post_TASK010_Roadmap_Refinement_Ver1.0.md — TASK-015`_

Extend the optional Distributed Orchestration & Event Fabric with ReleaseOS-specific coordination:

- Distributed release-operation lease/lock with explicit owner identity, lease epoch, heartbeat and fencing token so stale workers cannot continue mutating state after ownership transfer.
- Cohort/staged rollout coordinator with durable per-consumer release state, promotion gates and bounded parallelism.
- Distributed signed-manifest / Trust Anchor / key-version propagation with activation epochs and rejection of stale workers.
- Cross-machine release checkpoint and rollout journal linking each consumer's local TASK-010 transaction to the distributed rollout identity.
- Partial-rollout recovery and Saga-style compensation/global rollback orchestration without claiming impossible atomic all-machine upgrades.
- Distributed cancellation and late-worker quarantine after rollback, lease loss or policy change.
- Shared bundle/cache integrity and deduplicated acquisition with signed/checksummed content verification on every consumer.
- Cross-machine Cost Guard reservation/reconciliation for large rollout/download/migration operations where applicable.
- Partition behavior that keeps already-safe local consumers stable and blocks security/compatibility-sensitive promotion when coordinator/trust state is stale.
- Fault matrix for coordinator crash, worker crash, split rollout, stale lease, mixed key versions, partial bundle availability, partition and rollback storm.

**Acceptance direction:** distributed rollout is an opt-in layer that coordinates many TASK-010 local transactions safely; single-machine consumers retain the lightweight local ReleaseOS path.



### 145.8 Distributed and remote Conformance execution additions (TASK-011-derived)

_Historical source: `BAI_Development_OS_Post_TASK011_Roadmap_Refinement_Ver1.0.md — TASK-015`_

Extend the optional Distributed Orchestration & Event Fabric with ConformanceOS execution:

- Remote Conformance Worker identity, capability advertisement and attestation for OS, architecture, runtime, filesystem, sandbox and provider access.
- Capability-aware scheduling that sends a fixture only to workers satisfying its declared execution requirements.
- Signed run request/result envelopes with project, fixture revision, worker identity, environment fingerprint, correlation id, checksum and evidence classification.
- Worker lease/heartbeat/fencing so a stale worker cannot publish authoritative late results after ownership transfer or cancellation.
- At-least-once run dispatch with idempotent run identity and duplicate-result suppression.
- Late-result quarantine when fixture revision, policy, trust, key version or required environment changed while the run was executing.
- Secure artifact/evidence transfer with checksum/signature verification and explicit size/cost limits.
- Cross-machine fairness and quota coordination for expensive Consumer, provider and portability test matrices.
- Remote Windows/macOS/Linux workers can contribute REAL evidence only after worker attestation and Runner/Sandbox contracts verify; remote location alone does not upgrade evidence class.
- Partition, worker crash, duplicate dispatch, clock skew, stale capability advertisement, compromised worker, lost result and replay-storm fault matrices.
- External cloud/lab provisioning remains a TASK-008 governed external side effect; TASK-015 coordinates already-authorized distributed execution rather than granting access itself.

**Acceptance direction:** distributed labs can accumulate real heterogeneous platform/provider evidence while retaining the same trust/evidence rules as local TASK-011; single-machine Conformance remains first-class.


### 145.9 Distributed Maintenance, repair fencing and cross-machine recovery additions (TASK-012-derived)

_Historical source: `BAI_Development_OS_Post_TASK012_Roadmap_Refinement_Ver1.0.md — TASK-015`_

Extend the optional Distributed Orchestration & Event Fabric with MaintenanceOS coordination:

- Distributed Maintenance Worker identity, capability advertisement and attestation for adapters, repair classes, checkpoint backends and reconciliation providers.
- Distributed repair lease with owner identity, lease epoch, heartbeat and fencing token so a stale worker cannot continue a repair after ownership transfer.
- Durable globally unique Repair Execution identity and single-use semantics across machines, preserving TASK-012 replay protection under at-least-once dispatch.
- Signed fsck/finding/repair/result envelopes bound to project, plan revision, worker, policy version, environment fingerprint and correlation identity.
- Cross-machine checkpoint and quarantine coordination with explicit ownership, checksum/signature verification and protected retention state.
- Distributed revalidation immediately before mutation, including remote generation/version/ETag/lease checks where the provider supports them.
- Late-result quarantine when policy, trust, authority, artifact revision or repair ownership changed while a remote operation was in flight.
- Saga-style repair/reconciliation for multi-node state with explicit compensation; do not claim globally atomic repair when underlying systems cannot provide it.
- Partition semantics that block Canonical/Trust/Authority-sensitive repair when current lease, trust, policy or target state cannot be proven.
- Distributed external-side-effect reconciliation through authorized TASK-008 IntegrationOS adapters; ambiguous provider outcome remains RECOVERY_REQUIRED until reconciled.
- Shared maintenance cost/quota/backpressure controls so repair storms, fsck sweeps and rebuilds cannot exhaust worker or provider capacity.
- Fault matrices for coordinator crash, worker crash, duplicate dispatch, stale fencing token, partial checkpoint, split-brain, lost result, partition, reconciliation ambiguity and repair storm.
- Single-machine MaintenanceOS remains a first-class default; distributed repair is enabled only when topology actually requires it.

**Acceptance direction:** TASK-012 single-machine safety properties remain valid under remote/distributed maintenance, with fencing and evidence preventing duplicate or stale repair effects; distributed complexity is optional rather than imposed on small projects.

### 145.10 ExtensionOS distributed additions (TASK-013-derived)

_Historical source: `BAI_Development_OS_Post_TASK013_Roadmap_Refinement_Ver1.0.md — TASK-015`_

Add optional distributed ExtensionOS coordination only for topologies that require remote workers or multiple machines:

- Distributed Registry replication uses version/checksum/epoch metadata and never treats eventually replicated state as stronger authority than the canonical Registry owner.
- Remote Extension Worker identity, capability advertisement, Provider implementation checksum and trust attestation are verified before scheduling.
- Distributed capability execution carries correlation/idempotency identity, policy version, Manifest checksum, authorization binding, deadline/cancellation and resource budget.
- Lease/fencing semantics prevent stale workers from continuing capability execution after ownership transfer; late results are quarantined when policy, trust, Manifest or Provider state changed in flight.
- Shared quotas/backpressure prevent one Extension/provider/project from exhausting remote worker, provider or Cost Guard capacity.
- Remote sandbox execution preserves the same Capability Broker and external-side-effect boundary as local execution; distribution never becomes an authority bypass.
- Registry/Provider rollout supports staged propagation and rollback evidence instead of assuming globally atomic upgrade.
- Failure matrix covers coordinator crash, worker crash, duplicate dispatch, stale fencing token, partition, late result, provider mismatch, trust rotation and repair/reconciliation ambiguity.
- Single-machine ExtensionOS remains the default and must not inherit distributed coordination cost when topology does not require it.

**Acceptance direction:** TASK-015 may distribute Extension execution without weakening TASK-013/TASK-014 local safety, while small projects keep the simpler single-machine path.

## 146. Consolidated roadmap order and dependency intent

| Order | Task | Current consolidated responsibility | Status |
|---:|---|---|---|
| 1 | TASK-009 | Security, Supply Chain & Integrity Hardening | COMPLETED |
| 2 | TASK-010 | Release, Distribution & Consumer Upgrade OS | COMPLETED |
| 3 | TASK-011 | Multi-Project Conformance & Compatibility Lab | COMPLETED |
| 4 | TASK-012 | Self-Maintenance, Drift Detection & Safe Auto-Repair | COMPLETED |
| 5 | TASK-013 | Domain Adapter / Plugin SDK | NEXT / NOT_STARTED / NOT_AUTHORIZED |
| 6 | TASK-014 | Adaptive Governance Calibration & Policy Learning | PROPOSED / NOT_STARTED / NOT_AUTHORIZED |
| 7 | TASK-015 | Distributed Orchestration & Event Fabric | PROPOSED / NOT_STARTED / NOT_AUTHORIZED |

Dependency intent: TASK-009 hardens common security/integrity primitives first; TASK-010 productizes repeatable release/upgrade; TASK-011 proves portability/isolation; TASK-012 adds long-term self-maintenance; TASK-013 provides the general extension SDK; TASK-014 calibrates policy from evidence; TASK-015 adds distributed semantics only where scale/topology requires them.

## 147. Lossless-consolidation verification contract

- Every source roadmap section is hashed and recorded in `architecture/BAI_Development_OS_Roadmap_Consolidation_Audit_Ver1.0.md`.
- The audit verifies the exact source section body is represented under the corresponding TASK in Part XV.
- Future architecture promotion MUST compare the new Current Consolidated Scope against this audit before superseding Ver.2.14.
- If a future refinement intentionally removes or replaces a requirement, it MUST record the requirement, reason, replacement/migration path, authority and acceptance evidence. Silent disappearance is forbidden.

## 148. Ver.2.14 Canonical Promotion Record

- Architecture Ver.2.14 is promoted to `CURRENT_CANONICAL`.
- Architecture Ver.2.13 becomes historical baseline and remains immutable.
- Current Roadmap Authority for TASK-009〜015 is Part XV only; Parts VI/VIII/X/XII/XIV are Historical Evolution.
- TASK-008 remains `COMPLETED`.
- TASK-009 remains `NEXT / NOT_STARTED / NOT_AUTHORIZED`.

# Part XVI — TASK-009 Security, Supply Chain & Integrity Completion

## 149. Current authority after TASK-009

- Architecture Ver.2.15 is `CURRENT_CANONICAL`.
- TASK-009 — Security, Supply Chain & Integrity Hardening: `COMPLETED`.
- TASK-009 detailed canonical: `specifications/TASK-009_BAI_Development_OS_Security_Integrity_Ver1.0.md`.
- TASK-010 — Release, Distribution & Consumer Upgrade OS: `NEXT / NOT_STARTED / NOT_AUTHORIZED`.
- TASK-011〜015 remain `PROPOSED / NOT_STARTED / NOT_AUTHORIZED`.
- Part XV remains the lossless consolidated lineage and future-scope source. For TASK-009 runtime behavior, this Part XVI plus the TASK-009 Detailed Design Ver.1.0 supersede Part XV's earlier proposed-state status.

## 150. SecurityOS architecture

TASK-009 implements a shared `SecurityOS` primitive layer below the existing authoritative subsystems. It does not own Lifecycle, Knowledge, Automation, Monitoring or Integration decisions. Instead, those owners call common integrity/security primitives.

```text
TASK-004 Lifecycle / Cost
TASK-005 Knowledge
TASK-006 Automation
TASK-007 Monitoring
TASK-008 Integration
        │
        ▼
TASK-009 SecurityOS shared primitives
├─ Trusted Root / Path Safety / Atomic Write
├─ Secret Reference / Vault Lease
├─ Signing / Provenance Provider
├─ Journal / WAL / Explicit Recovery
├─ Tamper-evident Signed Ledger
├─ Durable Replay Protection
├─ Egress / SSRF / Redirect Policy
├─ DLP / Redaction / Trust
├─ Supply-chain Manifest / SBOM / Dependency Risk
└─ Sandbox / Security Conformance
```

Authority flows downward only for protection/verification. SecurityOS cannot promote Knowledge, authorize Automation, make Monitoring canonical, or create external permissions.

## 151. Cross-subsystem security integration

### 151.1 Knowledge

Knowledge mutation now journals revision file, current pointer and event-log update as one recoverable transaction. Pending PREPARED/COMMITTING journal state blocks repository verification with `KNOWLEDGE_RECOVERY_REQUIRED` until explicit recovery completes or safely rolls back a still-PREPARED transaction.

### 151.2 Automation

Owner Approval and Completion Outbox evidence can be cryptographically signed and required by policy. Derived-sync acknowledgement uses atomic persistence. Security verification does not itself grant authority.

### 151.3 Monitoring

Monitoring ledger persistence uses atomic full-ledger replacement and shared path confinement. Sensitive-material detection/redaction is shared with SecurityOS. Monitoring remains read-only derived state.

### 151.4 External Integration

Credential metadata receives recursive DLP validation; webhook verification is coupled to durable replay acceptance; connector endpoints are checked against protocol/host/DNS/private-address/redirect policy before invocation.

## 152. Security persistence contract

Crash-consistent Journal states are `PREPARED`, `COMMITTING`, `COMMITTED`, and `ROLLED_BACK`. `COMMITTING` cannot be rolled back because one or more target operations may already have become visible. Recovery must explicitly `COMPLETE`; SecurityOS never infers a canonical rollback from partial mutation.

Security Ledger uses an ordered hash chain and atomic persistence. A profile may require every row to have a valid signature. Replay protection serializes check-and-record under a lock so concurrent duplicate delivery cannot produce two accepted effects.

## 153. Supply-chain and runtime security contract

TASK-009 provides:

- checksum/signature capable artifact manifest;
- deterministic package SBOM;
- vulnerability severity policy with explicit blocking evidence;
- Ed25519 reference signing provider and a provider interface suitable for KMS/HSM-backed implementations;
- provider-neutral logical sandbox policy;
- trust classification and DLP/redaction;
- Security Schema set and `npm run check:security`.

Hardware-backed key custody, OS-native/container sandbox adapters and release ceremony/product distribution belong to later roadmap owners and are not falsely claimed by TASK-009.

## 154. Verification baseline

- TASK-009 Security suite: `64 / 64 PASS`.
- Full BAI Development OS suite: `625 / 625 PASS`.
- Pre-TASK-009 baseline behavior retained: existing `561` tests remain green within the full suite.
- JavaScript Roulette Reference Consumer: `10 / 10 PASS`.
- Product Boundary: `PASS`.
- Roadmap Consolidation: `33 / 33 PASS`.
- Security Conformance: `PASS`, Security Schemas `9 / 9`.
- Root `SecurityOS` export: `PASS`.
- Blocking Critic findings: `0`.

## 155. Residual ownership and next route

TASK-009 does not absorb later roadmap tasks:

- release/version/migration/signing ceremony -> TASK-010;
- real multi-project/provider conformance -> TASK-011;
- automatic fsck/recovery/repair/compaction -> TASK-012;
- real Vault/KMS/HSM/container/domain plugin providers -> TASK-013;
- evidence-based security-policy calibration -> TASK-014;
- distributed replay/rate/key/queue/lease coordination -> TASK-015.

The next canonical development route is TASK-010, but TASK-010 remains `NOT_STARTED / NOT_AUTHORIZED` until separately activated.

## 156. Ver.2.15 Canonical Promotion Record

- Architecture Ver.2.15 is promoted to `CURRENT_CANONICAL`.
- Architecture Ver.2.14 becomes historical baseline and remains immutable.
- TASK-009 becomes `COMPLETED`.
- TASK-010 becomes `NEXT / NOT_STARTED / NOT_AUTHORIZED`.
- The roadmap consolidation invariant remains active; accepted historical requirements are not silently deleted.


# Part XVII — Post-TASK-009 Security Roadmap Refinement

## 157. Refinement decision

TASK-009 remains `COMPLETED`. Implementation/Critic findings are assigned to existing future roadmap owners rather than reopening TASK-009 or creating TASK-016. The six TASK-009-derived source sections are recorded in `architecture/BAI_Development_OS_Post_TASK009_Roadmap_Refinement_Ver1.0.md` and are incorporated losslessly into Part XV.

## 158. Allocation summary

| Task | TASK-009-derived future ownership |
|---|---|
| TASK-010 | release signing ceremony, trust-anchor/key rotation, secure update bundles, SecurityOS schema/policy migration |
| TASK-011 | multi-project Vault/signer/trust/policy isolation and adversarial security conformance |
| TASK-012 | SecurityOS fsck, journal/ledger/replay/lease repair, compaction, quarantine and adoption audit |
| TASK-013 | production Vault/KMS/HSM/sandbox/DLP/egress/supply-chain provider SDKs |
| TASK-014 | evidence-based DLP/replay/lease/egress/supply-chain/security-friction calibration |
| TASK-015 | distributed replay/key/trust/secret/policy/ledger security coordination |

No TASK-016 is created.

## 159. Roadmap losslessness contract update

The historical roadmap source count increases from `39` to `44`: the original 33 post-TASK-004〜008 sections plus six TASK-009-derived refinement sections for TASK-010〜015 plus five TASK-010-derived refinement sections for TASK-011〜015. `npm run check:roadmap` MUST verify all 44 source bodies remain represented in the current Part XV.

## 160. Current route

- TASK-009: `COMPLETED`.
- TASK-010: `NEXT / NOT_STARTED / NOT_AUTHORIZED`.
- TASK-011〜015: `PROPOSED / NOT_STARTED / NOT_AUTHORIZED`.

## 161. Ver.2.16 Canonical Promotion Record

- Architecture Ver.2.16 is promoted to `CURRENT_CANONICAL`.
- Architecture Ver.2.15 becomes immutable historical baseline.
- Part XV remains the single consolidated roadmap authority, now including TASK-009-derived additions for TASK-010〜015.
- TASK-009 remains completed; no implementation authorization is granted to TASK-010〜015 by this refinement.


# Part XVIII — TASK-010 Release, Distribution & Consumer Upgrade Completion

## 162. Current authority after TASK-010

- Architecture Ver.2.17 is `CURRENT_CANONICAL`.
- TASK-010 — Release, Distribution & Consumer Upgrade OS: `COMPLETED`.
- TASK-010 Detailed Design Ver.1.0 is the subsystem canonical.
- TASK-011 — Multi-Project Conformance & Compatibility Lab: `NEXT / NOT_STARTED / NOT_AUTHORIZED`.
- TASK-012〜015 remain `PROPOSED / NOT_STARTED / NOT_AUTHORIZED`.

## 163. ReleaseOS architecture

ReleaseOS provides strict SemVer, signed Release Manifest, Trust Anchor lifecycle, signing ceremony, offline bundle, compatibility/migration preview, crash-consistent install/update, Owner-gated downgrade/rollback, portable subsystem bundles, component locks, canary gating, diagnostics and installation attestation. It uses TASK-009 SecurityOS for trust/path/journal primitives and TASK-008 for any actual external publication.

## 164. Trust and mutation contract

Release installation accepts only manifests signed by a trusted or valid retired key; retired keys cannot sign new releases after retirement. Every local mutation is serialized, previewed, checkpointed and journaled. Existing Security Profile requirements cannot be weakened by caller input. Downgrade and rollback require Owner Authorization reference.

## 165. Distribution and compatibility contract

Offline bundles contain only files declared by the signed manifest. Compatibility is explicit across Consumer Adapter, Node, Knowledge, Automation, Monitoring, Connector and Security schemas. Portable component bundles preserve provenance, sensitivity and schema/version metadata. Historical evidence is retained rather than rewritten.

## 166. Verification baseline

- TASK-010 Release: `91 / 91 PASS`.
- Full BAI Development OS: `716 / 716 PASS`.
- Consumer: `10 / 10 PASS`.
- Product Boundary: `PASS`.
- Roadmap: `39 / 39 PASS`.
- Security Conformance: `9 schemas PASS`.
- Release Conformance: `8 schemas PASS`.
- ReleaseOS export: `PASS`.
- Blocking Critic findings: `0`.

## 167. Residual ownership and next route

- TASK-011: multi-project/platform/provider compatibility and conformance.
- TASK-012: stale-lock detection, fsck, auto-repair and reconciliation.
- TASK-013: platform/package-manager/release provider plugins.
- TASK-014: evidence-based canary/rollback/compatibility calibration.
- TASK-015: distributed release locks, coordination and cross-machine rollout.

## 168. Ver.2.17 Canonical Promotion Record

Architecture Ver.2.17 is `CURRENT_CANONICAL`; Ver.2.16 becomes immutable historical baseline. TASK-010 is `COMPLETED`; TASK-011 is the next unstarted/unapproved route.

# Part XIX — Post-TASK-010 Roadmap Refinement

## 168. Authority and status

TASK-010 remains `COMPLETED`. This refinement does not reopen ReleaseOS implementation and does not authorize TASK-011〜015. Architecture Ver.2.18 Part XV is the single current roadmap authority. `architecture/BAI_Development_OS_Post_TASK010_Roadmap_Refinement_Ver1.0.md` is preserved as the implementation-derived historical source for the five new consolidated sections.

## 169. TASK-010-derived future ownership

| Task | TASK-010-derived future ownership |
|---|---|
| TASK-011 | cross-platform/filesystem/package-source ReleaseOS conformance, upgrade chains, trust/security-profile isolation and multi-consumer canary fixtures |
| TASK-012 | stale release-lock reclaim, interrupted release reconciliation, release fsck, attestation/trust repair, cache/checkpoint cleanup |
| TASK-013 | platform installer, package manager, artifact repository/release source, migration and attestation provider SDKs |
| TASK-014 | evidence-based canary/cohort/soak/rollback/acquisition/compatibility calibration while preserving safety floors |
| TASK-015 | optional distributed release lease, cohort rollout, trust/key propagation, partial rollout recovery and global rollback coordination |

Actual GitHub or registry publication remains an explicit authorized TASK-008 external side effect. TASK-013 provider adapters may prepare or invoke publication plans only through that boundary.

## 170. Lossless roadmap rule

The roadmap source count increases from `39` to `44`. `npm run check:roadmap` MUST verify all 44 source bodies remain represented in Part XV. Silent deletion is forbidden; intentional supersession requires reason, authority, replacement/migration path and acceptance evidence.

## 171. Canonical promotion

Architecture Ver.2.18 is `CURRENT_CANONICAL`; Ver.2.17 becomes immutable historical baseline. TASK-010 remains `COMPLETED`; TASK-011 remains `NEXT / NOT_STARTED / NOT_AUTHORIZED`; TASK-012〜015 remain `PROPOSED / NOT_STARTED / NOT_AUTHORIZED`.

# Part XX — TASK-011 Multi-Project Conformance & Compatibility Lab Completion

## 172. Current authority after TASK-011

- Architecture Ver.2.19 is `CURRENT_CANONICAL`.
- TASK-011 is `COMPLETED`.
- TASK-011 Detailed Design Ver.1.0 is the subsystem canonical.
- TASK-012 is `NEXT / NOT_STARTED / NOT_AUTHORIZED`.
- TASK-013〜015 remain `PROPOSED / NOT_STARTED / NOT_AUTHORIZED`.

## 173. ConformanceOS architecture

`ConformanceOS` is the executable compatibility/certification layer composed of Fixture, Matrix, Consumer Runner, Isolation, Fairness, Provider, Upgrade, Portability, Certification, Lab and Service modules. It verifies Consumer behavior without becoming a source of Lifecycle, Security, Release, Knowledge or external-side-effect authority.

## 174. Fixture and evidence model

Conformance evidence is explicitly classified `REAL`, `SANDBOX`, `SIMULATED`, or `DECLARED`. Results are `PASS`, `CONDITIONAL`, `FAIL`, or `NOT_APPLICABLE`. A REAL declaration alone is not execution evidence; C2+ requires a successful REAL/SANDBOX Consumer run. Simulated/declarative targets cannot be silently promoted to real portability certification.

## 175. Multi-project isolation and fairness

Isolation covers project-scoped Knowledge, Authority, Startup, Outbox, Monitoring, Credential, Idempotency, Webhook, Vault, Signer, Trust, Security Policy and Release State. Ownership probes detect cross-project attribution. Weighted fairness/noisy-neighbor probes verify shared-capacity policy without replacing TASK-004 Cost authority.

## 176. Provider, release and platform compatibility

Provider conformance verifies capability equivalence and failure semantics. Release conformance checks upgrade/downgrade direction, migration presence and Security Profile non-weakening. Portability is evaluated target by target across OS/architecture/filesystem evidence, preserving CONDITIONAL status for simulated targets.

## 177. Certification levels

Compatibility levels are `C0_UNVERIFIED`, `C1_CONTRACT`, `C2_SINGLE_PROJECT`, `C3_MULTI_PROJECT`, `C4_PORTABLE`, and `C5_ADVERSARIAL`. A required level above proven evidence yields FAIL. Certification includes scope, verified projects, result summary, limitations and checksum.

## 178. Verified baseline and portability limitation

- `javascript-roulette`: REAL Consumer contract execution PASS.
- `core-node`: REAL Core-critical synthetic Consumer execution PASS.
- Local certification: `PASS / C3_MULTI_PROJECT`.
- Current Linux target: REAL / PASS.
- Windows x64: SIMULATED / CONDITIONAL.
- macOS arm64: SIMULATED / CONDITIONAL.
- `makeTikTokGiftMaster`: DECLARED reference only; it contributes no execution proof.

TASK-011 completion does not assert unperformed Windows/macOS/provider executions.

## 179. Critic findings resolved

- REAL declaration no longer substitutes for executable evidence.
- Consumer Runner is limited to fixed contract modes and trusted/sandboxed fixtures.
- Node contract targets are realpath-confined to the Consumer root.
- Simulated platform evidence remains explicitly CONDITIONAL.
- Declared-only fixture sets cannot manufacture high certification levels.

Blocking Critic findings: `0`.

## 180. Verification baseline

| Gate | Result |
|---|---|
| TASK-011 Conformance | 101 / 101 PASS |
| Full BAI Development OS | 821 / 821 PASS |
| JavaScript Roulette Consumer | 10 / 10 PASS |
| Local Multi-Project Certification | PASS / C3_MULTI_PROJECT |
| Cross-platform Portability | CONDITIONAL |
| Product Boundary | PASS |
| Roadmap Consolidation | 44 / 44 PASS |
| Security Conformance | 9 schemas PASS |
| Release Conformance | 8 schemas PASS |
| Conformance Conformance | 10 schemas PASS |
| ConformanceOS root export | PASS |
| Blocking Critic findings | 0 |

## 181. Residual ownership and next route

- TASK-012 owns self-maintenance, drift detection, fsck, deterministic rebuild and safe auto-repair.
- TASK-013 owns plugin/provider/domain adapters, including future Conformance providers/runners.
- TASK-014 owns evidence-driven calibration of policies, thresholds, coverage and certification behavior.
- TASK-015 owns optional distributed/remote-worker Conformance execution and coordination.
- Additional real platform/provider executions become new certification evidence without reopening TASK-011 core implementation.

## 182. Ver.2.19 Canonical Promotion Record

Architecture Ver.2.19 is `CURRENT_CANONICAL`; Ver.2.18 becomes immutable historical baseline. TASK-011 is `COMPLETED`; TASK-012 is `NEXT / NOT_STARTED / NOT_AUTHORIZED`; TASK-013〜015 remain `PROPOSED / NOT_STARTED / NOT_AUTHORIZED`.


# Part XXI — Post-TASK-011 Conformance Roadmap Refinement

## 183. Authority and status

TASK-011 remains `COMPLETED`. This refinement does not reopen ConformanceOS implementation and does not authorize TASK-012〜015. Architecture Ver.2.20 Part XV remains the single current roadmap authority. `architecture/BAI_Development_OS_Post_TASK011_Roadmap_Refinement_Ver1.0.md` is the historical source for the four TASK-011-derived consolidated sections.

## 184. TASK-011-derived future ownership

| Task | TASK-011-derived future ownership |
|---|---|
| TASK-012 | Conformance fsck, stale evidence/certification drift, interrupted-run reconciliation, deterministic certification rebuild and quarantine |
| TASK-013 | Platform Probe, Consumer Runner, Sandbox, Fixture, Provider Conformance and Evidence Provider SDKs |
| TASK-014 | evidence freshness, flakiness, fairness/noisy-neighbor, coverage and certification calibration with fixed evidence floors |
| TASK-015 | optional remote/distributed Conformance workers, signed evidence, capability scheduling, lease/fencing and heterogeneous real-platform execution |

Additional real Windows/macOS/provider executions become new evidence under these extension/execution surfaces and do not reopen TASK-011 core.

## 185. Lossless roadmap rule

The accumulated roadmap source count increases from `44` to `48`. `npm run check:roadmap` MUST verify all 48 source bodies remain represented in Part XV. Silent deletion remains forbidden; intentional supersession requires reason, authority, replacement/migration path and acceptance evidence.

## 186. Current route

- TASK-011: `COMPLETED`.
- TASK-012: `NEXT / NOT_STARTED / NOT_AUTHORIZED`.
- TASK-013〜015: `PROPOSED / NOT_STARTED / NOT_AUTHORIZED`.
- No TASK-016 is created.

## 187. Ver.2.20 Canonical Promotion Record

Architecture Ver.2.20 is `CURRENT_CANONICAL`; Ver.2.19 becomes immutable historical baseline. Part XV remains the single consolidated roadmap authority, now including TASK-011-derived additions for TASK-012〜015.

# Part XXII — TASK-012 Self-Maintenance, Drift Detection & Safe Auto-Repair Completion

## 188. Current authority after TASK-012

- Architecture Ver.2.21 is `CURRENT_CANONICAL`.
- TASK-012 — Self-Maintenance, Drift Detection & Safe Auto-Repair is `COMPLETED`.
- TASK-012 Detailed Design Ver.1.0 is the subsystem canonical specification.
- TASK-013 — Domain Adapter / Plugin SDK is `NEXT / NOT_STARTED / NOT_AUTHORIZED`.
- TASK-014〜015 remain `PROPOSED / NOT_STARTED / NOT_AUTHORIZED`.
- Part XV remains the lossless roadmap lineage. This Part XXII plus TASK-012 Detailed Design Ver.1.0 govern realized MaintenanceOS behavior.

## 189. MaintenanceOS architecture

TASK-012 introduces `MaintenanceOS` as a shared maintenance runtime rather than a collection of subsystem-specific repair scripts. The common lifecycle is:

`Finding → Fsck Report → Repair Plan → Checkpoint → Execute → Verify → Rollback / Quarantine → Audit`.

MaintenanceOS owns diagnosis, repair orchestration and maintenance evidence. It does not take Lifecycle, Knowledge, Security, Release, Conformance, Monitoring, Integration or Owner authority from their source subsystems.

## 190. Finding, fsck and repair classification

- Findings are immutable/checksummed and carry adapter, code, severity, subject, artifact class, evidence and repair intent.
- Severity is `INFO / WARNING / HIGH / CRITICAL`; fsck status is `PASS / DEGRADED / BLOCKED`.
- Repair classes are `NONE / AUTO_REVERSIBLE / OWNER_REQUIRED / QUARANTINE_ONLY`.
- Authority-, Trust-, Canonical-, destructive- or external-side-effect-sensitive findings are automatically elevated away from automatic repair.
- Fsck is read-only by default; explicit audit mode may append maintenance evidence after inspection.

## 191. Safe automatic repair boundary

Automatic repair is permitted only when the operation is low-risk, reversible and does not change Canonical authority, Trust roots, authorization, Security Profile or ambiguous external state. Every automatically executable handler MUST revalidate its precondition immediately before mutation. Changed state produces a Safe Stop rather than applying a stale Repair Plan.

Owner-required repairs require an explicit `owner_authorization_ref`. A boolean flag cannot substitute for bound authorization evidence. Owner-blocked plans remain unconsumed so they may later execute under valid approval.

## 192. Durable single-use repair execution and crash semantics

Repair execution state is persisted under `.bai-os/maintenance/executions/` and created exclusively. A Repair Plan is single-use. Duplicate execution is rejected. Before each mutation the durable state records `EXECUTING_OPERATION`; normal completion records `COMPLETED`.

If a process stops with `STARTED` or `EXECUTING_OPERATION`, MaintenanceOS returns `MAINTENANCE_REPAIR_RECOVERY_REQUIRED`. It does not infer whether a domain-specific side effect happened and does not blindly replay the plan. Abandoning an incomplete execution requires Owner authorization evidence.

## 193. Checkpoint, rollback, quarantine and retention

- Maintenance checkpoints capture existing/missing state, bytes and checksums before repair.
- Verification failure triggers rollback when the handler proves rollback is available.
- Unknown or integrity-ambiguous artifacts may be moved into trusted-root quarantine rather than silently deleted or rewritten.
- Retention planning protects Canonical, Authority, audit and rollback-required evidence; only expired, unprotected derived/cache/temporary state is automatically collectible.
- Cross-format representation drift distinguishes rebuildable missing representations from semantic drift that requires Owner review.

## 194. Cross-subsystem maintenance adapters

TASK-012 connects the common Maintenance contract to existing subsystems:

- Knowledge Repository verification and interrupted mutation diagnosis.
- Monitoring ledger verification and derived-state quarantine/rebuild boundaries.
- Integration audit verification where audit/authority corruption is Owner-required.
- Security signed-ledger and Journal verification where Trust corruption is never auto-repaired.
- Release installed-state/checkpoint/attestation verification.
- Conformance Certification/evidence checksum, freshness and environment-drift verification.
- Generic manifest/JSON verifier adapters for rebuildable derived/cache artifacts versus Canonical state.

Maintenance may rebuild verified derived state but cannot promote `DECLARED`/`SIMULATED` Conformance evidence into `REAL`/`SANDBOX`.

## 195. Release stale-lock hardening

ReleaseOS local operation locks are upgraded from PID-only text to a structured lock record containing version, lock name, PID, host, random owner token and acquisition time. TASK-012 may automatically reclaim a lock only when local host identity is proven, owner token exists, the process is verified dead and the configured age condition is satisfied.

Legacy or otherwise ambiguous locks are never deleted merely because they are old. They become an ambiguous maintenance finding and are quarantined/escalated according to policy.

## 196. Security Journal recovery policy

A stale `PREPARED` Security Journal transaction may be automatically rolled back only where the Journal contract proves no target mutation occurred before transition to `COMMITTING`. An interrupted `COMMITTING` transaction is Canonical-sensitive and remains Owner-required even when deterministic completion may be technically possible. MaintenanceOS does not guess canonical transaction outcome.

## 197. Critic findings resolved

- Missing quarantine handler can no longer report false `QUARANTINED`; it fails explicitly.
- Fsck no longer mutates the inspected repository by default.
- Repair Plans are durable and single-use; replay/double execution is rejected.
- Interrupted execution no longer blindly retries; it requires explicit recovery.
- Owner gate is bound to `owner_authorization_ref`, not a boolean.
- Owner-blocked plans remain reusable after valid approval rather than being prematurely consumed.
- Automatic repair requires immediate precondition revalidation.
- Release stale-lock cleanup no longer trusts timeout/PID-only legacy state.
- Derived/cache corruption is separated from Canonical/Trust corruption.
- Conformance checksum verification uses canonical deterministic hashing.
- `COMMITTING` Journal recovery remains fail-closed instead of being auto-completed.

Blocking Critic findings: `0`.

## 198. Verification baseline

| Gate | Result |
|---|---|
| TASK-012 Maintenance | 75 / 75 PASS |
| Full BAI Development OS | 898 / 898 PASS |
| JavaScript Roulette Consumer | 10 / 10 PASS |
| Product Boundary | PASS |
| Roadmap Consolidation | 48 / 48 PASS |
| Security Conformance | 9 schemas PASS |
| Release Conformance | 8 schemas PASS |
| Conformance Conformance | 10 schemas PASS |
| Maintenance Conformance | 7 schemas / 6 shared contracts PASS |
| MaintenanceOS root export | PASS |
| Blocking Critic findings | 0 |

## 199. Accepted residual ownership

- Provider/domain-specific atomic preconditions and repair/reconciliation plugins belong TASK-013.
- Maintenance thresholds, freshness windows, retention sizing and autonomous cadence calibration belong TASK-014.
- Remote repair leases, distributed fencing, cross-machine recovery and distributed external-side-effect reconciliation belong TASK-015.
- A general handler cannot infer whether an opaque domain/external side effect occurred after a crash; unknown state remains `RECOVERY_REQUIRED` or Owner-gated until a domain-specific reconciler proves state.
- Legacy Monitoring/Integration authority-bearing corruption is diagnosed and quarantined/escalated rather than guessed repaired.

## 200. Ver.2.21 Canonical Promotion Record

Architecture Ver.2.21 is promoted to `CURRENT_CANONICAL`; Ver.2.20 becomes immutable historical baseline. TASK-012 is `COMPLETED`. TASK-013 becomes `NEXT / NOT_STARTED / NOT_AUTHORIZED`; TASK-014〜015 remain future and unauthorized. No future Task is implicitly authorized by TASK-012 completion.

# Part XXIII — Post-TASK-012 Maintenance Roadmap Refinement

## 201. Refinement decision

TASK-012 remains `COMPLETED`. MaintenanceOS implementation and Critic findings are assigned to existing future roadmap owners rather than reopening TASK-012 or creating TASK-016. The three TASK-012-derived source sections are recorded in `architecture/BAI_Development_OS_Post_TASK012_Roadmap_Refinement_Ver1.0.md` and incorporated losslessly into Part XV.

## 202. TASK-012-derived future ownership

| Task | TASK-012-derived future ownership |
|---|---|
| TASK-013 | Maintenance Adapter/atomic precondition/reconciliation/checkpoint/quarantine/retention/drift/verification provider SDKs and domain-specific proof contracts |
| TASK-014 | evidence-based maintenance threshold/freshness/cadence/retention/revalidation/repair-efficiency calibration while preserving immutable repair safety floors |
| TASK-015 | optional distributed repair leases/fencing, signed maintenance evidence, cross-machine checkpoint/quarantine/revalidation and external-side-effect reconciliation |

Opaque domain or provider side effects remain fail-closed until a specialized reconciler proves state. TASK-013 plugins cannot self-authorize external effects; TASK-014 cannot learn away mandatory safeguards; TASK-015 remains optional for single-machine deployments.

## 203. Roadmap losslessness contract update

The accumulated roadmap source count increases from `48` to `51`: the existing 48 sections plus three TASK-012-derived refinement sections for TASK-013〜015. `npm run check:roadmap` MUST verify all 51 source bodies remain represented in Part XV. Silent deletion remains forbidden; intentional supersession requires reason, authority, replacement/migration path and acceptance evidence.

## 204. Current route

- TASK-009〜012: `COMPLETED`.
- TASK-013: `NEXT / NOT_STARTED / NOT_AUTHORIZED`.
- TASK-014〜015: `PROPOSED / NOT_STARTED / NOT_AUTHORIZED`.
- No future implementation is authorized by this refinement.

## 205. Ver.2.22 Canonical Promotion Record

Architecture Ver.2.22 is promoted to `CURRENT_CANONICAL`; Ver.2.21 becomes immutable historical baseline. Part XV remains the single consolidated roadmap authority and now includes TASK-012-derived additions for TASK-013〜015.

# Part XXIV — TASK-013 Domain Adapter / Plugin SDK Completion

## 206. Completion decision

TASK-013 is `COMPLETED` under DEV-4. The realized subsystem is `ExtensionOS`: one common extension architecture for Video, Audio, BGM/SE, Streaming, Unity, Web, Desktop, Automation and provider/plugin surfaces used by Knowledge, Orchestration, Monitoring, Integration, Security, Release, Conformance and Maintenance. TASK-013 does not grant authority to extensions and does not fork Core per domain.

Current route after this completion:

- TASK-009〜013: `COMPLETED`.
- TASK-014 — Adaptive Governance Calibration & Policy Learning: `NEXT / NOT_STARTED / NOT_AUTHORIZED`.
- TASK-015 — Distributed Orchestration & Event Fabric: `PROPOSED / NOT_STARTED / NOT_AUTHORIZED`.

## 207. ExtensionOS architecture

The common path is `Manifest → discovery/install → compatibility/trust/provider verification → enable → Capability Broker → Domain Pack / Hook / Artifact Gate → Conformance`. Manifests are immutable/checksummed and declare domains, capabilities, permissions, side-effect/authorization/sandbox requirements, resource budgets, compatibility/dependencies, Trust Level and executable implementation checksum. The package exports `ExtensionOS` and `./extension`; package version is `0.8.0`.

The eight built-in reference domains are declarative contracts: `VIDEO`, `AUDIO`, `BGM_SE`, `STREAMING`, `UNITY`, `WEB`, `DESKTOP`, `AUTOMATION`. They demonstrate extension boundaries without embedding domain behavior or executable authority in Core.

## 208. Trust, provider provenance and sandbox boundary

`OFFICIAL / COMMUNITY / PROJECT_LOCAL` is classification, not proof of execution trust. `IN_PROCESS_TRUSTED` requires an independent Manifest-checksum-pinned trust grant or verifier. Executable Manifests also pin `execution_contract.implementation_checksum`; a runtime Provider must present the same checksum and every declared handler. Upgrade changes Manifest checksum and invalidates prior in-process trust.

`SANDBOXED` Extensions always execute through a Sandbox Runner. A capability declaring `sandbox_required` cannot execute in-process and fails Conformance if the Manifest execution mode contradicts that requirement. External side effects require authorization plus sandbox mediation. Provider handler maps are snapshotted into immutable wrappers so a caller cannot mutate registered execution code after validation.

## 209. Capability Broker and runtime budgets

The Broker verifies enabled state, dependency state/version, capability/operation, payload size, permissions, authorization, sandbox requirement, max concurrency and runtime timeout for every invocation. Caller cancellation and timeout propagate through `AbortSignal`. A non-cooperative timed-out Provider retains its concurrency slot until the underlying operation settles; timeout cannot be used to create unbounded concurrent work. Timeout timers remain live even when a pending Provider has no other event-loop handle.

Hard per-Extension memory isolation is not falsely claimed for trusted same-process JavaScript. `max_memory_mb` is passed to Sandbox Providers; hard memory enforcement requires an actual sandbox/runtime provider.

## 210. Lifecycle, dependency and durable Registry

Lifecycle is `discover / install / validate / enable / disable / upgrade / revoke / uninstall`. Same-version content mutation and unapproved downgrade are blocked. Dependencies support min/max version and `require_enabled`; invocation revalidates dependency state. Enabled dependents prevent dependency disable or upgrade when the declared enabled-state contract would be violated; incompatible version upgrade is also blocked; revoke disables active dependents.

Registry snapshots are sorted/checksummed and may be persisted using SecurityOS atomic trusted-path writes. Provider functions are not serialized. A previously enabled executable Extension restores conservatively as `DISABLED` until a matching Provider is reattached and explicitly re-enabled; declarative enabled state may be restored.

## 211. Domain Packs, hooks and artifact gates

Checksummed versioned `PROJECT_POLICY / TEST / EVIDENCE` Packs and Security variants bind to installed Extension/domain declarations. Mandatory policy floors cannot be omitted. Invalid Pack batches do not partially mutate the active set.

Hooks cover Knowledge, Orchestration, Monitoring, Integration, Security, Release, Conformance and Maintenance. Hook type/capability must be declared; order is deterministic; required failure stops and optional failure degrades with evidence.

Domain artifact validators, previewers and quality gates are bound to enabled Extension capabilities and execute through the Broker. Direct callback registration cannot bypass Extension policy. Preview output remains `DERIVED_NON_CANONICAL`.

## 212. Conformance and contract-assisted adapter planning

Extension Conformance verifies Manifest/compatibility, required capabilities, Pack integrity/type, Provider implementation checksum and handler completeness, sandbox proof and independent in-process trust evidence. Sandboxed execution without a real probe remains `CONDITIONAL`; self-declared trust without proof remains `CONDITIONAL`; contradictory in-process/sandbox requirements fail.

OpenAPI/MCP assistance produces only a checksummed `NON_EXECUTABLE_BUILD_TIME_PLAN` with `authority_effect=NONE`. It may draft Manifest/capability/conformance mappings but cannot auto-enable, grant permissions/authorization, publish or execute a Provider.

## 213. Critic findings resolved

- Self-declared Official status no longer grants in-process execution.
- Sandbox-required capability cannot run in-process.
- Artifact callback registration cannot bypass Capability Broker.
- Packs/Hooks are bound to installed Manifest declarations.
- Dependencies include version and enabled-state contracts and are revalidated at runtime.
- Timeout and caller cancellation reach Providers; timeout remains live and non-cooperative work retains capacity.
- Registered Provider handlers are immutable snapshots.
- In-process trust is pinned to Manifest checksum and invalidated by upgrade.
- Executable Manifest binds actual Provider implementation checksum and declared handlers.
- Upgrade cannot leave an enabled `require_enabled` dependent logically active over an inactive dependency.
- Conformance rejects tampered Packs and incomplete/mismatched Providers.
- Registry state is atomically persistable and restores executable state conservatively.

Blocking Critic findings: `0`.

## 214. Verification baseline

| Gate | Result |
|---|---|
| TASK-013 ExtensionOS | 161 / 161 PASS |
| Full BAI Development OS | 1059 / 1059 PASS |
| JavaScript Roulette Consumer | 10 / 10 PASS |
| Extension Conformance | 10 schemas / 8 domains / 12 shared contracts PASS |
| Roadmap Consolidation | 51 / 51 PASS |
| Maintenance / Conformance / Release / Security | PASS |
| Product Boundary | PASS |
| ExtensionOS root export | PASS |
| Blocking Critic findings | 0 |

## 215. Accepted residual ownership

TASK-013 completes the local, common extension SDK and boundary. Domain/vendor-specific production Provider packages are independent Extension implementations, not Core work. TASK-014 owns evidence-based calibration of plugin/provider selection, policy friction, trust/health/resource recommendations and governance depth while mandatory security/authority floors remain fixed. TASK-015 owns optional remote/distributed registry propagation, capability scheduling and distributed Extension execution/coordination. Single-machine ExtensionOS remains first-class.

## 216. Ver.2.23 Canonical Promotion Record

Architecture Ver.2.23 is promoted to `CURRENT_CANONICAL`; Ver.2.22 becomes immutable historical baseline. TASK-013 Detailed Design Ver.1.0 becomes its subsystem canonical. TASK-013 is `COMPLETED`; TASK-014 becomes `NEXT / NOT_STARTED / NOT_AUTHORIZED`; TASK-015 remains `PROPOSED / NOT_STARTED / NOT_AUTHORIZED`. No future implementation is implicitly authorized by TASK-013 completion.

# Part XXV — TASK-014 Adaptive Governance Calibration & Policy Learning Completion

## 217. Completion decision

TASK-014 is `COMPLETED` under `DEV_4_FOUNDATION_CRITICAL`. The realized subsystem is `CalibrationOS`: a recommendation-first, evidence-driven calibration layer that consumes verified operational evidence, compares policy outcomes, performs shadow/counterfactual evaluation and requires explicit Owner plus Policy authorization before any advisory policy activation.

Current route after this completion:

- TASK-004〜014: `COMPLETED`.
- TASK-015 — Distributed Orchestration & Event Fabric: `NEXT / NOT_STARTED / NOT_AUTHORIZED`.
- No TASK-016 is created by TASK-014 completion.

## 218. CalibrationOS architecture

The common path is `Evidence → Summary/Baseline/Diagnostics → Recommendation → Policy Candidate → Safety Floor Evaluation → Counterfactual Replay → Shadow Evaluation → Owner + Policy Authorization → Advisory Activation`. The package exports `CalibrationOS` and `./calibration`; package version is `0.9.0`.

CalibrationOS does not directly mutate AdaptiveDevelopmentGovernance constants, SecurityOS authority, IntegrationOS external-action gates, Release trust, Conformance evidence class, Maintenance repair authority or ExtensionOS execution trust. A `policy_applier` is an explicit integration callback executed only after the candidate checksum, safety decision, both evaluation gates and authorization references pass.

## 219. Evidence model and analytics

Calibration Evidence is checksummed, project/task/subsystem/metric scoped and classified `REAL`, `SANDBOX`, `SIMULATED` or `DECLARED`. REAL/SANDBOX are the verified evidence floor for actionable recommendations; simulated/declarative samples receive lower weight and cannot alone satisfy verified-sample requirements.

Analytics provide weighted summaries, percentiles, explicit insufficient-evidence status, robust median/MAD anomaly detection and derived SLI/SLO evaluation. Monitoring Events with numeric values can be normalized into Calibration Evidence without gaining policy authority.

## 220. Cross-subsystem calibration catalog

The baseline catalog spans Governance, Knowledge, Automation, Monitoring, Integration, Security, Release, Conformance, Maintenance and Extension. It contains bounded advisory parameters for review cycles/revalidation, Knowledge confidence/freshness, retry/context depth, alert deduplication, connector timeout/retry, security replay/lease windows, release canary/soak, Conformance freshness/coverage priority, Maintenance cadence/checkpoint retention and Extension timeout/concurrency/provider health.

Insufficient evidence produces an explicit non-recommendation. Catalog values are recommendations, not self-authorizing canonical policy.

## 221. Governance diagnostics and cost adaptation

CalibrationOS compares DEV profile outcome Evidence across token cost, lead time, defect escape, Critic findings, test failures and Owner overrides. It detects possible over-governance only as advisory evidence and detects CORE/FOUNDATION/CRITICAL under-assurance as blocking safety-floor violations. Policy oscillation detection exposes repeated A/B/A/B changes, and calibration opportunities can be ranked by verified risk reduction per cost/time.

This preserves the original cost-adaptive requirement: small reversible work may become cheaper through evidence, but safety floors are never auto-deescalated.

## 222. Immutable safety floors

Policy Candidate safety evaluation blocks weakening or bypass of Owner-required governance, external-action authorization, credential secrecy, mandatory Security/Monitoring floors, Release signing/security/compatibility floors, Conformance REAL-evidence semantics, Maintenance mutation preconditions/single-use/Owner gates and Extension Core Authority/Capability Broker requirements.

DEV minimum ranks remain fixed: CORE and MULTI_PROJECT cannot fall below DEV-3; FOUNDATION and CRITICAL cannot fall below DEV-4. `governance.model_policy` is not modified by calibration.

## 223. Shadow, counterfactual and activation gates

Every activatable candidate requires both `COUNTERFACTUAL` and `SHADOW` PASS results bound to the exact candidate checksum. Quality regression, risk increase, mandatory violation or insufficient case evidence blocks activation. Activation additionally requires non-empty `owner_authorization_ref` and `policy_authorization_ref`.

The result is an authorized advisory-policy activation record; CalibrationOS never interprets recommendation generation itself as authority.

## 224. Durable policy evidence

The local Calibration ledger is root-confined, lock-protected, hash-chained and atomically replaced. Evidence, Candidate, Evaluation and Activation records preserve order and tamper evidence. Derived snapshots expose only activated advisory values; Candidate existence alone never changes active policy.

## 225. TASK-013-derived Extension calibration

Post-TASK-013 improvements are integrated into TASK-014 rather than creating a new task. Extension/provider timeout, concurrency, provider-health, permission/authorization friction, trust/conformance freshness, failure loops, upgrade/revoke recovery and advisory routing can be calibrated from verified evidence. OFFICIAL classification never becomes execution trust; Core override, Capability Broker bypass and authorization bypass remain forbidden.

TASK-015 receives only the genuinely distributed residual: remote Registry propagation, worker attestation, fenced capability scheduling, remote quota/backpressure, late-result quarantine and staged distributed Provider rollout. Single-machine ExtensionOS remains first-class.

## 226. Verification baseline

| Gate | Result |
|---|---|
| TASK-014 CalibrationOS | 56 / 56 PASS |
| Full BAI Development OS | 1115 / 1115 PASS |
| Calibration Conformance | 6 schemas / 10 subsystems / 20 catalog parameters PASS |
| Roadmap Consolidation | 53 / 53 PASS |
| Maintenance / Conformance / Release / Security / Extension | PASS |
| Product Boundary | PASS |
| CalibrationOS root export | PASS |
| Blocking Critic findings | 0 |

Consumer and document visual-QA counts are recorded in the TASK-014 completion evidence and Registry once final document synchronization completes.

## 227. Accepted residual ownership and Ver.2.24 promotion

TASK-014 completes the local evidence-driven policy-learning and calibration boundary. Production policy-specific appliers remain bounded integrations and must preserve each subsystem's authority contract. Long-horizon learned models or vendor-specific ML are optional future implementations behind the same Candidate/Safety/Evaluation/Authorization boundary rather than a prerequisite for CalibrationOS.

TASK-015 owns optional distributed/remote orchestration, event fabric, distributed repair/release/security/monitoring/Conformance and Extension execution coordination. Architecture Ver.2.24 is promoted to `CURRENT_CANONICAL`; Ver.2.23 becomes immutable historical baseline. TASK-014 Detailed Design Ver.1.0 becomes its subsystem canonical. TASK-015 is `NEXT / NOT_STARTED / NOT_AUTHORIZED`.
