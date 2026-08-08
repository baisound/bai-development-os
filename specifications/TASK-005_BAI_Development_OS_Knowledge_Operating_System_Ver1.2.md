# TASK-005 BAI Development OS Knowledge Operating System Detailed Design Ver.1.2

## Document Control

| Item | Value |
| --- | --- |
| Document | TASK-005 Knowledge Operating System Detailed Design |
| Version | 1.2 |
| Status | CURRENT_CANONICAL / COMPLETED_IMPLEMENTATION |
| Date | 2026-08-08 |
| Product Root | `/home/baisound/bai-development-os` |
| Development Profile | `DEV_4_FOUNDATION_CRITICAL` |
| Predecessor | TASK-004 Lifecycle Foundation Ver.1.6 / COMPLETED |
| Parent Architecture | BAI Development OS Architecture Ver.2.5 at design start; Ver.2.6 after completion synchronization |
| Authority | Owner direct instruction to proceed with detailed design and development |

## Version Lineage Recovery Note

Existing Architecture and TASK-004 material repeatedly reference a former `TASK-005 詳細設計書 Ver.1.1`, but that source file is not present in the delivered standalone repository. Ver.1.2 does not invent historical evidence for that missing file. It reconstructs the current canonical design from the surviving parent Architecture, TASK-004/TASK-005 responsibility-boundary review, Foundation Improvement Integration Plan, TASK-004 Lifecycle Foundation interface contracts, and the Owner's current instruction. Historical references to Ver.1.1 remain unchanged.

# 1. Purpose

Knowledge OS is the BAI Development OS subsystem responsible for safely converting reusable experience into governed Knowledge Assets and reliably applying those Assets to future work. It is not a generic note store and not a Task state machine.

The subsystem must provide:

- explicit taxonomy and vocabulary;
- immutable Knowledge Asset revisions;
- provenance, trust, sensitivity, confidence and freshness metadata;
- Global / Domain / Technology / Specialization / Tool / Project / Task scope;
- Failure Knowledge, reusable patterns and ADR-equivalent decision knowledge;
- deterministic resolution for Task / Role / Phase conditions;
- version-pinned Knowledge Packs;
- usage, deviation, verification and effectiveness evidence;
- promotion, demotion, freshness, invalidation and impact analysis;
- fail-closed Governance for activation and high-impact changes.

# 2. Responsibility Boundary

## 2.1 TASK-005 Owns

- Knowledge Asset identity and revision lifecycle.
- Knowledge Status, Maturity Stage and Enforcement Level.
- Knowledge taxonomy, vocabulary and relations.
- Source trust, provenance, confidence and Knowledge freshness.
- Resolution/ranking and Knowledge Pack construction.
- Knowledge usage/deviation/verification/effectiveness records.
- Promotion/demotion and INVALID/STale governance.
- Impact analysis after Knowledge invalidation.
- Failure fingerprints and recurrence knowledge.

## 2.2 TASK-005 Does Not Own

- Task Lifecycle Status, current Phase, Gate or Authorization.
- Context Manifest as a whole.
- Model routing and execution budget.
- Workspace Registry canonical content.
- Role routing / autonomous orchestration.
- External connector execution.

## 2.3 TASK-004 Interface

```text
TASK-004 Lifecycle / Context
        |
        | Knowledge Resolution Request
        v
TASK-005 Knowledge Resolver
        |
        | Resolution Result + Knowledge Pack
        v
TASK-004 Context Manifest / Context Guard
        |
        v
Role Execution
        |
        | Usage / Deviation / Verification
        v
TASK-005 Usage Ledger / Effectiveness / Impact
```

Knowledge Pack MUST NOT bypass Context Manifest. An ACTIVE Knowledge Asset may still be excluded by TASK-004 when the current Task context, sensitivity, freshness or other Context Guard condition makes it unsafe.

# 3. Three Orthogonal Knowledge Axes

| Axis | Values | Purpose |
| --- | --- | --- |
| Asset Status | CANDIDATE, DRAFT, UNDER_REVIEW, ACTIVE, STALE, DEPRECATED, INVALID, ARCHIVED | Can the current revision be used? |
| Maturity | EXPERIENCE, OBSERVATION, IDEA, KNOWLEDGE_ASSET, FRAMEWORK, STANDARD, ORGANIZATION_STANDARD | How mature is the idea? |
| Enforcement | MANDATORY, CONDITIONAL_MANDATORY, ADVISORY, REFERENCE | How strongly does it constrain work? |

These axes MUST remain separate. `STANDARD` is maturity, not an ACTIVE/STALE status.

