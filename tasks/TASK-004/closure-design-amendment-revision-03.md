# TASK-004 Phase 5A — Closure Design Amendment Revision 03

## 1. Document Control

- Authoring Role: Lifecycle Closure Design Architect — Revision 03
- Active Project / Task: `/home/baisound/projects/javascript-roulette` / `TASK-004`
- Phase: Phase 5A — Completion Transition MVP
- Scope: H-03 only — eliminate bundle checksum cycles and post-commit mutation
- Allowed persistent file: this file only
- Result: `PHASE5A_DESIGN_REVISION_03_READY_WITH_CONDITIONS`
- Implementation Authorization: `NOT_AUTHORIZED`

## 2. Revision Authority

Owner Decision `Phase 5A Closure Design Revision 03: AUTHORIZED` authorizes only this limited design artifact. It does not authorize modifications to prior evidence, source, tests, status, registry, Git, Builder Response, Judge Decision, Final Plan, implementation, Completion, or Archive.

## 3. Source Evidence

- H-03 source: `closure-critic-rereview-02.md`
- Design/review chain: `closure-design-amendment.md`, `closure-critic-review.md`, Revisions 01–02, Re-reviews 01–02
- Phase 1 durability basis: `final-plan.md`, `final-plan-amendment-d05-d06.md`, `src/lifecycle/phase1/index.mjs`, Phase 1 tests
- Canonical architecture/lifecycle specifications
- Runtime result: `HOME=/home/baisound`、`UNAME=Linux`、`PHASE5A_REV03_RUNTIME_CHECK_COMPLETE`、exit code `0`

## 4. H-03 Finding

| Item | Extracted finding |
|---|---|
| Finding ID | `H-03` |
| Severity | `HIGH` |
| Affected sections | Revision 02 §§11, 15–16 |
| Current ordering | Step 6 creates COMMITTED Event containing Bundle checksum; Step 8 then writes COMMITTED Event reference/chain head into Bundle Manifest and journal acknowledgement |
| Circular dependency | Bundle checksum → COMMITTED Event → Event reference added to Bundle → Bundle checksum changes |
| Post-checksum mutation | Manifest/Journal data are changed after Event binds Bundle checksum |
| Expected invariant | Event-referenced Bundle checksum must identify immutable bytes; no post-checksum write may alter its checksum domain |
| Required correction | immutable payload/manifestとmutable Journal/Pointerを分離し、一方向のreference DAGとfinal write orderを定義する |
| Closure criteria | checksum cycleなし、post-commit mutationなし、Gateがimmutable manifest checksumでEvent/Pointer/Journalを照合可能 |
| Verification method | checksum domain、dependency DAG、tamper、crash、retry、same checksum/duplicate prevention tests |

## 5. Root Cause

Revision 02はBundleを単一checksum domainとして扱いながら、COMMITTED Eventを作成する前後にManifestとJournal acknowledgementを更新する。Phase 1 checksum helperはobject自身のchecksum fieldだけを除外する設計であり、COMMITTED Event referenceのような通常fieldを後から追加すればBundle bytesは変化する。

このため、immutable artifactとtransaction進行情報を同じchecksum domainへ混在させてはならない。

## 6. Design Correction Summary

採用する修正は、次の非循環3層分離である。

1. **Immutable Completion Payload**: completionの内容そのもの。payload checksum確定後に一切変更しない。
2. **Immutable Bundle Manifest**: Payloadの構成とchecksum、PREPARED Event reference、generation identityを固定する。COMMITTED Event IDは含めない。
3. **External Append-only Transaction Journal**: stage、acknowledgement、COMMITTED Event reference、pointer publish status、recoveryを記録する。Payload/Manifest checksum domainには含めない。

COMMITTED Eventはimmutable `manifest_checksum`を一方向に参照する。Manifest/PayloadはCOMMITTED Event ID、Journal状態、pointer状態、outboxを後から書き戻さない。

## 7. Integrity Domain Separation

```text
Status Snapshot ─┐
Completion Record├─> Immutable Completion Payload ─> payload_checksum
Evidence Manifest┘                                      │
Prepared Event reference ────────────────────────────────┤
                                                        ▼
                                           Immutable Bundle Manifest
                                                        │
                                                        ▼
                                                manifest_checksum
                                                        │
                                                        ▼
                                          COMMITTED Event / Global Log
                                                        │
                                      ┌─────────────────┴────────────────┐
                                      ▼                                  ▼
                            Append-only Journal                   Current Pointer
                                      │                                  │
                                      └──── Gate verification ───────────┘
```

