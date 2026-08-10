# BAI Knowledge Hub Public Ingestion API Planning Specification Ver.1.0

Status: `PHASE0_CONTRACT_AND_MOCK_IMPLEMENTED / PRODUCTION_HUB_NOT_AUTHORIZED`
Database: PostgreSQL planned for Hub v1
Infrastructure: single VPS / Docker Compose / <= 3,000 JPY/month

## 1. Mandatory MVP Endpoints

### POST /v1/evidence/batch

Purpose: submit bounded, privacy-minimized Evidence events in batches.

Authentication: credential resolved externally by Product and passed over HTTPS. Exact header/token format is fixed during TASK-017 Phase 0 implementation; no shared secret is embedded in distributed source.

Server responsibilities:

- authenticate/authorize subject,
- apply rate/payload limits,
- validate schema,
- assign trust from server-known provenance,
- enforce idempotency,
- apply privacy/retention policy,
- return per-event acceptance/rejection receipt.

### GET /v1/client-policy

Purpose: adjust sampling/batch/feature enablement without Product update.

Constraint: server policy cannot exceed local Product/user privacy cap.

## 2. Optional Pilot Feedback Surface

Feedback MAY use the same Evidence batch event type. A separate `POST /v1/feedback` endpoint is optional and must be justified by Product UX/retention semantics, not API symmetry.

## 3. Idempotency

Every event has a stable `event_id`. Hub enforces uniqueness under an authenticated subject/install scope. Duplicate resubmission returns a deterministic accepted/already-seen result and must not duplicate downstream effects.

## 4. Trust Levels

Potential server-side values:

- TRUSTED_OS
- TRUSTED_CI
- TRUSTED_MANUAL_REVIEW
- REGISTERED_CLIENT
- ANONYMOUS_CLIENT
- UNVERIFIED

Client-supplied trust is ignored for authority.

## 5. Privacy

- P0 minimal/aggregate operational Evidence.
- P1 sanitized diagnostics.
- P2 explicit contextual consent.
- P3 raw content rejected/not accepted by default in Hub v1.

## 6. Failure Semantics

- 401/403: pause delivery, require credential correction; Product continues.
- 429: obey Retry-After/backoff.
- 5xx/timeout/DNS: retain allowed events in outbox and retry later.
- schema/privacy failure: quarantine/drop affected event; do not block Product.
- outbox full: policy-driven aggregation/eviction of lower-value P0 first.

## 7. Persistence Direction

Initial logical tables:

- products
- credential_subjects
- installations (optional/non-secret identity)
- client_policies
- evidence_events
- evidence_aggregates
- feedback (if separate)
- processing_runs
- knowledge_candidates
- promotion_links

Use JSONB for variable payloads and normal columns for query/control fields.

Raw events are retained only for a bounded period; long-lived aggregates/candidate provenance retain minimum necessary sanitized representation/hash.


## 8. TASK-016 Phase 0 realized contract

Machine-readable API contract: `specifications/BAI_Knowledge_Hub_Public_Ingestion_API_OpenAPI_Ver1.0.yaml`.

Development Mock Hub: `src/knowledge-evolution/mock-hub.mjs`. It implements deterministic success, partial rejection, 401, 403, 429, 5xx, timeout and duplicate/idempotency scenarios for contract testing. This is not a production service and has no production credential store or PostgreSQL persistence.

Production HTTPS deployment, PostgreSQL persistence and operational authentication/authorization remain TASK-017 Phase 0 scope and require separate authorization.
