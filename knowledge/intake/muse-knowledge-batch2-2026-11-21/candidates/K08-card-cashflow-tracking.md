---
asset_id: PILOT-K08-CARD-CASHFLOW-TRACKING
revision: 1
title: カード支出の追跡ルール（利用→請求確定→出金完了をメールで追う）
knowledge_type: PROCEDURE
status: CANDIDATE
maturity: OBSERVATION
enforcement: ADVISORY
scope: 楽天カードで支払う事業支出の状態追跡（引落口座は PayPay 銀行）
applicability:
  role: [Orchestrator]
  project_tags: [accounting, card, cashflow, monitoring]
source_trust: OWNER_DECLARED_WITH_EVIDENCE
sensitivity: INTERNAL
confidence: HIGH
provenance: 2026-11-21 に両 Gmail アカウントの実メールで確認した追跡可能性と、オーナーの指示（カード明細チェックの定期実行への登録）
evidence_refs:
  - ~/memory/2026-11-21.md（カード出金の追跡／card 出金 scan completed／カード明細チェックを定期実行に登録 の各節）
  - ~/MEMORY.md「カード出金の追跡」（2026-11-21 昇格済み）
  - 定期ジョブ monthly-card-statement-check（毎月28日・午前、Asia/Tokyo）
  - PILOT-C02-HIGGSFIELD-CARD-STATEMENT-AUTHORITY（カード明細が金額の正本になった判断事例）
  - PILOT-C04-RAKUTEN-QUICK-NOTICE-NO-STORE-NAME（速報版と詳細版の使い分け）
freshness:
  created_at: 2026-11-21
  updated_at: 2026-11-21
  review_due: 2027-02-21
relations:
  - PILOT-K02-ACCOUNTING-JOURNAL-RULES（仕訳側： 貸方は未払金／補助クレジットカード）
  - PILOT-K07-SUBSCRIPTION-MANAGEMENT-RULES（定期課金の検出源として共有）
checksum: 未付与（正式取込時に canonical SHA-256 を算出する）
---

# カード支出の追跡ルール

## 要旨

楽天カードの支出は、メールだけで「利用 → 請求確定 → 出金完了」まで追跡できる。カード会社への直接連携（公開 API は存在しない）や、ログイン情報の保持には頼らない。

## 追跡の流れ（各段階の正本メール）

1. **利用**： カード利用お知らせメール（詳細版）が届くアカウントで確認する。詳細版は本文に店舗名・利用日・金額を含む。速報版は金額と日付のみで店舗名を含まないため、店舗名の正本にはしない（C04）。
2. **請求確定**： 楽天カードの「お支払金額のご案内」で、その月の確定請求額と支払日を確認する。
3. **出金**： 引落口座（PayPay 銀行）から引落予定（2日前）と引落完了のメールが届くため、出金完了までメールで確認できる。
4. 経理シートの「支払い履歴」と突き合わせ、状態（利用／請求確定／出金完了）を更新する。シートへの変更は提案ベースとし、自動では書き換えない（定期ジョブの取り決め）。

## 運用

- **月次で明細チェックを実行する**（毎月28日）。両アカウントを確認し、請求確定額・引落日・引落完了の有無と、シートとの差分を報告する。
- 領収書メールが存在しない外貨建て課金は、この流れのカード明細側で円額を確定させる（C02）。
- 定期チェックの対象には、サブスク以外の事業関連のカード支出も含める（明細に現れる広告費・通信費など）。

## 必須・禁止（Required / Prohibited）

- 禁止： カード会社・銀行のログイン情報を保持して裏側で取得すること（オーナーのセキュリティ方針に反する）。
- 禁止： 速報版メールだけで店舗名や用途を断定すること。
- 注意（二重計上の防止）： 将来、弥生のスマート取引取込（カード連携）を使う場合は、役割分担を先に決める。例： カード明細の正本は弥生側、シートはサブスクと全体管理。両方を正本にしない。

## 検証手順（Verification）

- 月次チェックで、対象月の「請求確定額」と「出金完了」の両方がメールで裏付けられていることを確認する。
- シートの支払い履歴と明細の差分が、報告で説明されていることを確認する。
