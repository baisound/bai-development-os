import { createHash } from 'node:crypto';
import { validateConfig } from './config.mjs';

const canonicalJson = (value) => JSON.stringify(sort(value));
const sort = (value) => Array.isArray(value) ? value.map(sort) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, sort(value[key])])) : value;

const REMOVABLE_CLASSES = new Set(['DUPLICATE', 'IRRELEVANT', 'HISTORICAL_EVIDENCE', 'CONDITIONAL_SUPPORTING']);
const OVERRIDE_ELIGIBLE_LIMITS = new Set(['max_files_per_role', 'max_total_input_bytes', 'max_estimated_input_tokens']);

const inputMetrics = (entries) => ({
  file_count: entries.length,
  total_bytes: entries.reduce((total, entry) => total + entry.bytes, 0),
  estimated_input_tokens: entries.reduce((total, entry) => total + entry.estimated_tokens, 0),
});

const inputLimitFailures = (metrics, config) => [
  ['max_files_per_role', metrics.file_count > config.max_files_per_role],
  ['max_total_input_bytes', metrics.total_bytes > config.max_total_input_bytes],
  ['max_estimated_input_tokens', metrics.estimated_input_tokens > config.max_estimated_input_tokens],
].filter(([, exceeded]) => exceeded).map(([limit]) => limit);

const outputLimitFailures = (data, config) => [
  ['max_estimated_output_tokens', data.estimated_output_tokens > config.max_estimated_output_tokens],
  ['max_single_artifact_bytes', data.estimated_artifact_bytes > config.max_single_artifact_bytes],
  ['max_artifact_sections', data.expected_top_level_sections > config.max_artifact_sections],
].filter(([, exceeded]) => exceeded).map(([limit]) => limit);

const decisionRecord = (decision, {
  reduction_applied = false, excluded_inputs = [], split_reason = null, exceeded_limits = [],
  override_eligible_limit = null, safe_stop = false, evidence = [],
} = {}) => Object.freeze({
  decision,
  role_activation_allowed: decision === 'PASS' || decision === 'PASS_WITH_REDUCTION',
  permit_issuance_allowed: decision === 'PASS' || decision === 'PASS_WITH_REDUCTION',
  reduction_applied,
  excluded_inputs,
  split_reason,
  exceeded_limits,
  override_eligible_limit,
  safe_stop,
  evidence,
});

const isKnownMeasurement = (value) => Number.isSafeInteger(value) && value >= 0;
const outputMeasurementState = (data, key) => {
  if (!Object.hasOwn(data, key)) return 'CONTEXT_OUTPUT_ESTIMATION_REQUIRED';
  return isKnownMeasurement(data[key]) ? null : 'CONTEXT_OUTPUT_ESTIMATION_INVALID';
};

export function evaluateLimits(data = {}, suppliedConfig) {
  const config = validateConfig(suppliedConfig);
  const selected = data.selected ?? data.inventory ?? [];
  const requiredMeasurements = ['estimated_output_tokens', 'estimated_artifact_bytes', 'expected_top_level_sections'];
  const outputMeasurementError = requiredMeasurements.map((key) => outputMeasurementState(data, key)).find(Boolean);
  if (!Array.isArray(selected) || data.inventory_complete === false || data.canonical_conflict === true
    || data.security_failure === true || outputMeasurementError
    || selected.some((entry) => !isKnownMeasurement(entry.bytes) || !isKnownMeasurement(entry.estimated_tokens))) {
    return decisionRecord('HARD_STOP', {
      safe_stop: true,
      evidence: [outputMeasurementError ?? 'CONTEXT_INVENTORY_INCOMPLETE_OR_SECURITY_FAILURE'],
    });
  }

  const initial = inputMetrics(selected);
  const initialFailures = inputLimitFailures(initial, config);
  const outputFailures = outputLimitFailures(data, config);
  if (initialFailures.length === 0) {
    if (outputFailures.length > 0) {
      return decisionRecord('SPLIT_REQUIRED', {
        split_reason: 'SINGLE_ARTIFACT_OUTPUT_LIMIT_EXCEEDED',
        exceeded_limits: outputFailures,
        evidence: ['CONTEXT_OUTPUT_SPLIT_REQUIRED'],
      });
    }
    return decisionRecord('PASS', { evidence: ['CONTEXT_LIMITS_WITHIN_HARD_LIMITS'] });
  }

  const excluded = selected.filter((entry) => REMOVABLE_CLASSES.has(entry.authority_class));
  const reduced = selected.filter((entry) => !REMOVABLE_CLASSES.has(entry.authority_class));
  const reducedFailures = inputLimitFailures(inputMetrics(reduced), config);
  if (reducedFailures.length === 0 && outputFailures.length > 0) {
    return decisionRecord('SPLIT_REQUIRED', {
      split_reason: 'SINGLE_ARTIFACT_OUTPUT_LIMIT_EXCEEDED',
      exceeded_limits: outputFailures,
      evidence: ['CONTEXT_OUTPUT_SPLIT_REQUIRED_AFTER_INPUT_REDUCTION'],
    });
  }
  if (excluded.length > 0 && reducedFailures.length === 0) {
    return decisionRecord('PASS_WITH_REDUCTION', {
      reduction_applied: true,
      excluded_inputs: excluded.map((entry) => entry.requested_path ?? entry.path),
      evidence: ['CONTEXT_REDUCTION_APPLIED_WITHOUT_REMOVING_MANDATORY_INPUTS'],
    });
  }

  if (reducedFailures.length === 1 && OVERRIDE_ELIGIBLE_LIMITS.has(reducedFailures[0])) {
    return decisionRecord('OWNER_OVERRIDE_REQUIRED', {
      exceeded_limits: reducedFailures,
      override_eligible_limit: reducedFailures[0],
      evidence: ['CONTEXT_SINGLE_OVERRIDE_ELIGIBLE_INPUT_LIMIT_EXCEEDED'],
    });
  }

  return decisionRecord('HARD_STOP', {
    safe_stop: true,
    exceeded_limits: [...new Set([...reducedFailures, ...outputFailures])],
    evidence: ['CONTEXT_UNRESOLVED_OR_MULTIPLE_HARD_LIMITS'],
  });
}

export const makeDecision = (data, config) => evaluateLimits(data, config);
export function createPreflightEvidence(value) {
  const record = { ...value, measured_total_bytes: value.total_bytes, estimation_label: 'estimated', created_at: new Date().toISOString() };
  const withoutChecksum = { ...record }; delete withoutChecksum.content_checksum;
  return { ...record, content_checksum: `sha256:${createHash('sha256').update(canonicalJson(withoutChecksum)).digest('hex')}` };
}
