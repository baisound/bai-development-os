# TASK-007 BAI Development OS Monitoring & Dashboard Detailed Design Ver.1.0

## Document Control

```yaml
document:
  document_id: TASK-007-Monitoring-Dashboard
  version: "1.0"
  status: CURRENT_CANONICAL
  authority: machine_canonical_authority
  machine_path: /home/baisound/bai-development-os/specifications/TASK-007_BAI_Development_OS_Monitoring_Dashboard_Ver1.0.md
  human_companion: /home/baisound/bai-development-os/specifications/TASK-007_BAI_Development_OS_Monitoring_Dashboard_Ver1.0.docx
  summary_path: /home/baisound/bai-development-os/specifications/TASK-007_BAI_Development_OS_Monitoring_Dashboard_Ver1.0.summary.md
  parent_architecture: /home/baisound/bai-development-os/architecture/BAI_Development_OS_Architecture_Ver2.10.md
  effective_date: 2026-08-08
  development_profile: DEV_4_FOUNDATION_CRITICAL
```

## 1. Purpose

TASK-007 implements the Monitoring & Dashboard layer of BAI Development OS. Its purpose is to make Lifecycle state, quality, automation, Context, cost, model behavior, Knowledge Debt, Registry health, Integration behavior and Governance verification observable without creating a second source of truth.

The monitoring layer MUST be rebuildable from canonical or verified evidence. A Dashboard, Snapshot, Alert, Trend, HTML page or Monitoring Event is derived operational data. None of these artifacts may mutate or supersede TASK-004 Lifecycle authority, TASK-005 Knowledge authority, TASK-006 Registry/Automation authority boundaries, Owner Authorization, or canonical specifications.

## 2. Core Design Principles

1. **Read-only observability** — Monitoring reads canonical or verified sources; it does not perform Lifecycle transition, Knowledge promotion, Registry authority update, Owner authorization, publication, deletion or external side effect.
2. **No Dashboard-as-Truth** — Dashboard values are derived views. Canonical records and verified ledgers remain authoritative.
3. **Provenance visible by design** — Source freshness, verification state, checksum/revision metadata and source age are represented alongside metrics.
4. **Deterministic derived outputs where practical** — the same source data, policy and clock produce the same derived alert identities and metric results.
5. **Correlation before convenience** — run_id/correlation_id permit a Task/Role/Tool/Cost/Artifact/Alert path to be reconstructed for audit.
6. **Fail loud on integrity** — malformed or tampered Monitoring Events and ledgers are rejected instead of silently ignored.
7. **No vendor lock-in** — metrics use capability/domain concepts instead of a specific model provider, dashboard framework or alerting vendor.
8. **Adaptive, not noisy** — warning/high thresholds are policy inputs, and duplicate alerts can be suppressed in the derived view without suppressing source evidence.
9. **Multi-project first** — one workspace dashboard can summarize multiple consumer projects without collapsing project identity or authority boundaries.
10. **External notification is not Monitoring authority** — sending Slack/Gmail/Discord/webhook notifications belongs to TASK-008 Integration. TASK-007 only produces alert data suitable for a future connector.

## 3. Scope

### 3.1 Included

- Monitoring Event contract and correlation metadata.
- Tamper-evident derived Monitoring Event Ledger.
- Lifecycle metrics: status, phase, gate failure, phase age.
- Quality metrics: pass/fail/pass rate/retest count.
- Automation metrics: run count, retry, stall, Owner approval waiting.
- Context metrics: token count, duplicate, stale, conflict, mandatory missing.
- Cost metrics: actual/budget/utilization and Role/Model breakdown.
- Model metrics: calls, failures, failure rate, latency, fallback.
- Knowledge metrics: application, verification, recurrence, stale rate and Knowledge Debt.
- Registry metrics: verification failure, checksum failure, rebuild count.
- Integration metrics: failure rate and rate-limit count from supplied verified evidence.
- Governance metrics: VERIFY failure, approval pending, deviation.
- System critical incident and canonical-integrity incident surface.
- Source provenance / freshness / verification state.
- Alert severity evaluation and duplicate suppression.
- Project health state: HEALTHY / DEGRADED / AT_RISK / CRITICAL.
- Correlation trace and filtered monitoring audit query.
- Snapshot-to-snapshot trend and time series generation.
- Project Dashboard model and Workspace multi-project Dashboard.
- Standalone dependency-free HTML Dashboard renderer.
- Verified collectors for canonical Lifecycle, Cost Ledger and Knowledge Store.
- JSON Schema contracts and full regression coverage.

