# TASK-004 Phase 1.5 — Context Guard Owner Decisions

## 1. Document Control

| Item | Value |
|---|---|
| Authoring Role | Orchestrator, recording Owner authority |
| Active Project / Task | `/home/baisound/projects/javascript-roulette` / `TASK-004` |
| Scope | F-01-RR01 and F-02-RR01 Owner resolution record |
| Implementation Authorization | `NOT_AUTHORIZED` |
| Result | `PHASE1_5_OWNER_DECISIONS_RECORDED_WITH_CONDITIONS` |
| Allowed persistent output | This file only |

This artifact is not a Design Revision and does not modify historical design or
review evidence. It records the Owner decisions exactly as authorized.

## 2. Input Integrity Record

All required inputs existed and were readable. SHA-256 verification procedure:
`sha256sum <each exact required path>` from `/home/baisound`; exit code `0`.

| Input | SHA-256 |
|---|---|
| `README-Orchestrator.md` | `9f050e122c959eb9915b91b0548bf0c89c07b8444ad871cc7fb4a08a4c40364a` |
| `Evidence-Specification.md` | `a81b65133bc45ca7e044e7484229f2b1731be85c25508b425852e23fed4759c6` |
| `Authority-Specification.md` | `38459f8a96a21e03bd55cdd219dfe21ae017c8edbf0027ebc12df66e14c0076d` |
| `phase1.5-context-guard-kickoff.md` | `6db9b07bcb485ea2b6dd3860d43eac52e4195786d616b02f110d4f06ae258671` |
| `phase1.5-context-guard-design-final-plan.md` | `58cbc95a213389b68140d016f9f3e774b66e1c8043ffde88139b8db07b5539ee` |
| `phase1.5-context-guard-design-review.md` | `93e002427da10dd58d4b8564bbed43d8946cbad17448b0085a2d83a08cb93067` |
| `phase1.5-context-guard-design-final-plan-revision-01.md` | `55d673624e577a9981286de5ec6385c1b849ea4099d093b866ff1e1bee4b5e51` |
| `phase1.5-context-guard-design-rereview-01.md` | `e64f93ab79beb472c92e61a7a73e27366fd382708882970ab8bd9819f9df2c62` |

## 3. Authority Chain and Boundary

```text
Owner authorization in current instruction
→ this immutable decision record
→ Judge design-decision gate
→ separate explicit implementation authorization
```

The decision resolves the two remaining design High findings at the policy/design
level. It does not verify implementation and therefore does not authorize source,
test, schema, configuration, runtime-directory, Status, Registry, or Git changes.

## 4. Owner Decision 1 — Project Role Activation Boundary

```yaml
role_activation_boundary:
  canonical_public_entry:
    function: activateRoleWithPermit
    visibility: PUBLIC
  internal_functions:
    - issueRoleActivationPermit
    - validateRoleActivationPermit
    - consumeRoleActivationPermit
  prohibited_public_entries:
    - activateRole
    - direct_role_constructor
    - unguarded_cli_activation
    - unguarded_orchestrator_activation
    - manual_bypass
    - environment_variable_bypass
    - production_test_bypass
  required_callers:
    - orchestrator
    - cli
    - inline_execution
    - manual_execution
    - future_automation_consumer
  fail_open: PROHIBITED
phase_1_5_enforcement:
  scope: ACTIVE_PROJECT
  project_root: /home/baisound/projects/javascript-roulette
  unguarded_project_role_activation: PROHIBITED
```

For Phase 1.5, every Active Project Role-activation adapter is owned by the
Project Gateway and must invoke `activateRoleWithPermit`. The Owner decision
therefore supplies the previously missing integration owner and makes a direct
Role start a rejected operation, not an advisory convention.

Phase 1.6 is reserved for the Foundation-wide gateway. It must preserve the
Phase 1.5 public entry, Permit validation, single-use consumption, no environment
bypass, and fail-closed behavior. That future scope does not make the Phase 1.5
Project Gateway optional.

