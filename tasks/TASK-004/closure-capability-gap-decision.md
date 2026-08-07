# TASK-004 — Closure Capability Gap Decision

## 1. Document Control

- Authoring Role: Lifecycle Closure Architect
- Active Project / Task: `/home/baisound/projects/javascript-roulette` / `TASK-004`
- Scope: Placement and minimum design boundary only
- Runtime Interface: `INLINE_CHAT_LINUX`
- Allowed persistent output: this file only
- Result: `CLOSURE_CAPABILITY_DECISION_READY_WITH_CONDITIONS`

## 2. Executive Summary

推奨は Option A: **TASK-004 Phase 5 として Closure Capability を実装する**ことである。ただし Phase 5 を次の二段階へ分ける。

- Phase 5A — Completion Transition MVP: Closure Readiness、`ACTIVE → COMPLETED`、Completion Record、派生ビュー更新要求まで。
- Phase 5B — Archive / Historical Migration: Archive Readiness、Archive Record、destination / manifest / retention / rollback / post-archive VERIFY、TASK-003 migration。

Closure の状態規則、Canonical Status、Completion transition、Safe Stop は TASK-004 の責務である。TASK-006 は将来、承認済み Closure を自動化・発見・routing できるが、Closure rule や完了を決定しない。

## 3. Current Completion State

- Phase 1 implementation: `IMPLEMENTATION_APPROVED`
- Independent regression: `88 PASS / 0 FAIL`
- Independent probes: `23 / 23 PASS`
- Phase 1 implementation Critical / High: `0 / 0`
- TASK-004 overall completion: `NOT_READY`
- Current tracked status JSON: prototype fixture。実運用の Task Status Record ではない。
- Archive: `NOT_READY`

Phase 1 が承認済みであることは、TASK-004 全体の `task_status=COMPLETED` を意味しない。

## 4. Phase 1 Boundary

Phase 1 は状態モデル、Canonical Status Record、append-only Transition Log、revision / expected revision、lease、atomic transition、VERIFY-before-COMMIT、invalid-transition rejection を実装した。

Parent Final Plan は次を明示的に除外する。

- `ACTIVE → COMPLETED`
- `COMPLETED → ARCHIVED`
- Archive 業務遷移
- Registry connection / registry event / registry write
- Phase 2–6

現在の `validateTransition()` は `COMPLETED` と `ARCHIVED` の task status 変更を `UNDEFINED_TRANSITION: later phase task status operation` として拒否する。これは欠陥ではなく、Phase 5 を Phase 1 へ混入させないための意図的な境界である。

Prototype fixture は、使い捨て test state として初期状態・検証・復旧を試験するためのものである。実運用の Closure state へ書換えてはならない。

## 5. Closure Capability Gap

Lifecycle Ver.1.3 は Closure phase で Closure Readiness / Closure Record を作り、`COMPLETED` に到達することを定義する。一方、Phase 1 はそのための耐久性・競合制御 primitive のみを提供し、以下を未実装である。

- Closure Request と Completion authorization の専用 Schema / validation
- Closure Readiness result の機械的評価
- Accepted / Residual / Deferred / Resolved risk の区別
- Follow-up と Knowledge handoff の確定
- Resource cleanup と Actual Usage reconciliation の証拠検証
- `ACTIVE / CLOSURE → COMPLETED` transition
- Completion Record
- Closure 用の idempotent retry / failure Safe Stop
- 派生 Registry / Current State 用の通知契約
- Archive Readiness と Archive execution

この差分は、元の TASK-004 Phase 5 scope に明示的に含まれる正当な未完了である。TASK-004 を過剰に延命しているのではない。

## 6. Scope Ownership Analysis

| Capability | Owner |
|---|---|
| Lifecycle status / phase / gate / authorization | TASK-004 |
| Canonical Status Record / Transition Log / durable commit | TASK-004 |
| Closure Readiness / Completion / Archive Readiness | TASK-004 Phase 5 |
| Registry entry discovery / automated updates / role routing | TASK-006 |
| Knowledge asset creation / promotion / governance | TASK-005 |
| Closure-created Knowledge handoff reference | TASK-004 interface only |

