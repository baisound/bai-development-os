# TASK-004 Phase 1.5 — Context Guard Owner Decisions Addendum 01

## 1. Document Control

| Item | Value |
|---|---|
| Authoring Role | Orchestrator, recording current Owner authorization |
| Active Project / Task | `/home/baisound/projects/javascript-roulette` / `TASK-004` |
| Phase | `1.5 — Context Guard MVP` |
| Scope | Owner Decision 3 (exact activation-adapter ownership) and Owner Decision 4 (atomic Permit consumption) |
| Implementation Authorization | `NOT_AUTHORIZED` |
| Allowed persistent output | This new artifact only |
| Result | `PHASE1_5_OWNER_DECISION_ADDENDUM_RECORDED_WITH_CONDITIONS` |

This is an additive Owner decision record, not a Builder Design Revision. Existing
design, review, Owner-decision, Judge, source, test, schema, configuration,
runtime-state, Status, Registry, and Git evidence remain unchanged.

## 2. Evidence Reviewed and Procedure Record

| Evidence | Observation |
|---|---|
| `projects/ai-team/roles/README-Orchestrator.md` | Orchestrator may record authority and route, but may not implement or issue a Judge judgment. |
| `projects/ai-team/common/Evidence-Specification.md` | Requires exact paths, observed facts, and clear confirmed/unconfirmed separation. |
| `projects/ai-team/common/Authority-Specification.md` | Owner authorization is limited to the stated scope and does not itself authorize implementation. |
| `phase1.5-context-guard-design-final-plan.md` | Establishes the original Context Guard design and its planned module set. |
| `phase1.5-context-guard-design-final-plan-revision-01.md` | Establishes the planned Gateway and Permit module paths and immutable Permit intent. |
| `phase1.5-context-guard-design-rereview-01.md` | Records F-01-RR01 and F-02-RR01 as remaining High findings. |
| `phase1.5-context-guard-owner-decisions.md` | Establishes the immutable Permit and append-only Event Ledger decision. |
| `phase1.5-context-guard-design-judge-decision.md` | Authoritative source for remaining J-01 and J-02 High findings. |

Project inspection was read-only. The following procedures were performed from
`/home/baisound/projects/javascript-roulette`:

```text
Glob: src/**/*
Glob: scripts/**/*
Glob: tests/**/*
Glob: **/*.{mjs,js,cjs,ts}
content search: activateRole, role activation, Role construction, spawn, fork,
Worker, orchestrator, cli, inline, manual, child-process, and worker imports
```

Observed facts:

- `scripts/` does not exist.
- `package.json` defines only Vite `dev`, `dev:open`, `build`, `preview`, and the
  roulette-core `test` script; none activates an AI Team Role.
- No CLI entry, exported activation function, direct Role constructor, worker,
  subprocess Role launch, inline execution entry, or manual Role execution entry
  exists in `src/`, `scripts/`, `package.json`, or `vite.config.js`.
- `src/lifecycle/phase1/index.mjs` exposes lifecycle storage and validation APIs,
  not Role activation. Its use of filesystem leases is not a Context Guard
  activation entry.
- `tests/lifecycle/phase1/lifecycle-store.test.mjs` invokes `findmnt` only to
  validate a temporary test fixture filesystem. It is not a Role activation
  helper. No test-only activation helper exists.
- `docs/ai-team/resume-check.mjs` contains Git inspection commands only; it is
  not an activation entry and was not executed.

No runtime command, test, lint command, Git command, or state-creating operation
was executed.

## 3. Exact Extraction of Remaining Judge High Findings

| Finding ID | Severity / Title | Evidence and Risk | Required Owner Decision | Judge closure condition / verification |
|---|---|---|---|---|
| `J-01` | HIGH — Gateway boundary lacks exact adapter ownership | Judge §§8–9 and §22: prior design named a Gateway policy but no exact existing or future Project adapter paths, ownership map, or per-caller rejection boundary. A direct start could not be independently excluded. | Record exact adapter ownership, sole Gateway handoff, exact planned module paths, and treatment of every observed activation candidate. | Adapter ownership audit; direct-bypass rejection tests for each actual/future caller class; no unclassified entry. |
| `J-02` | HIGH — Ledger consumption is not concurrency-linearizable | Judge §§11–12 and §22: concurrent consumers could both observe an unused Permit and append a durable `PERMIT_CONSUMED` event because no exclusive serialization protocol was specified. | Record an atomic, Permit-unit exclusive lease and append protocol, crash semantics, errors, paths, and tests. | Concurrent-consume, crash-window, replay, event-chain-tamper, and durability-failure tests. |

