import { createHash } from 'node:crypto';

export const CONTEXT_COST_CONFIDENCE_LEVELS = Object.freeze([
  'EXACT_PROVIDER_REPORTED',
  'PROVIDER_STRUCTURED_ESTIMATE',
  'LOCAL_TOKENIZER_ESTIMATE',
  'CHARACTER_HEURISTIC',
  'MIXED',
  'UNAVAILABLE',
]);

export const DEFAULT_CONTEXT_OVERFETCH_POLICY = Object.freeze({
  warning_ratio: 0.10,
  major_ratio: 0.25,
  critical_ratio: 0.50,
  critical_repeat_count: 2,
});

const QUALITY_STATUSES = Object.freeze(['PASS', 'FAIL', 'UNKNOWN']);
const SHA256_PATTERN = /^sha256:[a-f0-9]{64}$/;

export class ContextCostObservatoryError extends Error {
  constructor(code, message = code) {
    super(message);
    this.name = 'ContextCostObservatoryError';
    this.code = code;
  }
}

const canonicalSort = (value) => {
  if (Array.isArray(value)) return value.map(canonicalSort);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalSort(value[key])]));
  }
  return value;
};

const canonical = (value) => JSON.stringify(canonicalSort(value));

export function contextCostRecordChecksum(record) {
  const candidate = structuredClone(record);
  delete candidate.content_checksum;
  return `sha256:${createHash('sha256').update(canonical(candidate)).digest('hex')}`;
}

const deepFreeze = (value) => {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
};

const requiredText = (value, name) => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ContextCostObservatoryError('CONTEXT_COST_SCHEMA_INVALID', `${name} required`);
  }
  return value;
};

const nullableText = (value, name) => {
  if (value == null) return null;
  return requiredText(value, name);
};

const nullableTokenCount = (value, name) => {
  if (value == null) return null;
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new ContextCostObservatoryError('CONTEXT_COST_SCHEMA_INVALID', `${name} invalid`);
  }
  return value;
};

const tokenCount = (value, name) => {
  const count = nullableTokenCount(value, name);
  if (count == null) {
    throw new ContextCostObservatoryError('CONTEXT_COST_SCHEMA_INVALID', `${name} required`);
  }
  return count;
};

const nullableBoolean = (value, name) => {
  if (value == null) return null;
  if (typeof value !== 'boolean') {
    throw new ContextCostObservatoryError('CONTEXT_COST_SCHEMA_INVALID', `${name} invalid`);
  }
  return value;
};

const ratio = (numerator, denominator) => denominator === 0
  ? 0
  : Number((numerator / denominator).toFixed(6));

const normalizePolicy = (policy) => {
  const normalized = { ...DEFAULT_CONTEXT_OVERFETCH_POLICY, ...policy };
  const ratios = ['warning_ratio', 'major_ratio', 'critical_ratio'];
  for (const name of ratios) {
    if (typeof normalized[name] !== 'number' || !Number.isFinite(normalized[name])
      || normalized[name] < 0 || normalized[name] > 1) {
      throw new ContextCostObservatoryError('CONTEXT_OVERFETCH_POLICY_INVALID', `${name} invalid`);
    }
  }
  if (!(normalized.warning_ratio < normalized.major_ratio
    && normalized.major_ratio < normalized.critical_ratio)) {
    throw new ContextCostObservatoryError(
      'CONTEXT_OVERFETCH_POLICY_INVALID',
      'overfetch ratios must be strictly increasing',
    );
  }
  if (!Number.isSafeInteger(normalized.critical_repeat_count)
    || normalized.critical_repeat_count < 1) {
    throw new ContextCostObservatoryError(
      'CONTEXT_OVERFETCH_POLICY_INVALID',
      'critical_repeat_count invalid',
    );
  }
  return Object.freeze(normalized);
};

const normalizeSource = (source) => {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    throw new ContextCostObservatoryError('CONTEXT_COST_SCHEMA_INVALID', 'source invalid');
  }
  const sha256 = nullableText(source.sha256, 'sha256');
  if (sha256 != null && !SHA256_PATTERN.test(sha256)) {
    throw new ContextCostObservatoryError('CONTEXT_COST_SCHEMA_INVALID', 'sha256 invalid');
  }
  const normalized = {
    source_id: requiredText(source.source_id, 'source_id'),
    source_type: requiredText(source.source_type, 'source_type'),
    path_or_ref: nullableText(source.path_or_ref, 'path_or_ref'),
    sha256,
    estimated_tokens: tokenCount(source.estimated_tokens, 'estimated_tokens'),
    observed_tokens: nullableTokenCount(source.observed_tokens, 'observed_tokens'),
    selected_reason: requiredText(source.selected_reason, 'selected_reason'),
    mandatory: source.mandatory,
    cacheable: source.cacheable,
    changed_since_previous_session: nullableBoolean(
      source.changed_since_previous_session,
      'changed_since_previous_session',
    ),
    used_in_decision: nullableBoolean(source.used_in_decision, 'used_in_decision'),
    used_in_patch: nullableBoolean(source.used_in_patch, 'used_in_patch'),
    duplicate_of: nullableText(source.duplicate_of, 'duplicate_of'),
    stale: nullableBoolean(source.stale, 'stale'),
    trust_level: nullableText(source.trust_level, 'trust_level'),
  };
  if (typeof normalized.mandatory !== 'boolean' || typeof normalized.cacheable !== 'boolean') {
    throw new ContextCostObservatoryError(
      'CONTEXT_COST_SCHEMA_INVALID',
      'mandatory and cacheable must be boolean',
    );
  }
  if (normalized.duplicate_of === normalized.source_id) {
    throw new ContextCostObservatoryError('CONTEXT_COST_SCHEMA_INVALID', 'source cannot duplicate itself');
  }
  return Object.freeze(normalized);
};

