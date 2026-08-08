# TASK-009 BAI Development OS Security, Supply Chain & Integrity Hardening Detailed Design Ver.1.0

## Document Control

- Product: BAI Development OS
- Task: TASK-009 — Security, Supply Chain & Integrity Hardening
- Version: 1.0
- Status: CURRENT_CANONICAL
- Development Profile: DEV_4_FOUNDATION_CRITICAL
- Effective date: 2026-08-08
- Canonical root: `/home/baisound/bai-development-os`
- Machine canonical: this Markdown
- Human companion: `TASK-009_BAI_Development_OS_Security_Integrity_Ver1.0.docx`

## 1. Purpose

TASK-009 turns security and integrity controls that had accumulated inside Knowledge, Automation, Monitoring and External Integration into one reusable SecurityOS. It establishes common path safety, secret lifecycle, signing, crash-consistent mutation, tamper-evident evidence, replay protection, egress/DLP policy, supply-chain verification and security conformance without creating a second Lifecycle, Knowledge, Automation, Monitoring or Integration authority.

SecurityOS is a shared primitive layer. Subsystems consume it; they do not fork local security implementations when a common primitive exists.

## 2. Non-negotiable authority boundaries

1. TASK-004 remains Lifecycle, Guard and Cost authority.
2. TASK-005 remains Knowledge authority; SecurityOS protects Knowledge persistence but does not decide Knowledge status or scope.
3. TASK-006 remains Orchestration/Automation authority; SecurityOS verifies approval/outbox integrity but never grants authorization.
4. TASK-007 remains read-only Monitoring authority; SecurityOS protects monitoring persistence/privacy but does not make monitoring canonical.
5. TASK-008 remains External Integration authority; SecurityOS supplies credential, replay, egress, DLP and signing primitives.
6. Security verification failure is fail-closed. SecurityOS never guesses a canonical result after a torn or ambiguous write.
7. Single-machine/local operation remains first-class. Distributed security coordination remains TASK-015.

## 3. Internal phase roadmap

| Phase | Name | Primary outcome |
|---:|---|---|
| 1 | Security Authority & Threat Model | Shared ownership, trust, fail-closed rules |
| 2 | Canonical Serialization / Hash | Stable checksums and evidence binding |
| 3 | Trusted Root / Path Safety | traversal, symlink, realpath, atomic-write confinement |
| 4 | Credential / Vault Lifecycle | secret references, leases, rotation, revocation, expiry |
| 5 | Signing / Authorization / Provenance | Ed25519 envelopes and provider abstraction |
| 6 | Crash-consistent Journal / WAL | PREPARED/COMMITTING/COMMITTED recovery |
| 7 | Tamper-evident Ledger / Replay | signed hash chains and durable nonce protection |
| 8 | Knowledge Integrity Adapter | revision/pointer/event atomic mutation and recovery |
| 9 | Automation / Outbox Integrity | signed Owner Approval, outbox events and acknowledgements |
| 10 | Monitoring Integrity / Privacy | atomic monitoring persistence and secret redaction |
| 11 | External Integration Security | credential DLP, webhook replay, egress/SSRF boundary |
| 12 | Supply Chain / SBOM / Dependency Risk | signed manifests, SBOM and vulnerability policy |
| 13 | Sandbox / Fault Injection / Conformance | shared logical sandbox, negative tests, schemas |
| 14 | E2E / Critic / Completion | full regression, consumer verification, canonical sync |

All 14 phases are completed by TASK-009 Ver.1.0.

## 4. Shared canonical serialization and hashing

Security evidence uses deterministic stable serialization and SHA-256. Cryptographic envelopes sign the canonical payload, not object insertion order. Checksums are used to bind payload, journal operation, ledger records, supply-chain files and SBOM state.

## 5. Trusted Root and path safety

The shared path layer provides:

