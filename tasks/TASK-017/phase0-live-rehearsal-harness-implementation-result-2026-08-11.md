# TASK-017 Phase 0 — Live Rehearsal Harness Implementation Result

Date: `2026-08-11`
Status: `IMPLEMENTED / STATICALLY_VERIFIED / EXECUTION_ENVIRONMENT_PENDING`

## Purpose

Remove manual orchestration from the next environment-dependent gate. When Docker + Compose are available, one script performs the bounded live PostgreSQL rehearsal without activating the public Caddy profile or retaining test secrets/data.

## Rehearsal sequence

1. Generate an ephemeral PostgreSQL password into a mode-600 temporary env file.
2. Build/start only `postgres` + `knowledge-api` with loopback rehearsal override.
3. Wait for `/readyz`.
4. Create an ephemeral server-side Product API credential without printing the raw key.
5. Submit the three pilot Event families.
6. Retry the same Batch and verify `already_seen` idempotency.
7. Submit a mixed safe/P3 Batch and verify Event-level partial rejection.
8. Verify persisted Evidence count.
9. Revoke the API credential and verify 401.
10. `pg_dump` the isolated rehearsal DB and verify SHA-256.
11. Restore into a separate `_restore_rehearsal` database and verify Evidence rows.
12. Drop the restore database.
13. Restart Knowledge API and verify `/readyz` recovery.
14. Always `docker compose down -v` and remove temporary secret/backup files on exit.

## Safety

The script never invokes the Compose `public` profile. It does not change DNS, issue production credentials, collect Product-user Evidence or preserve a rehearsal database. It is intentionally destructive only to its own disposable Compose project/volumes.

## Verification

Final local verification after the harness was added:

- TASK-017 Knowledge Hub focused suite: `31 / 31 PASS`
- Full BAI Development OS suite: `1269 / 1269 PASS`
- Roadmap / Security / Release / Conformance / Maintenance / Extension / Calibration / Distributed: `PASS`
- Knowledge Hub Deployment Readiness conformance: `PASS`
- `git diff --check`: `PASS`

The harness and runtime client pass shell/Node syntax and static safety-contract tests. Actual execution remains pending because the current environment does not expose Docker/PostgreSQL.
