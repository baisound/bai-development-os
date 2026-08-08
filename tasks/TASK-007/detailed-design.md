# TASK-007 Detailed Design Record

The implementation canonical is:

`specifications/TASK-007_BAI_Development_OS_Monitoring_Dashboard_Ver1.0.md`

## Design Decision

- Development profile: `DEV_4_FOUNDATION_CRITICAL`.
- Internal phases: 12.
- Monitoring is derived and read-only; it never becomes Lifecycle/Knowledge/Registry/Authorization authority.
- Verified source provenance is visible in the snapshot/dashboard.
- Alert/health evaluation is configurable and deterministic for identical inputs/clock.
- External notification is delegated to TASK-008.
- Auto-repair is delegated to TASK-012.
- UI framework is not canonical; core emits Dashboard model plus portable standalone HTML.
- Permanent model-selection policy: unchanged.
