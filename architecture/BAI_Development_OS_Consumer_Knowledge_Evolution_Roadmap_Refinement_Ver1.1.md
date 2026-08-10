# BAI Development OS — Consumer Knowledge Evolution Roadmap Refinement Ver.1.1

## Document Control

- Status: `CURRENT_PLANNING_SUPPLEMENT / OWNER_REPRIORITIZATION_RECORDED / NOT_IMPLEMENTATION_AUTHORIZATION`
- Effective date: `2026-08-11`
- Supersedes planning supplement: `Consumer Knowledge Evolution Roadmap Refinement Ver.1.0`
- Current Architecture Canonical: `BAI Development OS Architecture Ver.2.28`
- Current implementation baseline: TASK-004〜015 `COMPLETED`
- TASK-016: `NEXT / NOT_STARTED / NOT_AUTHORIZED`
- TASK-017: `NOT_STARTED / NOT_AUTHORIZED`
- Owner roadmap decision: active Consumer development knowledge and early distributed-product runtime Evidence must be capturable before the full resilience program completes.
- Canonical Knowledge authority: BAI Development OS private Git repository.
- Knowledge Hub v1 database: `PostgreSQL`.
- Knowledge Hub v1 infrastructure hard ceiling: `3,000 JPY/month`.
- Consumer products: standalone build/runtime; BAI Development OS is a development foundation, not a product runtime dependency.
- Implementation authorization created by this document: `NONE`.

## 1. Why Ver.1.0 Sequencing Is Revised

Ver.1.0 correctly prioritized `Pattern C -> Pattern A -> Pattern B`, but its linear execution order implied that the main TASK-016 resilience program would finish before Pattern A Hub automation. That is now too slow for an already-running and soon-to-be-distributed Consumer such as BAI VIDEO PRODUCT.

The revised roadmap keeps the source priority `C -> A -> B` while interleaving TASK ownership:

1. TASK-016 Phase 0 establishes source-neutral contracts, Pattern C and Consumer-facing contract/test foundations.
2. TASK-017 Phase 0 is explicitly reprioritized as a bounded Pilot Transport Slice before TASK-016 Phase 1+.
3. TASK-016 Phase 1+ certifies resilience using the real Hub/client path as one of its test targets without owning Hub deployment.
4. TASK-017 Phase 1+ resumes advanced Knowledge evolution, promotion, distribution and federation.
5. Pattern B remains late.

This is a partial Owner reprioritization, not implementation authorization and not a change of TASK numbers.

## 2. Non-Negotiable Product Boundary

BAI Development OS SHALL remain a development foundation.

A generated/assisted Consumer Product MUST be able to:

- build without the BAI Development OS repository at product-runtime/build-artifact execution time,
- run without the BAI Development OS package,
- run without `.bai-os`, OS Registry, OS TASK files or OS Knowledge Repository,
- continue its primary product function when Knowledge Hub is offline, unavailable, unconfigured or credential access fails,
- own the generated/copied Evidence Client source after scaffolding.

BAI Development OS MAY provide OpenAPI, JSON Schema, reference implementation, generator, Mock Hub, contract tests and privacy/trust/security templates at development time.

## 3. Open-Source Security Boundary

The Client implementation is assumed inspectable. Security SHALL NOT rely on obscurity.

Assume an attacker/user can know:

- Hub endpoint,
- request/response schema,
- batching/retry/outbox logic,
- sanitization rules,
- Product/feature identifiers,
- Credential Provider integration source.

Therefore:

- no shared API secret is embedded in source, config, `.env` or build artifacts,
- credentials are externalized behind a `CredentialProvider`,
- BAI VIDEO PRODUCT's selected provider is Microsoft Password Manager; the exact Microsoft API is Product-specific and is not guessed by Core,
- the Hub assigns Trust from authenticated transport/review provenance, never from a client-supplied Trust field,
- server-side authz, rate limit, payload limits, schema/privacy validation, idempotency and abuse controls are mandatory.

## 4. Source Paths

### Pattern C — Manual ZIP Snapshot Review — FIRST

