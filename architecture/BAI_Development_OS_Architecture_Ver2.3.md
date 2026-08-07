# BAI Development OS Architecture Ver.2.3 — Foundation Guard / Cost Guard / Execution Budget Integrated

## Document Control

```yaml
document:
  document_id: AI-Development-OS-Architecture
  version: "2.3"
  status: CURRENT_CANONICAL
  authority: machine_canonical_authority
  human_companion: /home/baisound/bai-development-os/architecture/BAI_Development_OS_Architecture_Ver2.3.docx
  machine_path: /home/baisound/bai-development-os/architecture/BAI_Development_OS_Architecture_Ver2.3.md
  summary_path: /home/baisound/bai-development-os/architecture/BAI_Development_OS_Architecture_Ver2.3.summary.md
  historical_baseline: BAI Development OS Architecture Ver.2.2
  baseline_commit: 3ce360ba5cef063cd046d88ce007d42c0b54a275
  coverage_evidence: /home/baisound/bai-development-os/tasks/TASK-004/phase1.6-to-1.8-completion-record.md
```

## Authority, Scope, and Preconditions

This Markdown is the machine canonical authority for this draft document set. The human DOCX is its human canonical companion; the Summary is a context-economy entrypoint and MUST NOT replace this Markdown for rules, constraints, states, or stop conditions.

Inputs are Architecture Ver.2.0, TASK-004 Ver.1.2 Attachment Integrated, the approved TASK-004 implementation evidence, and the Owner-authorized Documentation Synchronization v2 instruction. Historical baselines and Task evidence are read-only. The precondition is a successful Runtime Probe before role activation. A document inconsistency, missing input, unreadable evidence, or baseline checksum change MUST produce a Safe Stop and Owner escalation.

## Current-State Supersession Notice

The inherited Ver.2.0 and Ver.2.1 material below is preserved as historical architecture content. Part III supersedes earlier operational-root, repository-ownership, consumer-boundary, and adaptive-development statements where they conflict. Historical Evidence remains unmodified.

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

