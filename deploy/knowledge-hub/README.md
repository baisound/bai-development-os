# BAI Knowledge Hub — TASK-017 Phase 0 Deployment Readiness

Status: `LOCAL_REHEARSAL_READY / PUBLIC_ACTIVATION_NOT_AUTHORIZED`

## Included

- `compose.yaml` — one-VPS topology. PostgreSQL and API are private by default; Caddy requires explicit `public` profile. PostgreSQL uses a mounted tuning profile and exact 16.14 Alpine tag by default.
- `compose.rehearsal.yaml` — loopback-only API exposure for a local/VPS rehearsal.
- `Dockerfile` + `runtime/` — PostgreSQL-backed Hub runtime; deployment-only `pg` dependency.
- `postgres/001_initial.sql`, `002_auth_and_operations.sql` — immutable migrations.
- `postgres/postgresql.tuned-2gb.conf` — explicit low-resource 2 GiB profile.
- `postgres/postgresql.tuned-4gb.conf` — explicit 4 GiB profile.
- `postgres/postgresql.tuned-8gb.conf` — explicit 8 GiB startup-production profile.
- `postgres/verify-tuning.sql` + `scripts/verify-postgres-tuning.sh` — active-setting verification.
- `Caddyfile` — HTTPS reverse proxy template for a later public gate.
- `scripts/backup-postgres.sh` — restrictive custom-format backup + SHA-256.
- `scripts/restore-rehearsal.sh` — restore rehearsal only; safety suffix + acknowledgement required.

## Local Docker Compose quick start

The safest local path binds only the API to `127.0.0.1`; PostgreSQL remains internal. Host-memory profile selection is explicit: the tooling never guesses 2/4/8 GiB from the host and never silently falls back to a profile.

Create a host-only environment first:

```bash
bash deploy/knowledge-hub/scripts/prepare-compose-env.sh \
  --profile 8gb \
  --output deploy/knowledge-hub/.env
bash deploy/knowledge-hub/scripts/start-local-compose.sh
```

For an intentional one-command bootstrap when the env file does not exist, set `BAI_KNOWLEDGE_HUB_PROFILE=2gb|4gb|8gb`.

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
bash scripts/prepare-compose-env.sh --profile 8gb --output .env
# Or copy .env.example manually and replace every profile placeholder; never commit .env.
docker compose -f compose.yaml -f compose.rehearsal.yaml --env-file .env up -d --build
curl -fsS http://127.0.0.1:8787/healthz
curl -fsS http://127.0.0.1:8787/readyz
```

The base Compose does not host-publish PostgreSQL or the API. `compose.rehearsal.yaml` publishes only API loopback.


## PostgreSQL tuning profile

Profile selection is a required deployment decision, not an implicit default. Use exactly one of the supported host-memory profiles:

| Profile | PostgreSQL config | Compose shared memory | API DB pool default |
|---|---|---:|---:|
| `2gb` | `postgresql.tuned-2gb.conf` | `256mb` | `5` |
| `4gb` | `postgresql.tuned-4gb.conf` | `512mb` | `10` |
| `8gb` | `postgresql.tuned-8gb.conf` | `1gb` | `10` |

Generate the environment with the selected profile rather than editing profile fields by hand:

```bash
bash scripts/prepare-compose-env.sh --profile 8gb --output .env
```

The profile controls `POSTGRES_CONFIG_FILE`, `POSTGRES_SHM_SIZE`, and the safe default for `BAI_KNOWLEDGE_HUB_DB_POOL_MAX`. `POSTGRES_IMAGE`, `POSTGRES_DB`, and `POSTGRES_USER` remain canonical fixed values. `POSTGRES_PASSWORD` is generated randomly and never printed.

Operational policy values remain independently overrideable within runtime-supported bounds:

```bash
bash scripts/prepare-compose-env.sh \
  --profile 8gb \
  --output .env \
  --retention-days 30 \
  --rate-limit-per-minute 120 \
  --body-limit-bytes 262144 \
  --db-pool-max 10 \
  --hub-domain hub.example.invalid
```

The script prints a secret-free configuration summary after generation. It does **not** authorize the public Caddy profile. `HUB_DOMAIN=hub.example.invalid` remains valid for private rehearsal; a real public host/IP is supplied only by the separate Public Production gate.

All three PostgreSQL profiles preserve durability (`fsync`, `synchronous_commit`, `full_page_writes`), initialize new clusters with data checksums and SCRAM host authentication, and keep storage-specific planner values Evidence-gated.

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


## GitHub Actions real Docker/PostgreSQL gate

When local Docker is unavailable, `.github/workflows/knowledge-hub-live-gate.yml` provides the canonical remote rehearsal path. It runs static contracts on every matching PR and performs the real disposable Docker/PostgreSQL rehearsal only for same-repository PRs, pushes to `main`, or explicit manual dispatch. Fork PRs never execute untrusted code in the live container gate.

The workflow also generates `deploy/knowledge-hub/runtime/package-lock.json` as a review candidate before Docker build. When that file exists, the Dockerfile uses `npm ci`; the lock candidate and sanitized live-gate Evidence are retained as workflow artifacts for 14 days. This does not authorize the public Caddy profile or Production credentials.
