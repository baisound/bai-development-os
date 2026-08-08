# TASK-005 Post-Completion Roadmap Refinement

## Status

`POST_COMPLETION_ROADMAP_ONLY / TASK_NOT_REOPENED`

## Decision

TASK-005 completion findings are assigned to existing reserved TASK-009〜014 instead of creating TASK-015. TASK-006 remains the next canonical development route.

## Allocations

- TASK-009: crash-consistent Knowledge mutation/journal fencing, shared integrity primitives, cross-project sensitivity isolation, interrupted-write/fault-injection coverage.
- TASK-010: portable Knowledge Pack release/import bundles, schema/taxonomy migration, offline distribution and rollback compatibility.
- TASK-011: cross-project Knowledge portability/isolation conformance, promotion diversity fixtures and contamination-negative tests.
- TASK-012: Knowledge repository fsck, journal recovery, orphan handling, derived-index rebuild, safe GC/compaction and cross-format drift detection.
- TASK-013: domain taxonomy/schema/fingerprint/validator/ranking/Knowledge-Pack extension points.
- TASK-014: resolver-effectiveness, confidence/freshness calibration, shadow evaluation and counterfactual replay with immutable safety floors.

## Residual mapped from TASK-005

TASK-005 currently detects partial revision/current/event persistence and Safe Stops, but does not automatically recover a power-loss-torn transaction. TASK-009 owns crash-consistent commit metadata; TASK-012 owns safe repair/recovery after that integrity primitive exists.

## Documentation QA finding

During this roadmap refinement, the historical Architecture Ver.2.6 DOCX companion was found to contain inherited Ver.2.5 companion content. Historical bytes were not rewritten. Architecture Ver.2.7 is generated as a corrected current companion and contains both TASK-005 completion and this refinement. This is retained as a concrete future TASK-012 cross-format drift-detection case.

## Authorization

No TASK-009〜014 implementation is authorized by this document. All remain `PROPOSED / NOT_STARTED / NOT_AUTHORIZED`.
