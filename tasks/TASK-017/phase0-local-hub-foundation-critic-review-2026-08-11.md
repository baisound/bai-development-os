# TASK-017 Phase 0 — Local Hub Foundation Critic Review

Date: `2026-08-11`
Decision: `PASS_WITH_PRODUCTION_GATES_REMAINING`
Blocking findings for local foundation: `0`

## Architecture

PASS. Hub reuses TASK-016 canonical Event/Batch/Receipt/Policy contracts. No Object Storage-specific Evidence schema or second Knowledge authority is introduced.

## Product independence

PASS. Hub is server/development infrastructure; Consumer runtime does not import BAI Development OS. Failure of Hub remains an operational side-channel failure.

## Authentication / Trust

PASS for local foundation. AuthContext is server-derived, Product-bound and scoped. A Client cannot submit its own Trust Level. The concrete production authenticator/token lifecycle is intentionally not implemented yet and remains a deployment Security gate.

## Provenance corrective

PASS. During implementation, a draft idea allowing an HTTP Client header to label traffic as `object-storage-backfill` was rejected. Public HTTP submission is recorded as HTTPS. Backfill provenance is set only through trusted internal routing/core invocation.

## Idempotency / partial reject

PASS. Stable identity is `(product_id, installation_id, event_id)`. Identical Event retry is acknowledged as already seen; changed-content identity reuse is rejected. A structurally valid Batch can accept safe Events while rejecting invalid/privacy-breaking siblings.

## Persistence

PASS WITH LIMITATION. PostgreSQL DDL and injected-query adapter are executable/tested as contracts, but no live PostgreSQL process was used. This is sufficient for the authorized local foundation, not for production persistence certification.

## Retention / Candidate handoff

PASS. Retention is explicit. Candidate handoff remains project-scoped `CANDIDATE`, requires Critic, and cannot auto-promote from frequency.

## Remaining gates

- real PostgreSQL integration and migration rehearsal,
- production authenticator/credential rotation,
- TLS/reverse proxy and public endpoint,
- backup/restore and operational monitoring,
- BAI VIDEO PRODUCTION TASK-036 real pilot/backfill,
- budget and production deployment authorization.

No blocking finding prevents accepting the local foundation while keeping TASK-017 Phase 0 active.
