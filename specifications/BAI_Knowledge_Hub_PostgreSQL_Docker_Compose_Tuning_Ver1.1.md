# BAI Knowledge Hub PostgreSQL / Docker Compose Tuning Specification Ver.1.1

Status: `IMPLEMENTATION_BASELINE / 8GB_STARTUP_SELECTED / 4GB_FALLBACK_RETAINED / LIVE_DOCKER_VALIDATION_PENDING`
Date: `2026-08-11`
Supersedes: `BAI_Knowledge_Hub_PostgreSQL_Docker_Compose_Tuning_Ver1.0.md` for active startup-host selection
Parent: `TASK-017 Phase 0 — Consumer Evidence Hub Pilot Transport Slice`

## 1. Objective

Provide a repeatable one-VPS Docker Compose topology and conservative PostgreSQL configuration profiles before the first live PostgreSQL rehearsal. The design preserves the v1 infrastructure ceiling and keeps PostgreSQL/API private by default.

## 2. Startup environment decision

The Owner selected **ABLENET L3 / 8 GiB RAM** as the startup VPS target. Provisioning and live validation remain pending. The Compose/environment bootstrap therefore defaults to `postgresql.tuned-8gb.conf` with `POSTGRES_SHM_SIZE=1gb`.

The 4 GiB profile remains available as an explicit fallback; the 2 GiB profile remains a low-resource development/rehearsal option. No automatic host-size detection or profile switching is authorized.

## 3. PostgreSQL image and persistence

- Default image: `postgres:16.14-alpine`.
- PostgreSQL data volume remains `/var/lib/postgresql/data` because the selected major is PostgreSQL 16.
- PostgreSQL is never host-published by the base Compose.
- The tuning profile is mounted read-only and selected using `POSTGRES_CONFIG_FILE`.
- Startup-production `shm_size` default is `1gb`.

## 4. Integrity and authentication

New empty clusters initialize with data page checksums and `scram-sha-256` host authentication. PostgreSQL stores newly set passwords using SCRAM. The tuning profile SHALL NOT disable `fsync`, `synchronous_commit`, or `full_page_writes`.

Changing initdb variables after a data volume already exists does not retrofit that cluster. Reinitialization requires explicit backup/restore/migration authorization.

## 5. Memory principles

`work_mem` is bounded because it may be consumed multiple times by one query and across concurrent sessions. The 8 GiB startup profile intentionally keeps `work_mem=8MB` and `max_connections=64` bounded rather than scaling them linearly with RAM. Host memory remains reserved for the Knowledge API, reverse proxy, filesystem cache, backup work and the operating system.

## 6. Storage-dependent tuning

The generic profile SHALL NOT force `random_page_cost` or `effective_io_concurrency`. Those values depend on actual storage behavior and require target-VPS Evidence.

## 7. Operational verification

`verify-postgres-tuning.sh` and `postgres/verify-tuning.sql` report the active profile and fail if durability, SCRAM password encryption, or data checksums are disabled.

The repository machine checker `npm run check:knowledge-hub-postgres-tuning` validates the static configuration before Docker is available.

## 8. Public boundary

Caddy remains behind the existing explicit `public` Compose profile. Selecting ABLENET L3 does not itself claim VPS provisioning, TLS issuance, public ingress, or real Product credential activation. Those require their deployment gates and live Evidence.

## 9. Live gate

The next environment-dependent Evidence SHALL include:

1. `docker compose config` PASS,
2. PostgreSQL container healthy,
3. Knowledge API `/readyz` PASS,
4. active 8 GiB tuning verification PASS,
5. migrations PASS,
6. live rehearsal / backup / restore PASS,
7. no unintended PostgreSQL or API host exposure.
