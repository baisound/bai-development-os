# Artifact Specification

## Purpose

Define shared artifact structure and authorship rules.

## Canonical artifact requirements

Every canonical artifact MUST include:

- title,
- Authoring Role,
- Active Project,
- Active Task,
- phase,
- objective,
- evidence reviewed,
- commands or procedures when applicable,
- findings, decisions, or performed work,
- Result,
- unresolved items,
- known limitations when applicable,
- handoff information when applicable.

## Authorship

Only the Role assigned to an artifact may author or modify it unless an explicit migration or recovery procedure says otherwise.

## Historical artifact immutability

Completed historical artifacts MUST NOT be edited.

New interpretation belongs in:

- clarification artifact,
- policy review,
- canonical status record,
- closure record,
- archive record,
- follow-up task.

## File scope

A Role MUST modify only the file list explicitly authorized for the active phase.

## Builder output exclusivity

For an implementation round, Builder normally creates one of:

- `implementation-report.md` when Builder responsibility is completed,
- `implementation-handoff.md` when work is preserved but independent continuation or validation is required.

A fix round may additionally create `implementation-fix-report.md`.

## Policy artifacts

Project Policy Agent creates:

- `project-policy-review.md`,
- authorized policy updates,
- verification record or verification section,
- closure/archive recommendations where applicable.

## Status artifacts

Task Lifecycle status, Project Status, and Knowledge Asset Status MUST be stored separately unless an approved specification explicitly combines references without combining authority.

## Canonical Document Reading Rules

### Purpose

AI Development OSでは、Canonical Input Documents（Architecture、Specifications、Reviews等）にDOCX形式が含まれる場合があります。

Roleは、Canonical Documentを未読のまま推測で作業を開始してはなりません。

---

### Reading Strategy

Roleは以下の優先順位で文書を読み込みます。

1. Markdown (`.md`)
2. Plain Text (`.txt`)
3. DOCX (`.docx`)

利用可能な最初の形式を使用してください。

---

### DOCX Reading Rule

MarkdownまたはTextが存在しない場合のみ、DOCXを読み込みます。

DOCXの本文抽出には、次のコマンドのみ使用してください。

```bash
python3 -c "import zipfile, xml.etree.ElementTree as E; ns='{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'; p='<DOCX_PATH>'; print('\n'.join(''.join(t.text or '' for t in para.iter(ns+'t')) for para in E.fromstring(zipfile.ZipFile(p).read('word/document.xml')).iter(ns+'p')))"
```

`<DOCX_PATH>`を対象ファイルへ置き換えて実行してください。

Roleは独自の読込方法を考案・探索してはいけません。

---

### Verification

抽出後は最低限、以下を確認してください。

- 文書タイトル
- Version
- 主要章
- Scope
- Out of Scope
- 必要な設計内容

---

### Reader Restrictions

Roleは以下を行ってはいけません。

- 独自の読込方式の探索
- Windows／WSL／UNC等を切り替えながら試行錯誤すること
- 一時コピーを繰り返すこと
- OSで定義されていない読込方法を利用すること

定義済みのReading Strategyのみ利用してください。

---

### Stop Conditions

以下の場合は推測で続行してはいけません。

- DOCX抽出失敗
- 抽出結果が空
- 文書途中で切れている
- Versionが確認できない
- Scopeを確認できない

この場合はOrchestratorへ報告し、安全停止してください。

---

### Scope

本ルールは以下すべてのRoleへ適用されます。

- Orchestrator
- Builder
- Critic
- Judge
- Tester
- Project Policy

Workflowは本仕様に従ってCanonical Documentを読み込むものとします。