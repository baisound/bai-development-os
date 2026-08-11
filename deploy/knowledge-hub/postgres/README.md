# PostgreSQL tuning profiles — BAI Knowledge Hub

These profiles are conservative **starting points** for the one-VPS Knowledge Hub v1 topology. They are not universal tuning claims.

## Default profile: 2 GiB shared VPS

`postgresql.tuned-2gb.conf` is the default Compose profile. The host is assumed to run PostgreSQL, the Knowledge API, a small reverse proxy, backup/rehearsal jobs, and the OS itself.

The profile therefore does **not** assign 25% of the entire host to every PostgreSQL memory consumer. `shared_buffers=256MB` leaves headroom for the OS page cache and the API, while `work_mem=4MB` bounds per-sort/per-hash memory amplification. The API connection pool remains 10 by default and PostgreSQL `max_connections` is 40.

## Optional profile: 4 GiB shared VPS

Set in the host-only `.env`:

```text
POSTGRES_CONFIG_FILE=./postgres/postgresql.tuned-4gb.conf
POSTGRES_SHM_SIZE=512mb
```

The 4 GiB profile raises cache/memory and parallel-worker budgets, but preserves durability and authentication controls.

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
