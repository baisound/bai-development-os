# TASK-004 Phase 1.7 — Cost Guard MVP Final Plan

- Phase: `1.7`
- Result: `READY_FOR_IMPLEMENTATION`
- Parent requirements: Architecture Cost Guard / Sustainable AI Development requirements

## Goal

Introduce enforceable Task, Role, and Session cost/token budgets with durable reservations and actual-usage accounting so parallel work cannot silently exceed a configured hard budget.

## Required implementation

1. Separate Task, Role, and Session budget dimensions.
2. Track input tokens, output tokens, and cost in integer micro-USD.
3. Provide deterministic model-call cost estimation from USD-per-million pricing inputs.
4. Reserve projected usage before execution.
5. Include active reservations in projected usage to prevent budget overcommit.
6. Record actual usage separately from reservations and release unused reservations.
7. Persist events in an append-only, hash-chained, fsync-backed ledger.
8. Make reservation decision + append atomic under the same exclusive ledger lock.
9. Make Actual/Release terminal settlement atomic so a reservation has exactly one terminal outcome.
10. Emit Soft Limit warnings while allowing execution; reject Hard Limit breaches before reservation.
11. Fail closed on malformed budgets, malformed usage, invalid bindings, ledger corruption, and lock uncertainty.

## Completion gate

- Task/Role/Session limit tests pass.
- Exact-boundary and one-over tests pass.
- Tamper test passes.
- Concurrent reservation cannot overcommit.
- Concurrent settlement produces one terminal event only.
