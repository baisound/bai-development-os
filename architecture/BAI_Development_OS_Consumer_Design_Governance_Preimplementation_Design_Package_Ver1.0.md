# BAI Development OS — Consumer Design Governance Preimplementation Design Package Ver.1.0

## Document Control

- Date: `2026-08-14`
- Working capability identity: `BAI-OS-CONSUMER-DESIGN-GOVERNANCE-001`
- Task identity: `TASK_ID_PENDING_OWNER_DECISION`
- Status: `DESIGN_COMPLETE / OWNER_DECISION_REQUIRED / IMPLEMENTATION_NOT_AUTHORIZED`
- Target: `BAI Development OS`
- DEV Profile: `DEV_4_FOUNDATION_CRITICAL`
- Baseline: branch `main`, commit `776451aeb39c813770a6b9eb775cb900dcecdf71`
- Historical Tasks: `TASK-016` unchanged, `TASK-017` paused, `TASK-018` completed
- Production Activation: `BLOCKED`

This file is the implementation-ready design package required by the Full Detailed Design Mandate. It does not allocate a Task number, change Canonical Architecture, reopen a completed Task, authorize implementation, release, deploy, paid execution or Production Activation.

## Executive decision

The proposed capability is justified as a new OS-level orchestration boundary, not as a second implementation of KnowledgeOS, MaintenanceOS, CalibrationOS, TASK-016 or TASK-018. The minimum foundation should be inserted after completed TASK-018 and before any separate TASK-017 resume decision. Its purpose is to turn untrusted Consumer handoffs into independently checked design inputs and to fail closed before code when a Critical ambiguity or incomplete design remains.

The current design is technically ready for Owner roadmap and Task-allocation review. Implementation remains unauthorized.

---

# Artifact 1 — Current-state audit

| Item | Independently observed state | Decision |
|---|---|---|
| Checkout | `C:\\home\\baisound\\projects\\os` | Correct OS repository |
| Branch / worktree before intake | `main`, clean | Safe baseline; no local work discarded |
| Local HEAD | `776451aeb39c813770a6b9eb775cb900dcecdf71` | Implementation Source of Truth for this audit |
| `origin/main` | Exact same commit at audit time | No newer remote OS code found |
| Architecture | Ver.2.29 plus Current Roadmap Position Supplement | Do not edit Ver.2.29 historically in place |
| Release | `v1.1.0`, release code commit `81a8445ab8a94fd75034e4c25b63eb7849f5608c` | Current main contains newer documentation supplements |
| TASK-016 | Phase 0 completed; Phase 1+ not authorized | Identity and gate unchanged |
| TASK-017 | Paused at `07af447...`; separate Owner resume required | Do not auto-resume; Production Activation blocked |
| TASK-018 | Completed; v1.1.0 published | Do not reopen |
| Document Registry | 684 records, missing 0, hash/size mismatch 0 before this patch | New documents require registration |
| Roadmap checker | PASS, current Ver.2.29, 56 historical source sections | Proposal is not yet an accepted Canonical source |
| Repository integrity | `git fsck --full` returned no corruption | Dangling historical objects are not active corruption |

Reconciliation finding: the Ver.2.29 summary and historical Part XXX retain TASK-018 active-era wording. Current State, PROJECT, AI Context Pack and the Current Roadmap Position Supplement correctly supersede that wording for current routing. Historical evidence must remain unchanged; a future accepted Architecture version must carry the new route losslessly.

## DEV Profile re-evaluation

The eventual feature touches Context, Authority, Registry, Knowledge, Maintenance, security, lifecycle and roadmap decisions. Foundation and Critical work has a DEV-4 floor. Therefore the proposed implementation is `DEV_4_FOUNDATION_CRITICAL`, even though this particular patch is documentation-only. Required implementation assurance includes independent Critic review, dense schema/negative/boundary/integration/regression tests, fault injection, recovery verification and unresolved Critical/High `0/0`. Balanced execution applies: at most two review/fix cycles per bounded slice; unchanged artifacts do not trigger another Critic loop.

---

# Artifact 2 — Source curation and adjudication

## Package identity

`BAI_DEVELOPMENT_OS_POST_TASK018_CONSUMER_DESIGN_GOVERNANCE_HANDOFF_PATCH_2026-08-14.zip`

The package Manifest and all seven payload hashes were verified. The three repository patch documents were reproduced byte-for-byte from the ZIP and match the supplied SHA-256 values.

