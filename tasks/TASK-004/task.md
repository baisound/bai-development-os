TASK-004 — AI Development OS Lifecycle Foundation

0. Document Control

Document Type: Canonical Task Definition

Task ID: TASK-004

Version: 1.0

Status: APPROVED_FOR_DESIGN

Current Phase: TASK_DEFINITION_COMPLETE

Gate Status: READY

Authorization Status: NOT_REQUIRED

Implementation Authorization: NOT_AUTHORIZED

Parent Architecture: AI_Development_OS_Architecture_設計書_Ver1.1_統合準備版.docx

Detailed Design Input: TASK-004_AI_Development_OS_Lifecycle_Foundation_詳細設計書_Ver1.1_レビュー反映版.docx

Boundary Input: TASK-004_TASK-005_責務境界_統合設計レビュー_Ver1.0.docx

This task definition authorizes the design review workflow only.It does not authorize implementation, source-code modification, system-file modification, archive migration, or policy updates.

1. Objective

Define, review, approve, and then implement the Lifecycle Foundation that allows AI Development OS to determine, record, verify, pause, resume, complete, and archive Tasks safely and reproducibly.

The Lifecycle Foundation must provide a single authoritative model for:

Task lifecycle status

Current workflow phase

Gate evaluation

Implementation and operation authorization

State transition history

Pause, block, stall, resume, and rollback

Context selection and protection

Cost and model control

Closure readiness

Archive readiness

Historical-evidence-preserving migration

2. Background

AI Development OS v2.1 Alpha established the Workspace architecture, Common Specifications, Role Specifications, templates, and Git-based historical control.

TASK-004 is the next milestone. It formalizes the operating lifecycle required before the Knowledge Operating System and full automation can be safely implemented.

This Task must preserve all previously approved principles, including:

Canonical six-role separation

Final Plan authority

Explicit implementation authorization

Evidence-first decisions

Independent testing and review

Project Policy review and VERIFY

Historical evidence preservation

Human authority over irreversible or high-risk actions

Safe stop when state, authority, cost, evidence, or policy is uncertain

3. Canonical References

The following sources remain authoritative within their defined scopes.

3.1 Parent architecture

AI Development OS Architecture Ver.1.1 integrated-preparation edition

Overall layers

Subsystem boundaries

Canonical-source ownership

Lifecycle / Knowledge interface

Workspace Registry positioning

TASK-004 Safe Execution Contract

3.2 Existing canonical book chapters

The existing Ver.1.3 Alpha canonical chapters remain authoritative for:

Workspace and project boundaries

Document hierarchy and authority

Standard design-to-implementation workflow

Orchestrator responsibilities

Final Plan authority

Final Plan Consistency Check

Implementation Authorization

Post-implementation QA

Project Policy review

Evidence and historical records

TASK-003 to TASK-004 migration background

The architecture overview does not shorten, replace, or remove those canonical workflows.

3.3 Detailed lifecycle design

TASK-004 detailed design Ver.1.1 is the design input for:

Orthogonal status model

Canonical Status Record

Transition Log

Revision and lease control

Atomic updates

Recovery

Context control

Cost control

Model routing

Closure and archive

3.4 TASK-004 / TASK-005 boundary

The boundary review is authoritative for:

Knowledge Resolution Request

Knowledge Pack integration

Knowledge Candidate handoff

Invalid Knowledge Impact Notice

Context Manifest ownership

Lifecycle and Knowledge status separation

4. Active Scope

TASK-004 is divided into six design and implementation phases.

4.1 Phase 1 — Canonical State Foundation

Define and implement:

task_status

current_phase

gate_status

authorization_status

archive_status

Canonical Status Record

Append-only Transition Log

Revision number

Expected revision

Lease or equivalent short-lived update ownership

Atomic transition protocol

Transition Matrix

Invalid-transition rejection

Concurrent-update rejection

VERIFY-before-COMMIT behavior

Required atomic protocol:

PREPARE

AUTHORIZE

ACQUIRE_LEASE

APPLY

VERIFY

COMMIT

RELEASE_LEASE

A failed VERIFY must not replace the current canonical state.

4.2 Phase 2 — Pause, Block, Stall, Resume, and Rollback

Define and implement:

PAUSED

BLOCKED

STALLED

Resume Checkpoint

Checkpoint validity and invalidation

Emergency Stop

Rollback

Compensating Action

Progress Stall / Handoff integration

Process and environment restoration checks

4.3 Phase 3 — Context Control

Define and implement:

Context Manifest

Duplicate Context Detector

Canonical / Trusted / Reference / Untrusted handling

Freshness

Checksum

Sensitivity

Protected-area control

Active Project boundary enforcement

Context invalidation

Token estimation and reduction

Knowledge Resolution Request

Knowledge Pack integration point

Knowledge Pack must enter execution through Context Manifest. It must not bypass Context Guard.

4.4 Phase 4 — Cost and Model Control

Define and implement:

Cost Budget

Cost Reservation

