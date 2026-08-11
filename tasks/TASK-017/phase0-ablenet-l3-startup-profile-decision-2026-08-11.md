# TASK-017 Phase 0 — ABLENET L3 Startup Profile Decision

Date: `2026-08-11`
Decision: `OWNER_SELECTED / PROVISIONING_PENDING`

## Decision

The startup Knowledge Hub VPS target is ABLENET L3 with an 8 GiB memory class. The active deployment default is therefore the existing 8 GiB PostgreSQL profile.

## Configuration effect

- `postgresql.tuned-8gb.conf` becomes startup-production default.
- `POSTGRES_SHM_SIZE=1gb` becomes startup-production default.
- `postgresql.tuned-4gb.conf` is retained as an explicit fallback.
- `postgresql.tuned-2gb.conf` remains low-resource/rehearsal only.
- No automatic memory-size detection or profile switching is introduced.
- Existing durability, SCRAM, data-checksum, private-PostgreSQL, and explicit-public-profile safety controls remain unchanged.

## Remaining gates

This decision selects the target profile only. It does not claim VPS provisioning, SSH hardening, Docker installation, live PostgreSQL validation, TLS issuance, public ingress, production credential activation, or Product pilot completion. Those remain Evidence-gated deployment steps.
