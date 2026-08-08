# TASK-011 BAI Development OS — Multi-Project Conformance & Compatibility Lab Detailed Design Ver.1.0

## Document Control

- Product: `BAI Development OS`
- Task: `TASK-011 — Multi-Project Conformance & Compatibility Lab`
- Version: `1.0`
- Status: `CURRENT_CANONICAL / COMPLETED`
- Development Profile: `DEV_4_FOUNDATION_CRITICAL`
- Effective Date: `2026-08-08`
- Canonical Root: `/home/baisound/bai-development-os`

## 1. Purpose and Authority Boundary

TASK-011 turns multi-project compatibility from an informal test collection into an executable `ConformanceOS`. It owns fixture description, compatibility matrices, isolation/fairness/provider/upgrade/portability probes, evidence classification and machine-readable certification. It does not grant authority, convert simulated evidence into real evidence, execute untrusted consumer code without an explicit trust/sandbox contract, or claim conformance outside the tested scope.

## 2. Internal Phase Roadmap

1. Conformance vocabulary, status and evidence levels.
2. Versioned Consumer Fixture contract.
3. Compatibility Matrix across project/scale/risk/domain/language/platform/provider axes.
4. Consumer Contract Runner with trusted/sandbox execution boundary.
5. Project namespace and ownership isolation probes.
6. Shared-resource fairness and noisy-neighbor probes.
7. Provider capability equivalence and failure matrix.
8. Release upgrade/downgrade/security-profile chain conformance.
9. Platform/architecture/filesystem portability evidence model.
10. Knowledge/Monitoring/Integration/Security subsystem isolation probes.
11. Machine-readable Compatibility Level and Certification.
12. Reference Consumer and synthetic Core-critical fixtures.
13. Adversarial fixtures and false-evidence prevention.
14. JSON Schema contracts and conformance checker.
15. Baseline certification, Critic hardening, full regression and canonical synchronization.

## 3. ConformanceOS Architecture

`ConformanceOS` is exported from the product root and from `./conformance`. Primary modules are Fixture, Matrix, Consumer Runner, Isolation, Fairness, Provider, Upgrade, Portability, Certification, Lab and Service. All results are immutable/checksummed where applicable and use explicit evidence metadata.

## 4. Result and Evidence Semantics

Result status is one of `PASS`, `CONDITIONAL`, `FAIL`, or `NOT_APPLICABLE`. Evidence level is one of `REAL`, `SANDBOX`, `SIMULATED`, or `DECLARED`.

A fixture declaring itself `REAL` is not execution proof. Compatibility levels C2 and above require successful `REAL` or `SANDBOX` consumer execution evidence. `SIMULATED` and `DECLARED` evidence may describe intended portability but cannot silently promote a certification to a verified real-environment level.

## 5. Consumer Fixture and Compatibility Matrix

A fixture declares project identity, scale, risk tier, domains, languages, runtime/shell, platform/architecture/filesystem, providers, Consumer Contract, Security namespaces, release versions, capabilities and evidence level. The matrix computes coverage, pairwise combinations and missing required axes rather than inferring compatibility from one reference project.

## 6. Consumer Contract Runner Security Boundary

The runner supports fixed contract modes only: `NONE`, `NODE_TEST`, `NODE_SCRIPT`, and `NPM_SCRIPT`. Execution requires `TRUSTED_LOCAL` or an explicit `SANDBOXED` contract; `DECLARED_ONLY` fixtures are not executable evidence. Node targets are resolved with `realpath` and MUST remain inside the Consumer root. Execution uses `shell:false`, timeout and output-size bounds. ConformanceOS is therefore not an arbitrary command execution surface.

## 7. Multi-Project Isolation

Isolation checks cover Knowledge, Authorization, Startup, Outbox, Monitoring, Credentials, Idempotency, Webhook, Vault, Signer, Trust Anchor, Security Policy and Release State namespaces. Cross-project ownership records fail when a resource is attributed to another project unless the namespace is explicitly declared shared under policy.

Direct TASK-011 integration tests also prove project-scoped Knowledge does not resolve into another project, Monitoring project queries do not leak another project's events, cross-project credential namespace collisions are detected, and Release security-profile weakening is rejected.

## 8. Fairness and Noisy-Neighbor Control

