# BAI Knowledge Hub — TASK-017 Phase 0 Deployment Readiness

Status: `LOCAL_REHEARSAL_READY / PUBLIC_ACTIVATION_NOT_AUTHORIZED`

## Included

- `compose.yaml` — one-VPS topology. PostgreSQL and API are private by default; Caddy requires explicit `public` profile. PostgreSQL uses a mounted tuning profile and exact 16.14 Alpine tag by default.
- `compose.private.yaml` — private local/VPS override that publishes the Knowledge API only on `127.0.0.1:8787`.
- `compose.rehearsal.yaml` — internal-only API declaration for an isolated local/VPS rehearsal; it does not publish a host port.
- `Dockerfile` + `runtime/` — PostgreSQL-backed Hub runtime; deployment-only `pg` dependency. Schema migration runs in a separate one-shot admin service before the API starts.
- `postgres/001_initial.sql`, `002_auth_and_operations.sql` — immutable migrations.
- `postgres/postgresql.tuned-2gb.conf` — explicit low-resource 2 GiB profile.
- `postgres/postgresql.tuned-4gb.conf` — explicit 4 GiB profile.
- `postgres/postgresql.tuned-8gb.conf` — explicit 8 GiB startup-production profile.
- `postgres/verify-tuning.sql` + `scripts/verify-postgres-tuning.sh` — active-setting verification.
- `Caddyfile` — HTTPS reverse proxy template for a later public gate.
- `scripts/backup-postgres.sh` — restrictive custom-format backup + SHA-256.
- `scripts/restore-rehearsal.sh` — restore rehearsal only; safety suffix + acknowledgement required.
- `scripts/ensure-runtime-db-credentials.sh` — atomically augments an existing host-only environment with a dedicated runtime DB credential without changing the bootstrap/admin password.
- `scripts/verify-runtime-db-role.sh` — verifies the live API identity and least-privilege PostgreSQL role contract.

## Local Docker Compose quick start

The base deployment does not publish the API or PostgreSQL. `start-local-compose.sh` combines `compose.yaml` with `compose.private.yaml`, which binds the private API only to `127.0.0.1:8787`; PostgreSQL remains internal. The disposable Live Rehearsal itself publishes no host port. Host-memory profile selection is explicit: the tooling never guesses 2/4/8 GiB from the host and never silently falls back to a profile.

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

The private helper scripts (`start-local-compose.sh`, `stop-local-compose.sh`, and `verify-runtime-db-role.sh`) use `compose.yaml + compose.private.yaml`. The live rehearsal remains isolated on `compose.yaml + compose.rehearsal.yaml`, so it never competes for the host loopback port.

## Rehearsal sequence when Docker is available

```bash
cd deploy/knowledge-hub
# Recommended: create a 0600 host-only .env with a random DB password.
bash scripts/prepare-compose-env.sh --profile 8gb --output .env
# Or copy .env.example manually and replace every profile placeholder; never commit .env.
docker compose -f compose.yaml -f compose.rehearsal.yaml --env-file .env up -d --build
docker compose -f compose.yaml -f compose.rehearsal.yaml --env-file .env \
  exec -T knowledge-api node deploy/knowledge-hub/runtime/healthcheck.mjs
```

The base Compose does not host-publish PostgreSQL or the API. `compose.rehearsal.yaml` keeps the API internal-only so the disposable rehearsal can run beside a private Hub already using host loopback port 8787.


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

The profile controls `POSTGRES_CONFIG_FILE`, `POSTGRES_SHM_SIZE`, and the safe default for `BAI_KNOWLEDGE_HUB_DB_POOL_MAX`. `POSTGRES_IMAGE`, `POSTGRES_DB`, and the bootstrap/admin `POSTGRES_USER=bai_hub` remain canonical fixed values. A separate `BAI_KNOWLEDGE_HUB_RUNTIME_DB_USER=bai_hub_runtime` is used by the API. Both database passwords are generated independently and are never printed.

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

## Runtime database role security

The long-lived `knowledge-api` never receives the bootstrap/admin PostgreSQL credential. Compose runs `knowledge-migrate` first with `bai_hub`; that one-shot service applies immutable migrations, creates or normalizes `bai_hub_runtime`, resets its table privileges, grants only the API-required DML, verifies the role attributes and privileges, then exits. The API starts only after `knowledge-migrate` completes successfully.

For an existing host-only environment created before this split, add the runtime credential without changing the existing PostgreSQL password:

```bash
sudo bash deploy/knowledge-hub/scripts/ensure-runtime-db-credentials.sh \
  /etc/bai-knowledge-hub/knowledge-hub.env
```

After Compose has converged, verify the live contract:

```bash
sudo env BAI_KNOWLEDGE_HUB_ENV_FILE=/etc/bai-knowledge-hub/knowledge-hub.env \
  bash deploy/knowledge-hub/scripts/verify-runtime-db-role.sh
```

`bai_hub_runtime` is `NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS`, has no role memberships, cannot create objects in `public`, receives no access to `schema_migrations`, and can only perform the DML required by the HTTP runtime.

## Issue a Product API credential for a controlled environment

Credential issuance is an administrative operation and must not broaden the long-lived API database role. Only after the relevant credential gate is authorized, run the one-shot admin service:

```bash
BAI_HUB_CREDENTIAL_PRODUCT_ID=bai-video-production \
BAI_HUB_CREDENTIAL_SUBJECT_ID=<installation-or-pilot-subject> \
docker compose --profile admin --env-file .env run --rm \
  -e BAI_HUB_CREDENTIAL_PRODUCT_ID -e BAI_HUB_CREDENTIAL_SUBJECT_ID \
  knowledge-admin node deploy/knowledge-hub/runtime/issue-api-key.mjs
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
