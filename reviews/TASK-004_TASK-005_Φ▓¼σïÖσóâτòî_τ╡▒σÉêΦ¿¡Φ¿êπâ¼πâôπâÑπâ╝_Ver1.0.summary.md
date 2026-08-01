# AI Summary — AI-readable canonical copy generated from the adjacent DOCX.

## Document Identity

- Source: `reviews/TASK-004_TASK-005_Φ▓¼σïÖσóâτòî_τ╡▒σÉêΦ¿¡Φ¿êπâ¼πâôπâÑπâ╝_Ver1.0.md`
- Category: `review`
- SHA-256: `39acb2bd7e6170f255f02950af66d0c22dace1ce7c38e73e8823a94917b09165`
- Loading policy: **summary-first; full source only for disputed findings or binding conditions**
- Authority note: This summary is a navigation aid. The source Markdown remains authoritative within its scope.

## Status and Control Values

- No explicit status field was detected.

## Purpose

This file provides an AI-oriented entry point to `TASK-004_TASK-005_Φ▓¼σïÖσóâτòî_τ╡▒σÉêΦ¿¡Φ¿êπâ¼πâôπâÑπâ╝_Ver1.0.md`. Load the full source only when the current assignment requires details not present here.

## Main Sections

- TASK-004／TASK-005 責務境界・統合設計レビュー
- 第1章　最終責務定義
- 1.1 境界原則
- 第2章　Responsibility Matrix
- 第3章　Context ManifestとKnowledge Packの境界
- 3.1 正式処理順序
- 3.2 禁止する逆転
- 第4章　Trust Modelの境界
- 第5章　Statusの境界
- 第6章　Knowledge Candidateの所有権
- 第7章　End-to-End Sequence
- 第8章　Data Flow
- 第9章　Workspace Registry詳細位置づけ
- 9.1 Registryが管理するもの
- 9.2 Registryが管理しないもの
- 9.3 推奨実施時期
- 9.4 TASK番号案
- 第10章　統合インターフェース
- 第11章　統合失敗時の処理
- 第12章　受入基準
- 第13章　採用・却下・保留事項
- 第14章　次工程

## Mandatory Rules and Constraints

- | 総合判定 | BOUNDARY_APPROVED_WITH_REQUIRED_CLARIFICATIONS |
- - Workspace Registryは両TASKの正本を置き換えず、場所・種類・Version・Canonical参照だけを提供する。
- ## 3.2 禁止する逆転
- | 正本 | Canonical Status Record | Knowledge Asset Current Revision |
- | Task Closureへの影響 | TASK-004 | 必須Candidate引渡し未完了ならClosure Block可能 |
- 定義：Workspace全体の資産を発見するための機械可読な索引。資産内容の正本ではなく、正本への参照・種類・版・Status・Checksumを管理する。
- - Taskの正式状態そのもの：Canonical Status Recordが正本。
- - Knowledge本文・状態そのもの：Knowledge Assetが正本。
- - Role権限の詳細：Role Specificationが正本。
- - Artifact本文：各Artifactファイルが正本。
- | インターフェース | 送信元 | 送信先 | 必須内容 |
- | Knowledge Pack | TASK-005 | TASK-004 | Asset ID+Revision、Required Actions、Verification Steps、Checksum |
- | Invalid Knowledge Impact Notice | TASK-005 | TASK-004 | Asset Revision、Affected Tasks、Severity、Required Action |
- | Registry不整合 | 正本ファイルを優先しIndex再構築 | 正本参照を再通知 |

## Open Items / Residual Risk

- | Invalid Knowledge Impact Analysis | Block/Follow-upを反映 | 主責務 | 所在 |
- | 例 | ACTIVE / PAUSED / BLOCKED / COMPLETED | CANDIDATE / ACTIVE / STALE / INVALID |
- | 再開 | PAUSED/BLOCKED/STALLEDからResume | STALE再検証、DRAFT/REVIEW継続 |
- - Impact Analysisで重大影響が確認された場合、TASK-005が影響通知を出し、TASK-004が対象TaskをBLOCKEDまたはFollow-up Task化する。
- | Task Closureへの影響 | TASK-004 | 必須Candidate引渡し未完了ならClosure Block可能 |
- | Knowledge Resolution不可 | MandatoryならBLOCK、任意ならNOT_CONFIRMEDでOwner判断 | 不足・競合・権限理由を返す |
- | Invalid Knowledge通知 | 影響TaskをBLOCK/Follow-up候補 | Impact Analysis継続 |
- - Invalid Knowledge通知から対象TaskのBlockまたはFollow-upを生成できる。
- # 第13章　採用・却下・保留事項
- | 保留 | Registryの保存形式 | YAML/JSON/DBはTASK-006で選定 |
- | 保留 | Registry専用Role | Automation設計で判断 |

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

- Source size: 15684 bytes
- Generated at: 2026-07-27T13:31:06
