# TASK-004 Phase 1.6 — Foundation Guard MVP Final Plan

- Phase: `1.6`
- Result: `READY_FOR_IMPLEMENTATION`
- Design authority: existing `phase1.6-foundation-guard-design.md` plus Owner implementation authorization dated 2026-08-08

## Goal

Close the Phase 1.5 transferred Foundation-wide activation gaps without changing Canonical Lifecycle state semantics. Every governed Role activation must be classifiable, bound to an immutable Permit, revalidated immediately before use, auditable, and routed through the Context Guard Gateway.

## Required implementation

1. Implement the complete PL-01..PL-28 Permit Ledger Fault Matrix as executable contract metadata.
2. Implement the complete T-01..T-17 TOCTOU Matrix as executable contract metadata.
3. Add a revisioned Activation Entry Registry with explicit role/scope policy and fail-closed unclassified-entry handling.
4. Bind Permit issuance to activation entry, requester identity, phase, scope, correlation ID, registry revision/checksum, and task/phase state revision/checksum.
5. Revalidate registry and task/phase state immediately before Permit consumption and runtime handoff.
6. Require durable, hash-chained Foundation audit evidence before handoff.
7. Reject legacy/unsupported, unknown, revoked, expired, consumed, corrupted, or binding-mismatched Permits.
8. Preserve the existing internal executor boundary: only the Gateway may activate the runtime executor.

## Completion gate

- Existing Context Guard regression suite remains green.
- Foundation Guard positive, negative, mutation, corruption, revocation, audit-failure, and concurrency tests pass.
- Product boundary check passes.
- No Canonical Lifecycle transition is implied by operational Guard state.
