# Consumer Evidence Roadmap Three-Role Revalidation — 2026-08-11

Status: `DESIGN_REVALIDATION_RECORD / NOT_IMPLEMENTATION_AUTHORIZATION`

## Role 1 — Platform Architect

Finding: production Knowledge Hub implementation should not be moved into TASK-016 merely to accelerate Product delivery. That would blur resilience-certification authority with Evidence-service ownership. The clean route is to let TASK-016 Phase 0 define source-neutral contracts and Pattern C, then explicitly interleave a bounded TASK-017 Phase 0 Pilot Transport Slice, then return to TASK-016 for certification.

Decision: `ACCEPT INTERLEAVING / REJECT HUB-IN-TASK016`.

## Role 2 — Product Delivery Lead

Finding: waiting for all TASK-016 resilience phases before runtime Evidence transport risks distributing BAI VIDEO PRODUCT packages before a compatible Hub/API/Client path exists. Product Runtime Independence, reference client/generator, Mock Hub and Public API contracts must therefore be available early. The actual Pilot Hub must follow immediately after the contract foundation.

Decision: `REQUIRE EARLY TASK017 PHASE0 PILOT`.

## Role 3 — Security / Cost / Open-Source Critic

Finding: distributed client source must be assumed public. A fixed shared client key or hidden endpoint cannot be a security boundary. Raw credentials must be externalized behind a Product/platform CredentialProvider; BAI VIDEO PRODUCT selects Microsoft Password Manager. Server-side auth/rate/schema/privacy/idempotency/abuse controls are mandatory. Hub failure or missing credentials must never block primary Product function. Infrastructure remains one VPS/PostgreSQL/Docker Compose under 3,000 JPY/month.

Decision: `ACCEPT WITH SECURITY/COST FLOORS`.

## Consensus Roadmap

```text
TASK-016 Phase 0 — Contract & Pattern C Capture
 -> TASK-017 Phase 0 — Hub/Client Pilot Transport
 -> TASK-016 Phase 1+ — Resilience Certification using real Pilot path
 -> TASK-017 Phase 1+ — Advanced Knowledge Evolution
 -> TASK-017 Late — Pattern B Direct Local Adapter
```

## Authority

This review validates the planning sequence only. It does not authorize implementation, change Architecture Ver.2.28 canonical status, or create TASK-018.
