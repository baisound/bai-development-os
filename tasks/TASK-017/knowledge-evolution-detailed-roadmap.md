# TASK-017 — Knowledge Evolution & Federated Evidence Governance OS Detailed Roadmap Ver.1.3

Status: `ACTIVE / PHASE0_LOCAL_IMPLEMENTATION_AUTHORIZED / PRODUCTION_ACTIVATION_NOT_AUTHORIZED`
Roadmap Position: `PHASE 0 AFTER TASK-016 PHASE 0; PHASE 1+ AFTER TASK-016 RESILIENCE EVIDENCE`.
Database decision: `PostgreSQL`.
Infrastructure ceiling: `3,000 JPY/month`.

## 1. Goal

Transform Development OS, Consumer development and distributed runtime Evidence into governed reusable Knowledge without turning frequency, telemetry, model scores or AI inference into authority.

## 2. Revised Source / Task Sequence

```text
TASK-016 Phase 0 Pattern C + contracts
 -> TASK-017 Phase 0 Hub/client pilot
 -> TASK-016 Phase 1+ resilience certification
 -> TASK-017 Phase 1+ advanced Knowledge evolution
 -> TASK-017 Late Pattern B
```

This replaces the earlier fully linear `TASK-016 complete -> TASK-017` planning sequence. TASK-016 Phase 0 is now complete. Owner authorization dated 2026-08-11 permits the bounded local TASK-017 Phase 0 implementation; public production activation remains separately gated.

## 3. Phase 0 — Early Pilot Transport Slice

Read: `tasks/TASK-017/phase0-consumer-evidence-hub-pilot-detailed-design.md`.

### 17.0.1 Common Ingestion Core MVP
### 17.0.2 PostgreSQL / Single-VPS Hub MVP
### 17.0.3 Public Evidence Batch / Receipt / Client Policy API + Backfill
### 17.0.4 Authentication / Rate / Event Idempotency / Retention
### 17.0.5 Consumer Evidence Integration Kit Reference + Generator
### 17.0.6 BAI VIDEO PRODUCT Limited Pilot + temporary Object Storage backfill
### 17.0.7 Aggregate / Candidate Review
### 17.0.8 Pilot Exit Evidence


## 3.1 Local-first implementation boundary

Phase 0 implementation is intentionally split into two operational gates:

1. **Local Hub Foundation** — Common Ingestion, server-derived auth context, Event idempotency, Receipt/Policy, retention, backfill, PostgreSQL schema/adapter contract and deterministic tests. This local foundation is accepted. Non-production deployment readiness is also authorized and implemented; live PostgreSQL/public activation remains gated.
2. **Production Activation** — paid VPS provisioning, DNS/TLS, production credential issuance, public endpoint and real user Evidence collection. This is not authorized by the local implementation record.

The local foundation SHALL use an injected PostgreSQL query boundary so the reusable Core does not need to embed credentials or force a database client into Consumer runtime code. Production deployment may supply the concrete PostgreSQL driver at the application boundary.

## 4. Phase 1+ — Advanced Knowledge Evolution

### 17.1 Normalization / Generalization

Convert Product-specific observations into scope-appropriate Candidates while preserving environment, counterexamples, distinct Product/Task counts and provenance.

### 17.2 Duplicate / Conflict / Supersession

Detect semantic/structural duplicates, contradictions, rejected recurrence, stale guidance and supersession. pgvector remains optional until measured need.

### 17.3 Reproduction Matrix / Quality Evidence

Preserve decomposable dimensions rather than binary good/bad scores.

### 17.4 Promotion Governance

Critic/Judge/Owner/reviewer authority according to risk; hard rejects for Safety/Security/Rights/Privacy/Authority. Runtime Client frequency is evidence only.

### 17.5 Knowledge Distribution / Rollback

Filtered, signed/versioned packs using existing SecurityOS/ReleaseOS primitives where justified; last-known-good rollback.

### 17.6 Federated Evidence Governance

Purpose-bound export, tenant/Project isolation, minimization, retention/deletion and privacy-preserving aggregation.

### 17.7 Domain Metric Providers

Extension points for video/creative/Product metrics without hard-coding domain logic in Core.

### 17.8 Pattern B Direct Local Adapter — LATE

Reuse Common Ingestion Core. No second knowledge engine.

## 5. Product Runtime Independence

Hub integration is an operational side channel. Consumer Product build/runtime SHALL NOT require BAI Development OS. Generated Evidence Client source belongs to the Consumer.

## 6. Credential Model

Core specifies a generic external `CredentialProvider`; BAI VIDEO PRODUCT selects Microsoft Password Manager. No shared key is embedded in open source source/config/build artifacts.

## 7. Hub Guardrail

One VPS + Docker Compose + PostgreSQL. Target 1,500–2,500 JPY/month; hard ceiling 3,000 JPY/month. No Kafka/Kubernetes/managed DB/dedicated LB/separate vector DB/GPU host without evidence-based reauthorization.

## 8. Canonical Authority

Hub stores Evidence/Candidates. Canonical Knowledge remains reviewed private-Git state. Client Evidence is never self-promoting.

## 9. Completion Direction

TASK-017 completion requires explainable knowledge usefulness/harm/uncertainty/scope, rejected-pattern memory, reproducibility, governed promotion/demotion/rollback, privacy-minimized federation and successful integration without weakening standalone Consumer runtime boundaries.

## 10. RC2 Product Coordination Addition

BAI VIDEO PRODUCTION may begin its Consumer-owned TASK-036 A-C against the frozen TASK-016 RC2 contract before production Hub availability. Temporary Object Storage stores the canonical Batch unchanged and is replayed to Hub with stable `event_id`. TASK-017 Phase 0 MUST support Event-level Receipt/partial rejection and treat accepted/duplicate Event IDs as acknowledgement.

Production Hub availability target requested by Product is 2026-08-29〜31 with Product final connection target by 2026-09-10. These are coordination targets; actual public infrastructure activation is gated by deployment readiness, security and budget evidence.
