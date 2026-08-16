# BAI DEVELOPMENT OS — Autonomous Worklane & Durable Dispatch 詳細設計 R4

Status: THREE_CRITICS_COMPLETE_JUDGE_R1_R2_REVISE_R3_CONDITIONAL_PASS_R4_FINAL_CONFIRMATION_PENDING
Authority: DESIGN_AND_READ_ONLY_ANALYSIS_ONLY
Repository mutation: NONE
Runtime/external effect: NONE

## 1. 問題定義

現行OSはTask選択、Human Gate parking、Context/Handoff、Session Lease、Authority fail-closedを個別契約として持つが、実Codex taskへ確実に配送し、Atomic Unit終端から次Unitへ連続遷移し、停止した担当を安全に再開・移管する常駐制御面を持たない。さらにOrchestratorだけが次Roleを送る規則により、設計担当が全Unitの直列中継点となる。結果として、設計担当不在、配送API停滞、Authority packet再発行待ち、担当変更、過剰な進捗報告のいずれでも開発が停止する。

## 2. 目標

1. Ownerが与えたstanding authority内では、担当laneが設計担当の中継なしで自走する。
2. Human Gateや一部capability blockerがあっても、競合しないsafe fallbackを自動選択する。
3. Task間指示をdurable/idempotentに配送し、busy・一時障害・重複で失わない。
4. Atomic Unit終端を次Unit生成またはexact Gateへ原子的に接続する。
5. branch/PR/file/working-tree/authority ownershipを一つのlane契約へ統合する。
6. routine progressを会話に流さず、Owner decision・重大incident・顧客価値milestoneだけを通知する。
7. Design完了とProduct完了を機械的に区別する。

## 3. 非目標と不変条件

- Owner Authority、Policy、Security、Judgeを自動生成・拡大しない。
- Release、Deploy、録音、保存、購入、credential、destructive cleanup等は明示capabilityなしに実行しない。
- UNKNOWN、dirty ownership、branch conflict、external effectの結果不明をPASSへ昇格しない。
- Orchestratorを廃止しない。Orchestratorはlane編成、Authority/Gate境界、設計変更、例外routingを担当する。
- Builder/Critic/Judgeの独立性を維持する。自走は既承認scope内の実行継続だけである。

## 4. アーキテクチャ

### 4.1 Worklane Registry

新規 `AutonomousWorklaneV1` をCanonical coordination recordとして導入する。

Required fields:
- lane_id, project_id, repository_id, task_set
- primary_actor_id, backup_actor_id nullable
- branch_patterns, pr_set, owned_paths, shared_paths
- authority_grant_refs
- allowed_capabilities, denied_capabilities
- external_effect_policy
- current_atomic_unit, next_unit_policy
- fallback_task_ids
- reporting_policy_ref
- lease_ref, checkpoint_ref
- lane_state, revision, content_checksum

lane_state:
`PLANNED | RUNNABLE | ACTIVE | GATE_PARKED | RECOVERY_REQUIRED | HANDOFF_PENDING | COMPLETED | REVOKED`

Invariant:
- one mutable resource has at most one active writer lane;
- shared path write requires Integration Lock;
- one branch has exact one execution owner;
- backup cannot execute while primary lease is valid;
- Authority grants are references, not copied prose.

### 4.2 Standing Authority Ledger

`StandingAuthorityGrantV1` fields:
- authority_id, issuer, subject_actor_ids
- project/task/lane/repository scope
- action capabilities (`READ`, `DESIGN`, `WRITE`, `ACQUIRE`, `INSTALL`, `CONFIGURE`, `BUILD`, `TEST`, `READY`, `MERGE`, `DELETE_MERGED_BRANCH`, etc.)
- allowed paths/targets and denied effects
- valid_from, valid_until or `UNTIL_TASK_SET_COMPLETE`
- awake_sleep_applicability independent of UI presence
- inheritance rule and explicit exclusions
- revocation/supersession chain
- evidence checksum

Evaluation is intersection-only:
`effective = requested action ∩ lane scope ∩ current grant ∩ safety policy`.
No component may broaden another. Owner awake/asleep is not an Authority condition unless explicitly present in the grant.

### 4.3 Durable Dispatch Outbox

`DispatchEnvelopeV1`:
- message_id, idempotency_key
- source_lane, target_lane/actor
- task/unit/authority/checkpoint refs
- command class, exact payload digest
- created_at, not_before, deadline
- delivery_attempt, max_attempts
- state `PENDING|LEASED|DELIVERED|ACKED|REJECTED|DEAD_LETTER`
- prior envelope ref for supersession

Protocol:
1. Producer appends PENDING before delivery.
2. Dispatcher acquires bounded delivery lease.
3. Target ACK binds message_id, payload digest, target session and accepted/rejected reason.
4. ACK timeout returns message to PENDING with bounded exponential backoff.
5. Same idempotency key cannot create a second effect.
6. max attempts moves to DEAD_LETTER and triggers one exception event; it never silently disappears.
7. Chat/UI delivery is an adapter; Outbox is Source of Truth.

### 4.4 Autonomous Lane Runner

Loop:
`RECONCILE -> SELECT -> AUTH_CHECK -> LOCK -> DISPATCH -> EXECUTE_QUANTUM -> VERIFY -> COMMIT_CHECKPOINT -> TERMINAL_TRANSITION -> SELECT_NEXT`

Each quantum is bounded by expected runtime, files, commands/effects, stop conditions and validation. The runner may continue without Orchestrator only when:
- lane RUNNABLE/ACTIVE;
- lease valid and owned;
- requested capability covered by current authority;
- head/checkpoint/owned paths match;
- no new blocking Gate;
- next unit is same approved objective and does not change architecture/safety/acceptance semantics.

Any architecture, authority, scope, protected-path, major validation or external-effect expansion routes to Orchestrator/Owner.

### 4.5 Terminal-to-Next Transaction

`AtomicUnitTerminalV1` distinguishes:
- `PASS_CONTINUE`
- `PASS_LANE_COMPLETE`
- `FAILED_KNOWN_REPAIRABLE`
- `GATE_PARKED`
- `RECOVERY_REQUIRED`
- `UNKNOWN_STOP`

The transaction atomically writes:
1. terminal Evidence reference;
2. updated checkpoint;
3. lifecycle transition;
4. either next DispatchEnvelope or Gate record;
5. progress event.

There is no state where a terminal is recorded but neither next envelope nor exact Gate exists. `FAILED_KNOWN_REPAIRABLE` may self-generate a correction quantum only if files/capabilities/acceptance invariants remain inside the same authority. Retry must have a changed hypothesis or changed patch; identical retry is rejected.

### 4.6 Gate Parking and Fallback

HumanGate `non_blocking_candidates` becomes executable policy rather than descriptive metadata.

