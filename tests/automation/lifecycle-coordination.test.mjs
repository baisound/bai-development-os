import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createCoordinationIntentObject, createCoordinationIntentRepository,
  createLifecycleCoordinationBundle, materializeCommittedCoordination,
  recoverUnmaterializedCommittedEvents, verifyCommittedLifecycleEvent,
} from '../../src/automation/index.mjs';

function fixture(){
  const intent_object = createCoordinationIntentObject({ transaction_id: 'TX-004-20', task_id: 'TASK-020', lane_id: 'L-20', lane_revision: 2, intent_kind: 'NEXT_UNIT', intent_payload: { next: 'U-2' }, authority_coordinate: 'auth:20', lane_coordinate: 'lane:20:2', lease_coordinate: 'lease:20:3', fence_coordinate: 'fence:20:3', expected_lifecycle_revision: 8, requested_after_state: 'ACTIVE', created_at: '2026-08-16T00:00:00.000Z' });
  const bundle = createLifecycleCoordinationBundle({ transaction_id: 'TX-004-20', task_id: 'TASK-020', expected_lifecycle_revision: 8, requested_after_state: 'ACTIVE', atomic_terminal_coordinate: 'terminal:20', checkpoint_coordinate: 'checkpoint:20', intent_object, created_at: '2026-08-16T00:00:01.000Z' });
  const event = { transition_id: bundle.transaction_id, outcome: 'COMMITTED', resulting_revision: 9, entry_checksum: 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', coordination_intent_coordinate: bundle.intent_object_coordinate };
  return { intent_object, bundle, event };
}

test('TASK-004 COMMITTED event must retain exact complete object coordinate', () => {
  const { bundle, event } = fixture();
  assert.equal(verifyCommittedLifecycleEvent(bundle, event).result, 'LIFECYCLE_COORDINATION_COMMITTED');
  assert.throws(() => verifyCommittedLifecycleEvent(bundle, { ...event, coordination_intent_coordinate: { ...event.coordination_intent_coordinate, byte_length: 1 } }), (error) => error.code === 'LIFECYCLE_COORDINATION_EVENT_OBJECT_MISMATCH');
});

test('materialization is idempotent and crash recovery refuses digest-only event', () => {
  const { bundle, event } = fixture(); const repo = createCoordinationIntentRepository();
  const first = materializeCommittedCoordination(bundle, event, repo, { at: '2026-08-16T00:00:02.000Z', materialized_coordinate: 'outbox:20' });
  const second = materializeCommittedCoordination(bundle, event, repo, { at: '2026-08-16T00:00:03.000Z', materialized_coordinate: 'outbox:20' });
  assert.equal(first.materialized_record_checksum, second.materialized_record_checksum);
  const freshRepo = createCoordinationIntentRepository();
  assert.equal(recoverUnmaterializedCommittedEvents([{ bundle, event, acknowledgement: null }], freshRepo, () => ({ at: '2026-08-16T00:00:04.000Z', materialized_coordinate: 'outbox:recovered' })).length, 1);
  assert.throws(() => recoverUnmaterializedCommittedEvents([{ bundle: { content_checksum: bundle.content_checksum }, event, acknowledgement: null }], freshRepo, () => ({})), (error) => error.code === 'LIFECYCLE_COORDINATION_OBJECT_BYTES_MISSING');
});