### 3.2 Explicitly Excluded

- External notification delivery, webhook/email/chat transmission: TASK-008.
- Automatic remediation or canonical repair: TASK-012.
- Distributed queue/worker telemetry transport: TASK-015.
- Long-term adaptive threshold learning: TASK-014.
- Security-signing / WAL / crash-atomic hardening beyond local hash-chain and root confinement: TASK-009.
- Release/upgrade migration of monitoring schemas: TASK-010.
- Third-party dashboard/plugin SDK: TASK-013.

## 4. Authority Boundary

| Artifact / State | Owner | TASK-007 Permission |
|---|---|---|
| Canonical Lifecycle Status | TASK-004 | Read / verify only |
| Cost Ledger | TASK-004 Cost Guard | Read / verify only |
| Knowledge Repository / Usage Ledger | TASK-005 | Read / verify only |
| Workspace Registry / Automation state | TASK-006 | Read / summarize only |
| Owner Authorization | Owner / TASK-006 boundary | Observe status only |
| Monitoring Event Ledger | TASK-007 | Append derived events, verify chain |
| Monitoring Snapshot | TASK-007 | Rebuildable derived view |
| Alert | TASK-007 | Rebuildable derived signal |
| Dashboard / HTML | TASK-007 | Rebuildable human view |
| External notification | TASK-008 | No TASK-007 write authority |

Hard rule: `canonical_authority = false` for Snapshot/Dashboard and `dashboard_authority = false` for Alert/Audit artifacts.

## 5. Internal Phase Plan

### Phase 1 — Observation Authority Contract

Define the Monitoring layer as a read-only derived subsystem. Establish non-authority flags, project/task identity requirements, health vocabulary and component taxonomy.

Acceptance:
- Monitoring cannot expose an API that directly changes canonical Lifecycle/Knowledge/Authorization state.
- Root export exposes MonitoringOS as a separate subsystem.

### Phase 2 — Monitoring Event & Correlation Contract

Implement versioned Monitoring Event with event_id, observed_at, project_id, task_id, run_id, correlation_id, component, metric, value, severity hint, evidence and checksum.

Acceptance:
- malformed component/severity/time rejected;
- tampering rejected;
- correlation defaults safely from run_id when supplied.

### Phase 3 — Verified Source Collection & Provenance

Implement collectors for canonical Lifecycle records, Cost Ledger and Knowledge Store. Ad-hoc test/automation/context/model/registry/integration/governance/system observations require caller-supplied verification metadata to be treated as verified.

Source metadata includes observed_at, verified, checksum and revision where available.

Acceptance:
- canonical Lifecycle checksum is verified;
- Cost hash-chain verification occurs through Cost Guard read path;
- Knowledge repository/usage ledger verification occurs through Knowledge OS;
- unverified source remains visibly unverified.

### Phase 4 — Lifecycle / Quality / Automation Metrics

Lifecycle:
- status_counts;
- phase_counts;
- active phase max/average age;
- gate failure count.

Quality:
- total/pass/fail;
- pass rate / percent;
- retest count.

Automation:
- run count;
- retry count;
- stall count;
- Owner approval pending count.

### Phase 5 — Context / Cost / Model Metrics

Context:
- token_count;
- duplicate_count / duplicate_ratio;
- stale_count;
- conflict_count;
- mandatory_missing.

Cost:
- actual_cost_microusd;
- budget_microusd;
- utilization / percent;
- breakdown by Role;
- breakdown by Model.

Model:
- call_count;
- failure_count / failure_rate;
- average/max latency;
- fallback_count.

### Phase 6 — Knowledge / Registry / Integration / Governance Metrics

Knowledge:
- asset count;
- application count/rate;
- verification count/rate;
- recurrence count/rate;
- stale count/rate;
- Knowledge Debt score.

