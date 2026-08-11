# TASK-017 Phase 0 — Consumer Evidence Hub Pilot Transport Slice Detailed Design Ver.1.3

Status: `ACTIVE / DEPLOYMENT_READINESS_IMPLEMENTED / LIVE_POSTGRES_AND_PRODUCT_PILOT_PENDING`
Parent Task: `TASK-017 — Knowledge Evolution & Federated Evidence Governance OS`
Entry: TASK-016 Phase 0 contract/capture foundation complete and approved for next route.
Exit: a bounded BAI VIDEO PRODUCT pilot has produced real operational Evidence suitable for Candidate review and TASK-016 resilience certification. Local Hub Foundation is an earlier internal gate and does not claim Pilot exit.

## 1. Why This Slice Moves Early

The complete TASK-017 knowledge-evolution program still benefits from TASK-016 certification, but the Product distribution timeline requires a working runtime Evidence transport earlier. This slice implements only the transport/ingestion/pilot foundation; advanced promotion/distribution/federation remains after TASK-016 Phase 1+.

## 2. Ownership

TASK-017 Phase 0 owns:

- Common Ingestion Core MVP,
- Hub v1 deployment/application,
- PostgreSQL persistence,
- Public Ingestion API / Delivery Receipt / backfill,
- server auth/rate/idempotency/privacy/retention,
- Consumer Evidence Integration Kit reference/generator,
- limited BAI VIDEO PRODUCT pilot,
- aggregate/candidate handoff.

It does not own TASK-016 certification or Product domain implementation.

## 3. Work Breakdown

### 17.0.1 Common Ingestion Core MVP

Source-neutral validation and audit pipeline accepting Pattern A runtime Evidence and Pattern C packages through compatible contracts.


## 3.1 Authorized Local Hub Foundation gate

The 2026-08-11 Owner continuation authorizes implementation through a local, deterministic Hub foundation only. The local gate SHALL provide:

- one Common Ingestion path for direct HTTPS-equivalent submission and Object Storage backfill,
- server-derived `AuthContext` with `subject_id`, bound `product_id`, scopes and Trust Level; Client payload cannot elevate Trust,
- Event-level idempotency on stable Product/Installation/Event identity with hash-conflict detection,
- Event-level Delivery Receipt including accepted, already-seen and rejected outcomes,
- Client Policy retrieval bound to authenticated Product context,
- bounded per-subject rate limiting,
- retention/pruning primitives,
- PostgreSQL DDL plus an injected-query repository adapter so credentials/driver choice remain deployment concerns,
- an in-memory reference repository for deterministic local tests,
- no automatic Knowledge promotion.

Paid/public deployment, DNS/TLS, production token issuance and real Product user Evidence remain outside this gate.



## 3.2 Deployment Readiness gate

The Owner continuation on 2026-08-11 authorizes a non-production deployment-readiness slice after Local Hub Foundation acceptance. It SHALL provide:

- single-VPS Docker Compose topology with PostgreSQL private to the Compose network,
- explicit `public` reverse-proxy profile so public ports are not activated by ordinary rehearsal,
- production-compatible runtime launcher with injected PostgreSQL driver and automatic immutable migrations,
- server-side high-entropy API key issuance with only derived secret material stored,
- `/healthz` process liveness and `/readyz` dependency readiness separation,
- backup plus fail-safe restore rehearsal scripts,
- no embedded Product/DB credential,
- static/local contract verification when Docker/PostgreSQL are unavailable.

This gate does not authorize VPS purchase, DNS changes, public TLS activation, production credential distribution or real-user Evidence collection. A live PostgreSQL integration rehearsal remains an environment-dependent evidence gate before production activation.

### 17.0.2 Hub MVP

```text
Single VPS
  Docker Compose
    reverse-proxy
    knowledge-api
    postgres
    optional lightweight worker
    backup-job
```

Budget hard ceiling: 3,000 JPY/month.

### 17.0.3 Public Evidence API / Receipt / Backfill

Mandatory: batch submit + Event-level Delivery Receipt + client policy. Feedback may use event batch in pilot. The same canonical Batch stored by the temporary Object Storage profile SHALL be accepted for backfill without changing `event_id`. Accepted or duplicate Events are acknowledgements; rejected Events remain pending/quarantined individually.

### 17.0.4 Security / Delivery

Server-side authentication/authorization, rate limits, payload limit, idempotency, retention, abuse controls and server-derived trust.

### 17.0.5 Integration Kit RC

Python first reference/generator. Generated source is Product-owned and standalone.

### 17.0.6 BAI VIDEO PRODUCT Pilot

Pilot with the initial catalog only: `subtitle_import`, `long_running_job_result`, `subtitle_review_summary`. Product chooses Microsoft Password Manager credential provider through its own implementation boundary. Before Hub production readiness, the Product may use Local Outbox + canonical Object Storage Artifact transport. Object Storage is not a completion condition and becomes fallback after Hub stabilization.

### 17.0.7 Aggregation / Candidate Review

Do not auto-promote. Produce Candidate evidence bundle with version/environment/counterexample data where available.

### 17.0.8 Exit Evidence

Record:

- API success/failure observations,
- outbox/retry behavior,
- credential failure behavior,
- event volume/cost,
- retention size,
- Product runtime independence results,
- first runtime Candidate(s),
- unresolved risks.

## 4. Pilot Stop Conditions

Stop/disable ingestion if:

- secret leakage is observed,
- raw P3 content is unexpectedly accepted,
- server trust can be client-elevated,
- Product primary function depends on Hub availability,
- monthly infrastructure projection breaches 3,000 JPY without Owner approval,
- idempotency fails causing duplicate effects.

## 5. Next Route

After Pilot exit, route to TASK-016 Phase 1+ for resilience/recovery/scalability certification using the real Hub/client path as one certification target. TASK-017 Phase 1+ resumes after the relevant TASK-016 evidence is available.

## 6. Product Coordination Targets

- 2026-08-25〜28: Mock/local Hub contract and backfill rehearsal target.
- 2026-08-29〜31: production endpoint connection target if deployment/security/budget gates pass.
- 2026-09-10: Product-requested final connection milestone (Hub + Receipt + backfill).

If external deployment is not ready, temporary Object Storage may continue without declaring Product TASK-036 complete.
