# TASK-003 Provenance Exception Authorization

## Authorizing Role

Project Owner

## Decision

`AUTHORIZED_PROVENANCE_EXCEPTION`

## Evidence

- Project Owner assignment: `PROVENANCE_EXCEPTION_AUTHORIZATION`.
- `docs/ai-team/tasks/TASK-003/test-report.md`: current implementation inspection, `npm test`, build, Vite, HTTP reachability, and major browser/manual smoke checks are recorded as PASS; provenance was the unresolved blocker.
- `docs/ai-team/tasks/TASK-003/final-plan.md`: TASK-003’s permitted implementation paths and files-not-modified list.
- Baseline capture performed before creating this artifact:
  - Timestamp: `2026-07-24T19:27:13+09:00`
  - Repository root: `/home/baisound/projects/javascript-roulette`
  - `HEAD`: `a61f1f20f61df48cd4515f61e51bb3ad5d2e5b73`
  - Commands: `git status --porcelain=v1 -uall`, `git diff --name-status`, and `git diff --cached --name-status`.

## Commands or Procedures

1. Do not reconstruct or claim proof of the unavailable pre-resume state.
2. Record the Project Owner’s accepted exception and the current Git status below as the comparison baseline for work after this authorization.
3. Exclude the listed out-of-scope files from TASK-003 implementation evaluation.
4. Permit a Tester-only supplemental validation using a repository-external temporary `.test.mjs` file. It must run `node --test`, observe a non-zero exit from an intentional assertion failure, delete the file immediately, and record deletion confirmation in `test-report.md`.

## Missing Evidence

The following evidence was not saved before TASK-003 resumed:

- Complete `git status --short` output.
- Complete `git diff --name-status` output.
- Complete `git diff --cached --name-status` output.
- Capture timestamp.
- Authoring Role.
- A record proving the capture occurred before TASK-003 resumed.

## Known Facts

- The current TASK-003 test report records PASS for implementation inspection, `npm test` (10/10), `npm run build`, Vite startup, HTTP reachability, and major manual/browser smoke validation.
- No evidence currently identifies an implementation defect in TASK-003.
- The saved Final Plan defines TASK-003 implementation paths and explicitly prohibits modifications to TASK-002 artifacts.
- The following current working-tree state was captured before this artifact was created.

### Current Working-Tree Baseline

```text
 M docs/ai-team/README-Builder.md
 D docs/ai-team/README-Critique.md
 M docs/ai-team/README-Judge.md
 M docs/ai-team/README-Orchestrator.md
 M docs/ai-team/README-Project-Policy.md
 M docs/ai-team/README-Tester.md
 M docs/ai-team/tasks/TASK-002/test-report.md
 M package-lock.json
 M package.json
 M src/index.html
 M src/roulette.js
?? docs/ai-team/README-Critic.md
?? docs/ai-team/config/command-policy.yml
?? docs/ai-team/resume-check.mjs
?? docs/ai-team/tasks/TASK-003/builder-proposal.md
?? docs/ai-team/tasks/TASK-003/builder-response.md
?? docs/ai-team/tasks/TASK-003/critic-review.md
?? docs/ai-team/tasks/TASK-003/final-plan-consistency-check.md
?? docs/ai-team/tasks/TASK-003/final-plan.md
?? docs/ai-team/tasks/TASK-003/implementation-report.md
?? docs/ai-team/tasks/TASK-003/judge-decision.md
?? docs/ai-team/tasks/TASK-003/task.md
?? docs/ai-team/tasks/TASK-003/test-report.md
?? docs/ai-team/templates/builder-proposal.template.md
?? docs/ai-team/templates/builder-response.template.md
?? docs/ai-team/templates/critic-review.template.md
?? docs/ai-team/templates/final-implementation-decision.template.md
?? docs/ai-team/templates/final-plan-consistency-check.template.md
?? docs/ai-team/templates/final-plan.template.md
?? docs/ai-team/templates/implementation-fix-report.template.md
?? docs/ai-team/templates/implementation-handoff.template.md
?? docs/ai-team/templates/implementation-report.template.md
?? docs/ai-team/templates/implementation-review.template.md
?? docs/ai-team/templates/judge-decision.template.md
?? docs/ai-team/templates/project-policy-review.template.md
?? docs/ai-team/templates/retest-report.template.md
?? docs/ai-team/templates/task.template.md
?? docs/ai-team/templates/test-report.template.md
?? src/roulette-core.mjs
?? tests/roulette-core.test.mjs
```

`git diff --cached --name-status` produced no output. The unstaged tracked changes were:

```text
M	docs/ai-team/README-Builder.md
D	docs/ai-team/README-Critique.md
M	docs/ai-team/README-Judge.md
M	docs/ai-team/README-Orchestrator.md
M	docs/ai-team/README-Project-Policy.md
M	docs/ai-team/README-Tester.md
M	docs/ai-team/tasks/TASK-002/test-report.md
M	package-lock.json
M	package.json
M	src/index.html
M	src/roulette.js
```

## Unknown Facts

- Whether the listed out-of-scope differences existed before TASK-003 resumed.
- The author and originating task of each listed out-of-scope difference.
- Whether any listed out-of-scope difference was created by an activity unrelated to TASK-003.

This authorization does not treat any unknown fact as proven and does not create retrospective evidence.

## Affected Out-of-Scope Files

The following are excluded from TASK-003 implementation evaluation because their provenance cannot be established from pre-resume evidence:

```text
docs/ai-team/README-Builder.md
docs/ai-team/README-Critique.md
docs/ai-team/README-Critic.md
docs/ai-team/README-Judge.md
docs/ai-team/README-Orchestrator.md
docs/ai-team/README-Project-Policy.md
docs/ai-team/README-Tester.md
docs/ai-team/config/command-policy.yml
docs/ai-team/resume-check.mjs
docs/ai-team/templates/**
docs/ai-team/tasks/TASK-002/test-report.md
```

## Risk Accepted

Project Owner accepts the residual risk that the exact provenance of the listed out-of-scope files cannot be independently proven. This is a recordkeeping limitation, not evidence of a TASK-003 implementation defect.

## Evaluation Exclusions

- Do not classify the listed out-of-scope files as TASK-003 violations solely because their pre-resume provenance is unknown.
- Do not modify, delete, restore, or otherwise repair those files to resolve this exception.
- Do not treat this exception as evidence that the files predated TASK-003.
- Do not use this exception to waive validation of TASK-003’s approved source, test, package, lockfile, and runtime behavior.

## New Baseline Procedure

For all work after this authorization, compare the working tree against the timestamped status and name-status records in this artifact:

1. Run `git status --porcelain=v1 -uall`.
2. Run `git diff --name-status`.
3. Run `git diff --cached --name-status`.
4. Record the capture timestamp, `HEAD`, Authoring Role, command output, and task phase in a new task artifact before implementation resumes.
5. Treat changes not present in the Current Working-Tree Baseline as new changes requiring normal scope evaluation.

This artifact itself is an authorized TASK-003 workflow addition and is not part of the pre-authorization baseline.

## Authorization Date

2026-07-24T19:27:13+09:00

## Next Gate

`TESTER_VALIDATION_SUPPLEMENT`

## Result

`AUTHORIZED_PROVENANCE_EXCEPTION`

## Unresolved Items

- The historical provenance of the listed out-of-scope differences remains unknown and is accepted as a Project Owner residual risk.
- Supplemental independent verification of `node --test` failure exit behavior remains required.
