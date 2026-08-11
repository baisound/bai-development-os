# BAI Knowledge Hub — TASK-017 Phase 0 Deployment Readiness

Status: `LOCAL_REHEARSAL_READY / PUBLIC_ACTIVATION_NOT_AUTHORIZED`

## Included

- `compose.yaml` — one-VPS topology. PostgreSQL and API are private by default; Caddy requires explicit `public` profile.
- `compose.rehearsal.yaml` — loopback-only API exposure for a local/VPS rehearsal.
- `Dockerfile` + `runtime/` — PostgreSQL-backed Hub runtime; deployment-only `pg` dependency.
- `postgres/001_initial.sql`, `002_auth_and_operations.sql` — immutable migrations.
- `Caddyfile` — HTTPS reverse proxy template for a later public gate.
- `scripts/backup-postgres.sh` — restrictive custom-format backup + SHA-256.
- `scripts/restore-rehearsal.sh` — restore rehearsal only; safety suffix + acknowledgement required.

## Rehearsal sequence when Docker is available

```bash
cd deploy/knowledge-hub
cp .env.example .env
# Replace placeholders locally; never commit .env.
chmod 600 .env
docker compose -f compose.yaml -f compose.rehearsal.yaml --env-file .env up -d --build
curl -fsS http://127.0.0.1:8787/healthz
curl -fsS http://127.0.0.1:8787/readyz
```

The base Compose does not host-publish PostgreSQL or the API. `compose.rehearsal.yaml` publishes only API loopback.

## Issue a Product API credential for a controlled environment

Only after the relevant credential gate is authorized:

```bash
# Run inside the knowledge-api image/container with DATABASE_URL available.
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