`Development OS + Consumer Product + Evidence/Docs -> ZIP -> Review -> Evidence/Candidate Package -> OS review`

Purpose: immediately capture development knowledge from active products.

### Pattern A — Knowledge Hub / Runtime Consumer Evidence — SECOND

`Standalone Product -> Product-owned Evidence Client -> HTTPS -> Knowledge Hub -> Common Ingestion -> Candidate`

Purpose: collect privacy-minimized real-use Evidence from distributed products without giving them private OS repository access.

### Pattern B — Direct Local Integration — LATE

`Local Consumer workspace -> Local Adapter -> Common Ingestion Core`

Purpose: convenience automation only after common contracts are proven.

## 5. Revised Execution Sequence

```text
NOW
 |
 |-- TASK-016 Phase 0 — Contract & Capture Foundation
 |     16.0.1 Evidence / Candidate / Snapshot contracts
 |     16.0.2 Pattern C ZIP intake
 |     16.0.3 Product Runtime Independence contract
 |     16.0.4 Consumer Evidence Integration Kit contract
 |     16.0.5 Public Ingestion API / Privacy / Trust / Credential contract
 |     16.0.6 Mock Hub / Contract Test specification
 |     16.0.7 First BAI VIDEO PRODUCT development-knowledge intake
 |     16.0.8 Pilot-readiness handoff + Registry / regression
 |
 |-- TASK-017 Phase 0 — EARLY Pilot Transport Slice
 |     17.0.1 Common Ingestion Core MVP
 |     17.0.2 Single-VPS PostgreSQL Knowledge Hub MVP
 |     17.0.3 Public Evidence Batch + Client Policy API
 |     17.0.4 Auth / Rate Limit / Idempotency / Retention
 |     17.0.5 Consumer Evidence Integration Kit reference/generator
 |     17.0.6 BAI VIDEO PRODUCT limited-user pilot
 |     17.0.7 Aggregate + Candidate review
 |     17.0.8 Pilot exit evidence
 |
 |-- TASK-016 Phase 1〜7 — Resilience Certification
 |     deterministic simulation / fault injection / convergence
 |     credential unavailable / Hub outage / outbox recovery
 |     mixed client versions / load / cost / backup / DR
 |     incident evidence / certification
 |
 |-- TASK-017 Phase 1+ — Knowledge Evolution
 |     normalization / generalization
 |     duplicate / conflict / supersession
 |     promotion / demotion / quarantine
 |     distribution / rollback / federation
 |
 |-- TASK-017 Late — Pattern B
 |
 v
POST-017 EVIDENCE-DRIVEN ROADMAP DECISION GATE
```

No TASK-018 is created by this refinement.

## 6. TASK-016 Phase 0 Ownership

TASK-016 Phase 0 owns contracts and pre-production verification foundations only. It SHALL NOT deploy or operate the production Hub.

### 16.0.1 Common Knowledge Evidence Contracts

Version source-neutral contracts for Evidence, Candidate and Snapshot Manifest. Runtime Consumer Evidence extends the same envelope family rather than creating a second Knowledge engine.

### 16.0.2 Pattern C Intake

Support preferred manifest snapshots and manifestless ZIP with `PARTIAL`/`UNVERIFIED` provenance. Raw archives and secrets remain transient and excluded from Canonical Knowledge.

### 16.0.3 Product Runtime Independence Contract

Define Consumer acceptance tests proving no BAI Development OS runtime dependency and non-fatal Hub behavior.

### 16.0.4 Consumer Evidence Integration Kit Contract

Specify development-time technical provision:

- OpenAPI,
- JSON Schemas,
- generic `CredentialProvider` interface,
- Python reference client first,
- sanitizer/aggregator/outbox/policy reference modules,
- product-owned code generator/template,
- Mock Hub,
- contract tests.

### 16.0.5 Public API / Privacy / Trust / Credential Contract

Freeze the MVP semantics before VPS deployment:

- `POST /v1/evidence/batch`,
- `GET /v1/client-policy`,
- optional explicit-feedback endpoint/contract,
- external credential retrieval; no embedded Product secret,
- Privacy levels and local consent cap,
- server-derived Trust,
- idempotency and bounded payloads,
- server-side sanitization/validation floor.