`J-03` remains a coupled MEDIUM implementation-contract condition. This addendum
specifies the Ledger and lock runtime paths and required future modules/tests, but
does not create a schema, source, test, or runtime record.

## 4. Owner Decision 3 — Exact Role Activation Adapter Ownership

The Active Project activation ownership is fixed as follows:

```text
External Entry Adapter
        ↓
Role Activation Gateway
        ↓
Role Runtime Executor
```

```yaml
activation_ownership:
  external_adapter_responsibility:
    - external request normalization
    - caller identity classification
    - guarded activation request creation
    - gateway invocation
  gateway_responsibility:
    - permit requirement enforcement
    - permit validation
    - atomic permit consumption
    - activation authorization decision
    - executor invocation
  executor_responsibility:
    - validated activation command execution
    - no permit issuance
    - no permit validation bypass
    - no direct public exposure
```

The current Project contains no actual Role activation entry and therefore no
existing adapter owner to migrate. The following exact paths are future,
implementation-only planned paths required to create the bounded ownership
boundary. They do not describe files that currently exist.

| Component | Exact absolute path | Status / ownership |
|---|---|---|
| Canonical public Gateway | `/home/baisound/projects/javascript-roulette/src/context-guard/activation-gateway.mjs` | Existing planned design path; owns public `activateRoleWithPermit`. |
| Permit issue, validation, and consumption primitives | `/home/baisound/projects/javascript-roulette/src/context-guard/permit.mjs` | Existing planned design path; internal only. |
| Internal executor | `/home/baisound/projects/javascript-roulette/src/context-guard/role-runtime-executor.mjs` | New exact planned path; no public export. |
| Project public Context Guard surface | `/home/baisound/projects/javascript-roulette/src/context-guard/index.mjs` | Existing planned design path; may re-export only `activateRoleWithPermit`, never the executor or Permit primitives. |

The public Gateway API is exactly:

```yaml
canonical_gateway:
  public_function: activateRoleWithPermit
  public_owner_module: /home/baisound/projects/javascript-roulette/src/context-guard/activation-gateway.mjs
  internal_executor_module: /home/baisound/projects/javascript-roulette/src/context-guard/role-runtime-executor.mjs
  permit_issuer_module: /home/baisound/projects/javascript-roulette/src/context-guard/permit.mjs
  permit_validator_module: /home/baisound/projects/javascript-roulette/src/context-guard/permit.mjs
  permit_consumption_module: /home/baisound/projects/javascript-roulette/src/context-guard/permit.mjs
```

Only `activation-gateway.mjs` may import
`role-runtime-executor.mjs`. The executor may not be exported from
`src/context-guard/index.mjs` or any Project public module. An adapter may not
issue, validate, consume, or bypass a Permit. Environment-variable bypasses are
prohibited. A test-only adapter must remain within a test module and must not
become a production export.

## 5. Activation Entry Inventory

The inventory uses only the fixed caller-class values. Each observed candidate was
content-reviewed rather than inferred from its filename or search match.

| Entry ID | Existing path | Existing symbol / command | Caller class | Adapter owner | Gateway call | Direct execution prohibited |
|---|---|---|---|---|---|---|
| `AE-01` | `/home/baisound/projects/javascript-roulette/package.json` | `dev`, `dev:open`, `build`, `preview`, `test` | `NOT_AN_ACTIVATION_ENTRY` | N/A | N/A | N/A; scripts do not activate Roles |
| `AE-02` | `/home/baisound/projects/javascript-roulette/vite.config.js` | Vite configuration | `NOT_AN_ACTIVATION_ENTRY` | N/A | N/A | N/A |
| `AE-03` | `/home/baisound/projects/javascript-roulette/src/roulette.js` | browser roulette UI | `NOT_AN_ACTIVATION_ENTRY` | N/A | N/A | N/A |
| `AE-04` | `/home/baisound/projects/javascript-roulette/src/roulette-core.mjs` | roulette exports | `NOT_AN_ACTIVATION_ENTRY` | N/A | N/A | N/A |
| `AE-05` | `/home/baisound/projects/javascript-roulette/src/lifecycle/phase1/index.mjs` | `LifecycleStore` and validators | `NOT_AN_ACTIVATION_ENTRY` | N/A | N/A | N/A; lifecycle operations are not Role execution |
| `AE-06` | `/home/baisound/projects/javascript-roulette/tests/lifecycle/phase1/lifecycle-store.test.mjs` | fixture-only `findmnt` subprocess | `TEST_ONLY` | No Role adapter; fixture helper only | N/A | Yes; it may never execute a Role |
| `AE-07` | `/home/baisound/projects/javascript-roulette/tests/roulette-core.test.mjs` | roulette-core tests | `NOT_AN_ACTIVATION_ENTRY` | N/A | N/A | N/A |
| `AE-08` | `/home/baisound/projects/javascript-roulette/docs/ai-team/resume-check.mjs` | Git-check command list | `NOT_AN_ACTIVATION_ENTRY` | N/A | N/A | N/A |
| `AE-09` | `/home/baisound/projects/javascript-roulette/scripts` | path absent | `NOT_AN_ACTIVATION_ENTRY` | N/A | N/A | N/A |

