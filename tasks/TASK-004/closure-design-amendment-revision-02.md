# TASK-004 Phase 5A — Closure Design Amendment Revision 02

## 1. Document Control

- Authoring Role: Lifecycle Closure Design Architect — Revision 02
- Active Project / Task: `/home/baisound/projects/javascript-roulette` / `TASK-004`
- Phase: Phase 5A — Completion Transition MVP
- Scope: H-02 only — Global Append-only Transition History across generations
- Allowed persistent file: this file only
- Result: `PHASE5A_DESIGN_REVISION_02_READY_WITH_CONDITIONS`
- Implementation Authorization: `NOT_AUTHORIZED`

## 2. Revision Authority

Owner Decision `Phase 5A Closure Design Revision 02: AUTHORIZED` authorizes this limited design artifact only. It does not authorize changes to existing evidence, source, tests, status, registry, or Git, and it does not start a Critic re-review, Builder Response, Judge Decision, Final Plan, implementation, or Archive.

## 3. Source Evidence

- H-02 source: `closure-critic-rereview-01.md`
- Prior design chain: `closure-design-amendment.md`, `closure-critic-review.md`, `closure-design-amendment-revision-01.md`
- Phase 1 design: `final-plan.md`, `final-plan-amendment-d05-d06.md`
- Canonical lifecycle specification: `TASK-004_AI_Development_OS_Lifecycle_Foundation_Ver1.3_Current_State_Integrated.md`
- Phase 1 implementation/test boundary: `src/lifecycle/phase1/index.mjs`, `tests/lifecycle/phase1/lifecycle-store.test.mjs`
- Runtime result: `HOME=/home/baisound`、`UNAME=Linux`、`PHASE5A_REV02_RUNTIME_CHECK_COMPLETE`、exit code `0`

## 4. H-02 Finding

| Item | Extracted finding |
|---|---|
| Finding ID | `H-02` |
| Severity | `HIGH` |
| Exact affected sections | Revision 01 §§7, 14–16, 20–21 |
| Current design gap | Bundleには単一`transition-event.json`しかなく、Task全体の`transition-log.jsonl`、checksum chain、全履歴、generation間継承が未定義 |
| Historical integrity risk | 過去Eventの消失・複製・分岐により監査履歴を失う |
| Checksum chain risk | generationごとのEventをchainとして誤読し、global tail・previous checksum・revision連続性を検証できない |
| Recovery risk | prepared/committed/failure/recovery Eventの唯一の追記先と重複防止が不明 |
| Expected behavior | Taskごとに唯一のGlobal Append-only Historyを維持し、BundleはそのEvent参照だけを保持する |
| Required correction | Global Log path、ownership、append protocol、chain head binding、publish/recovery/retry規則を定義する |
| Closure criteria | Global Logがgeneration-scopedでなく、全chain検証、Event/Bundle/Pointer binding、retry duplicate防止が可能 |
| Verification method | chain continuity、tail/revision一致、failure/recovery Event、tamper/truncation、duplicate preventionのテスト |

## 5. Root Cause

Revision 01はH-01を閉鎖するため、Current Stateをgeneration/pointerで公開する設計へ変更した。しかし、Current Stateのsnapshot世代管理と、Taskのappend-only監査履歴を同じBundleへ閉じ込めたため、Phase 1が要求する一意の`transition-log.jsonl`とchecksum chainの永続性が欠落した。

Current State GenerationとTransition Historyは異なる責務であり、前者はpointerで切替可能、後者は一度も切替・複製・巻戻しできない。

## 6. Design Correction Summary

H-01のGeneration/Pointer設計を維持する。H-02の修正は、production rootにgenerationの外側の単一Global Logを導入することである。

- generation: published canonical snapshot、Completion Record、Journal/acknowledgement、Bundle metadata。
- global log: すべてのtransition attempt、prepared/committed/aborted/recovery Eventの唯一のappend-only履歴。
- Bundle: global logのEvent bytesを複製せず、immutable referenceとchain headを保持する。
- Canonical Validated Read: pointer/bundleだけでなく、Global Logの全chainとmatching committed Eventを検証する。

## 7. Global Transition History Model

