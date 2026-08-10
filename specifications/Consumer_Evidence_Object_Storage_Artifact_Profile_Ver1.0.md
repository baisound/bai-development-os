# Consumer Evidence Object Storage Artifact Profile Ver.1.0

Status: `TASK-016 PHASE0 RC2 CANONICAL TRANSPORT PROFILE`

Object Storage is temporary/fallback transport, not Knowledge authority and not a second Evidence schema.

## Artifact

- body: canonical Consumer Evidence Batch Ver.1.0 JSON
- encoding: UTF-8
- content type: `application/json`
- canonical compression: `none`
- required: `content_sha256`
- hash input: canonical JSON with `content_sha256` omitted

## Key

`consumer-evidence/v1/<product-id>/YYYY/MM/DD/<installation-id>/<batch-id>.json`

The path is provider-neutral. `v1` is the contract major version.

## Retry / integrity

- same key + same hash = idempotent retry
- same key + different hash = `INTEGRITY_CONFLICT`
- incomplete multipart/failed PUT is not a completed artifact
- Event IDs are never regenerated for retry/backfill

## Credentials

Artifact body/metadata defined by this profile contains no credential. Presigned/short-lived upload capability is preferred. Any direct Product credential remains outside canonical Evidence and must be scoped/rotatable/fail-isolated.

## Lifecycle

Delete an artifact only after every Event is acknowledged by Hub as accepted/already-seen, or after an explicit retention/loss decision. Partial reject keeps the source artifact or equivalent quarantined evidence until resolved.

## Receipt-bound deletion safety

Before deletion, the Receipt itself is validated. `batch_id` must match the stored Batch, every acknowledged/rejected `event_id` must belong to that Batch, and Event outcome sets must not overlap. Unknown/mismatched Receipt data is not evidence of successful delivery.
