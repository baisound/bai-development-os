# TASK-016 Phase 0 — Consumer Knowledge Capture & Contract Foundation Detailed Design Ver.1.2

Status: `ACTIVE / OWNER_AUTHORIZED / IMPLEMENTED / REAL_FULL_SNAPSHOT_VALIDATION_PENDING`
Parent Task: `TASK-016 — Resilience, Recovery & Scalability Certification OS`
Development Profile: `DEV_4_FOUNDATION_CRITICAL`
Owner authorization: user instruction on 2026-08-11 to proceed with the next detailed design and development.
First Consumer validation: `BAI VIDEO PRODUCT / BAI VIDEO PRODUCTION`
Next route after Phase 0 exit: `TASK-017 Phase 0 — Consumer Evidence Hub Pilot Transport Slice`

## 1. Objective

Implement the cloud-independent Contract & Capture Foundation so active Consumer development knowledge can be safely ingested now and a standalone Product can begin integrating the future Hub transport without taking a BAI Development OS runtime dependency.

## 2. Normative boundaries

- BAI Development OS remains development-time foundation only for Consumer Products.
- Product-owned generated reference code MUST run without this repository/package.
- Hub/credential outage MUST NOT become a Product primary-function failure.
- Runtime Evidence is source data; it never self-promotes into Canonical Knowledge.
- P3 raw Product/user content is outside Hub v1 contract.
- BAI VIDEO PRODUCT selects Microsoft Password Manager behind Product-owned `CredentialProvider`; Core does not guess the Microsoft API.

## 3. Implementation surfaces

### 16.0.1 Source-neutral contracts

Machine contracts live under `schemas/knowledge-evolution/`. Runtime events map to sanitized Knowledge Evidence by hash/provenance rather than introducing a second Knowledge authority.

### 16.0.2 Pattern C Snapshot Inspector

`src/knowledge-evolution/snapshot.mjs` accepts:

- directory snapshots,
- ZIP snapshots,
- a single evidence/handoff file for partial/provisional intake.

ZIP reader requirements:

- central-directory parsing without extracting untrusted paths,
- reject absolute/parent traversal paths,
- reject encrypted, multi-disk and ZIP64 inputs in v1,
- allow Store/Deflate only,
- verify CRC for read entries,
- reject symlink entries,
- bound entry count, individual uncompressed size, total uncompressed size and suspicious compression ratio.

### 16.0.3 Secret/privacy screening

Before Evidence extraction, paths and bounded text content are scanned. Secret-bearing files/credential patterns produce `QUARANTINED`. Reports store rule/path/line only and MUST NOT echo secret values.

### 16.0.4 Provenance recovery

Preferred `snapshot-manifest.json` produces `COMPLETE` provenance when the minimum v1 contract is present. Fallback recovery may use `.bai-os/project.json`, `PROJECT.md`, BAI Development OS `package.json` and Architecture filenames. Missing values remain null; no inference may invent a commit/version/task.

### 16.0.5 Knowledge Intake Package builder

`createKnowledgeIntakePackage()` writes only sanitized derived artifacts:

```text
knowledge-intake/
  manifest.json
  evidence/*.json
  candidates/*.json
  reviews/review-summary.md
  proposed-canonical/*.md
  provenance/source-map.json
  provenance/package-checksum.json
```

Raw snapshots are never copied into this package.

### 16.0.6 Consumer Evidence contract runtime

`src/knowledge-evolution/contracts.mjs` provides deterministic validation, privacy reduction, policy intersection and runtime-event -> Knowledge-Evidence mapping for development/testing. Client-supplied Trust is not part of the event schema.

### 16.0.7 Product-owned Python Reference Kit

`templates/consumer-evidence/python/` is copied/generated into a Consumer repository. It uses Python standard library only and does not import BAI Development OS. It contains a generic `CredentialProvider`, sanitizer, bounded file outbox, client policy and synchronous delivery client. Product scheduling/background execution remains Product-owned.

### 16.0.8 Mock Hub

`createConsumerEvidenceMockHub()` implements development-only HTTP behavior for `/v1/evidence/batch` and `/v1/client-policy`, with deterministic success, partial reject, auth failure, forbidden, rate limit, server error, timeout and duplicate/idempotency scenarios.

### 16.0.9 CLI surfaces

- `node scripts/inspect-knowledge-snapshot.mjs <source>`
- `node scripts/scaffold-consumer-evidence-python.mjs <target>`
- `node scripts/run-consumer-evidence-mock-hub.mjs --scenario <scenario> --port <port>`

## 4. Failure semantics

| Condition | Result |
|---|---|
| Secret/private-key path or detected secret | QUARANTINED; intake package creation blocked |
| ZIP path traversal/symlink/encryption/unsupported compression | reject snapshot |
| Missing manifest but recoverable project facts | PARTIAL provenance |
| No recoverable provenance | UNVERIFIED provenance |
| P3/raw content request | reject event |
| Credential missing | Evidence delivery disabled/degraded only |
| Hub 401/403 | pause Evidence delivery; Product continues |
| Hub 429 | retain outbox; respect Retry-After |
| Hub 5xx/timeout/DNS | retain outbox; retry later |
| Duplicate event ID after prior ACK | idempotent already-seen receipt; no duplicate downstream effect |

## 5. Detailed test matrix

Required focused tests:

1. valid P0/P1/P2 event validation;
2. P3 and secret-bearing payload rejection;
3. unknown/sensitive payload field rejection;
4. local/server policy intersection cannot raise privacy;
5. runtime event maps to Knowledge Evidence without raw payload storage;
6. valid ZIP inventory + CRC read;
7. path traversal ZIP rejection;
8. symlink/secret snapshot quarantine;
9. manifestless fallback => PARTIAL;
10. Intake Package excludes raw source;
11. Candidate cannot reference missing Evidence;
12. Mock Hub success/partial/auth/429/5xx/duplicate behavior;
13. generated Python reference contains no BAI Development OS runtime import;
14. generated Python compiles with standard library;
15. root/subpath exports remain compatible;
16. full OS regression + existing conformance checks stay green.

## 6. First Product Evidence validation

A currently available real BAI VIDEO PRODUCTION handoff artifact is used as a **provisional PARTIAL Pattern C validation**. This demonstrates intake against Product-owned source evidence, but it does not replace the final gate requiring the full Product + matching Development OS snapshot ZIP when the Owner supplies it.

The Phase 0 implementation may therefore reach `IMPLEMENTED / REAL_FULL_SNAPSHOT_VALIDATION_PENDING` but MUST NOT claim full Phase 0 closure until the complete snapshot gate passes.

## 7. Exit criteria

Implementation is technically ready when all code/schema/mock/generator/intake focused tests pass and standard OS regression/conformance is green. Phase 0 closure additionally requires one full BAI VIDEO PRODUCT/PRODUCTION + matching OS snapshot intake with no unresolved security/privacy quarantine.
