# TASK-016 Phase 0 — Consumer Knowledge Capture & Contract Foundation Detailed Design Ver.1.1

Status: `PLANNING_FAST_TRACK / OWNER_REPRIORITIZED_SEQUENCE / NOT_STARTED / NOT_AUTHORIZED`
Parent Task: `TASK-016 — Resilience, Recovery & Scalability Certification OS`
Priority: `FIRST SLICE WHEN TASK-016 IS AUTHORIZED`
First Consumer validation: `BAI VIDEO PRODUCT / BAI VIDEO PRODUCTION`
Next planned route after Phase 0: `TASK-017 Phase 0 — Consumer Evidence Hub Pilot Transport Slice`

## 1. Objective

Create the cloud-independent contracts and immediate Pattern C intake needed to stop current development-knowledge loss, while also defining the Consumer-facing runtime Evidence contract early enough for a standalone Product distribution pilot.

Phase 0 deliberately stops before production Hub deployment. It creates the stable contracts that TASK-017 Phase 0 implements.

## 2. Non-Goals

Phase 0 does not:

- deploy/operate the production Knowledge Hub,
- implement a Product-specific final Microsoft credential API,
- make BAI Development OS a Product runtime dependency,
- implement Pattern B direct local automation,
- promote runtime telemetry directly to Canonical Knowledge,
- collect raw video/audio/subtitle/prompt/user content by default,
- replace TASK-016 resilience certification work.

## 3. Work Breakdown

### 16.0.1 Evidence / Candidate / Snapshot Contract

Maintain source-neutral machine contracts for:

- Knowledge Evidence,
- Knowledge Candidate,
- Snapshot Manifest.

Runtime Evidence envelopes SHALL be mappable to the same Knowledge Evidence lineage rather than creating a second knowledge engine.

### 16.0.2 Pattern C ZIP Intake

Accepted input:

- preferred ZIP with `snapshot-manifest.json`,
- fallback normal ZIP with provenance recovery.

Provenance completeness:

- `COMPLETE`
- `PARTIAL`
- `UNVERIFIED`

Unknown values are never guessed.

### 16.0.3 Product Runtime Independence Contract

MUST prove:

- Product build/runtime does not require BAI Development OS repository/package,
- `.bai-os` is development metadata only,
- Product's primary function works if Hub is offline,
- Evidence delivery can be disabled/unconfigured,
- generated Evidence Client is Product-owned code.

### 16.0.4 Consumer Evidence Integration Kit Contract

Required planning surfaces:

```text
consumer-evidence-kit/
  specifications/
    public-ingestion-api.md
    consumer-runtime-independence.md
    privacy-consent-trust.md
  schemas/
    consumer-evidence-envelope.schema.json
    consumer-evidence-batch.schema.json
    client-policy.schema.json
    delivery-receipt.schema.json
  reference/
    python/
      client.py
      sanitizer.py
      aggregator.py
      outbox.py
      credential_provider.py
      policy.py
  generator/
    templates/
  mock-hub/
  contract-tests/
```

Reference code is technical provision; generated/copied output belongs to the Consumer and SHALL NOT import BAI Development OS at runtime.

### 16.0.5 Public API / Privacy / Trust / Credential Contract

MVP API semantics:

- `POST /v1/evidence/batch`
- `GET /v1/client-policy`

Credential rules:

- raw API key is external to app source/config/build artifact,
- Product exposes a settings entry point,
- common Core contract is `CredentialProvider`,
- BAI VIDEO PRODUCT provider = Microsoft Password Manager selection by Owner,
- exact Windows/Microsoft API remains Product implementation detail,
- secret never enters logs, exceptions, Evidence or ordinary config.

Privacy rules:

- P0/P1 may be pilot eligible under Product/user policy,
- P2 requires explicit contextual consent,
- P3 raw user content is rejected/not accepted by Hub v1 by default,
- effective send policy is intersection of local privacy cap and server policy.

Trust rules:

- server/review provenance assigns trust,
- Client cannot self-elevate trust,
- `REGISTERED_CLIENT` does not imply canonical truth.