Knowledge Debt weights are intentionally advisory derived values:
- CANDIDATE 1;
- STALE 2;
- DUPLICATE 1.5;
- OWNERLESS 3;
- INVALID 5;
- CONFLICT 4.

Registry/Integration/Governance metrics follow Architecture Chapter 16 and never create canonical decisions by themselves.

### Phase 7 — Alert & Health Engine

Severity vocabulary:
- INFO — normal events and completions;
- WARNING — soft budget, stale source/knowledge, long-running phase;
- HIGH — repeated stall, mandatory missing, low test quality, Registry/Governance verification failure;
- CRITICAL — critical system incident or canonical integrity failure.

Health mapping:
- no WARNING+ alerts → HEALTHY;
- highest WARNING → DEGRADED;
- highest HIGH → AT_RISK;
- highest CRITICAL → CRITICAL.

Thresholds are configuration inputs. Alert identity is deterministic for identical source values, project/task identity and clock.

### Phase 8 — Source Freshness & Data Quality

Dashboard must not imply that stale/unverified data is current truth.

For every supplied source metadata entry:
- age_ms is calculated;
- stale/fresh state is calculated;
- verified/unverified state is retained;
- checksum/revision is carried when available.

Unverified source → HIGH derived alert.
Stale source → WARNING derived alert.

These alerts do not modify the source or authorize repair.

### Phase 9 — Audit / Correlation / Trend

Audit APIs:
- filter by project/task/run/component/severity/time;
- build correlation trace ordered by observed_at;
- compare two monitoring snapshots;
- build metric series across snapshots.

Trend output remains derived and non-authoritative.

### Phase 10 — Dashboard & Multi-Project Visualization

Project Dashboard consists of cards for:
- Lifecycle;
- Quality;
- Automation;
- Context;
- Cost;
- Model;
- Knowledge;
- Registry;
- Integration;
- Governance;
- System.

Workspace Dashboard ranks projects by health while retaining project identity.

A standalone HTML renderer produces a human-readable dashboard without external JS/CSS dependencies and escapes supplied text to prevent HTML/script injection.

### Phase 11 — Derived Event Store & Security Boundary

Monitoring Event Ledger:
- append-only JSONL;
- per-record hash-chain;
- event-level checksum;
- exclusive local write lock;
- post-write verification;
- root confinement;
- symlink/root escape rejection.

This store is derived audit data, not canonical Lifecycle history.

Accepted residual: a process crash during an append can leave a partial tail. The next verification rejects corruption. Journal/truncation-safe repair belongs TASK-009/TASK-012.

### Phase 12 — End-to-End Assurance & Completion

Required completion checks:
- dedicated Monitoring suite PASS;
- full BAI Development OS regression PASS;
- Product Boundary PASS;
- MonitoringOS root export PASS;
- Monitoring schemas parse as Draft 2020-12 contracts;
- JavaScript Roulette reference consumer regression PASS;
- Markdown/DOCX canonical companions synchronized and visually verified;
- Document Registry has no missing/hash-size mismatch;
- blocking Critic findings = 0.

## 6. Primary Runtime API

| API | Responsibility |
|---|---|
| `createMonitoringEvent` | create checksummed observation event |
| `appendMonitoringEvent` | append derived event to hash-chain ledger |
| `verifyMonitoringEventLedger` | verify complete Monitoring event chain |
| `collectVerifiedMonitoringSources` | gather verified canonical/ledger sources and provenance |
| `computeMonitoringMetrics` | compute domain metrics |
| `calculateKnowledgeDebt` | compute advisory Knowledge Debt score |
| `evaluateMonitoringAlerts` | derive threshold-based alerts |
| `deduplicateAlerts` | suppress duplicate derived notifications in a window |
| `evaluateSourceProvenance` | calculate freshness/verification state |
| `buildMonitoringSnapshot` | create project monitoring snapshot |
| `verifyMonitoringSnapshot` | verify snapshot checksum/non-authority contract |
| `buildDashboardModel` | create project dashboard model |
| `buildWorkspaceDashboard` | aggregate multiple project snapshots |
| `renderDashboardHtml` | produce standalone escaped HTML view |
| `queryMonitoringEvents` | filtered derived audit query |
| `buildCorrelationTrace` | reconstruct correlation sequence |
| `compareMonitoringSnapshots` | calculate metric delta |
| `buildMetricSeries` | construct chronological series |
| `buildProjectMonitoringView` | service-level project view |
| `buildMultiProjectMonitoringView` | service-level workspace view |

