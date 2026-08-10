# TASK-016 Phase 0 — Consumer Knowledge Capture Bridge Detailed Design Ver.1.0

Status: `PLANNING_FAST_TRACK / NOT_STARTED / NOT_AUTHORIZED`
Parent Task: `TASK-016 — Resilience, Recovery & Scalability Certification OS`
Priority: `FIRST SLICE WHEN TASK-016 IS AUTHORIZED`
First Consumer validation: `BAI VIDEO PRODUCTION`

## 1. Objective

Create an immediately usable, cloud-independent path for collecting reusable development knowledge from already-running Consumer Projects while preserving provenance, privacy, private-repository isolation and existing governance authority.

## 2. Non-Goals

Phase 0 does not:

- deploy the Knowledge Hub VPS,
- implement direct local automation,
- grant Consumer repositories BAI Development OS write access,
- promote AI-generated Candidates automatically,
- store raw Consumer ZIP archives in Canonical Knowledge,
- replace TASK-016 resilience certification work.

## 3. Input Modes

### Preferred snapshot

ZIP includes `snapshot-manifest.json` with known OS/Product version and commit data.

### Fallback snapshot

Ordinary ZIP without a manifest is accepted. Provenance is recovered from available Git metadata, package metadata, Registry/Current State, TASK records, architecture files and Product documents.

Unrecoverable fields remain null/unknown.

Provenance states:

- `COMPLETE`
- `PARTIAL`
- `UNVERIFIED`

## 4. ZIP Intake Security Floor

Before any source is admitted into Evidence processing, inventory and exclusion checks identify:

- `.env`
- tokens/API keys
- OAuth credentials
- Git credential stores
- private keys/certificates
- secrets embedded in config/logs
- unnecessary personal information
- confidential creative/user content not required for the claimed knowledge
- caches/dependencies/large generated artifacts that do not add evidence value

Raw archives are transient review inputs and are not committed into Canonical Knowledge.

## 5. Processing State Machine

```text
RECEIVED
  -> INVENTORIED
  -> PROVENANCE_RECOVERED
  -> SANITIZED
  -> EVIDENCE_EXTRACTED
  -> CANDIDATES_GENERATED
  -> CONFLICT_CHECKED
  -> REVIEW_READY
  -> {REJECTED | SUPPORTED | PROMOTION_PROPOSED}
```

Any security/privacy boundary failure -> `QUARANTINED`.

## 6. Evidence Extraction Sources

The intake review may use:

- TASK definitions and summaries,
- detailed design/final plan,
- Critic/Judge/Owner records,
- implementation reports,
- tests and regressions,
- commit/PR provenance when available,
- user feedback and corrections,
- incident/recovery evidence,
- cost/performance observations,
- accepted and rejected approaches.

For BAI VIDEO PRODUCTION, first-pass domains include:

- desktop UI/UX,
- native file/folder selection,
- Windows path/runtime behavior,
- long-running operation feedback,
- cancel/retry/resume,
- subtitle/media workflows,
- FFmpeg/runtime dependencies,
- generation provider abstraction,
- model/runtime compatibility,
- test strategy,
- cost-adaptive governance,
- user-corrected design assumptions.

## 7. Evidence Contract

Each Evidence record contains at minimum:

- `schema_version`
- `evidence_id`
- `evidence_type`
- `producer.project_id`
- optional Product/TASK identifiers
- `observation`
- optional `resolution` and `outcome`
- `candidate_scope`
- `provenance.completeness`
- optional source commit/architecture/snapshot hash/time
- `sensitivity`
- optional payload hash
- `processing_status`

## 8. Candidate Contract

Each Candidate contains:

- source Evidence IDs,
- status,
- scope,
- risk,
- title,
- reusable statement,
- rationale,
- supersession link when applicable,
- required review floor.

Status lifecycle:

`OBSERVED -> CANDIDATE -> SUPPORTED -> PROMOTED`

Alternative states:

`CONFLICTED`, `REJECTED`, `SUPERSEDED`, `DEPRECATED`.

## 9. Scope Classification

- `project`: Consumer-specific implementation detail.
- `domain`: reusable within one technical/creative domain.
- `product-family`: reusable for a class such as desktop/video applications.
- `organization`: standard BAI engineering/development rule.
- `universal`: broadly reusable OS-level rule with strong evidence.

Broader scope requires stronger evidence; frequency alone cannot authorize broadening.

## 10. Risk / Review Floor

- `LOW`: lightweight review.
- `MEDIUM`: Critic review required.
- `HIGH`: Critic + Judge required.

Safety, Security, Privacy, Rights/License, Authority and Release-governance changes are never auto-promoted.

## 11. Output — Knowledge Intake Package

```text
knowledge-intake/
  manifest.json
  evidence/
    *.json
  candidates/
    *.json
  reviews/
    review-summary.md
  proposed-canonical/
    *.md
  provenance/
    source-map.json
```

The package SHALL reference source hashes/locations but SHALL NOT contain unnecessary raw source trees or secret-bearing archives.

## 12. ChatGPT Manual Review Mode

The operational C path explicitly supports this current workflow:

1. User prepares/sends Development OS + Consumer Product ZIP.
2. ChatGPT reviews the snapshot and extracts Evidence/Candidates.
3. ChatGPT modifies only the Development OS copy required for approved knowledge integration.
4. ChatGPT returns an edited ZIP/package to the user.
5. User applies it to a work branch.
6. Commit -> Push branch -> Pull Request -> GitHub Actions -> Merge.

This manual path is first-class until automated adapters replace repetitive steps.

## 13. Validation

Minimum Phase 0 verification:

- JSON schemas parse.
- positive sample validates.
- invalid/missing required fields reject.
- manifestless source can produce PARTIAL provenance.
- duplicate Evidence ID is detected at intake/package level.
- secret/raw archive exclusion rules are documented and tested where implementation exists.
- next-task context points to this document before broad Architecture loading.
- roadmap/conformance regression remains green.

## 14. Exit Gate

Phase 0 exits only when a real BAI VIDEO PRODUCTION snapshot has produced at least one reviewed reusable Candidate and the workflow is repeatable without Knowledge Hub infrastructure.
