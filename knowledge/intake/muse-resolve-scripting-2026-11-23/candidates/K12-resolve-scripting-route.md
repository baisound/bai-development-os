---
asset_id: PILOT-K12-RESOLVE-SCRIPTING-ROUTE
revision: 1
title: DaVinci Resolve（無料版）のスクリプト自動化：失敗した経路と確立した方式
knowledge_type: TROUBLESHOOTING
status: CANDIDATE
maturity: OBSERVATION
enforcement: ADVISORY
scope: DaVinci Resolve 21（無料版）をスクリプトで自動操作する全作業（2027新春企画の編集適用で実証）
applicability:
  role: [Orchestrator, Builder, Tester]
  project_tags: [video-production, davinci-resolve, automation]
source_trust: EMPIRICAL（実機での段階的実測。正式取込時に正規の列挙値へ寄せる）
sensitivity: INTERNAL
confidence: MEDIUM
provenance: 2026-11-23 夜、PC-A（PC-BAIS）の DaVinci Resolve 21.2.0.6（無料版）実機で段階的に実測。コンソール操作はオーナーが実施し、出力はスクリーンショットで相互確認した
evidence_refs:
  - コンソールのグローバル実測結果（print(io, os, loadfile, bmd, app) → io=nil / os=table / loadfile=nil / bmd=table / app=FusionUI "Resolve on 127.0.0.1"）
  - グローバル resolve の実在確認（print(resolve, fusion, fu) → resolve = Resolve オブジェクト）
  - 読み取り指紋の照合一致：MASTER本編集3本（V02 v04／V03 v04／V04 v05）のV2アイテム数 117／153／147、マーカー 41／51／49 が 2026-11-19 の同期記録と完全一致
  - ローカル原稿：~/workspace/shinshun2027/resolve/Resolveスクリプト実行_失敗と成功_ナレッジ候補_20261123.md
freshness:
  created_at: 2026-11-23
  updated_at: 2026-11-23
  review_due: 2027-02-23
relations:
  - ブラウザ操作が効かない環境では「成果物パック＋本人の画面操作」が標準（AGENTS.md のブラウザ詰まり対策）。本件はそのデスクトップアプリ版の同型事例
checksum: 未付与（正式取込時に canonical SHA-256 を算出する）
---

# DaVinci Resolve（無料版）のスクリプト自動化：失敗した経路と確立した方式

## 要旨

DaVinci Resolve 21（無料版、PC-A）では、外部スクリプトAPIとメニュー配置スクリプトが使えない。唯一成功した自動操作の方式は、**アプリ内コンソール（Lua）＋ グローバル `resolve` ＋ `loadstring` による1行投入**である。スクリプト本文では `io` / `dofile` / `loadfile` / `require` を使わず、報告は `print()`、ファイル操作は Resolve API（ExportProject / ImportMedia / AppendToTimeline 等）で行う。

## 失敗した経路（再試行しないこと）

1. **外部スクリプト（fuscript.exe / Python API）は接続不可**
   - `bmd.scriptapp("Resolve")` が全ての文脈で nil を返す：SSHセッション、対話セッションのスケジュールタスク、プロジェクトを開いた状態、アプリ内コンソールでも nil。
   - 設定 `System.Scripting.Mode = 1`（Local）を確認したが効果なし。無料版は外部API不可（Studio専用）という仕様と整合する。
   - 教訓：Resolve の自動化戦略は版（無料／Studio）で根本が変わる。最初に版と接続可否を確認する。
2. **メニュー配置スクリプト（Fusion\Scripts\Utility）は無言で動かない**
   - ワークスペース→スクリプト に名前は表示されるが、実行しても何も起きず、エラー表示もない。
   - 原因：アプリ内 Lua 環境では `io` が nil。`io.open` から始まるスクリプトは1行目で即死し、結果ファイルも作られない。
3. **コンソール Lua の欠落グローバル**
   - nil：`io`、`dofile`、`loadfile`、`require`、`bmd.scriptapp` の戻り値。
   - ある：`os`（table）、`loadstring` / `load`（builtin function）、`bmd`（table、ただし scriptapp は nil を返す）、`app` / `fu`（FusionUI、GetProjectManager は無い）、そして **`resolve`（Resolve API のルートオブジェクト）**。
   - 教訓：自動化ルートが無言で失敗したら、同じ方法を繰り返さず、環境のグローバル実測（`print(io, os, loadfile, bmd, app)` 等）で使える手段を切り分ける。

## 確立した方式（手順）

1. Resolve の起動（遠隔）：SSH から直接起動したプロセスはセッション終了で死ぬ／デスクトップに見えない。**対話セッション向けスケジュールタスク（LogonType Interactive）から起動**するとユーザーのセッションで常駐する。
2. 状態観測：スケジュールタスク経由のスクリーンショット取得とウィンドウ操作が有効（プロジェクトマネージャーから対象プロジェクトを開くところまで実施）。
3. コンソールで段階的に実測：dofile nil → グローバル一覧 → `resolve` 発見 → `resolve:GetProjectManager():GetCurrentProject()` 成功。
4. スクリプトは `loadstring('...')()` の1行に圧縮してコンソールへ貼る。長い処理は複数チャンクに分け、グローバルテーブル（例：`MUGI`）で状態を引き継ぐ。
5. 変更系スクリプトは、最初に `ProjectManager:ExportProject` でバックアップを取り、失敗したら中断する形にする。既存トラックには触らず、新規トラックへの追加のみで変更する（非破壊）。

## 検証結果

- 読み取りスクリプトで MASTER 本編集3本の指紋（トラック別アイテム数・合計尺・マーカー数）を取得し、2026-11-19 の同期記録と完全一致を確認した（V02_MASTER v04：V2=117、V03_MASTER v04：V2=153、V04_MASTER v05：V2=147。マーカー 41／51／49）。
- 教訓：記録データ（在庫TSV等）を基に作業する前に、現行状態の指紋照合で記録の有効性を検証する。
- 生成動画の差し替え配置（本方式による変更系）は 2026-11-23 時点で実行・検証中。本候補の confidence はその完了後に見直す。

## 付随の知見

- 「メディアオフライン」に見える赤いサムネイルは、サムネイルキャッシュの表示だけの場合がある。クリックして実画像が表示されれば実ファイルは無事（2026-11-23 実例）。
- プロジェクト内の作業版タイムラインは版管理されている（MASTER v01→v03→v04→v05）。対象は必ず最新版名で特定する（部分一致検索で旧版を掴む失敗をした）。
- 2026-11-17〜19 のプロジェクト側スクリプト（io.open / dofile 使用）は、この環境のアプリ内 Lua では実行できない形式だった。成果物（TSV・QA記録）は実在するが、実行環境は別だったとみられる。再利用時は形式の読み替えが必要。