矢印を逆方向にたどる参照は禁止する。Journal、Pointer、Outbox、Derived ViewはManifest又はPayload checksumの入力ではない。

## 8. Immutable Completion Payload

```yaml
completion_payload:
  schema_version: "1.2.0"
  transaction_id: UUID
  task_id: TASK-004
  project_id: javascript-roulette
  previous_revision: integer
  resulting_revision: integer
  status_snapshot: CanonicalStatusSnapshot
  completion_record: CompletionRecord
  evidence_manifest: EvidenceReference[]
  accepted_risks: AcceptedRisk[]
  follow_up_tasks: FollowUpReference[]
  knowledge_handoff_status: enum
  prepared_event_reference:
    transaction_id: UUID
    entry_checksum: sha256
  payload_checksum: sha256
```

PayloadはPREPARED Eventのdurable append後に一度だけ作成する。`payload_checksum`はpayload objectから自身のfieldだけを除外したcanonical JSON UTF-8 SHA-256である。COMMITTED Event、Journal、Pointer、outbox、recovery resultは含めない。

## 9. Immutable Bundle Manifest

```yaml
bundle_manifest:
  schema_version: "1.2.0"
  generation_id: UUID
  transaction_id: UUID
  task_id: TASK-004
  project_id: javascript-roulette
  payload_checksum: sha256
  status_checksum: sha256
  completion_record_checksum: sha256
  prepared_event_id: UUID
  prepared_event_checksum: sha256
  prepared_chain_head: sha256
  resulting_revision: integer
  manifest_checksum: sha256
```

ManifestはPayload checksum確定後に一度だけ作成し、`manifest_checksum`確定後は変更禁止である。`committed_event_id`、`committed_event_checksum`、`chain_head_after`、Journal stage、pointer status、outbox statusは含めない。

## 10. Mutable Journal Model

Journalはgeneration外のTask-local append-only transaction ledgerとする。

```text
<production-root>/tasks/TASK-004/transactions/<transaction-id>.journal.jsonl
```

各Journal entryは`journal_entry_id`、`transaction_id`、`stage`、`manifest_checksum`、`previous_journal_checksum`、`entry_checksum`、`durable_acknowledgement`、`committed_event_reference`（stageがCOMMITTED以後のみ）、`pointer_publish_status`、`recovery_status`、`updated_at`を持つ。

- Journal checksum chainはentryごとのcanonical JSON SHA-256であり、Payload/Manifest checksumとは別domainである。
- stageは`PREPARED → VERIFIED → COMMITTED`、又は`PREPARED → ABORTED`、任意stageから`RECOVERY_REQUIRED`とする。
- JournalはCOMMITTED後もCommit Certainty Evidenceとして保持する。cleanup対象はstaging temporary fileとleaseだけであり、COMMITTED Journalは削除しない。
- Journalのentry追加はPayload/Manifestの変更を意味しない。

## 11. Checksum Domain Definitions

| Checksum | Canonical serialization / algorithm | Included | Excluded | Recalculation | Mutation policy | Verification |
|---|---|---|---|---|---|---|
| `status_checksum` | canonical JSON UTF-8 / SHA-256 | Status全field | `content_checksum` | Status作成時のみ | immutable Payload内 | Payload/Manifest/Gate |
| `completion_record_checksum` | canonical JSON UTF-8 / SHA-256 | Completion Record全field | `record_checksum` | Record作成時のみ | immutable Payload内 | Payload/Manifest/Gate |
| `payload_checksum` | canonical JSON UTF-8 / SHA-256 | Payload全field | `payload_checksum` | Payload finalization時一回 | no rewrite | Manifest/Event/Gate |
| `manifest_checksum` | canonical JSON UTF-8 / SHA-256 | Manifest全field | `manifest_checksum` | Manifest finalization時一回 | no rewrite | COMMITTED Event/Journal/Pointer/Gate |
| `journal_entry_checksum` | canonical JSON UTF-8 / SHA-256 | Journal entry全field | `entry_checksum` | each append | append only | Journal verifier/Gate |
| `transition_event_checksum` | canonical JSON UTF-8 / SHA-256 | Global Event全field | `entry_checksum` | each append | append only | Global chain verifier |
| `global_chain_head` | last verified Event checksum | Global Log tail | n/a | Event append時 | advances only by append | Global chain verifier |

