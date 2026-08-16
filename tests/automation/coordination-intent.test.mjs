import assert from 'node:assert/strict';
import test from 'node:test';
import {
  appendAuditEvent, createAuditEvent, createCoordinationIntentObject,
  createCoordinationIntentRepository, serializeCoordinationIntentObject,
  verifyAuditChain, verifyCoordinationIntentObject,
} from '../../src/automation/index.mjs';

const intent = () => createCoordinationIntentObject({
  transaction_id: 'TX-1', task_id: 'TASK-020', lane_id: 'L-1', lane_revision: 3,
  intent_kind: 'NEXT_UNIT', intent_payload: { unit_id: 'U-2', scope: ['src/a.mjs'] },
  authority_coordinate: 'authority:A-1:4', lane_coordinate: 'lane:L-1:3',
  lease_coordinate: 'lease:L-1:8', fence_coordinate: 'fence:L-1:8',
  expected_lifecycle_revision: 11, requested_after_state: 'ACTIVE',
  created_at: '2026-08-16T00:00:00.000Z',
});

test('coordination intent retains complete canonical payload bytes and detects tamper', () => {
  const object = intent();
  assert.equal(verifyCoordinationIntentObject(object).result, 'COORDINATION_INTENT_VALID');
  assert.match(serializeCoordinationIntentObject(object).toString(), /"unit_id":"U-2"/);
  assert.throws(() => verifyCoordinationIntentObject({ ...object, intent_payload: { unit_id: 'forged' } }), (error) => error.code === 'COORDINATION_INTENT_PAYLOAD_TAMPERED');
});

test('coordination intent repository enforces event/materialization and GC proof', () => {
  const repo = createCoordinationIntentRepository();
  const object = intent();
  repo.putTemporary(object);
  repo.transition(object.object_id, 'SEALED_UNREFERENCED', { at: '2026-08-16T00:00:01.000Z' });
  repo.transition(object.object_id, 'SUBMITTED', { at: '2026-08-16T00:00:02.000Z' });
  assert.throws(() => repo.transition(object.object_id, 'EVENT_REFERENCED', { at: '2026-08-16T00:00:03.000Z' }), (error) => error.code === 'COORDINATION_INTENT_EVENT_COORDINATE_MISSING');
  repo.transition(object.object_id, 'EVENT_REFERENCED', { at: '2026-08-16T00:00:03.000Z', event_coordinate: 'task004:event:12' });
  repo.transition(object.object_id, 'MATERIALIZED', { at: '2026-08-16T00:00:04.000Z', materialized_coordinate: 'outbox:9' });
  assert.throws(() => repo.transition(object.object_id, 'GC_ELIGIBLE', { at: '2026-08-16T00:00:05.000Z', proof: {} }), (error) => error.code === 'COORDINATION_INTENT_GC_PROOF_INCOMPLETE');
  repo.transition(object.object_id, 'GC_ELIGIBLE', { at: '2026-08-16T00:00:05.000Z', proof: { committed_event_verified: true, materialized_ack_verified: true, terminal_retention_satisfied: true, no_recovery_hold: true, no_legal_hold: true, minimum_retention_elapsed: true } });
  const tombstone = repo.transition(object.object_id, 'DELETED_TOMBSTONED', { at: '2026-08-16T00:00:06.000Z' });
  assert.equal(tombstone.object_checksum, object.content_checksum);
  assert.equal(repo.get(object.object_id).deleted_at, '2026-08-16T00:00:06.000Z');
});

const eventInput = { event_type: 'UNIT_ACCEPTED', lane_id: 'L-1', actor_id: 'actor-1', session_id: 'session-1', role: 'BUILDER', correlation_id: 'corr-1', semantic_operation_id: 'op-1', authority_epoch: 2, lane_epoch: 3, lease_epoch: 4, signer_key_id: 'key-1', signature_coordinate: 'security:signature:1', occurred_at: '2026-08-16T00:00:00.000Z' };

test('audit chain detects deletion reordering and mutation', () => {
  let events = [createAuditEvent({ ...eventInput, sequence: 0 })];
  events = appendAuditEvent(events, { ...eventInput, event_type: 'NEXT_DISPATCHED', occurred_at: '2026-08-16T00:00:01.000Z' });
  assert.equal(verifyAuditChain(events).event_count, 2);
  assert.throws(() => verifyAuditChain([events[1]]), (error) => error.code === 'AUDIT_SEQUENCE_INVALID');
  assert.throws(() => verifyAuditChain([events[0], { ...events[1], role: 'FORGED' }]), (error) => error.code === 'AUDIT_EVENT_TAMPERED');
});
