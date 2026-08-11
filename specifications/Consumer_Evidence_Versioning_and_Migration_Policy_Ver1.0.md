# Consumer Evidence Versioning and Migration Policy Ver.1.0

Status: `TASK-016 PHASE0 RC2 CANONICAL`

- version format: `major.minor`
- additive backward-compatible contract change: minor
- breaking required-field/meaning change: major
- Object Storage key prefix follows major version
- source Event IDs and source artifacts are immutable
- migration produces derived normalized data with source version/hash lineage
- unsupported versions fail explicitly; no silent best-effort rewrite
- Hub may accept multiple source versions while Candidate normalization preserves original provenance
- catalog revision is independently advertised by Client Policy
