# TASK-004 Phase 1.6 — Foundation Guard MVP Implementation and Verification

- Date: 2026-08-08
- Result: `TECHNICALLY_COMPLETED_MVP`
- Overall TASK-004: `ACTIVE`

## Implemented

- `src/foundation-guard/matrices.mjs`
  - PL-01..PL-28 Permit Ledger Fault Matrix
  - T-01..T-17 TOCTOU Matrix
  - completeness assertion
- `src/foundation-guard/activation-registry.mjs`
  - revisioned activation-entry registry
  - duplicate, disabled, unclassified, role-denied, and scope-denied handling
- `src/foundation-guard/audit.mjs`
  - exclusive-lock, hash-chained, fsync-backed activation audit
- `src/foundation-guard/index.mjs`
  - Foundation activation request
  - Permit issuance binding
  - registry/state revalidation immediately before use
  - mandatory Gateway handoff
- Foundation Guard schemas under `schemas/foundation-guard/`
- Context Guard Permit v1.2 enhancements:
  - issuer identity
  - persisted canonical Permit identity verification
  - unsupported-version rejection
  - unknown Permit rejection
  - durable revocation
  - ledger read/write failure classification
  - invalid clock rejection

## Critic findings resolved during this run

### C1 — Persisted Permit canonical identity was too weak

The first implementation verified the supplied Permit checksum but did not strongly require the supplied Permit to equal the session-persisted Permit authority. A forged, internally checksummed Permit could therefore reach validation too far.

Resolution: validation now loads the persisted canonical Permit, rejects unknown Permit IDs, and requires canonical persisted equality before activation.

### C2 — Audit durability must precede runtime handoff

Resolution: Foundation audit append, fsync, reread verification, and optional directory sync all occur before Gateway consumption/handoff. Audit failure is fail-closed.

## Verification coverage

- complete matrix cardinality and required oracle fields;
- unknown/duplicate/disabled activation entries;
- role/scope deny paths;
- forged/unknown Permit;
- unsupported Permit version;
- invalid clock;
- requester/phase/scope/entry binding mutations;
- state revision/checksum mutation between check and use;
- registry mutation between check and use;
- durable Permit revocation;
- corrupted ledger/audit chain;
- audit write/durability failure;
- concurrent Permit consumption with exactly one winner;
- existing Context Guard regression suite.

## Disposition

Phase 1.6 Foundation Guard MVP is technically complete for the current foundation milestone. Deep crash/chaos expansion beyond the deterministic matrix and implemented fault classes remains eligible for later hardening and does not block progression to Phase 1.7.
