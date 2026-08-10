# BAI Development OS — Consumer Knowledge Evolution Roadmap Refinement Ver.1.0

## Document Control

- Status: `CURRENT_PLANNING_SUPPLEMENT / NOT_IMPLEMENTATION_AUTHORIZATION`
- Effective date: `2026-08-11`
- Current Architecture Canonical: `BAI Development OS Architecture Ver.2.28`
- Current implementation baseline: TASK-004〜015 `COMPLETED`
- Current next task: TASK-016 `NEXT / NOT_STARTED / NOT_AUTHORIZED`
- Follow-on: TASK-017 `NOT_STARTED / NOT_AUTHORIZED`
- Owner decision recorded by this refinement: Consumer-project knowledge must begin accumulating immediately from already-running BAI VIDEO PRODUCTION without waiting for cloud infrastructure.
- Canonical Knowledge authority remains the private BAI Development OS Git repository.
- Knowledge Hub v1 database decision: `PostgreSQL`.
- Knowledge Hub v1 infrastructure hard ceiling: `3,000 JPY/month`.
- Implementation authorization created by this document: `NONE`.

## 1. Refinement Decision

The existing TASK-017 Knowledge Evolution route remains valid, but waiting until the complete Knowledge Hub exists would create a knowledge-loss window for already-running Consumer Projects. The roadmap is therefore refined without renumbering TASK-016/017:

1. `Pattern C — Manual ZIP Snapshot Review` becomes an immediate Fast Track inside `TASK-016 Phase 0`.
2. `Pattern A — Cloud Knowledge Hub` remains an early TASK-017 automation route after the common ingestion contracts are proven.
3. `Pattern B — Direct Local Integration` is deliberately deferred until the common ingestion core is stable and real convenience demand justifies implementation.

TASK-016 retains its original Resilience/Recovery/Scalability certification responsibility. Phase 0 is an enabling bridge, not a replacement for TASK-016.

## 2. Three Ingestion Patterns

### Pattern A — Cloud Knowledge Hub

`Consumer Project -> Evidence API -> BAI Knowledge Hub -> BAI Development OS review/import`

Purpose: cross-repository/private-repository-safe automated Evidence exchange.

### Pattern B — Direct Local Integration

`Consumer Project on local OS -> Local Adapter -> Common Ingestion Core`

Purpose: later convenience automation for projects developed directly on a local BAI Development OS workspace.

### Pattern C — Manual ZIP Snapshot Review

`Development OS + Consumer Product + Evidence/Docs -> ZIP -> Review/Extraction -> Knowledge Intake Package -> BAI Development OS`

Purpose: immediate capture from active Consumer Projects before Hub/local automation exists.

Priority: `C -> A -> B`.

## 3. Canonical Authority Boundary

The Hub, Consumer repository, local outbox, ZIP archive, ChatGPT review workspace and generated Candidate package are Evidence/Candidate transports. They are not Canonical Knowledge authorities.

Only reviewed/authorized knowledge merged into the private BAI Development OS Git repository may become Canonical Knowledge.

Consumer Projects SHALL NOT receive BAI Development OS private-repository write credentials.

## 4. Common Ingestion Architecture

All source routes converge on one logical pipeline:

```text
Pattern A Hub Adapter ---------+
                               |
Pattern B Local Adapter -------+--> Common Ingestion Core
                               |        |
Pattern C ZIP Adapter ---------+        v
                                    Evidence
                                       |
                                       v
                                   Candidate
                                       |
                         Dedup / Conflict / Scope / Risk
                                       |
                                       v
                              Critic / Judge Gate
                                       |
                                       v
                           Canonical Knowledge Patch
                                       |
                                Branch -> PR -> CI
```

The architecture SHALL NOT create separate knowledge engines for A/B/C.

## 5. TASK-016 Phase 0 — Consumer Knowledge Capture Bridge

### 16.0.1 Common schema foundation

Define machine-readable contracts for:

- Knowledge Evidence
- Knowledge Candidate
- Snapshot Manifest

### 16.0.2 Pattern C contract

Define accepted ZIP structures, provenance recovery, `PARTIAL` provenance, exclusion policy, source hashing and output package structure.

### 16.0.3 Manual intake implementation

Provide the minimum repeatable process/tooling necessary to convert an uploaded Consumer+OS ZIP into a validated Knowledge Intake Package.

### 16.0.4 Governance integration

Define Candidate scope (`project`, `domain`, `product-family`, `organization`, `universal`) and risk (`LOW`, `MEDIUM`, `HIGH`) plus corresponding review floor.

### 16.0.5 First BAI VIDEO PRODUCTION intake

Use a real current BAI VIDEO PRODUCTION + Development OS snapshot as the first validation source.

### 16.0.6 Regression and repository integration

Validate schemas, next-task loading, registry consistency and ordinary OS regression/conformance. Approved knowledge still enters main only through Branch -> PR -> GitHub Actions -> Merge.

## 6. TASK-016 Phase 0 Exit Criteria

