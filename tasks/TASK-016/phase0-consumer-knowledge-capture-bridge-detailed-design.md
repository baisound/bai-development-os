# TASK-016 Phase 0 — Consumer Knowledge Capture & Canonical Evidence Contract Foundation Detailed Design Ver.1.3

Status: `COMPLETED / RC2_IMPLEMENTED_AND_VERIFIED / NEXT_TASK017_PHASE0_ELIGIBLE`
Parent Task: `TASK-016 — Resilience, Recovery & Scalability Certification OS`
Completed slice: `RC2 — Canonical Consumer Evidence + Object Storage Transport Profile`
First Consumer: `BAI VIDEO PRODUCTION`
Canonical Architecture: `Ver.2.28 CURRENT_CANONICAL` (unchanged)

## 1. Objective

Complete the Phase 0 contract/capture foundation by incorporating the BAI VIDEO PRODUCTION limited-demo requirements into one transport-neutral Consumer Evidence contract. Preserve the already implemented Pattern C and Product Runtime Independence foundation while freezing the v1 runtime Evidence/Event/Batch/Receipt/Policy contracts required by Product TASK-036 and TASK-017 Phase 0.

## 2. Inputs

- RC1 implementation commit: `18d148c22957900db1638cc9db94883ab7ddf434`.
- Product response: `BAI VIDEO_PRODUCTION_デモEvidence収集_規格要求兼Product回答書_Ver1.0_2026-08-11.md` (external input; not copied as canonical Product source).
- Product repository canonical baseline observed at planning time: `baisound/bai_video_production` `main` commit `a098f881b095e3290d2562efe3846d9e2384806a`; recheck before snapshot validation.
- Roadmap supplement: `architecture/BAI_Development_OS_Consumer_Knowledge_Evolution_Roadmap_Refinement_Ver1.2.md`.

## 3. Non-Goals

RC2 does not:

- deploy the production Knowledge Hub,
- provision or purchase VPS/DNS/TLS infrastructure,
- implement BAI VIDEO PRODUCTION Product code or UI,
- choose a concrete Microsoft credential API on behalf of the Product,
- store long-lived S3 secrets in a Consumer,
- create a separate Object Storage Evidence schema,
- promote runtime telemetry automatically to Canonical Knowledge,
- authorize TASK-016 Phase 1+.

## 4. Canonical Contract Set

### 4.1 Event

Canonical file: `schemas/knowledge-evolution/consumer-evidence-event.schema.json`.

Required logical fields:

- `event_id`
- `occurred_at`
- `type`
- `feature` or bounded `operation`
- `result` where meaningful
- `privacy_level`
- optional `duration_ms`, `retry_count`, `error_code`
- bounded `properties` controlled by Event Catalog allowlists

The RC1 `consumer-evidence-envelope.schema.json` becomes a compatibility alias/legacy adapter only; it SHALL NOT define a second v1 logical model.

### 4.2 Batch

Canonical file: `schemas/knowledge-evolution/consumer-evidence-batch.schema.json`.

Required:

- `schema_version = 1.0`
- `batch_id`
- `created_at`
- `product.product_id`
- `product.product_version`
- `installation.installation_id` (pseudonymous/opaque)
- `events[]`

Optional `content_sha256` is allowed for API transport; it is REQUIRED by Object Storage Artifact Profile. Hash input is canonical Batch JSON with `content_sha256` omitted.

### 4.3 Delivery Receipt

Receipt binds `batch_id` and Event-level outcomes. Accepted and duplicate Events are acknowledged. Rejected Events retain machine-readable reason codes. Partial reject is first-class.

### 4.4 Client Policy

Server policy can narrow sampling/features/batch limits/privacy but cannot exceed Product-local consent/privacy cap.

## 5. Event Catalog Ver.1.0

Initial canonical Product pilot entries:

### `feature_result / subtitle_import`

Allowed fields/properties:

- result: `success | failure`
- `duration_ms`
- `retry_count`
- `error_code` when sanitized
- `properties.cue_count`

Forbidden: subtitle body, filename, absolute path.

### `performance / long_running_job_result`

Allowed:

- result: `success | failure`
- `duration_ms`
- `retry_count`
- safe `error_code`
- `properties.chunk_count`
- `properties.resume_used`
- `properties.resumed_chunk_count`

Forbidden: media content, transcript body, source filename/path.

### `correction / subtitle_review_summary`

Allowed:

- result: `completed | aborted`
- `duration_ms`
- `properties.imported_cue_count`
- `edited_cue_count`
- `inserted_cue_count`
- `deleted_cue_count`
- `approved_cue_count`
- `export_success`

Forbidden: pre/post subtitle text and user-entered strings.

