# TASK-017 — Knowledge Evolution & Federated Evidence Governance OS Detailed Roadmap Ver.1.0

Status: `PLANNING_DETAIL / NOT_STARTED / NOT_AUTHORIZED`
Roadmap Position: after TASK-016 unless explicitly reprioritized by Owner.
Database decision for Pattern A Hub v1: `PostgreSQL`.
Infrastructure ceiling: `3,000 JPY/month`.

## 1. Goal

Transform verified Development OS and Consumer Project experience into governed, provenance-preserving, reusable knowledge without turning scores, AI inference or cross-project frequency into authority.

## 2. Source Priority

1. Pattern C — already introduced as TASK-016 Phase 0 Fast Track.
2. Pattern A — Cloud Knowledge Hub automation.
3. Pattern B — Direct Local Adapter after core stabilization.

## 3. Work Packages

### 17.1 Common Ingestion Core

- source-neutral Evidence validation,
- provenance normalization,
- Candidate registration,
- idempotency/dedup keys,
- processing audit trail.

### 17.2 Pattern A Knowledge Hub MVP

- HTTPS ingestion API,
- one-VPS Docker Compose deployment,
- PostgreSQL,
- producer identity with evidence-submit-only permission,
- idempotent Evidence submission,
- Candidate registry,
- minimal review/admin surface,
- no Development OS Git write credential in Consumers.

### 17.3 Normalization and Generalization

Convert Product-specific observations into properly scoped reusable Candidates while retaining source Evidence and counterexamples.

### 17.4 Duplicate / Conflict / Supersession

Detect:

- duplicate Candidate meaning,
- contradictory guidance,
- Rejected Pattern recurrence,
- superseded/obsolete guidance,
- scope mismatch.

Semantic/vector similarity is optional. pgvector is introduced only after measured need.

### 17.5 Promotion Governance

- decomposable quality Evidence,
- Critic/Owner/Tester/Undo/recurrence lineage,
- Safety/Security/Rights/Privacy/Authority hard rejects,
- risk-adaptive Critic/Judge gates,
- explicit promotion/demotion/quarantine/supersession record.

### 17.6 Knowledge Distribution

Generate filtered Context/Knowledge Packs based on Consumer profile rather than loading all knowledge into all projects.

### 17.7 Federated Evidence Governance

- default-local Consumer content,
- minimization/redaction,
- purpose-bound export,
- isolation,
- retention/deletion rules,
- signed/versioned publication/rollback where warranted.

### 17.8 Pattern B Direct Local Adapter — LATE

Implement only after Common Ingestion Core is proven by Pattern C and Pattern A. It SHALL be an adapter, not a second Knowledge engine.

## 4. PostgreSQL Decision

PostgreSQL is the selected Hub database because Evidence/Candidate/Provenance data needs flexible JSONB plus relational integrity and may later benefit from pgvector. Existing MySQL familiarity was considered; PostgreSQL was selected intentionally for this Knowledge workload. Managed PostgreSQL is not required in v1.

## 5. Infrastructure Guardrail

Default v1 topology:

```text
Single VPS
  Docker Compose
    reverse-proxy
    knowledge-api
    postgres
    optional lightweight worker
    backup-job
```

Target monthly cost: `1,500–2,500 JPY`.
Hard ceiling: `3,000 JPY`.

No scale-out/cloud-managed complexity without measured evidence.

## 6. Canonical Authority

The Hub stores Evidence/Candidates. It does not become the source of truth for Canonical Knowledge. Canonical promotion remains a private BAI Development OS Git change reviewed and merged through the normal development flow.

## 7. Completion Direction

TASK-017 is complete only when it can explain why knowledge is useful/harmful/uncertain/stale/scope-limited; preserve rejected knowledge; safely distribute and rollback versioned knowledge; and exchange federated Evidence without default Consumer-content collection or weakened governance floors.
