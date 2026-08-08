import { deepFreeze } from './util.mjs';

const p = (entry) => Object.freeze({ min_samples: 8, min_verified_samples: 5, strategy: 'P95', multiplier: 1, rounding: 'ROUND', effect: 'ADVISORY', ...entry });

export const DEFAULT_CALIBRATION_CATALOG = deepFreeze([
  p({ policy_key: 'governance.review_cycle_cap', subsystem: 'GOVERNANCE', metric: 'review_cycles_used', strategy: 'P95', rounding: 'CEIL', min: 0, max: 2, default_current: 1 }),
  p({ policy_key: 'governance.revalidation_ratio', subsystem: 'GOVERNANCE', metric: 'revalidation_ratio_needed', strategy: 'P90', min: 0.05, max: 1, default_current: 0.5 }),
  p({ policy_key: 'knowledge.confidence_threshold', subsystem: 'KNOWLEDGE', metric: 'effective_resolution_confidence', strategy: 'P10', min: 0, max: 1, default_current: 0.7 }),
  p({ policy_key: 'knowledge.freshness_days', subsystem: 'KNOWLEDGE', metric: 'successful_asset_age_days', strategy: 'P90', rounding: 'CEIL', min: 1, max: 3650, default_current: 180 }),
  p({ policy_key: 'automation.retry_depth', subsystem: 'AUTOMATION', metric: 'retries_before_success', strategy: 'P95', rounding: 'CEIL', min: 0, max: 4, default_current: 2 }),
  p({ policy_key: 'automation.context_token_budget', subsystem: 'AUTOMATION', metric: 'successful_context_tokens', strategy: 'P90', rounding: 'CEIL', min: 256, max: 500000, default_current: 16000 }),
  p({ policy_key: 'monitoring.alert_dedup_window_ms', subsystem: 'MONITORING', metric: 'duplicate_alert_interval_ms', strategy: 'P90', rounding: 'CEIL', min: 1000, max: 86400000, default_current: 900000 }),
  p({ policy_key: 'integration.timeout_ms', subsystem: 'INTEGRATION', metric: 'successful_latency_ms', strategy: 'P95', multiplier: 1.25, rounding: 'CEIL', min: 100, max: 300000, default_current: 30000 }),
  p({ policy_key: 'integration.retry_count', subsystem: 'INTEGRATION', metric: 'retries_before_success', strategy: 'P95', rounding: 'CEIL', min: 0, max: 5, default_current: 2 }),
  p({ policy_key: 'security.replay_window_seconds', subsystem: 'SECURITY', metric: 'verified_clock_skew_seconds', strategy: 'P99', multiplier: 1.2, rounding: 'CEIL', min: 30, max: 3600, default_current: 300 }),
  p({ policy_key: 'security.secret_lease_ttl_seconds', subsystem: 'SECURITY', metric: 'successful_secret_use_interval_seconds', strategy: 'P90', multiplier: 1.5, rounding: 'CEIL', min: 60, max: 86400, default_current: 3600 }),
  p({ policy_key: 'release.canary_percent', subsystem: 'RELEASE', metric: 'successful_canary_percent', strategy: 'P25', min: 1, max: 50, default_current: 10 }),
  p({ policy_key: 'release.soak_seconds', subsystem: 'RELEASE', metric: 'regression_detection_seconds', strategy: 'P95', multiplier: 1.1, rounding: 'CEIL', min: 60, max: 604800, default_current: 3600 }),
  p({ policy_key: 'conformance.evidence_freshness_hours', subsystem: 'CONFORMANCE', metric: 'environment_change_interval_hours', strategy: 'P25', rounding: 'FLOOR', min: 1, max: 8760, default_current: 168 }),
  p({ policy_key: 'conformance.real_execution_priority', subsystem: 'CONFORMANCE', metric: 'coverage_risk_score', strategy: 'P90', min: 0, max: 100, default_current: 50 }),
  p({ policy_key: 'maintenance.scan_interval_hours', subsystem: 'MAINTENANCE', metric: 'drift_interarrival_hours', strategy: 'P25', rounding: 'FLOOR', min: 1, max: 8760, default_current: 24 }),
  p({ policy_key: 'maintenance.checkpoint_retention_count', subsystem: 'MAINTENANCE', metric: 'rollback_checkpoint_age_count', strategy: 'P95', rounding: 'CEIL', min: 1, max: 1000, default_current: 10 }),
  p({ policy_key: 'extension.timeout_ms', subsystem: 'EXTENSION', metric: 'successful_extension_latency_ms', strategy: 'P95', multiplier: 1.25, rounding: 'CEIL', min: 50, max: 300000, default_current: 30000 }),
  p({ policy_key: 'extension.concurrency_limit', subsystem: 'EXTENSION', metric: 'successful_peak_concurrency', strategy: 'P95', rounding: 'CEIL', min: 1, max: 128, default_current: 4 }),
  p({ policy_key: 'extension.provider_health_min', subsystem: 'EXTENSION', metric: 'provider_success_rate', strategy: 'P10', min: 0.5, max: 1, default_current: 0.95 }),
]);