```yaml
transition_history:
  authority: GLOBAL_APPEND_ONLY_LOG
  path: <production-root>/tasks/TASK-004/transition-log.jsonl
  format: JSONL
  owner: TASK_004_LIFECYCLE_STORE
  generation_scoped: false
  mutable_operation: APPEND_ONLY
  genesis_checksum: sha256:GENESIS
  current_chain_head: last_entry_checksum
  chain_algorithm: canonical-json-sha256
  fsync_required: true
  directory_sync_required: true
```

必須Invariant:

> `transition-log.jsonl`はTask単位の単一Global Append-only Historyであり、generationごとに複製・分岐・巻戻ししてはならない。

## 8. Generation／History Responsibility Separation

| Data | Owner / location | Generation scoped | Mutability |
|---|---|---:|---|
| Canonical Status Snapshot | published generation | yes | immutable after publish |
| Completion Record | published generation | yes | immutable after publish |
| Completion Journal / acknowledgement / manifest | published generation | yes | immutable Commit Certificate |
| Current Pointer | task root | no | atomic replace only |
| `transition-log.jsonl` | task root | no | append only |
| chain head | last Global Log entry plus pointer/bundle references | no | advances only by append |
| Phase 1/historical fixture log | fixture path | no | read-only reference only |

Generation内に`transition-event.json`又はlog copyを置かない。BundleはGlobal Eventの`transition_id`、`entry_checksum`、`previous_entry_checksum`、byte checksum、chain head before/afterを参照するだけである。

## 9. Global Log Ownership

Production pathは`<production-root>/tasks/TASK-004/transition-log.jsonl`である。Event schema versionは既存parser互換を保つ`1.1.0`とし、Phase 5Aはoptional `event_type`を追加する。既存Phase 1 parserは未知の追加fieldを拒否しないため、既存entryの読み取りを壊さない。

chain headの正本はGlobal Log末行の`entry_checksum`であり、独立mutable head fileを正本にしない。`current.json`とCompletion Bundleは読み取り最適化用にchain head referenceを持つが、Log全chainの検証より優先しない。

## 10. Completion Event Semantics

採用するevent typeは3種である。

| Event type | `outcome` | Meaning | Canonical completion |
|---|---|---|---|
| `COMPLETION_PREPARED` | `PREPARED` | Bundle publication候補をglobal historyへ記録 | No |
| `COMPLETION_COMMITTED` | `COMMITTED` | Bundle checksumとgeneration IDにboundしたcompletion transactionのglobal log componentがdurable | Pointer/Journalと併せてのみYes |
| `COMPLETION_ABORTED` | `ABORTED` | published前に安全にabortしたattempt | No |

`COMPLETION_COMMITTED` Event単体はTask完了を意味しない。`COMPLETED`はpublished pointer、COMMITTED Journal、matching Completion Record、matching committed Event、full-chain validationの組でのみ成立する。

`COMPLETION_PREPARED`は同一`transaction_id`に対して一件のみ、`COMPLETION_COMMITTED`も同一transaction/revisionに一件のみとする。別transactionが先に有効commitした場合、後発transactionは`SUPERSEDED`又は`COMPLETION_ABORTED` Eventをappendし、COMMITTED Eventを追加しない。

## 11. Append Protocol

1. Lease/fencing取得後、Global Log全体を`verifyTransitionChain()`で検証し、current chain headを読む。
2. `COMPLETION_PREPARED` Eventをcanonical JSONで生成する。`previous_entry_checksum`は現在tail、`resulting_revision=null`、Bundle generation ID、expected revision、予定Bundle checksumを記録する。
3. PREPARED EventをGlobal Logへappendし、log file fsync、log parent directory fsync、exact byte re-read、new chain head検証を行う。
4. staging generationを作成し、Status、Completion Record、Journal、acknowledgement、Bundle Manifestをdurable化する。ManifestはPREPARED Event referenceとchain head before/afterを記録する。
5. Bundle内全identity/checksumを再読し、Journalを`VERIFIED`へ進める。
6. `COMPLETION_COMMITTED` Eventを生成する。`previous_entry_checksum`はPREPARED Eventの`entry_checksum`、`resulting_revision`はcompletion revision、Bundle checksum、generation ID、PREPARED Event IDを記録する。
7. COMMITTED EventをGlobal Logへappendし、log file fsync、directory fsync、exact byte re-read、chain head検証を行う。
8. Bundle Manifest/journal acknowledgementへCOMMITTED Event ID/checksumとchain head afterをdurably記録し、Journalを`COMMITTED`へ進める。
9. staging generationを`generations/<generation-id>/`へrename+directory fsyncし、Current Pointerをatomic swap+task root directory fsyncする。
10. `readCanonicalTaskState()`でpointer、Bundle、Global Log全chain、matching COMMITTED Eventを再検証する。
11. Leaseとstaging残骸だけをcleanupする。Global Log、published generation、pointerをcleanupしない。