# 4. Phase 1 — Taxonomy and Vocabulary

## 4.1 Scope Levels

Ordered from broadest to most specific:

1. GLOBAL
2. DOMAIN
3. TECHNOLOGY
4. SPECIALIZATION
5. TOOL
6. PROJECT
7. TASK

More specific applicable knowledge receives a ranking advantage, but specificity MUST NOT override Enforcement or safety requirements.

## 4.2 Vocabulary Registry

Each vocabulary entry contains:

- `term_id`
- canonical `term`
- aliases
- human description when maintained by companion documentation

Aliases MUST be unique after case normalization. Duplicate canonical terms or alias collisions fail validation.

## 4.3 Taxonomy Graph

Taxonomy nodes contain stable IDs, labels, optional scope level and parent IDs. Parent references must resolve and the parent graph must remain acyclic.

# 5. Phase 2 — Knowledge Asset Schema and Revision Repository

## 5.1 Required Asset Identity

Each revision contains at minimum:

- `asset_id`
- integer `revision`
- title and Knowledge Type
- Status / Maturity / Enforcement
- Scope and applicability
- Source Trust / Sensitivity / Confidence
- provenance and evidence references
- content summary, guidance, required/prohibited actions, verification steps
- freshness dates
- relations
- `created_at`, `updated_at`
- canonical SHA-256 checksum

## 5.2 Knowledge Types

- PRINCIPLE
- GOOD_PRACTICE
- PROHIBITION
- SUCCESS_CASE
- FAILURE_CASE
- LESSON_LEARNED
- ADR
- PROCEDURE
- TEMPLATE
- QUALITY_CRITERION
- TROUBLESHOOTING

## 5.3 Revision Rules

- `asset_id` is immutable.
- Revision starts at 1 and increments by exactly one.
- Historical revision files are write-once.
- Current pointer references one revision and checksum.
- Current pointer rollback or checksum mismatch is detected.
- Asset content tampering is detected by checksum.
- Asset event history is append-only and hash-chained.
- Current Asset and latest Asset Event must agree.

## 5.4 Repository Layout

```text
<knowledge-repository>/
  assets/
    <asset-id>/
      current.json
      revisions/
        000001.json
        000002.json
  packs/
    <pack-id>.json
  event-log.jsonl
  usage-log.jsonl
```

Runtime APIs accept repository root as input. No consumer-project absolute path is hardcoded.

## 5.5 Mutation Safety

A repository write cannot silently activate a new Asset. New ACTIVE/non-draft imports require an explicit migration/import authorization. Status changes on an existing Asset require a matching Governance Decision. Persistence primitives are therefore not a Governance bypass.

# 6. Phase 3 — Scope and Applicability

Scope answers **where** Knowledge is valid. Applicability answers **under which execution conditions** it is valid.

Applicability may constrain:

- Role
- Lifecycle Phase
- environment tags
- project tags
- exact tool versions for bounded rules

Resolver must reject non-matching knowledge instead of assuming broader applicability.

# 7. Phase 4 — Failure Knowledge

A FAILURE_CASE Asset extends the common schema with:

- fingerprint
- recurrence key
- failure mode
- environment scope
- safe action
- prohibited inference
- evidence references

Failure Knowledge without evidence cannot be accepted by the runtime schema. Fingerprints are used to detect duplicate recurrence candidates before new Assets are created or promoted.

## 7.1 TASK-004 Candidate Migration

The 14 Failure Knowledge candidates identified during TASK-004 are migrated into `knowledge/seeds/task004-failure-candidates.json` as `CANDIDATE` records only. Migration MUST NOT silently promote them to ACTIVE.

# 8. Phase 5 — Patterns and Anti-patterns

Pattern records contain:

- PATTERN or ANTI_PATTERN kind
- problem
- context
- solution
- consequences
- observable indicators

Patterns remain governed Knowledge content. A recurring observation does not become mandatory merely because it is repeated.

# 9. Phase 6 — ADR / Decision Knowledge

ADR Knowledge records contain:

- stable Decision ID
- proposed/accepted/superseded/rejected decision state
- context
- decision
- alternatives
- consequences
- optional superseded decision ID

ADR state does not replace Knowledge Asset Status. An accepted ADR can still become STALE or DEPRECATED as Knowledge.

# 10. Phase 7 — Deterministic Resolution and Ranking

## 10.1 Request Contract

Knowledge Resolution Request includes:

- Task ID
- Role
- Phase
- scope context
- Tool versions
- environment/project tags
- maximum sensitivity
- token budget
- explicit required Asset IDs/tags when applicable
- minimum Source Trust threshold
- current evaluation time

## 10.2 Eligibility Filter

Resolver excludes Assets that are:

- not ACTIVE;
- scope-incompatible;
- applicability-incompatible;
- above allowed sensitivity;
- below required Source Trust;
- expired, invalid, stale, deprecated or archived.

`REVIEW_DUE` remains eligible but is visible to freshness monitoring; actual expiry hard-blocks use.

## 10.3 Ranking

Ranking is deterministic and ordered primarily by:

1. Enforcement level
2. Scope specificity
3. Source Trust
4. Confidence
5. Revision tie-breaker
6. Asset ID stable tie-break

The same input set produces the same ordered result.

## 10.4 Relations

- `SUPERSEDES`: eligible successor removes predecessor.
- `REQUIRES`: selected Knowledge requires target Knowledge.
- `CONFLICT`: conflicting selections are resolved by rank only when safe.
- two conflicting MANDATORY Assets hard-block resolution.
- missing dependency of MANDATORY Knowledge hard-blocks resolution.

## 10.5 Missing Mandatory Knowledge

Resolution is BLOCKED when:

- an explicitly required Asset is unavailable;
- a required tag is unavailable;
- applicable MANDATORY Knowledge is expired/untrusted beyond threshold/sensitivity-blocked;
- mandatory relation requirements are unresolved;
- mandatory conflict exists.

# 11. Phase 8 — Version-pinned Knowledge Pack

Knowledge Pack contains immutable references to selected `asset_id + revision + checksum` and materializes only execution-relevant content:

- summaries
- required actions
- prohibited actions
- verification steps
- enforcement
- sensitivity / source trust metadata

## 11.1 Token Budget

When Pack content exceeds the request token budget:

- lower-priority REFERENCE / ADVISORY items may be removed deterministically;
- MANDATORY and applicable CONDITIONAL_MANDATORY items are never silently trimmed;
- if mandatory content alone exceeds budget, Pack construction hard-stops.

## 11.2 Validity

Pack validity ends at the earliest of:

- configured Pack TTL;
- any selected Asset expiry.

Pack is invalid when source revision/checksum/status changes.

## 11.3 Context Boundary Adapter

Knowledge Pack converts to a TASK-004 Context Source with:

- `trust_level = TRUSTED`
- checksum = Pack checksum
- token estimate = Pack estimate
- sensitivity = maximum selected Asset sensitivity
- revalidation = Pack expiry

This adapter produces a Context Source, not a Context Manifest and not an execution prompt.

# 12. Phase 9 — Application, Deviation, Verification and Effectiveness

Each usage event records:

- Event ID
- Pack ID
- Asset ID / Revision
- Task ID
- APPLIED / DEVIATED / NOT_APPLICABLE
- verification PASS / FAIL / NOT_RUN
- deviation reason
- exception approval when required
- outcome and Evidence references

MANDATORY / CONDITIONAL_MANDATORY Knowledge cannot be DEVIATED without explicit approved exception evidence.

Mandatory Assets with verification steps are not considered fully applied until verification is PASS.

Usage records are appended to a hash-chained usage ledger so later Impact Analysis does not depend on ephemeral process memory.

# 13. Phase 10 — Promotion and Demotion

Promotion broadens the scope of Knowledge. Demotion narrows it.

## 13.1 Promotion Safety Floor

At minimum:

- verified success count >= 3;
- independent Knowledge Reviewer approval;
- GLOBAL promotion requires evidence across at least 3 distinct projects and Owner approval;
- MANDATORY Knowledge promotion also requires Owner approval.

Thresholds are an initial safety floor, not a promise that every Asset with three successes must be promoted.

## 13.2 Demotion

Demotion requires Knowledge Reviewer or Owner authority and creates a new Asset revision. Historical broader revisions remain immutable.

# 14. Phase 11 — Freshness, Invalidation and Impact Analysis

Freshness states:

- FRESH
- REVIEW_DUE
- EXPIRED
- STALE
- DEPRECATED
- INVALID
- ARCHIVED

Review due does not silently invalidate an ACTIVE Asset; expiry prevents resolution.

When an Asset is declared INVALID, Impact Analysis correlates its exact revision with persisted Knowledge Pack and Usage events and returns:

- affected Tasks
- affected Pack IDs
- usage count
- severity
- required action recommendation

