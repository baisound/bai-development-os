# BAI Knowledge Hub Runtime Lock Candidate Policy Ver.1.0

Status: `IMPLEMENTED / CANONICAL_LOCK_PENDING_REMOTE_GENERATION`
Date: `2026-08-11`
Parent: `TASK-017 Phase 0 GitHub Actions Live Gate`

## Purpose

Treat the network-generated deployment runtime `package-lock.json` as untrusted supply-chain input until it passes deterministic policy checks.

## Required checks

An acceptable candidate MUST:

- use npm lockfile version 3,
- identify the runtime root as `bai-knowledge-hub-runtime` version `1.0.0`,
- retain the direct dependency `pg` exactly at `8.13.1`,
- resolve every installed package from `https://registry.npmjs.org/`,
- include SHA-512 integrity metadata for every installed package,
- contain no `git+`, `git:`, `file:`, `link:` or plaintext `http:` dependency source.

The check is deliberately narrower than a vulnerability scanner. SecurityOS/dependency review remains responsible for vulnerability/license policy; this gate prevents an unexpected source/provenance change from entering the deployment lock candidate.

## Promotion rule

A GitHub Actions-generated lock candidate is an artifact, not Canonical configuration. It may be committed only after:

1. this policy passes,
2. the real Docker/PostgreSQL rehearsal passes using the same lock candidate,
3. its SHA-256 matches the CI live-gate Evidence,
4. normal branch/PR review accepts the file.

Production activation remains blocked until an accepted lock is committed.
