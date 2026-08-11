# TASK-017 Phase 0 — Consumer Evidence Integration Kit RC Implementation Result

Date: `2026-08-11`
Status: `IMPLEMENTED / LOCAL_CONTRACT_VERIFIED / PRODUCT_INTEGRATION_READY`
Production Hub activation: `NOT_AUTHORIZED`

## Implemented

- Product-owned Python reference now supports provider-neutral Presigned Object Storage upload.
- Upload uses the same canonical Batch/Artifact produced by the TASK-016 RC2 contract; no Object Storage-specific Evidence schema exists.
- No AWS/S3 SDK and no long-lived storage credential is introduced into the generic Product-owned client.
- Production presigned URLs require HTTPS. Plain HTTP is accepted only for explicit loopback tests.
- Redirects are rejected so an opaque signed URL cannot silently forward Evidence to a different destination.
- Credential-bearing `Authorization`/Cookie headers are rejected by the generic presigned uploader.
- Successful Object Storage upload does **not** acknowledge or delete Local Outbox Events. Only a valid Knowledge Hub Delivery Receipt can acknowledge accepted/already-seen Event IDs.
- Stable `event_id`, deterministic `batch_id`, canonical artifact key and `content_sha256` survive the fallback transport path.
- Presign acquisition remains Product/deployment-specific through a callback/provider boundary.

## Product Boundary

The generated/copied Python source remains Consumer-owned and imports no BAI Development OS package at runtime. BAI VIDEO PRODUCTION may bind its own Microsoft Password Manager provider for Hub credentials and its own short-lived presign acquisition path without changing the canonical Evidence contract.

## Verification

Focused Python reference tests include:

- canonical Event/Policy fail-closed behavior,
- Receipt membership/batch binding before Outbox ACK,
- canonical presigned PUT body and digest,
- no storage Authorization header,
- Outbox retention after successful Object Storage upload,
- redirect rejection,
- remote plaintext HTTP rejection,
- credential-bearing header rejection.

Live public Object Storage and production Hub activation remain outside this local RC gate.
