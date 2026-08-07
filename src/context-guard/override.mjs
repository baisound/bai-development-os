import { createHash, randomUUID } from 'node:crypto';
import { DEFAULT_CONTEXT_GUARD_CONFIG, getGuardConfigChecksum, getTrustedRootSetChecksum, validateConfig } from './config.mjs';
import { readVerifiedEvidence, writeImmutableEvidence } from './evidence-store.mjs';
import { evaluateLimits } from './evaluate.mjs';
import { collectInputInventory, deduplicateInputs, selectInputs } from './inventory.mjs';
import { ContextGuardError } from './errors.mjs';

const OVERRIDE_FIELDS = Object.freeze([
  'override_id', 'project_id', 'task_id', 'role', 'session_id', 'overridden_limit',
  'original_limit', 'approved_limit', 'justification', 'selected_input_checksums',
  'trusted_root_set_checksum', 'guard_config_checksum', 'issued_at', 'expires_at',
  'single_use', 'owner_authority', 'override_checksum', 'content_checksum',
]);
const INPUT_OVERRIDE_FIELDS = new Set(OVERRIDE_FIELDS.filter((key) => !['trusted_root_set_checksum', 'guard_config_checksum', 'override_checksum', 'content_checksum'].includes(key)));
const OVERRIDE_LIMITS = new Set(['max_files_per_role', 'max_total_input_bytes', 'max_estimated_input_tokens']);
const OVERRIDE_ELIGIBLE_LIMITS = Object.freeze([...OVERRIDE_LIMITS].sort());
const CONFIGURED_LIMIT_KEYS = Object.freeze([
  'max_files_per_role',
  'max_total_input_bytes',
  'max_estimated_input_tokens',
  'max_estimated_output_tokens',
  'max_artifact_sections',
  'max_single_artifact_bytes',
]);
const MEASURED_VALUE_KEYS = Object.freeze([
  'selected_file_count',
  'total_input_bytes',
  'estimated_input_tokens',
  'estimated_output_tokens',
  'expected_artifact_sections',
  'estimated_artifact_bytes',
]);
const BASELINE_FIELDS = Object.freeze([
  'baseline_result_id',
  'project_id',
  'task_id',
  'role',
  'session_id',
  'decision',
  'exceeded_limits',
  'override_eligible_limit',
  'override_eligible_limits',
  'measured_values',
  'configured_limits',
  'selected_input_set_checksum',
  'trusted_root_set_checksum',
  'guard_config_checksum',
  'issued_at',
  'baseline_result_checksum',
  'content_checksum',
]);
const canonical = (value) => JSON.stringify(sort(value));
const sort = (value) => Array.isArray(value) ? value.map(sort) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, sort(value[key])])) : value;
const checksum = (value, field) => {
  const copy = { ...value }; delete copy[field]; delete copy.content_checksum;
  return `sha256:${createHash('sha256').update(canonical(copy)).digest('hex')}`;
};
const selectedChecksum = (inputs) => `sha256:${createHash('sha256').update(
  canonical(inputs.map((input) => input.content_checksum)),
).digest('hex')}`;

const schemaError = (code) => { throw new ContextGuardError(code); };
const requireString = (value) => {
  if (typeof value !== 'string') schemaError('OVERRIDE_SCHEMA_TYPE_INVALID');
  if (value.length === 0) schemaError('OVERRIDE_SCHEMA_CONSTRAINT_VIOLATION');
};
const requireChecksum = (value) => {
  requireString(value);
  if (!value.startsWith('sha256:')) schemaError('OVERRIDE_SCHEMA_CONSTRAINT_VIOLATION');
};
const requireMinimumInteger = (value) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value)) schemaError('OVERRIDE_SCHEMA_TYPE_INVALID');
  if (value < 1) schemaError('OVERRIDE_SCHEMA_MINIMUM_VIOLATION');
};
const requireNonNegativeSafeInteger = (value) => {
  if (!Number.isSafeInteger(value) || value < 0) schemaError('CONTEXT_OWNER_OVERRIDE_INVALID');
};
const requireExactKeys = (value, keys) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || Object.keys(value).length !== keys.length
    || keys.some((key) => !Object.hasOwn(value, key))
    || Object.keys(value).some((key) => !keys.includes(key))) {
    schemaError('CONTEXT_OWNER_OVERRIDE_INVALID');
  }
};
const CANONICAL_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const requireCanonicalTimestamp = (value) => {
  if (typeof value !== 'string') schemaError('OVERRIDE_SCHEMA_TYPE_INVALID');
  if (!CANONICAL_TIMESTAMP.test(value)) schemaError('OVERRIDE_SCHEMA_TIMESTAMP_INVALID');
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp) || new Date(timestamp).toISOString() !== value) {
    schemaError('OVERRIDE_SCHEMA_TIMESTAMP_INVALID');
  }
  return timestamp;
};

