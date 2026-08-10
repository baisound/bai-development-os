# Consumer Evidence Product Implementation Guide Ver.1.0

Status: `TASK-016 PHASE0 RC2 TECHNICAL PROVISION`

1. Generate/own Events inside the Consumer repository. Never import BAI Development OS at Product runtime.
2. Apply local Consent -> Event Catalog -> Privacy sanitizer before enqueue.
3. Store stable Event IDs in Local Outbox.
4. Build canonical Batch with Product/install identity and stable events.
5. Primary future sink is Knowledge Hub. Temporary Object Storage sink stores the same Batch artifact unchanged.
6. Prefer presigned upload; do not embed long-lived storage secret.
7. Treat 401/403/429/5xx/network failure as Evidence-delivery degradation only.
8. On Hub Receipt, delete only accepted/already-seen Events from Local Outbox.
9. Rejected Events are quarantined/handled individually; do not drop the entire successful portion.
10. Backfill from Object Storage preserves Event IDs and Batch payload; Hub idempotency handles duplicates.

BAI VIDEO PRODUCTION initial event features: `subtitle_import`, `long_running_job_result`, `subtitle_review_summary`.

## Receipt and policy fail-closed rules

- validate `receipt_version`, `batch_id`, Event membership and mutually exclusive Event outcomes before acknowledging Local Outbox entries,
- never acknowledge an Event ID that was not present in the submitted Batch,
- reject Event Catalog version mismatch instead of silently adopting the remote catalog,
- validate provider-neutral Object Storage key segments before constructing a key,
- require exactly one of Event `feature` / `operation`.
