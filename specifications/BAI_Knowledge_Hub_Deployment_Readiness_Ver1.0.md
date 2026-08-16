# BAI Knowledge Hub Deployment Readiness Specification Ver.1.0

Status: `IMPLEMENTED / LOCAL_REHEARSAL_READY / PAID_PUBLIC_ACTIVATION_NOT_AUTHORIZED`
Date: `2026-08-11`
Parent: `TASK-017 Phase 0 — Consumer Evidence Hub Pilot Transport Slice`

## 1. Purpose

Turn the accepted Local Hub Foundation into a deployable single-VPS package without purchasing or activating public infrastructure. This specification defines the production-compatible application boundary, PostgreSQL migration lifecycle, hashed Product API credential verification, liveness/readiness, backup/restore rehearsal, reverse-proxy/TLS template and secret-free Compose contract.

## 2. Deployment shape

```text
one VPS
  Docker Compose
    postgres          private network only
    knowledge-api     private network only in base compose
    caddy             explicit `public` profile only
```

`compose.rehearsal.yaml` may expose `127.0.0.1:8787` for local/VPS loopback rehearsal. PostgreSQL is never host-published by the supplied Compose contract.

## 3. Secret boundary

No Product API key, PostgreSQL password or TLS private key is committed. `.env.example` contains placeholders only. Production values are supplied by the host/deployment secret boundary.

Product API keys use the format `bkh1.<key_id>.<high-entropy-secret>`. Only salt + scrypt-derived secret hash and server-owned subject/Product/scope/Trust metadata are persisted. The one-time raw key is returned only at issuance and must be placed in the Product-selected password manager. For BAI VIDEO PRODUCTION that provider is Product-owned Microsoft Password Manager integration.

## 4. Database migrations

`deploy/knowledge-hub/postgres/*.sql` is ordered and immutable after application. `schema_migrations` stores file checksum. The production runtime applies each migration and its ledger row in one PostgreSQL transaction under an advisory transaction lock. A checksum change to an already-applied migration fails closed; corrections require a new migration file.

Current migrations:

- `001_initial.sql` — Evidence, Receipt, Client Policy.
- `002_auth_and_operations.sql` — hashed API credential metadata and operational indexes.

## 5. Readiness

- `/healthz` = process liveness only.
- `/readyz` = repository dependency readiness. PostgreSQL mode executes a bounded `SELECT 1` through the injected query boundary.
- `/readyz` never requires a Consumer credential and returns no secret/config details.

## 6. TLS boundary

Caddy is disabled unless the explicit Compose `public` profile is activated. Public activation requires a real domain, DNS, security/budget gate and Owner approval. Caddy terminates HTTPS and proxies only to the internal Knowledge API service.

## 7. Backup/restore

`backup-postgres.sh` produces a custom-format `pg_dump` plus a bound manifest and SHA-256 sidecar using restrictive permissions. The legacy `restore-rehearsal.sh` is permanently disabled and performs no database operation. The only supported rehearsal path is `run-encrypted-backup-restore-rehearsal.sh`, which requires canonical signed authority, a local isolated target, closed archive-object admission and an immutable committed Evidence bundle. The supplied automation does not provide an unattended production restore.

## 8. Runtime independence

This deployment is BAI Knowledge Hub infrastructure, not Consumer Product runtime infrastructure. Consumer Products remain standalone and communicate through optional HTTPS Evidence transport. Hub outage or credential failure must not block Product primary functions.

## 9. Current verification boundary

The implementation and static deployment contract can be fully tested in the current environment. A Docker daemon, live PostgreSQL process, public DNS/TLS and paid VPS are not available/authorized in this gate, so no claim of live persistence or public deployment is made.


## 10. Reproducible live rehearsal harness

`deploy/knowledge-hub/scripts/run-live-rehearsal.sh` is the canonical next-gate harness. It SHALL NOT activate the public profile. A PASS requires live migration/readiness, canonical Event submission, idempotent retry, P3 partial rejection, persisted-row verification, credential revocation, database backup, isolated restore verification and API restart readiness. The harness always tears down its disposable volumes and temporary secret/backup files.


## 11. Pre-Live hardening

The supplied Compose contract injects PostgreSQL connection properties as separate `PGHOST` / `PGPORT` / `PGDATABASE` / `PGUSER` / `PGPASSWORD` fields rather than interpolating the database password into a URI. Runtime launchers share one PostgreSQL config parser and retain `DATABASE_URL` only as an optional external-deployment compatibility input.

The live rehearsal harness may write a sanitized machine Evidence file through `BAI_KNOWLEDGE_HUB_REHEARSAL_EVIDENCE_OUT`. It is written only after the isolated Compose project is successfully torn down. Required Evidence fields are validated by `scripts/validate-knowledge-hub-live-rehearsal-evidence.mjs`.

The direct `pg` runtime dependency is pinned to `8.13.1`. A complete transitive dependency lock remains a production-activation prerequisite and MUST be generated/verified in a network-enabled controlled environment; no lockfile is invented from incomplete metadata.


## 12. GitHub Actions live environment gate

`.github/workflows/knowledge-hub-live-gate.yml` removes the developer-workstation Docker dependency from the next evidence gate. Static contracts run for all matching pull requests; real Docker/PostgreSQL rehearsal is restricted to trusted same-repository PRs, pushes to `main`, or explicit manual dispatch. The workflow never uses `pull_request_target`, grants only read access to repository contents, never activates the public Compose profile, and uploads only sanitized Evidence plus a generated runtime dependency lock candidate.

A passing remote live rehearsal is valid environment Evidence for the exact Git commit tested, but it is not Production VPS/DNS/TLS/Product-pilot authorization.
