# BAI Development OS ナレッジ蓄積機構監査

監査日: 2026-08-10

## 結論

確認できたBAI Development OS Snapshotには、TaskごとのBuilder提案、Critic指摘、Builder反論、Tester Evidence、Judge判断、失敗履歴をGitで保持する仕組みがあります。また、`registry/operational-improvements.md`へ実運用で判明した改善を登録し、採用・計画・優先度を管理しています。

ただし、「良いナレッジ」と「悪いナレッジ」を構造化データとして自動採点し、複数Projectの結果から自動昇格・失効・RollbackするKnowledge Engineは、このSnapshotでは実装済みと確認できません。現在あるのは、履歴を失わないEvidence Governanceと、人間／Roleレビューによる手動の改善Registryです。

## 存在する仕組み

| 機構 | 状態 | 根拠 |
|---|---|---|
| Task EvidenceのGit履歴保存 | 実装・運用あり | `tasks/TASK-*/`、Artifact Specification |
| Criticによる欠陥・反証記録 | 実装・運用あり | `roles/README-Critic.md`、Critic template |
| Judgeによる棄却・承認 | 実装・運用あり | Task Judge artifacts |
| 運用改善の登録 | 実装・手動運用 | `registry/operational-improvements.md` |
| 過去失敗の再発確認 | 一部Taskで運用あり | Critic artifactsのFailure Recurrence確認 |
| Canonical文書・Evidenceの改変防止 | 仕様あり | `common/Artifact-Specification.md` |
| 自動Knowledge scoring | 未確認／未実装 | 対応する実行機構・Schemaなし |
| 複数Projectでの再現性評価と昇格 | 未確認／未実装 | Knowledge Pack lifecycleなし |
| 悪い知識の自動失効・隔離 | 未確認／未実装 | 自動判定・失効機構なし |

## Video Production側との関係

BAI Video Productionでは`TASK-029 — Human Edit Learning / Federated Knowledge Evolution`として、操作を即座に正解扱いせず、仮説、対照比較、QA、人間採否、再修正率、作業時間、サンプル信頼度で評価する設計があります。しかし状態は`PROPOSED`であり、まだ動作する学習機構ではありません。

## 必要な次期OS改善

1. `Knowledge Candidate`、`Rejected Pattern`、`Knowledge Pack`のSchemaを分離する。
2. 成功／失敗を単純二値化せず、条件、反例、サンプル数、効果量、適用範囲を保持する。
3. Critic指摘、Owner修正、Undo、再発、Tester結果を候補Evidenceへ関連付ける。
4. 複数Task／Projectで再現した候補だけをReview後にCanonical Knowledgeへ昇格する。
5. Safety、Security、Rights違反は総合点で相殺できないHard Rejectにする。
6. Packを署名・Version管理し、品質低下時に以前のGit版へRollback可能にする。
7. Consumer固有データとOS共通知識を分離し、個人情報や制作内容を既定で収集しない。

## Snapshot上の注意

利用可能なOS Repositoryは`ai-team`のcommit `14d304c`で、`registry/current-state.md`の最終更新日は2026-07-31です。Private GitHub Remoteは認証なしでは最新状態を照合できませんでした。そのため、同梱ZIPは「現在この作業環境で検証できた完全Git Snapshot」であり、GitHub上の最新OSであるとは保証しません。
