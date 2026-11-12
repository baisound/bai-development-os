# BAI UX Guard v1.0.0(全プロジェクト共通の UI ガードレール)

Owner が作成(2026-11-12)。UI を新規作成・変更・レビューする作業でだけ `SKILL.md` を読む。UI に関係のない作業には適用しない。

- `SKILL.md`: 本体(情報設計 → 実装 → 出荷前ゲート PASS / FAIL / NOT TESTED、Critic 3 + Judge)。
- `chatgpt_ui_prompt.txt`: ChatGPT に UI 設計を頼むときに先に貼る文。

## 各プロジェクトでの使い方

- Consumer リポジトリには写さない。各リポジトリの `AGENTS.md` の UI ルールから、この共通ファイルを参照する1行を置く。プロジェクト固有の UI ルール(スクリーンショットの言語・幅・余白スケールなど)はそのリポジトリに残す。両方を満たす。
- Codex: 必要ならリポジトリの `.agents/skills/bai-ux-guard/SKILL.md` に置く(このファイルの写し)。
- Claude: claude.ai の「設定 → 機能 → スキル」にこのフォルダーを ZIP で登録すると、どのプロジェクトでも呼び出せる。
- スキルは指示遵守を保証しない。実際の画面確認とテストが必要。
