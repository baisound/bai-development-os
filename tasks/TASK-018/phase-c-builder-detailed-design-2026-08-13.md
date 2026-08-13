# TASK-018 Phase C — Handoff Bootstrap Builder Detailed Design

Date: `2026-08-13`
Target gate: `HANDOFF_BOOTSTRAP_PASS`

## Design

Extend existing `ContextControl` with a pure Handoff Bootstrap evaluator. It consumes observed Git relation, current checkout state and an already-loaded handoff manifest; it performs no Git, file, network or secret-provider operation itself.

The evaluator shall:

- validate the canonical manifest checksum and required fields;
- verify every critical file is present and checksum-matched;
- reject project identity mismatch, unresolved Git relation and unrelated history;
- classify `EQUAL`, `HANDOFF_STALE`, `CHECKOUT_STALE` and fail-closed relations;
- make current local dirty work the implementation truth only when ownership is known, and never discard it;
- use `LOCAL_CHECKOUT`, `REMOTE_FEATURE_BRANCH`, `HANDOFF_ONLY_READONLY` or fail closed as Source of Truth mode;
- rank Owner/Canonical/Authorized instructions above documentation, source data and external material;
- reject critical untrusted instruction sources and secret-bearing material selected for model context;
- produce a minimum loading plan from mandatory critical files plus changed/non-stale relevant entries;
- return next action and implementation permission without inventing authorization.

## Allowed Files

- `src/context-control/handoff-bootstrap.mjs`
- `src/context-control/index.mjs`
- `schemas/context-control/handoff-bootstrap-result.schema.json`
- `tests/context-control/handoff-bootstrap.test.mjs`
- `tests/context-control/handoff-bootstrap-schema.test.mjs`
- `tasks/TASK-018/**`
- active registry/status/document-index files required for synchronization

## Rollback

Remove the new exports/module/schema/tests. Existing Context Manifest and Context Cost behavior remains unchanged.