const normalizeUsage = (usage, confidence) => {
  if (!usage || typeof usage !== 'object' || Array.isArray(usage)) {
    throw new ContextCostObservatoryError('CONTEXT_COST_SCHEMA_INVALID', 'usage required');
  }
  const normalized = {
    observed_input_tokens: nullableTokenCount(usage.observed_input_tokens, 'observed_input_tokens'),
    observed_cached_input_tokens: nullableTokenCount(
      usage.observed_cached_input_tokens,
      'observed_cached_input_tokens',
    ),
    observed_output_tokens: nullableTokenCount(usage.observed_output_tokens, 'observed_output_tokens'),
    billed_tokens: nullableTokenCount(usage.billed_tokens, 'billed_tokens'),
  };
  if (normalized.observed_cached_input_tokens != null
    && normalized.observed_input_tokens != null
    && normalized.observed_cached_input_tokens > normalized.observed_input_tokens) {
    throw new ContextCostObservatoryError(
      'CONTEXT_COST_SCHEMA_INVALID',
      'observed_cached_input_tokens exceeds observed_input_tokens',
    );
  }
  if (confidence === 'EXACT_PROVIDER_REPORTED'
    && normalized.observed_input_tokens == null
    && normalized.observed_output_tokens == null) {
    throw new ContextCostObservatoryError(
      'CONTEXT_COST_OBSERVED_USAGE_REQUIRED',
      'exact provider confidence requires observed usage',
    );
  }
  if (confidence === 'UNAVAILABLE'
    && Object.values(normalized).some((value) => value != null)) {
    throw new ContextCostObservatoryError(
      'CONTEXT_COST_SCHEMA_INVALID',
      'unavailable confidence cannot carry usage values',
    );
  }
  return Object.freeze(normalized);
};

const buildFinding = (avoidableRatio, repeatCount, policy) => {
  let severity = null;
  if (avoidableRatio >= policy.critical_ratio && repeatCount >= policy.critical_repeat_count) {
    severity = 'CRITICAL';
  } else if (avoidableRatio >= policy.major_ratio) {
    severity = 'MAJOR';
  } else if (avoidableRatio >= policy.warning_ratio) {
    severity = 'WARNING';
  } else if (avoidableRatio > 0) {
    severity = 'INFO';
  }
  if (severity == null) return [];
  return [{
    code: 'CONTEXT_OVERFETCH',
    severity,
    avoidable_ratio: avoidableRatio,
    repeated_occurrences: repeatCount,
  }];
};

