# TASK-017 Phase 0 — Docker Compose / PostgreSQL Tuning Critic Review

Date: `2026-08-11`
Decision: `PASS_FOR_LIVE_DOCKER_ENVIRONMENT_HANDOFF`
Blocking findings: `0`

## Review

### Memory and connection safety

The default profile does not apply a dedicated-database 25% memory rule mechanically to a shared 2 GiB VPS. `shared_buffers=256MB`, `work_mem=4MB`, `max_connections=40`, and limited parallel workers leave headroom for the Knowledge API, reverse proxy, filesystem cache, backup jobs, and the host OS. A 4 GiB profile exists separately rather than silently oversizing the default.

### Durability

No performance tuning weakens `fsync`, `synchronous_commit`, or `full_page_writes`. New clusters enable page checksums. This is appropriate for an Evidence system whose integrity is more important than marginal write throughput.

### Authentication

Host authentication and new password storage use SCRAM-SHA-256. PostgreSQL is not published to the host network by the base Compose.

### Storage assumptions

The profile intentionally does not force `random_page_cost` or `effective_io_concurrency`; those require actual target-disk Evidence. This avoids tuning by assumption.

### Operations

The environment bootstrap creates a mode-0600 file and does not print the generated DB password. Stop preserves the PostgreSQL volume by default; destructive volume deletion requires an explicit flag.

## Residual risks / required Evidence

- PostgreSQL has not parsed these configs in a live container in the current execution environment.
- Actual 2 GiB VPS memory pressure and cache/WAL behavior remain unmeasured.
- Image tag is exact-minor but not architecture-specific digest-pinned.
- deployment runtime transitive NPM lock remains pending because registry access is unavailable.
- public ingress remains unauthorized.

These are environment/supply-chain gates, not blocking defects in the local configuration artifact.