| Source | Classification | Trust/freshness adjudication | Use |
|---|---|---|---|
| `README-FIRST.md` | `OS_REQUIREMENT_INPUT` | Current handoff instruction, not Canonical Authority | Read-order and bounded docs-only mandate |
| `SOURCE_CURATION.md` | `HISTORICAL_PROVENANCE` | Curator explanation, independently challenged | Source map and known exclusions |
| `MANIFEST.json` | `OS_REQUIREMENT_INPUT` | Integrity index only; hashes verified | Package identity |
| Roadmap Refinement Proposal Ver.1.0 | `OS_REQUIREMENT_INPUT` | Proposal, `OWNER_REVIEW_REQUIRED` | Candidate insertion and capabilities |
| Full Detailed Design Mandate Ver.1.0 | `OS_REQUIREMENT_INPUT` | Mandatory design brief; no implementation authority | Required outputs and anti-patterns |
| Independent Revalidation Checklist | `OS_REQUIREMENT_INPUT` | Checklist, not execution authority | Audit completeness |
| `.patch` | `HISTORICAL_PROVENANCE` | Adds only the three documents; no code authority | Exact content transfer |
| Consumer-specific BVP details referenced by proposal | `CONSUMER_EVIDENCE` | Trigger evidence; not reclassified as OS Canonical | Boundary justification only |
| Visual Prompt / Visual Compliance semantics | `OUT_OF_SCOPE` | Consumer-owned | Must remain in BVP |
| WebMCP | `UNVERIFIED` / experimental adapter | No dependency accepted | Optional future capability only |

No credential, raw Consumer repository, production project or paid-provider payload was imported. Missing source: the package does not include a complete current BVP checkout or a signed Consumer provenance envelope. This does not block OS design because no BVP product claim is promoted; it would block a claim-specific Consumer acceptance decision.

---

# Artifact 3 — Existing implementation coverage matrix

| Required capability | Existing owner/surface | Coverage | Design decision |
|---|---|---|---|
| ZIP traversal, symlink, size, CRC and compression defense | `src/knowledge-evolution/zip.mjs` | Implemented | Reuse parser; do not add an archive parser |
| Consumer snapshot provenance | `repository-snapshot.mjs`, `snapshot.mjs`, TASK-016 Phase 0 | Implemented | Extend reference use; keep raw source out of Canonical repository |
| Knowledge intake and canonical-authority=false | `knowledge-evolution/intake.mjs` | Implemented | Compose; do not turn design findings directly into Knowledge |
| Handoff critical-file/checksum/Git relation bootstrap | `context-control/handoff-bootstrap.mjs`, TASK-018 | Implemented | Reuse as startup evidence; it does not perform claim-level design review |
| Context authority/conflict/stale control | `context-control/index.mjs` | Implemented | Reuse source priority and stale fail-closed behavior |
| Context measurement/overfetch | `context-cost-observatory.mjs` | Implemented | Add intake phase labels; do not create a cost engine |
| Human Gate parking | `automation/autonomous-queue.mjs` | Implemented | Use for Owner decisions and unavailable native gates |
| Conversation-free resume | `automation/session-rotation.mjs`, `automation/reliability.mjs` | Implemented | Bind checkpoints to intake revision and repository HEAD |
| Workspace/repository registry | `automation/registry.mjs`, Document Registry | Implemented | Read and verify; Canonical writes remain separately authorized |
| Drift/revalidation/repair classes | `maintenance/*` | Implemented | Reuse findings and fail-closed owner-required class |
| Secret scanning/redaction/path confinement | `security/dlp.mjs`, `security/path.mjs` | Implemented | Mandatory before persisting extracted text |
| Supply-chain manifest/signatures | `security/supply-chain.mjs`, signing/authorization | Implemented | Optional signed provenance; required where policy says so |
| Knowledge Candidate lifecycle | `knowledge/candidate.mjs`, `knowledge/governance.mjs`, `knowledge-evolution/intake.mjs` | Implemented | Map only validated improvement evidence; no auto-promotion |
| Evidence recurrence/analytics/recommendations | `calibration/*` | Implemented | Advisory ranking only; cannot weaken floors or authorize roadmap |
| Provider/capability bounded execution | `automation/codex-adapter.mjs`, `automation/engine.mjs` | Implemented | Use only after a later implementation authorization |
| Claim-by-claim revalidation contract | None | Missing | New domain contract required |
| Requirement-to-code/schema/test/UI coverage record | None | Missing | New coverage mapper contract required |
| Structured design-gap and unknown register | Partial prose patterns only | Partial | New machine-readable record required |
| Roadmap impact decision record | Registry proposals exist, no dedicated analysis contract | Partial | New decision record and Owner Gate required |
| Design completeness Gate | Governance precedent exists, no reusable closed contract | Partial | New reusable validator required |
| Regression surface / native interaction acceptance inventory | Conformance and evidence primitives exist | Partial | New generic acceptance contracts; Consumer semantics remain external |

