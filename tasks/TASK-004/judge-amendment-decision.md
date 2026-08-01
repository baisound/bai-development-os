# Judge Amendment Decision

## Metadata

- Authoring Role: Judge
- Active Project: `/home/baisound/projects/javascript-roulette`
- Active Task: `TASK-004`
- Scope: Phase 1 — D-05 / D-06 design amendment only
- Amendment Decision: `AMENDMENT_APPROVED_WITH_CONDITIONS`
- Canonical Judge Result: `APPROVED_WITH_CONDITIONS`
- Fix Cycle 3 Authorization: `NOT_AUTHORIZED`
- Implementation Authorization: `NOT_AUTHORIZED`

## Objective and Evidence

保存済みEvidenceだけを用いて、D-05のVERIFY cleanup／Crash Recovery完全性と、D-06のappend-only Log完全性／tamper／duplicate／MIGRATION_MAPPING検証に限定した設計改訂案を判定する。

比較したEvidence:

- `AGENTS.md`、`PROJECT.md`、`task.md`
- `final-plan.md`、`final-plan-consistency-check.md`
- `design-amendment-d05-d06.md`
- `implementation-report.md`、`implementation-fix-report.md`
- `test-report.md`、`retest-report.md`、`retest-report-02.md`
- Judge Role、Judge template、Common Workflow／Authority／Evidence／Artifact／Vocabulary specifications
- Architecture Ver.1.1およびTASK-004詳細設計 Ver.1.1

DOCXは同名Markdown／Text代替がないことを確認後、Artifact Specification指定の`python3 -c`抽出手順で読取した。Architecture Ver.1.1とTASK-004詳細設計 Ver.1.1のタイトル、Version、主要章、Scope、Out of Scope、必要な設計内容を確認した。

## Amendment Necessity

改訂は必要である。`retest-report-02.md`はD-01〜D-04をPASSとして記録する一方、D-05は`BLOCKING`、D-06は`NOT_CONFIRMED`として残している。現行Final Planには、全Crash boundaryのcanonical determination、Journal terminal状態、append-only Log verifier、tamper／duplicate／reorder検出、Migration Mapping validationを実装根拠として十分に固定する記述がない。

したがって、実装だけでD-05／D-06を補正すると、Recovery又はIntegrityの意味を実装側が選択することになる。これはEvidence First、Safe Stop、Historical Integrityに反する。

## Scope and Architecture Consistency

改訂案は、Snapshot、Transaction Journal、Transition Log、Lease、revision、checksum、recovery、migration validationの精密化だけを対象とする。

- Canonical Status Recordを現在値の唯一の正本として維持する。
- Journalはtransaction-localであり、Snapshot又はTransition Logの正本性を奪わない。
- D-01〜D-04のauthorization、fencing、PREPARED recovery、request validationを変更・緩和しない。
- Phase 2〜6、TASK-005 Knowledge、TASK-006 Registry／Automation、外部DB、分散transaction、非対象filesystemの実装を導入しない。
- Canonical 6 Roleを維持し、Lifecycle ManagerをSystem Componentとして扱う。

この範囲はArchitecture Ver.1.1の正本一意性、責務分離、Evidence First、Safe Stop、Historical IntegrityおよびTASK-004 Phase 1境界と整合する。

## D-01 Through D-04 Impact

`retest-report-02.md`に記録されたD-01〜D-04のPASSを再判定又は変更しない。改訂案は以下を保持する。

- 有効なAuthorization／Evidence検証。
- persisted Lease、generation、fencing、superseded transactionのCommit前検証。
- `PREPARED` recoveryにおける旧revision維持、Lease／Journal cleanup、回復Event。
- TransitionRequestおよびRecordの必須field／Task identity validation。

## Journal State Model

`PREPARED`、`APPLIED`、`VERIFIED`、`COMMITTED`、`ABORTED`、`RECOVERY_REQUIRED`、`SUPERSEDED`をtransaction-local Journal状態として採用する。

- `PREPARED`: 旧Snapshot／旧revision／既存Logが正本。候補とLeaseだけが存在する。
- `APPLIED`: Snapshot replacement済みでEvent未確定を表す。candidate identity、Snapshot revision／checksum／`last_transition_id`、Event checksum、前行checksumの全一致時だけEventを1回追記できる。
- `VERIFIED`: SnapshotとEventの相関を再読確認したJournal acknowledgement。二重の状態Commitではない。
- `COMMITTED`: `VERIFIED`後のみ到達可能なterminal Journal状態。再入又は重複Eventを禁止する。
- `ABORTED`／`SUPERSEDED`: Commit不可。旧正本を保持する。
- `RECOVERY_REQUIRED`: 不一致、改ざん、欠損、曖昧なdurabilityに対するno-write Safe Stop。推測修復、truncate、reorder、candidateの正本化を禁止する。

## Crash Recovery

改訂案のCrash Matrixは、Journal直後、candidate／VERIFY前後、VERIFY failure、VERIFY success／pre-COMMIT、snapshot replacement／pre-event、event confirmation／pre-Lease releaseを対象とする。

各境界で、canonical snapshot／logの決定、許容書込み、禁止書込み、revision処理、Event cardinality、Lease／candidate／Journal cleanup、再実行idempotenceを定義する必要がある。Snapshot replacement後にEventを追記するのは、候補Event、snapshot identity、revision、actors、tail checksumがすべて一致する場合に限る。不一致時は`RECOVERY_REQUIRED`で停止する。

## Append-only Integrity

以下を採用する。