- relative-path normalization and traversal rejection;
- trusted non-symlink root verification;
- existing/writable path confinement using realpath;
- symlink rejection on every relevant path segment;
- atomic write using same-root temporary file, fsync and rename;
- revalidation immediately before commit and post-rename containment verification.

TASK-006 path helpers now delegate to this shared layer while preserving component-specific error contracts.

## 6. Credential and vault boundary

`Secret Reference` contains provider/id/version/metadata only. Secret-like material is recursively rejected from metadata. `InMemorySecretVault` demonstrates the provider contract with:

- scoped leases;
- maximum TTL;
- version binding;
- rotation;
- revocation;
- expiry.

Secret values are resolved only through a lease and are not persisted in references/evidence. The signing provider abstraction is designed so KMS/HSM-backed providers can replace local Ed25519 keys without changing callers.

## 7. Signing and provenance

Ed25519 canonical envelopes support:

- payload checksum;
- key id;
- signed-at timestamp;
- signature verification;
- expected-key binding.

SecurityOS exposes a signing-provider interface rather than hard-coding key storage. TASK-006 Owner Approval and Completion Outbox can require signed evidence by policy. Unsigned legacy/local mode remains compatible unless the Security profile explicitly requires signing.

## 8. Crash-consistent journal state machine

A transaction is persisted under `.bai-os/security/journal/<tx_id>` and moves through:

`PREPARED -> COMMITTING -> COMMITTED`

or, before commit starts:

`PREPARED -> ROLLED_BACK`

Rules:

- recovery requires an explicit COMPLETE or ROLLBACK decision;
- COMMITTING can only complete; rollback is forbidden because partial target mutation may already exist;
- operation temp checksum and committed target checksum are verified;
- CREATE refuses an unexpected pre-existing target;
- journal manifests are atomically persisted;
- torn/corrupt temp state fails closed.

## 9. Knowledge crash consistency

TASK-005 Knowledge revision mutation is upgraded to a single Security journal transaction containing:

1. immutable revision file CREATE;
2. current pointer REPLACE;
3. full chained event-log REPLACE.

Repository verification refuses to proceed when PREPARED/COMMITTING journals remain and returns `KNOWLEDGE_RECOVERY_REQUIRED`. Recovery is explicit; canonical Knowledge is never guessed from partial files.

## 10. Tamper-evident ledgers and replay protection

Security Ledger provides hash-chain integrity, atomic persistence and optional mandatory signatures. Replay protection uses a durable namespace+nonce ledger with lock-protected check-and-record so concurrent identical webhook events cannot both be accepted.

Replay TTL/freshness is explicit. A replay namespace may bind provider/project/event ownership.

## 11. Automation integrity

TASK-006 integration adds:

- optional signed Owner Approval requirement;
- signature/key binding verification before automation execution;
- signed Completion Outbox event verification;
- optional signed derived-sync acknowledgements;
- atomic acknowledgement persistence.

SecurityOS verifies evidence authenticity; it never authorizes an action by itself.

## 12. Monitoring integrity and privacy

TASK-007 Monitoring persistence now uses atomic full-ledger writes rather than raw append. Security DLP recursively detects and redacts token/password/secret/private-key-like material before security-sensitive output. Monitoring remains derived and rebuildable.

Full monitoring retention/repair remains TASK-012.

## 13. External Integration security

TASK-008 integration is hardened with:

- recursive Credential Reference secret detection;
- outbound request DLP defense;
- HMAC webhook verification + durable replay acceptance;
- connector endpoint allowlist and protocol policy;
- trusted DNS evidence requirement;
- private/loopback/link-local destination blocking;
- HTTPS downgrade redirect blocking;
- Gateway fail-closed behavior before connector invocation.

Full provider SDK/sandbox productization remains TASK-013; distributed replay/rate coordination remains TASK-015.

## 14. Supply-chain and dependency integrity

Supply-chain manifests bind artifact files by path, size and SHA-256 and may be Ed25519 signed. Policy can require signed manifests.

