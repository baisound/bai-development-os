import { checksumObject, deepFreeze, requireString, sha256, stable } from './util.mjs';

export class AuditChainError extends Error {
  constructor(code, message){ super(message); this.name = 'AuditChainError'; this.code = code; }
}

const GENESIS = 'sha256:0000000000000000000000000000000000000000000000000000000000000000';

export function createAuditEvent(input, previous = null){
  const expectedSequence = previous ? previous.sequence + 1 : 0;
  if(input?.sequence !== expectedSequence) throw new AuditChainError('AUDIT_SEQUENCE_INVALID', `${input?.sequence}:${expectedSequence}`);
  if(previous && input.lane_id !== previous.lane_id) throw new AuditChainError('AUDIT_LANE_MISMATCH', input.lane_id);
  const event = {
    schema: 'BAI_AUDIT_EVENT_ENVELOPE_V1',
    sequence: input.sequence,
    previous_event_hash: previous?.event_hash ?? GENESIS,
    event_type: requireString(input.event_type, 'event_type', AuditChainError),
    lane_id: requireString(input.lane_id, 'lane_id', AuditChainError),
    actor_id: requireString(input.actor_id, 'actor_id', AuditChainError),
    session_id: requireString(input.session_id, 'session_id', AuditChainError),
    role: requireString(input.role, 'role', AuditChainError),
    correlation_id: requireString(input.correlation_id, 'correlation_id', AuditChainError),
    semantic_operation_id: requireString(input.semantic_operation_id, 'semantic_operation_id', AuditChainError),
    authority_epoch: Number(input.authority_epoch),
    lane_epoch: Number(input.lane_epoch),
    lease_epoch: Number(input.lease_epoch),
    before_digest: input.before_digest ?? null,
    after_digest: input.after_digest ?? null,
    signer_key_id: requireString(input.signer_key_id, 'signer_key_id', AuditChainError),
    signature_coordinate: requireString(input.signature_coordinate, 'signature_coordinate', AuditChainError),
    occurred_at: requireString(input.occurred_at, 'occurred_at', AuditChainError),
  };
  for(const name of ['authority_epoch', 'lane_epoch', 'lease_epoch']) if(!Number.isSafeInteger(event[name]) || event[name] < 0) throw new AuditChainError('AUDIT_EPOCH_INVALID', name);
  event.event_hash = sha256(stable(event));
  event.content_checksum = checksumObject(event);
  return deepFreeze(event);
}

export function verifyAuditChain(events){
  if(!Array.isArray(events)) throw new AuditChainError('AUDIT_CHAIN_INVALID', 'events');
  let previous = null;
  for(let index = 0; index < events.length; index++){
    const event = events[index];
    if(event.sequence !== index) throw new AuditChainError('AUDIT_SEQUENCE_INVALID', `${event.sequence}:${index}`);
    if(event.previous_event_hash !== (previous?.event_hash ?? GENESIS)) throw new AuditChainError('AUDIT_PREVIOUS_HASH_INVALID', String(index));
    const withoutChecksums = structuredClone(event);
    delete withoutChecksums.event_hash;
    delete withoutChecksums.content_checksum;
    if(sha256(stable(withoutChecksums)) !== event.event_hash || checksumObject(event) !== event.content_checksum) throw new AuditChainError('AUDIT_EVENT_TAMPERED', String(index));
    if(previous && event.lane_id !== previous.lane_id) throw new AuditChainError('AUDIT_LANE_MISMATCH', event.lane_id);
    previous = event;
  }
  return { result: 'AUDIT_CHAIN_VALID', event_count: events.length, chain_head: previous?.event_hash ?? GENESIS };
}

export function appendAuditEvent(events, input){
  verifyAuditChain(events);
  return [...events, createAuditEvent({ ...input, sequence: events.length }, events.at(-1) ?? null)];
}