---

# Artifact 4 — Design gap register

| ID | Gap | Severity | Resolution in this design |
|---|---|---:|---|
| DG-01 | Handoff text can be mistaken for Authority | Critical | `canonical_authority=false`, explicit source class, authority Gate |
| DG-02 | Claims lack per-claim current/historical/superseded classification | High | Closed claim result enum with evidence refs |
| DG-03 | Existing implementation may be duplicated | High | Mandatory coverage matrix before gaps or Allowed Files |
| DG-04 | Missing requirements can remain invisible | High | Required gap/unknown challenge checklist and Gate |
| DG-05 | Roadmap recommendation can be mistaken for allocation | Critical | Recommendation-only decision; Owner assigns Task and route |
| DG-06 | Design sections can be silently omitted | High | 30-section completeness floor with justified `NOT_APPLICABLE` only |
| DG-07 | Intake may race a changing checkout | High | Bind observation to root/branch/HEAD/status revision; stale on change |
| DG-08 | Interrupted analysis may produce mixed revision output | High | Atomic per-revision artifact set plus immutable checksum |
| DG-09 | Duplicate handoffs/candidates may multiply | Medium | Deterministic source fingerprint and idempotency key |
| DG-10 | Consumer UI can pass static tests while broken | High | Generic native/interaction evidence contract and explicit parked state |
| DG-11 | Sensitive/raw content may leak into Evidence | Critical | Pre-persistence DLP, redaction map, raw-source reference only |
| DG-12 | Metrics could become policy authority | High | Metrics are advisory; Owner/Policy authorization remains mandatory |
| DG-13 | Historical Architecture summary wording can confuse current routing | Medium | Current overlay precedence; future accepted Architecture only, no history rewrite |
| DG-14 | Task identity is not yet authorized | High | Working capability ID only; Task ID remains pending Owner decision |

Unresolved Critical/High design gaps after the specified controls: `0/0`. External Owner decisions are deliberately not counted as defects; they are Gates.

---

# Artifact 5 — Roadmap impact analysis

Decision: `ROADMAP_REORDER_REQUIRED` plus `NEW_SEPARATE_TASK_CANDIDATE`.

Justification:

- It is cross-cutting Foundation governance and is not a safe Phase-0 deployment addition to TASK-017.
- TASK-018 is complete and must not reopen.
- TASK-016 Phase 1+ is not authorized and should not absorb unrelated intake governance.
- Existing subsystems supply primitives but no single owner supplies the end-to-end design Gate.

Recommended route:

```text
TASK-018 complete / v1.1.0 published
  -> Consumer Design Governance Owner decision
  -> new Task identity allocation after collision audit
  -> Foundation slice implementation and acceptance
  -> separate TASK-017 resume decision
  -> TASK-016 Phase 1+ only under its own authority
```

Safe checkpoint is current `main` plus this docs-only review package. `TASK-017` remains paused and Production Activation remains blocked. The proposal adds one future accepted roadmap source only after Owner acceptance; current historical roadmap source count remains `56` until then. A future Architecture promotion must derive the new count from actual registered source bodies.

---

# Artifact 6 — Full detailed design

## 6.1 Ownership and boundary

New bounded subsystem name: `Consumer Design Governance`.

It owns intake orchestration, claim adjudication, coverage mapping, gap/unknown recording, roadmap recommendation and design-completeness evaluation. It imports existing security, context, knowledge, maintenance, calibration and automation primitives. It does not own Consumer domain semantics, modify Consumer repositories, authorize Tasks, mutate Canonical Architecture, activate Knowledge, perform paid/provider calls, or prove native interaction without real Evidence.

## 6.2 Domain records

All records are closed-schema JSON, UTF-8, canonicalized for checksums, immutable after finalization and carry `schema_version: 1.0.0`.

