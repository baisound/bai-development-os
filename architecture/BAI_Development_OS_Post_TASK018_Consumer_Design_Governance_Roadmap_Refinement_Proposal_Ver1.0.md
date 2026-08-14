# BAI Development OS — Post-TASK-018 Consumer Design Governance Roadmap Refinement Proposal Ver.1.0

## Document Control

- Status: `OWNER_REVIEW_REQUIRED / ROADMAP_REFINEMENT_PROPOSAL / NO_IMPLEMENTATION_AUTHORITY`
- Date: `2026-08-14`
- Target product: `BAI Development OS`
- Trigger source: BAI VIDEO PRODUCTION実制作・UI再設計・Visual Prompt / Visual Compliance関連のConsumer feedback
- Current verified OS baseline from attached snapshot:
  - `TASK-018: COMPLETED`
  - `BAI Development OS v1.1.0: RELEASE_PUBLISHED`
  - `TASK-017: PAUSED / SEPARATE OWNER RESUME REQUIRED`
  - `TASK-016 Phase 1+: NOT_AUTHORIZED`
- This document DOES NOT create, authorize, renumber, reopen, release or deploy a Task.

---

# 1. Why the roadmap needs to be rearranged

TASK-018 closed the Codex Autonomy P0 foundation and published OS v1.1.0. The next historical route would normally return to the paused TASK-017 Phase 0 route under a fresh Owner decision.

However, the latest Consumer work exposed a separate cross-cutting OS gap:

> BAI Development OS can preserve handoffs, Evidence, Knowledge Candidates and task state, but the next development cycle also needs a governed mechanism that **independently revalidates a Consumer handoff against the current repository, identifies already-implemented surfaces, detects missing requirements, proposes new capability gaps, calculates roadmap impact, and refuses implementation until complete detailed design exists**.

This is not a BAI VIDEO PRODUCTION runtime feature. It is a reusable BAI Development OS development-governance capability.

The need is demonstrated by the current Consumer exercise:

- a handoff may contain correct observations, stale assumptions, already-implemented items and unrelated Product details at the same time;
- a UI request may actually require schema migration, authority changes, continuity changes or existing Application Service reuse;
- an apparently complete handoff can still be incomplete;
- syntax/static PASS can miss real interaction defects;
- roadmap insertion may be required before continuing previously queued work;
- a receiving Agent must not treat the handoff as Authority or as a complete requirement set.

Therefore the roadmap requires an explicit post-TASK-018 refinement before more work is resumed under the old intake assumptions.

---

# 2. Recommended insertion point

## 2.1 Recommended order

```text
TASK-018
COMPLETED / OS v1.1.0 RELEASED
        |
        v
POST-TASK-018 ROADMAP RECONCILIATION GATE   <-- INSERT HERE
        |
        |-- independent current-repository audit
        |-- Consumer handoff revalidation
        |-- existing-implementation coverage map
        |-- missing-feature / gap discovery
        |-- roadmap dependency/insertion analysis
        |-- complete detailed design package
        |
        v
OWNER ROADMAP DECISION
        |
        +--> if a separate OS boundary is accepted:
        |      allocate a new canonical Task
        |      (candidate next identity may be TASK-019,
        |       but this proposal does NOT assign it)
        |
        v
FOUNDATION SLICE IMPLEMENTATION / ACCEPTANCE
        |
        v
TASK-017 RESUME DECISION
        |
        v
TASK-017 bounded Phase 0 resume
        |
        v
TASK-016 Phase 1+ when separately authorized/evidence-ready
        |
        v
TASK-017 Phase 1+ advanced Knowledge evolution
```

## 2.2 Why before TASK-017 resume

TASK-017 is already parked at a safe checkpoint and its own resume contract requires a fresh Git/authority audit and patch revalidation.

This is the lowest-risk insertion point for a cross-cutting governance improvement. Implementing the minimum Consumer Design Governance foundation before resuming TASK-017 means later work can use the stronger handoff/revalidation/design-completeness rules instead of repeating the old process.

This proposal does NOT authorize or cancel TASK-017. Production activation remains separately gated.

## 2.3 Bounded alternative if Owner wants minimum delay

If full implementation would delay an urgent authorized TASK-017 external gate, split the proposed capability:

### Immediate mandatory foundation before TASK-017 resume
- independent handoff revalidation;
- existing-implementation coverage mapping;
- roadmap impact decision;
- design completeness gate;
- regression/acceptance plan.