export function validateOverride(override, request, now = Date.now(), persisted = false) {
  if (!override || typeof override !== 'object' || Array.isArray(override)) schemaError('OVERRIDE_SCHEMA_TYPE_INVALID');
  const requiredFields = persisted ? OVERRIDE_FIELDS : [...INPUT_OVERRIDE_FIELDS];
  if (requiredFields.some((key) => !(key in override))) schemaError('OVERRIDE_SCHEMA_REQUIRED_FIELD_MISSING');
  if (Object.keys(override).some((key) => !requiredFields.includes(key))) schemaError('OVERRIDE_SCHEMA_UNKNOWN_FIELD');
  for (const key of ['override_id', 'project_id', 'task_id', 'role', 'session_id', 'justification', 'owner_authority']) requireString(override[key]);
  if (!OVERRIDE_LIMITS.has(override.overridden_limit)) schemaError('OVERRIDE_SCHEMA_ENUM_INVALID');
  requireMinimumInteger(override.original_limit);
  requireMinimumInteger(override.approved_limit);
  if (!Array.isArray(override.selected_input_checksums)) schemaError('OVERRIDE_SCHEMA_TYPE_INVALID');
  for (const value of override.selected_input_checksums) requireString(value);
  if (typeof override.single_use !== 'boolean') schemaError('OVERRIDE_SCHEMA_TYPE_INVALID');
  if (override.single_use !== true) schemaError('OVERRIDE_SCHEMA_CONSTRAINT_VIOLATION');
  const issuedAt = requireCanonicalTimestamp(override.issued_at);
  const expiresAt = requireCanonicalTimestamp(override.expires_at);
  if (issuedAt >= expiresAt) schemaError('OVERRIDE_SCHEMA_TEMPORAL_ORDER_INVALID');
  if (persisted) {
    for (const key of ['trusted_root_set_checksum', 'guard_config_checksum', 'override_checksum', 'content_checksum']) requireChecksum(override[key]);
  }
  const keys = ['project_id', 'task_id', 'role', 'session_id'];
  if (keys.some((key) => override[key] !== request[key])
    || expiresAt <= now
    || override.approved_limit < override.original_limit) throw new ContextGuardError('CONTEXT_OWNER_OVERRIDE_INVALID');
  const selected = JSON.stringify(request.selected_inputs.map((input) => input.content_checksum));
  if (JSON.stringify(override.selected_input_checksums) !== selected) throw new ContextGuardError('CONTEXT_OWNER_OVERRIDE_INVALID');
  return true;
}
function makeOverrideRecord(override, trusted_root_set_checksum, guard_config_checksum) {
  const record = {
    override_id: override.override_id,
    project_id: override.project_id,
    task_id: override.task_id,
    role: override.role,
    session_id: override.session_id,
    overridden_limit: override.overridden_limit,
    original_limit: override.original_limit,
    approved_limit: override.approved_limit,
    justification: override.justification,
    selected_input_checksums: override.selected_input_checksums,
    trusted_root_set_checksum,
    guard_config_checksum,
    issued_at: override.issued_at,
    expires_at: override.expires_at,
    single_use: true,
    owner_authority: override.owner_authority,
  };
  return { ...record, override_checksum: checksum(record, 'override_checksum') };
}

export function validatePersistedOverride(record, request, now = Date.now()) {
  if (!record || Object.keys(record).length !== OVERRIDE_FIELDS.length
    || OVERRIDE_FIELDS.some((key) => !(key in record))
    || Object.keys(record).some((key) => !OVERRIDE_FIELDS.includes(key))
    || record.override_checksum !== checksum(record, 'override_checksum')
  ) {
    throw new ContextGuardError('OVERRIDE_SCHEMA_CONSTRAINT_VIOLATION');
  }
  validateOverride(record, request, now, true);
  return true;
}

async function collectCanonicalPreflightInputs(request) {
  if (!Array.isArray(request.requested_inputs) || !request.output_estimates || typeof request.output_estimates !== 'object') {
    throw new ContextGuardError('CONTEXT_ESTIMATION_FAILED');
  }
  const inventory = await collectInputInventory(request.requested_inputs);
  const { selected } = selectInputs(deduplicateInputs(inventory));
  if (selectedChecksum(selected) !== selectedChecksum(request.selected_inputs ?? [])) throw new ContextGuardError('CONTEXT_OWNER_OVERRIDE_INVALID');
  return selected;
}

