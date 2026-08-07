# TASK-004 Phase 1.5 — Git Repository Boundary Recovery Check
## Read-only Repository Discovery Before Tester Re-test 08 Retry

## 1. Document Control

| Item | Value |
|---|---|
| Authoring Role | Orchestrator |
| Active Project / Task | `javascript-roulette` / `TASK-004` |
| Phase | `1.5 — Context Guard Core MVP` |
| Objective | Read-only confirmation of the Git Repository boundary after Independent Tester Re-test 08 reported that the expected project root was not a Git repository. |
| Authorization | Repository discovery only. Repository modification, Git initialization, repair, Tester retry, source/test work, and Git writes are prohibited. |
| Allowed persistent output | This newly created workflow artifact only. |
| Result | `EXPECTED_ROOT_IS_VALID_REPOSITORY` |

## 2. Evidence Reviewed

- `AGENTS.md`
- `projects/ai-team/roles/README-Orchestrator.md`
- Applicable common specifications: Common, Vocabulary, Authority, Evidence,
  Artifact, and Workflow.
- `PROJECT.md` and `docs/ai-team/tasks/TASK-004/task.md`.
- `phase1.5-context-guard-independent-test-retest-08.md`.
- Read-only runtime, expected-path, direct Git-probe, marker, and content-identity
  observations recorded below.

## 3. Runtime Identity

| Item | Observed value | Result |
|---|---|---|
| Runtime | Linux `6.18.33.2-microsoft-standard-WSL2` | PASS |
| `HOME` | `/home/baisound` | PASS |
| Hostname | `PC-BAIS` | OBSERVED |
| WSL distribution | `Ubuntu` | OBSERVED |
| Expected root realpath | `/home/baisound/projects/javascript-roulette` | PASS |
| Filesystem type | `ext4` | PASS |
| Mount source | `/dev/sdd` | PASS |
| `/home/baisound`, `/home/baisound/projects`, and expected root mount | All resolve to `/dev/sdd` / `ext4` | PASS |

No Windows path, UNC path, PowerShell, or external runtime was used.

## 4. Expected Path and Git Metadata

The expected project root exists and resolves without a symlink:

```text
/home/baisound/projects/javascript-roulette
```

Its `.git` entry is an accessible directory, not a worktree `gitdir:` reference
file. The expected project markers are present:

```text
package.json
src
tests
docs/ai-team/tasks/TASK-004
```

## 5. Direct Git Probes

All probes ran read-only from `/home/baisound` against
`/home/baisound/projects/javascript-roulette`.

| Probe | Observed output | Exit code | Result |
|---|---|---:|---|
| `git -C <root> rev-parse --is-inside-work-tree` | `true` | 0 | PASS |
| `git -C <root> rev-parse --show-toplevel` | `/home/baisound/projects/javascript-roulette` | 0 | PASS |
| `git -C <root> rev-parse --git-dir` | `.git` | 0 | PASS |
| `git -C <root> rev-parse HEAD` | `eb37ebd4900eb7192d72ab74a761e56d46f378a1` | 0 | PASS |
| `git -C <root> branch --show-current` | `main` | 0 | PASS |
| `git -C <root> status --short` | Existing Phase 1.5 allowlist worktree changes observed | 0 | OBSERVED |
| `git -C <root> remote -v` | `origin` is `https://github.com/baisound/javascript-roulette.git` for fetch and push | 0 | OBSERVED |

The expected HEAD and branch exactly match the Owner-provided baseline.

## 6. Project Content Identity

All required paths are present at the expected root. Read-only SHA-256 observations:

```text
c4105b43e51091b274c9be513495c899fb58bec894a5103902da2993ffc4b831  package.json
d37d82345d61269dde8ce05b445d695f30aa84ed4f97b43cb6f67497251801b7  src/lifecycle/phase1/index.mjs
756c44bf609f2169e361500c37d571ab4dcf3791299670cb8f66f01fe4fef236  tests/lifecycle/phase1/lifecycle-store.test.mjs
48d301884adf9dab3592b115c6fe9de4582ebc465a8ed76c8460352b82374aa8  docs/ai-team/tasks/TASK-004/phase1.5-context-guard-scope-amendment.md
2c76ffd10f9b4ca7d70eb848d79830245e8501d8f13253fb329b36d13737363c  docs/ai-team/tasks/TASK-004/phase1.5-context-guard-permit-preflight-boundary-remediation.md
```

Because the expected root itself satisfies all Git identity and project-marker
conditions, no alternate repository root is selected. A broader home-directory
candidate search is unnecessary for this classification.

