# TASK-017 Phase 0 — Deployment Readiness Implementation Result

Date: `2026-08-11`
Status: `IMPLEMENTED / VERIFIED / LIVE_POSTGRES_REHEARSAL_PENDING`
Scope: non-production deployment-readiness slice after Local Hub Foundation acceptance

## Implemented

- Single-VPS Docker Compose topology with PostgreSQL and Knowledge API private to the internal network by default.
- Separate loopback-only rehearsal override (`127.0.0.1:8787`).
- Explicit Caddy `public` profile; public ports are not activated by ordinary rehearsal.
- Production-compatible Node runtime launcher using deployment-only PostgreSQL driver boundary.
- Ordered PostgreSQL migration runner with immutable checksum ledger.
- Production migration executor uses one database transaction plus advisory transaction lock for migration + ledger atomicity.
- `002_auth_and_operations.sql` adds API credential metadata with derived secret material only.
- High-entropy Product API credential issuance (`bkh1.<key_id>.<secret>`), scrypt derivation and timing-safe verification.
- PostgreSQL credential store supports lookup, one-way persistence and revocation without storing raw API keys.
- `/healthz` liveness and `/readyz` repository dependency readiness separation.
- PostgreSQL readiness uses bounded `SELECT 1` and fails closed when dependency probing fails.
- Response cache/security headers for Hub JSON responses.
- Caddy HTTPS reverse-proxy template with HSTS, content-type protection and request-size bound.
- PostgreSQL backup script using restrictive umask, custom-format `pg_dump` and SHA-256 sidecar.
- Restore rehearsal script that refuses operation unless the target ends `_restore_rehearsal` and explicit rehearsal acknowledgement is present.
- Retention-prune deployment runner.
- Deployment readiness checker and deterministic static/runtime-contract tests.

## Verification

- TASK-017 Knowledge Hub focused suite: `29 / 29 PASS`.
- Full BAI Development OS: `1267 / 1267 PASS`.
- Roadmap: `PASS` (`Ver.2.28`, 56 source sections, missing 0).
- Security / Release / Conformance / Maintenance / Extension / Calibration / Distributed checks: `PASS`.
- Knowledge Hub deployment readiness check: `PASS`.
- `git diff --check`: `PASS`.
- `git fsck --full`: no fatal corruption; historical dangling objects remain non-blocking local Git garbage.

## Environment limitation

The execution environment did not expose Docker, `psql`, `pg_dump` or a live PostgreSQL process. Therefore no claim is made that containers were built, migrations were applied to a real PostgreSQL instance, backup/restore was executed, or TLS was negotiated. The code and deployment contracts are production-compatible candidates; **live PostgreSQL rehearsal remains the next environment-dependent evidence gate**.

## Security boundary retained

No VPS purchase, DNS change, public TLS activation, production API key distribution, real-user Evidence collection or destructive production restore was performed. BAI VIDEO PRODUCTION remains standalone and stores its Product API key through its Product-selected password manager rather than Source/Config.
