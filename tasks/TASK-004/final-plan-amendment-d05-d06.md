# Final Plan Amendment (D-05 / D-06)

## 1. Document Control

- **Authoring Role**: Builder
- **Active Project**: `/home/baisound/projects/javascript-roulette`
- **Active Task**: `TASK-004`
- **Phase**: Phase 1 — Canonical State Foundation
- **Created At**: 2026-07-29

## 2. 親Final Planとの正本関係

本ドキュメントは、承認済みの親Final Plan (`docs/ai-team/tasks/TASK-004/final-plan.md`) の正本性を破壊・置換するものではありません。親Final Planで未定義または不十分であった D-05 (VERIFY failure cleanup / Crash Recovery completeness) および D-06 (Append-only integrity / Tamper detection / Migration validation) に対する**差分修正（限定パッチ）**として機能します。競合する場合、本ドキュメント（Amendment）の D-05/D-06 関連要件が優先されます。

## 3. Judge条件1〜7の対応表

| 条件番号 | 要求内容 | 本Amendmentでの対応セクション / 内容 |
|---|---|---|
| 1 | `APPLIED→COMMITTED`直接遷移禁止、`COMMITTED`は`VERIFIED`後のみ到達可能 | Section 5 (Journal State Model) にて直接遷移を禁止し、`VERIFIED` 経由を必須化。 |
| 2 | 全Journal状態の許可/禁止遷移、durable field、Lease所有/解放、cleanup順序の明記 | Section 5 および 6 (Crash Recovery Matrix) にて遷移制限とLease・cleanupの原子性を定義。 |
| 3 | `ABORTED`, `RECOVERY_REQUIRED`, Recovery/Failure Eventの条件、checksum chainの明記 | Section 5, 7, 8 にて、条件と failure event の追記要件、checksum chain の維持条件を定義。 |
| 4 | Error Modelとの調停 (`COMMIT_STATE_UNKNOWN`, `TRANSACTION_SUPERSEDED` 等) | Section 15 (Implementation Delta) にて、Error Modelの拡張と既存CodeへのMappingを定義。 |
| 5 | Log verifierとMigration Mapping validatorの要件明記 (dedup, historical preservation) | Section 10〜13 にて、VerifierとValidatorの必須チェック項目（推測修復の禁止、重複検知等）を定義。 |
| 6 | 対象環境の限定と power-loss/非対象 filesystemの Residual Risk 扱い | Section 19 (Residual Risk) にて Node v24.18.0 / WSL2 / ext4 同一FS限定を宣言し、それ以外をSafe Stop条件に設定。 |
| 7 | 限定的Final Plan amendment後、独立したConsistency Checkの実施 | Section 20 および Handoff Information にて明記。 |

## 4. D-05／D-06だけを対象とするScope

本Amendmentは以下**のみ**を対象とします。
- **D-05**: VERIFY失敗時の安全なCleanupと、Crash境界での復旧状態・遷移の確定。
- **D-06**: Append-onlyログにおける改ざん検知（Tamper Detection）、重複防止（Duplicate Prevention）、順序検証、および Migration Mapping の正確性検証。

**対象外**: D-01〜D-04で確立済みのAuthorization, Fencing, PREPARED recovery基本フロー、Phase 2以降の設計、Architecture Ver.2.0への変更等は一切含みません。

## 5. Journal State Model

トランザクションローカルなJournalにおける状態と遷移を以下の通り厳格化します。

| State | 意味と遷移規則 |
|---|---|
| `PREPARED` | Candidate Snapshot/Eventがdurableになった初期状態。`APPLIED`, `ABORTED`, `RECOVERY_REQUIRED` へ遷移可能。 |
| `APPLIED` | Snapshot rename完了。**`COMMITTED`への直接遷移は禁止**。`VERIFIED` または `RECOVERY_REQUIRED` へ遷移する。 |
| `VERIFIED` | Rename後のSnapshotとEventの相関を再検証した状態（Acknowledgement）。`COMMITTED` または `RECOVERY_REQUIRED` へ遷移する。 |
| `COMMITTED` | `VERIFIED` 後にのみ到達可能な**終端状態**。Lease解放およびJournal cleanupが許可される。再入や重複Eventは禁止。 |
| `ABORTED` | VERIFY失敗時、またはSnapshot置換前の異常時。旧Snapshot/revision維持。Lease解放、Candidate削除。 |
| `SUPERSEDED` | 同一expected_revisionに対して後発の有効トランザクションがCommitされた状態。Commit不可。 |
| `RECOVERY_REQUIRED` | データ矛盾・改ざん・欠損等による**No-write Safe Stop**。Snapshot/Log/Leaseの推測修復や削除を禁止。手動またはOwner指示の復旧を要する。 |

