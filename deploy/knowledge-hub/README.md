# BAI Knowledge Hub — TASK-017 Phase 0 Deployment Readiness

Status: `IMPLEMENTATION_CANDIDATE / LIVE_REHEARSAL_NOT_YET_EVIDENCED / PUBLIC_ACTIVATION_NOT_AUTHORIZED`

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
- `Caddyfile` — fail-closed public HTTPS gateway contract: Caddy 2.11.4, explicit Let's Encrypt ACME issuer, `shortlived` profile for IP certificates, admin API disabled, and HTTP/3 disabled until UDP/443 is separately adopted.
- `scripts/backup-postgres.sh` + `runtime/create-consistent-backup.mjs` — exported-snapshot custom-format backup staged only on tmpfs, age-encrypted before persistent publication, with exact toolchain/archive manifest and last-write commit marker using the locked runtime `pg` dependency.
- `scripts/restore-rehearsal.sh` — legacy entrypoint, permanently fail-closed. It performs no database operation.
- `scripts/run-encrypted-backup-restore-rehearsal.sh` — the only restore-rehearsal entrypoint; it requires canonical signed authority, one-time nonce consumption, isolated local target proof, exact archive/schema admission, tmpfs plaintext and a durable Evidence bundle.
- `systemd/bai-knowledge-hub-*.service` — the only supported privileged source/restore/recovery launch boundary. It removes environment-injection variables before interpreter startup, disables core dumps, isolates networking and holds the shared canonical-authority lease.
- `scripts/backup-postgres.sh` requires a separately signed, current, non-revoked source-backup authorization and one-time consumption receipt before database access.
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

Public activation remains an explicit STOP Gate. The `public` profile is not used by private startup, runtime-role verification, Live Rehearsal, or the normal GitHub Actions PostgreSQL rehearsal.

The public gateway contract is intentionally staging-first:

- Caddy image is version-pinned to `caddy:2.11.4-alpine`.
- Only host TCP ports `80` and `443` are published by the public profile. UDP/443 is not published and Caddy HTTP/3 is disabled until separately adopted.
- The Caddy admin API remains disabled (`admin off`); host port `2019` is never published.
- The site identifier comes from `HUB_DOMAIN` and may be a reviewed public hostname or public IP address.
- Certificate issuance uses one explicit ACME issuer and the `shortlived` profile. This is required for Let's Encrypt IP-address certificates.
- `BAI_KNOWLEDGE_HUB_ACME_CA_DIRECTORY` defaults to Let's Encrypt **staging**. Production issuance requires an explicit override to `https://acme-v02.api.letsencrypt.org/directory` after staging Evidence and Owner approval.
- `caddy_data` and `caddy_config` stay persistent so the automatic certificate lifecycle is not tied to a container instance.

The example/generated host env therefore carries the safe staging directory. Do **not** replace it with the production directory merely to test. Do **not** run `docker compose --profile public ... up` until the Public Security Gate authorizes the operation.

GitHub Actions performs a real `caddy validate` with the pinned image, a documentation-only IP, and the Let's Encrypt staging directory. That validation does not publish any host port and does not activate the Compose public profile.

## Environment-dependent public TLS evidence

Repository tests and GitHub Actions can prove the Caddyfile parses with the reviewed Caddy release without exposing the service. They cannot prove ownership/reachability of the deployment IP or complete an ACME challenge for the VPS. The later VPS staging gate must separately prove certificate issuance, IP SAN, HTTPS proxying, HTTP-to-HTTPS redirect, TCP-only host exposure, and continued privacy of API `8787`, PostgreSQL `5432`, and Caddy admin `2019`. Production ACME selection remains blocked until that staging Evidence passes.

The canonical staging harness is `scripts/run-public-tls-staging-rehearsal.sh`. It is intentionally non-firewall-mutating and fail-closed: it requires an existing root-only env file, exact Let's Encrypt staging selection, a new Evidence output path and the explicit acknowledgement `STAGING_PUBLIC_TLS_REHEARSAL`. It rejects occupied 80/443, UDP 443, Production ACME and public private-service listeners. After verifying the live certificate, HTTPS/redirect and port boundary, it stops Caddy before atomically publishing sanitized Evidence.

Do not run it until the VPS staging execution and temporary TCP 80/443 reachability are explicitly approved. The operator supplies the existing host env without regenerating it:

```bash
sudo install -d -m 0700 /var/lib/bai-knowledge-hub/evidence
sudo env \
  BAI_PUBLIC_TLS_ACK=STAGING_PUBLIC_TLS_REHEARSAL \
  BAI_KNOWLEDGE_HUB_ACME_CA_DIRECTORY=https://acme-staging-v02.api.letsencrypt.org/directory \
  BAI_KNOWLEDGE_HUB_ENV_FILE=/etc/bai-knowledge-hub/knowledge-hub.env \
  BAI_KNOWLEDGE_HUB_PUBLIC_TLS_EVIDENCE_OUT=/var/lib/bai-knowledge-hub/evidence/public-tls-staging-<UTC>.json \
  bash deploy/knowledge-hub/scripts/run-public-tls-staging-rehearsal.sh
```

Validate the resulting file independently:

```bash
node scripts/validate-knowledge-hub-public-tls-staging-evidence.mjs \
  /var/lib/bai-knowledge-hub/evidence/public-tls-staging-<UTC>.json
```


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

The deployment-only direct `pg` dependency is exact (`8.13.1`). `deploy/knowledge-hub/runtime/package-lock.json` is now canonical and is required for every Knowledge Hub image build. The Dockerfile uses `npm ci` only; an unlocked `npm install` fallback is prohibited. The canonical lock is supply-chain checked for lockfile version 3, exact `pg@8.13.1`, HTTPS `registry.npmjs.org` sources, and SHA-512 integrity metadata.


## GitHub Actions real Docker/PostgreSQL gate

When local Docker is unavailable, `.github/workflows/knowledge-hub-live-gate.yml` provides the canonical remote rehearsal path. It runs static contracts on every matching PR and performs the real disposable Docker/PostgreSQL rehearsal only for same-repository PRs, pushes to `main`, or explicit manual dispatch. Fork PRs never execute untrusted code in the live container gate.

The workflow validates the canonical `deploy/knowledge-hub/runtime/package-lock.json` before Docker build and never regenerates it. The Dockerfile requires the committed lock and uses `npm ci`; the canonical lock checksum is bound into sanitized live-gate Evidence, and both are retained as workflow artifacts for 14 days. This does not authorize the public Caddy profile or Production credentials.