## 5. Owner Decision 2 — Immutable Permit and Event Ledger

```yaml
role_activation_permit:
  mutability: IMMUTABLE
  consumed_at_field: PROHIBITED
  post_checksum_mutation: PROHIBITED
```

`role-activation-permit.json` is canonical JSON with an excluding-self Permit
checksum and binds Project, Task, Role, Session, selected-input checksum set, TTL,
and single-use policy. It is immutable after issuance; no `consumed_at` field is
present and no post-checksum mutation is allowed.

The sole consumption authority is the append-only
`role-activation-permit-events.jsonl` ledger. Existing entries cannot be edited,
deleted, or reordered. Every entry has `event_checksum` and
`previous_event_checksum`; validation traverses the entire chain and rejects
duplicate consumption.

```yaml
permit_event:
  event_id: required
  event_type: PERMIT_ISSUED|PERMIT_CONSUMED|PERMIT_EXPIRED|PERMIT_REVOKED|PERMIT_REJECTED
  permit_id: required
  project_id: required
  task_id: required
  role: required
  session_id: required
  transaction_id: required
  event_at: required
  previous_event_checksum: required
  event_checksum: required
permit_consumed_additions:
  activation_request_checksum: required
  selected_input_set_checksum: required
  consumer_identity: required
  activation_started_at: required
```

A Permit is usable only when its checksum, scope, TTL, and selected-input set
match; the event chain validates; and no `PERMIT_REVOKED`, `PERMIT_EXPIRED`, or
`PERMIT_CONSUMED` event exists for it.

The consumption protocol is fixed:

```text
validate Permit and event chain
→ append PERMIT_CONSUMED
→ file sync
→ parent-directory sync
→ reread and verify event chain
→ activate Role
```

Role activation before durable `PERMIT_CONSUMED` is prohibited. If consumption is
durable but the Role-activation result is unknown, the Permit cannot be reused:
return `ROLE_ACTIVATION_STATE_UNKNOWN` and Safe Stop for Owner or future Recovery
Authority.

## 6. Runtime Evidence Integration

The two records are distinct and stored only under the Git-excluded Project-local
runtime root:

```text
/home/baisound/projects/javascript-roulette/.context-guard-runtime/
└── tasks/<task-id>/sessions/<session-id>/
    ├── role-activation-permit.json
    └── role-activation-permit-events.jsonl
```

They must not be combined into one file. The Permit is immutable-create; the event
ledger is append-only. Both are runtime evidence, not Status or Registry records,
and are outside Git commit targets.

## 7. Required Errors

| Error | Trigger | Retryable | Safe Stop / authority | Required test |
|---|---|---|---|---|
| `CONTEXT_ROLE_ACTIVATION_GATEWAY_REQUIRED` | Activation request does not enter the Gateway | No | Stop; Project Gateway only | unguarded entry absent |
| `CONTEXT_ROLE_ACTIVATION_BYPASS_REJECTED` | Direct/CLI/Orchestrator/manual/environment/test bypass attempt | No | Stop; Owner change authority | all caller adapters reject |
| `CONTEXT_ROLE_ACTIVATION_PERMIT_MISSING` | No Permit | No | Stop | missing Permit |
| `CONTEXT_ROLE_ACTIVATION_PERMIT_INVALID` | Bad checksum, scope, binding, or malformed Permit | No | Stop | checksum/binding tests |
| `CONTEXT_ROLE_ACTIVATION_PERMIT_EXPIRED` | TTL elapsed | No | Stop; new preflight/Permit | expiry test |
| `CONTEXT_ROLE_ACTIVATION_PERMIT_REVOKED` | Valid ledger revocation event exists | No | Stop; Owner/new authorization | revoked test |
| `CONTEXT_ROLE_ACTIVATION_PERMIT_ALREADY_CONSUMED` | Valid consumption event exists | No | Stop; new request/Permit | duplicate/reuse test |
| `CONTEXT_ROLE_ACTIVATION_PERMIT_EVENT_CHAIN_INVALID` | Chain checksum/link/order invalid | No | Stop; Owner/Recovery Authority | tamper-chain test |
| `CONTEXT_ROLE_ACTIVATION_PERMIT_CONSUMPTION_UNCERTAIN` | Durable-consumption state cannot be determined | No | Stop; Owner/Recovery Authority | crash uncertainty test |
| `ROLE_ACTIVATION_STATE_UNKNOWN` | Consumption durable, activation outcome unknown | No | Stop; Owner/Recovery Authority | post-consumption crash test |

