# TASK-018 Phase H — OS Core Hardening Design, Review Plan and Authorization

Date: `2026-08-13`
Scope: `CONSUMER-INDEPENDENT CORE HARDENING`
Authorization: `LOCAL_IMPLEMENTATION_AUTHORIZED`

## Phase boundary

Phase G remains `PARKED_HUMAN_GATE`. BAI VIDEO PRODUCTION is under separate local development, its newest state is not on GitHub, and this Phase does not locate, read, mutate, run or push that Consumer checkout.

Phase H is split into:

- `H1 OS Core Hardening`: executable without Consumer/native Evidence;
- `H2 Empirical Pilot Hardening`: waits for Phase G Evidence.

This record authorizes H1 only.

## Existing OS mapping

- Context findings remain owned by `ContextControl`.
- Candidate validation/promotion remains owned by `KnowledgeOS`.
- lifecycle checkpoint/resume authority remains owned by `LifecycleOS`.
- TASK-018 adds only deterministic bridges and diagnostic classifications.
- no repair, policy activation, lease takeover or external dispatch occurs in this layer.

## Allowed Files

- `src/automation/autonomy-hardening.mjs`
- `src/automation/index.mjs`
- `schemas/automation/autonomy-session-lease.schema.json`
- `schemas/automation/autonomy-recovery-assessment.schema.json`
- `tests/automation/autonomy-hardening*.test.mjs`
- exact TASK-018/Registry/current-state documents needed for Evidence and routing

## Builder design

1. Convert a verified `CONTEXT_OVERFETCH` record into immutable Failure Analytics Evidence.
2. Propose a KnowledgeOS `FAILURE_CASE` Candidate only after repeated MAJOR/CRITICAL recurrence; never promote or activate it.
3. Represent the Phase-1 single-worker Session Lease as a deterministic, tamper-evident contract.
4. Treat an active foreign lease as conflict and a stale lease as review-required, never safe automatic takeover.
5. Diagnose crash/partial recovery facts without filesystem writes: invalid checkpoint, changed HEAD, merge conflict, unknown dirty changes, partial Evidence, failed/unknown tests, provider/usage suspension and missed schedule.
6. Resume automatically only from a valid successful checkpoint with clean or explicitly owned dirty paths, complete Evidence and PASS tests.

## Critic focus

- no false Knowledge promotion;
- no stale-lock takeover inference;
- no discard of unknown changes;
- checkpoint and lease structural validation, not checksum-only trust;
- Critical/High and test/Evidence uncertainty fail closed;
- Consumer/native boundary remains untouched.

## Gate

`AUTONOMY_CORE_HARDENING_PASS` requires focused and full regression PASS plus unresolved Critical/High `0/0`. It does not claim `AUTONOMY_HARDENED`, which still requires Phase G/H2 empirical Evidence.