MANDATORY invalidation is CRITICAL and recommends `BLOCK_OR_IMMEDIATE_FOLLOW_UP`. TASK-005 emits the notice; TASK-004 decides whether a Task actually becomes BLOCKED or receives a Follow-up Task.

# 15. Phase 12 — Knowledge Governance

## 15.1 Status Transition Model

```text
CANDIDATE -> DRAFT -> UNDER_REVIEW -> ACTIVE
     |          |          |           |
     +----------+----------+           +-> STALE -> UNDER_REVIEW
                                     \ +-> DEPRECATED -> UNDER_REVIEW / ARCHIVED
                                      \+-> INVALID -> ARCHIVED
```

ARCHIVED is terminal in the MVP.

## 15.2 Activation / Invalidation Authority

- ACTIVE and INVALID transitions require Knowledge Reviewer approval.
- GLOBAL or MANDATORY ACTIVE/INVALID transitions additionally require Owner approval.
- UNTRUSTED Knowledge cannot become ACTIVE directly.
- Governance Decision is bound to Asset ID and source Status and cannot be replayed against another Asset/status.

# 16. Source Trust and Context Trust

Knowledge Source Trust values:

- CANONICAL
- OFFICIAL
- VERIFIED_INTERNAL
- USER_OBSERVED
- EXTERNAL_REFERENCE
- AI_INFERRED
- UNTRUSTED

This is different from TASK-004 Context Trust. Knowledge Source Trust measures evidence quality; Context Trust decides how the current execution may use the resulting source.

# 17. Persistence and Audit Integrity

## 17.1 Asset Event Log

Every persisted revision appends a hash-linked Event containing sequence, timestamp, event type, Asset ID, revision, actor, authority, previous hash and payload checksum.

## 17.2 Usage Ledger

Usage records use a separate hash-linked log. Asset lifecycle and usage evidence are kept distinct.

## 17.3 Immutable Knowledge Packs

Persisted Pack files are write-once. Duplicate Pack ID creation fails.

## 17.4 Path Confinement

Repository paths are lexically confined and real-path checked. Symlinked Asset or Pack paths that escape the repository root fail closed.

# 18. Error Families

| Family | Examples |
| --- | --- |
| Schema | `KNOWLEDGE_SCHEMA_INVALID`, `KNOWLEDGE_FAILURE_SCHEMA_INVALID` |
| Identity / Revision | `KNOWLEDGE_ID_INVALID`, `KNOWLEDGE_REVISION_SEQUENCE`, `KNOWLEDGE_ID_IMMUTABLE` |
| Graph | `KNOWLEDGE_GRAPH_DANGLING_RELATION`, `KNOWLEDGE_GRAPH_CYCLE` |
| Resolution | `KNOWLEDGE_RESOLUTION_BLOCKED`, mandatory conflict / missing requirement reasons |
| Pack | `KNOWLEDGE_PACK_BUDGET_BLOCKED`, `KNOWLEDGE_PACK_EXPIRED`, `KNOWLEDGE_PACK_REVISION_STALE` |
| Governance | `KNOWLEDGE_GOVERNANCE_BYPASS_FORBIDDEN`, `KNOWLEDGE_OWNER_APPROVAL_REQUIRED` |
| Repository Integrity | `KNOWLEDGE_CHECKSUM_MISMATCH`, `KNOWLEDGE_EVENT_CHAIN_INVALID`, `KNOWLEDGE_CURRENT_POINTER_INVALID` |
| Usage | `KNOWLEDGE_MANDATORY_DEVIATION_NOT_AUTHORIZED`, `KNOWLEDGE_LEDGER_CHAIN_INVALID` |
| Boundary | `KNOWLEDGE_PATH_ESCAPE` |

# 19. Runtime Modules

```text
src/knowledge/
  constants.mjs
  errors.mjs
  util.mjs
  taxonomy.mjs
  asset.mjs
  graph.mjs
  candidate.mjs
  resolver.mjs
  pack.mjs
  usage.mjs
  freshness.mjs
  governance.mjs
  impact.mjs
  repository.mjs
  ledger.mjs
  index.mjs
```

Public package export: `bai-development-os/knowledge`.

# 20. Schemas

Canonical machine contracts:

- `schemas/knowledge/knowledge-asset.schema.json`
- `schemas/knowledge/failure-knowledge.schema.json`
- `schemas/knowledge/knowledge-taxonomy.schema.json`
- `schemas/knowledge/knowledge-resolution-request.schema.json`
- `schemas/knowledge/knowledge-resolution-result.schema.json`
- `schemas/knowledge/knowledge-pack.schema.json`
- `schemas/knowledge/knowledge-usage-event.schema.json`
- `schemas/knowledge/knowledge-governance-decision.schema.json`

