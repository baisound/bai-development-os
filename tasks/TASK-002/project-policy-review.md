# TASK-002 Project Policy Review

## Review Scope and Evidence

This review assesses policy changes only. It does not modify production code and does not reopen TASK-002.

The final implementation decision records `IMPLEMENTATION_APPROVED`, `COMPLETED`, `PRODUCTION_READY`, zero unresolved issues, Final Plan Compliance `PASS`, and Test Sufficiency `PASS_WITH_ACCEPTED_RISK`.

Documentation-integrity observation: the file named `test-report.md` currently identifies itself as an `Implementation Handoff Report` and records multiple test categories as `NOT_EXECUTED` or `NOT_CONFIRMED`. No separate `implementation-report.md`, `implementation-handoff.md`, or `retest-report.md` exists. The final decision remains authoritative for TASK-002's completed status, but future workflow policy must require correctly named, role-authored evidence artifacts and must not infer a passing test report from a handoff.

## AGENTS.md Update Required

YES

### Proposed Changes

1. Add formal roles for Orchestrator, Tester, and Project Policy Agent.
2. Add the post-implementation workflow: Builder implementation; implementation report or handoff; independent Tester verification and `test-report.md`; Critic implementation review; Builder fixes when required; Tester retest when required; Judge final implementation judgment; Project Policy Review.
3. Make the following task artifacts part of the standard structure:
   - exactly one of `implementation-report.md` or `implementation-handoff.md`;
   - `test-report.md`;
   - `implementation-review.md`;
   - `implementation-fix-report.md` only when production code is changed after implementation review;
   - `retest-report.md` only when a fix requires retesting;
   - `final-implementation-decision.md`;
   - `project-policy-review.md`.
4. Define artifact authorship and independence: Builder writes implementation and fix reports; Tester writes test and retest reports; Critic writes the implementation review; Judge writes the final implementation decision; Project Policy Agent writes the policy review. A report must identify its authoring role, evidence, commands or procedures, result, and unresolved items.
5. Replace the current generic post-implementation statements with explicit completion gates: independent test evidence exists or is explicitly `NOT_CONFIRMED`; Critical and High implementation issues are resolved; Judge issues a final implementation decision; then Project Policy Review records lessons and required policy changes.
6. Add progress-stall detection, handoff, and tester command-stall rules.
7. Add the development-server verification rule: a persistent server is verified by ready/startup evidence plus HTTP reachability, not by an exit code.
8. Clarify that project-root development support files such as `package.json`, `package-lock.json`, `vite.config.js`, and `.gitignore` are permitted project configuration; application source remains limited to `src/`.

### Reason

The current policy defines Builder, Critic, and Judge and requires tests and implementation review, but it does not define the independent Tester, evidence files, final implementation judgment, policy feedback loop, or reliable handling of persistent processes. TASK-002 exercised each missing boundary. Formalizing them workspace-wide prevents role ambiguity and makes future completion claims auditable.

## PROJECT.md Update Required

YES

### Proposed Changes

1. Change Project Status from `New Development` to `Version 1 Completed`.
2. Do not use `Version 1 Released`: no release, deployment, tag, or distribution evidence was reviewed.
3. Preserve the Version 1 Fixed Architecture unchanged.
4. Add a Development Tool section:
   - Tool: Vite
   - Development server: `http://localhost:8080`
   - WSL2 start command: `npm run dev`
   - Server verification: Vite ready log plus an HTTP response from the configured URL.
5. Add a Development Support Files section for `package.json`, `package-lock.json`, `vite.config.js`, and `.gitignore`, including their roles.
6. Add an Accepted Risks reference to a project-level risk register rather than putting detailed mutable risk text in PROJECT.md. The initial register entry should record the absence of persistent automated regression tests, its accepted status for Version 1, and the recommended follow-up task.

### Reason

`package.json` and `vite.config.js` confirm Vite, port 8080, and `npm run dev`; `package-lock.json` and `.gitignore` support reproducible local development. These are project-specific facts. The completed task justifies Version 1 completion, but not a release claim. The fixed architecture was approved and implemented without unresolved issues, so it must remain the Version 1 baseline.

## TASK-002 task.md Update Required

YES

### Proposed Changes

