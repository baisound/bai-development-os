# BAI Knowledge Hub GitHub Actions Live Gate Specification Ver.1.0

Status: `IMPLEMENTED / REMOTE_EXECUTION_PENDING`
Date: `2026-08-11`
Parent: `TASK-017 Phase 0 — Consumer Evidence Hub Pilot Transport Slice`

## 1. Purpose

Provide a real Docker/PostgreSQL gate without depending on a developer workstation. The gate runs the existing disposable live-rehearsal harness on a GitHub-hosted Ubuntu runner, produces sanitized machine Evidence, and creates a runtime dependency lock candidate for review.

## 2. Security boundary

The workflow uses `permissions: contents: read`. It never uses `pull_request_target`, never activates the Compose `public` profile, and receives no Product/Hub production credential. External-fork pull requests execute only the static/contract job. The real container rehearsal runs only on trusted same-repository pull requests, pushes to `main`, or explicit `workflow_dispatch`.

This separation is required because a public OSS repository must treat forked pull-request code as untrusted. Maintainers can review an external contribution and then run the live gate from a trusted branch or manual dispatch.

## 3. Contract job

Every matching PR/push/manual run executes:

- Knowledge Hub focused tests,
- deployment readiness static check,
- PostgreSQL tuning static check,
- CI live-gate contract check.

No Docker side effect is required for this first job.

## 4. Live rehearsal job

The trusted job verifies Docker/Compose availability, creates a deployment-runtime `package-lock.json` candidate from the exact `pg=8.13.1` direct dependency, then executes `deploy/knowledge-hub/scripts/run-live-rehearsal.sh`.

A pass therefore covers the existing live gate: migration/readiness, authenticated Evidence submit/retry/partial reject, idempotency, credential revocation, PostgreSQL persistence, backup, isolated restore, API restart readiness, and disposable resource cleanup. Public Caddy/TLS activation remains forbidden.

## 5. Dependency reproducibility bridge

The Dockerfile accepts `deploy/knowledge-hub/runtime/package-lock.json` when present and uses `npm ci`. If the lock is absent it retains the current non-production fallback `npm install` path. GitHub Actions generates the lock candidate before Docker build, so the actual live rehearsal uses the locked dependency graph.

The generated lock is uploaded as an artifact for review. It does not become Canonical merely because CI generated it. Production activation still requires reviewing and committing an accepted lockfile through the normal branch/PR process.

## 6. Machine Evidence

The workflow uploads:

- `live-rehearsal.json`,
- `ci-live-gate.json`,
- generated runtime `package-lock.json` candidate.

`ci-live-gate.json` binds repository, exact commit SHA, run id/attempt/event, runtime lock SHA-256, and the sanitized live rehearsal result. It contains no database password, Product API key, TLS secret, raw Consumer content, or raw backup file.

## 7. Exit interpretation

A successful GitHub Actions run can satisfy the previously environment-blocked **real Docker/PostgreSQL rehearsal gate** for the exact commit under test. It does not authorize or prove Production VPS, DNS, TLS, production credential issuance, or BAI VIDEO PRODUCTION real-user Pilot.
