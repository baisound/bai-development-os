---
asset_id: PILOT-K01-ROLE-MODEL-ASSIGNMENT
revision: 1
title: 役割分担とモデル選定の原則（AIエコシステム）
knowledge_type: PRINCIPLE
status: CANDIDATE
maturity: OBSERVATION
enforcement: ADVISORY
scope: AIエコシステム全体（bai-development-os 配下の全プロジェクト）
applicability:
  role: [Orchestrator, Builder, Critic, Tester, Judge]
  project_tags: [ecosystem, governance]
source_trust: OWNER_DECLARED
sensitivity: INTERNAL
confidence: MEDIUM
provenance: 2026-11-21 のオーナーとの設計協議（AIエコシステム設計書 v0.1 §3）
evidence_refs:
  - AIエコシステム設計書 v0.2（~/workspace/goals/goal/files/AIエコシステム設計書.md）
  - bai-development-os README-AI.md（役割 Builder/Critic/Tester/Judge/Orchestrator の既存定義）
  - 2026-11-21 オーナー回答（PC-B = RTX 3090 搭載・Windows 11・ほぼ常時起動、Tailscale 未導入）
freshness:
  created_at: 2026-11-21
  updated_at: 2026-11-21
  review_due: 2027-02-21
relations:
  - PILOT-K02-ACCOUNTING-JOURNAL-RULES（同じ運用知識の束）
checksum: 未付与（正式取込時に canonical SHA-256 を算出する）
---

# 役割分担とモデル選定の原則

## 要旨

複数のAIエージェント（Muse／Codex／Claude Code／Gemini／ローカルLLM）を連携させる際の、役割とモデルの割り当ての原則。統治の正本は bai-development-os、調整役は Muse（むぎ）、実装の主担当は Codex、設計とCriticは Claude Code、判定は実装者と別ベンダーのモデル、大量・私的処理は PC-B のローカルLLM が担う。

## 指針（Guidance）

1. **実装者 ≠ レビュアー／判定者**。実装したモデルは自分の成果物を判定しない。レビューと Judge は別ベンダー（例： Codex実装 → Claude または Gemini がレビュー）の交差構成にする。
2. **統治は1か所**。ルール・証拠・権限の正本は bai-development-os に置き、各エージェントはその配下で動く。エージェント固有の判断で OS の安全フロアを下げない。
3. **調整役は常駐の Muse**。監視（Gmail／GitHub／CI）、日本語 Issue の下書き、WORK_STATE.json 引き継ぎの準備、報告、記憶の保持を担う。Muse 自身は原則として実装の主担当にならない。
4. **クレジットで主レーンを切り替えても作業を止めない**。Codex と Claude Code の行き来は WORK_STATE.json と Issue を正本として行い、引き継ぎ漏れを防ぐ。
5. **機密・個人情報を含む処理はローカルLLM（PC-B）を優先**する。外部APIに渡す前に、ローカルで処理できないか検討する。
6. **コスト配分**。最上位クラスのモデルは設計・判定など判断が重い工程に限定し、CIログの一次仕分け・要約・タグ付けなどの大量処理はローカルLLMや低コストモデルに寄せる。
7. **Gemini 4 Neon は第3レーン／交差レビュー候補**。当面は Google Antigravity 経由（Google AI Pro 加入で利用可）とし、API 直結は Google Cloud 請求アカウントの復旧後に再判断する。

## 必須・禁止（Required / Prohibited）

- 必須： 担当の割り当てを変えるときは、本 Asset の改訂か新しい ADR で理由を残す。
- 禁止： 単一モデルの自己完結（実装→自己レビュー→自己判定で統合まで進めること）。
- 禁止： コスト削減を理由に Critic／Judge の工程を省略すること。

## 検証手順（Verification）

- パイロット（KOTOLVI CI失敗ハンドリング）で、少なくとも1件のPRが「実装者≠レビュアー」の構成で最後まで流れることを確認する。
- レーン切替（Codex ↔ Claude Code）が WORK_STATE.json のみで再開できることを確認する。

## 実行環境の確定事項（2026-11-21 オーナー確認）

- PC-B： RTX 3090 搭載、Windows 11、ほぼ常時起動。ローカルLLM／ComfyUI／Whisper／GPT-SoVITS の実行基盤であり、夜間バッチも実施可能。
- PC-B のローカルLLM実行環境（Ollama／llama.cpp／LM Studio）と導入済みモデルは未確認（オーナーも即答できず、後日確認）。
- Tailscale は未導入。PC間・Muse VM との接続が必要になった時点で導入を判断する。
