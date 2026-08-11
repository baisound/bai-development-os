# TASK-017 Phase 0 — Pre-Live Hardening Implementation Result

Date: `2026-08-11`
Status: `IMPLEMENTED / STATIC_AND_CONTRACT_VERIFIED / LIVE_EXECUTION_PENDING`
Production activation: `NOT_AUTHORIZED`

## Implemented

- Replaced Compose-side PostgreSQL connection-URL interpolation with split `PGHOST` / `PGPORT` / `PGDATABASE` / `PGUSER` / `PGPASSWORD` injection.
- Added shared deployment runtime PostgreSQL config normalization used by API server, key issuer and retention runner.
- Retained optional `DATABASE_URL` compatibility for externally managed environments without requiring it in the supplied Compose contract.
- Pinned direct deployment runtime dependency `pg` to exact `8.13.1`; transitive dependency lock remains a separate production reproducibility gate because this environment cannot reach the npm registry.
- Extended the live rehearsal harness to optionally emit sanitized machine-readable Evidence after successful Compose teardown.
- Evidence includes only result, restored Event count, backup SHA-256, public-profile=false, cleanup=true and completion time; no DB/Product credential or signed URL is persisted.
- Added machine Evidence validator.
- Deployment readiness checker now verifies split DB secret boundary, exact direct driver version, rehearsal Evidence support and no `DATABASE_URL` interpolation in Compose.

## Security/Operational rationale

Embedding an unescaped database password inside a URI can create deployment failures for otherwise valid password characters. Split PG fields preserve the secret boundary without requiring application code to reconstruct a credential-bearing URL.

A rehearsal that only prints `PASS` to terminal is weak operational Evidence. The new optional Evidence artifact is written only after successful isolated resource teardown and can be validated independently before Judge review.

## Remaining environment gates

- generate and review a deployment runtime dependency lock in a network-enabled controlled environment,
- execute the live Docker/PostgreSQL rehearsal,
- validate the generated machine Evidence,
- separately authorize any VPS/DNS/TLS/production credential activation,
- execute BAI VIDEO PRODUCTION TASK-036 real pilot.
