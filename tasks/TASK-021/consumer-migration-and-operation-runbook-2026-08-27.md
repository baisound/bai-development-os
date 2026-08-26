# TASK-021 BAI VOICE APP migration and operation runbook

## Authority and immutable coordinates

- Consumer root: `D:\BAI\BAI VOICE APP`
- Consumer checkpoint: `415ac2ce1bcc5a38a3bdd366536d7350b3c64c14`
- Consumer Task: `TASK-001`, Canonical revision `13`
- Expected tuple: `ACTIVE / FINAL_PLAN / PASS / PENDING / NOT_ELIGIBLE`
- Existing Gate: `HG-TASK-001-DESIGN-ONLY-CLOSURE-001 / WAITING_OWNER`
- Minimum BAI Development OS package version: `1.2.0`
- Owner-approved Consumer operation/runtime coordinate: `d7532441f425f27303f6072624a80a454c74d84d`
- Canonical TASK-021 completion/Evidence commit: `89d6a91323bf62248dac893f7445debdd60d6eb7`

PR #33 introduced the executable lifecycle implementation at the first exact commit above. PR #34 then merged the Canonical TASK-021 completion and Evidence at the second exact commit; it contains the implementation commit as an ancestor but does not silently replace the Owner-approved Consumer operation coordinate. Execute the external OS runtime from `d7532441f425f27303f6072624a80a454c74d84d` and use `89d6a91323bf62248dac893f7445debdd60d6eb7` to verify current Canonical Governance/Evidence. A branch commit, abbreviated SHA, PR number, queue projection or copied OS Core is not a substitute. Availability of either commit does not bypass the signing/verifier/trust gates below.

## Confirmed read-only Consumer preflight — 2026-08-27

The BAI VOICE APP authority task reported that the Canonical `D:\BAI\BAI VOICE APP` repository is clean at exact HEAD/checkpoint `415ac2ce1bcc5a38a3bdd366536d7350b3c64c14`; TASK-001 is revision `13` with the expected tuple; and no transaction journal, legacy-attestation journal, audit append lock or lifecycle lease exists. These observations satisfy only the corresponding read-only preflight checks and MUST be revalidated immediately before any mutation.

The Owner has now explicitly approved TASK-001 `CLASSIFY_DESIGN_ONLY`, `COMPLETE_TASK`, `CANONICAL_STATE_COMMIT`, revisions 14/15, audit Evidence and queue recalculation against the exact OS commit above. This is the human decision and bounded Consumer Canonical-mutation authority; it is not yet the cryptographic runtime artifact.

The distinct signed Owner classification and `COMPLETE_TASK` envelopes, independent verifier attestations and protected trust material remain unconfirmed. Until they are loaded and validated from the existing protected environment, `HG-TASK-001-DESIGN-ONLY-CLOSURE-001` remains `WAITING_OWNER` and no classification, closure, queue activation or dependency-unblock mutation may run.

## Exact protected trust use

OS `1.2.0` does not contain a credential loader and the Consumer repository contains no tracked protected signing/verifier/snapshot material. Do not add keys to either repository and do not generate replacements under this authority. The authorized operator must inject existing protected-provider handles into the external OS runtime as follows:

1. Construct `LifecycleStore(taskDir, { projectRoot, designOnlySecurity })` with `taskDir` bound to `.bai-os/lifecycle/tasks/TASK-001` and `projectRoot` bound to the exact Consumer root.
2. `designOnlySecurity.get_authority_state()` must return the current `owner_public_key`, `owner_key_id`, `verifier_public_key`, `verifier_key_id`, integer `current_authority_epoch`, `revocation_proof_checksum`, exact `authority_ledger_coordinate` and `history_proof`. For later verified reads it must also expose `get_historical_authority_state(coordinate)` returning the matching state with `history_proof_verified: true`.
3. The protected Owner signer creates two distinct, unexpired envelopes outside the repository: classification binds `TASK_CLASSIFICATION` plus `CLASSIFY_DESIGN_ONLY`/`CANONICAL_STATE_COMMIT` to the revision-13 coordinate; closure binds `DESIGN_ONLY_CLOSURE` plus `COMPLETE_TASK`/`CANONICAL_STATE_COMMIT` to the resulting revision-14 coordinate. Reuse of an approval ID, preparation or envelope is forbidden.
4. The independent verifier validates the exact Owner envelope and current Authority Ledger/revocation state, then signs an `ALLOW` attestation bound to the same operation-coordinate checksum, Owner payload/signature checksums, Owner key checksum, authority epoch, ledger coordinate and history proof. Its private key remains in the independent protected verifier; only the signed attestation enters the bundle.
5. `designOnlySecurity.binding_private_key` and `binding_key_id` sign the short-lived result from `readVerifiedCanonical()`. Queue consumers verify it with the corresponding `canonical_status_trust` public key and expected key ID.
6. The existing snapshot coordinator receives those verified bindings and calls `createCanonicalQueueSnapshot(entries, { canonical_status_trust, snapshot_private_key, snapshot_key_id })`. Dependency and queue evaluation receive the returned manifest plus `canonical_snapshot_trust`; the coordinator private key never enters Task Evidence.