Algorithm:
1. Park only capabilities/resources blocked by the Gate.
2. Filter fallback candidates by dependency, authority, ownership, lock, context and effect isolation.
3. Select highest Owner priority candidate.
4. If none, create `NO_SAFE_FALLBACK` exact blocker and one notification.
5. On Gate satisfaction, re-evaluate freshness before resuming; do not replay stale action.

`safe_to_continue_other_tasks=false` may block only explicitly named shared safety domain. It must not globally zero unrelated lanes without a `system_scope` binding.

### 4.7 Lease, No-progress Detection and Safe Takeover

Lease adds:
- actor/lane/resource scope;
- epoch/fencing token;
- progress_at and progress_kind;
- process/job receipt for long-running builds;
- takeover policy.

Suggested operational defaults, policy-configurable:
- dispatch ACK SLA: 60 seconds;
- active progress/checkpoint SLA: 10 minutes;
- long process heartbeat: 2 minutes;
- three missed observations -> `STALE_CANDIDATE`.

Automatic takeover is allowed only when:
- lease expired and fencing epoch can advance atomically;
- previous process is proven absent;
- checkout head/checkpoint match;
- worktree clean or all dirty paths are checkpoint-owned and recoverable;
- no external effect is in UNKNOWN state;
- backup actor has equal required authority.

Otherwise route `RECOVERY_REQUIRED`; never run two actors concurrently.

### 4.8 Branch Lifecycle Reconciler

States:
`DISCOVERED | OWNED | PR_OPEN | READY | MERGEABLE | MERGED | CLEANUP_ELIGIBLE | CLEANED | BLOCKED`

Merge requires exact base/head, hosted checks, review/Gate, lock/overlap and authority revalidation immediately before effect. After each merge, refresh main and re-evaluate remaining branches serially.

Cleanup eligibility requires:
- PR MERGED or independently verified merge receipt;
- branch tip reachable from current origin/main;
- no unpushed/uncommitted work;
- no active worktree or lock;
- not protected/main;
- explicit `DELETE_MERGED_BRANCH` capability.

Delete local first, remote second, then fetch/prune and read-back absence. UNKNOWN blocks deletion.

### 4.9 Reporting and Notification Policy

Event classes:
- `ROUTINE_PROGRESS`: durable ledger only, no chat.
- `MAJOR_MILESTONE`: Owner/Secretary summary once.
- `OWNER_DECISION_REQUIRED`: Owner notification with exact choices and effect.
- `SECURITY_OR_DATA_INCIDENT`: immediate Owner/Secretary notification.
- `DELIVERY_DEAD_LETTER` or `NO_SAFE_FALLBACK`: operational escalation.

Design/Orchestrator receives routine progress only on explicit subscription. Reports are deduplicated by event key and milestone revision.

### 4.10 Completion Taxonomy and UI Guard

Independent state axes:
- `DESIGN_COMPLETE`
- `IMPLEMENTATION_COMPLETE`
- `BUILD_PACKAGE_COMPLETE`
- `INSTALL_COMPLETE`
- `LOAD_VERIFIED`
- `FUNCTIONAL_ACCEPTANCE_COMPLETE`
- `MANUAL_COMPLETE`
- `PRODUCT_COMPLETE`

`PRODUCT_COMPLETE` is a derived conjunction under a product-specific completion policy plus canonical Judge PASS. A child Atomic Unit completion must never be rendered as Product completion. UI labels must include scope, e.g. `設計契約完了（実装未完）`.

## 5. Role model correction

Replace “Only Orchestrator routes every next Role” with:
- Orchestrator exclusively creates/changes lane scope, Authority interpretation, Gate boundaries and cross-lane routing.
- A lane runner may route the next bounded quantum within an already approved lane envelope.
- Builder returns terminal Evidence to the lane ledger, not necessarily to an Orchestrator conversation.
- Critic/Judge remain independently invoked at policy-defined Gates.

This removes central relay dependence without allowing Builder self-authorization or self-judgment.

## 6. Failure and recovery matrix

- Delivery API busy: retain PENDING, retry bounded, no duplicate effect.
- Target rejects scope: REJECTED + exact reason; no automatic broadening.
- Design agent absent: existing lanes continue; new scope changes park.
- Builder terminal without next: transaction invalid, reconciler creates repair incident; never idle silently.
- Human Gate: blocked unit parks; isolated fallback continues.
- Lease expires during build: process receipt prevents takeover until absence/reconciliation.
- External effect timeout: UNKNOWN_STOP; read-reconcile only, no retry.
- Dirty unknown files: RECOVERY_REQUIRED.
- Authority revoked: fence lane, invalidate pending envelopes.
- Branch merge drift: stop before merge and re-evaluate.
- Post-merge cleanup drift: preserve branch and report blocker.
- Reporting adapter down: ledger continues; critical event enters notification outbox.

## 7. Proposed implementation surface (not authorized now)

New:
- `schemas/automation/autonomous-worklane.schema.json`
- `schemas/automation/standing-authority-grant.schema.json`
- `schemas/automation/dispatch-envelope.schema.json`
- `schemas/automation/atomic-unit-terminal.schema.json`
- `schemas/automation/progress-event.schema.json`
- `schemas/automation/branch-lifecycle.schema.json`
- `src/automation/worklane.mjs`
- `src/automation/authority-ledger.mjs`
- `src/automation/durable-dispatch.mjs`
- `src/automation/lane-runner.mjs`
- `src/automation/branch-reconciler.mjs`

Modify:
- `src/automation/autonomous-queue.mjs`
- `src/automation/engine.mjs`
- `src/automation/autonomy-hardening.mjs`
- `src/automation/codex-adapter.mjs`
- `roles/README-Orchestrator.md`
- `roles/README-Builder.md`
- `common/Workflow-Specification.md`

## 8. Verification plan

Unit tests:
- authority intersection and revocation;
- lane ownership uniqueness and shared-lock enforcement;
- terminal always creates next or Gate;
- fallback selection consumes declared candidates;
- dispatch retry/ACK/idempotency/dead-letter;
- stale lease takeover positive/negative matrix;
- completion taxonomy non-inflation;
- branch cleanup exact positive and all rejection cases.

Integration tests:
- design task unavailable while two isolated developer lanes continue;
- target task busy, delivery recovers without duplicate execution;
- known build failure creates one in-scope correction quantum and continues;
- Human Gate in lane A while lane B progresses;
- standing authority persists across Owner awake/sleep and session rotation;
- revoked authority fences pending and active work before next effect;
- two actors cannot write same branch/path;
- merge serializes and cleanup removes only eligible branches;
- Product UI never maps design/unit completion to product completion.

Fault injection:
- crash before/after ACK;
- crash between terminal Evidence and next envelope (transaction must recover atomically);
- lease expiry with live/dead process;
- outbox replay and duplicated adapter delivery;
- Git/API stale reads;
- notification adapter outage;
- partial external-effect response.

## 9. Migration

