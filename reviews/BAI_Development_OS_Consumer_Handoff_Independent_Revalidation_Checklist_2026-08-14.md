# BAI Development OS — Consumer Handoff Independent Revalidation Checklist
Date: 2026-08-14

Status: `MANDATORY_PRE-DESIGN_REVIEW_CHECKLIST`

## Rule

A Consumer handoff is evidence/input. It is never sufficient by itself to establish current Canonical truth.

## A. Repository truth

- [ ] Current checkout/root confirmed
- [ ] `git status --short --branch`
- [ ] HEAD / origin relation
- [ ] current Registry loaded
- [ ] current Architecture canonical loaded
- [ ] current Task statuses independently confirmed
- [ ] current release/version confirmed
- [ ] Document Registry / roadmap checker state confirmed

## B. Source package curation

For every supplied artifact:

- [ ] hash/identity recorded
- [ ] relevance classified
- [ ] OS-owned vs Consumer-owned classified
- [ ] date/version/freshness checked
- [ ] superseded copy identified
- [ ] conflicting claims identified
- [ ] missing source noted
- [ ] sensitive/raw content boundary checked

Allowed classifications:

- `OS_REQUIREMENT_INPUT`
- `CONSUMER_EVIDENCE`
- `HISTORICAL_PROVENANCE`
- `OUT_OF_SCOPE`
- `SUPERSEDED`
- `UNVERIFIED`
- `HUMAN_DECISION_REQUIRED`

## C. Claim revalidation

For each material claim:

- [ ] code inspected where applicable
- [ ] tests inspected
- [ ] owning Task identified
- [ ] current schema/store identified
- [ ] current UI/adapter identified
- [ ] already implemented?
- [ ] partially implemented?
- [ ] contradicts canonical?
- [ ] missing proof?

## D. Completeness challenge

Even if all supplied claims are true:

- [ ] missing data model?
- [ ] migration?
- [ ] compatibility?
- [ ] stale-state behavior?
- [ ] recovery?
- [ ] idempotency?
- [ ] unknown-state timeout?
- [ ] security/privacy?
- [ ] authority/human gate?
- [ ] cost/paid boundary?
- [ ] provider capability?
- [ ] evidence?
- [ ] observability?
- [ ] regression?
- [ ] native/UI acceptance?
- [ ] accessibility?
- [ ] rollout/rollback?
- [ ] docs/registry/roadmap synchronization?

## E. Roadmap decision

- [ ] no-change / docs-only / extension / new-task candidate selected
- [ ] insertion point justified
- [ ] safe checkpoint identified
- [ ] existing paused/active tasks impact stated
- [ ] completed tasks not silently reopened
- [ ] new task identity not guessed
- [ ] Owner authorization requirement explicit

## F. Design gate

- [ ] complete detailed design exists
- [ ] independent Critic reviewed it
- [ ] Critical/High findings = 0/0 or explicit blocker
- [ ] exact implementation boundary defined
- [ ] tests and native acceptance defined
- [ ] no code execution authorized only by this checklist

## Specific current snapshot warning

The attached OS snapshot records TASK-018 as completed/released in `registry/current-state.md`, while some older top-level/architecture wording still reflects TASK-018 active-P0-era status. Treat that as a reconciliation target, not a reason to edit historical evidence in place.
