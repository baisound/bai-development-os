# TASK-017 Phase 0 — Consumer Evidence Hub Pilot Transport Slice Detailed Design Ver.1.0

Status: `EARLY_REPRIORITIZED_PLANNING_SLICE / NOT_STARTED / NOT_AUTHORIZED`
Parent Task: `TASK-017 — Knowledge Evolution & Federated Evidence Governance OS`
Entry: TASK-016 Phase 0 contract/capture foundation complete and approved for next route.
Exit: a bounded BAI VIDEO PRODUCT pilot has produced real operational Evidence suitable for Candidate review and TASK-016 resilience certification.

## 1. Why This Slice Moves Early

The complete TASK-017 knowledge-evolution program still benefits from TASK-016 certification, but the Product distribution timeline requires a working runtime Evidence transport earlier. This slice implements only the transport/ingestion/pilot foundation; advanced promotion/distribution/federation remains after TASK-016 Phase 1+.

## 2. Ownership

TASK-017 Phase 0 owns:

- Common Ingestion Core MVP,
- Hub v1 deployment/application,
- PostgreSQL persistence,
- Public Ingestion API,
- server auth/rate/idempotency/privacy/retention,
- Consumer Evidence Integration Kit reference/generator,
- limited BAI VIDEO PRODUCT pilot,
- aggregate/candidate handoff.

It does not own TASK-016 certification or Product domain implementation.

## 3. Work Breakdown

### 17.0.1 Common Ingestion Core MVP

Source-neutral validation and audit pipeline accepting Pattern A runtime Evidence and Pattern C packages through compatible contracts.

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

### 17.0.3 Public Evidence API

Mandatory: batch submit + client policy. Feedback may use event batch in pilot.

### 17.0.4 Security / Delivery

Server-side authentication/authorization, rate limits, payload limit, idempotency, retention, abuse controls and server-derived trust.

### 17.0.5 Integration Kit RC

Python first reference/generator. Generated source is Product-owned and standalone.

### 17.0.6 BAI VIDEO PRODUCT Pilot

Pilot with a small event set only. Product chooses Microsoft Password Manager credential provider through its own implementation boundary.

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