TASK-004 は Registry を直接 canonical authority として扱わない。Phase 5A は完了コミット後の **derived-view synchronization request** を Completion Record に出力できるが、Registryを探索・自動更新・自律routingしてはならない。

## 7. TASK Placement Analysis

### Option A — TASK-004 Phase 5

Task definition §4.5 が Closure、Archive、Historical Migration を明示する。既存の status / transaction / recovery implementation を再利用でき、Task responsibility と連続する。

### Option B — New subtask / new Task

Closure state rulesを新Taskへ移すと、同じ Task の completion を外部 Task が決定する二重 authority を生む。新 Task は後続修正・拡張には適するが、TASK-004 自身の Closure MVP の代替には不適切。

### Option C — TASK-006

TASK-006 は automation / resolver / routing の領域である。ここへ移すと、automation が lifecycle truth を所有する逆転が起きる。

### Option D — Manual Governance Only

Owner が文書だけで完了を宣言する方式は、Canonical Status、Transition Log、VERIFY-before-COMMIT、idempotency の要求を満たさない。暫定的な Phase 1 approval 記録には使えても TASK-004 overall completion の代替にはならない。

### Option E — Other

Phase-only completion を `COMPLETED` として記録する新しい Task ID は、既存 task ID / terminal-status semantics と矛盾する。独立した `phase_status` モデルを新設する承認済み仕様がない。

## 8. Option Comparison

| Option | Scope Fit | Risk | Complexity | Time | Future Compatibility | Recommendation |
|---|---:|---:|---:|---:|---:|---|
| TASK-004 Phase 5 | High | Medium | Medium | Medium | High | Adopt |
| New Subtask | Low | High | Medium | Medium | Low | Reject for Closure MVP |
| TASK-006 | Low | High | High | High | Medium | Reject |
| Manual Closure | Low | High | Low | Low | Low | Reject |
| Phase-only Completion | Low | Medium | Medium | Low | Low | Reject |

## 9. Recommended Placement

**TASK-004 Phase 5 — Closure, Archive, and Historical Migration** を維持する。実装は Phase 5A / 5B の bounded work packages に分割するが、Task ID、Lifecycle authority、Canonical Status ownership は変更しない。

## 10. Recommended Phase

### Phase 5A — Completion Transition MVP

Closure Readinessが `CLOSURE_READY` のときにのみ、実運用 Status Record を `COMPLETED` へ遷移させる最小機能。

### Phase 5B — Archive and Migration

`COMPLETED` を前提に Archive Readiness、Archive Record、in-place / physical archive、rollback、post-archive VERIFY、TASK-003 migration を扱う。Phase 5A に Archive 実行を混在させない。

## 11. Minimum Viable Closure Scope

Phase 5A の最小要件:

1. Project-owned production runtime-state path を承認し、prototype fixture と明確に分離する。
2. Closure Request Schema と Completion authorization reference を定義する。
3. Completion Readiness Validator を実装する。
4. Critical / High `0 / 0`、必要 Evidence、risk、follow-up、knowledge handoff、resources、cost の入力を検証する。
5. expected revision、lease、fencing、current checksum、authorization scope / expiry を再検証する。
6. `ACTIVE / CLOSURE / PASS / AUTHORIZED / NOT_ELIGIBLE → COMPLETED / CLOSURE / PASS / AUTHORIZED / REVIEW_PENDING` を許可する明示 matrix を定義する。
7. Snapshot / Transition Event / Journal acknowledgement を durable commit する。
8. Completion Record を新規生成する。
9. Completion Record に derived-view synchronization request を記録する。
10. duplicate request と crash recovery を idempotent に扱う。
11. failure では旧 Snapshot を保持し、append-only failure Event と Safe Stop を残す。
12. 独立 Tester / Critic / Judge / Policy / Completion reassessment を実施する。