Phase M0: observe-only shadow registry built from current tasks/branches/authorities; no dispatch.
Phase M1: durable notification/outbox for read-only instructions; compare with manual routing.
Phase M2: one non-external-effect pilot lane with next-unit automation.
Phase M3: two isolated lanes, file/branch locks and safe fallback.
Phase M4: Ready/Merge/merged-branch cleanup under exact standing authority.
Phase M5: install/configure/build capability pilot; launch/record/release remain separate.

Rollback: disable lane runner and retain ledgers/checkpoints; manual Orchestrator routing resumes. Never delete historical envelopes or terminals.

## 10. Acceptance criteria

1. Orchestrator conversation unavailable for 30 minutes while two authorized isolated lanes complete at least two quanta each.
2. Every terminal has exact one next envelope or exact one Gate/blocker.
3. Delivery outage produces zero lost messages and zero duplicate effects.
4. Human Gate does not stop unrelated lane/resources.
5. Standing authority is consumed without repeated Owner confirmation and cannot broaden excluded effects.
6. Stale takeover occurs only in the safe positive fixture; all dirty/live/UNKNOWN fixtures block.
7. Routine progress produces zero design chat messages; milestones/incidents route once.
8. 100% active branches/PRs have one owner; shared writes are lock-serialized.
9. Only merged/reachable/clean/unlocked branches are deleted.
10. Product completion label appears only with product-policy conjunction and canonical Judge PASS.
11. Full existing regression remains PASS; no safety/authority negative test is weakened.

## 11. Open design decisions for review

- Canonical owner of Worklane Registry: AutomationOS or LifecycleOS-backed coordination record.
- Atomic persistence implementation for terminal+next envelope in local-only and distributed modes.
- Default SLA values versus per-task policy.
- Whether automatic takeover is enabled by default or opt-in per lane.
- Exact separation between branch cleanup capability and general destructive operation Gate.

## 12. R1 normative precedence and resolved ownership

Sections 12–34 are normative corrections and supersede any conflicting sentence in earlier sections. Section 32 specifically supersedes Section 17 and Section 27 for coordination-intent durability and materialization ordering.

Canonical ownership matrix:
- TASK-004 LifecycleOS exclusively owns Task lifecycle, completion, closure, checkpoint admission and lifecycle journal.
- Owner/Policy trust root exclusively authorizes Authority grants and revocation. AutomationOS stores and evaluates signed immutable grant receipts but cannot author them.
- AutomationOS owns coordination-only Worklane, Dispatch, Inbox, Progress and Notification records.
- TASK-015 DistributedOS owns distributed delivery, remote lease/fencing transport, late-result quarantine and Saga coordination when distributed mode is enabled.
- Git provider remains authority for refs/PR/merge receipts; Worklane stores verified coordinates only.
- Worklane `lane_state` is coordination state and may never overwrite Lifecycle status. Any revision mismatch creates `CONSISTENCY_INCIDENT` and fences execution.
- Completion UI is a derived read model only. Canonical Lifecycle completion and Owner completion authorization remain mandatory.

Every field in the new schemas SHALL be marked `AUTHORITATIVE`, `DERIVED`, or `CACHED`, with exactly one canonical producer. Worklane Registry canonical owner is AutomationOS coordination storage; it is not a second Lifecycle or Authority source.

## 13. Complete state machines

### 13.1 Worklane transitions

Allowed transitions:
- PLANNED -> RUNNABLE: signed lane envelope, authority, resource ownership and checkpoint PASS.
- RUNNABLE -> ACTIVE: lease+lock CAS acquired.
- ACTIVE -> RUNNABLE: quantum terminal PASS_CONTINUE and exact next envelope committed.
- ACTIVE -> GATE_PARKED: exact Gate committed.
- ACTIVE -> RECOVERY_REQUIRED: UNKNOWN, crash reconciliation, dirty ownership or unfenced effect.
- ACTIVE -> HANDOFF_PENDING: explicit owner/lane transfer receipt.
- HANDOFF_PENDING -> RUNNABLE: old lease fenced, new actor grant verified, resource handoff CAS committed.
- RUNNABLE|ACTIVE -> COMPLETED: PASS_LANE_COMPLETE plus Lifecycle-owned completion/closure policy receipt.
- any nonterminal -> REVOKED: authority/lane revocation epoch committed.

No implicit reverse transition exists. COMPLETED and REVOKED are terminal; reopen requires a new lane revision and Lifecycle authority.

### 13.2 Terminal invariant

Every accepted AtomicUnitTerminal has exactly one of:
1. `next_envelope_ref`;
2. `gate_or_blocker_ref`;
3. `lane_completion_receipt_ref`.

The three are mutually exclusive and nonnull as selected. This replaces the R0 statement requiring next/Gate even for lane completion.

### 13.3 Dispatch/Inbox/Operation transitions

Producer: `PENDING -> LEASED -> DELIVERED -> TARGET_PERSISTED -> TERMINAL`, with `REJECTED`, `SUPERSEDED`, `EXPIRED`, `DEAD_LETTER` as closed alternatives.

Target durable Inbox: `RECEIVED -> CLAIMED -> EXECUTING -> EFFECT_RECONCILING -> TERMINAL`. ACK means only `TARGET_PERSISTED`; it never means execution/effect success.

Operation receipt: `NOT_STARTED | EFFECT_STARTED | EFFECT_COMMITTED | RESULT_RECORDED | UNKNOWN`. Only RESULT_RECORDED with authoritative receipt may produce PASS.

All transitions use expected prior revision plus lane revision, authority epoch, lease epoch and fencing token CAS.

## 14. Delivery and effect semantics

Delivery is explicitly AT_LEAST_ONCE. The OS makes no universal exactly-once claim.

`DispatchEnvelopeV1`, target Inbox, checkpoint, terminal, ACK and every effect request add:
- lane_revision, resource_revision;
- authority_id/version/epoch;
- lease_epoch and fencing_token;
- semantic_operation_id;
- payload_digest and expected pre-state;
- effect_class and reconciliation_policy_ref.

The target persists Inbox before ACK. Duplicate delivery with the same semantic_operation_id and payload digest returns the existing operation state. Same ID with a different payload rejects as `IDEMPOTENCY_COLLISION`.

Effect classes:
- TRANSACTIONAL_LOCAL: effect and operation receipt share one transaction.
- PROVIDER_IDEMPOTENT: provider consumes the semantic operation key and returns authoritative receipt.
- CONDITIONALLY_WRITABLE: sink accepts expected revision/OID plus fencing token CAS.
- RECONCILABLE_NONTRANSACTIONAL: timeout enters EFFECT_RECONCILING and uses authoritative read-back within a policy window.
- NONRECONCILABLE: automatic retry and automatic takeover are prohibited; timeout enters UNKNOWN and Human recovery.

Crashes after effect commit but before receipt never trigger blind retry. They enter read-reconcile. Receipt source, consistency window, correlation key and final UNKNOWN rule are required per adapter.