## 6. Journal Transition Matrix

- **許可される正規ルート**: `PREPARED` → `APPLIED` → `VERIFIED` → `COMMITTED`
- **失敗・中断ルート**: `PREPARED` → `ABORTED` / `SUPERSEDED`
- **異常停止**: 任意の状態で不整合検知時 → `RECOVERY_REQUIRED`
- **禁止**:
  - `APPLIED` → `COMMITTED`
  - `ABORTED` / `COMMITTED` / `SUPERSEDED` → `PREPARED` (逆戻り禁止)
  - `RECOVERY_REQUIRED` → `COMMITTED` (推測による強行禁止)

## 7. VERIFY Failure Protocol

- VERIFYフェーズ（Candidate評価中）で失敗を検知した場合、Journalを `ABORTED` に移行する。
- 旧Canonical Snapshot（元の状態）は変更せずに維持する。
- 失敗理由（reason/failure code）を持つ `VERIFICATION_FAILED` Eventを、有効なtail checksumにチェーンする形で追記する。
- 追記後、Leaseを解放し、Candidateを破棄（Cleanup）する。
- VERIFY Failureからの再試行は新たな `transition_id` および新Leaseで実行しなければならない。

## 8. Crash Recovery Matrix

電源断等のCrash後の復旧時の境界と振る舞いを定義します。

| Crash 境界 | 検知・判断基準 | Recovery 処理 |
|---|---|---|
| Journal生成直後 | `PREPARED`状態。Snapshot未置換。 | Candidate破棄、Lease解放、`ABORTED`。回復Event 1件を追記。 |
| VERIFY 前後 | `PREPARED`だが検証結果不明・失敗。 | Snapshot未置換のまま`ABORTED`。回復Event追記。 |
| Snapshot置換後 (Event追記前) | `APPLIED`。Snapshotのrevision/checksumとCandidate Eventの整合性確認。 | 完全に一致する場合のみEventを追記し`VERIFIED`→`COMMITTED`へ。不一致は `RECOVERY_REQUIRED`。 |
| Event追記後 (Lease解放前) | SnapshotとEventの完全一致が確認可能。 | `COMMITTED`へ移行、Lease解放、Journal削除。Event再追記はしない（Idempotent）。 |

## 9. Commit PointとCanonicality

- **Commit Point**: Journalが `COMMITTED` に更新された瞬間。
- **Canonicality**: Canonical Status Recordが唯一の正本（現在値）。Transition Logは監査履歴。Journalはローカルな状態機械であり、これら正本を上書きする権限を持たない。

## 10. Append-only Integrity

- 各EventはCanonical JSON UTF-8でシリアライズする。
- `entry_checksum` は自身を除外したEventのSHA-256。
- `previous_entry_checksum` は直前のEventの `entry_checksum` （初回は `sha256:GENESIS`）と一致しなければならない。
- Eventの既存行に対する編集、削除、再順序化、および推測修復を一切禁止する（No-write Safe Stop）。

## 11. Tamper Detection

Log Verifierは全行を順次読み込み、以下を検知した場合に `COMMIT_STATE_UNKNOWN` または `CHECKSUM_MISMATCH` としてSafe Stopする。
- Checksum chainの破断 (`previous_entry_checksum` 不一致)。
- 不正な `entry_checksum`。
- Schema外の形式、Malformed JSON。
- SnapshotのrevisionとLog末尾のresulting_revisionの不整合。

## 12. Duplicate Prevention

- 同一 `transition_id` の重複Eventを拒否する。
- `COMMITTED` Outcomeを持つ同一 `resulting_revision` の重複Eventを拒否する。
- 回復時（Recovery）においても、既に有効なEventが存在する場合は二重に追記しない。

## 13. MIGRATION_MAPPING Validation

