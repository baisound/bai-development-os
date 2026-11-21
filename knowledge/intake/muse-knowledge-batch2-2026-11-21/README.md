# intake: muse-knowledge-batch2-2026-11-21

2026-11-21 のオーナー指示（「ナレッジを全て回収して、コミットしてしまいたい」）により投入した、KnowledgeOS／CalibrationOS 候補の第2バッチ。パイロットバッチ（muse-knowledge-pilot-2026-11-21、PR #41）に続くもの。
関連 Issue: [#40](https://github.com/baisound/bai-development-os/issues/40)

## 候補（candidates/、全て CANDIDATE・未評価・未承認）

KnowledgeOS 候補（TASK-005 仕様 §5.1 の必須フィールドをフロントマターに写した Markdown 原稿）:

- K04-development-workflow-rules.md — 開発ワークフローの運用ルール（引き継ぎ・Issue・検証）（PROCEDURE）
- K05-skills-central-sharing.md — スキルの共有基盤（baisound-skills-central）の運用（GOOD_PRACTICE）
- K06-learning-is-knowledge-not-weights.md — 学習の定義：重み学習ではなく知識・ポリシー学習を既定とする（LoRA実験の教訓）（LESSON_LEARNED）
- K07-subscription-management-rules.md — サブスクリプション管理の運用ルール（月次再チェックと解約ゲート）（PROCEDURE）
- K08-card-cashflow-tracking.md — カード支出の追跡ルール（利用→請求確定→出金完了をメールで追う）（PROCEDURE）
- K09-own-sales-plan.md — 自社販売計画の基本構造（事業資料室：月1万円の設計と需要検証優先）（GOOD_PRACTICE）
- K10-regional-it-support-direction.md — 地域向けIT支援の事業方針（HP作成を入口に継続支援先になる）（ADR）
- K11-ecosystem-integration-decisions.md — エコシステム連携の決定事項（3層構造・単一の書き手・費用を増やさない置き換え）（ADR）

CalibrationOS 候補（TASK-014 の Evidence／Recommendation／Policy Candidate／Safety Floor／評価ステータスの構成）:

- C04-rakuten-quick-notice-no-store-name.md — カード利用の「速報版」メールだけで店舗名を断定しない
- C05-unconfirmed-amounts-stay-unconfirmed.md — 金額の根拠が一次情報にない収入・支出は「未確定」に分離し、合計に混ぜない

## パイロットとの重複回避

- 役割・モデル選定（K01）、経理の仕訳ルール本体（K02）、@kentax の販売モデル（K03）は本バッチでは扱わない。K09 は自社の販売計画であり K03（他社事例）と対象が異なる。
- Tripo の解約済み決済失敗（C01）、Higgsfield の金額正本（C02）、Amazon 開業準備分類（C03）は扱わない。C04 は C02 の内側の使い分け（速報版／詳細版）、C05 は収入側を含む一般原則として位置づけが異なる。

## 注意

- 本バッチの投入だけでは Knowledge Asset は ACTIVE 化されない。正式取込には別途、取込承認と Governance Decision（Calibration 候補は Counterfactual／Shadow PASS と Owner／Policy 承認）が必要。
- 個人情報（経歴・本名・自伝・健康情報・住所・アカウント識別子・個人的な資金額）は含めていない。各候補の根拠（source evidence）と除外範囲の詳細は候補原稿側の準備 README（ローカル下書き）に基づく。