## 15. Authority security and revocation

StandingAuthorityGrantV1 additionally requires:
- signed immutable grant bytes and trusted issuer root;
- issuer sequence, grant version, authority_epoch, audience and subject actor/session class;
- canonical resource IDs, environment, argument constraints, effect class, count/rate/cost/data budgets;
- secret/data classes, separation-of-duty predicates and required pre-state;
- deny rules, delegation rule default DENY, inheritance rule default DENY;
- trusted time source, allowed clock skew and inclusive/exclusive expiry rule.

Deny always wins. Evaluation canonicalizes repository, filesystem realpath/case, Git ref, environment and target identity before intersection. Path text alone is never authority.

Backup actors do not inherit the primary grant. They require their own direct signed grant with the required capabilities.

Every effect adapter revalidates authority epoch immediately before irreversible/externally visible commit. Revocation/supersession atomically advances authority and lane fence epochs, rejects old operations at sinks, quarantines late results and cancels only effects with authoritative cancellation support. Unstoppable or uncertain effects become UNKNOWN; revocation never rewrites prior effects as absent.

`UNTIL_TASK_SET_COMPLETE` resolves only from TASK-004 Canonical Lifecycle, not lane self-report.

## 16. End-to-end fencing, resource identity and takeover

Repository identity is `(provider, owner, repository immutable ID)`. Resource IDs use canonical realpath, case rules, device/volume, symlink/junction containment, worktree/index identity, Git full ref and shared build-cache identity. Globs are expanded and overlap-checked before lock acquisition.

Ownership registration, Integration Lock and lease acquisition occur in one linearizable CAS transaction. Locks carry resource revision, lease epoch, fencing token, owner lane and expiry.

All mutation sinks MUST enforce fencing:
- Git ref changes use expected OID/ref transaction;
- files use operation-owned staging plus current fence check before publish;
- DB/API use version/idempotency/fence support;
- Lifecycle journal rejects stale lane/authority/lease epoch;
- late terminal/ACK from an old epoch is quarantined.

Automatic takeover defaults OFF per lane. It may be enabled only for an adapter set whose every mutation sink enforces fencing and whose provider can give terminal/cancellation or job-identity Evidence. Process/PID absence is supporting Evidence only. If any in-flight sink is unfenceable or provider state is UNKNOWN, takeover is forbidden and state becomes RECOVERY_REQUIRED.

## 17. Terminal-to-Next persistence protocol

Local mode reuses TASK-004 journal and one durability domain:
1. PREPARED record contains terminal, checkpoint proposal, lifecycle transition request and outbox/gate/completion intent.
2. APPLIED writes coordination records and a deterministic outbox intent under one local transaction/WAL boundary.
3. VERIFIED re-reads exact digests and revision CAS.
4. COMMITTED makes the intent dispatchable.

Recovery replays by transaction ID and never applies a Lifecycle transition twice. `COMMIT_STATE_UNKNOWN` blocks dispatch until TASK-004 Recovery Authority resolves it.

Distributed mode does not claim global atomicity. It performs the same local COMMITTED transaction, then TASK-015 transactional outbox delivery and Saga/reconciliation. Remote publish failure leaves a committed, retryable intent; remote ACK never owns Lifecycle state. Late/stale results are quarantined by epoch. Compensation is adapter-specific and cannot fabricate rollback of irreversible effects.

Two reconcilers use CAS claim and cannot repair the same transaction concurrently.

## 18. Dispatcher availability and durable notifications

Dispatcher is a logical service with multiple equivalent workers. Workers claim envelopes by CAS lease; expired claims are reclaimable after fence validation. No single worker identity is canonical.

An independent health sentinel, outside dispatcher/runner failure domains, observes:
- queue depth and oldest age;
- delivery/target-persist latency;
- lane progress/heartbeat age;
- Gate and dead-letter age;
- notification pending/ACK age;
- reconciler failures and stale leases.

Store corruption fails closed, restores from verified backup/checkpoint and never drops unverified rows.

`NotificationEnvelopeV1` is separately durable and includes recipient, approved channel set, severity, decision/milestone revision, attempt schedule, delivery receipts, Owner ACK, expiry, supersession and terminal failure. “Notify once” means one logical notification eventually acknowledged, not one send attempt. Critical incidents retry until ACK and use a separately authorized fallback channel. Notification dead-letter is observed by the independent sentinel.

Payload and audit metadata are separated. Secrets/private values are tokenized or encrypted, never placed in chat/notification, and low-entropy secrets are not stored as unsalted public hashes. Retention, legal hold, access audit and deletion tombstones are policy-bound.

## 19. Role independence enforcement

Each unit records required role, actor, session, artifact author, review target checksum, DEV profile and mandatory review chain.

Runner rejects:
- Builder acting as Critic/Judge for its own artifact;
- same actor/session where policy mandates independence;
- Critic/Judge receipt for another artifact revision/head;
- omitted Tester/Critic/Judge required by DEV profile;
- stale PASS after target change.

Critic, Judge and Tester Role specifications are implementation update targets in addition to Orchestrator/Builder. Lane self-routing never self-authorizes design, changes the required review chain or applies Judge conclusions.

## 20. Bounded autonomy, progress and observability

Each lane authority fixes max quanta, repair attempts, review cycles, wall-clock, tokens/cost, changed-byte/file limits and external-effect budgets. Defaults cannot exceed current Balanced Execution limits without explicit authority.

Progress requires an objective change: accepted patch digest, new test result, resolved failure fingerprint, verified artifact or completed Gate transition. Reworded hypotheses are not progress. Failure fingerprints and A/B state oscillation detection feed a circuit breaker.

Budget exhaustion, repeated fingerprint, oscillation or no objective progress transitions once to `STALLED`/exact Gate and emits one logical Owner-visible escalation.

SLA semantics are policy-versioned and separate alerting from takeover:
- delivery ACK SLA measures PENDING creation to TARGET_PERSISTED, excluding declared provider outage windows;
- process heartbeat uses monotonic elapsed time and stable job identity;
- progress SLA measures last objective progress to observation;
- dispatcher outage does not by itself authorize takeover;
- SLA breach alerts/reconciles first; takeover requires all Section 16 predicates.

Routine classification is a closed event-type allowlist. Heartbeat, retry, fallback selection, checks, PASS and lease renewal are ROUTINE and may write only ledgers/metrics. Conversation/task-comment/email sinks receive only approved milestone, decision or incident events. Explicit subscriptions are separate, revocable policy records.

## 21. Human Gate versioning and fallback safety

HumanGateV2 adds signed scope digest, subject/revision, approver, validity/revocation, blocking resource IDs, safety domain, system scope and consumed-effect set.

Legacy Gate without system scope remains global fail-closed. It is never automatically narrowed. Explicit Orchestrator/Owner conversion creates V2.