- `MIGRATION_MAPPING` は参照用レコードである。
- `source_task_id` および Evidence のIdentity/Checksumが歴史的Artifact（不変）と一致するか検証する。
- `mapping_id` または Source Evidenceの重複マッピングを拒否する。
- 信頼度 `LOW` または Conflict検知、Checksum不一致、曖昧な旧表現の場合は `NOT_CONFIRMED` で停止し、Status Recordは生成・更新しない。
- Validatorは歴史的Artifact（TASK-001〜003等）を一切編集してはならない。

## 14. Recovery Authority

`RECOVERY_REQUIRED` または `COMMIT_STATE_UNKNOWN` に陥った場合、自動的な推測復旧（Truncate, Repair等）は禁止される。
復旧には、OwnerまたはJudgeによる明示的な新しいAuthorizationと、手動または承認済みの専用Recovery手順を用いたNo-write状態からの離脱が必要である。

## 15. Implementation Delta

既存の D-01〜D-04 実装に対する追加・変更点（Delta）。
1. **Journal Schema拡張**: `VERIFIED`, `RECOVERY_REQUIRED` 状態の追加。
2. **Error Model Mapping**:
   - Verify失敗等 → `VERIFY_FAILED`
   - Log不正/Checksum不一致 → `CHECKSUM_MISMATCH`
   - Crash時判定不能 → `COMMIT_STATE_UNKNOWN`
   - Lease競合/陳腐化 → `TRANSACTION_SUPERSEDED`, `STALE_FENCING_TOKEN`
3. **Log Verifierの追加**: 起動時・復旧時にLog全行のTamper/Duplicate/Chain検証を行うロジックの実装。
4. **Migration Validatorの追加**: MIGRATION_MAPPING専用のRead-only検証ロジックの実装。

## 16. Test Matrix

機械検証可能なテスト要件。
1. **Crash Injection**: Crash Recovery Matrixの全境界でクラッシュを模擬し、idempotentな回復または `ABORTED` によるCleanupをアサートする。
2. **Tamper/Mismatch**: Snapshot/Eventのchecksum、revision、transaction_idを意図的に破損させ、`RECOVERY_REQUIRED` (No-write) をアサートする。
3. **Duplicate Prevention**: 既にCommit済みの `transition_id` または `resulting_revision` を再試行し、拒否されることをアサートする。
4. **Migration Validation**: 不正な `source_task_id`、`LOW` confidence、重複mappingを注入し、`NOT_CONFIRMED` および歴史的ファイル無変更をアサートする。

## 17. Acceptance Criteria

- D-05 (VERIFY Cleanup & Recovery) に関して、全Crash状態が明確な状態遷移（`ABORTED`, `VERIFIED`, `RECOVERY_REQUIRED` 等）へマッピングされていること。
- D-06 (Log Integrity) に関して、Checksum Chainの検証、重複防止、改ざん検知のロジック仕様が明確であり、推測修復が禁止されていること。
- 親Final Plan (D-01〜D-04の挙動) との間に矛盾がないこと。

## 18. Rollback

本設計（D-05/D-06）に基づくLogおよびSnapshotはAppend-only原則に従うため、ファイルの上書きによるRollbackは行わない。
誤った操作の取り消しは、新たなRevisionに基づく新Event（例: Cancellation Event）の追記によって論理的に行う。

## 19. Residual Risk

- **環境依存性**: 本設計は `Node v24.18.0` / `WSL2` / 同一 `ext4` ファイルシステム上の atomic rename / fsync の挙動を前提としている。これ以外の環境、またはDevice Persistence Barrier到達前の電源断（fsync未完了）については、Unit Testで証明不可能な **Safe-Stop条件**（Residual Risk）として扱う。

## 20. Deferred Items

- 実装の認可（Fix Cycle 3の実装）
- Schema Version `1.1.0` への実際のコード追従
- Phase 2 以降のCheckpoint/Resume運用
- Architecture Ver.2.0 および Registry/Context Economy 基盤の更新

---

- **Final Plan Amendment Result**: `READY_FOR_AMENDMENT_CONSISTENCY_CHECK`
- **Judge条件1〜7の反映状況**: 1〜7すべて反映済み (Section 3に対応表記載)
- **Critical／High設計Issue件数**: 0件
- **Fix Cycle 3 Authorization**: `NOT_AUTHORIZED`
- **Next Role**: Judge
- **Next Artifact**: `final-plan-consistency-check-amendment-d05-d06.md`