## 12. Archive Separation

`COMPLETED` と `ARCHIVED` は別の terminal lifecycle state である。Archive は destination、manifest、reference integrity、checksum、retention、rollback、post-archive VERIFY を必要とするため、Phase 5A に含めない。

Phase 5A の終了時:

```text
task_status = COMPLETED
current_phase = CLOSURE
archive_status = REVIEW_PENDING
```

Phase 5B で Archive Readiness が `READY` となった場合にのみ `COMPLETED → ARCHIVED` を実施する。

## 13. Required Schema

新規設計で最低限必要な Schema / contract:

- `ClosureRequest`: task ID、expected revision、from / to state、reason、requested / authorized / applied actors、authorization reference、evidence set。
- `ClosureReadiness`: technical、quality、policy、status、risk、follow-up、knowledge、resources、cost、owner の各チェックと `CLOSURE_READY | CLOSURE_BLOCKED | CLOSURE_NOT_CONFIRMED`。
- `CompletionAuthorization`: Owner decision ID、scope、effective / expiry、allowed operation `COMPLETE_TASK`、evidence checksum。
- `CompletionRecord`: completed transition ID / revision、Closure Readiness checksum、accepted / residual / deferred risks、follow-up references、knowledge handoff status、resource / cost verification、derived-view synchronization request。
- Status Record evolution: Lifecycle Ver.1.3 が要求する `accepted_risks`、`knowledge_handoff_status`、cost / context references をどう Phase 1 `1.1.0` record から versioned migration するか。
- `DerivedViewSynchronizationRequest`: source completion record、required derived views、request checksum、status。これは Registry の更新実装ではない。

既存 Phase 1 record を in-place 編集せず、migration / new production record の完全な compatibility rule を設計する。

## 14. Required State Transitions

Phase 5A は少なくとも次を定義する。

```text
POLICY_REVIEW → CLOSURE
  requires: policy VERIFY PASS, Closure inputs, gate PASS

ACTIVE/CLOSURE → COMPLETED/CLOSURE
  requires: CLOSURE_READY, Owner COMPLETE_TASK authorization,
            expected revision match, no active lease, VERIFY PASS, durable commit

COMPLETED → ACTIVE
  forbidden: TERMINAL_REOPEN_FORBIDDEN

COMPLETED → ARCHIVED
  deferred to Phase 5B
```

`CLOSURE_BLOCKED` / `CLOSURE_NOT_CONFIRMED` は `COMPLETED` を commit せず、current stateを保持して Safe Stop する。

## 15. Required Authorization

Builder implementationを開始する前に必要なもの:

1. Owner が Phase 5A placement、scope、allowed files、production-state root、migration boundary、rollbackを承認する。
2. Builder design → Critic review → Builder response → Judge decision を Phase 5A 専用で完了する。
3. Phase 5A final plan と independent consistency check が `PASS`。
4. Owner が期限・operation・path scope付き implementation authorization を発行する。
5. 実際の completion transaction 前に、別の Owner `COMPLETE_TASK` authorization が必要。

Implementation authorization と individual Task completion authorization は同じものとして扱わない。

## 16. Required Evidence

- Final Phase 5A plan / judgment / authorization
- Judge Phase 1 implementation judgment、latest Tester / Critic evidence
- Policy UPDATE / VERIFY evidence
- Closure Readiness validation output
- Critical / High zero evidence
- production state / log current checksums and revision
- Accepted / residual / deferred risk record
- follow-up references
- knowledge handoff result or explicit `NONE`
- resource cleanup and secrets check
- actual cost / reconciliation evidence or `NOT_CONFIRMED` Safe Stop
- Owner completion authorization

## 17. Required Tests

Minimum independent test plan:

