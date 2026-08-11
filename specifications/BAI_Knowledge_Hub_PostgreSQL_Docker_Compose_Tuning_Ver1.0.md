# BAI Knowledge Hub PostgreSQL / Docker Compose Tuning Specification Ver.1.0

Status: `IMPLEMENTATION_BASELINE / 4GB_STARTUP_SELECTED / 8GB_SCALE_PROFILE_PREPARED / LIVE_DOCKER_VALIDATION_PENDING`
Date: `2026-08-11`
Parent: `TASK-017 Phase 0 — Consumer Evidence Hub Pilot Transport Slice`

## 1. Objective

Provide a repeatable one-VPS Docker Compose topology and conservative PostgreSQL configuration profiles before the first live PostgreSQL rehearsal. The design preserves the v1 infrastructure ceiling and keeps PostgreSQL/API private by default.

## 2. Startup and scale-up environments

The Owner-selected startup deployment target is a shared VPS with approximately **4 GiB RAM**. PostgreSQL, Knowledge API, reverse proxy, backup/rehearsal work and the host OS share that memory. The Compose/environment bootstrap therefore defaults to `postgresql.tuned-4gb.conf` with `POSTGRES_SHM_SIZE=512mb`.

An **8 GiB scale-up profile** is prepared but remains inactive. It is selected only after the host is actually resized and the active configuration is verified. The 2 GiB profile remains available as a low-resource development/rehearsal option.

## 3. PostgreSQL image and persistence

- Default image: `postgres:16.14-alpine`.
- PostgreSQL data volume remains `/var/lib/postgresql/data` because the selected major is PostgreSQL 16.
- PostgreSQL is never host-published by the base Compose.
- The tuning profile is mounted read-only and selected using `POSTGRES_CONFIG_FILE`.
- `shm_size` is configurable; startup-production default is `512mb`. The 8 GiB scale-up recommendation is `1gb`.

## 4. Integrity and authentication

New empty clusters initialize with data page checksums and `scram-sha-256` host authentication. PostgreSQL stores newly set passwords using SCRAM. The tuning profile SHALL NOT disable `fsync`, `synchronous_commit`, or `full_page_writes`.

Changing initdb variables after a data volume already exists does not retrofit that cluster. Reinitialization requires explicit backup/restore/migration authorization.

## 5. Memory principles

`work_mem` is bounded because it may be consumed multiple times by one query and across concurrent sessions. All profiles leave host memory for the API and operating system instead of applying a dedicated-database formula to a shared VPS. The 8 GiB profile intentionally keeps `work_mem=8MB` and `max_connections=64` bounded rather than scaling them linearly with RAM.

## 6. Storage-dependent tuning

The generic profile SHALL NOT force `random_page_cost` or `effective_io_concurrency`. Those values depend on actual storage behavior and require target-VPS Evidence.

## 7. Operational verification

`verify-postgres-tuning.sh` and `postgres/verify-tuning.sql` report the active profile and fail if durability, SCRAM password encryption, or data checksums are disabled.

The repository machine checker `npm run check:knowledge-hub-postgres-tuning` validates the static configuration before Docker is available.

## 8. Public boundary

Caddy remains behind the existing explicit `public` Compose profile. This specification does not authorize DNS, TLS, public ingress, paid VPS provisioning, or production Product credentials.

## 9. Live gate

The next environment-dependent Evidence SHALL include:

1. `docker compose config` PASS,
2. PostgreSQL container healthy,
3. Knowledge API `/readyz` PASS,
4. active tuning verification PASS,
5. migrations PASS,
6. live rehearsal / backup / restore PASS,
7. no public profile activation.