## 12. Event／Publish Ordering Analysis

| Option | Result | Decision |
|---|---|---|
| A: Event durable before Generation Publish | committed Eventだけが残るCrash Windowを持つ。Event単体をcompletion扱いしない明示規則とrecoveryが必要 | Incomplete alone |
| B: Generation Publish before Event | published `COMPLETED`にmatching EventがないWindowを作り、H-01 Gateを必ず失敗させる | Reject |
| C: Prepared Event + Commit Marker | PREPAREDとCOMMITTEDをappend-onlyに表せ、published前に全Log要件を満たせる。unpublished committed transactionも明確に回復できる | Adopt |
| D: single event + Journal reference | log内でprepared/aborted/recoveryの独立履歴が弱く、Crashの意味をJournalだけへ隠す | Reject |

Primary protocolはOption Cである。Defense-in-depthはGlobal Log full-chain validationをCommit Certainty Gateへ追加し、COMMITTED Event単体をcompletionとして扱わないことである。

## 13. Selected Protocol

`COMPLETION_PREPARED → Bundle durable/VERIFIED → COMPLETION_COMMITTED → Journal COMMITTED → Pointer publish`を採用する。

COMMITTED Event後・Pointer publish前にCrashした場合、old generationがcanonical current stateのままである。Global Logはcommitted-but-unpublished transactionを監査記録として保持する。Owner-authorized recoveryは、Event、Bundle、Journal、revision、pointerの全identityが一致するときだけ同一generationをpublishできる。不一致なら`COMPLETION_RECOVERY_REQUIRED`で止まり、pointer又はlogを推測修復しない。

## 14. Checksum Chain Rules

- JSONL lineはcanonical JSON UTF-8 bytes＋LF。
- `entry_checksum`は自身を除外したEvent canonical bytesのSHA-256。
- `previous_entry_checksum`は直前entryの`entry_checksum`。empty logは`sha256:GENESIS`。
- 既存Phase 1 `event_schema_version="1.1.0"` entryをそのまま検証する。
- 新規`event_type`は`TRANSITION`、`COMPLETION_PREPARED`、`COMPLETION_COMMITTED`、`COMPLETION_ABORTED`、`RECOVERY`の許可集合とする。unknown event typeはSafe Stop。
- verifierは全entryを先頭から検証し、malformed JSON、previous checksum不一致、entry checksum不一致、truncation、duplicate transition ID、duplicate committed resulting revision、revision逆転を拒否する。
- committed transitionのresulting revisionはstrictly increasingであり、Snapshot/Pointerのrevisionと一致しなければならない。

## 15. Chain Head Binding

Completion Bundleの`transition_history_reference`は次を必須とする。

```yaml
transition_history_reference:
  prepared_event_id: UUID
  prepared_event_checksum: sha256
  committed_event_id: UUID
  committed_event_checksum: sha256
  chain_head_before: sha256
  chain_head_after: sha256
  resulting_revision: integer
  log_path: transition-log.jsonl
  log_schema_version: "1.1.0"
```

`current.json`は`transition_history_chain_head`と`committed_event_id`を持つ。Canonical Validated ReadはGlobal Log全chainを検証し、tailが`chain_head_after`、matching committed Eventがtail又は後続のallowed non-state eventより前の有効entryであることを確認する。後続failure/recovery Eventを許すため、matching committed Eventが必ずtailであることは要求しない。