# 21. Templates

- Knowledge Asset
- Failure Knowledge
- Pattern / Anti-pattern
- ADR
- Candidate Handoff
- Resolution Record

Templates are authoring aids, not canonical runtime state.

# 22. Testing Strategy — DEV-4

TASK-005 is a foundation-critical subsystem. Test emphasis is intentionally higher than ordinary features.

Required coverage includes:

- taxonomy cycle / alias collision;
- schema/provenance/revision validation;
- scope and applicability boundaries;
- failure fingerprint duplicate handling;
- graph dangling/cycle detection;
- deterministic ranking;
- mandatory conflict and dependency hard stop;
- sensitivity and expiry rejection;
- token-budget trimming without dropping mandatory knowledge;
- Pack revision and expiry invalidation;
- mandatory deviation authority;
- application verification completeness;
- promotion/demotion authority;
- Global promotion diversity floor;
- Repository tampering and current-pointer rollback;
- Event/Usage ledger tampering;
- symlink root escape;
- Context Manifest integration boundary;
- TASK-004 full regression and Product Boundary regression.

# 23. Explicit Non-goals / Deferred to Later Tasks

- Workspace-wide discovery/index rebuild: TASK-006.
- Runtime/project/risk resolvers: TASK-006.
- Automatic prompt assembly / autonomous Role routing: TASK-006.
- Monitoring dashboards and Knowledge Debt metrics visualization: TASK-007.
- External source connectors and remote Knowledge ingestion: TASK-008.
- SBOM/signing/general supply-chain hardening beyond local integrity boundary: TASK-009.
- Advanced semantic/embedding ranking and self-calibrating Knowledge ranking: TASK-006 Advanced Guard / TASK-014 calibration.

# 24. Acceptance Criteria

1. The same Resolution input and Asset set returns deterministic selection order.
2. MANDATORY Knowledge cannot be silently dropped because of token budget.
3. Mandatory conflicts/missing requirements produce BLOCKED result.
4. Knowledge Pack pins revision/checksum and is invalidated by source change or expiry.
5. MANDATORY deviation requires explicit exception approval.
6. Knowledge repository detects content, event-chain and current-pointer tampering.
7. Repository mutation cannot bypass Knowledge Governance.
8. Failure Knowledge requires Evidence and duplicate fingerprint detection exists.
9. Global promotion has Reviewer + Owner + cross-project evidence floor.
10. INVALID Knowledge can identify affected Tasks without changing Task status.
11. Knowledge Pack enters execution through TASK-004 Context Manifest.
12. Full BAI Development OS regression remains green.
13. TASK-004 candidate failures remain CANDIDATE after migration.
14. Current canonical documentation and Registry are synchronized after implementation.

# 25. Completion Direction

When all acceptance criteria pass, TASK-005 may be marked COMPLETED and the next canonical development route becomes TASK-006 — Workspace Registry / Resolver / Automation Foundation. TASK-005 completion does not automatically authorize TASK-006 mutation or autonomous execution.


# 26. Completion Record

TASK-005 implementation completed on 2026-08-08 under `DEV_4_FOUNDATION_CRITICAL`. All twelve internal phases have executable runtime surfaces and test coverage. The final Knowledge-specific suite passes `75 / 75`; the complete BAI Development OS suite passes `309 / 309`; the JavaScript Roulette Reference Consumer suite passes `10 / 10`; Product Boundary and root export verification pass.

Blocking Critic findings resolved before completion:

1. Current pointer rollback/tamper detection was strengthened by binding current Asset state to the latest hash-chained Asset Event.
2. Repository primitives were prevented from bypassing Knowledge Governance for new ACTIVE/non-draft Assets or Status changes.
3. Knowledge Usage and Knowledge Pack evidence were moved to persistent, checksum/hash-chain-backed artifacts.
4. Concurrent Usage Ledger mutation fails closed through an explicit lock.
5. Repository, Event Log, Usage Ledger and Knowledge Pack persistence reject symlink/root escape on write as well as read.

Accepted residual limitation: Asset revision file, current pointer, and Asset Event are separate filesystem writes. A process/power interruption between these writes may leave an incomplete transaction. Repository verification detects the mismatch and Safe Stops; automatic journal recovery is intentionally deferred to TASK-009/TASK-012 rather than silently repairing canonical Knowledge.

TASK-005 does not start TASK-006. TASK-006 remains the next canonical development route and requires its own active Task instruction/authority.
