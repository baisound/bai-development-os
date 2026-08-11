# TASK-017 Phase 0 — Deployment Readiness Critic Review

Date: `2026-08-11`
Decision: `PASS_WITH_LIVE_ENVIRONMENT_GATES`
Blocking findings for this non-production slice: `0`

## 1. Product / authority boundary

PASS. The deployment package is Knowledge Hub infrastructure and never becomes a BAI VIDEO PRODUCTION runtime dependency. Public activation remains separately gated. Canonical Knowledge authority remains the Development OS Git/Knowledge governance path rather than PostgreSQL rows or Client telemetry frequency.

## 2. Secret handling

PASS. No shared Product API key is embedded. Issuance returns a high-entropy raw key once and persists only salt + scrypt-derived hash plus server-owned Product/subject/scope/Trust metadata. Verification is timing-safe. Database password and TLS material are deployment secrets and are absent from repository examples.

Residual operational requirement: production issuance must be performed outside CI/log aggregation, and the one-time Product key must be transferred into the Product-selected password manager through an approved operator path.

## 3. Migration safety

PASS after corrective. A weaker draft could apply DDL and record the migration checksum in separate non-atomic operations. The production runtime now obtains a dedicated PostgreSQL client, starts one transaction, takes an advisory transaction lock, re-checks the checksum, applies the migration and writes the ledger before commit. Already-applied checksum drift fails closed.

## 4. Network exposure

PASS. PostgreSQL is not host-published. Knowledge API is not host-published in base Compose. Loopback exposure exists only in the rehearsal override. Caddy public ports require the explicit `public` profile and real domain configuration.

## 5. Health / readiness

PASS. `/healthz` indicates process liveness only. `/readyz` probes the backing repository and can return 503. It requires no Consumer credential and reveals no secret/configuration detail beyond backend class.

## 6. Backup / restore

PASS FOR REHEARSAL CONTRACT. Backup uses restrictive file permissions and checksum sidecar. Restore automation is intentionally rehearsal-only and refuses arbitrary target database names. This prevents the readiness slice from becoming an unattended destructive production-restore tool.

Limitation: no real `pg_dump`/`pg_restore` execution occurred in the available environment.

## 7. Dependencies / supply chain

PASS WITH DEPLOYMENT GATE. The production container uses a deployment-only `pg` dependency and official major-version container image declarations. A real deployment must lock resolved dependency/image digests through Release/Security evidence before public activation. The current repository does not claim image-digest certification.

## 8. Remaining gates

- Docker build/start rehearsal.
- live PostgreSQL migration + idempotency + credential verification integration.
- real backup/restore rehearsal.
- production dependency/image lock evidence.
- VPS budget confirmation.
- DNS/TLS/public endpoint security gate.
- production credential issuance/revocation drill.
- BAI VIDEO PRODUCTION TASK-036 real Hub/backfill pilot.

No blocking finding prevents accepting **deployment readiness** while keeping TASK-017 Phase 0 active.
