# TASK-017 Summary

- Name: `Knowledge Evolution & Federated Evidence Governance OS`
- Status: `ACTIVE / PHASE0_GITHUB_LIVE_GATE_IMPLEMENTED / ABLENET_VPS_HOST_BUILD_IN_PROGRESS / REMOTE_LIVE_RUN_AND_PRODUCTION_PILOT_PENDING`
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
- VPS execution runbook: `deploy/knowledge-hub/ABLENET_VPS_BUILD_RUNBOOK_Ver4.1.md` (ABLENET L3, Ubuntu 24.04 LTS, Asia/Tokyo, Ed25519, UFW, Docker, Private Rehearsal -> gated Public Activation)

## Current Phase 0 implementation state

Deployment Readiness, Integration Kit RC, Pre-Live Hardening, Docker Compose/PostgreSQL tuning, and a GitHub Actions real Docker/PostgreSQL live-gate workflow are accepted locally. The Product-owned Python client now supports short-lived presigned Object Storage fallback without acknowledging Outbox Events. The default Compose profile now uses PostgreSQL 16.14 with the Owner-selected ABLENET L3 / 8 GiB startup-production tuning profile. The 4 GiB profile is retained as an explicit fallback and the 2 GiB profile remains a low-resource development/rehearsal option. VPS provisioning and live active-setting verification remain pending. The GitHub Actions workflow is ready to remove the local-Docker blocker, but its remote run Evidence is still pending. ABLENET VPS host construction is now in progress. Remote GitHub Actions live-run Evidence, accepted runtime dependency lock, non-superuser runtime DB role separation, Let's Encrypt IP-certificate/Caddy integration, VPS Private Live Rehearsal, Public HTTPS activation, Offsite Backup/Restore, and BAI VIDEO PRODUCTION TASK-036 real pilot remain gated before Phase 0 exit.