### Later advanced slice
- automated feature-gap suggestion ranking;
- cross-Consumer recurrence analytics;
- Knowledge/TASK auto-candidate aggregation;
- richer roadmap simulation.

The advanced slice can integrate with TASK-017 Phase 1+ after real Consumer Evidence exists.

---

# 3. Candidate OS capability boundary

Recommended working name:

`Consumer Design Intake, Roadmap Reconciliation & Acceptance Assurance OS`

A canonical TASK identity must be allocated only after Owner/Governance collision and scope audit.

This capability SHOULD compose existing:

- KnowledgeOS / Knowledge Evolution intake
- MaintenanceOS drift/revalidation
- CalibrationOS evidence-based recommendations
- TASK-018 Handoff Bootstrap / Context Cost / Human Gate Parking / Capability routing
- Registry / Document Registry
- Security / Evidence / Authority

It MUST NOT duplicate those subsystems.

---

# 4. New functions that appear necessary

The receiving OS team must independently verify whether every item below is truly missing. These are **candidate capabilities**, not assumed implementation gaps.

## 4.1 Handoff Intake Manifest

Machine-readable intake describing:

- source artifact identities and hashes;
- supplied date/version;
- claimed source repository/version;
- Consumer/project identity;
- attachment classification;
- provenance completeness;
- source freshness;
- claimed assumptions;
- known missing source;
- sensitivity;
- canonical-authority flag = false by default.

Purpose: a handoff becomes inspectable Evidence, not trusted prose.

---

## 4.2 Handoff Revalidation Engine

Before using a handoff for design or implementation:

1. identify current repository HEAD / branch / worktree;
2. load current Registry and Canonical architecture;
3. verify referenced files/tasks still exist;
4. compare handoff claims with current code/docs/tests;
5. classify every claim:
   - `CONFIRMED_CURRENT`
   - `CONFIRMED_HISTORICAL`
   - `ALREADY_IMPLEMENTED`
   - `PARTIALLY_IMPLEMENTED`
   - `SUPERSEDED`
   - `CONFLICTS_WITH_CURRENT_CANONICAL`
   - `UNVERIFIED`
   - `MISSING_EVIDENCE`
6. block implementation on unresolved Critical ambiguity.

---

## 4.3 Scope / Relevance Curation

Input packages may contain unrelated Product artifacts.

The OS needs a governed curation output:

```text
USED_AS_OS_REQUIREMENT_INPUT
USED_AS_CONSUMER_EVIDENCE_ONLY
USED_AS_HISTORICAL_PROVENANCE
OUT_OF_SCOPE_FOR_OS
SUPERSEDED
NEEDS_HUMAN_DECISION
```

Raw source remains preserved outside Canonical Knowledge where required; curation does not delete provenance.

---

## 4.4 Existing Implementation Coverage Mapper

For every incoming requested feature or behavior:

```text
Requirement
→ current Task owner
→ current Application Service / Module
→ current Schema / Store
→ current tests
→ current UI / Adapter
→ implementation state
→ exact modification surface
```

Purpose:

- stop greenfield reimplementation;
- detect when an apparently new UI requirement is actually a migration of an existing contract;
- identify existing safety/authority semantics that must not regress.

---

## 4.5 Roadmap Impact Analyzer

For every validated requirement, determine:

```text
NO_CHANGE
DOCUMENTATION_ONLY
EXISTING_TASK_FOLLOW_UP
EXISTING_SUBSYSTEM_EXTENSION
NEW_SEPARATE_TASK_CANDIDATE
ROADMAP_REORDER_REQUIRED
DEFER_TO_CONSUMER
REJECT_AS_DUPLICATE
REJECT_AS_OUT_OF_SCOPE
```

Output must include:

- dependencies;
- insertion point;
- blocked tasks;
- tasks that do not need to be reopened;
- safe checkpoint;
- migration needs;
- Owner gates;
- expected roadmap consolidation changes.

It may recommend but never autonomously authorize a new Task.

---

## 4.6 Missing-Feature / Design-Gap Discovery

The OS must not only check whether the handoff is correct.

Critic/Architect review must actively ask:

- What required capability is not mentioned?
- What data model does this UI imply?
- What migration is required?
- What happens on recovery/restart?
- What becomes stale?
- What is the Human Authority?
- What is the cost/paid-operation boundary?
- What can fail after dispatch?
- What needs idempotency?
- What is the rollback path?
- What current feature could regress?
- What is missing for native/user acceptance?
- What source was not supplied?
- Which assumptions have not been verified?

