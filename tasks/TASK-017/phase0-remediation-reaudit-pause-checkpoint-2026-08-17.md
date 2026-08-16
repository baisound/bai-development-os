# TASK-017 Phase 0 remediation / re-audit pause checkpoint (2026-08-17)

## 1. Pause decision

- checkpointed_at: `2026-08-17T00:20:52.6533810+09:00`
- requested_by: Owner
- state: `PAUSED_BY_OWNER_WITH_OPEN_CRITIC_FINDINGS`
- branch: `codex/task-017-phase0-remaining-deployment-gates`
- base_head: `0dc810d8c00db493dc0a194f894b66e180ed7986`
- commit / push / PR / merge: `0`
- VPS / PostgreSQL / SSH / DNS / ACME / Production Activation effect: `0`

This checkpoint is not a Judge PASS. Repository remediation passed the current automated suites, but the fresh fixed-snapshot Critic audit found unresolved design and runtime findings. Resume must start from the exact worktree and close those findings before a new three-Critic audit and Final Judge.

## 2. Verified repository state at pause

- `npm run test:knowledge-hub` with Git for Windows Bash on PATH: `119 / 119 PASS`
- TASK-017 focused / registry consistency: `51 / 51 PASS` (including the two registry consistency tests)
- Remaining Deployment Gates static checker: `PASS`; external effects `NOT_AUTHORIZED`
- Roadmap consolidation: `57 / 57 PASS`
- Document Registry: `783` entries; missing `0`; hash/size mismatch `0`; duplicate path `0`
- `git diff --check`: `PASS`
- worktree remains intentionally dirty and uncommitted; unrelated `.codex/`, `deliverables/`, and the OBS Ver1.2 specification are not TASK-017 commit candidates.

## 3. Frozen key hashes

| Path | SHA-256 |
|---|---|
| `deploy/knowledge-hub/scripts/backup-postgres.sh` | `cbafc40d81c5fa26f4e5a65cda45c28ca8c7f2e6bbf563edaff55d6f08c23c9b` |
| `deploy/knowledge-hub/scripts/run-encrypted-backup-restore-rehearsal.sh` | `2e3c94f1d0eca5111625c8f510456ea8a27df97332e7b6601218e05fb233c248` |
| `deploy/knowledge-hub/runtime/create-consistent-backup.mjs` | `c48e15673529994cf3a570b3bb09c64a03fda1b27d2b651605a9954ce61da233` |
| `scripts/verify-knowledge-hub-rehearsal-target-authorization.mjs` | `341dcfc8dfb2b75c53a831ceeed7d0ceb25312b0a8b3251437e494642b6cabb5` |
| `scripts/commit-knowledge-hub-backup-rehearsal-bundle.mjs` | `2a25e2b4ca8002c8ee49a2142bb302442c345804da220e52e4a9c9cd44a2d759` |
| `scripts/recover-knowledge-hub-rehearsal.mjs` | `0e54cece47f06a7ccbd90abf1e303b00cb19c357cb5f3413b34b42485bb3a17c` |
| `scripts/write-knowledge-hub-rehearsal-recovery-journal.mjs` | `8aa5b42cee47dc95b73a7969fdcd71f7c55b0ba3b0bda6927db9f88f4bb809a1` |
| `scripts/validate-knowledge-hub-schema-sql.mjs` | `e0ce0d2851e000507ab37f11be1e5c44dfd9607e8e7116afb80668586d56898a` |
| `scripts/validate-knowledge-hub-data-only-copy.mjs` | `d70e9e944ddd87068fb612f9a129cdfa5cb3b61852e37150b24b3279bbcabad8` |
| `scripts/knowledge-hub-phase0-schema-inventory.mjs` | `6f9961634458cb4879720a3afa6d376587378d4cc1d3365fa4a6e11a4b356620` |
| `tests/knowledge-hub/remaining-deployment-gates.test.mjs` | `62c551438fb9a9bee51e74e6482bf02c3593feab2614657f90620184367eb504` |
| `registry/current-state.md` | `a304c12c2f7390f16296cd268085fbb8db0ba39509afa2a915957232367c1b72` |
| `registry/document-registry.yaml` | `09b003152ebe59e12e6e9d263ef2b6e0a53e977374b4c32dbee05895c77deaed` |

The checkpoint file itself is a post-freeze addition and therefore is not included in the table above. On resume, first verify all listed hashes and classify any drift before editing.

## 4. Fresh Critic state at pause

### Critic #1 Security / Authority

Latest classification received before pause: `C/H/M = 0/3/3`.

Open High findings:

