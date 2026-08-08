import { signEnvelope, verifySignedEnvelope } from '../security/signing.mjs';
import { DISTRIBUTED_EVIDENCE_CLASSES, DISTRIBUTED_VERSION } from './constants.mjs';
import { DistributedError } from './errors.mjs';
import { byteLength, checksumObject, deepFreeze, newId, nowIso, requireEnum, requireFinite, requireString, safeId } from './util.mjs';

export function createDistributedEventEnvelope(input = {}, { clock = () => new Date(), max_payload_bytes = 1024 * 1024 } = {}) {
  const payload = input.payload == null ? {} : structuredClone(input.payload);
  if (byteLength(payload) > max_payload_bytes) throw new DistributedError('DISTRIBUTED_PAYLOAD_TOO_LARGE');
  const evidenceClass = input.evidence_class == null ? null : requireEnum(String(input.evidence_class).toUpperCase(), DISTRIBUTED_EVIDENCE_CLASSES, 'evidence_class');
  const event = {
    distributed_event_version: DISTRIBUTED_VERSION,
    event_id: safeId(input.event_id ?? newId('DE'), 'event_id'),
    event_type: requireString(input.event_type, 'event_type').toUpperCase(),
    source: requireString(input.source ?? 'LOCAL', 'source'),
    source_node_id: safeId(input.source_node_id ?? 'local-node', 'source_node_id'),
    project_id: safeId(input.project_id, 'project_id'),
    task_id: input.task_id == null ? null : safeId(input.task_id, 'task_id'),
    revision: input.revision == null ? null : String(input.revision),
    correlation_id: safeId(input.correlation_id ?? input.event_id ?? newId('CORR'), 'correlation_id'),
    causation_id: input.causation_id == null ? null : safeId(input.causation_id, 'causation_id'),
    partition_key: safeId(input.partition_key ?? input.project_id, 'partition_key'),
    sequence: input.sequence == null ? null : requireFinite(input.sequence, 'sequence', { min: 0, integer: true }),
    idempotency_key: safeId(input.idempotency_key ?? input.event_id ?? newId('IDEM'), 'idempotency_key'),
    created_at: input.created_at ?? nowIso(clock),
    time_source: requireString(input.time_source ?? 'UTC_WALL_CLOCK', 'time_source'),
    policy_version: input.policy_version == null ? null : String(input.policy_version),
    activation_epoch: input.activation_epoch == null ? null : requireFinite(input.activation_epoch, 'activation_epoch', { min: 0, integer: true }),
    evidence_class: evidenceClass,
    authorization_ref: input.authorization_ref ?? null,
    worker_attestation_ref: input.worker_attestation_ref ?? null,
    deadline_at: input.deadline_at ?? null,
    resource_budget: input.resource_budget && typeof input.resource_budget === 'object' ? structuredClone(input.resource_budget) : {},
    payload,
  };
  if (Number.isNaN(Date.parse(event.created_at))) throw new DistributedError('DISTRIBUTED_TIME_INVALID');
  if (event.deadline_at != null && Number.isNaN(Date.parse(event.deadline_at))) throw new DistributedError('DISTRIBUTED_DEADLINE_INVALID');
  event.content_checksum = checksumObject(event);
  return deepFreeze(event);
}

export function verifyDistributedEventEnvelope(event, { max_payload_bytes = 1024 * 1024 } = {}) {
  if (!event || event.distributed_event_version !== DISTRIBUTED_VERSION) throw new DistributedError('DISTRIBUTED_EVENT_VERSION_INVALID');
  if (event.content_checksum !== checksumObject(event)) throw new DistributedError('DISTRIBUTED_EVENT_TAMPERED');
  safeId(event.event_id, 'event_id'); safeId(event.source_node_id, 'source_node_id'); safeId(event.project_id, 'project_id'); safeId(event.correlation_id, 'correlation_id'); safeId(event.partition_key, 'partition_key'); safeId(event.idempotency_key, 'idempotency_key');
  requireString(event.event_type, 'event_type'); requireString(event.source, 'source');
  if (event.evidence_class != null) requireEnum(event.evidence_class, DISTRIBUTED_EVIDENCE_CLASSES, 'evidence_class');
  if (byteLength(event.payload) > max_payload_bytes) throw new DistributedError('DISTRIBUTED_PAYLOAD_TOO_LARGE');
  if (Number.isNaN(Date.parse(event.created_at))) throw new DistributedError('DISTRIBUTED_TIME_INVALID');
  return true;
}

export function signDistributedEventEnvelope(event, signer) {
  verifyDistributedEventEnvelope(event);
  return signEnvelope(structuredClone(event), signer);
}
export function verifySignedDistributedEventEnvelope(event, options) {
  verifyDistributedEventEnvelope(event); verifySignedEnvelope(event, options); return true;
}