Inventory result: observed actual activation entries `0`; unclassified activation
entries `0`. If implementation introduces any `ORCHESTRATOR`, `CLI`,
`INLINE_EXECUTION`, `MANUAL_EXECUTION`, or `AUTOMATION_CONSUMER` entry, the entry
must receive one exact adapter file path and invoke
`activateRoleWithPermit` before it may be implemented or exposed. An unclassified
future entry must Safe Stop with
`CONTEXT_ROLE_ACTIVATION_ENTRY_UNCLASSIFIED`; implementation must not begin or
continue with that entry.

## 6. Decision 3 Enforcement Conditions and Required Tests

Future implementation must prove all of the following:

- every actual Entry Inventory row classified as an activation entry has exactly
  one external adapter owner;
- all such adapters call the same Gateway API;
- direct imports of `role-runtime-executor.mjs` outside
  `activation-gateway.mjs` equal `0`;
- unguarded public activation exports equal `0`;
- package scripts that activate a Role without the Gateway equal `0`;
- production exports contain no test-only bypass;
- unclassified activation entries equal `0`;
- an adapter resolves to no executor access before Gateway validation and durable
  consumption verification.

Required test paths are future implementation paths:

```text
/home/baisound/projects/javascript-roulette/tests/context-guard/context-guard.activation-adapters.test.mjs
/home/baisound/projects/javascript-roulette/tests/context-guard/context-guard.gateway.test.mjs
/home/baisound/projects/javascript-roulette/tests/context-guard/context-guard.permit.test.mjs
```

They must cover the listed Adapter/Gateway tests in the Owner instruction,
including actual CLI, Orchestrator, Inline, or Manual adapters if and only if
those adapters are introduced. No non-existent entry is represented as implemented.

## 7. Owner Decision 4 — Permit-Unit Exclusive Lease

The runtime layout is an implementation-time target only; this addendum creates
none of these paths:

```text
<session-root>/
├── role-activation-permit.json
├── role-activation-permit-events.jsonl
└── locks/
    └── permit-<permit-id>.lock
```

`role-activation-permit.json` is immutable. The JSONL Event Ledger is append-only.
The lock file is synchronization runtime state, never Canonical Evidence.

For a Permit ID, the Gateway acquires
`locks/permit-<permit-id>.lock` with exclusive-create semantics equivalent to:

```text
open(lockPath, O_CREAT | O_EXCL | O_WRONLY, 0600)
```

The lock content binds `lease_id`, process identity, Permit ID, Task ID, Session
ID, and `issued_at`. The successful creator must file-sync the lock and then
directory-sync `locks/`. `EEXIST` is a conflict: no waiting, automatic retry,
deletion, overwrite, or forced takeover is permitted.

## 8. Atomic Consumption Ordering and Append Contract

The Gateway performs the following sequence in order:

1. verify Permit checksum;
2. verify Permit Project/Task/Role/Session binding and TTL;
3. acquire the exclusive Permit lease;
4. durably write the lease;
5. reread and fully validate the Event Ledger chain;
6. verify no existing `PERMIT_CONSUMED`;
7. verify no `PERMIT_REVOKED` or `PERMIT_EXPIRED`;
8. construct one canonical JSON `PERMIT_CONSUMED` line;
9. append that complete UTF-8 line, including trailing LF, in one append call;
10. file-sync the Event Ledger;
11. parent-directory-sync the Event Ledger directory;
12. reread the Ledger;
13. verify chain head, event checksum, and Permit binding;
14. invoke the internal executor;
15. record Role-start result evidence;
16. release the lease and directory-sync `locks/`.

