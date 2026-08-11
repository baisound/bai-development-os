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
