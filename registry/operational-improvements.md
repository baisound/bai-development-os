# Operational Improvements Registry

## Purpose

This registry records improvements discovered through real operation. These items are not automatically authorized for implementation.

| ID | Improvement | Decision / Status | Planned integration |
|---|---|---|---|
| OP-001 | Canonical Document Reading Rules | Adopted in Artifact Specification | Architecture / Artifact governance update |
| OP-002 | Critic Review Mode | Adopt for Ver.1.2+ | Review Framework Specification |
| OP-003 | `builder-response-<review-mode>.md` naming | Adopt for Ver.1.2+ | Workflow, templates, vocabulary |
| OP-004 | TASK Completion Review | Adopt after TASK-004 Phase 1 | Closure workflow |
| OP-005 | Role Session Lifecycle | Highest priority | Context / Resume contract and later automation |
| OP-006 | Execution Timeout and Empty Command Detection | Highest priority | Session lifecycle and stall recovery |
| OP-007 | Context Economy | P0 | Summary-first, section loading, artifact cache |
| OP-008 | Cost Guard | P0 | Per-Task / per-Role budget, hard stop |
| OP-009 | AI Canonical Markdown | P0 | Markdown canonical copy plus DOCX human copy |
| OP-010 | Execution Model separation | Planned | Separate Role, Agent, Session, and execution topology |
| OP-011 | Capability-based Agent selection | Planned | Agent routing |
| OP-012 | Fix / Retest cycle-specific naming | Planned | Preserve repeated-cycle historical evidence |

## Mandatory Sustainability Principles

1. Context is a finite resource.
2. Tokens and API usage are budgeted resources.
3. A Role reads only the minimum necessary artifacts and sections.
4. Full Architecture and DOCX are not default inputs.
5. Session state must be disposable and recoverable from artifacts.
6. Budget exhaustion, timeout, empty commands, and repeated failed attempts trigger Safe Stop.
7. Cost reduction must not weaken authority, evidence, testing, or historical integrity.

## Product Extraction Addendum — 2026-08-08

| ID | Improvement | Decision / Status | Planned integration |
|---|---|---|---|
| OP-013 | Repository / Product Boundary Correction | Implemented in extraction working tree | Standalone `bai-development-os`; consumer adapters |
| OP-014 | Adaptive Development Governance | Core foundation implemented; verification required | DEV-0 through DEV-4 workflow-depth selector |
| OP-015 | Impact-scoped Revalidation | Adopted with Adaptive Governance | Avoid full workflow restart for localized fixes |

### Adaptive Governance Principle

Development assurance depth is proportional to system scale, feature scale, criticality, failure impact, reversibility, novelty, and high-risk boundaries. Cost reduction is achieved by removing unnecessary governance work, not by weakening tests for critical functions. The selector does not modify permanent model-routing policy.


## Post-TASK-004 Product Expansion Addendum — 2026-08-08

| ID | Improvement | Decision / Status | Planned integration |
|---|---|---|---|
| OP-016 | Shared Security / Path / Supply-chain Hardening | Roadmap reserved | TASK-009 |
| OP-017 | Reproducible Release / Distribution / Consumer Upgrade | Roadmap reserved | TASK-010 |
| OP-018 | Multi-project Consumer Conformance Lab | Roadmap reserved | TASK-011 |
| OP-019 | Canonical Drift Detection / Safe Auto-Repair | Roadmap reserved | TASK-012 |
| OP-020 | Domain Adapter / Plugin SDK | Roadmap reserved | TASK-013 |
| OP-021 | Adaptive Governance Calibration from operational Evidence | Roadmap reserved | TASK-014 |

These entries expand the product after TASK-008 and do not reopen TASK-004. All are `PROPOSED / NOT_STARTED / NOT_AUTHORIZED`.


## Post-TASK-005 Knowledge Expansion Addendum — 2026-08-08

| ID | Improvement | Decision / Status | Planned integration |
|---|---|---|---|
| OP-022 | Crash-consistent Knowledge mutation / journal fencing | Roadmap reserved | TASK-009 |
| OP-023 | Knowledge Pack release portability and schema/taxonomy migration | Roadmap reserved | TASK-010 |
| OP-024 | Cross-project Knowledge portability / isolation conformance | Roadmap reserved | TASK-011 |
| OP-025 | Knowledge repository fsck / recovery / compaction | Roadmap reserved | TASK-012 |
| OP-026 | Domain Knowledge extension points | Roadmap reserved | TASK-013 |
| OP-027 | Resolver / confidence / freshness evidence calibration | Roadmap reserved | TASK-014 |

No TASK-015 is created; these improvements extend existing reserved responsibility boundaries.
