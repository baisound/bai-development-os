export const MONITORING_VERSION = '1.0.0';
export const SEVERITIES = Object.freeze(['INFO','WARNING','HIGH','CRITICAL']);
export const HEALTH_STATES = Object.freeze(['HEALTHY','DEGRADED','AT_RISK','CRITICAL']);
export const COMPONENTS = Object.freeze(['LIFECYCLE','QUALITY','AUTOMATION','CONTEXT','COST','MODEL','KNOWLEDGE','REGISTRY','INTEGRATION','GOVERNANCE','SYSTEM']);
export const DEFAULT_MONITORING_POLICY = Object.freeze({
  phase_age_warning_ms: 4 * 60 * 60 * 1000,
  phase_age_high_ms: 24 * 60 * 60 * 1000,
  test_pass_rate_warning_below: 0.95,
  test_pass_rate_high_below: 0.80,
  cost_utilization_warning_at: 0.80,
  cost_utilization_high_at: 1.00,
  repeated_stall_high_at: 2,
  model_failure_warning_at: 0.10,
  model_failure_high_at: 0.25,
  integration_failure_warning_at: 0.10,
  integration_failure_high_at: 0.25,
  knowledge_debt_warning_at: 5,
  knowledge_debt_high_at: 15,
  stale_knowledge_warning_at: 1,
  registry_verify_failure_high_at: 1,
  mandatory_knowledge_missing_high_at: 1,
  governance_verify_failure_high_at: 1,
  alert_dedup_window_ms: 15 * 60 * 1000,
  source_stale_warning_ms: 60 * 60 * 1000,
});
export const KNOWLEDGE_DEBT_WEIGHTS = Object.freeze({CANDIDATE:1, STALE:2, DUPLICATE:1.5, OWNERLESS:3, INVALID:5, CONFLICT:4});
