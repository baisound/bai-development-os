import { checksumObject, deepFreeze, requireString, sha256, stable } from './util.mjs';

export class CoordinationIntentError extends Error {
  constructor(code, message){ super(message); this.name = 'CoordinationIntentError'; this.code = code; }
}

export const COORDINATION_INTENT_KINDS = Object.freeze(['NEXT_UNIT', 'HUMAN_GATE', 'LANE_COMPLETION']);
export const COORDINATION_INTENT_REF_STATES = Object.freeze([
  'TEMPORARY', 'SEALED_UNREFERENCED', 'SUBMITTED', 'EVENT_REFERENCED',
  'MATERIALIZED', 'GC_ELIGIBLE', 'DELETED_TOMBSTONED',
]);

function requireInteger(value, name){
  if(!Number.isSafeInteger(value) || value < 0) throw new CoordinationIntentError('COORDINATION_INTENT_INTEGER_INVALID', name);
  return value;
}

export function createCoordinationIntentObject(input){
  if(!COORDINATION_INTENT_KINDS.includes(input?.intent_kind)) throw new CoordinationIntentError('COORDINATION_INTENT_KIND_INVALID', String(input?.intent_kind));
  if(input?.intent_payload === null || typeof input?.intent_payload !== 'object' || Array.isArray(input.intent_payload)) throw new CoordinationIntentError('COORDINATION_INTENT_PAYLOAD_INVALID', 'intent_payload');
  const canonicalPayload = stable(input.intent_payload);
  const payloadBytes = Buffer.from(canonicalPayload, 'utf8');
  const payloadChecksum = sha256(payloadBytes);
  const object = {
    schema: 'BAI_COORDINATION_INTENT_OBJECT_V1',
    transaction_id: requireString(input.transaction_id, 'transaction_id', CoordinationIntentError),
    task_id: requireString(input.task_id, 'task_id', CoordinationIntentError),
    lane_id: requireString(input.lane_id, 'lane_id', CoordinationIntentError),
    lane_revision: requireInteger(input.lane_revision, 'lane_revision'),
    intent_kind: input.intent_kind,
    intent_payload: structuredClone(input.intent_payload),
    authority_coordinate: requireString(input.authority_coordinate, 'authority_coordinate', CoordinationIntentError),
    lane_coordinate: requireString(input.lane_coordinate, 'lane_coordinate', CoordinationIntentError),
    lease_coordinate: requireString(input.lease_coordinate, 'lease_coordinate', CoordinationIntentError),
    fence_coordinate: requireString(input.fence_coordinate, 'fence_coordinate', CoordinationIntentError),
    expected_lifecycle_revision: requireInteger(input.expected_lifecycle_revision, 'expected_lifecycle_revision'),
    requested_after_state: requireString(input.requested_after_state, 'requested_after_state', CoordinationIntentError),
    payload_byte_length: payloadBytes.length,
    payload_sha256: payloadChecksum,
    object_id: payloadChecksum.slice('sha256:'.length),
    created_at: requireString(input.created_at, 'created_at', CoordinationIntentError),
  };
  object.content_checksum = checksumObject(object);
  return deepFreeze(object);
}

export function serializeCoordinationIntentObject(object){
  verifyCoordinationIntentObject(object);
  return Buffer.from(`${stable(object)}\n`, 'utf8');
}

export function verifyCoordinationIntentObject(object){
  if(!object || object.schema !== 'BAI_COORDINATION_INTENT_OBJECT_V1') throw new CoordinationIntentError('COORDINATION_INTENT_SCHEMA_INVALID', 'unknown');
  const payloadBytes = Buffer.from(stable(object.intent_payload), 'utf8');
  if(payloadBytes.length !== object.payload_byte_length || sha256(payloadBytes) !== object.payload_sha256 || object.object_id !== object.payload_sha256.slice('sha256:'.length)) throw new CoordinationIntentError('COORDINATION_INTENT_PAYLOAD_TAMPERED', object.object_id ?? 'unknown');
  if(checksumObject(object) !== object.content_checksum) throw new CoordinationIntentError('COORDINATION_INTENT_OBJECT_TAMPERED', object.object_id ?? 'unknown');
  return { result: 'COORDINATION_INTENT_VALID', object_id: object.object_id, content_checksum: object.content_checksum };
}

