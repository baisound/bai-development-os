# TASK-017 — Knowledge Evolution & Federated Evidence Governance OS

Status: `ACTIVE / PHASE0_GITHUB_LIVE_GATE_IMPLEMENTED / ABLENET_VPS_HOST_BUILD_IN_PROGRESS / REMOTE_LIVE_AND_PRODUCTION_PILOT_PENDING`
Roadmap Position: `PHASE 0 REPRIORITIZED AFTER TASK-016 PHASE 0; PHASE 1+ AFTER TASK-016 RESILIENCE EVIDENCE`
Development Profile: `DEV_4_FOUNDATION_CRITICAL` (expected; must be re-evaluated at design gate)
Parent Scope: Architecture Ver.2.28 Part XV, Post-CREATIVE-OS Knowledge Audit Roadmap Refinement Ver.1.0, and Consumer Knowledge Evolution Roadmap Refinement Ver.1.2.

Objective: extend completed KnowledgeOS into evidence-driven cross-project/runtime Knowledge evolution with explicit rejected patterns, decomposable quality Evidence, reproducibility, hard Safety/Security/Rights/Privacy gates, signed/versioned distribution/rollback and privacy-minimized federated Evidence without autonomous promotion authority.

## Partial Owner reprioritization

A bounded `Phase 0 — Consumer Evidence Hub Pilot Transport Slice` is planned immediately after TASK-016 Phase 0 so BAI VIDEO PRODUCT can distribute standalone packages and begin collecting privacy-minimized runtime Evidence before the full TASK-016 resilience program completes.

The remaining advanced TASK-017 scope stays after TASK-016 resilience evidence.

## Hub v1

- PostgreSQL.
- One VPS + Docker Compose.
- <= 3,000 JPY/month.
- Open-source/source-visible client threat model.
- External Product credential via generic `CredentialProvider`; BAI VIDEO PRODUCT selects Microsoft Password Manager.
- Product-owned generated client; zero BAI Development OS runtime dependency.
- Hub failure never blocks Product primary function.
- Canonical Knowledge authority remains the BAI Development OS canonical Git repository/main; repository visibility does not change Knowledge authority.

Read first: `tasks/TASK-017/knowledge-evolution-detailed-roadmap.md`, then `tasks/TASK-017/phase0-consumer-evidence-hub-pilot-detailed-design.md` for the early slice.
VPS operator runbook: `deploy/knowledge-hub/ABLENET_VPS_BUILD_RUNBOOK_Ver4.1.md`.

Implementation authorization: `TASK-017 PHASE 0 LOCAL + NON-PRODUCTION DEPLOYMENT READINESS — OWNER AUTHORIZED 2026-08-11`. Production VPS/DNS/TLS/real credential activation remains `NOT_AUTHORIZED`.
