# TASK-010 BAI Development OS — Release, Distribution & Consumer Upgrade OS Detailed Design Ver.1.0

## Document Control

- Product: `BAI Development OS`
- Task: `TASK-010 — Release, Distribution & Consumer Upgrade OS`
- Version: `1.0`
- Status: `CURRENT_CANONICAL / COMPLETED`
- Development Profile: `DEV_4_FOUNDATION_CRITICAL`
- Effective Date: `2026-08-08`
- Canonical Root: `/home/baisound/bai-development-os`

## 1. Purpose and Authority Boundary

TASK-010 turns the local BAI Development OS into a reproducibly versioned, signed, installable, upgradeable, downgradeable and rollback-capable product. ReleaseOS owns release metadata, compatibility, migration planning, bundle verification and local installation transactions. It does not grant Owner authority, weaken SecurityOS, rewrite historical Knowledge/Monitoring evidence, or publish externally without an authorized external action.

## 2. Internal Phase Roadmap

1. Semantic Versioning and release identity.
2. Release Manifest and artifact integrity.
3. Trust Anchor bootstrap, rotation and retired-key rules.
4. Release Signing Ceremony and signed manifest.
5. Offline/Air-gapped Release Bundle.
6. Consumer compatibility and schema matrix.
7. Safe migration registry and dry-run upgrade preview.
8. Crash-consistent install/update transaction.
9. Downgrade and rollback checkpoint.
10. Portable Knowledge/Automation/Monitoring/Connector bundles.
11. Repository/Git tag/GitHub Release planning boundary.
12. Cache/Mirror/Registry acquisition strategy.
13. Canary health gate and deterministic promotion decision.
14. Diagnostic Bundle and post-install attestation.
15. Critic hardening, E2E regression and canonical synchronization.

## 3. ReleaseOS Architecture

`ReleaseOS` is exported at the product root. Primary modules are SemVer, Trust, Manifest, Bundle, Compatibility, Migration, Planner, Checkpoint, Installer, Canary, Diagnostic Bundle, Portable Component Bundle, Component Lock Manifest, Repository Release Plan and Release Service.

## 4. Semantic Versioning and Compatibility

Strict SemVer 2.0 parsing/comparison is used for upgrade/downgrade direction. Compatibility evaluates Consumer Adapter and Node bounds, subsystem schema versions, required migration handlers and Security Profile continuity. A caller cannot hide an already-enabled security requirement by supplying a weaker profile.

## 5. Signed Release Manifest

Release Manifest binds OS version, channel, artifact path/size/checksum, subsystem schemas, compatibility bounds, migrations, Security Profile, SBOM/dependency evidence and rollback target. Artifact paths are validated at manifest creation. Migrations that declare authorization broadening are rejected.

## 6. Trust Anchor Lifecycle

First trust bootstrap requires explicit Owner Authorization reference. Trust rotation must be signed by the currently trusted key and is serialized by a filesystem lock. The prior key becomes `RETIRED` with a retirement timestamp. A release signed after that timestamp by the retired key is rejected, while previously signed rollback releases remain verifiable.

## 7. Release Signing Ceremony

A signing ceremony record binds signer identity, key/version, approval evidence, release manifest checksum and artifact set. The ceremony is itself signed. This creates auditable release provenance without moving Owner Authority into ReleaseOS.

## 8. Offline / Air-gapped Bundle

The signed manifest is authoritative for the permitted file set. Release Bundle embeds declared artifacts for offline transport and has its own checksum. Missing, modified, duplicate or undeclared files fail verification. Cache, verified mirror and online registry acquisition are explicit alternatives; air-gapped mode never falls through to a live registry.

## 9. Migration and Upgrade Preview

Every mutation is preceded by a preview that reports direction, blockers, warnings, breaking changes, migrations and rollback target. Required migration handlers must exist. Security weakening blocks before mutation. Migration handlers may transform derived/consumer state but cannot declare authorization broadening.

## 10. Install / Update / Downgrade / Rollback

A filesystem release lock serializes local mutations. Before installation, ReleaseOS creates a checkpoint of affected files and previous release state. SecurityOS Journal performs the installation transaction. Downgrade and rollback require explicit Owner Authorization reference. Rollback restores prior files and removes files that did not exist before the target release.

## 11. Portable Subsystem Bundles

Portable bundles support `KNOWLEDGE_PACK`, `AUTOMATION_BOOTSTRAP`, `MONITORING_BUNDLE`, `CONNECTOR_LOCK` and generic payloads. They bind component version, schema version, provenance, sensitivity, compatibility and payload checksum, and may be signed.

## 12. Monitoring and Diagnostic Compatibility

Versioned Diagnostic Bundles carry schema/provenance metadata and recursively redacted content. Installation Attestation re-reads installed artifacts and proves path/size/checksum equivalence with the release manifest. Historical evidence is not rewritten during upgrade or rollback.

## 13. Connector and Component Locking

Component Lock Manifest deterministically pins component/name/version/API/checksum. Connector compatibility remains explicit in Release Manifest rather than silently following provider drift.

## 14. Repository Release Boundary

Repository Release Plan standardizes Git tag (`v<semver>`), release name, repository URL, remote/default branch, channel, artifacts and changelog. Actual GitHub publishing is an external side effect and therefore remains Owner-authorized through TASK-008 Integration.

## 15. Canary Promotion

Canary promotion requires sufficient samples, `HEALTHY` status, zero critical alerts and error rate at or below policy. Otherwise the decision is deterministic `HOLD`. Promotion does not happen merely because deployment succeeded.

## 16. Critic Findings Resolved

- serialized concurrent install/update operations;
- serialized Trust Anchor updates;
- blocked unsafe artifact paths at manifest boundary;
- rejected undeclared files in release bundle;
- prevented caller-supplied Security Profile from hiding current stronger policy;
- rejected new releases signed by a key after retirement;
- fixed Security Journal invocation contract;
- separated operation lock from component lock manifest;
- avoided signed-envelope reserved `payload_checksum` collision in portable bundles.

## 17. Accepted Residual / Future Ownership

- stale/crashed filesystem lock lease detection and automatic repair: TASK-012 / TASK-015;
- real multi-project/OS/platform conformance and package-manager matrix: TASK-011;
- release/update plugin/provider SDK and platform-native installers: TASK-013;
- evidence-driven canary/rollback/compatibility threshold calibration: TASK-014;
- distributed release coordination and cross-machine install locks: TASK-015;
- actual remote GitHub Release publishing remains Owner-authorized TASK-008 execution.

## 18. Verification Baseline

- TASK-010 Release tests: `91 / 91 PASS`.
- Full BAI Development OS: `716 / 716 PASS`.
- JavaScript Roulette Reference Consumer: `10 / 10 PASS`.
- Product Boundary: `PASS`.
- Roadmap Consolidation: `PASS (39 / 39)`.
- Security Conformance: `PASS (9 schemas)`.
- Release Conformance: `PASS (8 schemas)`.
- ReleaseOS root export: `PASS`.
- Blocking Critic findings: `0`.

## 19. Completion Status

TASK-010 is `COMPLETED`. TASK-011 — Multi-Project Conformance & Compatibility Lab is `NEXT / NOT_STARTED / NOT_AUTHORIZED`.