The Ledger append must use `O_APPEND`-equivalent semantics but must not rely on
`O_APPEND` for concurrency exclusion; the durable exclusive lease is the primary
concurrency control. Partial append, failed sync, failed reread, failed chain
verification, or uncertain durability is never success and never permits executor
invocation. Existing Ledger bytes must not be modified, truncated, or rewritten.

For concurrent consumers of the same Permit:

```yaml
first_consumer:
  lease: ACQUIRED
  result: MAY_PROCEED
second_consumer:
  lease: CONFLICT
  result: SAFE_STOP
  error: CONTEXT_ROLE_ACTIVATION_PERMIT_CONSUMPTION_CONFLICT
```

## 9. Lease Release, Staleness, and Crash Classification

Before a consumption event is appended, a confirmed failure may release its own
lease. After consumption-event durability is uncertain, or after executor start
when the result is unknown, the lock must remain and the result is
`ROLE_ACTIVATION_STATE_UNKNOWN`. Stale leases are never reclaimed automatically,
never TTL-deleted, and never manually deleted without authority:
`RECOVERY_AUTHORITY_REQUIRED`.

| Crash point | Permit event | Lease | Role state | Required result |
|---|---|---|---|---|
| Before lease durable | absent | uncertain / absent | not started | safe retry only after inspection |
| Lease durable, before event | absent | present | not started | recovery authority required |
| Event append, before sync | uncertain | present | not started | consumption state unknown |
| Event durable, before Role | consumed | present | not started | Permit reuse prohibited |
| Role start, before result | consumed | present | unknown | `ROLE_ACTIVATION_STATE_UNKNOWN` |
| Result recorded, before unlock | consumed | present | known | idempotent evidence verification only |

## 10. Required Error Contract

| Error | Trigger | Retryable | Safe Stop | Automatic writes allowed | Required authority / tests |
|---|---|---|---|---|---|
| `CONTEXT_ROLE_ACTIVATION_ADAPTER_UNRESOLVED` | required adapter path/owner absent | No | no activation | none | Owner correction; adapter inventory tests |
| `CONTEXT_ROLE_ACTIVATION_ENTRY_UNCLASSIFIED` | candidate activation entry lacks fixed caller class | No | no activation | classification evidence only | Owner classification; inventory tests |
| `CONTEXT_ROLE_ACTIVATION_DIRECT_EXECUTOR_ACCESS` | non-Gateway executor import/call | No | no activation | none | implementation correction; static-boundary tests |
| `CONTEXT_ROLE_ACTIVATION_PERMIT_LOCK_CONFLICT` | exclusive create returns `EEXIST` | No | no activation | none | new Permit only; concurrent-consumer tests |
| `CONTEXT_ROLE_ACTIVATION_PERMIT_LOCK_UNCERTAIN` | lock write/sync/identity cannot be confirmed | No | no activation | preserve created lock if uncertain | Recovery Authority; lock-durability tests |
| `CONTEXT_ROLE_ACTIVATION_PERMIT_CONSUMPTION_CONFLICT` | another consumer owns same Permit lease | No | no activation | none | new Permit only; concurrent-consumer tests |
| `CONTEXT_ROLE_ACTIVATION_PERMIT_APPEND_PARTIAL` | one canonical line was not fully appended | No | no activation | preserve lock and Ledger bytes | Recovery Authority; partial-append tests |
| `CONTEXT_ROLE_ACTIVATION_PERMIT_APPEND_UNCERTAIN` | append outcome cannot be determined | No | no activation | no compensating Ledger write; preserve lock | Recovery Authority; crash-window tests |
| `CONTEXT_ROLE_ACTIVATION_PERMIT_LEDGER_SYNC_FAILED` | Ledger file/directory sync fails | No | no activation | preserve lock and Ledger | Recovery Authority; sync-failure tests |
| `CONTEXT_ROLE_ACTIVATION_PERMIT_LEDGER_VERIFY_FAILED` | reread, chain, checksum, or binding verification fails | No | no activation | preserve lock and Ledger | Recovery Authority; tamper/replay tests |
| `CONTEXT_ROLE_ACTIVATION_PERMIT_STALE_LEASE` | a pre-existing stale lease is observed | No | no activation | Safe Stop evidence only | Recovery Authority; no-auto-delete tests |
| `ROLE_ACTIVATION_STATE_UNKNOWN` | event durable but Role outcome is unknown | No | no reuse or retry | result evidence only when determinable; retain lock | Owner/Recovery Authority; post-start crash tests |

