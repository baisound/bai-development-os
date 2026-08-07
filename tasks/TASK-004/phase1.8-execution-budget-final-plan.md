# TASK-004 Phase 1.8 — Execution Budget / Retry / Review Depth Guard Final Plan

- Phase: `1.8`
- Result: `READY_FOR_IMPLEMENTATION`

## Goal

Prevent development governance itself from becoming an unbounded consumer of time, tokens, artifacts, review cycles, or API budget while preserving higher assurance for foundation/critical work.

## Required implementation

1. Retry-attempt limit.
2. Critic/fix review-cycle limit.
3. Generated artifact byte-size limit.
4. Per-model-call estimated cost limit.
5. Quota/Billing error automatic-retry Hard Stop.
6. Soft warnings before configured limits.
7. Integration with Adaptive Development Governance so profile review caps act as a safety upper bound.
8. Explicitly preserve the permanent model-selection policy; this phase controls budget/execution depth, not model choice.

## Default MVP limits

- retries: 2
- review cycles: 2
- artifact bytes: 262,144
- model-call cost: unlimited unless configured
- soft limit ratio: 0.8
- quota/billing automatic retry: disabled by Hard Stop

Configured limits remain overridable within the API contract; the Adaptive Development Profile may only tighten the review-cycle cap.