Gate state revision, fallback selection, resource lock and dispatch intent commit by one CAS transaction. In-lane fallback may run only within its existing lane. Cross-lane fallback requires a preauthorized cross-lane routing policy; otherwise Orchestrator routing is required. Fairness/resume priority prevents fallback starvation.

## 22. Full branch/PR lifecycle and safe cleanup

Lifecycle expands to:
`DISCOVERED -> OWNED -> LOCAL_COMMITTED -> PUSHED -> PR_OPEN -> CHECKING -> READY -> MERGE_REQUESTED -> MERGE_RECONCILING -> MERGED -> CLEANUP_ELIGIBLE -> REMOTE_CLEANED -> LOCAL_CLEANED -> CLEANED`.

Every transition binds repository ID, branch, expected OID, base OID, PR ID, check/review revision and lane fence. Push/PR/merge timeouts enter read-reconcile, not retry.

Cleanup is a distinct destructive capability `DELETE_MERGED_BRANCH`, never implied by general WRITE/MERGE/DELETE. Grant binds exact repo/branch/expected OID/expiry. Remote deletion uses compare-and-delete against expected OID after rechecking all worktrees, locks, protection and reachability. Only after remote absence is verified is the local branch deleted. Lost response is reconciled. Stacked branches and unmerged descendants block cleanup.

## 23. Migration and rollback correction

Every adopted task gets a signed MigrationManifest: legacy task/branch/session, current state, checkpoint, authority, Gate mapping, in-flight command/effect, worktree ownership, cutover epoch and manual owner.

M0 shadow is read-only and compares legacy/new decisions. Legacy `safe_to_continue=false` remains global. Cutover requires in-flight drain or explicit quarantine, old dispatcher fence, new lane/lease activation CAS and manual owner handoff receipt. There is no dual writer period.

Rollback performs: stop new claim, advance fence epoch, quarantine pending/leased/ACKed-not-terminal envelopes, reconcile in-flight effects, release/hand back locks, write manual-owner receipt, then enable manual Orchestrator routing. Re-enable never replays quarantined instructions automatically.

## 24. Product Completion Policy and Owner UX

`ProductCompletionPolicyV1` binds product ID, scope, revision/head, required axes, allowed N/A axes and approver, Evidence checksums/freshness, Judge target digest, Lifecycle closure and Owner completion authorization.

Any head/artifact/install/runtime/manual/Gate change invalidates dependent completion axes and downgrades the read model immediately. `PRODUCT_COMPLETE` requires:
- all policy-required axes PASS at the same accepted revision;
- canonical Judge PASS for that revision;
- TASK-004 Closure Readiness and Canonical COMPLETED;
- Owner completion authorization where policy requires it;
- no stale/UNKNOWN/active recovery state.

Owner Inbox displays unread/acknowledged/resolved/superseded, affected lanes and customer value, exact choices, recommended choice, authority/effect impact, expiry and deep link. Product, lane and Atomic Unit statuses are separate panels.

## 25. Revised end-to-end acceptance

In addition to Section 10:
1. Orchestrator is disabled before test start; two cold-start lanes each perform two new select-dispatch-execute-terminal-next cycles with maximum idle gap bounded by policy.
2. Crash injection at producer persist, target persist, ACK, effect start/commit, receipt, terminal and next-intent boundaries yields exact one terminal outcome or explicit UNKNOWN Gate; no blind retry.
3. Revocation between AUTH_CHECK and effect commit rejects the old authority epoch at the sink.
4. Freeze-primary/takeover/resume-old test rejects every old-epoch write and late terminal; unfenceable provider never auto-takes over.
5. Two dispatcher workers, worker death, claim expiry, store restore and independent sentinel outage tests preserve delivery and nonduplication properties.
6. Legacy Gate migration never broadens runnable scope.
7. Active/dirty/ACKed/in-flight task migration and rollback never creates two writers or stale replay.
8. Routine events produce zero conversation notifications across all sinks while ledger coverage is 100%; critical notification eventually reaches Owner ACK after adapter recovery.
9. Branch push/PR/merge/delete fault injection and OID drift never deletes a changed/unmerged/protected/used branch.
10. Product completion becomes stale immediately after any bound revision changes and cannot be restored without fresh Evidence/Judge/Lifecycle conditions.
11. Full existing OS regression and all authority/security negative tests remain PASS.

## 26. R2 complete transition tables

Section 26 supersedes the abbreviated transition lists in Section 13. `STALLED` is added to Worklane coordination state; it is not a TASK-004 Lifecycle status.

### 26.1 Worklane event table

| From | Event/guard | To | Required receipt |
|---|---|---|---|
| PLANNED | lane/auth/resource/checkpoint validation PASS | RUNNABLE | LANE_ADMISSION |
| RUNNABLE | lane lease + all required locks CAS acquired | ACTIVE | QUANTUM_START |
| ACTIVE | PASS_CONTINUE + next intent accepted | RUNNABLE | UNIT_TERMINAL_NEXT |
| ACTIVE | PASS_LANE_COMPLETE + Lifecycle completion commit | COMPLETED | LANE_COMPLETION |
| ACTIVE | WAITING_OWNER/V2 Gate commit | GATE_PARKED | GATE_PARK |
| GATE_PARKED | same-revision Gate SATISFIED, inputs fresh, authority/locks revalidated | RUNNABLE | GATE_RESUME |
| GATE_PARKED | Gate CANCELLED/EXPIRED without alternate authority | STALLED | GATE_CLOSED_NO_ROUTE |
| ACTIVE / RUNNABLE | budget/circuit-breaker/no-progress reached | STALLED | STALL_RECEIPT |
| STALLED | explicit Orchestrator route plus fresh authority/checkpoint | RUNNABLE | STALL_RESUME |
| ACTIVE / RUNNABLE / GATE_PARKED / STALLED | recovery predicate or commit/effect UNKNOWN | RECOVERY_REQUIRED | RECOVERY_INCIDENT |
| RECOVERY_REQUIRED | TASK-004 Recovery Authority PASS, in-flight reconcile, fresh fence/checkpoint | RUNNABLE | RECOVERY_RESUME |
| ACTIVE / RUNNABLE / GATE_PARKED / STALLED | transfer requested and current actor fenced | HANDOFF_PENDING | HANDOFF_PREPARED |
| HANDOFF_PENDING | new direct grant, new lease epoch, ownership CAS | RUNNABLE | HANDOFF_COMMITTED |
| any nonterminal | lane/authority revocation epoch committed | REVOKED | REVOCATION_RECEIPT |

All other transitions reject. COMPLETED/REVOKED cannot transition; a new Lifecycle-authorized lane revision is required.

### 26.2 Dispatch event table