## 16. Commit Certainty Gate Extension

Revision 01のGateに以下を追加する。

1. Global Logが存在し、full-chain verificationがPASS。
2. BundleのPREPARED/COMMITTED Event referencesがGlobal Logのexact bytes/checksumsと一致。
3. COMMITTED Eventのtask/project/generation/transaction/resulting revision/bundle checksumがBundle、Journal、Completion Record、Pointerと一致。
4. `chain_head_before`とPREPARED Event、`chain_head_after`とCOMMITTED Eventのchain関係が一致。
5. matching COMMITTED Eventが存在せず、PREPAREDだけの場合は`COMPLETION_EVENT_NOT_COMMITTED`。
6. chain、head、event、revision、bindingの不一致は`COMPLETION_HISTORY_STATE_UNKNOWN`を下位causeとし、top-level `COMPLETION_STATE_UNKNOWN`でSafe Stop。

Global Logの一部分又はCompletion Event単体だけではcompletionを確定してはならない。

## 17. Crash／Recovery Matrix

| Boundary | Canonical read | Global Log / generation | Recovery / authority | Duplicate / cleanup |
|---|---|---|---|---|
| Before Global Event append | old published state | no new Event / no Bundle | normal new request | no cleanup beyond absent candidate |
| After PREPARED append, before Bundle durable | old published state | PREPARED only, noncanonical | Owner-authorized inspection; append ABORTED only if exact transaction is abandoned | no second PREPARED; staging cleanup after ABORTED |
| After Bundle durable, before pointer publish | old published state | PREPARED, Bundle VERIFIED | Owner may publish only after exact revalidation | same transaction only; no duplicate Event |
| After pointer publish, before COMMITTED Event | prohibited by selected order | impossible normal state | any observation is `COMPLETION_RECOVERY_REQUIRED` | no auto repair |
| After COMMITTED append, before event fsync | old published state | COMMITTED durability unknown | Safe Stop; retain lease/journal/log evidence | no retry append |
| After event fsync, before directory sync | old published state | file-durable/directory-unknown | `COMPLETION_HISTORY_STATE_UNKNOWN`; Owner recovery | no log truncation or duplicate |
| After Event durable, before Journal COMMITTED | old published state | COMMITTED Event + VERIFIED Bundle | Owner may advance journal only after exact match | no duplicate committed Event |
| After Journal COMMITTED, before Pointer publish | old published state | committed-but-unpublished | Owner-authorized idempotent publish only | no Bundle/log cleanup |
| After Pointer publish, before cleanup | Gate PASS only if all evidence matches | published generation + full chain | deterministic lease/staging cleanup; Owner if mismatch | idempotent cleanup only |
| Derived sync before outbox consumption | Gate PASS completion | outbox pending | separate consumer authority | no status rollback |

## 18. Existing Log Migration Decision

採用は**Option C**である。Phase 1の既存`transition-log.jsonl`はprototype fixtureに属し、TASK-004 Closureのlive operational historyではない。これをproduction Global Logへコピー又は正本化しない。

Phase 5A production rootは新しい`STATE_BOOTSTRAP_FROM_EVIDENCE` transitionを`sha256:GENESIS`から開始する。このEventはfixtureを変更せず、fixture path/checksumをreference evidenceとして記録する。production Global Logはこのbootstrap Event以降の唯一のappend-only historyになる。

Option A/Bを棄却する理由は、fixture logを実運用historyへ再分類すると、historical fixtureの意味を改変し、実在しないClosure operational historyを作るためである。

## 19. Log Read／Validation APIs

| API | Responsibility |
|---|---|
| `readTransitionHistory()` | Global Log bytesをread-onlyで読む。raw outputはRegistryへ渡さない |
| `verifyTransitionChain()` | 全entryのschema/checksum/order/duplicate/truncationを検証する |
| `findTransitionById()` | 検証済みGlobal Historyから一意Eventを取得する |
| `verifyCompletionEventBinding()` | Bundle/Journal/Pointer/RecordとPREPARED/COMMITTED Eventのbindingを検証する |
| `appendTransitionDurably()` | Lease/fencing下でappend、file fsync、directory fsync、exact re-readを行う唯一のwriter |
| `inspectTransitionRecovery()` | Log/Bundle/Pointerのread-only診断。repairしない |