### 16.0.6 Mock Hub / Contract Tests

Provide a deterministic local target capable of simulating success, invalid schema, 401/403, 429, 5xx, timeout and duplicate-event behavior.

### 16.0.7 First BAI VIDEO PRODUCT Development Intake

Pattern C validates development knowledge capture before runtime telemetry exists.

### 16.0.8 Pilot Readiness Handoff

Exit with machine-readable contracts, reference expectations and a bounded TASK-017 Phase 0 input package.

## 7. TASK-017 Phase 0 — Early Pilot Transport Slice

This bounded slice is explicitly moved ahead of TASK-016 Phase 1+ because the active Product can distribute packages before the full resilience certification program completes.

It owns the actual Hub MVP and runtime Evidence path.

### 17.0.1 Common Ingestion Core MVP

Validate, normalize, persist and audit source-neutral Evidence without promoting it automatically.

### 17.0.2 Hub MVP

Single VPS / Docker Compose / PostgreSQL / reverse proxy / knowledge API / backup job. Keep monthly infrastructure <= 3,000 JPY.

### 17.0.3 Public API

MVP mandatory endpoints:

- `POST /v1/evidence/batch`
- `GET /v1/client-policy`

Feedback MAY be represented as an Evidence event in the pilot; a separate endpoint is optional and must not be required merely for symmetry.

### 17.0.4 Security / Delivery Controls

- externally supplied API credential via Product `CredentialProvider`,
- authenticated subject mapped server-side,
- no client-declared trust elevation,
- per-subject/IP/install rate controls as appropriate,
- event-id idempotency,
- Retry-After / bounded backoff semantics,
- raw retention and privacy deletion policy,
- primary Product path remains independent.

### 17.0.5 Integration Kit Release Candidate

The OS provides source/reference/generation technology. Generated code becomes Consumer-owned and has zero BAI Development OS runtime dependency.

### 17.0.6 BAI VIDEO PRODUCT Limited Pilot

Start with few high-value event families only, e.g. feature result, sanitized diagnostic/performance, correction/undo and explicit feedback. Do not deploy broad behavioral tracking.

### 17.0.7 Aggregate / Candidate Review

Runtime Evidence enters `REGISTERED_CLIENT` or lower trust as determined by server provenance. Frequency may support a Candidate but never authorizes Canonical promotion.

### 17.0.8 Pilot Exit

Produce real operational Evidence for TASK-016 resilience certification and TASK-017 Phase 1+ design thresholds.

## 8. TASK-016 Phase 1+ Gains from the Interleave

The real Pilot path gives TASK-016 concrete certification subjects:

- Hub DNS/connectivity outage,
- credential manager unavailable,
- 401/403 credential failure,
- 429 and Retry-After behavior,
- 5xx/backoff,
- local outbox saturation/recovery,
- duplicate delivery/idempotency,
- mixed Product/contract versions,
- sustained submission load and cost envelope,
- backup/restore and retained aggregates,
- incident timeline reconstruction.

TASK-016 certifies behavior; it does not become Hub provisioning authority.

## 9. TASK-017 Phase 1+ Advanced Knowledge Work

After resilience evidence is available:

- multidimensional quality Evidence,
- generalized Candidate scope,
- duplicate/conflict/supersession,
- Reproduction Matrix,
- Critic/Owner/Undo/Tester lineage,
- hard Safety/Security/Rights/Privacy/Authority rejects,
- promotion/demotion/invalidation/quarantine,
- signed/versioned distribution and rollback,
- privacy-minimized federated aggregation,
- domain metric providers,
- Pattern B late.

## 10. Credential Architecture

Core contract:

```text
Product Settings UI
      |
      v
CredentialProvider interface
      |
      +--> BAI VIDEO PRODUCT: Microsoft Password Manager Provider
      +--> Other Consumers: their platform-specific provider
      |
      v
Short-lived in-process secret use
      |
      v
HTTPS Authorization
```

Rules:

