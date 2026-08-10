import { CONSUMER_EVENT_TYPES, DEFAULT_CLIENT_POLICY, MAX_BATCH_BYTES, MAX_BATCH_EVENTS, PRIVACY_LEVELS, TRUST_LEVELS } from './constants.mjs';
import { KnowledgeEvolutionError } from './errors.mjs';
import { sanitizeConsumerEvidencePayload } from './sanitizer.mjs';
import { canonicalJson, deepFreeze, parseIso, requireNoUnknownKeys, requireNonEmptyString, requirePlainObject, safeRecordId, sha256 } from './util.mjs';

const EVENT_KEYS = ['schema_version', 'event_id', 'occurred_at', 'product', 'installation_id', 'event_type', 'privacy_level', 'payload'];
const PRODUCT_KEYS = ['product_id', 'product_version'];
const PRIVACY_ORDER = Object.freeze({ P0: 0, P1: 1, P2: 2 });

function validatePayloadSemantics(eventType, payload) {
  const stringField = (name, max = 256) => {
    if (payload[name] !== undefined) requireNonEmptyString(payload[name], `payload.${name}`, { max });
  };
  const nonneg = name => {
    if (payload[name] !== undefined && (!Number.isInteger(payload[name]) || payload[name] < 0)) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_PAYLOAD_INVALID', `${name} invalid`);
  };
  for (const name of ['feature', 'result', 'reason_code', 'component', 'error_code', 'capability', 'provider', 'version', 'category', 'recovery_action', 'action', 'status']) stringField(name);
  nonneg('duration_ms'); nonneg('retry_count'); nonneg('sample_count');
  if (payload.rating !== undefined && (!Number.isInteger(payload.rating) || payload.rating < 1 || payload.rating > 5)) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_PAYLOAD_INVALID', 'rating invalid');
  if (payload.available !== undefined && typeof payload.available !== 'boolean') throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_PAYLOAD_INVALID', 'available invalid');
  if (payload.recovered !== undefined && typeof payload.recovered !== 'boolean') throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_PAYLOAD_INVALID', 'recovered invalid');
  if (eventType === 'feature_result') { stringField('feature'); stringField('result'); }
  if (eventType === 'diagnostic') { stringField('component'); stringField('error_code'); }
  if (eventType === 'performance') { stringField('feature'); nonneg('duration_ms'); }
  if (eventType === 'capability') { stringField('capability'); if (typeof payload.available !== 'boolean') throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_PAYLOAD_INVALID', 'available required'); }
  if (eventType === 'user_feedback') { stringField('feature'); stringField('category'); if (!Number.isInteger(payload.rating)) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_PAYLOAD_INVALID', 'rating required'); }
  if (eventType === 'incident') { stringField('component'); stringField('error_code'); }
  if (eventType === 'correction') { stringField('feature'); stringField('action'); }
  if (eventType === 'adoption') { stringField('feature'); stringField('status'); }
}

export function validateConsumerEvidenceEvent(value) {
  requirePlainObject(value, 'event');
  requireNoUnknownKeys(value, EVENT_KEYS, 'event');
  if (value.schema_version !== '1.0') throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_SCHEMA_VERSION_UNSUPPORTED');
  const eventId = safeRecordId(value.event_id, 'event_id');
  const occurredAt = parseIso(value.occurred_at, 'occurred_at');
  const product = requirePlainObject(value.product, 'product');
  requireNoUnknownKeys(product, PRODUCT_KEYS, 'product');
  const productId = requireNonEmptyString(product.product_id, 'product.product_id', { max: 128 });
  const productVersion = requireNonEmptyString(product.product_version, 'product.product_version', { max: 64 });
  if (value.installation_id !== undefined && value.installation_id !== null) safeRecordId(value.installation_id, 'installation_id');
  if (!CONSUMER_EVENT_TYPES.includes(value.event_type)) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_EVENT_TYPE_INVALID');
  if (!PRIVACY_LEVELS.includes(value.privacy_level)) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_PRIVACY_LEVEL_INVALID');
  const payload = sanitizeConsumerEvidencePayload(value.event_type, value.privacy_level, value.payload);
  validatePayloadSemantics(value.event_type, payload);
  return deepFreeze({ schema_version: '1.0', event_id: eventId, occurred_at: occurredAt, product: { product_id: productId, product_version: productVersion }, installation_id: value.installation_id ?? null, event_type: value.event_type, privacy_level: value.privacy_level, payload });
}

export function validateConsumerEvidenceBatch(value, { maxEvents = MAX_BATCH_EVENTS, maxBytes = MAX_BATCH_BYTES } = {}) {
  requirePlainObject(value, 'batch');
  requireNoUnknownKeys(value, ['schema_version', 'events'], 'batch');
  if (value.schema_version !== '1.0') throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_SCHEMA_VERSION_UNSUPPORTED');
  if (!Array.isArray(value.events) || value.events.length < 1 || value.events.length > maxEvents) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_BATCH_SIZE_INVALID');
  const events = value.events.map(validateConsumerEvidenceEvent);
  const ids = new Set();
  for (const event of events) {
    if (ids.has(event.event_id)) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_BATCH_DUPLICATE_EVENT_ID');
    ids.add(event.event_id);
  }
  const normalized = { schema_version: '1.0', events };
  if (Buffer.byteLength(canonicalJson(normalized), 'utf8') > maxBytes) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_BATCH_PAYLOAD_TOO_LARGE');
  return deepFreeze(normalized);
}

function normalizeClientPolicy(value) {
  const policy = { ...DEFAULT_CLIENT_POLICY, ...(value ?? {}) };
  if (!PRIVACY_LEVELS.includes(policy.max_privacy_level)) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_POLICY_INVALID');
  if (!Number.isInteger(policy.max_batch_events) || policy.max_batch_events < 1 || policy.max_batch_events > MAX_BATCH_EVENTS) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_POLICY_INVALID');
  if (!Number.isInteger(policy.max_payload_bytes) || policy.max_payload_bytes < 1024 || policy.max_payload_bytes > MAX_BATCH_BYTES) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_POLICY_INVALID');
  if (!Number.isInteger(policy.max_outbox_bytes) || policy.max_outbox_bytes < 0) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_POLICY_INVALID');
  if (!Array.isArray(policy.enabled_features) || policy.enabled_features.some(v => typeof v !== 'string' || !v.trim())) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_POLICY_INVALID');
  if (!policy.sampling || typeof policy.sampling !== 'object' || Array.isArray(policy.sampling)) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_POLICY_INVALID');
  for (const rate of Object.values(policy.sampling)) if (typeof rate !== 'number' || !Number.isFinite(rate) || rate < 0 || rate > 1) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_POLICY_INVALID');
  return policy;
}

export function intersectClientPolicies(localPolicy, serverPolicy) {
  const local = normalizeClientPolicy(localPolicy);
  const server = normalizeClientPolicy(serverPolicy);
  const maxPrivacy = PRIVACY_ORDER[local.max_privacy_level] <= PRIVACY_ORDER[server.max_privacy_level] ? local.max_privacy_level : server.max_privacy_level;
  const localFeatures = new Set(local.enabled_features ?? []);
  const serverFeatures = new Set(server.enabled_features ?? []);
  const enabled = localFeatures.size === 0 ? [...serverFeatures] : serverFeatures.size === 0 ? [...localFeatures] : [...localFeatures].filter(x => serverFeatures.has(x));
  const keys = new Set([...Object.keys(local.sampling ?? {}), ...Object.keys(server.sampling ?? {})]);
  const sampling = {};
  for (const key of keys) sampling[key] = Math.min(local.sampling?.[key] ?? 1, server.sampling?.[key] ?? 1);
  return deepFreeze({ policy_version: `${local.policy_version}&${server.policy_version}`, sampling, enabled_features: enabled.sort(), max_batch_events: Math.min(local.max_batch_events, server.max_batch_events), max_payload_bytes: Math.min(local.max_payload_bytes, server.max_payload_bytes), max_outbox_bytes: Math.min(local.max_outbox_bytes, server.max_outbox_bytes), max_privacy_level: maxPrivacy });
}

function evidenceTypeFor(event) {
  if (event.event_type === 'correction') return 'rejected_pattern';
  if (event.event_type === 'diagnostic' || event.event_type === 'incident') return 'incident';
  if (event.event_type === 'performance') return 'performance';
  if (event.event_type === 'user_feedback' || event.event_type === 'adoption') return 'user_feedback';
  if (event.event_type === 'feature_result' && String(event.payload.result).toLowerCase() !== 'success') return 'regression';
  if (event.event_type === 'capability') return 'implementation_decision';
  return 'success_pattern';
}
function observationFor(event) {
  const p = event.payload;
  switch (event.event_type) {
    case 'feature_result': return `${p.feature} result=${p.result}`;
    case 'diagnostic': return `${p.component} diagnostic=${p.error_code}`;
    case 'performance': return `${p.feature} duration_ms=${p.duration_ms}`;
    case 'capability': return `${p.capability} available=${p.available}`;
    case 'user_feedback': return `${p.feature} feedback category=${p.category} rating=${p.rating}`;
    case 'incident': return `${p.component} incident=${p.error_code} recovered=${p.recovered ?? false}`;
    case 'correction': return `${p.feature} correction=${p.action}`;
    case 'adoption': return `${p.feature} adoption=${p.status}`;
    default: return event.event_type;
  }
}
export function mapConsumerEventToKnowledgeEvidence(value, { trustLevel = 'REGISTERED_CLIENT', architectureVersion = null, sourceCommit = null } = {}) {
  const event = validateConsumerEvidenceEvent(value);
  if (!TRUST_LEVELS.includes(trustLevel)) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_TRUST_LEVEL_INVALID');
  const digest = sha256({ event_id: event.event_id, product: event.product, occurred_at: event.occurred_at, payload: event.payload });
  return deepFreeze({
    schema_version: '1.0',
    evidence_id: `CE-${digest.slice(0, 24)}`,
    evidence_type: evidenceTypeFor(event),
    producer: { project_id: event.product.product_id, task_id: null, product_version: event.product.product_version },
    observation: observationFor(event),
    resolution: null,
    outcome: event.event_type === 'feature_result' ? event.payload.result : null,
    candidate_scope: 'project',
    provenance: { completeness: 'PARTIAL', source_commit: sourceCommit, architecture_version: architectureVersion, snapshot_sha256: null, observed_at: event.occurred_at },
    sensitivity: event.privacy_level === 'P0' ? 'INTERNAL' : 'CONFIDENTIAL',
    payload_hash: `sha256:${sha256(event.payload)}`,
    processing_status: 'VALIDATED'
  });
}
