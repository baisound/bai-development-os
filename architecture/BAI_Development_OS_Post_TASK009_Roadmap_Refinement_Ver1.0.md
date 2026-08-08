# BAI Development OS — Post-TASK-009 Roadmap Refinement Ver.1.0

- Effective date: 2026-08-08
- Source: completed TASK-009 Security, Supply Chain & Integrity implementation and Critic findings
- Status: ACTIVE_ROADMAP_RECORD
- Implementation authorization: NONE
- TASK-009: remains COMPLETED
- Next route: TASK-010 (`NEXT / NOT_STARTED / NOT_AUTHORIZED`)

## Decision

TASK-009 closed the shared local security/integrity baseline but intentionally left production release trust-chain productization, real multi-project adversarial conformance, automatic SecurityOS repair, production Vault/KMS/HSM/sandbox providers, evidence-based policy calibration and distributed security coordination to later roadmap owners. These proposals fit TASK-010 through TASK-015, so no TASK-016 is created.

## TASK-010

Add the following release/security productization scope:

- Formal Release Signing Ceremony with explicit signer identity, trust anchor, approval evidence, key version and artifact set.
- Signed release manifest/update bundle that binds OS version, schemas, SBOM, dependency inventory, migration plan, checksums and rollback target.
- Trust-anchor bootstrap and rotation procedure that allows verification-key changes without silently trusting a new key.
- Migration compatibility for SecurityOS journal/WAL, Signed Ledger, Secret Reference, Supply-chain Manifest and Security Policy schema revisions.
- Key-rotation-aware upgrade/downgrade verification, including rollback to a release signed by an earlier still-trusted key.
- Security-profile compatibility matrix so upgrades cannot silently weaken required signing, DLP, egress, replay or sandbox policy.
- Reproducible release attestation and post-install VERIFY that proves the installed bits correspond to the declared manifest/SBOM.
- Air-gapped/offline secure update bundle with detached verification material and no dependency on live provider reachability.

**Acceptance direction:** a Consumer can upgrade, downgrade and rollback while preserving a continuous verifiable trust chain and without silently weakening SecurityOS policy.

## TASK-011

Add the following multi-project SecurityOS conformance scope:

- Per-project Vault/Secret Reference isolation; a credential reference from Project A cannot resolve in Project B without explicit shared authority.
- Per-project signer, verification-key and trust-anchor isolation, including key-ID collision and wrong-key verification tests.
- Security Policy isolation for DLP, egress, replay, signing-required and sandbox requirements.
- Concurrent replay/idempotency race tests across multiple projects and providers.
- Shared infrastructure fairness tests where egress, signer, vault or security scanning resources are contended.
- Cross-project supply-chain provenance tests ensuring one Consumer cannot substitute another Consumer's approved manifest/SBOM.
- Real provider/container/security-backend conformance fixtures where safe sandboxes are available.
- Adversarial fixtures for path escape, secret confusion, forged signatures, stale trust anchors and mixed-project ledger records.

**Acceptance direction:** SecurityOS provides the same fail-closed guarantees under multi-project concurrency as it does in a single-project local environment.

## TASK-012

Add the following SecurityOS self-maintenance scope:

- Security repository `fsck` covering Journal transactions, Signed Ledgers, replay state, Secret leases, Supply-chain manifests and trust metadata.
- Automatic classification of stale `PREPARED`, interrupted `COMMITTING`, committed-but-unverified and orphaned transaction state.
- Policy-governed recovery plans that can safely COMPLETE, quarantine or request Owner action without guessing canonical state.
- Signed-ledger compaction/checkpointing that preserves verifiable chain roots and historical auditability.
- Replay nonce/receipt expiry and compaction with protection against premature replay-window deletion.
- Secret lease expiry/revocation cleanup and detection of references pointing to missing/revoked providers.
- Supply-chain/SBOM cache refresh and stale-vulnerability-evidence detection.
- Cross-subsystem adoption audit that detects Knowledge/Automation/Monitoring/Integration paths bypassing required SecurityOS primitives.
- Quarantine for integrity-unknown artifacts plus deterministic rebuild where canonical source material still exists.