- Critical または High unresolved で completion を拒否する。
- Owner authorization 不在 / 期限切れ / scope mismatch を拒否する。
- Evidence 欠落、checksum mismatch、required Closure Readiness input欠落を拒否する。
- expected revision mismatch と active lease を拒否する。
- duplicate Completion Request と already `COMPLETED` replay は idempotent / duplicate-free に処理する。
- Completion Record write failure、derived-view request write failure、journal / event sync failureで旧 Snapshotを保持する。
- Summary / Index が completion transaction より先に更新されないこと。
- PREPARED、APPLIED、ACKNOWLEDGED、VERIFIED、COMMITTED の crash boundary recovery。
- status commit 後 / Completion Record 前の failure を `COMMIT_STATE_UNKNOWN` または設計済み recovery で Safe Stop する。
- retry が revision / Transition Event / Completion Record を重複させないこと。
- historical Evidence、prototype fixture、follow-up references、accepted risksを変更しないこと。
- Archiveを Phase 5A が実行しないこと。
- `COMPLETED → ACTIVE` を恒久的に拒否すること。

## 18. Required Design Artifacts

既存 Evidenceを上書きせず、Phase 5A専用の新規 Artifactを使用する。

- `closure-design-amendment.md`
- `closure-critic-review.md`
- `closure-builder-response.md`
- `closure-judge-decision.md`
- `closure-final-plan-amendment.md`
- `closure-consistency-check.md`
- `closure-implementation-report.md`
- `closure-test-report.md`
- `closure-retest-report.md`（必要時）
- `closure-implementation-review.md`
- `closure-final-judgment.md`
- `closure-policy-review.md`
- `closure-readiness.md`
- `completion-record.md`

Artifact filename、authoring role、exact allowed-file listは Owner authorization 時に衝突確認して確定する。

## 19. Registry／Current State Synchronization

正本から派生物への順序:

```text
Closure Readiness Evidence
→ Canonical Status / Transition Log durable commit
→ Completion Record
→ DerivedViewSynchronizationRequest
→ authorized Registry / Current State UPDATE
→ Index / Summary UPDATE
→ independent VERIFY
```

Registry / Current State / Index / Summary は Canonical Status より先に `COMPLETED` を表示してはならない。Phase 5A は更新要求を記録するのみで、Registry update の実行や自動探索はしない。

## 20. Failure and Recovery

Phase 1の Journal / checksum-chain / exact acknowledgement modelを継承する。Closure Requestの validation failure は、Snapshotを置換せず failure Event を追記し、Leaseを解放する。commit state が不明な場合は `RECOVERY_REQUIRED` / `COMMIT_STATE_UNKNOWN` として、Owner-authorized recoveryまで no-write Safe Stop とする。

Completion Record は state commit と分離不能な integrity requirement である。安全な atomic groupingを実装できない場合、Statusを `COMPLETED` にせず、Completion Record を含む transaction protocolを再設計する。

## 21. Git／Commit Boundary

- 既存 post-baseline Evidence Commit A は Phase 5A 実装前に、Owner承認済み allowlistで実行してよい。これは Closure capability の前提ではないが、既存 Evidenceの履歴保全に有益である。
- Phase 5A design artifacts は Commit B（design evidence）として独立させる。
- source / schema / tests / implementation report は Commit C（Phase 5A implementation evidence）として独立させる。
- Completion Record / canonical production state / transition log / reassessment は Commit D（completion evidence）とする。実際の runtime stateの機密性、持続性、Git追跡の整合は設計時に明示する。
- Foundation Root の Git boundary 未確定は Phase 5A の Project-local Closureを Blockしない。ただし Foundation document changes は Project Repositoryに混在させない。

## 22. Completion Semantics

| Scope | Current / future meaning |
|---|---|
| Phase 1 Implementation Completion | `READY / IMPLEMENTATION_APPROVED` |
| TASK-004 overall completion | Phase 5A Closure capability、real completion transition、Closure Record、Policy / independent verificationまで `NOT_READY` |
| Archive | Phase 5Bおよび Archive Readiness後のみ評価可能 |

