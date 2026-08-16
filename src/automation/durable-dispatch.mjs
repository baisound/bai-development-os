import { checksumObject, deepFreeze, requireString, sha256, stable } from './util.mjs';

export class DurableDispatchError extends Error {
  constructor(code, message){ super(message); this.name = 'DurableDispatchError'; this.code = code; }
}

export const DISPATCH_STATES = Object.freeze(['CREATED', 'TARGET_PERSISTED', 'CLAIMED', 'TERMINAL']);

export function semanticOperationId({ lane_id, atomic_unit_id, operation_kind, payload }){
  return sha256(stable({ lane_id, atomic_unit_id, operation_kind, payload }));
}

export function createDispatchEnvelope(input){
  const envelope = {
    schema: 'BAI_DURABLE_DISPATCH_ENVELOPE_V1',
    dispatch_id: requireString(input?.dispatch_id, 'dispatch_id', DurableDispatchError),
    semantic_operation_id: requireString(input?.semantic_operation_id, 'semantic_operation_id', DurableDispatchError),
    lane_id: requireString(input?.lane_id, 'lane_id', DurableDispatchError),
    target_inbox_id: requireString(input?.target_inbox_id, 'target_inbox_id', DurableDispatchError),
    authority_grant_id: requireString(input?.authority_grant_id, 'authority_grant_id', DurableDispatchError),
    payload_checksum: requireString(input?.payload_checksum, 'payload_checksum', DurableDispatchError),
    state: input?.state ?? 'CREATED',
    delivery_attempt: Number(input?.delivery_attempt ?? 0),
    target_persisted_coordinate: input?.target_persisted_coordinate ?? null,
    terminal_coordinate: input?.terminal_coordinate ?? null,
    created_at: requireString(input?.created_at, 'created_at', DurableDispatchError),
    updated_at: requireString(input?.updated_at ?? input?.created_at, 'updated_at', DurableDispatchError),
  };
  if(!DISPATCH_STATES.includes(envelope.state)) throw new DurableDispatchError('DISPATCH_STATE_INVALID', envelope.state);
  for(const [field, value] of [['semantic_operation_id', envelope.semantic_operation_id], ['payload_checksum', envelope.payload_checksum]]) if(!/^sha256:[a-f0-9]{64}$/.test(value)) throw new DurableDispatchError('DISPATCH_CHECKSUM_INVALID', field);
  if(!Number.isSafeInteger(envelope.delivery_attempt) || envelope.delivery_attempt < 0) throw new DurableDispatchError('DISPATCH_ATTEMPT_INVALID', String(envelope.delivery_attempt));
  if(envelope.state === 'CREATED' && (envelope.target_persisted_coordinate || envelope.terminal_coordinate)) throw new DurableDispatchError('DISPATCH_COORDINATE_PREMATURE', envelope.dispatch_id);
  if(['TARGET_PERSISTED', 'CLAIMED', 'TERMINAL'].includes(envelope.state) && !envelope.target_persisted_coordinate) throw new DurableDispatchError('DISPATCH_TARGET_ACK_MISSING', envelope.dispatch_id);
  if(envelope.state === 'TERMINAL' && !envelope.terminal_coordinate) throw new DurableDispatchError('DISPATCH_TERMINAL_MISSING', envelope.dispatch_id);
  envelope.content_checksum = checksumObject(envelope);
  return deepFreeze(envelope);
}

export function verifyDispatchEnvelope(envelope){
  if(!envelope || checksumObject(envelope) !== envelope.content_checksum) throw new DurableDispatchError('DISPATCH_TAMPERED', envelope?.dispatch_id ?? 'unknown');
  return { result: 'DISPATCH_VALID', dispatch_id: envelope.dispatch_id };
}

export function appendDispatchAttempt(envelope, at){
  verifyDispatchEnvelope(envelope);
  if(envelope.state === 'TERMINAL') throw new DurableDispatchError('DISPATCH_ALREADY_TERMINAL', envelope.dispatch_id);
  return createDispatchEnvelope({ ...envelope, delivery_attempt: envelope.delivery_attempt + 1, updated_at: at });
}

export function persistToTargetInbox(envelope, inbox, { persisted_coordinate, at }){
  verifyDispatchEnvelope(envelope);
  if(envelope.target_inbox_id !== inbox.inbox_id) throw new DurableDispatchError('DISPATCH_INBOX_MISMATCH', envelope.dispatch_id);
  const existing = inbox.operations.get(envelope.semantic_operation_id);
  if(existing && existing.payload_checksum !== envelope.payload_checksum) throw new DurableDispatchError('SEMANTIC_OPERATION_COLLISION', envelope.semantic_operation_id);
  if(!existing) inbox.operations.set(envelope.semantic_operation_id, {
    dispatch_id: envelope.dispatch_id,
    payload_checksum: envelope.payload_checksum,
    state: 'TARGET_PERSISTED',
    persisted_coordinate,
  });
  return createDispatchEnvelope({ ...envelope, state: 'TARGET_PERSISTED', target_persisted_coordinate: existing?.persisted_coordinate ?? persisted_coordinate, updated_at: at });
}

export function claimInboxOperation(envelope, inbox, { claimer_id, at }){
  verifyDispatchEnvelope(envelope);
  const item = inbox.operations.get(envelope.semantic_operation_id);
  if(!item) throw new DurableDispatchError('INBOX_OPERATION_MISSING', envelope.semantic_operation_id);
  if(item.state === 'TERMINAL') return envelope.state === 'TERMINAL' ? envelope : createDispatchEnvelope({ ...envelope, state: 'TERMINAL', terminal_coordinate: item.terminal_coordinate, updated_at: at });
  if(item.state === 'CLAIMED' && item.claimer_id !== claimer_id) throw new DurableDispatchError('INBOX_OPERATION_ALREADY_CLAIMED', envelope.semantic_operation_id);
  Object.assign(item, { state: 'CLAIMED', claimer_id });
  return createDispatchEnvelope({ ...envelope, state: 'CLAIMED', updated_at: at });
}

export function completeInboxOperation(envelope, inbox, { terminal_coordinate, at }){
  verifyDispatchEnvelope(envelope);
  const item = inbox.operations.get(envelope.semantic_operation_id);
  if(!item || item.state !== 'CLAIMED') throw new DurableDispatchError('INBOX_OPERATION_NOT_CLAIMED', envelope.semantic_operation_id);
  Object.assign(item, { state: 'TERMINAL', terminal_coordinate });
  return createDispatchEnvelope({ ...envelope, state: 'TERMINAL', terminal_coordinate, updated_at: at });
}

export function createTargetInbox(inbox_id){
  return { schema: 'BAI_TARGET_INBOX_V1', inbox_id: requireString(inbox_id, 'inbox_id', DurableDispatchError), operations: new Map() };
}
