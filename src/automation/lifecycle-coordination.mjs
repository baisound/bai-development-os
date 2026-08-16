import { checksumObject, deepFreeze, requireString, stable } from './util.mjs';
import { serializeCoordinationIntentObject, verifyCoordinationIntentObject } from './coordination-intent.mjs';

export class LifecycleCoordinationError extends Error {
  constructor(code, message){ super(message); this.name = 'LifecycleCoordinationError'; this.code = code; }
}

export function createLifecycleCoordinationBundle(input){
  verifyCoordinationIntentObject(input?.intent_object);
  const bytes = serializeCoordinationIntentObject(input.intent_object);
  const bundle = {
    schema: 'BAI_LIFECYCLE_COORDINATION_BUNDLE_V1',
    transaction_id: requireString(input.transaction_id, 'transaction_id', LifecycleCoordinationError),
    task_id: requireString(input.task_id, 'task_id', LifecycleCoordinationError),
    expected_lifecycle_revision: input.expected_lifecycle_revision,
    requested_after_state: requireString(input.requested_after_state, 'requested_after_state', LifecycleCoordinationError),
    atomic_terminal_coordinate: requireString(input.atomic_terminal_coordinate, 'atomic_terminal_coordinate', LifecycleCoordinationError),
    checkpoint_coordinate: requireString(input.checkpoint_coordinate, 'checkpoint_coordinate', LifecycleCoordinationError),
    intent_object: input.intent_object,
    intent_object_coordinate: {
      schema: input.intent_object.schema,
      task_id: input.intent_object.task_id,
      transaction_id: input.intent_object.transaction_id,
      object_id: input.intent_object.object_id,
      byte_length: bytes.length,
      payload_byte_length: input.intent_object.payload_byte_length,
      payload_sha256: input.intent_object.payload_sha256,
      content_checksum: input.intent_object.content_checksum,
    },
    created_at: requireString(input.created_at, 'created_at', LifecycleCoordinationError),
  };
  if(bundle.transaction_id !== input.intent_object.transaction_id || bundle.task_id !== input.intent_object.task_id || bundle.expected_lifecycle_revision !== input.intent_object.expected_lifecycle_revision || bundle.requested_after_state !== input.intent_object.requested_after_state) throw new LifecycleCoordinationError('LIFECYCLE_COORDINATION_SCOPE_MISMATCH', bundle.transaction_id);
  if(!Number.isSafeInteger(bundle.expected_lifecycle_revision) || bundle.expected_lifecycle_revision < 0) throw new LifecycleCoordinationError('LIFECYCLE_COORDINATION_REVISION_INVALID', bundle.transaction_id);
  bundle.content_checksum = checksumObject(bundle); return deepFreeze(bundle);
}

export function verifyCommittedLifecycleEvent(bundle, event){
  if(checksumObject(bundle) !== bundle.content_checksum) throw new LifecycleCoordinationError('LIFECYCLE_COORDINATION_BUNDLE_TAMPERED', bundle.transaction_id);
  if(event?.outcome !== 'COMMITTED' || event.transition_id !== bundle.transaction_id) throw new LifecycleCoordinationError('LIFECYCLE_COORDINATION_EVENT_NOT_COMMITTED', bundle.transaction_id);
  if(!event.coordination_intent_coordinate || stable(event.coordination_intent_coordinate) !== stable(bundle.intent_object_coordinate)) throw new LifecycleCoordinationError('LIFECYCLE_COORDINATION_EVENT_OBJECT_MISMATCH', bundle.transaction_id);
  if(event.resulting_revision !== bundle.expected_lifecycle_revision + 1) throw new LifecycleCoordinationError('LIFECYCLE_COORDINATION_EVENT_REVISION_MISMATCH', bundle.transaction_id);
  return { result: 'LIFECYCLE_COORDINATION_COMMITTED', transition_id: event.transition_id, event_checksum: event.entry_checksum };
}

export function materializeCommittedCoordination(bundle, event, repository, { at, materialized_coordinate }){
  verifyCommittedLifecycleEvent(bundle, event);
  const objectId = bundle.intent_object.object_id;
  if(!repository.get(objectId)) repository.putTemporary(bundle.intent_object);
  let record = repository.get(objectId);
  if(record.state === 'TEMPORARY') record = repository.transition(objectId, 'SEALED_UNREFERENCED', { at });
  if(record.state === 'SEALED_UNREFERENCED') record = repository.transition(objectId, 'SUBMITTED', { at });
  if(record.state === 'SUBMITTED') record = repository.transition(objectId, 'EVENT_REFERENCED', { at, event_coordinate: `task004:${event.transition_id}:${event.entry_checksum}` });
  if(record.state === 'EVENT_REFERENCED') record = repository.transition(objectId, 'MATERIALIZED', { at, materialized_coordinate });
  if(record.state !== 'MATERIALIZED' || record.materialized_coordinate !== materialized_coordinate) throw new LifecycleCoordinationError('LIFECYCLE_COORDINATION_MATERIALIZATION_MISMATCH', objectId);
  const acknowledgement = {
    schema: 'BAI_COORDINATION_MATERIALIZED_ACK_V1', transition_id: event.transition_id,
    event_checksum: event.entry_checksum, intent_object_coordinate: bundle.intent_object_coordinate,
    materialized_coordinate, materialized_record_checksum: record.object.content_checksum, acknowledged_at: at,
  };
  acknowledgement.content_checksum = checksumObject(acknowledgement);
  return deepFreeze(acknowledgement);
}

export function recoverUnmaterializedCommittedEvents(items, repository, optionsFor){
  const acknowledgements = [];
  for(const { bundle, event, acknowledgement } of items){
    if(acknowledgement) continue;
    if(!bundle?.intent_object) throw new LifecycleCoordinationError('LIFECYCLE_COORDINATION_OBJECT_BYTES_MISSING', event?.transition_id ?? 'unknown');
    const options = optionsFor(bundle, event);
    acknowledgements.push(materializeCommittedCoordination(bundle, event, repository, options));
  }
  return acknowledgements;
}