Actual Usage Ledger

Cost Reconciliation

Soft limit

Hard limit

Attempt limit

Time limit

Human review budget

Capability-based Model Routing

Context-capacity requirement

Privacy requirement

Tool-support requirement

Availability requirement

Independence requirement

Fallback and escalation

A hard limit must stop new execution until authorized.

4.5 Phase 5 — Closure, Archive, and Historical Migration

Define and implement:

Closure Readiness

Closure Record

Accepted Risk

Residual Risk

Deferred Risk

Resolved Risk

Follow-up Task generation

Knowledge Candidate handoff

Resource cleanup

Cost reconciliation

Archive Readiness

Archive Destination

Archive Procedure

Archive Manifest

Retention rule

Reference-integrity verification

Checksum verification

Archive rollback

Post-archive VERIFY

TASK-003 legacy-state mapping

TASK-003 migration without rewriting historical evidence

4.6 Phase 6 — System Synchronization

Only after approved design, implementation, independent QA, final judgment, and policy approval:

Update AGENTS.md when required

Update Common Specifications

Update Role Specifications

Update Vocabulary Specification

Update Authority Specification

Update Evidence Specification

Update Artifact Specification

Update Workflow Specification

Update templates

Update related README files

All system-file changes must follow:

DETECT → PROPOSE → APPROVAL → UPDATE → VERIFY

5. Out of Scope

TASK-004 does not implement:

Knowledge Asset schema

Knowledge Governance

Knowledge Graph

Knowledge Promotion or Demotion

Knowledge Curator role

Workspace Registry

Full Automation Engine

Monitoring Dashboard

External MCP, GitHub, or production connectors

Full video-production automation

Full audio-production automation

Rewriting historical TASK-001, TASK-002, or TASK-003 artifacts

These belong to TASK-005 or later Tasks.

6. Canonical Core Roles

The canonical team remains:

Orchestrator

Builder

Tester

Critic

Judge

Project Policy Agent

A Domain Reviewer may be added as a supplemental reviewer when specialized expertise is required. It does not become a seventh canonical core role and does not replace Critic, Judge, Project Policy Agent, or Owner authority.

7. Role Responsibilities for TASK-004

Orchestrator

Resolve Active Project and Active Task

Confirm current lifecycle phase

Confirm required artifacts

Route work to the correct role

Enforce stop conditions

Prevent implementation before authorization

Maintain the design workflow order

Builder

Produce Phase-specific design proposal

Respond to every Critic issue

Produce Final Plan after Judge approval

Implement only the authorized phase

Record implementation and handoff evidence

Critic

Review state-model completeness

Detect transition contradictions

Detect authority gaps

Detect race conditions and recovery gaps

Review context, cost, model, closure, and migration risks

Avoid implementation

Tester

Independently verify implemented lifecycle behavior

Test valid and invalid transitions

Test revision conflicts

Test failed VERIFY behavior

Test pause, block, stall, resume, and rollback

Record observed evidence only

Judge

Issue binding design decision

Perform Final Plan Consistency Check

Issue final implementation decision

Keep unresolved Critical and High issues visible

Project Policy Agent

Detect policy and documentation gaps

Propose system-file updates

Separate proposal from approval

Apply approved updates only

VERIFY synchronization

Review Closure and Archive inputs

Owner

Approve Task scope

Approve irreversible or high-risk actions

Approve policy changes

Approve Mandatory deviations

Approve hard-budget exceptions

Trigger and release Emergency Stop

8. Workspace and File Boundaries

8.1 Active Project

The Active Project must be explicitly confirmed before any Task operation.

Expected current project structure:

projects/<project_name>/
├─ PROJECT.md
├─ src/
└─ docs/
   └─ ai-team/
      ├─ config/
      ├─ templates/
      └─ tasks/
         └─ TASK-004/

8.2 Allowed design paths

During the design phase, modification is limited to the TASK-004 task directory and explicitly approved design-document locations.

8.3 Protected paths

Before Implementation Authorization, do not modify:

src/

Production code

AGENTS.md

Common Specifications

Role Specifications

Shared templates

Completed TASK-001–003 artifacts

Other projects

Protected workspace areas

8.4 Historical evidence

TASK-001–003 artifacts are read-only historical evidence.

New lifecycle records may reference or map them. They must not be silently edited to look as though the new lifecycle model existed at the time.

9. Required Design Workflow

TASK-004 must follow this complete sequence:

Confirm Active Project and Active Task

Approve this task.md

Builder creates builder-proposal.md

Critic creates critic-review.md

Builder creates builder-response.md

Judge creates judge-decision.md

Builder creates final-plan.md

Judge creates final-plan-consistency-check.md

Confirm FINAL_PLAN_PASS

Obtain explicit Implementation Authorization

Builder implements the authorized phase only

Tester creates test-report.md

Critic creates implementation-review.md

Builder fixes issues when authorized

Tester creates retest-report.md when required

Judge creates final-implementation-decision.md

