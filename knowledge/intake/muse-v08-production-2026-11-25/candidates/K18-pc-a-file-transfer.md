---
asset_id: PILOT-K18-PC-A-FILE-TRANSFER
revision: 1
title: PC-Aへのファイル転送の実務：scpの切断とbase64チャンク方式、低速前提の計画
knowledge_type: TROUBLESHOOTING
status: CANDIDATE
maturity: OBSERVATION
enforcement: ADVISORY
scope: Muse VM から PC-A（Tailscaleプロキシ経由SSH）へのファイル受け渡し全般
applicability:
  role: [Orchestrator, Builder]
  project_tags: [infrastructure, file-transfer, windows, tailscale]
source_trust: EMPIRICAL（2026-11-24〜25の複数回の転送実測。AGENTS.mdにも記録済み）
sensitivity: INTERNAL
confidence: HIGH
provenance: 2026-11-25、V08物語区間の静止画9枚（JPEG合計3.0MB）の転送実測
evidence_refs:
  - scp はプロキシ経由ではバルク転送に耐えず切断（BlockingIOError: Resource temporarily unavailable → Broken pipe）
  - base64チャンク方式（1,900文字以下に分割、3並列、リトライ付き）は全件成功し、SHA-256照合も全件一致。ただし JPEG 3.0MB で約39分を要した
  - ダウンロード方向（PC-A側でbase64化し、約70,000文字ずつ分割取得）は比較的速く安定
freshness:
  created_at: 2026-11-25
  updated_at: 2026-11-25
  review_due: 2027-02-25
relations:
  - AGENTS.md のツール癖（PC-A転送）にも同内容を記録済み
checksum: 未付与（正式取込時に canonical SHA-256 を算出する）
---

# PC-Aへのファイル転送の実務

## 要旨

Muse VM から PC-A への転送は、Tailscaleトンネルプロキシ経由の SSH チャネルしか使えない。**scp は使えない**（大容量で切断）。確立した方式は **base64 チャンク分割送信＋PC-A側で再結合＋SHA-256 照合** で、信頼性は高いが低速である。転送量を先に削る（画像は JPEG 化、サムネイル先行）ことが計画上の前提になる。

## 実測

- アップロード：1,900〜2,000文字以下のチャンクに分割（3,000文字以上は EncodedCommand が失敗する）。ファイル単位の短いコマンドで送る（長い複数行スクリプトを1つの EncodedCommand で渡すと無言で失敗する）。チャンクには番号プレフィックスを混ぜない（連結が壊れる）。
- 速度：JPEG 合計3.0MB（約2,170チャンク、3並列）で約39分。大きな PNG のまま送ると数時間級になるため、写真系素材は高品質 JPEG に変換してから送り、PNG マスターは VM 側に保管する。
- ダウンロード：PC-A 側で base64 化し、Substring で約70,000文字ずつ取得→連結・復号・照合。アップロードより速く安定。
- 照合：総文字数の一致を確認してから復号し、SHA-256 が一致するまで完了としない。

## ルール

1. 転送前に「容量→所要時間」を見積もり、作業計画に織り込む。転送はバックグラウンドで走らせ、他の作業と並行させる。
2. 写真・スチルは JPEG（高品質）で送る。透過や正確な画素が必要なものだけ PNG のまま送る。
3. 判定目的（目視確認など）にはサムネイルを先に送る／受け取る。
4. 一時置き場（C:\Users\user\v08xfer 等）は中継専用とし、成果物の最終配置先と混同しない。最終配置は D／E ドライブのプロジェクトフォルダ。
