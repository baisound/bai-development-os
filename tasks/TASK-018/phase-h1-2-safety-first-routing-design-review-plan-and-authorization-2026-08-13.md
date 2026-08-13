# TASK-018 Phase H1.2 — Safety-first Routing Design, Review Plan and Authorization

Date: `2026-08-13`
Authorization: `LOCAL_IMPLEMENTATION_AUTHORIZED`

## Purpose

Connect verified Context Cost observations to routing only after Authority, DEV Profile, Security/Safety, Model Control, capability, quality, provider and budget eligibility have passed. This is deterministic OS Core routing, not Phase H2 empirical Policy optimization.

## Boundaries

- consumes route eligibility produced by existing Authority/Capability/Model/Cost boundaries;
- does not lower DEV/Security/Safety/quality floors;
- does not authorize paid or native execution;
- does not activate a policy or change model/vendor configuration;
- does not inspect or mutate BAI VIDEO PRODUCTION;
- Context Cost is a tie-breaker among already safe quality-equivalent routes only.

## Allowed Files

- `src/automation/safety-first-routing.mjs`
- `src/automation/index.mjs`
- `schemas/automation/autonomy-route-decision.schema.json`
- `tests/automation/safety-first-routing*.test.mjs`
- exact TASK-018/Registry state and Evidence documents

## Gate

`SAFETY_FIRST_ROUTING_PASS` requires focused/full regression PASS and unresolved Critical/High `0/0`. It does not complete Phase G or H2.
