# BAI Development OS

## Product ID

`bai-development-os`

## Canonical Root

```text
/home/baisound/bai-development-os
```

## Purpose

BAI Development OS is the reusable development foundation for multiple projects. It provides lifecycle state management, Context Guard, evidence and authority rules, adaptive development governance, reusable Roles, templates, schemas, and future knowledge/automation/monitoring/integration layers.

## Product Boundary

BAI Development OS is a standalone product. Consumer projects such as `javascript-roulette` are not development hosts for OS core functionality.

Consumer projects MAY contain a thin `.bai-os/` adapter and project-local Task evidence. They MUST NOT carry copies of OS core source, shared governance, shared Roles, or OS-owned Task history.

## Current OS Task

- `TASK-004`: AI Development OS Lifecycle Foundation

## Proposed Roadmap

- `TASK-005`: Knowledge OS
- `TASK-006`: Workspace Registry / Resolver / Automation foundation
- `TASK-007`: Monitoring & Dashboard
- `TASK-008`: External Integration

`TASK-009` is not currently defined in the canonical OS roadmap.

## Current Corrective Work

1. P0.0 — Repository / Product Boundary Correction
2. P0.1 — Adaptive Development Governance and Governance Economy
3. Resume authorized TASK-004 Phase 1.6 work after the corrective foundation is stable

## Runtime

Node.js >= 20.19.0

```bash
npm test
npm run check:boundaries
```