1. `data-only.sql` persists full database rows as plaintext under the run directory and is not included in cleanup, recovery, or post-effect absence proof.
2. Historical source/target audit does not anchor artifact existence and full durable constituents to the Owner checkpoint; signed authority bytes can be combined with later fabricated manifest/evidence.
3. Archive inspection `pg_restore` paths are not all bounded by the authority deadline after plaintext creation.

Open Medium findings:

1. Restore executor validity/ACL/ownership measurement is incomplete and can act as standing authority longer than intended.
2. A shared authority lock can delay revocation for the remaining receipt lifetime.
3. Exported verified-authority objects need an explicit current time/epoch revalidation boundary before effect use.

### Critic #2 Completeness / Consistency

The re-audit was interrupted by the Owner pause request before a final classification was returned. It must be restarted from the frozen hashes after remediation.

### Critic #3 Runtime / Recovery / Operations

Final classification: `C/H/M = 0/4/1`; start/end hash drift `0`; read-only tests passed.

Open High findings:

1. `PrivateNetwork=yes` creates a new network namespace at unit start, so its inode coordinate cannot be measured and signed before execution. Replace it with a prepared, root-owned named namespace and `NetworkNamespacePath=`, or an equivalently fenced two-stage protocol.
2. Several `psql`/probe paths remain unbounded and can hang across authority expiry; every probe/effect/monitor call needs remaining-deadline-derived connection, statement, lock, and client timeouts.
3. The runbook cannot materialize the current executor/tmpfs/ledger contract on a clean host; it lacks complete user, role, membership, env, directory, mount, hash and read-back commands.
4. The runbook says recovery requires `FAILED`, but the implementation correctly permits closed `*_STARTED` nonterminal phases. Operator criteria must use `requires_recovery=true` plus the closed recoverable-phase enum.

Open Medium finding:

1. The detailed specification is stale relative to the dedicated executor, nonroot sandbox, lease, STARTED recovery and O_EXCL post-effect ledger implementation.

## 5. Resume order

1. Verify branch, base HEAD, key hashes, unrelated files and absence of external effects.
2. Re-run the interrupted Completeness Critic against the frozen snapshot only if needed to refine the remediation plan; do not claim it passed.
3. Close Security findings: plaintext data-only lifecycle, historical artifact/durable anchoring, bounded archive inspection, executor/ACL/epoch/revocation fences.
4. Close Runtime findings: persistent signed namespace, bounded all-PG commands, executable provisioning/runbook, STARTED recovery wording, spec sync.
5. Add negative and failpoint tests for every closure; run focused, full Knowledge Hub, static, roadmap and Registry integrity suites.
6. Freeze new hashes and perform three independent read-only Critic audits with `C/H/M = 0/0/0` required.
7. Only then request a Final Judge. Update canonical task/roadmap/current-state/Registry status in one generation after the Judge decision.
8. The Owner separately authorized this WIP checkpoint commit and branch Push. PR/merge and every VPS/SSH/DNS/ACME/PostgreSQL effect remain stopped.

## 6. Parallel BAI VIDEO PRODUCTION state (informational only)

- TASK-014 I1 PR #139 reached Draft PR exact5 and received the serialized exact1 CHANGELOG Integration Gate before this pause.
- That work belongs to the separate Developer2 task and is not part of this TASK-017 worktree checkpoint.
- No further coordination or mutation is performed by this task while paused.

## 7. Terminal

`TASK017_CHECKPOINT_RECORDED_PAUSED_WITH_OPEN_CRITIC_FINDINGS`

## 8. Remote WIP checkpoint requested by Owner

- Recorded for remote preservation on branch `codex/task-017-phase0-remaining-deployment-gates`.
- Parent revision before the checkpoint commit: `0dc810d8c00db493dc0a194f894b66e180ed7986`.
- Classification: `WIP_CHECKPOINT_ONLY / OPEN_CRITIC_FINDINGS / FINAL_JUDGE_NOT_PASS`.
- Current automated Evidence: Knowledge Hub `119 / 119 PASS`; Remaining Deployment Gates static checker `PASS`; roadmap consolidation `57 / 57 PASS`; `git diff --check` `PASS`.
- Latest independent audit classifications retained at this checkpoint: Security `C0/H3/M3`; Runtime/Recovery `C0/H4/M1`.
- External VPS, PostgreSQL, DNS, ACME, credential, Production Activation and Product pilot effects: `0`.
- Unrelated local content under `.codex/`, `_task013_native_h3_fix/`, `_task015_youtube_feedback_r0/`, `deliverables/`, `output/`, and the BAI VIDEO PRODUCTION OBS Ver1.2 specification is explicitly excluded from this TASK-017 checkpoint.
- Push preserves reviewable work; it does not constitute Critic closure, Final Judge PASS, Release, Deploy or Production Activation.