**Acceptance direction:** long-lived SecurityOS state can be verified, repaired or safely quarantined without weakening provenance or silently fabricating canonical truth.

## TASK-013

Preserve TASK-013's original cross-domain Domain Adapter / Plugin SDK mission and add SecurityOS provider extension points:

- Secret/Vault Provider SDK for local stores and external secret managers.
- Signing Provider SDK for local Ed25519, cloud KMS, HSM and equivalent hardware-backed custody.
- Trust Anchor / Certificate / Verification-Key Provider abstraction.
- OS-native/container sandbox adapters with declared filesystem, environment, process, network and resource capabilities.
- DLP/Redaction scanner plugins with explicit sensitivity taxonomy and deterministic findings.
- Egress policy resolver and endpoint reputation/resolution plugins.
- Supply-chain scanner/SBOM/provenance provider plugins.
- Security provider capability manifest, trust level, version compatibility, resource budget, health probe and revocation lifecycle.
- Domain-specific Security Policy Pack / Security Test Pack / Security Evidence Pack extensions without embedding domain rules in Core SecurityOS.

**Acceptance direction:** real production security backends can replace reference/local implementations through governed plugins without changing SecurityOS callers or its authority boundaries.

## TASK-014

Add the following evidence-driven SecurityOS calibration scope:

- Measure DLP false-positive/false-negative rates and recommend advisory tuning without auto-disabling mandatory secret classes.
- Calibrate replay-window and clock-skew tolerances from observed delivery behavior while preserving minimum anti-replay floors.
- Evaluate Secret lease TTL/rotation cadence against actual usage and operational interruption rates.
- Calibrate non-mandatory egress reputation/risk thresholds from verified incidents and false blocks.
- Evaluate supply-chain vulnerability thresholds, stale-evidence windows and remediation lead time.
- Measure signing/verification latency, provider reliability and Owner friction for secure operations.
- Detect recurring integrity/security failure patterns and propose targeted fault-injection or test-depth increases.
- Counterfactual replay of historical security decisions to estimate whether an alternative advisory policy would have reduced cost/friction without increasing accepted risk.
- Mandatory floors for secret handling, authorization, signature-required profiles, RESTRICTED data, irreversible actions and critical trust boundaries cannot be weakened automatically.

**Acceptance direction:** SecurityOS becomes less noisy and more efficient from evidence while mandatory security guarantees remain non-negotiable.

## TASK-015

Add the following optional distributed SecurityOS scope:

- Distributed replay/nonces with atomic check-and-record across workers and machines.
- Distributed trust-anchor/key-version propagation with explicit activation epoch and rollback rules.
- Distributed Secret lease coordination and revocation propagation.
- Signed event envelopes with worker identity, causal metadata and verification before side effects.
- Shared security-policy distribution with version pinning and rejection of stale policy workers.
- Distributed tamper-evident ledger/checkpoint strategy with deterministic duplicate handling.
- Remote worker attestation hooks and capability claims before receiving security-sensitive work.
- Cross-machine egress/rate/security quota coordination.
- Partition behavior that fails closed for security-critical operations when trust/replay/key state cannot be proven current.
- Crash/failover/key-rotation/replay-storm/partition test matrix for distributed SecurityOS.

**Acceptance direction:** when distributed topology is enabled, the security guarantees established by TASK-009 remain coherent across workers; single-machine operation remains the default and does not require this layer.

## Status

TASK-010 remains NEXT / NOT_STARTED / NOT_AUTHORIZED. TASK-011 through TASK-015 remain PROPOSED / NOT_STARTED / NOT_AUTHORIZED. No implementation authorization is granted by this roadmap refinement.