| From | Event | To |
|---|---|---|
| PENDING | valid claim lease CAS | LEASED |
| PENDING | deadline/revocation/supersession | EXPIRED/SUPERSEDED |
| LEASED | adapter delivered bytes | DELIVERED |
| LEASED | lease timeout before target persistence | PENDING |
| LEASED / DELIVERED | target rejects digest/scope/epoch | REJECTED |
| DELIVERED | target durable Inbox commit + ACK | TARGET_PERSISTED |
| DELIVERED | uncertain delivery and no target query | DEAD_LETTER, no effect retry |
| TARGET_PERSISTED | target terminal receipt bound | TERMINAL |
| TARGET_PERSISTED | target Gate/Recovery terminal | TERMINAL with exact blocker ref |
| PENDING / LEASED | bounded attempts exhausted with proven non-persistence | DEAD_LETTER |

TARGET_PERSISTED is never re-delivered as a new operation. Reconciliation queries the target Inbox by semantic operation ID.

### 26.3 Target Inbox and operation event table

| From | Event | To |
|---|---|---|
| RECEIVED | claim CAS/fence PASS | CLAIMED |
| RECEIVED | invalid/superseded/revoked before claim | REJECTED |
| CLAIMED | no-effect validation/read quantum starts | EXECUTING |
| CLAIMED | mutation eligibility and effect-start linearization PASS | EXECUTING/EFFECT_STARTED |
| CLAIMED | Gate/authority/dependency fails | TERMINAL_BLOCKED |
| EXECUTING | read/design/test result verified | TERMINAL_PASS or TERMINAL_FAIL |
| EFFECT_STARTED | authoritative effect commit observed | EFFECT_COMMITTED |
| EFFECT_STARTED | response uncertain | EFFECT_RECONCILING or TERMINAL_UNKNOWN |
| EFFECT_RECONCILING | authoritative receipt found | EFFECT_COMMITTED |
| EFFECT_RECONCILING | bounded window ends unresolved | TERMINAL_UNKNOWN |
| EFFECT_COMMITTED | result/evidence/checkpoint stored | RESULT_RECORDED |
| RESULT_RECORDED | AtomicUnitTerminal accepted | TERMINAL_PASS or TERMINAL_FAIL |
| CLAIMED / EXECUTING | cancellation/revocation before effect-start linearization | TERMINAL_CANCELLED |

`TERMINAL_FAIL` maps to repairable, stalled or recovery state by bounded failure policy. Every terminal state is immutable and late events create a new reconciliation revision, not an in-place rewrite.

## 27. R2 TASK-004 composite commit binding

AutomationOS never applies Lifecycle state. It submits a `LifecycleCoordinationBundleV1` to the existing TASK-004-owned transition gateway. The bundle contains immutable coordinates for unit terminal Evidence, checkpoint proposal, expected Lifecycle status/revision, and exactly one coordination intent: next envelope, exact Gate/blocker, or lane completion.

Canonical order and acceptance point:
1. ACTIVE lane retains its lane/resource fence and freezes further mutation.
2. Runner reads current TASK-004 status revision and creates the bundle with transaction ID.
3. TASK-004 Authority gateway independently AUTHORIZEs the requested Lifecycle transition. Rejection leaves the unit terminal unaccepted and moves the coordination lane to RECOVERY_REQUIRED with a rejection receipt; no envelope becomes dispatchable.
4. TASK-004 Journal writes PREPARED containing before/after Lifecycle snapshots plus the complete coordination-intent digest.
5. TASK-004 APPLIED applies only the Lifecycle-owned transition/checkpoint under expected revision CAS.
6. TASK-004 VERIFIED re-reads Lifecycle state and the intent digest; any mismatch becomes its existing RECOVERY_REQUIRED path.
7. TASK-004 COMMITTED is the sole acceptance point for AtomicUnitTerminal. The COMMITTED journal itself is the durable source from which a missing coordination record can be reconstructed.
8. Only after the COMMITTED receipt does AutomationOS materialize Worklane mirror, Gate/completion record and transactional-outbox row using transaction ID/idempotent CAS.
9. Dispatchability requires both TASK-004 COMMITTED receipt and exact coordination materialization verification. Materialization failure is recovered from the journal and never re-applies Lifecycle state.

Lock order is fixed: existing ACTIVE lane/resource fence -> TASK-004 transition gateway expected-revision CAS -> coordination materialization CAS. No component waits for a lower-order lock while holding a higher-order lock. A competing Lifecycle transition wins or loses at TASK-004 expected revision; the loser cannot publish coordination intent.

`COMMIT_STATE_UNKNOWN` is determined only by TASK-004 Recovery Authority. While unknown, lane state is RECOVERY_REQUIRED, locks are retained or fenced according to Recovery policy, and no next work dispatches. Local filesystem implementation SHALL use the existing TASK-004 snapshot/JSONL journal durability and fsync rules; the follow-up implementation design must bind exact existing APIs and paths rather than invent a parallel WAL.

Distributed delivery begins only after local TASK-004 COMMITTED and coordination materialization. TASK-015 carries the already-accepted intent; it cannot apply or compensate Lifecycle state.

## 28. R2 autonomous effect eligibility and revocation linearization

Every adapter declares both effect class and fencing class:
- `SINK_FENCEABLE`: sink checks current fencing token/expected revision at commit. Eligible for autonomous mutation.
- `GATEWAY_LINEARIZED_NONCANCELLABLE`: provider cannot check OS fence, but an OS Effect Gateway atomically verifies authority/lane epochs and writes EFFECT_STARTED before the one provider invocation. Later revocation blocks new starts but does not retroactively invalidate the already-authorized in-flight invocation. Eligible only when the signed grant explicitly permits this noncancellable risk, provider supports semantic idempotency and authoritative reconciliation, and policy budgets the blast radius.
- `UNFENCEABLE_RECONCILABLE`: autonomous mutation prohibited by default; requires explicit Human/Owner effect Gate for each operation. Runner may only perform read-reconciliation afterward.
- `UNFENCEABLE_NONRECONCILABLE`: always Human/Owner effect Gate and manual/observed operation; automatic retry and takeover prohibited.

Thus `NONRECONCILABLE` is never an autonomous effect. `RECONCILABLE_NONTRANSACTIONAL` from Section 14 is autonomous only when it is also SINK_FENCEABLE or explicitly GATEWAY_LINEARIZED_NONCANCELLABLE.

Workers unable to prove current authority/lane epoch because of partition may not cross EFFECT_STARTED. An already linearized noncancellable invocation may finish and must later reconcile; it may not start a second invocation.

Notification/chat/email delivery uses semantic notification ID and at-least-once delivery. Duplicate transport attempts are allowed, but recipient read model deduplicates one logical notification. Sending a notification is allowed only under Notification policy; it is not treated as a general product/external-effect capability.

Auto takeover is allowed only when all possible mutation adapters in the in-flight quantum are SINK_FENCEABLE and the old epoch is rejected at every sink. A lane containing GATEWAY_LINEARIZED_NONCANCELLABLE or either UNFENCEABLE class cannot auto-take over until the operation reaches an authoritative terminal/reconciled state.