checksum versionは各artifactの`schema_version`とalgorithm identifier `sha256-canonical-json-v1`で固定する。

## 12. Non-circular Reference Model

参照方向は以下だけを許可する。

1. PREPARED Event → transaction/generation/expected revision（Manifest/Payload checksumを参照しない）。
2. Payload → PREPARED Event reference。
3. Manifest → Payload checksum、PREPARED Event reference。
4. COMMITTED Event → Manifest checksum、generation ID、transaction ID、resulting revision、PREPARED Event ID。
5. Journal COMMITTED entry → Manifest checksum、COMMITTED Event reference、pointer publish status。
6. Pointer → generation ID、Manifest checksum、transaction ID、COMMITTED Event reference、resulting revision。

Manifest/PayloadからCOMMITTED Event、Journal、Pointer、Outboxへの参照は禁止する。COMMITTED Event IDの解決はGlobal Logのtransaction ID＋manifest checksumによるlookupで行う。

## 13. Dependency DAG

```text
PREPARED Event
      ↓
Immutable Payload → payload_checksum
      ↓
Immutable Manifest → manifest_checksum
      ↓
COMMITTED Event → global chain head
      ↓
Journal COMMITTED entry
      ↓
Published Current Pointer
      ↓
Verified Derived Outbox
```

受入条件:

- dependency graphは有向非巡回グラフである。
- `Payload`又は`Manifest`へCOMMITTED Event/Journal/Pointer/Outboxからのedgeが存在しない。
- all checksum references are to already-finalized bytes.
- cycle検出時は`COMPLETION_CHECKSUM_CYCLE_DETECTED`でNo-write Safe Stopする。

## 14. Revised Transaction Ordering

1. Canonical Validated Read、Closure Readiness、authorization、revision、lease/fencingを検証する。
2. Journal `PREPARED` entryをappend+fsyncする。
3. Global `COMPLETION_PREPARED` Eventをappend+file fsync+directory fsync+exact rereadする。
4. Immutable Payloadを生成し、`payload_checksum`を一回確定する。
5. Immutable Manifestを生成し、`manifest_checksum`を一回確定する。
6. PayloadとManifestをstaging generationへwrite+fsyncし、staging directoryをfsyncする。
7. Payload/Manifest/PREPARED Event identity/checksumを再検証し、Journal `VERIFIED` entryをappend+fsyncする。
8. Global `COMPLETION_COMMITTED` EventをManifest checksumへboundしてappend+file fsync+directory fsync+exact rereadする。
9. Journal `COMMITTED` entryをCOMMITTED Event referenceとともにappend+fsyncする。
10. staging generationをpublished generationへrename+`generations/` directory fsyncする。
11. Current PointerをManifest checksum/COMMITTED Event referenceへboundしてwrite+fsync、atomic swap、task root directory fsyncする。
12. Commit Certainty Gateを実行し、PASS後のみderived outboxを生成する。
13. leaseとstaging残骸だけをcleanupする。

Payload/ManifestはSteps 6以降に書き換えない。Journal/Pointerの進行は外部append/replaceとして記録する。

## 15. Commit Certainty Gate Revision

`COMPLETED`を返すには以下が必須である。

1. Published generationとPointerが有効。
2. Immutable Payload checksumとManifest checksumが有効。
3. Payload内Status=`COMPLETED`、Completion Record、PREPARED Event referenceが一致。
4. Global chainがPASSし、matching PREPARED/COMMITTED Eventが存在。
5. COMMITTED Eventのmanifest checksum、generation ID、transaction ID、resulting revisionがManifest/Pointer/Payloadと一致。
6. Journal checksum chainがPASSし、latest valid transaction stageが`COMMITTED`、同じ Manifest/COMMITTED Eventを参照する。
7. durable acknowledgementがPASSし、Recovery/Superseded状態でない。

Manifest内にCOMMITTED Event IDは不要である。Global Logを`transaction_id + manifest_checksum + event_type=COMPLETION_COMMITTED`でlookupし、exactly one件を要求する。

## 16. Crash／Recovery Matrix