## 7. Classification and Root Cause

```yaml
classification: EXPECTED_ROOT_IS_VALID_REPOSITORY
selected_canonical_project_root: /home/baisound/projects/javascript-roulette
baseline_match:
  expected_head: eb37ebd4900eb7192d72ab74a761e56d46f378a1
  observed_head: eb37ebd4900eb7192d72ab74a761e56d46f378a1
  result: PASS
branch_match:
  expected_branch: main
  observed_branch: main
  result: PASS
worktree_gitdir_reference: NONE
root_cause_of_previous_not_a_repository_result: NOT_CONFIRMED
```

The current independent evidence disproves a persistent absence of `.git` at the
expected root. It does not establish the cause of the earlier command's
`not a git repository` output; no repair or mutation was attempted.

## 8. Routing Envelope and Completion Pause

| Field | Value |
|---|---|
| Current Phase | Phase 1.5 Git Repository Boundary Recovery Check completed; Tester Re-test 08 retry has not started. |
| Gate Readiness | `NOT_READY` |
| Active Project | `javascript-roulette` |
| Active Task | `TASK-004` |
| Authorization Status | Repository discovery `AUTHORIZED`; Tester retry `NOT_AUTHORIZED_IN_THIS_SESSION`; all repository mutation remains prohibited. |
| Next Role | Owner / Orchestrator decision |
| Reason | The expected repository baseline is confirmed, but a new explicit Tester retry authorization is required. |
| Files To Read | This check, Re-test 08 blocked artifact, F-CG-01 remediation artifact, and applicable Tester/common specifications. |
| Allowed Files | NONE in this session beyond this completed artifact. |
| Prohibited Files | `.git` metadata; source; tests; schemas; configuration; existing evidence; runtime state; Status; Registry; and Git state. |
| Exact Prompt To Send | NONE — Owner must separately issue the authorized Tester Re-test 08 Retry 01 prompt. |
| Expected Artifact | A separately authorized Tester re-test artifact, if Owner directs. |
| Validation | New Tester session must rerun its mandatory preflight from the confirmed root before any test command. |
| Stop Conditions | Any baseline mismatch, staged change, unapproved/unknown worktree path, missing evidence, failed preflight, or missing retry authorization. |
| Next Gate | Owner authorization for Tester Re-test 08 Retry 01. |

No Git repair, initialization, clone, worktree action, Tester retry, source/test
change, Critic/Judge action, Git write, Phase 1.6, or Phase 5A was started.

## 9. Required Parent Output

```text
Completed Role: Orchestrator
Result: EXPECTED_ROOT_IS_VALID_REPOSITORY
Created File: docs/ai-team/tasks/TASK-004/phase1.5-git-repository-boundary-check.md

Runtime: Linux 6.18.33.2-microsoft-standard-WSL2 / ext4 / /dev/sdd
Hostname: PC-BAIS
WSL Distribution: Ubuntu
Expected Root Exists: PASS
Expected Root Realpath: /home/baisound/projects/javascript-roulette
Expected Root Filesystem: ext4 /dev/sdd
Expected Root .git Type: directory

Expected Root Git Probe: PASS
Expected Root Git Exit Code: 0

Repository Candidates:
- Root: /home/baisound/projects/javascript-roulette
  Git Type: directory
  Branch: main
  HEAD: eb37ebd4900eb7192d72ab74a761e56d46f378a1
  Project Markers: PASS
  Phase 1.5 Evidence: PASS
  Status: expected-root repository confirmed; existing worktree changes observed

Selected Canonical Project Root: /home/baisound/projects/javascript-roulette
Selection Evidence: Git top-level, main branch, expected HEAD, project markers, and required Phase 1.5 artifacts all match
Baseline Match: PASS
Branch Match: PASS
Content Identity: PASS
Worktree Status: existing Phase 1.5 changes observed; no Git write performed

Root Cause: NOT_CONFIRMED — current evidence confirms the repository exists but does not explain the earlier failed probe
Safe Recovery: Owner may issue a new bounded Tester Re-test 08 Retry 01 authorization; no repository repair is indicated by this check
Tester Retry Readiness: NOT_AUTHORIZED_IN_THIS_SESSION
Owner Approval Required: YES
```

Completion pause: stop pending Owner confirmation. Do not repair or initialize Git,
clone, create a worktree, retry Tester Re-test 08, modify source or tests, start
Critic/Judge work, write Git state, or start Phase 1.6 or Phase 5A.