## 29. R2 schema and implementation inventory closure

Section 7 is extended with these required schemas:
- `target-inbox.schema.json`
- `effect-operation-receipt.schema.json`
- `notification-envelope.schema.json`
- `migration-manifest.schema.json`
- `human-gate-v2.schema.json`
- `product-completion-policy.schema.json`
- `lifecycle-coordination-bundle.schema.json`
- `resource-identity-lock.schema.json`
- `budget-reservation.schema.json`
- `audit-event-envelope.schema.json`

Required modules additionally include target Inbox/effect reconciler, notification worker/sentinel, migration controller, completion read-model builder and TASK-004 coordination adapter. Exact paths are fixed only by the separately authorized Final Plan after inventory/ownership review.

Required policy/document synchronization includes:
- `roles/README-Orchestrator.md`, Builder, Tester, Critic and Judge;
- `common/Workflow-Specification.md`, Authority, Evidence and Artifact specifications;
- relevant TASK-004/TASK-015 integration supplements without reopening or rewriting completed history;
- schemas, failure registry, role-context matrix and operational-improvements registry.

## 30. R2 audit integrity, privacy and budget ownership

AuditEventEnvelope uses append-only contiguous sequence per lane/operation, previous-event hash, event hash, actor/session/role, correlation and semantic operation IDs, trusted timestamp coordinate, authority/lane/lease epochs, before/after digests and signer key ID. Periodic signed checkpoints anchor chain heads outside the mutable worker store. Deletion/reordering/modification is detected.

Key management uses the existing SecurityOS trust/key authority: versioned keys, rotation overlap, revocation time, verification of historical signatures and least-privilege signing. AutomationOS cannot mint trusted signing identity. Access is role/scoped; all reads are audited.

Privacy rules define data classification before persistence, field allowlists, envelope encryption for sensitive payload refs, tokenization, notification redaction, retention duration, legal hold precedence and deletion tombstone behavior. Legal hold prevents payload deletion only under valid policy; otherwise payload can be deleted while a nonsecret tombstone preserves chain continuity. Privacy canaries and low-entropy secret tests are mandatory.

Cost/token/provider budgets reuse the existing Cost Guard reservation/actual/release ledger. Multi-lane consumption requires a linearizable reservation transaction bound to lane/unit/session/authority budget. No effect starts without reservation; actual usage settles it, known nonuse releases it, and UNKNOWN retains reservation until reconciliation. Count/rate/nonmonetary effect budgets use an equivalent AutomationOS quota ledger with CAS reservation and no overdraw. Distributed quota is coordination only and may not exceed the canonical reservation.

## 31. R2 acceptance clarifications

- “zero duplicate effects” in Section 10 applies only to SINK_FENCEABLE or provider-idempotent, authoritative-reconciled semantic operations covered by Sections 14 and 28. For other classes the requirement is zero automatic duplicate attempt plus explicit UNKNOWN/Human Gate.
- “exact one” means exactly one accepted immutable terminal per transaction revision and exactly one selected next/Gate/completion intent. Later reconciliation is a linked higher revision.
- Property/model tests must enumerate every allowed and forbidden transition in Section 26, including Gate resume, Recovery resume, dead-letter, cancellation, failure and completion.
- Composite crash tests cover every TASK-004 AUTHORIZE/PREPARED/APPLIED/VERIFIED/COMMITTED and coordination materialization boundary, including Lifecycle CAS rejection and journal unknown.
- Revocation/partition tests cover every cross product of effect class and fencing class.
- Security tests include forged signature, issuer-sequence rollback, key revocation/rotation, clock skew and canonical-resource alias attacks.
- Concurrent budget tests prove reservation/settlement/release and UNKNOWN retention across multiple lanes without overdraw.
- Audit/privacy tests cover tamper, reorder, missing event, unauthorized read, privacy canary, key rotation, retention, legal hold and tombstone continuity.
- Product completion read model is rebuilt solely from canonical receipts after event loss/reorder/store restore and must not retain stale PASS.

## 32. R3 durable coordination-intent object and TASK-004 event binding

Digest-only recovery is prohibited. Before submitting a LifecycleCoordinationBundle, AutomationOS serializes the complete selected coordination intent bytes—exactly one next envelope, Gate/blocker, or completion receipt—to an immutable content-addressed object in the TASK-004-authorized local durability domain.

`CoordinationIntentObjectV1` contains:
- transaction_id, task_id, lane_id/revision;
- intent kind and complete canonical intent payload;
- authority/lane/lease/fence coordinates;
- expected Lifecycle before revision and selected after-state request;
- object byte length, object SHA-256, schema version and creation time;
- no secret payload bytes; sensitive effect payload remains an encrypted referenced object under Section 30.

Protocol superseding Sections 17 and 27:
1. Write the complete intent object to a temporary operation-owned path, fsync file and parent, rename without overwrite to its content-addressed final path, then re-read bytes/length/SHA.
2. TASK-004 transition request binds the exact immutable object coordinate `(schema, task, transaction, path/object-id, bytes, SHA)`.
3. The TASK-004 PREPARED journal and append-only COMMITTED transition event both contain that complete coordinate, not merely a payload digest. The transition event schema revision is extended under the new follow-up Task; historical event schemas remain readable.
4. TASK-004 event append, durable acknowledgement and verification occur under its existing journal. The current temporary `transaction-journal.json` may be deleted after COMMITTED because the append-only `transition-log.jsonl` event retains the durable object coordinate.
5. AutomationOS materializes the target coordination row/outbox from the immutable object and re-reads equality.
6. It appends a hash-chained `COORDINATION_MATERIALIZED_ACK` bound to transition ID, event checksum, intent object coordinate and materialized record checksum.
7. Intent object garbage collection is forbidden until: TASK-004 COMMITTED event verified, materialized ACK verified, target terminal retention policy satisfied, no Recovery/Legal Hold, and minimum audit retention elapsed. GC creates a tombstone; it never removes the transition event or materialization ACK.

Crash after COMMITTED and temporary-journal deletion but before materialization recovers by scanning committed events lacking materialized ACK, reading the content-addressed object and idempotently materializing it. Missing/mismatched object is `COMMIT_STATE_UNKNOWN / RECOVERY_REQUIRED`; no next dispatch occurs. A digest cannot substitute for missing object bytes.

The local implementation SHALL extend the existing TASK-004 event and acknowledgement contracts rather than creating a second Lifecycle log. DistributedOS receives only the already materialized coordination record after local ACK; remote state is not a recovery source for Lifecycle.

## 33. R3 transition completion addendum

The following rows are added to Section 26 and are normative:

### 33.1 Worklane additions

