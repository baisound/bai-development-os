# TASK-017 — Knowledge Evolution & Federated Evidence Governance OS Detailed Roadmap Ver.1.1

Status: `PLANNING_DETAIL / PARTIAL_OWNER_REPRIORITIZATION / NOT_STARTED / NOT_AUTHORIZED`
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

This replaces the earlier fully linear `TASK-016 complete -> TASK-017` planning sequence. It preserves task ownership and does not authorize implementation.

## 3. Phase 0 — Early Pilot Transport Slice

Read: `tasks/TASK-017/phase0-consumer-evidence-hub-pilot-detailed-design.md`.

### 17.0.1 Common Ingestion Core MVP
### 17.0.2 PostgreSQL / Single-VPS Hub MVP
### 17.0.3 Public Evidence Batch / Client Policy API
### 17.0.4 Authentication / Rate / Idempotency / Retention
### 17.0.5 Consumer Evidence Integration Kit Reference + Generator
### 17.0.6 BAI VIDEO PRODUCT Limited Pilot
### 17.0.7 Aggregate / Candidate Review
### 17.0.8 Pilot Exit Evidence

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