禁止事項は、generation copyをHistoryとして読むこと、raw logをRegistryへ渡すこと、single Eventだけでchain検証を省略すること、破損logをtruncateすること、無認可repairである。

## 20. Derived Consumer Rules

Derived consumerはCompletion同期前に以下を全て確認する。

- `readCanonicalTaskState()`がPASS。
- `verifyTransitionChain()`がPASS。
- matching `COMPLETION_COMMITTED` EventがPASS。
- published generation、Completion Record、Journal、PointerがPASS。
- verified outbox eventがPASS。

Registry、Summary、Current State、Indexは`transition-log.jsonl`を独自に解釈しない。Global Log検証はLifecycle Storeが提供するvalidated resultを使用する。

## 21. Error Codes

| Code | Meaning |
|---|---|
| `TRANSITION_HISTORY_MISSING` | Global Log不存在 |
| `TRANSITION_HISTORY_TAMPERED` | entry/checksum/JSON不正 |
| `TRANSITION_HISTORY_TRUNCATED` | manifest/head/referenceが示す履歴より短い |
| `TRANSITION_CHAIN_MISMATCH` | previous checksum chain不一致 |
| `TRANSITION_HEAD_MISMATCH` | Bundle/Pointer referenceとverified head不一致 |
| `TRANSITION_EVENT_MISSING` | required Event不存在 |
| `TRANSITION_EVENT_DUPLICATE` | transition ID重複 |
| `TRANSITION_REVISION_DUPLICATE` | committed resulting revision重複 |
| `TRANSITION_REVISION_OUT_OF_ORDER` | committed revisionが単調増加でない |
| `COMPLETION_EVENT_NOT_COMMITTED` | PREPAREDのみ又はCOMMITTED Event未確認 |
| `COMPLETION_EVENT_BINDING_MISMATCH` | EventとBundle/Journal/Pointer/Recordのidentity不一致 |
| `COMPLETION_HISTORY_STATE_UNKNOWN` | history側のcompletion確実性不明 |
| `COMPLETION_RECOVERY_REQUIRED` | no-write recovery authority待ち |

既存`CHECKSUM_MISMATCH`、`COMMIT_STATE_UNKNOWN`、`RECOVERY_REQUIRED`は内部原因として保持し、Phase 5A canonical readは`COMPLETION_STATE_UNKNOWN`へ正規化する。

## 22. Test Additions

- Existing Phase 1 log entriesをreferenceとして保持し、production Global Logがfixtureを変更しないこと。
- production bootstrap後、Log byte prefixがappend後も不変であること。
- genesis、schema 1.1.0、checksum chain、chain head before/after、global tail/revisionの整合。
- past entry modification/deletion/truncation、previous/entry checksum mismatch、unknown event type、duplicate ID/revision、out-of-order revision。
- generationにlog copyがなく、history referenceだけでbindingできること。
- PREPARED Eventだけではcompletionを返さず、matching COMMITTED Event、Journal、Pointer全てでのみ成功すること。
- PREPARED append後、Bundle durable後、COMMITTED appendのsync失敗、directory sync失敗、Journal commit前、pointer publish後のCrash recovery。
- retryでEvent/Bundles/chainが分岐又は重複しないこと、superseded transactionをrejectすること。
- D-01〜D-06、tamper detection、duplicate prevention、migration mapping、non-`COMPLETED` read、H-01 testsの回帰。

## 23. Backward Compatibility

- Existing fixtureと`1.1.0` log entry formatは変更しない。
- Phase 5A production Global Logは新規rootのgenesisから始め、fixture logをcopyしない。
- `event_schema_version="1.1.0"`を保持し、`event_type`をoptional additive fieldとする。
- Existing Phase 1 parserはexisting entriesを継続して読む。Phase 5A verifierはevent type、completion binding、generation/pointerを追加検証する。
- direct JSON consumer禁止、Canonical Validated Readへの移行、H-01 generation/pointer modelを維持する。

## 24. Schema Versioning

