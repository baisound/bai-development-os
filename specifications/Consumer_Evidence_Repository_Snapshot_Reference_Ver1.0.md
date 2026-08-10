# Consumer Evidence Repository Snapshot Reference Ver.1.0

Status: `TASK-016 PHASE0 RC2 CANONICAL PATTERN-C SOURCE PROFILE`

## Purpose

When the Consumer declares an immutable Git repository as its canonical source, Pattern C may bind provenance to a Git commit/tree rather than requiring a duplicate ad-hoc ZIP archive. The raw repository is not copied into Canonical Knowledge.

Canonical machine contract:

`schemas/knowledge-evolution/repository-snapshot-reference.schema.json`

## Required identity

- HTTPS repository URL with no embedded credential,
- Git ref observed,
- immutable `commit_sha`,
- immutable `tree_sha`,
- Product identity/version/task when known,
- Development OS version/Architecture when known,
- explicit observation timestamp.

## Validation coverage is separate from provenance identity

`validation.content_scan_status` is one of:

- `NONE`,
- `KEY_FILES_ONLY`,
- `FULL_TRACKED_CONTENT`.

An exact commit/tree can establish source identity even when the current connector only allows explicit key-file content verification. This MUST NOT be mislabeled as a full repository content/secret scan.

Key files carry path plus optional Git blob identifier and size. Path traversal is rejected. Repository URLs containing credentials are rejected.

## Intake behavior

`createKnowledgeIntakePackageFromRepositorySnapshot()` emits only sanitized Evidence/Candidates, review material and immutable repository provenance. It does not copy source files or a raw repository archive into `knowledge/intake`.

## BAI VIDEO PRODUCTION first validation

The first reference uses the Product canonical GitHub repository at immutable commit/tree identity and explicitly verified `PROJECT.md`, `.bai-os/project.json` and `docs/ai-team/current-state.md`. The resulting intake records `KEY_FILES_ONLY`; this is truthful validation coverage, not a claim that all tracked content was locally scanned.
