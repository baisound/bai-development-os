# AI Summary — AI-readable canonical copy generated from the adjacent DOCX.

## Document Identity

- Source: `architecture/AI_Development_OS_Architecture_Φ¿¡Φ¿êµ¢╕_Ver1.1_τ╡▒σÉêµ║ûσéÖτëê.md`
- Category: `architecture`
- SHA-256: `49c5cd5d1ba85870bed7d6776a6162397bdf4d4070df56467d98e1400887c509`
- Loading policy: **summary-first; full source for architecture review, amendments, and binding decisions**
- Authority note: This summary is a navigation aid. The source Markdown remains authoritative within its scope.

## Status and Control Values

- No explicit status field was detected.

## Purpose

This file provides an AI-oriented entry point to `AI_Development_OS_Architecture_Φ¿¡Φ¿êµ¢╕_Ver1.1_τ╡▒σÉêµ║ûσéÖτëê.md`. Load the full source only when the current assignment requires details not present here.

## Main Sections

- AI Development OS Architecture 設計書 Ver.1.1
- 第1章　エグゼクティブサマリー
- 1.1 本設計書が解決する問題
- 1.2 最終アーキテクチャの要点
- 第2章　用語定義
- 第3章　アーキテクチャ原則
- 第4章　レイヤー構成
- 4.1 全体レイヤー図
- 第5章　コンポーネントアーキテクチャ
- 第6章　正本・索引・派生物の所有関係
- 第7章　Governance Architecture
- 7.1 Governance対象
- 7.2 権限境界
- 7.3 Trust Boundary
- 第8章　Lifecycle OS Architecture（TASK-004）
- 8.1 管理次元
- 8.2 主な成果物
- 8.3 LifecycleとKnowledgeのインターフェース
- 第9章　Knowledge OS Architecture（TASK-005）
- 9.1 内部構成
- 9.2 Knowledge種類
- 9.3 強制力
- 第10章　Workspace Registry Architecture（TASK-006 Phase 1）
- 10.1 Registry構成

## Mandatory Rules and Constraints

- | 最重要原則 | 実装者・保守者・将来のAIが同じ全体像を共有し、責務の重複・正本の競合・自動化事故を防ぐ |
- AI Development OSは、複数のAI Roleと人間のOwnerが、設計・実装・検証・判断・学習を安全かつ再現可能に進めるためのOperating Systemである。単一のAgentへすべてを任せるのではなく、Workspace、Governance、Lifecycle、Knowledge、Automation、Monitoring、Integrationを分離し、各層が正本・権限・Evidence・停止条件を持つ。
- - 正本が複数存在すると、どの状態・Knowledge・仕様が現在有効か判断できない。
- - Workspace Registryが正本の場所・種類・Version・Statusを示す索引となる。
- | Canonical／正本 | 現在の正式な判断根拠となる唯一の記録。 |
- | Registry／索引 | 正本の内容ではなく、正本がどこにあり、何で、どのVersionかを示す一覧。 |
- | P-01 正本一意性 | Task Status、Knowledge、Role、Policy等は、それぞれ一つのCanonical Sourceを持つ。Registryや要約は正本にならない。 |
- | P-06 Safe Stop | 不明、競合、Evidence不足、権限不足、Budget超過時は自動進行より安全停止を優先する。 |
- | L3 Governance Layer | Authority、Policy、Vocabulary、Evidence、Artifact | 権限、語彙、正本、監査、変更管理 |
- | Component | 主責務 | 主な正本・成果物 |
- | Role Engine | Role仕様、入力、出力、禁止事項、独立性を解決 | Role Specifications |
- # 第6章　正本・索引・派生物の所有関係
- 禁止：Index、Dashboard、Prompt、要約をCanonical Sourceとして逆利用してはならない。
- - Artifact：Authoring Role、Template、必須項目、保存場所。

## Open Items / Residual Risk

- - Risk：Critical、High、Accepted、Deferred、Resolvedの区別。
- | Task Status | DRAFT / ACTIVE / PAUSED / BLOCKED / STALLED / COMPLETED / ARCHIVED | Task全体の生存状態 |
- | Gate Status | READY / PASS / FAIL / NOT_CONFIRMED | 次工程条件 |
- - PAUSED、BLOCKED、STALLED、Emergency Stopへ安全に遷移する。
- | 12 | Lifecycle OS | 次Phase、Block、Pause、Stall、Closureを判断 |
- | Mandatory Knowledge Missing | 必須Knowledge不足 | Task開始またはGateをBLOCK |
- | Model Unavailable | Model停止・Rate Limit | 許可済みFallbackまたはBLOCK |
- | Lifecycle | Active/Paused/Blocked/Stalled、Phase滞留時間、Gate失敗率 |
- | 保留 | Registryの保存形式 | TASK-006でYAML/JSON/DBを比較 |
- | 保留 | 専用Knowledge Curator / Status Manager Role | 運用量とAutomation設計後に判断 |
- | Knowledge OSはTask Statusを変えるか | 変えない。Impact Noticeを出し、Lifecycle OSがBlockやFollow-upを判断する。 |
- | BLOCKED | BLOCKED | 直前Phase保持 | BLOCKED |

## Role-specific Loading Guidance

- **Orchestrator:** Read this summary first; load the source only to resolve routing, authority, scope, or stop conditions.
- **Builder:** Load the source sections directly related to the approved implementation or design assignment.
- **Critic:** Load the source sections needed to challenge assumptions, consistency, and responsibility boundaries.
- **Judge:** Load authoritative decisions and unresolved conditions; do not rely on this summary alone for binding judgment.
- **Tester:** Load acceptance criteria, error behavior, evidence rules, and relevant matrices only.
- **Project Policy:** Load governance, policy impact, residual risks, and closure implications only.

## When Full Source Is Required

- A binding decision is being made.
- Exact schema, matrix, acceptance criterion, wording, or evidence is required.
- The summary conflicts with another artifact.
- A referenced section is missing or ambiguous.

## Source Integrity

- Source size: 61865 bytes
- Generated at: 2026-07-27T13:31:06