| Boundary | Immutable artifacts | Journal / Global Log / Pointer | Canonical read | Recovery / retry |
|---|---|---|---|---|
| Payload checksum前 | none | PREPARED Journal/Event | old state | abort or retry same transaction only after inspection |
| Payload後、Manifest前 | Payload fixed, no Manifest | PREPARED | old state | create one Manifest; Payload rewrite禁止 |
| Manifest checksum後、durability前 | Manifest fixed, staging uncertain | PREPARED | old state | Safe Stop if durability unknown |
| Payload/Manifest durable後、publish前 | both immutable | VERIFIED Journal, PREPARED Event | old state | append COMMITTED Event only after exact reread |
| Pointer publish後、COMMITTED Event前 | prohibited normal order | invalid observation | `COMPLETION_RECOVERY_REQUIRED` | Owner-only, no auto repair |
| COMMITTED Event append後、sync前 | immutable | Event durability unknown | old state | no duplicate append; retain evidence |
| COMMITTED Event durable後、Journal COMMITTED前 | immutable | VERIFIED Journal, committed Event | old state | append one COMMITTED Journal entry after exact binding |
| Journal COMMITTED後、Gate前 | immutable | committed Journal/Event, pointer may be absent | old state until pointer publish | publish same generation idempotently |
| Gate PASS後、Outbox前 | immutable/published | all committed | confirmed completed | create outbox once by idempotency key |
| Cleanup前 | immutable/published | committed Journal retained | confirmed completed | cleanup lease/temp only |

Any identity/checksum ambiguity results in `COMPLETION_RECOVERY_REQUIRED`; Payload/Manifest/Global Log are never altered to repair it.

## 17. Retry／Idempotency

- Same request replay uses the same `transaction_id` and must reproduce identical Payload/Manifest bytes and checksums.
- PREPARED Event is unique by transaction ID; COMMITTED Event is unique by `(transaction_id, manifest_checksum, resulting_revision)`.
- Journal stage replay is append-idempotent: an equivalent existing entry is observed, not duplicated.
- Pointer publish is idempotent only when its target generation, manifest checksum, transaction ID, event reference, and revision all match.
- Partial retry never creates a new Manifest checksum or mutates an existing Manifest.
- Superseded work uses a distinct transaction ID and cannot append a COMMITTED Event for the old revision.

## 18. Derived Consumer Rules

Derived consumer inputs are limited to:

- `readCanonicalTaskState()` PASS result
- matching COMMITTED Event
- Manifest checksum
- generation ID
- resulting revision
- Verified Outbox Event

Journal interim stage、raw Payload、raw Manifest、raw Global Log、pointer candidateはCanonical completionとして使用してはならない。

## 19. Error Codes

| Code | Meaning |
|---|---|
| `COMPLETION_PAYLOAD_CHECKSUM_MISMATCH` | Payload bytes/checksum mismatch |
| `COMPLETION_MANIFEST_CHECKSUM_MISMATCH` | Manifest bytes/checksum mismatch |
| `COMPLETION_MANIFEST_MUTATED` | final Manifest bytes differ after finalization |
| `COMPLETION_CHECKSUM_CYCLE_DETECTED` | dependency graph has a cycle |
| `COMPLETION_EVENT_MANIFEST_MISMATCH` | COMMITTED Event manifest binding mismatch |
| `COMPLETION_JOURNAL_CHAIN_MISMATCH` | Journal entry chain or binding mismatch |
| `COMPLETION_COMMIT_EVIDENCE_INCOMPLETE` | required immutable/mutable proof missing |
| `COMPLETION_STATE_UNKNOWN` | public Safe Stop result |
| `COMPLETION_RECOVERY_REQUIRED` | Owner-authorized recovery required |

Existing Phase 1 `CHECKSUM_MISMATCH` / `COMMIT_STATE_UNKNOWN` remain internal causes and are mapped to the Phase 5A result without losing cause details.

## 20. Test Additions

- Payload finalization後の変更検出、Manifest finalization後の変更検出。
- Journal、COMMITTED Event、Pointer、Outboxの更新がPayload/Manifest checksumを変えない。
- ManifestがCOMMITTED Event IDを含まない。
- COMMITTED EventがManifest checksumを参照し、Manifestの後追い再計算を要求しない。
- checksum dependency graph cycle検出。
- Payload/Manifest/Journal/Event/generation/revision改ざん検出。
- Manifest確定後、Pointer publish後、COMMITTED Event前後、Journal COMMITTED前後のCrash。
- Retry時のPayload/Manifest checksum不変、duplicate Event/Manifest/Journal entryなし。
- H-01/H-02 tests、D-01〜D-06、append-only History、generation/pointer visibility、non-`COMPLETED` read regression。