- Status/Completion Bundle production schema: `1.2.0`。
- Global Log Event schema: `1.1.0`継続。`event_type`は追加field。
- `event_type`はcompletion semanticsを表すが、既存`outcome`と矛盾しない。PREPARED/ABORTED/RECOVEREDは`resulting_revision=null`、COMMITTEDのみinteger revisionを持つ。
- unknown event type、未知schema version、必須binding欠落はSafe Stopでありdefaultしない。

## 25. Required Changes to Revision 01

Revision 01を直接編集しない。将来Final Planでは以下をRevision 02で補強する。

- §14 Bundleから`transition-event.json`を削除し、Global Log referenceへ置換。
- §15 task rootに単一`transition-log.jsonl`を追加し、generation外の唯一のHistoryとする。
- §16 publish protocolを`PREPARED append → Bundle → COMMITTED append → Journal COMMITTED → Pointer publish`へ置換。
- §17 Recovery MatrixにGlobal Logのdurability/stateを追加。
- §7/§13 Commit Certainty Gateにfull-chain/event binding/head validationを追加。
- §20 Test MatrixにH-02 test suiteを追加。

## 26. Required Final Plan Changes

Final Planは以下を固定しなければならない。

1. Global Log exact path、owner、append-only writer、filesystem preconditions。
2. full Event schema、event type/outcome rules、canonical serializer、genesis、chain head。
3. PREPARED/COMMITTED/ABORTED semanticsとcompletion meaning。
4. append/fsync/directory sync/re-read/order/retry protocol。
5. Bundle/Journal/Pointer/Completion RecordとGlobal Logのexact identity binding。
6. full-chain validationとincremental optimizationの区別。
7. H-02 test matrix、H-01 tests、D-01〜D-06 regression。
8. fixture-to-production bootstrap provenanceとno-copy migration rule。

## 27. Acceptance Criteria Additions

- Global Logはgeneration-scopedではない。
- Global Logはappend-onlyであり、copy/replace/rollbackしない。
- Completion BundleはGlobal Event bytesを複製しない。
- `COMPLETED` canonical readにはfull verified chainとmatching COMMITTED Eventが必要である。
- PREPARED Event、unpublished Bundle、COMMITTED Event単体はいずれもTask completionを意味しない。
- Event、Bundle、Journal、Pointer、Record、revision、chain headの不一致はSafe Stopである。
- retry/recoveryでchain分岐、duplicate transition ID、duplicate committed revisionを発生させない。

## 28. Risks

- Global Logとpointer publishは単一filesystemのdurability保証に限定される。
- COMMITTED Event後のunpublished Bundleは監査上残るため、Owner recovery手順を運用可能にする必要がある。
- full-chain verificationはlog成長に伴いコスト増となるが、Integrityを理由に省略してはならない。
- 将来incremental cacheを導入する場合も、起動時、recovery時、completion read時、cache miss時はfull-chain verificationを必須とする。

## 29. Open Questions

H-02のGlobal History設計は確定した。未確定事項はOwner Decision 1〜5のみである。

1. production root/Git policy
2. Cost Ledger authority
3. Completion Record JSON/Markdown policy
4. derived synchronization consumer
5. authorization audit/revocation storage

これらはFinal Planのblocking inputであり、本Revisionが確定しても自動解決しない。

## 30. Recommended Next Role

Owner確認後の独立Critic re-reviewが望ましい。これは助言であり、本Revisionは次Roleを起動しない。

## 31. Recommended Next Artifact

Ownerが認可する新規Critic re-review artifact。既存Critic/Re-review Evidenceは変更しない。

## 32. Gate Readiness

`NOT_READY`。

H-02の設計修正は`PHASE5A_DESIGN_REVISION_02_READY_WITH_CONDITIONS`である。Critic re-review、Owner Decision 1〜5、Builder Response、Judge Decision、Final Plan、Consistency Check、明示的Implementation Authorizationが揃うまで実装は`NOT_AUTHORIZED`である。

## 33. Owner Approval Required

`YES`。

本ArtifactはH-01を破壊せず、既存Evidence、Source、Test、Status、Registry、Gitを変更していない。後続工程はOwner確認待ちで停止する。