## 11. Required Atomic-Consumption Tests

The three future test paths in Section 6 must collectively cover:

- two consumers: exactly one success and one conflict;
- exactly one consumption event and zero duplicate `PERMIT_CONSUMED` events;
- exclusive-create lease behavior and lease durability failure;
- existing-consumed detection after Ledger reread;
- partial append, file-sync, directory-sync, reread, and chain failures;
- stale-lock Safe Stop with no automatic deletion;
- immutable Permit bytes/checksum before and after consumption, with no
  `consumed_at` mutation;
- durable-event Permit reuse rejection;
- unknown Role result;
- full Context Guard, Phase 1 D-01–D-06, existing 88-test baseline, and roulette
  regression execution after a separate implementation authorization.

## 12. Finding Resolution Record

```yaml
judge_high_resolution:
  activation_adapter_boundary:
    finding: J-01
    resolution: OWNER_DECISION_RECORDED
    implementation_verification_required: true
  atomic_permit_consumption:
    finding: J-02
    resolution: OWNER_DECISION_RECORDED
    implementation_verification_required: true
implementation_status: NOT_AUTHORIZED
```

The Owner decisions determine policy and design constraints only. They neither
assert that the planned modules/tests exist nor verify runtime behavior.

## 13. Validation and Limits

| Validation | Observation |
|---|---|
| Judge High findings extracted | `J-01` and `J-02` extracted from the saved Judge artifact with severity, evidence, risk, Owner decision, closure condition, and verification method. |
| Actual Project entry paths inspected | PASS: no Role activation entry exists; `scripts/` is absent; no candidate remains unclassified. |
| Gateway / executor boundary | Recorded as exact future paths; executor is internal and Gateway-only. |
| Permit race protection | Exclusive lease, no-wait conflict Safe Stop, durable append/re-read before executor, and no stale auto-recovery are recorded. |
| Permit immutability | Recorded: Permit immutable; consumption state resides in append-only Ledger. |
| Implementation authorization | `NOT_AUTHORIZED`. |
| Persistent changes | One new Markdown artifact only. |
| Lint | PASS: IDE diagnostics for this new Markdown artifact report no errors. No project lint command was executed. |

## 14. Routing Envelope and Completion Pause

| Field | Value |
|---|---|
| Current Phase | Phase 1.5 — Owner Decision Addendum recorded; pending independent Judge validation |
| Gate Readiness | `NOT_READY` |
| Active Project / Task | `javascript-roulette` / `TASK-004` |
| Authorization Status | Owner authorization is consumed only for this addendum; implementation remains `NOT_AUTHORIZED`. |
| Next Role | Judge, once only, when the Owner issues the next instruction |
| Reason | Judge must independently determine whether Decisions 3 and 4 close J-01/J-02 and whether Critical/High unresolved findings are zero. |
| Files To Read | This addendum; Judge decision; prior Owner decisions; Revision 01; Re-review 01; applicable Judge/common specifications. |
| Allowed Files | One separately authorized `phase1.5-context-guard-design-judge-decision-02.md` Judge artifact only. |
| Prohibited Files | Source, tests, schemas, configuration, runtime state, Status, Registry, Git, historical evidence, and any Design Revision. |
| Exact Prompt To Send | Not issued. The Owner must authorize the single Judge 02 action separately. |
| Expected Artifact | `docs/ai-team/tasks/TASK-004/phase1.5-context-guard-design-judge-decision-02.md` |
| Validation | Confirm J-01/J-02 closure, exact implementation conditions, and zero unresolved Critical/High before any implementation-authorization request. |
| Stop Conditions | Missing evidence/authority, scope expansion, a proposed Design Revision, implementation request, unresolved High finding, or an attempt to create runtime state. |
| Next Gate | One Owner-authorized Judge 02 decision; no automatic continuation. |

Completion pause: do not start Judge 02, implementation authorization, source/test/
schema/configuration changes, runtime-state creation, Git operations, Phase 1.6,
or Phase 5A. Stop for Owner confirmation.
