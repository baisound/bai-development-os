# TASK-017 Phase 0 — Local Hub Foundation Implementation Result

Date: `2026-08-11`
Status: `IMPLEMENTED / VERIFIED / LOCAL_GATE_CANDIDATE`
Scope: `17.0.1–17.0.4 local foundation + bounded 17.0.7 candidate handoff reference`

## Implemented

- Common Ingestion Core using TASK-016 canonical Consumer Evidence Event/Batch/Receipt/Policy contracts.
- Batch-envelope validation separated from Event validation for real Event-level partial rejection.
- Server-derived AuthContext with subject, Product binding, scopes and Trust Level.
- Stable Event idempotency; identical retry becomes `already_seen`, changed-content reuse becomes integrity conflict.
- HTTPS-equivalent submission and internal Object Storage backfill share one canonical Batch/Event identity.
- Public HTTP Client cannot self-label a request as trusted Object Storage backfill provenance.
- Server-side Client Policy retrieval.
- Fixed-window per-subject rate limiter with 429 semantics.
- Explicit retention/pruning primitive.
- In-memory deterministic repository for local tests.
- PostgreSQL initial DDL and injected-query persistence adapter; no DB secret/driver is embedded in Core.
- Local loopback HTTP reference for `/healthz`, `/v1/client-policy`, `/v1/evidence/batch`.
- Aggregate/runtime Candidate handoff reference that emits `CANDIDATE` only and requires Critic review.
- Public package subpath `./knowledge-hub` and root `KnowledgeHubOS` namespace.
- Local CLI requiring explicit runtime environment credential; no default credential is embedded.

## Verification

- TASK-017 Knowledge Hub focused suite: `17 / 17 PASS`.
- TASK-016 Knowledge Evolution suite: `50 / 50 PASS`.
- Full BAI Development OS: `1255 / 1255 PASS`.
- Roadmap / Security / Release / Conformance / Maintenance / Extension / Calibration / Distributed checks: `PASS`.
- `git diff --check`: `PASS`.

## Not claimed

No live PostgreSQL server, production VPS, public DNS/TLS, production credential issuance, real Product pilot, paid cloud resource, production backup or real-user Evidence collection was executed. Those remain later Phase 0 deployment/pilot gates.