Project Policy Agent creates project-policy-review.md

Apply approved system changes

VERIFY all updates

Evaluate Closure Readiness

Evaluate Archive Readiness

No shortened sequence may be treated as equivalent unless the Owner explicitly approves a documented exception.

10. Required Design Artifacts

task.md

builder-proposal.md

critic-review.md

builder-response.md

judge-decision.md

final-plan.md

final-plan-consistency-check.md

11. Required Implementation and QA Artifacts

implementation-report.md or approved implementation-handoff.md

test-report.md

retest-report.md when required

implementation-review.md

final-implementation-decision.md

project-policy-review.md

Policy verification evidence

closure-readiness.md

closure-record.md

archive-readiness.md

archive-record.md

12. Phase 1 Design Deliverables

The first Builder Proposal must address Phase 1 only.

It must include:

Exact enum values

Japanese explanation of every enum and schema field

Data types

Required and optional fields

Default values

Nullability

Validation rules

Transition Matrix

State invariants

Invalid transition examples

Revision conflict examples

Lease lifecycle

Lease timeout and recovery

Atomic update sequence

VERIFY failure handling

Append-only Transition Log format

Checksum usage

Audit fields

Migration compatibility

Unit-test and integration-test strategy

Rejected alternatives and reasons

Phase 1 must not silently design or implement later phases.

13. Acceptance Criteria

13.1 State and Transition

Task status, current phase, gate status, and authorization status are independently represented.

Invalid transitions are rejected.

Concurrent updates cannot silently overwrite canonical state.

Transition history is append-only.

Every committed transition has actor, reason, evidence, authorization, time, and revision.

Failed VERIFY does not replace current canonical state.

Completed and Archived Tasks cannot return to ACTIVE under the same Task ID.

13.2 Recovery

PAUSED, BLOCKED, and STALLED have distinct meanings and resume conditions.

Resume Checkpoint records file state, Git state, environment, process state, authorization, and remaining budget.

Invalid Checkpoints are rejected.

Emergency Stop prevents new side effects.

Irreversible actions use authorization and compensating actions.

13.3 Context

Active Project boundaries are enforced.

Protected areas are not read or changed without permission.

Duplicate, stale, conflicting, untrusted, and unauthorized context is detected.

Mandatory context is not removed by token reduction.

Knowledge Pack is integrated through Context Manifest.

13.4 Cost and Model

Budget and actual usage are separate.

Soft and hard limits behave differently.

Hard limit stops new execution.

Model routing records capability, context, privacy, cost, tool support, availability, and independence.

Builder and independent reviewers do not share hidden conversational assumptions.

13.5 Closure and Archive

Closure checks technical evidence, policy verification, unresolved risk, follow-up work, resource cleanup, actual cost, and Knowledge Candidate handoff.

Accepted Risk is not recorded as Resolved.

Residual Risk is visible.

Archive requires destination, procedure, manifest, checksum, reference verification, retention, and rollback.

TASK-003 can be mapped into the new model without editing its historical artifacts.

13.6 System Synchronization

System files are not updated before approved Final Plan and required authority.

Every system-file update is verified.

Architecture, Common Specifications, Roles, Vocabulary, Authority, Evidence, Artifact, Workflow, README, and templates remain consistent.

Historical evidence remains unchanged.

14. Stop Conditions

Stop and request Owner decision when:

Canonical sources conflict

The Active Project or Active Task is not confirmed

Required evidence is missing

A protected path must be accessed

Mandatory rules or required knowledge are missing

Revision or lease conflict cannot be safely resolved

The hard cost limit is reached

An irreversible external action is required

A policy change requires approval

A Mandatory deviation is requested

TASK-003 migration meaning is ambiguous

A Critical or High issue remains unresolved

VERIFY fails repeatedly

The Builder repeats the same action without new evidence

15. TASK-003 Migration Acceptance

TASK-004 must prove that the new lifecycle can represent TASK-003 safely.

Required migration evidence:

Legacy status mapping

New Canonical Status Record

References to unchanged historical artifacts

Policy review state

Accepted, Residual, Deferred, and Resolved Risk

Closure Readiness

Archive Destination

Archive Procedure

Checksum and reference verification

Knowledge Candidate handoff

Rollback or recovery procedure

The migration must add new records. It must not rewrite TASK-003 history.

16. Completion Definition

TASK-004 is complete only when:

All approved phases are implemented.

Independent Tester evidence is complete.

Critic implementation review is complete.

Judge final implementation decision passes.

Project Policy review is complete.

Approved system-file updates are applied.

All updates pass VERIFY.

Canonical Status Record and Transition Log are valid.

Closure Readiness is PASS.

Follow-up Tasks are created where required.

Knowledge Candidates are handed off.

Archive Readiness is evaluated.

TASK-003 migration acceptance passes.

No unresolved Critical or High issue remains.

17. Immediate Next Action

The next authorized action is:

Builder creates the Phase 1 builder-proposal.md.

Implementation remains NOT_AUTHORIZED.