The runtime rejects missing, wrong-key, expired, revoked, stale-epoch, mismatched-ledger or self-consistent forged material with `DESIGN_ONLY_COMPLETE_TASK_AUTH_REQUIRED`, `CANONICAL_READ_NOT_VERIFIED`, `CANONICAL_SNAPSHOT_INVALID` or `QUEUE_COMPLETION_CANONICAL_MISMATCH`. Plain Owner text, a queue row or a copied public key is not a substitute for the signed artifacts and protected provider bindings.

## Preflight — no mutation

1. Resolve `git -C "D:\BAI\BAI VOICE APP" rev-parse 415ac2c` and require the exact checkpoint above. Record the current HEAD and working-tree state separately; do not reset, force or silently select a newer local commit.
2. Read TASK-001 Canonical Status directly and verify revision, checksum and the exact tuple above. Verify no unresolved transaction journal, legacy-attestation journal, lease or audit append lock.
3. Verify the OS runtime reports package `1.2.0` and the exact approved main merge commit. Do not add an OS runtime dependency or copy OS Core into the Consumer repository.
4. Drain the Consumer lifecycle writer. Create and checksum a recoverable backup of Canonical Status, transition log, preparations and audit receipts. Confirm lease/journal absence.
5. Load the distinct Owner classification/`COMPLETE_TASK` envelopes, Owner public-key trust, independent verifier attestations/public-key trust, Authority Ledger coordinate, Canonical Store binding signer/trust and snapshot-coordinator signer/trust from the existing protected environment. Credentials and keys remain separate Human Gates and are never embedded in the Consumer.

Any mismatch yields `DESIGN_ONLY_MIGRATION_NOT_READY`; stop without changing Canonical state.

## Shadow validation and single-writer cutover

1. Call `createDesignOnlyClosureMigrationPlan` with the full Consumer checkpoint, full approved OS main commit, `source_record_revision: 13`, and the exact preflight `source_record_checksum`. Require `writer_drained`, `lease_absent` and `journal_absent` true plus backup and Owner-authorization checksums.
2. Run `LifecycleStore.readVerifiedCanonical()` against the existing 1.1 record in shadow/read-only mode. An existing 1.1 completion needs `LEGACY_COMPLETION_ATTEST`; TASK-001 revision 13 is ACTIVE and uses classification plus closure instead.
3. Establish exactly one writer. Do not run old and 1.2 writers concurrently.

## Classification commit

1. Call `prepareDesignOnlyOperation('TASK_CLASSIFICATION')`; the Store creates a single-use preparation ID.
2. Build the exact Context Manifest and `DesignOnlyClassificationStatement`. Bind them to `createDesignOnlyOperationCoordinate` for Project/Task, revision 13, Canonical checksum, target schema 1.2 and classification `DESIGN_ONLY`.
3. Obtain a signed Owner envelope with `CLASSIFY_DESIGN_ONLY` and `CANONICAL_STATE_COMMIT`, and a current independent Authority Verification Attestation bound to that coordinate.
4. Dry-run by calling exported `validateDesignOnlyOperationBundle(bundle, { operation: 'TASK_CLASSIFICATION', current, preparation, security, clock })`. Require the returned coordinate checksum to equal the prepared bundle; dry-run never changes Canonical state.
5. Construct the request with exactly: `request_id`, `task_id`, `expected_revision`, the five-axis `from` and `to`, `reason_code`, `reason`, `requested_by`, `authorized_by`, `authorization_reference`, `evidence`, `operation_domain`, `operation_bundle`, `owner_authorized`, `closure_ready` and `record_patch`. For classification, `record_patch` contains only `task_classification: 'DESIGN_ONLY'` and `closure_ready` is false.
6. Execute `LifecycleStore.transition(request, appliedBy)` once. Verify the resulting revision 14 record and Event 1.2 chain, then call `LifecycleStore.readDesignOnlyReceipt(transition_id)`.
7. Receipt verification requires exact `transition_id`, `task_id`, `operation`, `resulting_revision`, `canonical_checksum`, `event_checksum`, `operation_audit_checksum`, four true durability acknowledgements and `content_checksum`. Do not continue on unknown durability or receipt state.

