---
asset_id: PILOT-K05-SKILLS-CENTRAL-SHARING
revision: 1
title: スキルの共有基盤（baisound-skills-central）の運用
knowledge_type: GOOD_PRACTICE
status: CANDIDATE
maturity: OBSERVATION
enforcement: ADVISORY
scope: Codex／Claude Code 共通スキルの管理（PC-A／PC-B 間共有を含む）
applicability:
  role: [Orchestrator, Builder]
  project_tags: [skills, tooling, sync]
source_trust: OWNER_DECLARED_WITH_EVIDENCE
sensitivity: INTERNAL
confidence: HIGH
provenance: 2026-11-21 に GitHub コネクタ経由で baisound/baisound-skills-central の実物を確認
evidence_refs:
  - ~/memory/2026-11-21.md（self-introduction illustrations の節： skills-central の構造確認結果）
  - リポジトリ baisound/baisound-skills-central（main/skills/<name>/ が編集の正本）
freshness:
  created_at: 2026-11-21
  updated_at: 2026-11-21
  review_due: 2027-02-21
relations:
  - PILOT-K04-DEVELOPMENT-WORKFLOW-RULES（開発ワークフローの一部）
  - PILOT-K01-ROLE-MODEL-ASSIGNMENT（スキルは各エージェントの道具層）
checksum: 未付与（正式取込時に canonical SHA-256 を算出する）
---

# スキルの共有基盤（baisound-skills-central）の運用

## 要旨

自作スキルは `baisound/baisound-skills-central` を正本として一元管理し、Codex と Claude Code の両方から使う。導入済みスキルは60件（2026-11-17 の統合で 9件→4件に整理。当初登録は65件）。分野は DaVinci Resolve 映像、Higgsfield、Blender／MMD、Suno 音楽、VST3 診断、YouTube 公開、フロントエンド／Web デザイン、自作画像生成など、制作と開発の両域にまたがる。

## 指針（Guidance）

1. **編集は正本でのみ行う**。`main/skills/<name>/` を編集し、各 PC ではディレクトリジャンクションでリンクして使う。リンク先で直接編集して正本と乖離させない。
2. **同期は fast-forward のみ**。`sync.py` は未コミット変更・想定外の origin・main 以外を検出すると停止する。この停止は異常ではなく安全動作として扱い、無理に進めない。
3. **スキルは出口に紐づけて増やす**。KEITO 型の構成を既存資産で置き換える方針（K11 参照）では、まず出口（BOOTH 商品、映像パイプライン等）に直結する 10〜15 件を台帳化し、数を目的に増やさない。
4. Windows では任意で5分間隔の自動同期が使えるが、正本側の変更が落ち着いてから有効化する。

## 必須・禁止（Required / Prohibited）

- 禁止： 同期停止（未コミット変更等）を、変更を破棄してまで強制的に解消すること。まず変更の所在を確認する。
- 禁止： 同じスキルを PC ごとに別々に育てること（分岐した重複スキルの発生防止）。

## 検証手順（Verification）

- 新規スキル追加時に、正本への登録と両エージェントからの参照可否を確認する。
- 同期停止が発生したとき、停止理由（未コミット／origin／ブランチ）が記録から説明できることを確認する。
