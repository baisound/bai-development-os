# BAI Development OS — Current State

## Snapshot

- Product: `BAI Development OS`
- Canonical Product Root: `/home/baisound/bai-development-os`
- Reference Consumer: `/home/baisound/projects/javascript-roulette`
- Current Architecture Canonical: `BAI Development OS Architecture Ver.2.28`
- Current Lifecycle Canonical: `TASK-004 Lifecycle Foundation Ver.1.6`
- Current Knowledge Canonical: `TASK-005 Knowledge Operating System Ver.1.2`
- Current Automation Canonical: `TASK-006 Orchestration & Automation Foundation Ver.1.0`
- Current Monitoring Canonical: `TASK-007 Monitoring & Dashboard Ver.1.0`
- Current Integration Canonical: `TASK-008 External Integration Ver.1.0`
- Current Security Canonical: `TASK-009 Security / Supply Chain / Integrity Ver.1.0`
- Current Release Canonical: `TASK-010 Release / Distribution / Consumer Upgrade OS Ver.1.0`
- Current Conformance Canonical: `TASK-011 Multi-Project Conformance & Compatibility Lab Ver.1.0`
- Current Maintenance Canonical: `TASK-012 Self-Maintenance / Drift Detection / Safe Auto-Repair Ver.1.0`
- Current Extension Canonical: `TASK-013 Domain Adapter / Plugin SDK Ver.1.0`
- Current Calibration Canonical: `TASK-014 Adaptive Governance Calibration & Policy Learning Ver.1.0`
- Current Distributed Canonical: `TASK-015 Distributed Orchestration & Event Fabric Ver.1.0`
- TASK-004〜015: `COMPLETED`
- TASK-016: `ACTIVE / PHASE0_COMPLETED / PHASE1+ NOT_AUTHORIZED`
- TASK-017: `ACTIVE / PHASE0_GITHUB_LIVE_GATE_IMPLEMENTED / ABLENET_L3_8GB_VPS_HOST_BUILD_IN_PROGRESS / REMOTE_LIVE_RUN_AND_PRODUCTION_PILOT_PENDING` — paid/public production activation remains separately gated
- Current development route: `TASK-017 Phase 0 — live PostgreSQL/Docker rehearsal, then separately authorized production endpoint + BAI VIDEO PRODUCTION TASK-036 pilot`
- Permanent model-routing vendor policy: unchanged
- Last Updated: `2026-08-12`

## Current Product Boundary

BAI Development OS is standalone. Consumer projects do not host OS Core. Registry/index/dashboard/preview/distributed transport state is derived or coordination state and never replaces Canonical Product, Lifecycle, Knowledge, Security, Release, Conformance, Maintenance, Calibration or Owner authority.

## Current DistributedOS Baseline

TASK-015 is `COMPLETED`. `DistributedOS` is an optional coordination layer: versioned Event Envelopes, at-least-once durable delivery, consumer-idempotent effects, worker capability/attestation, exact-scope lease/epoch/fencing, remote request/result binding, stale-result quarantine, retry/DLQ/replay, Saga compensation, distributed metric/SLO aggregation, partition fail-closed behavior, quota/backpressure, staged canary/soak/rollback, policy-divergence detection, distributed Calibration Evidence and tamper-evident local checkpoint receipts. Distributed mode is disabled by default.

## Verification

- TASK-015 Distributed suite: `73 / 73 PASS`
- Full BAI Development OS: `1287 / 1287 PASS` (latest ABLENET L3 / 8 GiB startup-profile baseline; GitHub Live Gate + PostgreSQL tuning contracts included)
- JavaScript Roulette Consumer: `10 / 10 PASS`
- Distributed Conformance: `10 schemas / 13 shared contracts PASS`
- Extension / Calibration / Maintenance / Conformance / Release / Security Conformance: `PASS`
- Product Boundary: `PASS`
- Roadmap Consolidation: `56 / 56 PASS` after CREATIVE OS Knowledge Audit refinement synchronization
- Root `DistributedOS` export: `PASS`
- TASK-016 Phase 0 Knowledge Evolution focused suite: `50 / 50 PASS`
- TASK-017 Phase 0 Knowledge Hub focused suite: `47 / 47 PASS`; Knowledge Evolution / Product Integration focused suite remains green
- Root `KnowledgeEvolutionOS` export: `PASS`
- Product-owned Python reference compile + local Mock Hub smoke: `PASS`
- Blocking Critic findings: `0`
- Document Registry: `576 documents / Missing 0 / Hash-Size mismatch 0`
- Detailed Design DOCX visual QA: `9 / 9 PASS`
- Architecture Ver.2.28 DOCX visual QA: `153 / 153 PASS` (86 inherited pages pixel-identical to Ver.2.27; 67 changed/reflowed/new pages individually reviewed)

