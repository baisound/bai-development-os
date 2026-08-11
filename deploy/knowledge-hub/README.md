# BAI Knowledge Hub — TASK-017 Phase 0 Deployment Readiness

Status: `LOCAL_REHEARSAL_READY / PUBLIC_ACTIVATION_NOT_AUTHORIZED`

## Included

- `compose.yaml` — one-VPS topology. PostgreSQL and API are private by default; Caddy requires explicit `public` profile. PostgreSQL uses a mounted tuning profile and exact 16.14 Alpine tag by default.
- `compose.rehearsal.yaml` — loopback-only API exposure for a local/VPS rehearsal.
- `Dockerfile` + `runtime/` — PostgreSQL-backed Hub runtime; deployment-only `pg` dependency.
- `postgres/001_initial.sql`, `002_auth_and_operations.sql` — immutable migrations.
- `postgres/postgresql.tuned-2gb.conf` — default shared-2-GiB-VPS profile.
- `postgres/postgresql.tuned-4gb.conf` — optional shared-4-GiB-VPS profile.
- `postgres/verify-tuning.sql` + `scripts/verify-postgres-tuning.sh` — active-setting verification.
- `Caddyfile` — HTTPS reverse proxy template for a later public gate.
- `scripts/backup-postgres.sh` — restrictive custom-format backup + SHA-256.
- `scripts/restore-rehearsal.sh` — restore rehearsal only; safety suffix + acknowledgement required.

## Local Docker Compose quick start

The safest local path binds only the API to `127.0.0.1`; PostgreSQL remains internal. It creates a host-only `.env` with mode `0600` if none exists, starts PostgreSQL + API, waits for `/readyz`, and verifies the active PostgreSQL safety/tuning settings.

```bash
bash deploy/knowledge-hub/scripts/start-local-compose.sh
```

Stop while preserving PostgreSQL data:

```bash
bash deploy/knowledge-hub/scripts/stop-local-compose.sh
```

Delete the local PostgreSQL volume only when intentional:

```bash
bash deploy/knowledge-hub/scripts/stop-local-compose.sh --destroy-data
```

## Rehearsal sequence when Docker is available

```bash
cd deploy/knowledge-hub
# Recommended: create a 0600 host-only .env with a random DB password.
bash scripts/prepare-compose-env.sh
# Or copy .env.example manually and replace placeholders; never commit .env.
docker compose -f compose.yaml -f compose.rehearsal.yaml --env-file .env up -d --build
curl -fsS http://127.0.0.1:8787/healthz
curl -fsS http://127.0.0.1:8787/readyz
```

The base Compose does not host-publish PostgreSQL or the API. `compose.rehearsal.yaml` publishes only API loopback.


## PostgreSQL tuning profile

The default profile targets the original low-cost one-VPS design where a ~2 GiB host is shared by PostgreSQL, Knowledge API, reverse proxy, backup jobs and the OS. It keeps durability (`fsync`, `synchronous_commit`, `full_page_writes`) enabled, initializes new clusters with data checksums and SCRAM host authentication, and avoids forcing storage-specific planner values before target-disk Evidence exists.

To select the optional 4 GiB profile, set `POSTGRES_CONFIG_FILE=./postgres/postgresql.tuned-4gb.conf` and `POSTGRES_SHM_SIZE=512mb` in the host-only `.env`.

After startup:

```bash
bash scripts/verify-postgres-tuning.sh
```

Changing the initdb authentication/checksum variables does not retrofit an existing PostgreSQL volume; recreate only through an explicitly authorized migration/restore procedure.

## Issue a Product API credential for a controlled environment

Only after the relevant credential gate is authorized:

```bash
# Run inside the knowledge-api image/container. The supplied Compose injects PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD.
BAI_HUB_CREDENTIAL_PRODUCT_ID=bai-video-production \
BAI_HUB_CREDENTIAL_SUBJECT_ID=<installation-or-pilot-subject> \
node deploy/knowledge-hub/runtime/issue-api-key.mjs
```

The raw key is displayed once. Store it in the Product-selected password manager. The Hub stores only derived secret material.

## Public profile — DO NOT ACTIVATE YET

Public activation is intentionally separate:

```bash
# Requires Owner/security/budget gate + real DNS first.
docker compose --profile public --env-file .env up -d
```

Do not run this merely to test locally.

## Current environment limitation

The ChatGPT execution environment used for this implementation did not expose Docker or a live PostgreSQL server. Therefore the repository contains a production-compatible deployment package and deterministic tests, but **does not claim a live PostgreSQL migration/backup/TLS rehearsal**. That evidence is the next environment-dependent gate.


## One-command live rehearsal when Docker is available

```bash
bash deploy/knowledge-hub/scripts/run-live-rehearsal.sh
```

The harness intentionally starts only PostgreSQL + Knowledge API, never the `public` Caddy profile. It generates disposable credentials/data, verifies submit/retry/partial reject/revocation, performs backup + isolated restore, restarts the API, verifies readiness, then removes the Compose volumes and temporary files.


## Machine-readable rehearsal Evidence

To preserve sanitized Evidence for Judge review:

```bash
mkdir -p /secure/local/evidence
BAI_KNOWLEDGE_HUB_REHEARSAL_EVIDENCE_OUT=/secure/local/evidence/live-rehearsal.json \
  bash deploy/knowledge-hub/scripts/run-live-rehearsal.sh
node scripts/validate-knowledge-hub-live-rehearsal-evidence.mjs \
  /secure/local/evidence/live-rehearsal.json
```

The Evidence file contains no credential and is created only after successful rehearsal resource teardown. Keep it outside public artifacts until reviewed.

## Dependency reproducibility gate

The deployment-only direct `pg` dependency is exact (`8.13.1`). A complete `package-lock.json` is still required before public production activation. This repository does not fabricate a lockfile when npm registry metadata is unavailable.