- canonical JSON UTF-8、自己除外`entry_checksum`、`previous_entry_checksum`、`sha256:GENESIS`によるchecksum chain。
- transaction ID重複、COMMITTED resulting revision重複、schema不明、malformed JSON、checksum chain破断、outcome／revision不整合、Snapshot／Log不一致の拒否。
- verifier failure時の`COMMIT_STATE_UNKNOWN`又は同等のSafe Stop。
- Event／Logの削除、編集、再順序化、推測修復を禁止し、訂正は新Event・新revisionだけで表現する。

## Migration Mapping

`MIGRATION_MAPPING`は通常Transitionと別Recordであり、`mapping_id`、`source_task_id`、`legacy_expression`、完全な5軸`mapped_state`、`confidence`、非空`source_evidence`、`mapped_by`、`created_at`、自己除外checksumを必須とする。

source task／Evidence identity、checksum、dedup key、confidence、conflictを検証する。LOW confidence、conflict、欠損Evidence、checksum不一致、曖昧な旧表現は`NOT_CONFIRMED`で停止し、Canonical Status Recordを作成・更新しない。TASK-001〜003は読取・参照だけであり、移行完了、Closure、ArchiveをPhase 1で確定しない。

## Testability

Final Plan改訂では、少なくとも次を機械検証可能な要件にする必要がある。

1. Crash Matrix全境界の故障注入、snapshot bytes、revision、Event cardinality、Lease／candidate／Journal cleanup、recovery再実行idempotence。
2. snapshot／event checksum、transaction ID、actor、revision、prior checksumの不一致での`RECOVERY_REQUIRED`とno-write。
3. edited、deleted、reordered、duplicate-ID、duplicate-revision、broken-chain Logでのverifier Safe Stop。
4. superseded／duplicate committed transactionの重複Event防止。
5. Migration Mappingの型、nullability、checksum、task／Evidence identity、duplicate、LOW／conflict、歴史Artifact不変性。
6. D-01〜D-04 regressionの維持。

## Required Conditions

Final Plan amendmentを将来検討する場合、次を拘束条件とする。

1. `APPLIED→COMMITTED`を直接許可せず、`COMMITTED`は必ず`VERIFIED`後にだけ到達可能とする。
2. 全Journal状態の許可／禁止遷移、durable field、canonical authority、Lease所有／解放、cleanup順序、terminal性を明記する。
3. `ABORTED`、`RECOVERY_REQUIRED`、recovery／failure Eventの追記条件、reason／failure code、`expected_revision`／`resulting_revision`、checksum chain接続、追記不能時のSafe Stopを曖昧さなく定義する。
4. `COMMIT_STATE_UNKNOWN`、`CHECKSUM_MISMATCH`、duplicate／chain／migration検証失敗、`TRANSACTION_SUPERSEDED`、`STALE_FENCING_TOKEN`を既存Error Modelと調停し、互換alias又は明示的mappingを定義する。
5. Log verifierとMigration Mapping validatorのinput、validation、Safe Stop、dedup、historical preservationを明記する。
6. 対象環境をNode `v24.18.0`／Linux WSL2／同一ext4 filesystemに限定し、power-loss及び非対象filesystemをResidual RiskかつSafe Stop条件とする。
7. 限定的Final Plan amendment後に、独立したFinal Plan Consistency Checkを実施する。

## Residual Risk

- Node/WSL2/ext4同一filesystem以外のatomicity／durabilityは対象外であり、互換性を推測しない。
- 電源断時のfsync／rename durabilityは単体テストで立証できない。
- D-06のtamper、duplicate、reorder、migration validationと全Crash Matrixの実装・独立観測は未実施である。

## Critical and High Design Issues

- Confirmed unresolved Critical design issue: `0`
- Confirmed unresolved High design issue: `0`
- D-05は設計未統合のため`BLOCKING`。
- D-06は完全性影響のCritical／High非該当を独立観測前に確定できないため`NOT_CONFIRMED`。PASS又はAccepted Riskとして扱わない。

## Final Plan Amendment Eligibility

本Decisionは、Required Conditionsを完全に満たす**限定的Final Plan amendmentの設計上の適格性**を認める。ただし、Final Plan amendmentの作成・変更を認可しない。改訂後は再度のFinal Plan Consistency Checkが必要である。

## Authorization Impact

- Fix Cycle 3 Authorization: `NOT_AUTHORIZED`
- Implementation Authorization: `NOT_AUTHORIZED`
- Final Plan amendment authorization: このDecisionでは発行しない。
- Implementation Reviewは本Decisionの対象外であり、許可しない。

## Next Role / Artifact Information

Routing authorityはOrchestratorだけにある。Judgeは次Roleを指定しない。本Artifactは、Final Plan amendmentの適格性と拘束条件を記録するJudge成果物である。

## Result

`AMENDMENT_APPROVED_WITH_CONDITIONS`

## Unresolved Items

- Required Conditionsが現行Final Planに未反映である。
- D-05のCrash Recovery完全性とD-06のintegrity／migration validationは未実装・未試験である。
- Final Plan amendment、再Consistency Check、Fix Cycle 3実装には別途の権限と工程が必要である。

## Known Limitations

本判断は保存済みEvidenceに基づく設計判定であり、runtime、filesystem primitive、Crash Recovery、Log verifier、Migration Mapping validatorを実行又は検証したものではない。

## Handoff Information

Orchestratorへの報告事項: `/home/baisound/projects/javascript-roulette/docs/ai-team/tasks/TASK-004/judge-amendment-decision.md`、Decisionは`AMENDMENT_APPROVED_WITH_CONDITIONS`、Critical／High design issuesは`0/0`、Final Plan amendmentはRequired Conditions 1〜7を満たす場合のみ設計上適格、Fix Cycle 3 Authorizationは`NOT_AUTHORIZED`。