- raw key is never committed, logged, included in Evidence or stored in ordinary Product configuration,
- provider implementation is Product/platform specific,
- OS core specifies interface/test expectations, not a universal Microsoft runtime dependency,
- missing credential disables/degrades Evidence delivery only.

## 11. Privacy and Runtime Evidence Policy

Initial privacy direction:

- P0: anonymous/minimal operational aggregate — pilot eligible subject to Product policy.
- P1: sanitized diagnostics — pilot eligible subject to user/Product policy.
- P2: contextual/user-approved Evidence — explicit consent.
- P3: raw user content — not accepted by Hub v1 by default.

Local policy always caps server policy: `effective_policy = local_privacy_cap ∩ server_policy`.

Video/audio/subtitle bodies, prompts, personal data, API secrets and unrelated user files are not default Evidence.

## 12. PostgreSQL / Cost Decision Preserved

The existing ADR remains valid:

- PostgreSQL,
- one VPS,
- Docker Compose,
- logical Application/Database/Storage separation,
- target 1,500–2,500 JPY/month,
- hard ceiling 3,000 JPY/month,
- no Kafka/Kubernetes/managed DB/dedicated LB/separate vector DB/GPU host by default,
- pgvector only after measured semantic-search need.

## 13. Operational Improvement Allocation

| ID | Improvement | State | Owner |
|---|---|---|---|
| OP-101 | Source-neutral Evidence/Candidate/Snapshot contracts | Fast-track planning | TASK-016 Phase 0 |
| OP-102 | Pattern C ZIP intake and provenance recovery | Fast-track planning | TASK-016 Phase 0 |
| OP-103 | First BAI VIDEO PRODUCT development Knowledge intake | Fast-track planning | TASK-016 Phase 0 |
| OP-104 | Consumer Product Runtime Independence contract | Fast-track planning | TASK-016 Phase 0 |
| OP-105 | Consumer Evidence Integration Kit contract/generator/reference | Contract in TASK-016 Phase 0; implementation pilot in TASK-017 Phase 0 | TASK-016 -> TASK-017 |
| OP-106 | Public Evidence API / Privacy / Trust / external Credential contract | Fast-track planning | TASK-016 Phase 0 |
| OP-107 | Mock Hub / Contract Test harness | Fast-track planning | TASK-016 Phase 0 |
| OP-108 | PostgreSQL single-VPS Knowledge Hub MVP | Early reprioritized pilot | TASK-017 Phase 0 |
| OP-109 | BAI VIDEO PRODUCT limited-user runtime Evidence pilot | Early reprioritized pilot | TASK-017 Phase 0 |
| OP-110 | Hub/client resilience certification | Planned | TASK-016 Phase 1+ |
| OP-111 | Advanced Knowledge normalization/promotion/distribution/federation | Planned | TASK-017 Phase 1+ |
| OP-112 | Pattern B direct local adapter | Deferred | TASK-017 Late |

## 14. Three-Role Revalidation

### Platform Architect

Rejects placing production Hub implementation inside TASK-016. Accepts interleaving because TASK-017 Phase 0 retains Hub ownership while TASK-016 receives a real system to certify.

### Product Delivery Lead

Requires API contract, reference client and Pilot Hub before full TASK-016 completion so distributed BAI VIDEO PRODUCT packages can contribute Evidence early.

### Security / Cost / OSS Critic

Requires open-source threat assumptions, external credentials, server-derived trust, privacy minimization, fail-open primary product behavior, one-VPS budget and no premature infrastructure expansion.

### Consensus

`TASK-016 Phase 0 -> TASK-017 Phase 0 Pilot -> TASK-016 Phase 1+ -> TASK-017 Phase 1+ -> Pattern B`.

## 15. Exit and Authority Rule

This planning supplement changes roadmap sequence only. It does not:

- authorize TASK-016 implementation,
- authorize TASK-017 implementation,
- promote Architecture Ver.2.29,
- change package version,
- grant Hub authority over Canonical Knowledge,
- grant Consumer Products private OS repository access.

The next executable step remains a separate authorization/design gate.
