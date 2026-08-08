# TASK-012 Self-Maintenance Ver.1.0 — AI Summary

- Status: `CURRENT_CANONICAL / COMPLETED`; profile `DEV_4_FOUNDATION_CRITICAL`.
- MaintenanceOS pipeline: Finding → read-only Fsck → Repair Plan → Checkpoint → durable single-use Execute → Verify → Rollback/Quarantine → optional Audit.
- Auto repair is limited to low-risk/reversible derived/cache/temporary state and requires immediate `revalidate()`.
- Canonical/Authority/Trust/destructive/ambiguous external state is Owner-required or quarantined.
- Owner gate requires `owner_authorization_ref`. Incomplete execution returns `MAINTENANCE_REPAIR_RECOVERY_REQUIRED`; blind replay is forbidden.
- Cross-subsystem adapters cover Knowledge, Monitoring, Integration, Security, Release and Conformance.
- Release lock v1.1 adds host/PID/owner token/acquired_at; legacy/ambiguous locks are not auto-reclaimed.
- Validation: Maintenance 75/75; full OS 898/898; Consumer 10/10; Roadmap 48/48; all conformance/boundary gates PASS.
- Next route: TASK-013 Domain Adapter / Plugin SDK, not started/not authorized.