const transitions = Object.freeze({
  TEMPORARY: ['SEALED_UNREFERENCED'],
  SEALED_UNREFERENCED: ['SUBMITTED', 'GC_ELIGIBLE'],
  SUBMITTED: ['EVENT_REFERENCED'],
  EVENT_REFERENCED: ['MATERIALIZED'],
  MATERIALIZED: ['GC_ELIGIBLE'],
  GC_ELIGIBLE: ['DELETED_TOMBSTONED'],
  DELETED_TOMBSTONED: [],
});

export function createCoordinationIntentRepository(){
  const records = new Map();
  const tombstones = new Map();
  return {
    schema: 'BAI_COORDINATION_INTENT_REPOSITORY_V1', records, tombstones,
    putTemporary(object){
      verifyCoordinationIntentObject(object);
      const existing = records.get(object.object_id);
      if(existing && existing.object.content_checksum !== object.content_checksum) throw new CoordinationIntentError('COORDINATION_INTENT_OBJECT_COLLISION', object.object_id);
      if(existing) return deepFreeze(structuredClone(existing));
      const record = { object, state: 'TEMPORARY', event_coordinate: null, materialized_coordinate: null, updated_at: object.created_at };
      records.set(object.object_id, record);
      return deepFreeze(structuredClone(record));
    },
    transition(objectId, nextState, { at, event_coordinate = null, materialized_coordinate = null, proof = null } = {}){
      const record = records.get(objectId);
      if(!record) throw new CoordinationIntentError('COORDINATION_INTENT_OBJECT_MISSING', objectId);
      if(!COORDINATION_INTENT_REF_STATES.includes(nextState) || !transitions[record.state].includes(nextState)) throw new CoordinationIntentError('COORDINATION_INTENT_TRANSITION_INVALID', `${record.state}->${nextState}`);
      if(nextState === 'EVENT_REFERENCED' && !event_coordinate) throw new CoordinationIntentError('COORDINATION_INTENT_EVENT_COORDINATE_MISSING', objectId);
      if(nextState === 'MATERIALIZED' && !materialized_coordinate) throw new CoordinationIntentError('COORDINATION_INTENT_MATERIALIZED_COORDINATE_MISSING', objectId);
      if(nextState === 'GC_ELIGIBLE'){
        const required = ['committed_event_verified', 'materialized_ack_verified', 'terminal_retention_satisfied', 'no_recovery_hold', 'no_legal_hold', 'minimum_retention_elapsed'];
        if(record.state === 'MATERIALIZED' && (!proof || required.some((key) => proof[key] !== true))) throw new CoordinationIntentError('COORDINATION_INTENT_GC_PROOF_INCOMPLETE', objectId);
        if(record.state === 'SEALED_UNREFERENCED' && (!proof || proof.no_event_reference !== true || proof.lease_expired !== true || proof.fence_reconciled !== true)) throw new CoordinationIntentError('COORDINATION_INTENT_ORPHAN_PROOF_INCOMPLETE', objectId);
      }
      record.state = nextState;
      record.updated_at = requireString(at, 'at', CoordinationIntentError);
      if(event_coordinate) record.event_coordinate = event_coordinate;
      if(materialized_coordinate) record.materialized_coordinate = materialized_coordinate;
      if(nextState === 'DELETED_TOMBSTONED'){
        tombstones.set(objectId, deepFreeze({ object_id: objectId, object_checksum: record.object.content_checksum, deleted_at: record.updated_at, prior_state: 'GC_ELIGIBLE' }));
        records.delete(objectId);
        return tombstones.get(objectId);
      }
      return deepFreeze(structuredClone(record));
    },
    get(objectId){
      const record = records.get(objectId);
      if(record) return deepFreeze(structuredClone(record));
      const tombstone = tombstones.get(objectId);
      return tombstone ? deepFreeze(structuredClone(tombstone)) : null;
    },
    snapshot(){
      return deepFreeze({ records: [...records.entries()].map(([id, record]) => [id, structuredClone(record)]), tombstones: [...tombstones.entries()].map(([id, value]) => [id, structuredClone(value)]) });
    },
  };
}
