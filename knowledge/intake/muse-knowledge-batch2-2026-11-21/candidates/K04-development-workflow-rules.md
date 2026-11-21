---
asset_id: PILOT-K04-DEVELOPMENT-WORKFLOW-RULES
revision: 1
title: 開発ワークフローの運用ルール（引き継ぎ・Issue・検証）
knowledge_type: PROCEDURE
status: CANDIDATE
maturity: OBSERVATION
enforcement: ADVISORY
scope: バイサウンドの全開発プロジェクト（bai-development-os 配下）
applicability:
  role: [Orchestrator, Builder, Critic, Tester, Judge]
  project_tags: [workflow, governance, handoff]
source_trust: OWNER_DECLARED_WITH_EVIDENCE
sensitivity: INTERNAL
confidence: HIGH
provenance: 2026-11-21 に確認したオーナーの開発の進め方（MEMORY.md 昇格済み）。bai-development-os の既存運用（TASK-018／TASK-020 完了）と一致
evidence_refs:
  - ~/MEMORY.md「開発の進め方」（2026-11-21）
  - ~/memory/2026-11-21.md（Workflow facts promoted to MEMORY.md）
  - bai-development-os（TASK-018 Codex自律開発コントロールプレーン、TASK-020 自律ワークレーン／durable dispatch は完了済み）
freshness:
  created_at: 2026-11-21
  updated_at: 2026-11-21
  review_due: 2027-02-21
relations:
  - PILOT-K01-ROLE-MODEL-ASSIGNMENT（役割分担の原則。本書は手順側）
  - PILOT-K05-SKILLS-CENTRAL-SHARING（共通スキルの引き継ぎ基盤）
checksum: 未付与（正式取込時に canonical SHA-256 を算出する）
---

# 開発ワークフローの運用ルール

## 要旨

Claude Code と Codex をクレジット状況で行き来しても作業が止まらず、検証の質が落ちないための運用手順。共通ルールは `AGENTS.md`、作業位置の正本は `WORK_STATE.json`、依頼の記録は日本語の GitHub Issue とし、PR と結ぶ。

## 手順（Procedure）

1. **依頼は Issue に記録する**。日本語で書き、対応する PR と相互にリンクする。チャットだけに残して作業を始めない。
2. **作業位置は `WORK_STATE.json` に記録する**。担当エージェントが変わる（クレジット切れ等）ときも、引き継ぎはこのファイルと Issue を正本として行う。口頭・チャット履歴だけの引き継ぎはしない。
3. **共通ルールは `AGENTS.md`**。Claude Code／Codex のどちらが作業しても同じルールで動くよう、プロジェクト固有の約束はここに集約する。
4. **オーナー要求を最優先し、スコープを凍結する**。進行中に範囲を広げない。新しい要望は別 Issue に分ける。
5. **検証済み PR は随時 main へ統合する**。検証できていないものは「未検証」と明記し、検証済みであるかのように扱わない。

## 必須・禁止（Required / Prohibited）

- 必須： 状態を報告するときは「検証済み／未検証」を区別する。未検証の成果物を完了と表現しない。
- 必須： レーン切替（Codex ↔ Claude Code）の前後で `WORK_STATE.json` を最新にする。
- 禁止： スコープ凍結中の Issue に、別件の変更を混ぜること。
- 禁止： 安全フロア（権限・承認ゲート）を、効率化を理由に自動で下げること。

## 検証手順（Verification）

- 任意の完了済みタスクについて、Issue → PR → 検証記録 → 統合の流れが追跡できることを確認する。
- レーン切替後に、引き継いだ側が `WORK_STATE.json` のみから作業を再開できることを確認する。
