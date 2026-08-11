# PostgreSQL tuning profiles — BAI Knowledge Hub

These profiles are conservative **starting points** for the one-VPS Knowledge Hub v1 topology. They are not universal tuning claims.

## Startup production profile: 4 GiB shared VPS

`postgresql.tuned-4gb.conf` is the startup-production Compose profile because the initial Knowledge Hub VPS is planned at 4 GiB RAM. The host is assumed to run PostgreSQL, the Knowledge API, a small reverse proxy, backup/rehearsal jobs, and the OS itself.

The 4 GiB profile keeps `shared_buffers=768MB`, `effective_cache_size=2560MB`, `work_mem=8MB`, and `max_connections=60`. It leaves headroom for the OS page cache and application containers while preserving durability controls.

## Scale-up profile: 8 GiB shared VPS

`postgresql.tuned-8gb.conf` is prepared now so a later VPS scale-up does not require an emergency tuning redesign. It is **not** the startup default and must not be selected until the host has actually been resized and a maintenance-window verification is authorized.

Host-only `.env` selection after an 8 GiB scale-up:

```text
POSTGRES_CONFIG_FILE=./postgres/postgresql.tuned-8gb.conf
POSTGRES_SHM_SIZE=1gb
```

The 8 GiB profile uses `shared_buffers=1536MB`, `effective_cache_size=5GB`, `work_mem=8MB`, and a bounded `max_connections=64`. `work_mem` deliberately does not double with RAM because it is a per-operation allocation and can multiply across concurrent queries.

## Low-resource profile: 2 GiB shared VPS

`postgresql.tuned-2gb.conf` remains available for local/rehearsal or explicitly constrained hosts. It is no longer the production startup default.

## Integrity and authentication

The Compose environment initializes a new database with:

- data page checksums (`--data-checksums`),
- host authentication using `scram-sha-256`,
- `password_encryption=scram-sha-256` in PostgreSQL configuration.

These initialization options only affect a **new empty data volume**. Changing `.env` later does not retroactively rebuild an existing cluster.

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
