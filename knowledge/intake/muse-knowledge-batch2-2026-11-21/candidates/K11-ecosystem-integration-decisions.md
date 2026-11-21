---
asset_id: PILOT-K11-ECOSYSTEM-INTEGRATION-DECISIONS
revision: 1
title: エコシステム連携の決定事項（3層構造・単一の書き手・費用を増やさない置き換え）
knowledge_type: ADR
status: CANDIDATE
maturity: OBSERVATION
enforcement: ADVISORY
scope: Muse／Claude Code／Codex／Gemini／ローカルLLM／外部サービスを束ねる全体連携の設計判断
applicability:
  role: [Orchestrator, Builder, Critic, Judge]
  project_tags: [ecosystem, architecture, integration]
source_trust: OWNER_DECLARED_WITH_EVIDENCE
sensitivity: INTERNAL
confidence: MEDIUM
provenance: 2026-11-21 の設計協議（AIエコシステム設計書、KEITO 構成の置き換え提案、Dots 連携の検討）。一部はアシスタント提案で、オーナーの明示承認がない項目は本文にその旨を記す
evidence_refs:
  - ~/workspace/goals/goal/files/AIエコシステム設計書.md（3層構成と制御フロー。Issue #40 として bai-development-os に起票済み）
  - ~/memory/2026-11-21.md（KEITO AI ecosystem diagram／Dots clarification／dashboard prototype の各節）
  - PILOT-K01-ROLE-MODEL-ASSIGNMENT（役割とモデルの原則。本書は連携構造の決定）
freshness:
  created_at: 2026-11-21
  updated_at: 2026-11-21
  review_due: 2027-02-21
relations:
  - PILOT-K01-ROLE-MODEL-ASSIGNMENT
  - PILOT-K04-DEVELOPMENT-WORKFLOW-RULES
  - PILOT-K05-SKILLS-CENTRAL-SHARING
checksum: 未付与（正式取込時に canonical SHA-256 を算出する）
---

# エコシステム連携の決定事項

## 決定1： 正本／自動連携／表示の3層に分ける

- **正本層**： お金は経理シートと弥生、開発は GitHub と bai-development-os、予定は Google カレンダー、文書は Google Drive。各領域の正本は1つに定める。
- **自動連携層**： Muse（むぎ）が唯一の調整役として、定期走査（毎朝のメール要約、月次のサブスク再チェック、月次のカード明細チェック等）で正本を更新・照合し、異常があるときだけ通知する。
- **表示層**： ダッシュボード等の Space は正本の読み取り専用ビューとする。表示層にデータを溜め込んで第二の正本にしない。

## 決定2： 同じ台帳への「書き手」は1つに限る

- 外部の常駐エージェント（例： ChatGPT の Dots）を使う場合も、経理シートや正本への書き込みは Muse 側だけが行い、他方は読み取り・調査専用にする。
- 理由： 確認プロンプトなしに削除・送信等が実行され得る製品仕様や、承認待ちが別画面で静かに滞留する運用リスクが確認されたため。書き手が2つになると、仕訳の重複や上書きの切り分けができなくなる。

## 決定3： KEITO 型の構成は「費用を増やさず既存資産で置き換える」

- 参考事例（KEITO のAIエコシステム： 司令塔、ハーネス、スキル群、外部API、公開基盤、Bot 群）は、そのまま再現しない。お金の問題で同じ構成は取れない、というオーナーの前提に従う。
- 置き換えの対応： ハーネス（判断・権限・安全）は既存の BAI Development OS が担う。生成系の都度課金 API は、PC-B の生成基盤（ComfyUI、音声モデル、ローカル Whisper／LLM）と、支払い済みサブスクリプションの枠で置き換える。常駐先はクラウド常駐の Muse が担う。出口は GitHub Pages、BOOTH、YouTube、X 等の既存の場を使う。
- **収益が発生するまでは、新規の有料 API を足さない**ことを原則とする。

## 決定4： Gemini 4 Neon は Antigravity 経由の第3レーンとする

- Gemini 4 Neon（Google、2026-11-18 発表）は、加入済みの Google AI Pro の範囲で Google Antigravity／Gemini アプリから使い、交差レビュー等の第3レーン候補とする（役割の原則は K01）。
- API 直結ルートは後回しにする。理由： Google Cloud の請求アカウントが未払いで停止した経緯があり（2026-11-10 時点）、復旧と費用対効果の判断が先。アプリ／Antigravity 経由はこの影響を受けない。

## 決定5： 入口は Muse に統一する

- リモート（外出先・スマホ）からの依頼・確認は Muse を入口とし、Issue 化 → PC 側レーンへの投入 → 結果報告の流れに乗せる。PC 間と Muse の接続手段（Tailscale 等）は、必要になった時点で導入を判断する（現状は未導入）。

## 必須・禁止（Required / Prohibited）

- 禁止： 表示層（ダッシュボード等）を正本として編集し、正本側と二重管理にすること。
- 禁止： 検証なしに他エージェントへ正本の書き込み権限を広げること。
- 必須： 新しい外部サービスを連携に加えるときは、正本層のどこに位置づくか（正本／連携／表示）を先に決める。

## 検証手順（Verification）

- パイロット（KOTOLVI CI失敗ハンドリング）で、入口 → Issue → 実行 → 報告の流れと、正本の一元性が保たれることを確認する。
- 定期ジョブの実行結果が、正本（シート／リポジトリ）と矛盾しないことを月次で確認する。
