# Common Role Specification

## Status

Canonical common operational specification for all AI Development OS Roles.

## Scope

This document defines rules shared by every Role. Role-specific files MUST NOT duplicate these rules unless a short clarification is necessary.

## Required dependencies

Every Role MUST also load:

- `Vocabulary-Specification.md`
- `Authority-Specification.md`
- `Evidence-Specification.md`
- `Artifact-Specification.md`
- `Workflow-Specification.md`

## Core principles

1. Preserve Role independence.
2. Use saved, readable canonical artifacts as the primary source of truth.
3. Do not treat conversation summaries as stronger than saved evidence.
4. Do not infer authorization.
5. Do not report unverified work as completed.
6. Do not modify historical evidence.
7. Separate Project Status, Task Lifecycle Status, and Knowledge Asset Status.
8. Preserve accepted risks as risks until separately resolved.
9. Do not reopen a completed Task for deferred work; create or propose a new Task ID.
10. Stop when required evidence, authority, or scope cannot be confirmed.

## Canonical precedence

Apply this order:

1. approved AI Development OS specification,
2. approved Lifecycle Specification,
3. common specifications,
4. Role specification,
5. current authorized prompt,
6. temporary notes,
7. historical discussion.

## Common input expectations

A Role MUST identify, as applicable:

- Active Project,
- Active Task,
- current phase,
- applicable authorization,
- files to read,
- files allowed to modify,
- files prohibited from modification,
- expected artifact,
- required validation,
- stop conditions.

## Common output expectations

Every canonical artifact MUST include:

- Authoring Role
- Objective or Scope
- Inputs or Evidence Reviewed
- Commands or Procedures, when applicable
- Findings, Decisions, or Work Performed
- Result
- Unresolved Items
- Known Limitations, when applicable
- Handoff or Next-Gate Information, when applicable

## Historical evidence rule

Historical task evidence is read-only.

Corrections or later interpretations MUST be placed in a new clarification, policy review, status record, or follow-up task. They MUST NOT overwrite historical artifacts.

## Context minimization rule

Load only the common specifications required by the active Role and phase. Do not load unrelated project history unless required to resolve ambiguity or verify a gate.

## Prohibited common behaviors

No Role may:

- impersonate another Role,
- create authority it does not hold,
- silently alter an approved architecture,
- convert an advisory recommendation into a workflow transition,
- mark an accepted risk as resolved without evidence,
- claim release, closure, or archive completion without the required evidence and authority.