1. Change `Status` from `FINAL_PLAN_REVISION` to `COMPLETED`.
2. Add final historical fields:
   - `Final Plan Consistency Status: FINAL_PLAN_PASS`
   - `Final Implementation Decision: IMPLEMENTATION_APPROVED`
   - `Implementation Readiness: PRODUCTION_READY`
   - `Final Implementation Authorization: APPROVED`
   - `Task Completion Status: COMPLETED`
3. Retire or clearly label all former “current”, “next required action”, and `NOT AUTHORIZED` content as superseded historical design-stage state; it must not remain presented as current.
4. Add links or relative references to `test-report.md`, `implementation-review.md`, `final-implementation-decision.md`, and this policy review.

`Implementation Authorization: COMPLETED` is not recommended. Authorization is an approval state, while completion is a task lifecycle state. Preserve `Final Implementation Authorization: APPROVED` and record completion separately.

## Standard AI Team File Structure Update Required

YES

### Recommended Structure

```text
projects/<project-name>/
├── PROJECT.md
├── package.json
├── package-lock.json
├── vite.config.js
├── .gitignore
├── src/
└── docs/
    ├── risk-register.md
    └── ai-team/
        ├── README-Orchestrator.md
        ├── README-Builder.md
        ├── README-Tester.md
        ├── README-Critique.md
        ├── README-Judge.md
        ├── README-Project-Policy.md
        └── tasks/
            └── <TASK-ID>/
                ├── task.md
                ├── builder-proposal.md
                ├── critic-review.md
                ├── builder-response.md
                ├── judge-decision.md
                ├── final-plan.md
                ├── final-plan-consistency-check.md
                ├── implementation-report.md        # exactly one of this or handoff is required
                ├── implementation-handoff.md       # alternative to implementation-report.md
                ├── test-report.md
                ├── implementation-review.md
                ├── implementation-fix-report.md    # only if fixes are made
                ├── retest-report.md                # only if retesting is required
                ├── final-implementation-decision.md
                └── project-policy-review.md
```

The explicit `final-plan-consistency-check.md` is recommended because the existing workflow requires the result but does not reserve an evidence artifact for it.

## Orchestrator Agent Policy Update Required

YES

### Proposed Rules

1. Confirm Active Project, Active Task, required gates, and the responsible next role before each phase transition.
2. Route work to the designated role; the Orchestrator does not replace Builder, Tester, Critic, Judge, or Project Policy independence.
3. Verify that the expected artifact exists, has the expected authoring role, and has an unambiguous result before advancing.
4. When work stalls or an artifact is missing/misnamed, record the state and route a handoff instead of treating absence of evidence as success.
5. Do not reopen a completed task for a follow-up improvement; create a new Task ID.

## Tester Agent Policy Update Required

YES

### Proposed Rules

1. Tester is independent of Builder implementation and produces `test-report.md`; Tester produces `retest-report.md` after a reported fix when retesting is required.
2. Separate results into `PASS`, `FAIL`, and `NOT_CONFIRMED`; never report unexecuted or unobserved work as PASS.
3. Record test scope, environment, commands or procedures, observed output, limitations, and residual risks.
4. Verify planned automated tests when they exist and run manual/browser/server checks appropriate to the feature.
5. A test report cannot substitute for an implementation handoff, and an implementation handoff cannot substitute for independent test evidence.

## Progress Stall / Handoff Policy Required

YES

### Proposed Rules

1. Treat a command as stalled when it has no expected progress or completion within its documented or reasonable expected duration, or when it is a known persistent process and no verification action follows.
2. Do not repeat the identical stalled command without new evidence or a changed hypothesis.
3. Builder must stop implementation-phase waiting, record executed work, changed files, known results, open verification items, process state, and the next recommended role in `implementation-handoff.md`.
4. The handoff transfers verification responsibility to Tester; it does not convert unverified work into a pass.
5. For a command that requires user-only action or whose output cannot be observed, Tester may accept user-provided evidence with the source and limitations recorded, or mark the item `NOT_CONFIRMED`.

## Development Server Verification Policy Required

YES

### Proposed Rules

1. Classify development servers, watchers, and preview servers as persistent processes.
2. Do not judge a successful persistent process by a normal exit code; a normal exit is usually absent until deliberately stopped.
3. Record the exact start command, configured URL and port, ready/startup log, and an HTTP reachability result such as `curl -I` or an equivalent browser request.
4. If the server is deliberately stopped after verification, record that fact separately from the verification result.
5. If startup log or HTTP verification is unavailable, report `NOT_CONFIRMED`, not PASS.

## Accepted Risk Handling