1. `handoff-intake-manifest`: intake ID, project/Consumer identity, supplied time, source artifacts and hashes, claimed repo/ref/version, provenance completeness, sensitivity, missing sources, assumptions, `canonical_authority=false`, source fingerprint and content checksum.
2. `handoff-revalidation-report`: observed OS root/branch/HEAD/dirty state/status revision, Canonical Registry/Architecture/release facts, per-claim results and Evidence refs.
3. `source-curation-record`: per-artifact OS/Consumer ownership, relevance, freshness, supersession, retention and redaction decision.
4. `implementation-coverage-record`: requirement ID; Task/subsystem/module/schema/store/test/UI/adapter mappings; coverage state; change surface.
5. `design-gap-register`: gap/unknown ID, category, severity, confidence, evidence, disposition and required authority.
6. `roadmap-impact-record`: decision, dependencies, insertion point, safe checkpoint, blocked/unaffected Tasks, migration, Owner Gates and proposed source-count effect.
7. `design-completeness-report`: the 30 mandatory design sections, each `COMPLETE` or justified `NOT_APPLICABLE`, Critic/Judge refs and Gate result.
8. `regression-surface-record`: visible functions, commands, state transitions, schemas, UI/adapter behavior, tests, native Evidence and protected invariants.
9. `interaction-acceptance-record`: environment identity, actual event semantics, layout/DPI/accessibility/long-data/recovery results and Evidence refs.
10. `improvement-candidate-routing-record`: validated observation, reproducibility, recurrence, scope, severity, Critic disposition and `TASK|KNOWLEDGE|REJECT|DEFER` recommendation.

## 6.3 State machine

```text
RECEIVED
  -> INTEGRITY_VERIFIED
  -> CURATED
  -> REVALIDATED
  -> COVERAGE_MAPPED
  -> GAPS_ADJUDICATED
  -> DESIGN_REVIEWED
  -> OWNER_DECISION_REQUIRED
  -> AUTHORIZED | DEFERRED | REJECTED
```

Any integrity, secret, path, provenance or Critical ambiguity failure routes to `QUARANTINED` or `PARKED`. A changed HEAD/status revision after observation routes to `STALE`; it never silently continues. `AUTHORIZED` requires a separate signed/recorded Owner authorization bound to exact design checksum, Task ID and Allowed Files.

## 6.4 Claim results

Closed enum: `CONFIRMED_CURRENT`, `CONFIRMED_HISTORICAL`, `ALREADY_IMPLEMENTED`, `PARTIALLY_IMPLEMENTED`, `SUPERSEDED`, `CONFLICTS_WITH_CURRENT_CANONICAL`, `UNVERIFIED`, `MISSING_EVIDENCE`.

Critical claims in the last four states fail the design Gate. Historical truth may remain valid evidence but cannot override a newer Canonical source.

## 6.5 Application services

- `createHandoffIntake()` validates identity, integrity, provenance, sensitivity and idempotency.
- `curateHandoffSources()` produces explicit relevance/ownership/redaction decisions.
- `revalidateHandoffClaims()` compares claims only through supplied deterministic repository/Registry observations; the domain layer does not run arbitrary shell commands.
- `mapExistingImplementation()` accepts a bounded repository index and produces coverage records.
- `discoverDesignGaps()` evaluates the completeness challenge catalogue; suggestions remain advisory.
- `analyzeRoadmapImpact()` produces a recommendation and never allocates a Task.
- `evaluateDesignCompleteness()` returns `PASS`, `FAIL`, `STALE` or `OWNER_DECISION_REQUIRED`.
- `routeImprovementCandidate()` composes Knowledge/Calibration evidence but never promotes it.
- `createDesignIntakeCheckpoint()` and `resumeDesignIntake()` bind session rotation to the intake revision and current HEAD.

Adapters provide Git, filesystem, Registry, document, native/browser and Consumer observations. Every adapter output records capability, target, time, exit/result, evidence checksum and whether it observed or mutated. Foundation implementation defaults to read-only observations.

## 6.6 Persistence and source of truth

Canonical business records are written under `.bai-os/design-governance/intakes/<intake_id>/revisions/<revision>/`. Each revision is complete only when a final manifest atomically names every artifact checksum. Temporary output lives beneath the same confined root and is not authoritative. Raw attachments are not copied by default; the record stores source identity/hash and retention location. Canonical roadmap and Task records remain in the existing repository governance and are not mutated by this store.