## Honest design-only closure commit

1. Run three independent Critic rounds. Each signed/recomputed Evidence artifact must resolve Critical/High to `0 / 0`.
2. Obtain the independent Judge decision `PASS_DESIGN_READY_FOR_CLOSURE`.
3. Call `prepareDesignOnlyOperation('DESIGN_ONLY_CLOSURE')` against revision 14.
4. Build `DesignOnlyClosureReadiness` and the exact Context Manifest. Set implementation authorization, implementation, testing, implementation review, final judgment and policy implementation deliverables to `NOT_APPLICABLE`; never emit fake phase Events.
5. Obtain a distinct signed Owner envelope with `COMPLETE_TASK` and `CANONICAL_STATE_COMMIT`, plus current independent verifier attestation.
6. Dry-run with exported `validateDesignOnlyOperationBundle(bundle, { operation: 'DESIGN_ONLY_CLOSURE', current, preparation, security, clock })`. Require zero mutation and exact coordinate/checksum equality.
7. Construct the same closed request fields listed above; closure has `owner_authorized: true`, `closure_ready: true`, no classification patch, and the exact closure target tuple.
8. Commit with `LifecycleStore.transition(request, appliedBy)`. Require resulting revision 15 and exact tuple `COMPLETED / CLOSURE / PASS / NOT_REQUIRED / REVIEW_PENDING` with classification `DESIGN_ONLY`.
9. Call `readDesignOnlyReceipt(transition_id)` and then `readVerifiedCanonical()`. The former first validates the complete append-only Log chain; the latter verifies the historical Authority proof and signs a short-lived binding. Verify the receipt fields above, Canonical checksum and the audit list of skipped phases where every `entered` value is false.

Native execution, paid provider use, credential creation, Production Activation, release/deploy, destructive operation and GitHub delivery remain separate Human Gates.

## Dependency and autonomous queue recalculation

1. Call `readVerifiedCanonical()` for every completed dependency. The Store generates each `observation_id`; callers cannot supply it.
2. Use `createCanonicalQueueSnapshot` to collect the reads and produce a signed, short-lived exact member manifest.
3. Call `evaluateDependencies` for TASK-002–009 with `project_id` set to the exact Consumer Project ID, the signed bindings and manifest. Every input Task row must carry that same Project ID. TASK-002 becomes ready only when TASK-001 was its sole unmet dependency. No result overrides another dependency, authority or Human Gate.
4. Call `selectAutonomousTask` with the same exact `project_id` and signed manifest. A cross-Project candidate is rejected before selection. A runtime-owned usage ledger with `consume_snapshot: true` can make selection single-use; actual durable dispatch remains protected by the existing outbox, idempotency and fencing controls.
5. Persist the dependency and queue result as Evidence only. Canonical Status remains the sole status authority.

## Failure, recovery and rollback

- Call `LifecycleStore.inspectDesignOnlyMigrationBoundary()` and pass that Store to `evaluateDesignOnlyRollback(plan, { lifecycle_store })`. The closed proof must exactly match the plan Project/Task/schema/revision/checksum and contain literal Boolean PONR/journal/lease flags; missing/non-Boolean flags, a caller Boolean, stale copy or another Store are rejected.
- Before the first 1.2 Record or durably appended valid Event 1.2 of any outcome, rollback is allowed only after writer drain and lease/journal absence: restore the checksummed backup and previous runtime.
- Once any Event 1.2 is appended, including `REJECTED` or `VERIFICATION_FAILED`, or any 1.2 Record commits, downgrade is forbidden. Restore the TASK-021 runtime and forward-recover.
- `PREPARED` without Canonical apply is abortable. `APPLIED`, incomplete acknowledgement, chain mismatch or receipt uncertainty is `COMMIT_STATE_UNKNOWN / RECOVERY_REQUIRED`; preserve all files and do not append a compensating completion.
- A legacy attestation event without its receipt is recovered from `legacy-attestation-journal.json`. An unexplained/stale `audit-append.lock` is fail-closed and requires authorized operator inspection; it is never auto-deleted by age alone.
- Consumer rollback never rewrites history and never changes queue projection in place of Canonical rollback.

## Completion evidence checklist

- exact Consumer and OS 40-character commits
- package version `1.2.0`
- backup checksum and single-writer proof
- Owner envelope and verifier attestation checksums
- classification and completion preparation IDs, Events and receipt checksums
- final revision/checksum and honest skipped-phase audit
- signed queue snapshot, dependency results and selected/parked queue result
- all remaining Human Gates