## 21. Backward Compatibility

Revision 03はH-01のGeneration/Pointer visibility boundaryとH-02のGlobal Logを変更しない。変更はBundle内部のchecksum domain分離だけである。

Phase 1 fixture、`1.1.0` Event schema、existing Historical Evidenceは変更しない。Production State/Bundle schemaは未実装の`1.2.0`であり、in-place migrationは不要である。

## 22. Schema Versioning

- Completion Payload schema: `1.2.0`
- Bundle Manifest schema: `1.2.0`
- Transaction Journal entry schema: `1.2.0`
- Global Event schema: `1.1.0` with additive `event_type`
- Existing Phase 1 parser: existing entriesへの互換を維持する

`1.2.1`は不要である。production `1.2.0`はまだ作成・公開されておらず、本Revisionを初回schemaに含められる。

## 23. Owner Decision Impact

5つの推奨案は変更しない。

- Root/Git: JournalとGlobal Logの外部pathをOption Bのapproved production root内に確定する。
- Cost: Completion Record/PayloadへのCost Ledger referenceを含める。
- Record format: canonical JSON payload/recordが前提であり、Markdownは派生物に留める。
- Derived consumer: mutable JournalではなくValidated Read/Outboxを消費する。
- Authorization: used/revocation auditはJournal又は別append-only auditで扱い、Payload/Manifestへ後追い書込みしない。

## 24. Required Changes to Revision 02

Revision 02を直接編集しない。将来Final Planでは以下をRevision 03で置換・補強する。

- Bundleを単一checksum domainとして扱う記述をPayload/Manifestへ分割する。
- `COMMITTED Event → Bundle Manifest書込み`を削除する。
- COMMITTED Event ID/checksumとpointer publish statusをexternal Journal/Pointerへ移す。
- Global COMMITTED Eventがimmutable `manifest_checksum`だけを参照するよう固定する。
- Bundle内の`journal.json`をgeneration外のappend-only transaction journalへ置換する。

## 25. Required Final Plan Changes

1. Payload、Manifest、Journal、Pointer、Global Eventの完全schema。
2. checksum domain、excluded self-checksum field、algorithm/version、verification order。
3. DAG validationとpost-finalization mutation rejection。
4. non-circular transaction ordering、fsync、directory fsync、exact reread。
5. Journal retention、recovery authority、idempotency/duplicate prevention。
6. H-03 Crash/Tamper/Retry testsとH-01/H-02/D-01〜D-06 regression。

## 26. Acceptance Criteria Additions

- Payload/Manifest checksum domainsにJournal/Event/Pointer/Outboxが含まれない。
- COMMITTED Eventはexactly one immutable Manifest checksumを参照する。
- Manifest/Payloadはfinalization後に変更されない。
- all checksum dependencies form a DAG.
- Gateはimmutable checksums、Global Log、Journal、Pointerを照合してのみ`COMPLETED`を返す。
- retry/recoveryは新checksum又は重複Eventを作らない。

## 27. Risks

- Immutable artifactsとappend-only Journalの二層化により実装量は増える。
- Journal retentionはruntime storage/backup policyを必要とする。
- full-chain verificationの性能コストは残るが、Integrityを理由に省略できない。
- Owner Decision 1〜5が未確定のためFinal Planは作成できない。

## 28. Open Questions

H-03のchecksum-cycle設計は確定した。未確定事項はOwner Decision 1〜5のみである。

- production root/Git policy
- Actual-cost ledger authority
- human Markdown派生の必須性
- outbox consumer
- authorization audit/revocation storage

## 29. Recommended Next Role

Owner確認後の独立Critic re-reviewが望ましい。これは助言であり、本Revisionは次Roleを起動しない。

## 30. Recommended Next Artifact

Owner認可後の新規Critic Re-review 03 Artifact。既存Evidenceを変更しない。

## 31. Gate Readiness

`NOT_READY`。

H-03設計は`PHASE5A_DESIGN_REVISION_03_READY_WITH_CONDITIONS`である。Critic re-review、Owner Decision 1〜5、Builder Response、Judge Decision、Final Plan、Consistency Check、explicit Implementation Authorizationまで実装は`NOT_AUTHORIZED`である。

## 32. Owner Approval Required

`YES`。

本ArtifactはH-01/H-02を維持し、既存Evidence、Source、Test、Status、Registry、Gitを変更していない。後続工程はOwner確認待ちで停止する。