const measuredValues = (selected, output_estimates) => ({
  selected_file_count: selected.length,
  total_input_bytes: selected.reduce((total, input) => total + input.bytes, 0),
  estimated_input_tokens: selected.reduce((total, input) => total + input.estimated_tokens, 0),
  estimated_output_tokens: output_estimates.estimated_output_tokens,
  expected_artifact_sections: output_estimates.expected_top_level_sections,
  estimated_artifact_bytes: output_estimates.estimated_artifact_bytes,
});
const configuredLimits = (config) => Object.fromEntries(CONFIGURED_LIMIT_KEYS.map((key) => [key, config[key]]));
const evaluationInput = (selected, values) => ({
  selected,
  estimated_output_tokens: values.estimated_output_tokens,
  expected_top_level_sections: values.expected_artifact_sections,
  estimated_artifact_bytes: values.estimated_artifact_bytes,
});

export async function validatePersistedBaseline(record, request, selected) {
  if (!record || typeof record !== 'object' || Array.isArray(record)
    || Object.keys(record).length !== BASELINE_FIELDS.length
    || BASELINE_FIELDS.some((key) => !Object.hasOwn(record, key))
    || Object.keys(record).some((key) => !BASELINE_FIELDS.includes(key))) {
    schemaError('CONTEXT_OWNER_OVERRIDE_INVALID');
  }
  for (const key of ['baseline_result_id', 'project_id', 'task_id', 'role', 'session_id']) requireString(record[key]);
  requireCanonicalTimestamp(record.issued_at);
  requireChecksum(record.baseline_result_checksum);
  if (record.baseline_result_checksum !== checksum(record, 'baseline_result_checksum')
    || record.project_id !== request.project_id || record.task_id !== request.task_id
    || record.role !== request.role || record.session_id !== request.session_id
    || record.selected_input_set_checksum !== selectedChecksum(selected)
    || !Array.isArray(record.exceeded_limits)
    || !Array.isArray(record.override_eligible_limits)
    || record.override_eligible_limits.length !== OVERRIDE_ELIGIBLE_LIMITS.length
    || record.override_eligible_limits.some((limit, index) => limit !== OVERRIDE_ELIGIBLE_LIMITS[index])) {
    schemaError('CONTEXT_OWNER_OVERRIDE_INVALID');
  }
  requireExactKeys(record.measured_values, MEASURED_VALUE_KEYS);
  requireExactKeys(record.configured_limits, CONFIGURED_LIMIT_KEYS);
  for (const key of MEASURED_VALUE_KEYS) requireNonNegativeSafeInteger(record.measured_values[key]);
  for (const key of CONFIGURED_LIMIT_KEYS) requireMinimumInteger(record.configured_limits[key]);
  if (record.measured_values.selected_file_count !== selected.length
    || record.measured_values.total_input_bytes !== selected.reduce((total, input) => total + input.bytes, 0)
    || record.measured_values.estimated_input_tokens !== selected.reduce((total, input) => total + input.estimated_tokens, 0)) {
    schemaError('CONTEXT_OWNER_OVERRIDE_INVALID');
  }
  const config = validateConfig(DEFAULT_CONTEXT_GUARD_CONFIG);
  if (CONFIGURED_LIMIT_KEYS.some((key) => record.configured_limits[key] !== config[key])
    || record.guard_config_checksum !== getGuardConfigChecksum(config)
    || record.trusted_root_set_checksum !== await getTrustedRootSetChecksum()) {
    schemaError('CONTEXT_OWNER_OVERRIDE_INVALID');
  }
  const result = evaluateLimits(evaluationInput(selected, record.measured_values), config);
  if (record.decision !== result.decision
    || JSON.stringify(record.exceeded_limits) !== JSON.stringify(result.exceeded_limits)
    || record.override_eligible_limit !== result.override_eligible_limit) {
    schemaError('CONTEXT_OWNER_OVERRIDE_INVALID');
  }
  return Object.freeze(record);
}