## 7. Monitoring Policy Defaults

Defaults are starting values, not self-modifying policy:

| Policy | Default |
|---|---:|
| Phase age warning | 4 hours |
| Phase age high | 24 hours |
| Test pass warning below | 95% |
| Test pass high-risk below | 80% |
| Cost utilization warning | 80% |
| Cost utilization high | 100% |
| Repeated stall high | 2 |
| Model failure warning | 10% |
| Model failure high | 25% |
| Integration failure warning | 10% |
| Integration failure high | 25% |
| Knowledge Debt warning | 5 |
| Knowledge Debt high | 15 |
| Source stale warning | 1 hour |
| Alert dedup window | 15 minutes |

TASK-014 may later calibrate advisory thresholds from evidence. TASK-014 may not silently weaken mandatory safety boundaries.

## 8. Data Contracts

Machine schemas:
- `schemas/monitoring/monitoring-event.schema.json`
- `schemas/monitoring/monitoring-policy.schema.json`
- `schemas/monitoring/monitoring-snapshot.schema.json`
- `schemas/monitoring/dashboard-model.schema.json`

All use JSON Schema Draft 2020-12.

## 9. Security / Privacy

- HTML rendering escapes supplied title and metric content.
- Monitoring Event persistence is root-confined.
- Monitoring does not store secrets by design; sensitive values should be represented by redacted metric/evidence references.
- `evidence` is reference metadata, not permission to ingest unrestricted source content.
- Cross-project dashboards retain project identity and do not merge source authority.
- Monitoring cannot downgrade source verification state.
- Monitoring cannot convert unverified external data into canonical evidence.

## 10. Failure Behavior

| Failure | Required behavior |
|---|---|
| Monitoring Event checksum mismatch | reject / fail closed |
| Ledger hash-chain mismatch | reject / fail closed |
| Lifecycle record checksum mismatch | collector reject |
| Stale source | warning on snapshot/dashboard |
| Unverified source | high alert on snapshot/dashboard |
| Canonical integrity incident | critical alert |
| Missing optional source | metric remains zero/null; no fabricated value |
| Zero denominator | rate = null, never divide-by-zero |
| Invalid trend project pairing | reject |
| HTML supplied markup | escape, never execute |
| Root/symlink escape | reject |

## 11. Critic Findings Resolved During Implementation

1. Initial audit query used `structuredClone` directly as `Array.map` callback, causing the map index to be interpreted as structuredClone options. Fixed with explicit lambda.
2. Initial Dashboard had no source freshness/verification surface and could visually overstate stale data. Source Provenance and stale/unverified alerts added.
3. Initial alert_id used randomness even though alerts are rebuildable derived outputs. Replaced with deterministic content-derived identity for identical input/clock.
4. Initial metrics omitted role/model Cost breakdown, retest rate-related evidence and Knowledge application/verification/recurrence rates. Added.
5. Initial Dashboard was JSON-only. Added standalone escaped HTML output so TASK-007 includes an actual human dashboard surface without coupling to a frontend framework.
6. Canonical collectors were initially caller-only. Added verified collectors using TASK-004 Lifecycle validation, Cost Guard ledger verification and TASK-005 Knowledge verification.

Blocking findings after correction: `0`.

## 12. Residual / Future Work

- Crash-tolerant journal/recovery for Monitoring Event Ledger → TASK-009/TASK-012.
- Alert delivery to Gmail/Slack/Discord/webhook → TASK-008.
- Long-term data retention, compaction and automatic repair → TASK-012.
- Dashboard/plugin adapters → TASK-013.
- Evidence-driven adaptive thresholds → TASK-014.
- Distributed telemetry/event fabric → TASK-015.
- UI framework / hosted web service is intentionally not canonical; current standalone HTML remains portable.

## 13. Completion State

TASK-007 is complete when the Completion Evidence records the final passing counts and Canonical Architecture promotion. TASK-008 becomes the next route but is not automatically authorized by TASK-007 completion.
