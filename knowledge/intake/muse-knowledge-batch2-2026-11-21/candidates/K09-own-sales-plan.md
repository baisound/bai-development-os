---
asset_id: PILOT-K09-OWN-SALES-PLAN
revision: 1
title: 自社販売計画の基本構造（事業資料室：月1万円の設計と需要検証優先）
knowledge_type: GOOD_PRACTICE
status: CANDIDATE
maturity: OBSERVATION
enforcement: ADVISORY
scope: 個人事業の自社製品販売（BOOTH／SUPERHIVE／Steam 等）。K03（他社事例 @kentax）とは別に、自社計画そのものを記録する
applicability:
  role: [Orchestrator]
  project_tags: [sales, booth, product, pricing]
source_trust: OWNER_DECLARED_WITH_EVIDENCE
sensitivity: INTERNAL
confidence: MEDIUM
provenance: BAISOUND-Biography「事業資料室」（business/products.md、first-products.md、sales-roadmap.md）を 2026-11-21 に確認。計画段階であり販売実績はまだない
evidence_refs:
  - リポジトリ baisound/BAISOUND-Biography（事業資料室： 商品候補40件、最初の5商品、販売ロードマップ、販路28項目、手数料・受取額の計算）
  - ~/workspace/goals/goal/files/販売候補棚卸し表.md（2026-11-21 作成： 全候補の比較と推奨）
  - PILOT-K03-KENTAX-SALES-MODEL（参照する他社モデル）
freshness:
  created_at: 2026-11-21
  updated_at: 2026-11-21
  review_due: 2027-02-21
relations:
  - PILOT-K03-KENTAX-SALES-MODEL
  - PILOT-K10-REGIONAL-IT-SUPPORT-DIRECTION（受託側の入口設計）
checksum: 未付与（正式取込時に canonical SHA-256 を算出する）
---

# 自社販売計画の基本構造

## 要旨

自社製品販売は「まず月1万円」を最初の関門とし、価格実験と需要検証を先に置く。出品・販売実績はまだ0件であり、計画と実績を混同しない。

## 計画の骨格（事業資料室の設計）

1. **最初の目標は月1万円**。内訳の目安： BOOTH で 980円の商品なら、手数料とサポート工数の控除を見込んで月18本程度の販売が必要、という水準で設計されている。
2. **価格実験は 500〜980円** の帯で行う。最初から高単価に寄せず、小粒な商品で反応を見る（価格のはしご自体は K03 の他社モデルを参照）。
3. **商品候補は構造化して持つ**。候補40件を一覧化し、「最初の5商品」を先行組として決めている。先行組のうち P01（SRT納品前チェッカー）は試作実装済みで、残りは仕様・様式の段階。
4. **販路は複数前提**。BOOTH を起点に、販路28項目、手数料と受取額の計算まで資料化済み。製品によって BOOTH／SUPERHIVE（Blender・音声系）、Steam／Microsoft Store（Windows ソフト）を使い分ける。
5. **需要検証が出品に先立つ**。現状は出品0件・販売0件で、次の一手は「作り込むこと」ではなく需要の裏付けを取ること。

## 棚卸しからの学び（2026-11-21）

- 全候補の中で、金銭を伴う需要の裏付けがあるのは、配信者に有償利用された実績のある既存ツール（TRYBAI-CRAFT）だけだった。**「売れるかもしれない」より「一度お金が動いた実績」を優先順位の根拠にする**。
- 作るソフトは同時に1つに絞り、他の推奨候補は薄く並行準備に留める（資料室の14日計画と同方針）。

## 必須・禁止（Required / Prohibited）

- 禁止： 販売実績がない段階で、計画上の数字（月1万円、18本等）を実績や見込み確実であるかのように扱うこと。これらは設計値である。
- 禁止： 需要検証を飛ばして、候補を一斉に作り込むこと。
- 必須： 価格を決めるときは、手数料控除後の受取額と、サポート工数の見込みをセットで確認する。

## 検証手順（Verification）

- 最初の出品が、需要検証の記録（誰に・何を・いくらで・どんな反応か）を伴っていることを確認する。
- 月次で、目標（月1万円）に対する実績と価格実験の結果を棚卸し表へ反映する。
