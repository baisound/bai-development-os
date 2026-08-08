# BAI Development OS — Post-TASK-007 Roadmap Refinement Ver.1.0

## Status

- Decision: `ROADMAP_REFINED`
- TASK-007: `COMPLETED / NOT_REOPENED`
- Implementation authorization created by this document: `NONE`
- Next route: `TASK-008 — External Integration`
- Future tasks affected: `TASK-009〜TASK-015`

## Why this refinement exists

TASK-007 deliberately completed a small, vendor-neutral, read-only observability core. Implementation and Critic review exposed productization work that should not be forced back into the completed Monitoring task. This record assigns that work to already-reserved future responsibilities instead of expanding TASK-007 indefinitely.

## Allocation

| Future Task | TASK-007-derived additions |
|---|---|
| TASK-009 | Monitoring Event journal/WAL, cryptographic provenance, privacy/redaction, secret leakage detection, tamper/replay hardening |
| TASK-010 | Monitoring schema migration, dashboard/history compatibility, versioned offline diagnostic bundles, upgrade/rollback verification |
| TASK-011 | Multi-project dashboard isolation, noisy-neighbor/cardinality tests, concurrent collector conformance, monitoring portability certification |
| TASK-012 | Retention classes, compaction/rollups, tail repair, deterministic rebuild, alert cleanup, monitoring fsck/backup/restore/storage-pressure policy |
| TASK-013 | Collector, metric derivation, alert provider, renderer, exporter and correlation plugin contracts |
| TASK-014 | Evidence-calibrated thresholds, anomaly/baseline detection, SLI/SLO views, alert-fatigue/noise calibration, counterfactual policy replay |
| TASK-015 | Distributed telemetry transport, trace propagation, clock-skew/order semantics, backpressure, collector HA/failover, partition recovery |

## TASK-008 boundary

External notification delivery itself remains TASK-008. This refinement starts at TASK-009 and addresses how monitoring data is secured, versioned, maintained, extended, calibrated and distributed after/around connector delivery. It does not move connector authority.

## Non-negotiable constraints

1. Dashboard/Alert/Snapshot/Trend remain derived and rebuildable; they never become canonical authority.
2. Historical TASK-007 Evidence is immutable.
3. Learned thresholds may not silently weaken mandatory safety/integrity/privacy rules.
4. Multi-project and distributed aggregation must preserve project identity and authority boundaries.
5. Single-machine/small Consumers must not be forced to adopt distributed telemetry infrastructure.
6. All TASK-009〜015 additions remain `PROPOSED / NOT_STARTED / NOT_AUTHORIZED`.
