# PostgreSQL tuning profiles — BAI Knowledge Hub

These profiles are conservative **starting points** for the one-VPS Knowledge Hub topology. They are not universal tuning claims, and profile selection is always explicit.

## Supported profiles

Use `deploy/knowledge-hub/scripts/prepare-compose-env.sh --profile ...` rather than editing the generated profile tuple by hand.

| Profile | Config file | Compose shm | API DB pool default | PostgreSQL max connections |
|---|---|---:|---:|---:|
| `2gb` | `postgresql.tuned-2gb.conf` | `256mb` | `5` | `40` |
| `4gb` | `postgresql.tuned-4gb.conf` | `512mb` | `10` | `60` |
| `8gb` | `postgresql.tuned-8gb.conf` | `1gb` | `10` | `64` |

There is intentionally **no silent Compose fallback** for `POSTGRES_CONFIG_FILE` or `POSTGRES_SHM_SIZE`. A missing host-memory profile is a deployment error.

## 2 GiB low-resource profile

`postgresql.tuned-2gb.conf` keeps `shared_buffers=256MB` and `work_mem=4MB` to preserve OS/API headroom. The generated API pool default is 5.

## 4 GiB profile

`postgresql.tuned-4gb.conf` raises cache and maintenance budgets while preserving durability. The generated API pool default is 10.

## 8 GiB startup-production profile

`postgresql.tuned-8gb.conf` is the Owner-selected ABLENET L3 startup profile. It uses `shared_buffers=1536MB`, `effective_cache_size=5GB`, `work_mem=8MB`, `maintenance_work_mem=256MB`, `autovacuum_work_mem=256MB`, and keeps `max_connections=64`. The generated API pool default remains 10 rather than scaling linearly with RAM.

## Values that do not follow the memory profile

The profile selector does not make every environment value memory-dependent:

- `POSTGRES_IMAGE=postgres:16.14-alpine` remains canonical.
- `POSTGRES_DB=bai_knowledge_hub` remains canonical.
- `POSTGRES_USER=bai_hub` remains canonical until the separate Runtime DB Role Security Gate changes the role model.
- `POSTGRES_PASSWORD` is random per generated environment and is never printed.
- retention, API rate limit, body limit, and DB pool override are operational policy inputs with bounded CLI overrides.
- `HUB_DOMAIN` is a deployment/publication input; the private placeholder remains `hub.example.invalid` until the Public Production gate.

Runtime DB role separation is intentionally **not** part of the memory-profile selector change.

## Integrity and authentication

The Compose environment initializes a new database with:

- data page checksums (`--data-checksums`),
- host authentication using `scram-sha-256`,
- `password_encryption=scram-sha-256` in PostgreSQL configuration.

These initialization options only affect a **new empty data volume**. Changing an environment file later does not retroactively rebuild an existing cluster.

## Settings intentionally kept safe

The profiles do not turn off `fsync`, `synchronous_commit`, or `full_page_writes`. They also do not globally force SSD-specific planner values such as `random_page_cost` or `effective_io_concurrency` without target-storage Evidence.

## Verify an active container

```bash
docker compose --env-file .env exec -T postgres sh -lc \
  'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /etc/postgresql/verify-tuning.sql'
```

Or use the helper:

```bash
bash deploy/knowledge-hub/scripts/verify-postgres-tuning.sh
```

The helper also verifies that `fsync`, `synchronous_commit`, `full_page_writes`, SCRAM password encryption, and data checksums are active.

## Retuning rule

Do not raise `work_mem` merely because RAM is available: it can be allocated repeatedly by one query and by concurrent sessions. Change the profile only after recording real connection count, query latency, cache hit ratio, checkpoint/WAL behavior, autovacuum behavior, and host memory pressure.
