# BAI Knowledge Hub Local Foundation Specification Ver.1.0

Status: `IMPLEMENTED_LOCAL_REFERENCE / PRODUCTION_ACTIVATION_NOT_AUTHORIZED`
Date: `2026-08-11`
Parent: `TASK-017 Phase 0 — Consumer Evidence Hub Pilot Transport Slice`

## 1. Purpose

Provide a deterministic local implementation of the Knowledge Hub transport/ingestion boundary before any paid/public infrastructure is activated. The foundation consumes the canonical Consumer Evidence v1 contract frozen by TASK-016 Phase 0 and does not create a second Evidence format or Knowledge authority.

## 2. Public module

Package subpath: `bai-development-os/knowledge-hub`.

Primary reference APIs:

- `createCommonIngestionCore()`
- `InMemoryEvidenceRepository`
- `createPostgresEvidenceRepository({ query })`
- `createFixedWindowRateLimiter()`
- `createKnowledgeHubHttpServer()`
- `aggregateEvidenceRecords()`
- `createCandidateHandoff()`

The local HTTP reference exposes:

- `GET /healthz`
- `GET /v1/client-policy`
- `POST /v1/evidence/batch`

The HTTP authentication mechanism is injected by the application/deployment boundary. Core contains no production token or shared secret.

## 3. Server-derived AuthContext

The authenticated application layer supplies:

```text
subject_id
product_id
scopes[]
trust_level
```

Required scopes are enforced server-side. `product_id` in the submitted Batch must match the credential-bound Product. Trust Level is derived by the server/authentication boundary and is not read from Consumer payload.

## 4. Common Ingestion

Batch envelope validation is separated from Event validation so a structurally valid Batch can return Event-level partial rejection. Each Event is:

1. validated against the canonical Event contract and Event Catalog,
2. privacy/sanitization checked fail-closed,
3. mapped to sanitized Knowledge Evidence,
4. persisted idempotently,
5. returned as `accepted`, `already_seen`, or `rejected` in Delivery Receipt.

A stable Event ID with identical content is `already_seen`. A stable Event ID with different canonical content is an integrity conflict and is rejected.

## 5. Backfill

Object Storage backfill calls the same Common Ingestion Core with the same canonical Batch and stable Event IDs. Public Clients cannot self-declare a privileged backfill provenance through request headers. Transport/provenance classification is controlled by trusted server/internal routing.

## 6. Persistence

### In-memory reference

Used for deterministic tests and local smoke only. It is not a production durability claim.

### PostgreSQL adapter

`createPostgresEvidenceRepository({ query })` accepts an injected async query executor. This keeps DB credentials and concrete driver configuration out of reusable Core while providing executable SQL behavior.

Initial DDL: `deploy/knowledge-hub/postgres/001_initial.sql`.

Idempotency key:

```text
(product_id, installation_id, event_id)
```

The persisted Event hash detects changed-content reuse of the same identity.

## 7. Retention

Raw/sanitized runtime Event rows may receive `expires_at`; pruning is explicit. Retention of raw Hub rows does not erase historical Canonical Knowledge decisions. Canonical promotion remains outside this local foundation.

## 8. Aggregation / Candidate handoff

Reference aggregation can group sanitized runtime observations and produce a project-scoped `CANDIDATE` handoff only after a minimum observation threshold. It never emits `PROMOTED` state and requires Critic review.

## 9. Deployment boundary

The following remain unimplemented/unapproved by this local specification:

- paid VPS creation,
- public DNS/TLS,
- production PostgreSQL driver/credential wiring,
- production bearer credential issuance/rotation,
- real Consumer Evidence collection,
- Product TASK-036 code/UI,
- production backup/restore operation,
- automatic Knowledge promotion.

## 10. Safety invariant

Knowledge Hub is an operational side channel. Hub unavailability, authentication failure, rate limiting, retention, or persistence failure must not become a fatal dependency of a standalone Consumer Product's primary function.