## Accepted Residual

Production-specific remote broker implementations, real remote workers/labs, multi-region deployment, cloud provisioning and vendor-specific distributed adapters remain Extension/Integration deployments behind completed TASK-015 contracts. The explicit Owner decision now creates TASK-016 only for reusable resilience/recovery/scalability certification; provider deployment does not move into Core. TASK-016 Phase 0 is Owner-authorized; TASK-016 Phase 1+ remains unauthorized.


## TASK-016 Phase 0 Closure Baseline

TASK-016 Phase 0 is `COMPLETED`. RC2 froze canonical Consumer Evidence Event/Batch/Receipt/Client Policy v1, closed Event Catalog, Privacy/Forbidden Fields, Object Storage Artifact Profile, Product-owned Python integration technology and immutable Git Repository Snapshot Reference. BAI VIDEO PRODUCTION GitHub commit/tree provenance was validated with `KEY_FILES_ONLY` content coverage and derived sanitized Evidence/Candidates; no raw Product repository or credential was committed.

Phase 0 Judge: `PHASE0_COMPLETED / NEXT_ROUTE_ELIGIBLE`. Production Hub infrastructure is not a Phase 0 blocker and moves to TASK-017 Phase 0/deployment scope. TASK-016 Phase 1+ remains unauthorized until the Hub/client pilot produces resilience targets/evidence.


## TASK-017 Phase 0 Compose / PostgreSQL Tuning Baseline

TASK-017 Phase 0 is `ACTIVE`. Local Hub Foundation and the subsequent non-production Deployment Readiness slice are accepted. The current implementation adds one-VPS Docker Compose packaging, PostgreSQL runtime/migrations, server-side hashed API-key credential lifecycle, `/healthz`/`/readyz`, explicit-public-profile Caddy TLS template, backup and rehearsal-only restore controls while preserving Common Ingestion/idempotency/Receipt/Policy/backfill/Candidate boundaries.

Public HTTP Clients still cannot self-assign Trust or backfill provenance. A self-cleaning one-command live rehearsal harness is implemented and accepted for environment handoff. ABLENET L3 / 8 GiB VPS is now provisioned and the Ubuntu 24.04 host baseline is being configured. Live Knowledge Hub Docker/PostgreSQL rehearsal, public TLS/API activation, real production Product credential and real-user Evidence collection are not yet claimed; those remain separate environment/deployment/security and Product-pilot gates.

Presigned Object Storage fallback is now implemented in the Product-owned Python reference. It uses the canonical Batch artifact, requires HTTPS outside loopback tests, rejects redirects/credential-bearing upload headers, and keeps Local Outbox Events until a valid Hub Delivery Receipt acknowledges them.


Pre-Live hardening additionally uses split PostgreSQL fields instead of Compose-side password-in-URL interpolation, pins the direct deployment `pg` version, and can emit sanitized machine-readable live-rehearsal Evidence only after successful teardown. The PostgreSQL deployment baseline now selects the Owner-chosen ABLENET L3 / 8 GiB profile as the startup-production default; the 4 GiB profile is retained as an explicit fallback and the 2 GiB profile remains low-resource only. Exact PostgreSQL 16.14 selection, SCRAM + data-checksum initialization, active tuning verification, and safe local start/stop/environment bootstrap remain in force. Full dependency lock, remote GitHub-hosted live-gate Evidence, and VPS live Docker/PostgreSQL rehearsal remain pending. The operator runbook is `deploy/knowledge-hub/ABLENET_VPS_BUILD_RUNBOOK_Ver4.1.md` and fixes the host timezone at `Asia/Tokyo` while retaining UTC RTC.


## TASK-017 GitHub Actions Live Gate — 2026-08-11

- State: `IMPLEMENTED / REMOTE_EXECUTION_PENDING`.
- Purpose: run the exact disposable Knowledge Hub Docker/PostgreSQL rehearsal on GitHub-hosted Ubuntu when local Docker is unavailable.
- Security: `contents: read`, no `pull_request_target`, no public Compose profile; external fork PRs receive static checks only.
- Evidence: sanitized `live-rehearsal.json`, commit-bound `ci-live-gate.json`, and generated runtime `package-lock.json` candidate.
- Remaining: execute the remote gate, review/commit the accepted runtime lock, then proceed to separately authorized Production/Pilot gates.