async function runBaselinePreflight({ session, override, request }) {
  const config = validateConfig(DEFAULT_CONTEXT_GUARD_CONFIG);
  const selected = await collectCanonicalPreflightInputs(request);
  const result = evaluateLimits({ selected, ...request.output_estimates }, config);
  if (result.decision !== 'OWNER_OVERRIDE_REQUIRED'
    || result.override_eligible_limit !== override.overridden_limit
    || result.exceeded_limits.length !== 1
    || override.original_limit !== config[override.overridden_limit]) {
    throw new ContextGuardError('CONTEXT_OWNER_OVERRIDE_INVALID');
  }
  const record = {
    baseline_result_id: randomUUID(),
    project_id: request.project_id, task_id: request.task_id, role: request.role, session_id: request.session_id,
    decision: result.decision, override_eligible_limit: result.override_eligible_limit,
    exceeded_limits: result.exceeded_limits, override_eligible_limits: OVERRIDE_ELIGIBLE_LIMITS,
    measured_values: measuredValues(selected, request.output_estimates),
    configured_limits: configuredLimits(config), selected_input_set_checksum: selectedChecksum(selected),
    trusted_root_set_checksum: await getTrustedRootSetChecksum(), guard_config_checksum: getGuardConfigChecksum(config),
    issued_at: new Date().toISOString(),
  };
  record.baseline_result_checksum = checksum(record, 'baseline_result_checksum');
  const baseline = await writeImmutableEvidence(session, 'baseline-preflight-result.json', record);
  return validatePersistedBaseline(baseline, request, selected);
}

async function runCanonicalRepreflight({ session, override, request, baseline }) {
  const config = validateConfig({ ...DEFAULT_CONTEXT_GUARD_CONFIG, [override.overridden_limit]: override.approved_limit });
  if (override.guard_config_checksum !== getGuardConfigChecksum(config)
    || override.trusted_root_set_checksum !== await getTrustedRootSetChecksum()) {
    throw new ContextGuardError('CONTEXT_OWNER_OVERRIDE_INVALID');
  }
  const selected = await collectCanonicalPreflightInputs(request);
  const result = evaluateLimits({ selected, ...request.output_estimates }, config);
  const record = {
    result_id: randomUUID(),
    project_id: request.project_id, task_id: request.task_id, role: request.role, session_id: request.session_id,
    decision: result.decision, selected_input_set_checksum: selectedChecksum(selected),
    trusted_root_set_checksum: await getTrustedRootSetChecksum(), guard_config_checksum: getGuardConfigChecksum(config),
    estimated_output_tokens: request.output_estimates.estimated_output_tokens,
    estimated_artifact_bytes: request.output_estimates.estimated_artifact_bytes,
    expected_artifact_sections: request.output_estimates.expected_top_level_sections,
    measured_values: measuredValues(selected, request.output_estimates),
    exceeded_limits: result.exceeded_limits,
    permit_issuance_allowed: result.permit_issuance_allowed,
    role_activation_allowed: result.role_activation_allowed,
    safe_stop: result.safe_stop,
    issued_at: new Date().toISOString(),
    override_record_checksum: override.override_checksum,
    baseline_preflight_result_checksum: baseline.content_checksum,
  };
  record.result_checksum = checksum(record, 'result_checksum');
  const verified = await writeImmutableEvidence(session, 'repreflight-result.json', record);
  if (!['PASS', 'PASS_WITH_REDUCTION'].includes(verified.decision)) throw new ContextGuardError('CONTEXT_HARD_STOP');
  return verified;
}

export async function persistAndConsumeOverride({ session, override, request, ...untrusted }) {
  if (Object.hasOwn(untrusted, 'rerunPreflight') || Object.keys(untrusted).length > 0) throw new ContextGuardError('CONTEXT_OWNER_OVERRIDE_INVALID');
  validateOverride(override, request);
  if (!override.owner_authority) throw new ContextGuardError('CONTEXT_OWNER_OVERRIDE_INVALID');
  const baseline = await runBaselinePreflight({ session, override, request });
  const overrideConfig = validateConfig({ ...DEFAULT_CONTEXT_GUARD_CONFIG, [override.overridden_limit]: override.approved_limit });
  const record = makeOverrideRecord(override, await getTrustedRootSetChecksum(), getGuardConfigChecksum(overrideConfig));
  const saved = await writeImmutableEvidence(session, 'override-record.json', record);
  const verified = await readVerifiedEvidence(`${session}/override-record.json`);
  if (saved.content_checksum !== verified.content_checksum) throw new ContextGuardError('CONTEXT_EVIDENCE_CORRUPT');
  validatePersistedOverride(verified, request);
  const repreflight = await runCanonicalRepreflight({ session, override: verified, request, baseline });
  return Object.freeze({ override: verified, baseline, repreflight });
}
