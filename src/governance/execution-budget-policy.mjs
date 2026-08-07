import { DEVELOPMENT_PROFILES } from './adaptive-development-profile.mjs';

export const DEFAULT_EXECUTION_LIMITS = Object.freeze({
  max_retry_attempts: 2,
  max_review_cycles: 2,
  max_artifact_bytes: 262144,
  max_model_call_cost_microusd: null,
  soft_limit_ratio: 0.8,
  hard_stop_on_quota_error: true,
});

const intOrNull = (value) => value == null || (Number.isSafeInteger(value) && value >= 0);
export function deriveExecutionLimits({ profile_selection, configured = {} } = {}) {
  const merged = { ...DEFAULT_EXECUTION_LIMITS, ...configured };
  for (const field of ['max_retry_attempts','max_review_cycles','max_artifact_bytes','max_model_call_cost_microusd']) if (!intOrNull(merged[field])) throw new TypeError(`${field} must be a non-negative safe integer or null`);
  if (typeof merged.soft_limit_ratio !== 'number' || merged.soft_limit_ratio <= 0 || merged.soft_limit_ratio >= 1) throw new TypeError('soft_limit_ratio must be between 0 and 1');
  if (typeof merged.hard_stop_on_quota_error !== 'boolean') throw new TypeError('hard_stop_on_quota_error must be boolean');
  if (profile_selection?.profile_id) {
    const profile = DEVELOPMENT_PROFILES[profile_selection.profile_id]; if (!profile) throw new TypeError('unknown development profile');
    merged.max_review_cycles = Math.min(merged.max_review_cycles, profile.review_cycle_cap);
  }
  return Object.freeze(merged);
}

export function evaluateExecutionBudget({ usage = {}, limits: supplied, profile_selection, failure = null } = {}) {
  const limits = deriveExecutionLimits({ profile_selection, configured: supplied });
  const values = { retry_attempts: usage.retry_attempts ?? 0, review_cycles: usage.review_cycles ?? 0, artifact_bytes: usage.artifact_bytes ?? 0,
    model_call_cost_microusd: usage.model_call_cost_microusd ?? 0 };
  for (const value of Object.values(values)) if (!Number.isSafeInteger(value) || value < 0) throw new TypeError('execution usage must be non-negative safe integers');
  const hard = []; const soft = [];
  if (values.retry_attempts > limits.max_retry_attempts) hard.push('MAX_RETRY_ATTEMPTS');
  if (values.review_cycles > limits.max_review_cycles) hard.push('MAX_REVIEW_CYCLES');
  if (values.artifact_bytes > limits.max_artifact_bytes) hard.push('MAX_ARTIFACT_BYTES');
  if (limits.max_model_call_cost_microusd != null && values.model_call_cost_microusd > limits.max_model_call_cost_microusd) hard.push('MAX_MODEL_CALL_COST');
  if (limits.hard_stop_on_quota_error && ['QUOTA_EXCEEDED','BILLING_ERROR'].includes(failure)) hard.push(failure);
  const softCheck = (name,value,limit) => { if (limit != null && limit > 0 && value <= limit && value >= Math.floor(limit * limits.soft_limit_ratio)) soft.push(name); };
  softCheck('RETRY_ATTEMPTS_NEAR_LIMIT', values.retry_attempts, limits.max_retry_attempts);
  softCheck('REVIEW_CYCLES_NEAR_LIMIT', values.review_cycles, limits.max_review_cycles);
  softCheck('ARTIFACT_BYTES_NEAR_LIMIT', values.artifact_bytes, limits.max_artifact_bytes);
  softCheck('MODEL_CALL_COST_NEAR_LIMIT', values.model_call_cost_microusd, limits.max_model_call_cost_microusd);
  return Object.freeze({ decision: hard.length ? 'HARD_STOP' : soft.length ? 'SOFT_LIMIT' : 'PASS', hard_stop_reasons: Object.freeze(hard), warnings: Object.freeze(soft), limits, model_selection_policy: 'UNCHANGED' });
}