The output is a `Design Gap Register`, not silent internal reasoning.

---

## 4.7 Detailed Design Completeness Gate

No implementation authorization for a cross-cutting requirement until **complete detailed design** exists.

The design package must cover, where applicable:

1. Problem / user workflow
2. Existing implementation audit
3. Ownership / product boundary
4. Domain model
5. Schema/versioning
6. Store/persistence
7. migration + backward compatibility
8. Application Service boundaries
9. Capability / command mapping
10. Role/Gate/Authority
11. Human Gate
12. cost/budget
13. credential/security/privacy
14. Provider/adapter capability
15. idempotency/retry/unknown-state
16. stale-state rules
17. recovery/restart
18. Evidence
19. observability/KPI
20. UI/interaction contract
21. native/real-environment acceptance
22. accessibility where UI exists
23. regression surface
24. test matrix
25. rollout/canary
26. rollback
27. documentation/registry synchronization
28. deprecation/removal policy
29. Context loading plan
30. exact allowed files for implementation slice

The Gate must fail if sections are merely omitted because the handoff did not mention them.

---

## 4.8 Regression Surface Inventory

Before modifying a mature Consumer or OS subsystem, capture:

- existing visible functions;
- existing commands;
- existing state transitions;
- existing tests;
- current native evidence;
- current menu/panel/shortcut behaviors;
- security/authority invariants.

After implementation, verify the inventory again.

This specifically prevents adding one feature while silently deleting previously working functions.

---

## 4.9 UI / Interaction Acceptance Evidence

For UI-affecting Consumer pilots, static syntax checks are insufficient.

Acceptance capability should support or require evidence for:

- actual button response;
- focus behavior;
- click-vs-drag semantics;
- scroll behavior;
- panel clipping;
- native picker/dialog behavior;
- DPI/window-size behavior;
- long-content/long-timeline behavior;
- recovery after navigation;
- no dead controls;
- accessibility labels where applicable.

The exact Consumer UI contract remains Consumer-owned; OS owns the reusable acceptance/evidence discipline.

---

## 4.10 Consumer Improvement Candidate Lifecycle

Consumer findings should flow:

```text
Consumer observation
→ independent validation
→ scoped Improvement Candidate
→ recurrence / severity / reproducibility
→ Critic adjudication
→ roadmap impact
→ Owner decision
→ Task / Knowledge / Reject / Defer
```

A single user correction must not become global OS policy automatically.

---

## 4.11 Unknowns / Confidence Register

Every intake should explicitly record:

- `KNOWN_CONFIRMED`
- `KNOWN_UNVERIFIED`
- `UNKNOWN_REQUIRED_SOURCE`
- `ASSUMPTION`
- `CONFLICT`
- `OWNER_DECISION_REQUIRED`

A report that says only “reviewed and OK” is not sufficient for a complex handoff.

---

# 5. Mandatory non-trust rule

## 5.1 Handoff is input, not Authority

Receiving Agents MUST NOT conclude:

> “The handoff says this is correct, therefore it is correct.”

Instead:

```text
Handoff
→ provenance/freshness check
→ current Registry/Architecture check
→ current code/test check
→ contradiction/missing-source search
→ existing-implementation mapping
→ gap discovery
→ Critic review
→ only then design baseline
```

## 5.2 The handoff may be incomplete even when correct

The receiving team must search for:

- omitted safety requirements;
- omitted migrations;
- omitted existing implementation;
- missing related Task ownership;
- related functionality that will be broken;
- missing tests;
- missing UI acceptance;
- missing failure paths;
- missing data retention/privacy;
- missing cost/authority boundaries;
- stale version claims.

“Nothing contradicts the handoff” is not equivalent to “the handoff is complete.”

---

# 6. Current BAI Development OS findings that must be rechecked at kickoff

The attached snapshot currently shows:

- Registry: TASK-018 completed and OS v1.1.0 published.
- TASK-017 remains paused pending a separate Owner resume route.
- Architecture Ver.2.29 Part XV still contains TASK-018 wording from its active P0 era.
- `PROJECT.md` also contains older TASK-018 active wording in places.

This suggests document-state drift is possible even inside a valid release snapshot.

Therefore the next roadmap update must first run:

- Document Registry;
- Current State / PROJECT / Architecture consistency check;
- roadmap consolidation check;
- release-state reconciliation.

Do not patch historical evidence to make it look current. Add/promote a new canonical refinement through normal governance.

---

# 7. Existing OS ownership that should be reused

## TASK-005 KnowledgeOS
Use for Candidate/Knowledge lifecycle; do not auto-promote intake findings.

## TASK-012 MaintenanceOS
Reuse drift detection / revalidation principles.

## TASK-014 CalibrationOS
Use recurrence/evidence to calibrate recommendations, never weaken mandatory floors.

## TASK-016 Phase 0
Already contains secure Consumer snapshot/intake provenance and explicitly refuses to guess missing facts. Extend/reuse rather than create a second Consumer snapshot format.

## TASK-017
Owns advanced cross-project Knowledge evolution/federated evidence. The new intake governance should feed validated Improvement Evidence into it later; do not stuff new design-governance implementation into TASK-017 Phase 0 deployment scope.

## TASK-018
Already completed Handoff Bootstrap, Context Cost, Human Gate Parking, Session Rotation and bounded Capability execution. Reuse these mechanisms. Do not reopen TASK-018.

---

# 8. BAI VIDEO PRODUCTION / Visual Prompt / WebMCP boundary

The attachments include valuable Consumer-specific material, but OS ownership must remain clean.

## Remain Consumer-owned

- Visual Prompt Director prompt semantics;
- Character/Space/Composition frame binding;
- video/image generation model details;
- NLE timeline interactions;
- BGM/Narration production semantics;
- Visual Compliance Scene Contract fields specific to BVP.

## OS-owned reusable concerns

- intake validation;
- roadmap reconciliation;
- design completeness;
- generic Capability/Gate/Evidence;
- Human Gate;
- cost-aware execution;
- improvement candidate routing;
- acceptance evidence;
- learning from validated recurring failures.

## WebMCP

Remains Experimental Adapter. Do not make this roadmap refinement dependent on WebMCP.

---

# 9. Roadmap mutation rules

If Owner accepts this proposal:

1. do not edit historical roadmap addenda;
2. create a new post-TASK-018 roadmap refinement source;
3. update the next Architecture canonical, not Ver.2.29 in place;
4. update Part XV Current Consolidated Roadmap Authority losslessly;
5. update Current State / PROJECT / AI Context Pack;
6. update roadmap consolidation source registry/checker;
7. calculate the new expected roadmap source count from the actual registered source bodies — do not guess the count;
8. preserve TASK-016/017/018 identities;
9. if a new Task is created, allocate its identity only after Registry collision check and Owner decision.

---

# 10. Required next work — full detailed design, not immediate implementation

The receiving BAI Development OS team is instructed to:

> **Perform an independent current-state audit and produce the complete detailed design for every accepted capability in this proposal before implementation.**

The design must not merely reformat this handoff.

It must:

- challenge the proposed boundaries;
- identify existing code that already solves parts of the problem;
- identify missing capabilities not listed here;
- reject duplicates;
- determine exact Task ownership;
- decide whether a new Task is actually justified;
- define all schemas, migrations, Application Services, state machines, tests and acceptance gates;
- reconcile with current main, not this snapshot alone.

Only after Critic/Judge/Owner acceptance should implementation begin.

---

# 11. Exit criteria for the roadmap-reconciliation gate

Minimum PASS:

- current repository and canonical state independently verified;
- all source artifacts classified by relevance/trust/freshness;
- existing implementation coverage map complete;
- missing/gap register created;
- proposed roadmap insertion adjudicated;
- exact task ownership decided;
- complete detailed design accepted;
- regression surface captured;
- security/authority/cost/recovery boundaries accepted;
- no unrelated Consumer detail moved into OS Core;
- no completed Task reopened without explicit reason/authority;
- next implementation slice has exact allowed files/tests;
- unresolved Critical/High = `0/0`.

---

# 12. Recommendation

**Recommended Owner decision:** introduce the Consumer Design Governance roadmap-reconciliation foundation immediately after TASK-018 completion and before the next TASK-017 resume decision.

Reason:

- TASK-017 is already safely parked;
- TASK-018's autonomy/handoff foundation is now available to build on;
- the new requirement is cross-cutting and will improve every later Consumer-driven development cycle;
- delaying it until after more Product/Knowledge work risks repeating incomplete or stale handoff interpretation.

The first action is detailed design and independent audit, not code and not production deployment.
