# AI Development OS — Workspace-Level Specifications

This directory contains canonical specifications shared by every AI-managed project in the BAISOUND workspace.

## Directory roles

- `common/`: shared vocabulary, authority, evidence, artifact, and workflow rules.
- `roles/`: Role-specific operational specifications.

Project-specific tasks, templates, configuration, evidence, and history remain under:

```text
projects/<project-name>/docs/ai-team/
```

## Precedence

1. Approved AI Development OS design and Lifecycle Specification
2. Workspace-level common specifications
3. Workspace-level Role specification
4. Project-specific `PROJECT.md`
5. Active task artifacts and current authorized prompt
6. Temporary notes
7. Historical discussion

A project-specific rule may add a constraint, but it MUST NOT silently weaken a workspace-level safety or authorization rule.

## Modification rule

All AI-managed projects may read this directory.

Agents MUST NOT modify this directory unless the user explicitly authorizes a workspace-level specification update.

## TASK-004 reservation

The final Lifecycle Specification, Canonical Status Record, Closure Readiness, Archive Readiness, Resume, Rollback, Context, Cost, and Model-control rules will be formalized by TASK-004.

Until then, the existing workflow specification is authoritative operational guidance but does not invent final lifecycle states.
