# TASK-017 Phase 0 — GitHub Actions Live Gate Implementation Result — 2026-08-11

Status: `IMPLEMENTED / LOCAL_CONTRACT_PASS / REMOTE_EXECUTION_PENDING`

## Implemented

- Added path-scoped GitHub Actions workflow for Knowledge Hub changes.
- Added fork-safe split: all matching PRs run static contracts; real Docker/PostgreSQL execution is same-repository/manual/push only.
- Added read-only workflow permission and explicit prohibition of `pull_request_target` and public Compose activation.
- Added CI generation of the deployment runtime `package-lock.json` candidate and Docker `npm ci` consumption when the lock exists.
- Added sanitized CI live-gate Evidence builder/validator/schema bound to repository, commit, run id/attempt, runtime lock hash and live-rehearsal result.
- Added artifact retention for Evidence and the dependency lock candidate.

## Boundary

The current execution environment still has no Docker daemon, so the workflow itself cannot be remotely executed from this local staging branch until it is pushed to GitHub. Local tests verify the workflow contract and Evidence tooling, not the remote runner claim.

## Remaining

1. Push through normal PR flow.
2. Observe `BAI Knowledge Hub Live Gate / Real Docker and PostgreSQL rehearsal` on GitHub-hosted Ubuntu.
3. Download/inspect the generated lock candidate and commit it after review.
4. Bind the remote PASS Evidence to the TASK-017 Judge record.
5. Keep Production VPS/DNS/TLS/Product Pilot separately gated.
