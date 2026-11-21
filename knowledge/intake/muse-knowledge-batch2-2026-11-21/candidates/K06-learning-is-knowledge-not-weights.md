---
asset_id: PILOT-K06-LEARNING-IS-KNOWLEDGE-NOT-WEIGHTS
revision: 1
title: 学習の定義：重み学習ではなく知識・ポリシー学習を既定とする（LoRA実験の教訓）
knowledge_type: LESSON_LEARNED
status: CANDIDATE
maturity: OBSERVATION
enforcement: ADVISORY
scope: ローカルLLMの継続学習実験と、AIエコシステム全体の「学習・強化」の設計
applicability:
  role: [Orchestrator, Judge]
  project_tags: [local-llm, learning, evaluation, evidence]
source_trust: OWNER_DECLARED_WITH_EVIDENCE
sensitivity: INTERNAL
confidence: HIGH
provenance: プライベートリポジトリ bai-local-dev-ai の実験記録（2026-11-08 の結果ファイルを含む）を 2026-11-21 に確認
evidence_refs:
  - リポジトリ baisound/bai-local-dev-ai（README、pc-a-learning-result-ja.txt 2026-11-08）
  - ~/memory/2026-11-21.md（Private repo contents reviewed の節）
freshness:
  created_at: 2026-11-21
  updated_at: 2026-11-21
  review_due: 2027-02-21
relations:
  - PILOT-K01-ROLE-MODEL-ASSIGNMENT（ローカルLLMの役割： 大量・私的処理）
checksum: 未付与（正式取込時に canonical SHA-256 を算出する）
---

# 学習の定義：重み学習ではなく知識・ポリシー学習を既定とする

## 要旨

ローカルLLMの LoRA 継続学習は、同条件の held-out 比較で能力向上が確認できなかった。この結果を受け、「学習・強化」の既定路線はモデルの重み学習ではなく、KnowledgeOS／CalibrationOS による知識・ポリシーの蓄積と承認フローに置く。

## 実験の記録（何をしたか）

- 対象： Devstral Small 2507。PC-A の実コード1件で LoRA 学習（RTX 3090、llama.cpp 変換）。
- 評価： 学習前後で同条件の held-out 比較を実施。結果は両群とも「正解5・不合格1・未対応2」で同一。
- 結論（記録どおり）： **能力向上は確認できなかった**。アダプターは実験扱いのまま未昇格。災害復旧 bundle と SHA256SUMS を添えて保管。

## 教訓（Lessons）

1. **能力向上の主張には、同条件の held-out 比較が必須**。学習したという事実だけでは「強くなった」と言わない。比較で差が出なければ、結果は「向上なし」と正直に記録する。
2. **少量データの重み学習は、既定の強化手段にしない**。1件規模の学習で汎化を期待しない。再挑戦する場合は、データ量・評価設計を先に変える。
3. **学習の主経路は知識・ポリシー側に置く**。判断事例と運用知識を証拠つきで蓄積し、候補 → 反証 → Shadow → オーナー承認の流れで取り込む（CalibrationOS の契約）。これなら効果を1件ずつ検証でき、巻き戻しもできる。
4. **実験資産は未昇格のまま区別して保管する**。アダプター等の実験成果物は、本番系と混ぜず、検証情報（チェックサム・復旧手段）とセットで残す。

## 必須・禁止（Required / Prohibited）

- 禁止： held-out 比較なしに「学習で能力が上がった」と報告すること。
- 禁止： 未検証のアダプターを本番の推論系へ昇格させること。

## 検証手順（Verification）

- 将来の学習実験では、着手前に評価セットと合格基準を固定し、結果が同一だった場合の記録方法（向上なしとして残す）まで含めて計画に書く。