A weighted fair-capacity allocator models shared capacity and verifies minimum-share guarantees. Noisy-neighbor tests prove a high-demand Consumer cannot starve an unrelated normal Consumer when policy reserves a fair share. These probes are evidence tools; they do not replace TASK-004 Cost authority or provider-specific rate enforcement.

## 9. Provider Compatibility

Provider conformance compares required capabilities rather than provider names. Failure matrices cover expected and unexpected error semantics. Real-provider testing is allowed only when a safe sandbox exists; deterministic fake providers remain valid CI evidence and are classified separately from real execution.

## 10. Release and Upgrade Conformance

Upgrade-chain verification covers upgrade/downgrade direction, permitted direct transitions, required migration availability and Security Profile non-weakening. This validates TASK-010 contracts without moving release mutation authority into ConformanceOS.

## 11. Platform / Architecture / Filesystem Portability

Portability requirements are evaluated target by target. `REAL`/`SANDBOX` evidence may produce PASS; `SIMULATED`/`DECLARED` evidence produces CONDITIONAL; absent required targets produce FAIL. This prevents one Linux execution from being mislabeled as Windows/macOS certification.

## 12. Certification Levels

- `C0_UNVERIFIED`: no verified contract evidence.
- `C1_CONTRACT`: Consumer contract/schema compatibility only.
- `C2_SINGLE_PROJECT`: at least one REAL/SANDBOX Consumer execution.
- `C3_MULTI_PROJECT`: multiple verified Consumers plus isolation evidence.
- `C4_PORTABLE`: C3 plus verified portability target requirements.
- `C5_ADVERSARIAL`: C4 plus adversarial/failure-mode evidence.

A requested level above the achieved evidence level is `FAIL`, not a warning-only success.

## 13. Reference and Synthetic Consumers

`javascript-roulette` is an executable REAL reference fixture. A local `core-node` Core-critical synthetic Consumer exercises governed OS surfaces and is also executed as REAL evidence. `makeTikTokGiftMaster` is retained as a `DECLARED` reference only and is explicitly prohibited from contributing execution proof until an actual accessible Consumer contract is run.

## 14. Critic Findings Resolved

- A fixture could declare `REAL` and promote certification without executing a Consumer contract: fixed by requiring successful REAL/SANDBOX `EXECUTION` evidence for C2+.
- Consumer Contract Runner risked becoming an arbitrary command executor: fixed by allowlisted contract modes and `shell:false`.
- Node targets could escape Consumer root: fixed with `realpath` root confinement.
- Simulated cross-platform evidence could be mistaken for actual platform support: fixed with explicit evidence levels and CONDITIONAL portability semantics.
- Declared-only multi-project fixtures cannot manufacture high certification levels.

## 15. Verified Baseline

- TASK-011 Conformance tests: `101 / 101 PASS`.
- Full BAI Development OS: `821 / 821 PASS`.
- JavaScript Roulette Reference Consumer: `10 / 10 PASS`.
- Local multi-project certification: `PASS / C3_MULTI_PROJECT` using two REAL executed Consumers.
- Cross-platform portability: `CONDITIONAL`; Linux/current is REAL/PASS, Windows x64 and macOS arm64 are SIMULATED/CONDITIONAL.
- Product Boundary: `PASS`.
- Roadmap Consolidation: `PASS (44 / 44)`.
- Security Conformance: `PASS (9 schemas)`.
- Release Conformance: `PASS (8 schemas)`.
- Conformance Conformance: `PASS (10 schemas)`.
- ConformanceOS root export: `PASS`.
- Blocking Critic findings: `0`.

## 16. Accepted Residual / Future Ownership

- Repository/state fsck, stale artifact repair, deterministic rebuild and safe auto-repair: `TASK-012`.
- New Domain/Provider/Platform Conformance adapters and plugin SDK surfaces: `TASK-013`.
- Evidence-driven calibration of compatibility thresholds, fixture coverage, fairness budgets and certification policy: `TASK-014`.
- Distributed Conformance execution, remote worker leases and cross-machine coordination: `TASK-015`.
- Additional real Windows/macOS/provider evidence is future certification evidence, not a missing core ConformanceOS implementation.

## 17. Completion Status

TASK-011 is `COMPLETED`. TASK-012 — Self-Maintenance, Drift Detection & Safe Auto-Repair is `NEXT / NOT_STARTED / NOT_AUTHORIZED`.
