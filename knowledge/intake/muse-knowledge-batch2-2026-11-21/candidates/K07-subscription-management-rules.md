---
asset_id: PILOT-K07-SUBSCRIPTION-MANAGEMENT-RULES
revision: 1
title: サブスクリプション管理の運用ルール（月次再チェックと解約ゲート）
knowledge_type: PROCEDURE
status: CANDIDATE
maturity: OBSERVATION
enforcement: ADVISORY
scope: 個人事業の定期課金（AI／開発系 SaaS、クラウド、制作系サービス）の検出・記録・見直し
applicability:
  role: [Orchestrator]
  project_tags: [accounting, subscription, monitoring]
source_trust: OWNER_DECLARED_WITH_EVIDENCE
sensitivity: INTERNAL
confidence: HIGH
provenance: 2026-11-21 の初回サブスク監査と、オーナーの選択（月次再チェックの定期実行、解約済みサービスの扱い）
evidence_refs:
  - ~/memory/2026-11-21.md（Subscription audit results／monthly rescan scheduled の節）
  - 定期ジョブ monthly-subscription-rescan（毎月1日・午前、Asia/Tokyo。初回 2026-12-01）
  - PILOT-C01-TRIPO-CANCELLED-PAYMENT（解約済みの決済失敗を問題扱いしない判断事例）
freshness:
  created_at: 2026-11-21
  updated_at: 2026-11-21
  review_due: 2027-02-21
relations:
  - PILOT-K02-ACCOUNTING-JOURNAL-RULES（検出した課金の仕訳側ルール）
  - PILOT-K08-CARD-CASHFLOW-TRACKING（カード明細による金額確定の流れ）
  - PILOT-C01-TRIPO-CANCELLED-PAYMENT
checksum: 未付与（正式取込時に canonical SHA-256 を算出する）
---

# サブスクリプション管理の運用ルール

## 要旨

定期課金は月1回の再チェックで検出し、経理シート（サブスク管理タブ）へ記録する。検出はメール中心で限界があることを前提とし、解約は絶対に自動実行しない。

## 手順（Procedure）

1. **月次で再チェックする**。毎月1日に、両方の Gmail アカウントを走査し、新規課金・金額変更・決済失敗・解約済みサービスへの再請求を前回結果と比較して報告する。
2. **検出源は2アカウント分**。領収書・請求メールに加え、第2アカウントに届くカード利用お知らせメールも検出源に含める（外貨建てサブスクは領収書が届かず、カード明細だけが円額の根拠になる場合がある）。
3. **契約状態を先に持つ**。各サービスに「継続中／解約済み／不明」の状態を記録し、決済失敗は継続中サービスのときだけ問題として提示する（C01）。
4. **金額の確定は正本ルールに従う**。外貨建ては為替換算の推計で計上せず、カード明細の円額が確定してから仕訳する（K02／C02）。
5. **解約済みサービスは解約候補から除外し続ける**。一度オーナーが解約済みと確認したサービスは、月次チェックで再び候補に挙げない。

## 検出の限界（明示すること）

- 銀行・カード連携（Plaid 等）は未接続で、検出はメールで確認できる範囲に限られる。メールが来ない課金は拾えない。
- 報告では常に「メールで確認できた範囲」と範囲を明示し、全件検出できたかのように扱わない。

## 必須・禁止（Required / Prohibited）

- **禁止： 解約を自動で実行すること**。解約はサービスごとに、その都度、オーナーの明示承認を得てから行う。承認なしの解約・解約したという虚偽の報告はしない。
- 禁止： 決済失敗の通知だけで「未払い・要対応」と断定すること（先に契約状態を確認する）。
- 必須： 事業系の従量請求（クラウド利用料・広告費等）は、解約候補とは分けて提示する。

## 検証手順（Verification）

- 月次実行ごとに、検出件数・前回との差分・未確定項目が報告に含まれていることを確認する。
- 解約が実行された場合は、確認ページ・受付番号・確認メールのいずれかで裏付けが取れていることを確認する。