Phase 0 is usable when all are true:

1. A Development OS + Consumer ZIP can be accepted without Knowledge Hub infrastructure.
2. Manifestless ZIP is supported; missing provenance is recorded as `PARTIAL` or `UNVERIFIED` and never guessed.
3. Evidence/Candidate records validate against versioned schemas.
4. Raw ZIP archives, credentials, `.env`, private keys and unnecessary Consumer content are not committed to Canonical Knowledge.
5. A real BAI VIDEO PRODUCTION snapshot yields at least one reviewed reusable Candidate.
6. Product-specific knowledge remains separated from broader reusable knowledge.
7. Rejected/failed approaches are first-class negative Knowledge candidates.
8. Approved canonical changes can flow through the standard Branch -> PR -> Actions path.
9. The process is documented sufficiently for repeat execution.

## 7. Pattern A — Knowledge Hub v1

Pattern A is implemented in TASK-017 after common contracts prove useful with Pattern C.

### Infrastructure

- One VPS by default.
- Docker Compose.
- Reverse proxy / HTTPS.
- Knowledge API.
- PostgreSQL.
- Lightweight worker only when justified.
- Local filesystem storage initially; S3-compatible object storage may be added behind a storage adapter when evidence volume requires it.

`Application`, `Database` and `Storage` are logically separated components, not three paid servers.

### Cost constraint

- Target: `1,500–2,500 JPY/month`.
- Hard ceiling: `3,000 JPY/month`.
- No Kubernetes, Kafka, managed database, dedicated load balancer, separate vector database, GPU inference host or multi-server split in v1 without evidence-based reauthorization.

### Database decision

PostgreSQL is selected intentionally despite existing MySQL familiarity because Knowledge Evidence/Candidate/Provenance data benefits from JSONB, relational constraints, indexing, and an optional future pgvector path. `pgvector` is not required until semantic similarity is a measured need.

## 8. Pattern B Deferral

Pattern B is explicitly later work because Pattern C already covers immediate local/manual workflows and Pattern A solves the private-repository boundary. B SHALL reuse the same Common Ingestion Core when eventually implemented.

Potential future commands are illustrative only:

```text
bai knowledge ingest-local <path>
bai knowledge ingest-archive <snapshot.zip>
```

They are not authorized by this planning refinement.

## 9. Three-Role Roadmap Decision

The roadmap was challenged from three roles:

- `Platform Architect`: require common contracts, private-Git canonical authority, portability and one ingestion core.
- `Product Delivery Lead`: require Pattern C immediately because BAI VIDEO PRODUCTION is already producing knowledge.
- `Critic / Cost & Governance`: enforce <=3,000 JPY/month, secret/privacy minimization, no Hub-first overengineering and no automatic canonical promotion.

Consensus:

1. Pattern C first.
2. First real Consumer = BAI VIDEO PRODUCTION.
3. Continue normal TASK-016 resilience work after Phase 0 bridge.
4. TASK-017 builds the common Knowledge Evolution Core and Pattern A Hub.
5. Pattern B is late TASK-017 work.
6. No TASK-018 is canonized now; post-TASK-017 task numbering remains evidence-driven.

## 10. Operational Improvement Allocation

| ID | Improvement | State | Owner |
|---|---|---|---|
| OP-101 | Source-neutral Knowledge Evidence / Candidate / Snapshot contracts usable by A/B/C | Planning reserved | TASK-016 Phase 0 -> TASK-017 core |
| OP-102 | Pattern C manual ZIP intake with provenance recovery and sanitized Knowledge Intake Package | Fast-track planning reserved | TASK-016 Phase 0 |
| OP-103 | First BAI VIDEO PRODUCTION knowledge extraction and reusable/rejected-pattern review | Fast-track planning reserved | TASK-016 Phase 0 |
| OP-104 | PostgreSQL-backed, single-VPS Knowledge Hub with write-minimal Producer identity and idempotent Evidence submission | Roadmap reserved | TASK-017 |
| OP-105 | Common Candidate normalization/generalization/dedup/conflict/supersession pipeline | Roadmap reserved | TASK-017 |
| OP-106 | Pattern B direct local adapter over the proven Common Ingestion Core | Deferred roadmap | TASK-017 late |

## 11. Sequencing

```text
NOW
 |
 |-- TASK-016 Phase 0
 |     Pattern C Manual ZIP Knowledge Capture Bridge
 |     First BAI VIDEO PRODUCTION intake
 |
 |-- TASK-016 Phase 1+
 |     Resilience / Recovery / Scalability Certification
 |
 |-- TASK-017
 |     Common Knowledge Evolution Core
 |     Pattern A Knowledge Hub (PostgreSQL / VPS)
 |     Promotion / Distribution / Federation
 |
 |-- TASK-017 late
 |     Pattern B Direct Local Adapter
 |
 v
POST-017 EVIDENCE-DRIVEN ROADMAP DECISION GATE
```

No TASK-018 is created by this refinement.
