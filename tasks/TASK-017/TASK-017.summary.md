# TASK-017 Summary

- Name: `Knowledge Evolution & Federated Evidence Governance OS`
- Status: `ACTIVE / PHASE0_GITHUB_LIVE_GATE_IMPLEMENTED / REMOTE_LIVE_RUN_AND_PRODUCTION_PILOT_PENDING`
- Revised position: **Phase 0 Pilot Transport after TASK-016 Phase 0; advanced Phase 1+ after TASK-016 resilience evidence**
- Source priority: Pattern C first -> Pattern A Hub/runtime Evidence second -> Pattern B late
- Phase 0: Common Ingestion MVP, PostgreSQL single-VPS Hub, Public Evidence API, external credential/auth/rate/idempotency/retention, Consumer Evidence Integration Kit, BAI VIDEO PRODUCT limited pilot
- Product boundary: generated Evidence Client is Product-owned; Product builds/runs without BAI Development OS; Hub unavailable does not block primary function
- Credential: generic `CredentialProvider`; BAI VIDEO PRODUCT uses Microsoft Password Manager; no embedded shared key
- OSS boundary: source/endpoint/schema assumed public; server assigns trust and enforces security
- Advanced scope: quality Evidence, Reproduction Matrix, rejected patterns, conflict/supersession, promotion/demotion/quarantine, signed/versioned distribution/rollback, privacy-minimized federation, domain metric providers
- Hub v1: PostgreSQL, one VPS/Docker Compose, hard ceiling `3,000 JPY/month`
- Canonical authority: BAI Development OS canonical Git repository/main; repository visibility does not change Knowledge authority. Hub/Consumer data remains Evidence/Candidate source only
- Read first: `tasks/TASK-017/knowledge-evolution-detailed-roadmap.md`
- Early slice detail: `tasks/TASK-017/phase0-consumer-evidence-hub-pilot-detailed-design.md`
- Implementation authorization: `PHASE 0 LOCAL + NON-PRODUCTION DEPLOYMENT READINESS — OWNER AUTHORIZED 2026-08-11`; paid/public production activation is separately gated

## Current Phase 0 implementation state

Deployment Readiness, Integration Kit RC, Pre-Live Hardening, Docker Compose/PostgreSQL tuning, and a GitHub Actions real Docker/PostgreSQL live-gate workflow are accepted locally. The Product-owned Python client now supports short-lived presigned Object Storage fallback without acknowledging Outbox Events. The default Compose profile now uses PostgreSQL 16.14 with conservative 2 GiB shared-VPS tuning, with a separate 4 GiB template. The GitHub Actions workflow is ready to remove the local-Docker blocker, but its remote run Evidence is still pending. Production VPS/DNS/TLS/real credential activation and BAI VIDEO PRODUCTION TASK-036 real pilot remain separately gated.
