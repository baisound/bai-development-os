# AI Summary — AI-readable canonical copy generated from the adjacent DOCX.

## Document Identity

- Source: `specifications/TASK-004_AI_Development_OS_Lifecycle_Foundation_Φ⌐│τ┤░Φ¿¡Φ¿êµ¢╕_Ver1.1_πâ¼πâôπâÑπâ╝σÅìµÿáτëê.md`
- Category: `detailed-specification`
- SHA-256: `4377a0cc87b75996a849d4bcf2d0b05b6490a7ba1353f0a1a3c864ea4220dc98`
- Loading policy: **summary-first; load required sections for implementation or test**
- Authority note: This summary is a navigation aid. The source Markdown remains authoritative within its scope.

## Status and Control Values

- No explicit status field was detected.

## Purpose

This file provides an AI-oriented entry point to `TASK-004_AI_Development_OS_Lifecycle_Foundation_Φ⌐│τ┤░Φ¿¡Φ¿êµ¢╕_Ver1.1_πâ¼πâôπâÑπâ╝σÅìµÿáτëê.md`. Load the full source only when the current assignment requires details not present here.

## Main Sections

- TASK-004 詳細設計書 Ver.1.1
- 第1章　目的・範囲・完成条件
- 1.1 対象範囲
- 1.2 対象外
- 1.3 完成条件
- 第2章　用語と直交モデル
- 第3章　全体データモデル
- 第4章　Task Lifecycle Status
- 4.1 状態不変条件
- 第5章　Current Phase
- 5.1 Phase Entry／Exit Action
- 第6章　Gate StatusとAuthorization Status
- 第7章　Canonical Status Record
- 第8章　Transition Logと原子的更新
- 8.1 Transition Log
- 8.2 更新プロトコル
- 8.3 同時更新
- 第9章　Pause・Block・Stall・Emergency Stop
- 9.1 Emergency Stop
- 第10章　Resume Checkpoint
- 10.1 Checkpoint無効化条件
- 第11章　Rollback
- 第12章　Closure Readiness
- 12.1 Closure Result

## Mandatory Rules and Constraints

- | Canonical Status Record | 現在値を示す正本Snapshot。 |
- | authorization_status | NOT_REQUIRED / PENDING / AUTHORIZED / DENIED / EXPIRED / REVOKED | 認可状態 |
- | knowledge_handoff_status | NOT_EVALUATED / NONE / CANDIDATE_PRESENT / REVIEW_REQUIRED | TASK-005への受け口 |
- | Authorization | NOT_REQUIRED | 認可不要 |
- | 項目 | 説明 | 型 | 必須 |
- | record_schema_version | Record形式の版 | string | 必須 |
- | revision | 更新競合防止用の連番 | integer | 必須 |
- | task_id | Task ID | string | 必須 |
- | project_id | Project ID | string | 必須 |
- | parent_task_id | 親Task。なければnull | string\|null | 必須 |
- | dependency_task_ids | 前提Task一覧 | array | 必須 |
- | task_status | Lifecycle Status | enum | 必須 |
- | current_phase | Current Phase | enum | 必須 |
- | gate_status | 現在Gate | enum | 必須 |

## Open Items / Residual Risk

- - Pause、Block、Stall、Resume、Rollback
- - 中断・停滞・外部Blockを区別して安全に再開できる。
- | task_status | DRAFT / ACTIVE / PAUSED / BLOCKED / STALLED / COMPLETED / CANCELLED / REJECTED / ARCHIVED | TASK全体の状態 |
- | gate_status | NOT_EVALUATED / READY / NOT_READY / PASS / FAIL / NOT_CONFIRMED / BLOCKED | 工程ゲート判定 |
- | archive_status | NOT_ELIGIBLE / REVIEW_PENDING / READY / DEFERRED / ARCHIVED | Archive判定 |
- | ACTIVE | 通常進行中 | 可 | PAUSED / BLOCKED / STALLED / COMPLETED / CANCELLED / REJECTED |
- | BLOCKED | 外部条件・権限・Evidence不足で停止 | 不可 | ACTIVE / CANCELLED |
- | STALLED | 処理は開始されたが進捗が止まった | 不可 | ACTIVE / BLOCKED / CANCELLED |
- - PAUSEDは意図的停止、BLOCKEDは解除条件待ち、STALLEDは進捗停止として区別する。
- | CLOSURE | Policy完了 | closure-readiness / closure-record | COMPLETEDまたはBlock |
- | ARCHIVE | COMPLETED | archive-readiness / archive-record | ARCHIVEDまたはDEFERRED |
- - Exit Action：Artifactの存在・Authoring Role・Result・未解決項目を確認し、Transition Proposalを作成する。

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

- Source size: 23456 bytes
- Generated at: 2026-07-27T13:31:06
