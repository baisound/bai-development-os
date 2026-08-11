# BAI Development OS — Consumer Knowledge Evolution Roadmap Refinement Ver.1.2

Status: `OWNER_DIRECTED_ROADMAP_SUPPLEMENT / RC2_ACTIVE / ARCHITECTURE_VER2.28_UNCHANGED`
Date: `2026-08-11`
Supersedes planning supplement: `Ver.1.1`
Canonical Architecture remains: `BAI Development OS Architecture Ver.2.28 CURRENT_CANONICAL`
Package remains: `1.0.0`

## 1. Trigger

BAI VIDEO PRODUCTION returned a Product Owner design response for limited-demo Evidence collection. The Product requires Evidence Capture before its limited demo, permits a temporary Object Storage transport while the production Hub is unavailable, and keeps production Knowledge Hub connectivity as the final completion condition.

This refinement accepts the Product response without changing the fundamental `Pattern C -> Pattern A -> Pattern B` source priority or the BAI Development OS / standalone Consumer runtime boundary.

## 2. Decisions Accepted from BAI VIDEO PRODUCTION

1. Product-side `TASK-036 — Consumer Evidence Capture & Knowledge Hub Bridge` is the proposed bounded Product task, subject to Product repository collision check at formal kickoff.
2. Demo Evidence Capture is a Product hard gate before limited-user demo start.
3. Local Outbox plus temporary S3-compatible/Object-Storage delivery is allowed before the production Hub is ready.
4. Object Storage is a `Transport / Buffer`, never Canonical Knowledge authority and never the final Product completion condition.
5. Object Storage SHALL store the same Canonical Consumer Evidence Batch later submitted to `POST /v1/evidence/batch`; no Object-Storage-specific Evidence schema is created.
6. Backfill preserves original `event_id`; Hub idempotency remains authoritative for duplicate delivery effects.
7. P0/P1 are the initial runtime pilot privacy levels; P2 requires explicit consent; P3 is rejected in v1.
8. Initial Product pilot catalog is limited to `subtitle_import`, `long_running_job_result`, and `subtitle_review_summary`.
9. Product primary functions remain fail-isolated from Hub/Object Storage/Credential failures.
10. Long-lived Object Storage secrets are not embedded in source/config/build artifacts; presigned upload is preferred.

## 3. Canonical Consumer Evidence RC2 Contract Freeze

TASK-016 Phase 0 RC2 owns the following pre-production contract freeze:

- Canonical Consumer Evidence Event Schema Ver.1.0,
- Canonical Consumer Evidence Batch Schema Ver.1.0,
- Delivery Receipt Schema Ver.1.0,
- Client Policy Schema Ver.1.0,
- Event Catalog Ver.1.0,
- Privacy and Forbidden Fields Ver.1.0,
- Object Storage Artifact Profile Ver.1.0,
- Versioning and Migration Policy Ver.1.0,
- positive/duplicate/partial-reject/privacy-reject/schema-reject fixtures,
- Product implementation guide/reference technology.

Compatibility aliases MAY remain for RC1 callers but SHALL resolve into the canonical v1 Event/Batch model rather than becoming a second logical contract.

## 4. Transport-Neutral Runtime Architecture

```text
Product Domain / UI
       |
       v
EvidenceRecorder
       |
       +--> Consent / Sanitizer / Aggregator
       |
       +--> LocalOutbox
                 |
                 +--> ObjectStorageEvidenceSink  (temporary/fallback)
                 |
                 +--> KnowledgeHubEvidenceSink   (final primary)
```

Both sinks consume the same canonical Batch Artifact.

## 5. Object Storage Profile Boundary

Object Storage is provider-neutral transport. Canonical Evidence contracts SHALL NOT include S3 bucket APIs, AWS credentials, provider SDK types or provider-specific authorization semantics.

v1 Artifact rules:

- UTF-8 JSON; `Content-Type: application/json`.
- no compression in canonical v1 artifacts; transport compression may be added only by a future compatible profile revision.
- deterministic object key: `consumer-evidence/v1/<product-id>/YYYY/MM/DD/<installation-id>/<batch-id>.json`.
- `content_sha256` is SHA-256 of canonical JSON with `content_sha256` omitted.
- same `batch_id` + same hash is safe retry; same `batch_id` + different hash is integrity conflict.
- an object is complete only after successful whole-object PUT/commit; incomplete multipart/upload state is not a valid artifact.
- credential material is never stored in the artifact.
- object deletion requires complete Hub acknowledgement (accepted or duplicate for all Events) or an explicit retention/loss decision.

## 6. Product Demo Schedule as Dependency Target

The Product proposed the following target gates. These are coordination targets, not guarantees of external infrastructure availability.

| Target | Coordination gate |
|---|---|
| 2026-08-12 | Canonical Evidence/Object Storage contract freeze |
| 2026-08-13〜16 | Product TASK-036 Slice A-C implementation/E2E |
| 2026-08-17+ | Limited demo may begin after Product `DEMO EVIDENCE READY` gate |
| 2026-08-18〜24 | Observe pilot Evidence quality and privacy |
| 2026-08-25〜28 | Hub connector/backfill rehearsal against Mock/local Hub |
| 2026-08-29〜31 | Production Hub connection target if infrastructure is ready |
| 2026-09-10 | Product major completion target: production Hub + Receipt + backfill |

If production infrastructure is not ready by a target date, Object Storage MAY continue as temporary transport; Product completion MUST remain open until the Hub final gate is satisfied.

## 7. Revised Execution Sequence

```text
NOW
 |
 |-- TASK-016 Phase 0 RC2 — Canonical Runtime Evidence Contract + Transport Profile
 |     contract freeze / Product feedback adjudication
 |     Object Storage Artifact Profile
 |     fixtures / migration / implementation guide
 |     current BAI VIDEO PRODUCTION GitHub snapshot validation
 |
 |-- Product TASK-036 Slice A-C (Consumer-owned; coordinated, not OS-owned)
 |     DEMO EVIDENCE READY hard gate
 |
 |-- TASK-017 Phase 0 — Pilot Transport / Hub MVP
 |     Common Ingestion / PostgreSQL / API / Receipt / Idempotency
 |     Object-Storage backfill path
 |
 |-- Product TASK-036 Slice D-E
 |     Hub primary / backfill / Object Storage sunset-to-fallback
 |
 |-- TASK-016 Phase 1+ — Resilience Certification
 |     certify real Hub/client/outbox/backfill/credential behavior
 |
 |-- TASK-017 Phase 1+ — Advanced Knowledge Evolution
 |
 |-- TASK-017 Late — Pattern B
 |
 v
POST-017 EVIDENCE-DRIVEN ROADMAP DECISION GATE
```

## 8. TASK Ownership Remains Separate

- TASK-016 RC2 owns reusable contracts, test technology and pre-production verification only.
- Product TASK-036 owns BAI VIDEO PRODUCTION code/UI/Windows Credential provider/Object Storage sink implementation.
- TASK-017 Phase 0 owns production Hub application/persistence/transport and backfill ingestion.
- TASK-016 Phase 1+ later certifies resilience; it does not become Hub provisioning authority.

## 9. Completion / Authorization

This supplement authorizes TASK-016 Phase 0 RC2 implementation only by the Owner instruction of 2026-08-11. It does not itself authorize production VPS purchase/provisioning, public endpoint activation, or TASK-016 Phase 1+.

No TASK-018 is created.
