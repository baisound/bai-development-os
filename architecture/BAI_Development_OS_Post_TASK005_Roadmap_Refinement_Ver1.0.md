# BAI Development OS — Post-TASK-005 Roadmap Refinement Ver.1.0

## Decision

TASK-005 completion produced additional future-hardening requirements. They are assigned to existing TASK-009〜014 rather than creating new Tasks. This keeps the roadmap extensible without governance bloat.

## Allocation

| Task | Added future scope |
|---|---|
| TASK-009 | Crash-consistent Knowledge mutation, WAL/journal fencing, sensitivity isolation, integrity/fault injection |
| TASK-010 | Knowledge Pack release portability, schema/taxonomy migration, offline bundles, rollback compatibility |
| TASK-011 | Cross-project Knowledge portability/isolation conformance and contamination tests |
| TASK-012 | Knowledge fsck, interrupted-write recovery, index rebuild, orphan cleanup, safe GC/compaction |
| TASK-013 | Domain taxonomy/schema/fingerprint/ranking/Pack extension SDK |
| TASK-014 | Resolver effectiveness and confidence/freshness calibration with shadow/counterfactual evaluation |

All items are `PROPOSED / NOT_STARTED / NOT_AUTHORIZED`. TASK-006 remains next.