The package SBOM contract (`BAI-SPDX-LITE`) deterministically captures package identity and dependency groups and binds the document with `sbom_checksum`.

Dependency-risk policy normalizes vulnerability findings and blocks unresolved findings at or above a configurable severity floor (HIGH by default), while supporting explicit allowlist/fixed evidence.

TASK-010 will add release/distribution migration and compatibility workflows around these primitives.

## 15. Sandbox policy

TASK-009 provides a provider-neutral logical sandbox policy for capability, filesystem roots, environment keys, network hosts and maximum runtime. It is a reusable authorization contract, not an OS-level seccomp/container implementation.

OS-native/container sandbox adapters remain a later TASK-013 extension. Security-critical callers may already fail closed against undeclared capabilities or paths.

## 16. Trust classification

SecurityOS classifies externally generated/unknown inputs as UNTRUSTED by default. Verified signed evidence may become VERIFIED. Security trust does not replace domain authority or canonicalization.

## 17. Schemas

TASK-009 adds nine Draft 2020-12 security schemas:

- secret-reference
- signed-envelope
- journal-manifest
- supply-chain-manifest
- security-ledger-record
- egress-decision
- dependency-risk-result
- sbom
- sandbox-policy

`npm run check:security` verifies required contracts and shared primitive adoption.

## 18. Critic findings resolved during implementation

1. Replay acceptance originally had a check-then-append race; acceptance is now lock-protected.
2. Journal manifest update originally used ordinary write; journal state is now atomically persisted.
3. Signed supply-chain evidence was optional without an enforcement mode; `require_signature` policy was added.
4. Owner Approval / Completion Outbox integrity was not cryptographically bindable; signed modes were added.
5. Integration Credential metadata could hide deeply nested token material; recursive DLP validation was added.
6. Security Ledger could verify signatures when present but could not require them; `require_signature` was added.
7. Ledger/Monitoring/Integration/Knowledge derived persistence used raw append in several paths; critical writes now use shared atomic persistence.
8. Common atomic write did not revalidate immediately before rename; pre-commit and post-commit path verification was added.
9. Supply-chain scope lacked a generated dependency inventory; deterministic package SBOM support was added.
10. Signing was tied to raw key material; a provider abstraction was added for future KMS/HSM implementations.

Blocking Critic findings after correction: 0.

## 19. Accepted residual and future ownership

TASK-009 intentionally leaves productization that belongs to later roadmap owners:

- release signing ceremony, connector/OS version migration, release channels and rollback packaging -> TASK-010;
- multi-project/provider security conformance under real contention -> TASK-011;
- automatic fsck/repair/compaction/reconciliation -> TASK-012;
- OS-native/container sandbox providers, real KMS/HSM/Vault connectors and domain plugin SDK -> TASK-013;
- evidence-based security threshold/policy calibration -> TASK-014;
- distributed nonce/rate/key/queue/lease coordination -> TASK-015.

The local signing/vault/sandbox implementations are reference providers and policy primitives, not claims of hardware-backed isolation.

## 20. Completion verification

- TASK-009 dedicated Security suite: 64 / 64 PASS
- Full BAI Development OS suite: 625 / 625 PASS
- Existing pre-TASK-009 suite preserved: 561 / 561 baseline tests remain passing within the full suite
- JavaScript Roulette Reference Consumer: 10 / 10 PASS
- Product Boundary: PASS
- Roadmap Consolidation: 33 / 33 source sections preserved
- Security Conformance: PASS; 9 / 9 security schemas
- Root `SecurityOS` export: PASS
- Blocking Critic findings: 0

## 21. Completion status

TASK-009 Security, Supply Chain & Integrity Hardening is `COMPLETED` at the Ver.1.0 technical/canonical baseline.

The next canonical route is TASK-010 — Release, Distribution & Consumer Upgrade OS. TASK-010 remains `NOT_STARTED / NOT_AUTHORIZED` until separately activated.