Concurrency uses an intake/revision lease. A second writer receives a conflict. Finalized revisions are immutable; a changed analysis creates a new revision with `supersedes_revision`.

## 6.7 Evidence and observability

Every material result references source checksum, repository observation, rule/version and output checksum. Logs redact sensitive values and never embed full raw Consumer files. Candidate metrics are those listed in the Mandate, plus quarantine count, stale-restart count and unsupported-adapter count. Metrics provide review input only and cannot authorize or weaken policy.

## 6.8 UI and accessibility

No OS GUI is required in the foundation slice. Machine-readable records and a Markdown report projection are sufficient. When a Consumer change has UI impact, its interaction record must cover real button/focus/click-vs-drag/scroll/clipping/native-picker/DPI/long-data/recovery/dead-control/accessibility-label behavior as applicable. Unsupported real execution is `PARKED`, never `PASS`.

## 6.9 Cost and external operations

Static local audit is the default. Paid providers, credit changes, production writes and external mutation remain denied. Context Cost Observatory measures estimated/provider/cached/output/billed dimensions without fabricating null provider data. A reduced context plan must always retain Authority, Safety, current state, source hashes and unresolved Critical/High items.

## 6.10 Rollout

Foundation ships disabled by default behind an explicit application call, first against deterministic fixtures and the provided handoff package. A canary pilot may then use a read-only Consumer checkout. No Consumer write or Canonical roadmap mutation is part of canary. Rollback disables the export/entrypoint and preserves finalized Evidence; schema 1.0 readers remain available while records exist.

---

# Artifact 7 — Schema, version and migration plan

Create the ten schemas listed in §6.2 under `schemas/design-governance/`, each Draft 2020-12, closed root and nested objects, `schema_version` const `1.0.0`, strict enums, bounded strings/arrays and checksum patterns.

There is no persisted predecessor, so migration at v1 is `NONE`. Existing TASK-016 snapshot and TASK-018 handoff records are referenced, not rewritten. Compatibility adapters may read their existing v1 records into observations without changing source bytes. Future breaking schema versions require explicit migrator, old-reader fixture, rollback checkpoint and dual-read period; unknown major versions fail closed. Canonical Architecture migration is a separate Owner-authorized documentation action.

---

# Artifact 8 — Security and privacy review

Threats and controls:

- Archive traversal/symlink/zip bomb: reuse bounded `parseZip()`; reject unsupported/encrypted/multidisk/ZIP64 inputs.
- Document/prompt injection: attachment instructions are untrusted content; Authority classification occurs outside extracted text.
- Secret/PII leakage: run DLP before persistence, keep redaction map, store raw content by reference, apply sensitivity ceiling to context.
- Repository/path escape: reuse realpath/symlink-aware confined path helpers and atomic writes.
- Tampering: SHA-256 over source bytes and canonical records; optional existing signature envelope when required.
- Supply chain: record source manifest, size and checksum; a Manifest proves identity, not correctness.
- Ambiguous external state: foundation read-only; any later mutation needs idempotency, target identity and recovery Evidence.
- Learning poisoning: untrusted/single-Consumer claims cannot become active Knowledge or calibration authority.

Result: `SECURITY_DESIGN_PASS`, contingent on reuse of existing primitives and negative tests. No secrets were found or copied by this docs-only audit.

---

# Artifact 9 — Authority and risk matrix

| Operation | Risk | Authority | Default |
|---|---:|---|---|
| Read local handoff/current repo | Low | Current design mandate | Allowed, bounded |
| Persist derived intake revision | Medium | Future Task implementation authorization | Denied now |
| Quarantine unsafe derived/raw artifact | High | Security policy plus exact operation authorization | Denied now |
| Create Knowledge Candidate | Medium | Knowledge governance | Proposal only |
| Promote Knowledge | High | Existing Critic/Owner governance | Denied |
| Recommend roadmap change | Medium | Design service | Allowed as Evidence |
| Allocate/reopen/renumber Task | Critical | Owner | Denied |
| Change Canonical Architecture/Registry | High | Owner-authorized docs slice | Denied now |
| Consumer repository write/native project write | Critical | Consumer Owner and task-specific Gate | Denied |
| Paid/provider execution | High | Budget plus Owner authority | Denied |
| Release/Tag/Deploy/Production Activation | Critical | Exact closure/release authority | Denied |

---

# Artifact 10 — Failure, recovery and idempotency design

