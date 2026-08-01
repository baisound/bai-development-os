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