この区別は元の TASK-004 six-phase scope と Lifecycle Ver.1.3 の `COMPLETED` 定義に一致する。

## 23. Alternative Completion Strategy

`TASK-004 Phase 1 = COMPLETED` と記録しつつ TASK-004を `ACTIVE` に保つ方法は推奨しない。

- `COMPLETED` は task-level terminal stateであり、Phase-level result語彙ではない。
- `TASK-004-PHASE-1` のような後付け Task ID は、既存 Evidenceの `TASK-004` identity、Registry、future automation queryを分裂させる。
- Phase completionは既存の Judge / Tester / Critic artifactsで明確に表せる。
- 新しい `phase_status` axisを導入するには、別の approved lifecycle schema changeが必要である。

従って、Phase 1 approvalを evidence-level milestoneとして保持し、TASK-004 overallを `ACTIVE` とする。

## 24. Risks

- Phase 5Aが ArchiveやTASK-006 automationを取り込む scope creep。
- 既存 prototype fixtureの誤使用。
- real production state の初期生成 / migrationがHistorical Evidenceを書換える危険。
- Completion Recordを state commit後に失う durability gap。
- Registry派生ビューを正本より先に更新する危険。
- Cost reconciliation / Knowledge handoff を形式だけでPASS扱いする危険。
- WSL2/ext4外と physical device persistence barrierの残余リスク。

## 25. Owner Decision Package

### Decision A — Placement

TASK-004 Phase 5を採用し、Phase 5A（Closure MVP）とPhase 5B（Archive / Migration）へ分割する。TASK-006への移管、manual-only closure、new subtaskによる state authority分離は採用しない。

### Decision B — Scope

Phase 5Aに section 11の12項目を含める。Archive execution、physical movement、TASK-003 migration execution、Registry automation、TASK-005 knowledge governance、TASK-006 routingは除外する。

### Decision C — Authorization

Owner は Builder開始前に、production runtime-state path、allowed source/test/schema/artifact files、migration approach、rollback / Safe Stop、implementation authorizationを明示承認する。completion transactionには別の Owner `COMPLETE_TASK` authorizationを要求する。

### Decision D — Documentation

Phase 5Aの設計が Judge承認・implementation judgment・policy authorizationを完了するまで、Foundation canonical documentsを更新しない。更新が必要になった場合は、Phase 6 / separate documentation synchronization flowとして `DETECT → PROPOSE → APPROVAL → UPDATE → VERIFY` を適用する。

### Decision E — Git Boundary

Commit A（既存 evidence）→ Commit B（Phase 5A design）→ Commit C（implementation）→ Commit D（completion state / record / reassessment）の順を提案する。各 commit は Ownerの個別承認と最終 allowlistを必要とする。

### Decision F — Completion Review

次を満たすまで再実施しない。

- Phase 5A Final Judgment と Policy verification
- actual production Canonical Status / Transition Log
- Closure Readiness `CLOSURE_READY`
- Owner completion authorization
- Completion Record
- derived-view update / verification evidence
- Critical / High unresolved `0 / 0`

## 26. Recommended Next Role

Owner decision後の Builder。Phase 5A の bounded design artifact を作成する前に、Owner が Decision A–F と allowed-file scope を承認する必要がある。

## 27. Recommended Next Artifact

Owner-authorized `closure-design-amendment.md`。これは新しい Phase 5A design cycleの開始 Artifactであり、既存 Phase 1 Final Planを上書きしない。

## 28. Gate Readiness

`READY_WITH_CONDITIONS`

Placementと最小境界は確定できる。Builder design開始は、Ownerが Phase 5A、production state root、allowed-file list、authorization / rollback boundaryを明示承認した後にのみ可能である。

## 29. Owner Approval Required

`YES`

本Decisionは設計、コード、テスト、Status、Registry、Git、Completion Review、Archive、TASK-000/005/006を開始・変更しない。
