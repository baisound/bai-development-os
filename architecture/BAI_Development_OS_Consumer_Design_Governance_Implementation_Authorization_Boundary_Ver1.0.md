# BAI Development OS — Consumer Design Governance Implementation Authorization Boundary Ver.1.0

## Status

`IMPLEMENTATION_NOT_AUTHORIZED / CANDIDATE_ALLOWED_FILES_DEFINED`

This is Artifact 17 of the design mandate. It defines the only acceptable Foundation implementation surface for a later Owner authorization; it does not itself grant that authorization.

## Required authorization binding

A valid future authorization must contain:

- Owner-allocated Task ID;
- SHA-256 of the accepted detailed design;
- accepted Architecture/roadmap decision reference;
- exact files below;
- DEV-4 test and Critic requirements;
- expiry/revocation and stop conditions.

## Candidate Foundation Allowed Files

Source:

- `src/design-governance/constants.mjs`
- `src/design-governance/errors.mjs`
- `src/design-governance/contracts.mjs`
- `src/design-governance/repository.mjs`
- `src/design-governance/service.mjs`
- `src/design-governance/index.mjs`
- `src/index.mjs`
- `package.json`

Schemas:

- `schemas/design-governance/handoff-intake-manifest.schema.json`
- `schemas/design-governance/handoff-revalidation-report.schema.json`
- `schemas/design-governance/source-curation-record.schema.json`
- `schemas/design-governance/implementation-coverage-record.schema.json`
- `schemas/design-governance/design-gap-register.schema.json`
- `schemas/design-governance/roadmap-impact-record.schema.json`
- `schemas/design-governance/design-completeness-report.schema.json`
- `schemas/design-governance/regression-surface-record.schema.json`
- `schemas/design-governance/interaction-acceptance-record.schema.json`
- `schemas/design-governance/improvement-candidate-routing-record.schema.json`

Tests:

- `tests/design-governance/contracts.test.mjs`
- `tests/design-governance/service.test.mjs`
- `tests/design-governance/repository.test.mjs`
- `tests/design-governance/security.test.mjs`
- `tests/design-governance/recovery.test.mjs`
- `tests/design-governance/integration.test.mjs`

Task Evidence paths cannot be finalized until the Owner allocates the Task identity. They must be added explicitly to the later authorization and must not use a guessed `TASK-019` path.

## Explicitly excluded

- existing TASK-016/017/018 files except separately authorized status references;
- Architecture Ver.2.29 triplet;
- current Canonical Architecture promotion;
- Consumer repositories and production projects;
- WebMCP implementation;
- provider, paid, release, tag, deploy and Production Activation surfaces;
- any file not listed by the final Owner authorization.

## Stop conditions

Stop on an unknown local change, changed baseline HEAD, Task collision, unresolved Critical/High, schema incompatibility, secret detection, ambiguous source ownership, external unknown state, missing real/native Evidence for a native claim or any Authority conflict.

## Current gate

`NOT_AUTHORIZED` because Owner roadmap acceptance, Task identity and design-checksum binding are absent.