export function createContextCostRecord(input, { overfetch_policy = {} } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new ContextCostObservatoryError('CONTEXT_COST_SCHEMA_INVALID', 'input required');
  }
  const confidence = requiredText(input.confidence, 'confidence');
  if (!CONTEXT_COST_CONFIDENCE_LEVELS.includes(confidence)) {
    throw new ContextCostObservatoryError('CONTEXT_COST_SCHEMA_INVALID', 'confidence invalid');
  }
  const qualityStatus = requiredText(input.quality_gate?.status, 'quality_gate.status');
  if (!QUALITY_STATUSES.includes(qualityStatus)) {
    throw new ContextCostObservatoryError('CONTEXT_COST_SCHEMA_INVALID', 'quality status invalid');
  }
  const recordedAt = requiredText(input.recorded_at, 'recorded_at');
  if (Number.isNaN(Date.parse(recordedAt))) {
    throw new ContextCostObservatoryError('CONTEXT_COST_SCHEMA_INVALID', 'recorded_at invalid');
  }
  if (!Array.isArray(input.sources)) {
    throw new ContextCostObservatoryError('CONTEXT_COST_SCHEMA_INVALID', 'sources required');
  }
  const sources = input.sources.map(normalizeSource);
  if (new Set(sources.map((source) => source.source_id)).size !== sources.length) {
    throw new ContextCostObservatoryError('CONTEXT_COST_SCHEMA_INVALID', 'source_id must be unique');
  }
  const sourceIds = new Set(sources.map((source) => source.source_id));
  for (const source of sources) {
    if (source.duplicate_of != null && !sourceIds.has(source.duplicate_of)) {
      throw new ContextCostObservatoryError(
        'CONTEXT_COST_SCHEMA_INVALID',
        `duplicate source target missing: ${source.duplicate_of}`,
      );
    }
  }
  const repeatCount = input.repeated_overfetch_count ?? 0;
  if (!Number.isSafeInteger(repeatCount) || repeatCount < 0) {
    throw new ContextCostObservatoryError(
      'CONTEXT_COST_SCHEMA_INVALID',
      'repeated_overfetch_count invalid',
    );
  }
  const policy = normalizePolicy(overfetch_policy);
  const usage = normalizeUsage(input.usage, confidence);
  const estimatedInputTokens = sources.reduce((sum, source) => sum + source.estimated_tokens, 0);
  if (!Number.isSafeInteger(estimatedInputTokens)) {
    throw new ContextCostObservatoryError('CONTEXT_COST_SCHEMA_INVALID', 'estimated token total unsafe');
  }
  const tokensFor = (predicate) => sources
    .filter(predicate)
    .reduce((sum, source) => sum + source.estimated_tokens, 0);
  const isUsed = (source) => source.used_in_decision === true || source.used_in_patch === true;
  const isUnused = (source) => source.used_in_decision === false && source.used_in_patch === false;
  const isDuplicate = (source) => source.duplicate_of != null;
  const isStale = (source) => source.stale === true;
  const isAvoidable = (source) => isDuplicate(source)
    || isStale(source)
    || (!source.mandatory && isUnused(source));
  const duplicateTokens = tokensFor(isDuplicate);
  const staleTokens = tokensFor(isStale);
  const usefulTokens = tokensFor((source) => isUsed(source) && !isDuplicate(source) && !isStale(source));
  const avoidableTokens = tokensFor(isAvoidable);
  const metrics = {
    source_count: sources.length,
    estimated_input_tokens: estimatedInputTokens,
    duplicate_tokens: duplicateTokens,
    stale_tokens: staleTokens,
    useful_tokens: usefulTokens,
    avoidable_tokens: avoidableTokens,
    duplicate_ratio: ratio(duplicateTokens, estimatedInputTokens),
    stale_ratio: ratio(staleTokens, estimatedInputTokens),
    useful_ratio: ratio(usefulTokens, estimatedInputTokens),
    avoidable_ratio: ratio(avoidableTokens, estimatedInputTokens),
  };
  const findings = buildFinding(metrics.avoidable_ratio, repeatCount, policy);
  const efficiencyScore = qualityStatus === 'UNKNOWN'
    ? null
    : qualityStatus === 'FAIL'
      ? 0
      : Number((metrics.useful_ratio
        * (1 - metrics.duplicate_ratio)
        * (1 - metrics.stale_ratio)
        * 100).toFixed(2));
  const record = {
    context_cost_schema_version: '1.0.0',
    record_id: requiredText(input.record_id, 'record_id'),
    task_id: requiredText(input.task_id, 'task_id'),
    session_id: requiredText(input.session_id, 'session_id'),
    phase: requiredText(input.phase, 'phase'),
    recorded_at: new Date(recordedAt).toISOString(),
    confidence,
    sources,
    usage: {
      estimated_input_tokens: estimatedInputTokens,
      ...usage,
    },
    quality_gate: {
      status: qualityStatus,
      gate_id: nullableText(input.quality_gate.gate_id, 'quality_gate.gate_id'),
    },
    efficiency: {
      status: qualityStatus === 'UNKNOWN' ? 'UNAVAILABLE' : 'AVAILABLE',
      score: efficiencyScore,
      formula: 'useful_ratio*(1-duplicate_ratio)*(1-stale_ratio)*100',
    },
    metrics,
    overfetch_policy: policy,
    repeated_overfetch_count: repeatCount,
    findings,
  };
  record.content_checksum = contextCostRecordChecksum(record);
  return deepFreeze(record);
}

export function validateContextCostRecord(record) {
  if (!record || record.context_cost_schema_version !== '1.0.0'
    || typeof record.content_checksum !== 'string'
    || !SHA256_PATTERN.test(record.content_checksum)
    || record.content_checksum !== contextCostRecordChecksum(record)) {
    throw new ContextCostObservatoryError('CONTEXT_COST_RECORD_TAMPERED');
  }
  const rebuilt = createContextCostRecord({
    record_id: record.record_id,
    task_id: record.task_id,
    session_id: record.session_id,
    phase: record.phase,
    recorded_at: record.recorded_at,
    confidence: record.confidence,
    sources: record.sources,
    usage: record.usage,
    quality_gate: record.quality_gate,
    repeated_overfetch_count: record.repeated_overfetch_count,
  }, { overfetch_policy: record.overfetch_policy });
  if (rebuilt.content_checksum !== record.content_checksum) {
    throw new ContextCostObservatoryError('CONTEXT_COST_RECORD_INVALID');
  }
  return Object.freeze({
    result: 'CONTEXT_COST_RECORD_VALID',
    record_id: record.record_id,
    content_checksum: record.content_checksum,
  });
}