The absence of persistent automated regression tests should be managed in a project-level **Risk Register** (`docs/risk-register.md`), with a concise reference from PROJECT.md and a concrete follow-up task. It should not be recorded only in TASK-002 because the risk persists beyond the completed task, and PROJECT.md should not become a mutable issue tracker.

The register entry should include: risk description, affected functions, accepted scope (Version 1), severity/priority, decision date and authority, mitigation, and the follow-up task reference.

## New Follow-up Task Recommended

YES

Recommended Task ID: `TASK-003`

Recommended Title: `Automated Regression Test Foundation`

Purpose: Add durable, independently runnable tests for `normalizeCandidates`, `validateCandidates`, `calculateStopAngle`, `calculateNextRotation`, and `getRandomIndex`, including rejection-sampling boundaries and cumulative-rotation cases. Select the smallest compatible test approach through the normal design workflow. TASK-002 remains `COMPLETED` and is not reopened.

## Project Status Recommendation

Current: `New Development`

Recommended: `Version 1 Completed`

## Policy Classification

### Workspace-wide

- AGENTS.md role definitions, phase gates, artifacts, stall/handoff rules, persistent-server verification, and project-root development-support-file allowance.
- Reason: these establish reusable governance and evidence standards for every AI-managed project.

### Project-wide

- PROJECT.md status, fixed architecture retention, Vite development information, and development support files.
- `docs/risk-register.md` entry for automated regression-test coverage.
- Reason: these describe JavaScript Roulette's lifecycle, tooling, and ongoing risk rather than one task's history.

### Task-specific

- TASK-002 `task.md` completion metadata and superseded-state correction.
- TASK-002 `project-policy-review.md` and the existing task evidence artifacts.
- Reason: these preserve the completed task's audit history and do not prescribe policy for future tasks by themselves.

## Files To Update

After user approval:

- `/home/baisound/AGENTS.md`
- `projects/javascript-roulette/PROJECT.md`
- `projects/javascript-roulette/docs/risk-register.md` (new)
- `projects/javascript-roulette/docs/ai-team/README-Orchestrator.md` (new)
- `projects/javascript-roulette/docs/ai-team/README-Tester.md` (new)
- `projects/javascript-roulette/docs/ai-team/README-Project-Policy.md` (new)
- `projects/javascript-roulette/docs/ai-team/tasks/TASK-002/task.md`

Created by this review:

- `projects/javascript-roulette/docs/ai-team/tasks/TASK-002/project-policy-review.md`

## Files Not To Update

- `projects/javascript-roulette/src/index.html`
- `projects/javascript-roulette/src/style.css`
- `projects/javascript-roulette/src/roulette.js`
- `projects/javascript-roulette/docs/ai-team/tasks/TASK-002/final-plan.md`
- `projects/javascript-roulette/docs/ai-team/tasks/TASK-002/implementation-review.md`
- `projects/javascript-roulette/docs/ai-team/tasks/TASK-002/final-implementation-decision.md`

Do not rename or overwrite the existing TASK-002 `test-report.md` during this policy update. Its filename/content mismatch is historical evidence; correct artifact naming is a forward-looking policy requirement. If a factual correction is ever needed, preserve the original and add a separately authored clarification rather than altering completed-task evidence.

## Final Recommendation

Approve the proposed policy update package. It closes the workflow gaps exposed by TASK-002, preserves TASK-002 as completed, retains the Version 1 architecture, and creates a distinct TASK-003 path for durable automated regression coverage. No production-code change is proposed or authorized by this review.

## Approved Update Execution Record

### Update Result

PASS

### Git Repository Status

NOT_CONFIRMED

Git repository initialization and Git-based change-range verification are outside TASK-002. No further `git rev-parse` or `git status` retry is required for this update.

### Execution Evidence

The update operation history confirms that only policy and documentation files were created or modified. The prohibited production source files and protected TASK-002 historical evidence files were not targeted by any update operation.

Production Code Changes: 0 files

Historical Evidence Modified: NO

### Policy Consistency Check

PASS

The adopted AGENTS.md rules, project documentation, risk register, role README files, and TASK-002 completion metadata are consistent with the approved Project Policy Review. TASK-002 remains COMPLETED.

### Project Setup Follow-up Recommendation

If source-control history is required, initialize and configure Git as a separate project-setup task. This is not an unresolved issue for TASK-002 and does not reopen it.

### Recommended Next Phase

TASK_COMPLETE