| From | Event/guard | To | Required receipt |
|---|---|---|---|
| RUNNABLE | new Gate committed before quantum/lock acquisition | GATE_PARKED | GATE_PARK |
| HANDOFF_PENDING | grant/ownership/fence/lease CAS fails deterministically | STALLED | HANDOFF_REJECTED |
| HANDOFF_PENDING | grant/ownership/fence/lease CAS outcome UNKNOWN | RECOVERY_REQUIRED | HANDOFF_RECOVERY_INCIDENT |

### 33.2 Inbox/effect additions

| From | Event/guard | To | Required receipt |
|---|---|---|---|
| EFFECT_STARTED | authoritative provider rejection proves effect not performed | TERMINAL_FAIL_NO_EFFECT | provider rejection receipt |
| EFFECT_COMMITTED | result/evidence/checkpoint persistence fails deterministically | TERMINAL_FAIL_EFFECT_COMMITTED | committed-effect coordinate + failure receipt |
| EFFECT_COMMITTED | result/evidence/checkpoint persistence outcome UNKNOWN | RECOVERY_REQUIRED | committed-effect coordinate + recovery incident |
| RESULT_RECORDED | TASK-004 Lifecycle CAS rejects deterministically | TERMINAL_FAIL_LIFECYCLE_REJECTED | Lifecycle rejection receipt; AtomicUnitTerminal not accepted |
| RESULT_RECORDED | TASK-004 transition commit outcome UNKNOWN | RECOVERY_REQUIRED | Lifecycle transaction coordinate |
| RESULT_RECORDED | TASK-004 COMMITTED plus coordination materialized ACK | TERMINAL_PASS or TERMINAL_FAIL | accepted AtomicUnitTerminal coordinate |

`TERMINAL_FAIL_EFFECT_COMMITTED` never means the effect was rolled back. It blocks continuation until Evidence/checkpoint recovery binds the already committed effect. `TERMINAL_FAIL_NO_EFFECT` is retryable only under the bounded repair/retry policy and a fresh authority/fence check.

All states/transitions not present in Sections 26 and 33 reject. Model generation SHALL construct the exhaustive cross-product from schema enums and prove every event maps to exactly one allowed transition or explicit rejection.

## 34. R3 audit scope, HumanGate coexistence and final acceptance

Audit access recursion is bounded: only reads of sensitive payloads, authority evidence, private actor/session mappings, secret-bearing references and protected audit metadata generate access-audit events. Reading public chain heads or the access-audit stream for verification does not recursively create another event. Audit chain/signature/anchor verification failure immediately fences affected lanes and creates `AUDIT_INTEGRITY_GATE`.

Signed chain-head anchors are stored in a SecurityOS-authorized append-only anchor store in a different failure domain from the worker/audit ledger. Anchor cadence and maximum unanchored window are policy-bound. Anchor store unavailable beyond the window parks mutation; read-only verification may continue. Key rotation, legal hold and tombstone rules from Section 30 remain.

HumanGate coexistence:
- `autonomous-task-node` evolves to a versioned `human_gates` union with explicit discriminator `human_gate_schema_version` and `oneOf` V1/V2 validation.
- During migration, readers accept V1 and V2; writers create only V2.
- V1 always evaluates with legacy global fail-closed semantics and cannot carry fallback narrowing.
- A signed MigrationManifest converts V1 to V2 by creating a new Gate ID/revision linked to the immutable V1 receipt; it never mutates V1.
- Rollback readers continue accepting both versions, quarantine unrecognized future versions and never reinterpret V2 as V1.
- V2-only fallback dispatch is disabled when any applicable unresolved V1 Gate remains.

Additional mandatory acceptance tests:
1. Kill the process after TASK-004 COMMITTED and temporary-journal deletion but before coordination materialization; recover complete intent bytes from transition event coordinate/object, create exact one materialized row and ACK, and dispatch once.
2. Delete/corrupt the intent object in the same window; prove RECOVERY_REQUIRED and zero dispatch.
3. Exercise every Section 33 transition and every forbidden state/event pair.
4. Mixed V1/V2 read, V1-global behavior, signed conversion, cutover, rollback and unknown-version quarantine.
5. Stop anchor store past the allowed window; prove mutation parking without recursive audit storm, then verify recovery after valid anchor.

## 35. R4 pre-COMMITTED orphan intent lifecycle

Content-addressed intent object creation has two namespaces:
- temporary object: transaction-scoped, not a valid Lifecycle coordination reference;
- sealed object: immutable final object after byte-length/SHA re-read, eligible to be referenced by TASK-004 Journal/Event.

If a final content-addressed object already exists, the writer must re-read complete bytes, length, schema and SHA. Exact equality permits reuse; any collision/mismatch is `INTENT_OBJECT_COLLISION / RECOVERY_REQUIRED`. No overwrite is allowed.

`IntentObjectReferenceIndexV1` records transaction ID, object coordinate and one state:
`SEALED_UNSUBMITTED | JOURNAL_REFERENCED | EVENT_COMMITTED | MATERIALIZED_ACKED | GC_ELIGIBLE | GC_TOMBSTONED`.

Transitions use CAS and are monotonic. PREPARED binds JOURNAL_REFERENCED; COMMITTED event binds EVENT_COMMITTED; coordination ACK binds MATERIALIZED_ACKED. A referenced object can never return to an unreferenced state.

Bounded orphan collection applies only to `SEALED_UNSUBMITTED` objects after the policy retention window. Collector requirements:
1. acquire object/transaction GC lease and fence concurrent submit/recovery;
2. prove no active TASK-004 Journal, append-only transition Event, coordination row, materialization ACK, Recovery record or Legal Hold references the exact transaction/object coordinate;
3. prove transaction was never accepted and no submission lease remains valid;
4. append a signed orphan-GC decision with all negative lookups and object digest;
5. remove only the exact sealed object and abandoned temporary object under contained root;
6. read back absence and append `GC_TOMBSTONED` without secret payload;
7. on any missing index, conflicting evidence or UNKNOWN lookup, retain the object and enter GC review; never infer orphan status from age alone.

Temporary paths use operation-owned names, no-overwrite publish and bounded retention. A crash before sealing may remove a temporary object only after the same transaction/lease/reference absence proof. Storage quota admission reserves room for sealed plus temporary objects; quota exhaustion blocks new quantum admission rather than deleting referenced evidence.

Additional acceptance tests:
- authorization rejection, expected-revision CAS loser and pre-submit crash each leave a candidate that becomes GC_ELIGIBLE only after retention and complete reference-absence proof;
- concurrent submission or Recovery wins the fence and prevents GC;
- a JOURNAL_REFERENCED/EVENT_COMMITTED/MATERIALIZED_ACKED object is never deleted;
- stale/missing reference index, unavailable event log, Legal Hold and unknown transaction retain the object;
- existing content-addressed object exact reuse passes, while same coordinate with length/byte/SHA mismatch fails closed;
- temporary cleanup and sealed orphan GC create complete signed tombstones and preserve audit-chain verification.