## 8. Mandatory Implementation Tests

The Judge and any later implementation authorization must require evidence for:

- no unguarded public entry; CLI, Orchestrator, and manual activation cannot bypass
  the Gateway;
- rejection of missing, invalid, expired, revoked, already-consumed, wrong
  task/role/session, or changed-input-set Permits;
- no Role start before durable `PERMIT_CONSUMED`;
- immutable Permit bytes/checksum before and after consumption, with no
  `consumed_at` mutation;
- ledger-chain tamper detection, duplicate-consumption rejection, and Safe Stop on
  crash after durable consumption;
- runtime root and separate Permit/ledger paths;
- Phase 1 full regression, D-01–D-06, and the existing 88 tests.

## 9. Finding Resolution Record

```yaml
remaining_high_resolution:
  role_activation_boundary:
    resolution: OWNER_DECISION_RECORDED
    implementation_verification_required: true
  immutable_permit_consumption:
    resolution: OWNER_DECISION_RECORDED
    implementation_verification_required: true
design_revision_budget:
  maximum: 1
  consumed: 1
  additional_revision: PROHIBITED_WITHOUT_NEW_OWNER_DECISION
```

The Owner decision supersedes the conflicting `consumed_at` design detail only
within the Phase 1.5 Permit-consumption boundary. Historical artifacts remain
unchanged.

## 10. Routing Envelope

| Field | Value |
|---|---|
| Current Phase | Phase 1.5 — Owner Decision recorded; awaiting design judgment |
| Gate Readiness | `NOT_READY` |
| Active Project / Task | `javascript-roulette` / `TASK-004` |
| Authorization Status | Owner authorization applies only to this decision record |
| Next Role | Judge, only after separate Owner instruction |
| Reason | Judge must assess Owner-decision integration with existing design and whether design High findings are closed. |
| Files To Read | This record; original design/review; Revision 01; Re-review 01; applicable Judge specifications. |
| Allowed Files | A future, separately authorized Judge decision artifact only. |
| Prohibited Files | All source, tests, schemas, configuration, runtime, Status, Registry, Git, and historical evidence. |
| Exact Prompt To Send | Not issued: completion pause requires Owner confirmation before Judge activation. |
| Expected Artifact | `phase1.5-context-guard-design-judge-decision.md`, if separately authorized. |
| Validation | Confirm Decision 1 Gateway ownership; Decision 2 immutable Permit plus append-only ledger; all required errors/tests; no implementation authorization. |
| Stop Conditions | Missing authority/evidence, scope expansion, unresolved design contradiction, or any request to implement before a binding Judge result and separate authorization. |
| Next Gate | Owner-authorized Judge design decision. |

## 11. Validation and Completion Pause

Validation result:

- Owner Decision 1 and 2 recorded without alteration: PASS.
- Public activation entry is unique at design authority level: PASS.
- Phase 1.5/1.6 boundary is explicit: PASS.
- Permit mutability and append-only consumption ledger are separated: PASS.
- Exact errors and required tests are recorded: PASS.
- Implementation authorization remains `NOT_AUTHORIZED`: PASS.
- New artifact count: one; protected paths and Git unchanged: PASS.
- IDE lint diagnostics: PASS.

Result: `PHASE1_5_OWNER_DECISIONS_RECORDED_WITH_CONDITIONS`.

Conditions are implementation verification and a separate Judge design decision.
Do not start Judge, implementation authorization, implementation, Runtime
directory creation, Git work, Phase 1.6, or Phase 5A until the Owner issues the
next instruction.
