# TASK-018 Phase A — Builder Detailed Design

Decision proposal: `ACCEPT_WITH_BOUNDED_PHASES`

## Architecture

```text
Owner / Canonical Governance
  -> Handoff Bootstrap + Source Truth Resolver
  -> Autonomous Scheduler
  -> Canonical Capability Request
  -> Role/Gate/Allowed-Files filter
  -> Authority and Safety Gateway
  -> Context Cost + Cost Guard + Execution Budget
  -> existing Application Services
  -> Git/Test/Evidence/Consumer adapters
  -> Result, Human Gate Park, or next authorized Task
```

## Phase B — Context Cost Observatory

Extend `ContextControl` with a record builder and evaluator that:

- consumes already selected Context sources; it must not read files itself;
- preserves source reason, identity/hash, trust, stale/duplicate/use flags and estimated tokens;
- keeps estimated, provider-observed and billed usage in distinct nullable fields;
- derives duplicate/stale/useful ratios and `CONTEXT_OVERFETCH` findings;
- evaluates efficiency only after the required quality gate is known;
- produces deterministic canonical checksum identity;
- rejects an input that claims `EXACT_PROVIDER_REPORTED` without observed usage;
- never turns unavailable usage into zero.

Initial overfetch thresholds are policy inputs, not universal truth: Warning 10%, Major 25%, Critical 50% plus repeated behavior.

## Phase C — Handoff Bootstrap

Extend ContextControl/Automation startup with a source-truth resolver, manifest checksum verification, Git relation classification, dirty ownership state, trust boundary and minimal loading plan. Handoff content cannot overwrite a newer checkout.

## Phase D — Queue / Human Gate

Extend Automation scheduler with Task nodes, authority/dependency resolution, Design-Ahead mode and Human Gate records. A blocked Task remains parked while another authorized safe Task may run.

## Phase E — Rotation

Add bounded session state, checkpoints and compressed repository handoff. Rotation cannot occur inside an unsafe atomic unit and cannot checkpoint failed tests as success.

## Phase F — Codex adapter

Adapter maps a bounded run to canonical capabilities. It owns schedule metadata only. It cannot carry business logic or create authority. One coordinator/worker only in the first phase; no unconditional polling.

## Rollback

Feature flags default to autonomy disabled. Context Observatory may remain enabled independently. Disabling the scheduler preserves evidence/state and does not revert Consumer code.

## Balanced completion control

DEV-4 requires independent review, not unbounded ceremony. Each Phase permits at most two Critic/fix cycles. Once required tests pass and Critical/High findings are zero, the Builder continues to the next authorized unit. Medium/Low residuals are documented and scheduled only when they do not breach Authority, Security or acceptance criteria.