Unknown feature/property combinations are rejected/quarantined until cataloged; generic arbitrary JSON is not accepted merely because it is syntactically valid.

## 6. Privacy / Forbidden Fields

Privacy:

- P0 operational/aggregate: pilot eligible subject to Product policy/consent.
- P1 sanitized diagnostic: pilot eligible subject to Product policy/consent.
- P2 explicit contextual/user-approved Evidence only.
- P3 raw user content: rejected in v1.

Hard forbidden runtime Evidence includes raw video/image/audio, subtitle/transcript body, prompt body, user file contents, secrets/tokens/Authorization, email/phone, user-bearing absolute paths, unnecessary local filenames and full crash dumps.

Sanitizer failure is fail-closed for the Event and never blocks primary Product function.

## 7. Object Storage Artifact Profile

Canonical file: `specifications/Consumer_Evidence_Object_Storage_Artifact_Profile_Ver1.0.md`.

Object Storage is a transport profile over the same canonical Batch.

v1:

```text
consumer-evidence/v1/
  <product-id>/
    YYYY/MM/DD/
      <installation-id>/
        <batch-id>.json
```

- UTF-8 JSON, no canonical compression.
- `content_sha256` required and verified.
- same key/hash retry is safe; same key/different hash is `INTEGRITY_CONFLICT`.
- incomplete uploads are never valid artifacts.
- credentials never enter object content or metadata chosen by the Product contract.
- backfill sends the same Batch/Event IDs to Hub.
- delete only after full Event acknowledgement (accepted/duplicate) or explicit retention/loss handling.

## 8. Versioning / Migration

- Contract versions use `major.minor`.
- backward-compatible additive changes require a minor version.
- breaking semantic/required-field changes require a new major.
- object prefix is major-versioned (`v1`).
- historical artifacts are immutable.
- migration creates a derived representation with explicit source version/hash lineage; it never silently rewrites source artifacts or Event IDs.
- Hub may support multiple source versions, but normalization to Candidate Evidence records preserves source version.

## 9. Contract Fixtures

Required executable fixture classes:

1. valid canonical batch,
2. duplicate resend,
3. partial Event reject,
4. privacy reject,
5. schema reject,
6. Object Storage hash/key success,
7. Object Storage hash conflict.

## 10. Product Runtime Independence

Unchanged from RC1:

- Product builds/runs without BAI Development OS repository/package/Registry/TASKs.
- generated/reference Client code becomes Product-owned.
- Hub/Object Storage/Credential failures degrade Evidence delivery only.
- Product Domain does not know S3/Hub/Credential implementation details.

## 11. Credential Boundary

Knowledge Hub: generic `CredentialProvider`; BAI VIDEO PRODUCTION selects Microsoft Password Manager through Product-specific implementation.

Temporary Object Storage priority:

1. presigned upload / short-lived scoped upload capability,
2. only if unavailable for limited demo: external Product CredentialProvider,
3. if direct credential exists, upload-only, prefix-scoped, no read/list/delete, rotatable/short-lived where provider permits.

## 12. Product Demo Coordination Gates

TASK-016 RC2 freezes reusable contracts early. Product dates are targets owned by BAI VIDEO PRODUCTION, not Development OS completion claims.

- `DEMO EVIDENCE READY`: Product validates Windows E2E, Privacy, Outbox, Object Storage transport, retry/idempotency/fail-isolation and standalone runtime.
- `HUB FINAL`: Product validates production `POST /v1/evidence/batch`, Receipt, duplicate idempotency, Event-level partial reject and Local/Object Storage backfill.

## 13. Phase 0 Exit Criteria — RC2

Phase 0 can close only when:

1. RC2 canonical Event/Batch/Receipt/Policy contracts and specs are implemented/tested.
2. no second Object Storage Evidence schema exists.
3. fixtures prove valid/duplicate/partial/privacy/schema/integrity cases.
4. current BAI VIDEO PRODUCTION GitHub tracked snapshot is validated as Product evidence/provenance input to the extent available through the canonical repository source.
5. Pattern C outputs sanitized Evidence/Candidates without committing raw Product archive/credentials.
6. Product runtime independence remains regression-covered.
7. Full OS regression/conformance passes.
8. Critic/Judge record whether remaining production-Hub infrastructure is TASK-017 scope rather than a Phase 0 blocker.

## 14. Next Route

Phase 0 closure decision: `phase0-rc2-judge-review-2026-08-11.md` = `PHASE0_COMPLETED / NEXT_ROUTE_ELIGIBLE`. Next route is `TASK-017 Phase 0 — Consumer Evidence Hub Pilot Transport Slice`. Production VPS activation remains a separate deployment action even when local Hub code is authorized.