- Idempotency key: SHA-256 of project identity, normalized source artifact hashes, claimed ref and design-contract major version.
- Same key plus same content returns the existing revision; same key with different bytes is `INTAKE_IDEMPOTENCY_CONFLICT`.
- Each stage writes temporary data, validates checksums, then atomically finalizes the revision manifest.
- Restart loads only a finalized checkpoint and verifies intake ID, revision, project, Task/capability ID, HEAD, status revision and source observations.
- Changed repository state marks prior results `STALE` and starts revalidation; it does not reuse a PASS.
- Timeout during a read-only adapter becomes `UNVERIFIED`. Timeout after any future external dispatch becomes `UNKNOWN_EXTERNAL_STATE` and requires reconciliation before retry.
- Retry only deterministic/read-only failures with bounded attempts and changed hypothesis. Never retry paid/destructive/non-idempotent operations blindly.
- Corrupt derived records may be quarantined with MaintenanceOS; Canonical/Authority ambiguity is Owner-required, never auto-repaired.
- Rollback restores the pre-write checkpoint or disables the new entrypoint. Raw source and historical Evidence are not deleted.

---

# Artifact 11 — Regression plan

Protected invariants:

- TASK-016/017/018 identities and statuses;
- TASK-017 pause/resume boundary and Production Activation block;
- handoff never becomes Authority;
- Knowledge candidates never auto-promote;
- DEV/Security floors cannot weaken;
- no raw Consumer repository or secrets enter Canonical docs;
- no direct `main` write, release or deploy;
- existing public exports and schema readers remain compatible.

Regression runs cover context-control, automation, knowledge, knowledge-evolution, maintenance, calibration, security, registry/document verification, roadmap consolidation and full `npm test`. Expected code diff for a future foundation slice is additive except explicit index/package exports.

---

# Artifact 12 — Native and interaction acceptance plan

Foundation acceptance uses a real ZIP handoff, a clean OS checkout, a dirty checkout fixture, stale/equal/newer Git relations, conflicting Canonical claims and a read-only real Consumer checkout. UI-affecting pilot acceptance requires real browser/desktop/native evidence for applicable interaction cases; mock/static results remain `HOSTED_ONLY` or `PARKED`. Human-owned Resolve/Cubase/production projects, paid generation and destructive UI operations remain outside this capability unless a separate task grants exact authority.

---

# Artifact 13 — Test plan

1. Schema positive/negative/unknown-field/enum/bounds/checksum tests for every new record.
2. ZIP traversal, symlink, duplicate, CRC, size, ratio and malformed-header regression.
3. DLP, prompt-instruction authority, path confinement and signed provenance tests.
4. Claim classification table tests including stale and Canonical conflict.
5. Coverage mapper duplicate/reuse/partial mapping tests.
6. Completeness Gate tests for every mandatory section and justified `NOT_APPLICABLE`.
7. State-machine invalid transition, concurrency lease and immutable revision tests.
8. Crash/fault injection before and after final manifest publication.
9. Resume/idempotency/changed-HEAD/unknown-external-state tests.
10. Knowledge/Calibration no-auto-promotion tests.
11. Roadmap recommendation cannot allocate a Task or edit Canonical files.
12. Context Cost and minimum-safe-source retention tests.
13. Focused subsystem regression, all conformance checks, full `npm test`, WSL2 parity where available, `git diff --check`, registry integrity and roadmap checker.

Implementation PASS requires all required tests, unresolved Critical/High `0/0`, and real/native Evidence only where claimed.

---

# Artifact 14 — Context loading plan

Read order for this design capability:

1. `PROJECT.md`, `registry/current-state.md`, `registry/ai-context-pack.md`, context-loading rules.
2. Current Roadmap Position Supplement and current Architecture summary; load relevant Canonical sections on demand.
3. Task status summaries for TASK-016/017/018 without reopening them.
4. Package README, Manifest/hashes, curation and mandate.
5. This design package, Critic review, Judge/Owner decision and authorization boundary.
6. Only mapped source modules/tests needed for the current claim.

Always load Authority, Safety, current HEAD/status, source integrity and unresolved Critical/High items. Prefer summaries and coverage indices to full-repo rereads. Record Context Cost; token reduction cannot omit a safety floor. Conversation-free resume requires a checksum-bound checkpoint and revalidation of changed observations.

---

# Design package disposition

Artifacts 1–14 are complete. Artifacts 15–17 are separate review/decision files. No source implementation is authorized by this package.