### 16.0.6 Mock Hub / Contract Test Specification

Mock Hub SHALL simulate at minimum:

- 200 accepted batch,
- partial acceptance/rejection,
- schema failure,
- 401/403,
- 429 with Retry-After,
- 5xx,
- timeout,
- duplicate event/idempotency.

Contract tests SHALL verify that Hub failure never blocks Product primary function.

### 16.0.7 First BAI VIDEO PRODUCT Development Intake

Pattern C extracts reusable and rejected knowledge from a current Product+OS snapshot. Initial domains include UI/UX, Windows behavior, long-running jobs, subtitle/media workflows, provider/runtime compatibility, failure/recovery and user-corrected assumptions.

### 16.0.8 Pilot Readiness Handoff / Registry / Regression

Phase 0 output SHALL include:

- validated schema set,
- Product Runtime Independence contract,
- Consumer Evidence Integration Kit planning spec,
- Public Ingestion API planning spec,
- Mock Hub behavior contract,
- first real Pattern C intake Evidence/Candidate package,
- TASK-017 Phase 0 entry criteria,
- Registry/context navigation updates,
- regression/conformance evidence.

## 4. Pattern C Processing State Machine

```text
RECEIVED
 -> INVENTORIED
 -> PROVENANCE_RECOVERED
 -> SANITIZED
 -> EVIDENCE_EXTRACTED
 -> CANDIDATES_GENERATED
 -> CONFLICT_CHECKED
 -> REVIEW_READY
 -> {REJECTED | SUPPORTED | PROMOTION_PROPOSED}
```

Security/privacy boundary failure -> `QUARANTINED`.

## 5. Runtime Evidence Pre-Contract State Machine

Phase 0 defines, but does not production-deploy:

```text
DOMAIN_EVENT
 -> LOCAL_POLICY_CHECK
 -> SANITIZE
 -> AGGREGATE_IF_ALLOWED
 -> ENVELOPE
 -> LOCAL_OUTBOX
 -> CREDENTIAL_RESOLVE
 -> BATCH_SEND
 -> {ACK | RETRY | QUARANTINE | DROP_BY_POLICY}
```

`CREDENTIAL_RESOLVE` failure degrades Evidence delivery only.

## 6. Open-Source Security Floor

Treat all Client code and API schemas as public knowledge. Prohibited:

- embedded shared keys,
- trust based on Product ID alone,
- accepting a client-declared Trust Level,
- relying only on client validation,
- logging/serializing raw credentials.

Server-side controls are part of TASK-017 Phase 0 implementation ownership.

## 7. Knowledge Intake Package

```text
knowledge-intake/
  manifest.json
  evidence/*.json
  candidates/*.json
  reviews/review-summary.md
  proposed-canonical/*.md
  provenance/source-map.json
```

Raw Consumer ZIPs remain transient inputs and are not Canonical Knowledge.

## 8. Phase 0 Exit Criteria

All must be true:

1. Manifest and manifestless Pattern C paths are specified.
2. Evidence/Candidate/Snapshot schemas validate.
3. Product Runtime Independence requirements are explicit and testable.
4. Consumer Evidence Integration Kit contract is complete enough for Product-side implementation planning.
5. API/Privacy/Trust/Credential contracts are explicit without embedding a Product secret.
6. Mock Hub contract covers success/error/retry/idempotency cases.
7. A real BAI VIDEO PRODUCT/PRODUCTION snapshot yields at least one reviewed reusable Candidate.
8. Raw secrets/content are excluded from Canonical Knowledge.
9. TASK-017 Phase 0 has explicit entry/exit criteria.
10. Standard regression/conformance remains green.

## 9. Routing Rule

After this Phase 0 completes, the planned next route is **TASK-017 Phase 0 Pilot Transport Slice**, not TASK-016 Phase 1. TASK-016 Phase 1+ resumes after the bounded Hub/client pilot produces a real certification target.

This routing change is planning-only and does not itself authorize either Task.
