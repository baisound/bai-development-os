# TASK-017 Phase 0 — Owner Authorization

Date: `2026-08-11`
Decision: `AUTHORIZED_LOCAL_IMPLEMENTATION / PRODUCTION_ACTIVATION_NOT_AUTHORIZED`
Owner instruction: after updating and committing the roadmap/design, continue development.

## Authorized scope

The following bounded Phase 0 implementation may proceed without another stop:

- 17.0.1 Common Ingestion Core MVP,
- local Knowledge Hub application/service boundary,
- canonical Batch / Event-level Receipt / Client Policy handling,
- server-derived authentication/authorization context,
- rate limit and Event idempotency,
- Local/Object Storage backfill through the same canonical Batch path,
- retention primitives,
- PostgreSQL logical schema and an injected-query persistence adapter,
- deterministic local tests and documentation/registry synchronization.

## Not authorized by this record

- purchasing/provisioning a VPS or paid cloud resource,
- public DNS/TLS endpoint activation,
- production credentials or secrets,
- real BAI VIDEO PRODUCTION user telemetry collection,
- changing Product-owned TASK-036 source/UI,
- automatic Canonical Knowledge promotion,
- TASK-016 Phase 1+ implementation.

Production activation remains a separate deployment/security/budget gate. The Product primary function must remain independent of Hub availability.
