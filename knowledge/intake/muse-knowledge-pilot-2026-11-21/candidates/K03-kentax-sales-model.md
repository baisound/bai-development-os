---
asset_id: PILOT-K03-KENTAX-SALES-MODEL
revision: 1
title: @kentax の販売モデルと価格ラダー（販売戦略の参考事例）
knowledge_type: SUCCESS_CASE
status: CANDIDATE
maturity: OBSERVATION
enforcement: ADVISORY
scope: バイサウンドのデジタル商品販売（BOOTH／SUPERHIVE 等）の戦略検討
applicability:
  role: [Orchestrator]
  project_tags: [sales, booth, vtuber-tools, pricing]
source_trust: PUBLIC_SOURCE_VERIFIED
sensitivity: INTERNAL
confidence: MEDIUM
provenance: 2026-11-21 の公開情報調査（BOOTH ショップ、公式サイト、FANBOX で確認。X 本体は 403 のため未検証）
evidence_refs:
  - https://kentax.booth.pm/
  - https://store.kentax.net/
  - https://kentax-design.fanbox.cc/
  - https://kentax.net/
freshness:
  created_at: 2026-11-21
  updated_at: 2026-11-21
  review_due: 2027-02-21
relations:
  - BAISOUND-Biography business/ の商品候補40件・販売ロードマップ（自社側の正本）
checksum: 未付与（正式取込時に canonical SHA-256 を算出する）
---

# @kentax の販売モデルと価格ラダー

## 要旨

オーナーが販売戦略の参考にしている @kentax（デザイナー／トラックメイカー）の、公開情報で確認できた販売モデル。Blender アドオンや VST の販売者ではなく、VTuber・配信者向けの小さな Windows アプリと素材を BOOTH で売るモデルである点に注意（オーナーの商品領域とは異なるが、価格設計と導線は転用可能）。

## 価格ラダー（確認できた範囲）

| 段 | 内容 | 価格 |
|---|---|---|
| 入口 | 無料ツール | ¥0 |
| 小粒ツール | 配信者向け小アプリ・素材（例： コメントパイロット） | ¥500〜1,500 |
| 主力 | 「ENJOY VTUBER APP」本体 | ¥5,000 |
| 拡張 | プラグインパック全部入り（単体） | ¥4,000 |
| セット | 本体＋全部入り | ¥9,000 |
| バンドル | 感謝セール「KD2025」 | ¥20,000 |
| 継続支援 | FANBOX（内容同一、支援額のみ差） | ¥200／500／1,000（月額） |

## 導線と運用

- 導線： X で告知 → 自社ポータル（store.kentax.net）で使い方・マニュアル → BOOTH で購入。
- リリース頻度： 2026年8〜11月は小粒ツールを月数本ペースで連続リリース。
- 購入の締切を作る工夫： リリース時セール、価格改定前の感謝セールを期間限定で実施。
- SUPERHIVE／Gumroad での販売は確認できなかった（販路は BOOTH 中心）。

## バイサウンドへの転用ポイント（検討用）

1. 無料または低価格の入口商品で認知を作り、小粒商品（¥500〜1,500）を階段の主段にする。
2. 主力商品には後から買える拡張（プラグインパック型）を用意し、セット価格で単価を上げる。
3. 使い方の置き場（自社ポータル）と販売の置き場（BOOTH）を分ける。
4. 自社側の数字の正本は BAISOUND-Biography の事業資料室（最初の目標： 月1万円＝¥980商品で月18本程度、価格実験 ¥500〜980）。本 Asset はあくまで他社事例であり、自社の実績ではない。

## 注意

- X（@kentax）本体は HTTP 403 で直接確認できていない。フォロワー数など検索スニペット由来の情報は未検証として扱う。
- 価格・商品構成は 2026-11-21 時点のもの。使う前に再確認する（freshness の review_due 参照）。
