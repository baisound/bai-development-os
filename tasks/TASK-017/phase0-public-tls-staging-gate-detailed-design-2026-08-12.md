# TASK-017 Phase 0 — Public TLS Staging Gate Detailed Design

Status: `IMPLEMENTED / VPS EXECUTION PENDING`
Date: `2026-08-12`
Parent: `TASK-017 Phase 0 — Consumer Evidence Hub Pilot Transport Slice`

## 1. Purpose

Convert the merged Public IP TLS/Caddy repository contract into one reproducible VPS staging gate. The gate proves a real Let's Encrypt staging certificate, matching SAN, HTTPS reverse proxy, HTTP-to-HTTPS redirect and exact public/private port boundary without authorizing Production ACME or persistent public activation.

## 2. Authority boundary

The Owner requested continued detailed design and development. That authorizes repository implementation, static validation and tests. It does not by itself authorize firewall mutation, real public profile execution, Production certificate issuance, production credentials or real Product traffic.

VPS execution requires the exact runtime acknowledgement:

```text
BAI_PUBLIC_TLS_ACK=STAGING_PUBLIC_TLS_REHEARSAL
```

Production ACME remains rejected by code and Evidence validation.

## 3. Preconditions

- Canonical main containing PR #11 is deployed to `/opt/bai-development-os`.
- Existing `/etc/bai-knowledge-hub/knowledge-hub.env` remains `root:root 0600` and is not regenerated.
- `HUB_DOMAIN` is the reviewed public IP address or hostname and is not a placeholder.
- `BAI_KNOWLEDGE_HUB_ACME_CA_DIRECTORY` is exactly Let's Encrypt staging.
- PostgreSQL/API private gates and runtime-role gate still pass.
- TCP 80/443 reachability is separately approved and prepared by the operator.
- UDP 443 remains closed/unadopted.
- A root-only Evidence output directory already exists.

## 4. Fail-closed activation sequence

1. Require Docker, Compose, curl, OpenSSL, Node, `ss` and hashing tools.
2. Require the exact acknowledgement and exact staging ACME URL both in process environment and host env file.
3. Refuse placeholder or unsafe host identifiers and refuse overwriting an Evidence file.
4. Render Compose and run the canonical deployment-readiness checker.
5. Refuse execution if TCP 80/443 is already occupied or UDP 443 already listens.
6. Start only the existing `caddy` public-profile service and its declared dependencies.
7. Wait for `https://<host>/readyz` through the reverse proxy.
8. Verify HTTP redirects to the exact HTTPS URL.
9. Capture the live peer certificate and verify matching IP/DNS SAN, recognizable Let's Encrypt staging issuer, digest and validity.
10. Verify TCP 80/443 and reject UDP 443, public 8787, 5432 or 2019.
11. Stop Caddy and prove TCP 80/443 no longer listen.
12. Validate and atomically publish sanitized machine Evidence.

Any failure triggers best-effort Caddy stop and temporary-file removal. The harness never calls UFW, never removes volumes and never changes the host env file.

## 5. Evidence contract

`knowledge-hub-public-tls-staging-evidence.schema.json` is closed (`additionalProperties: false`) and records only:

- target host and exact staging directory,
- certificate SHA-256, SAN/issuer verification and validity,
- HTTPS readiness and redirect verification,
- exact allowed/forbidden port result,
- explicit acknowledgement, Production-ACME=false and post-run deactivation,
- completion timestamp.

It contains no database password, API key, certificate private key, raw certificate, backup, Product payload or Caddy log.

## 6. Exit and non-exit

`PUBLIC_TLS_STAGING_REHEARSAL_PASS` is valid only when the validator accepts the atomic Evidence file. It can satisfy the environment-dependent staging portion of the Public Security Gate.

It does not authorize or prove:

- Production ACME selection,
- persistent public Caddy startup,
- production credential issuance,
- real Product Evidence collection,
- Offsite Backup/Restore Gate,
- TASK-017 Phase 0 closure.

## 7. Next route after real PASS

```text
Staging Evidence review
→ Production Certificate Gate detailed decision
→ explicit Owner approval
→ bounded Production activation
→ Offsite Backup/Restore Gate
→ BAI VIDEO PRODUCTION TASK-036 pilot
→ TASK-017 Phase 0 closure review
```
