import assert from 'node:assert/strict';
import test from 'node:test';
import {
  appendDispatchAttempt, claimInboxOperation, completeInboxOperation,
  createDispatchEnvelope, createTargetInbox, persistToTargetInbox,
  semanticOperationId,
} from '../../src/automation/index.mjs';

const base = () => createDispatchEnvelope({
  dispatch_id: 'D-1', semantic_operation_id: semanticOperationId({ lane_id: 'L-1', atomic_unit_id: 'U-1', operation_kind: 'NEXT', payload: { n: 1 } }),
  lane_id: 'L-1', target_inbox_id: 'I-1', authority_grant_id: 'A-1',
  payload_checksum: 'sha256:payload', state: 'CREATED', created_at: '2026-08-16T00:00:00.000Z',
});

test('durable dispatch ACK means target persistence and terminal is separate', () => {
  const inbox = createTargetInbox('I-1');
  const attempted = appendDispatchAttempt(base(), '2026-08-16T00:00:01.000Z');
  const persisted = persistToTargetInbox(attempted, inbox, { persisted_coordinate: 'inbox:row:1', at: '2026-08-16T00:00:02.000Z' });
  assert.equal(persisted.state, 'TARGET_PERSISTED');
  assert.equal(persisted.terminal_coordinate, null);
  const claimed = claimInboxOperation(persisted, inbox, { claimer_id: 'worker-1', at: '2026-08-16T00:00:03.000Z' });
  const terminal = completeInboxOperation(claimed, inbox, { terminal_coordinate: 'terminal:1', at: '2026-08-16T00:00:04.000Z' });
  assert.equal(terminal.state, 'TERMINAL');
});

test('at-least-once redelivery is idempotent and semantic collision rejects', () => {
  const inbox = createTargetInbox('I-1');
  const first = persistToTargetInbox(base(), inbox, { persisted_coordinate: 'inbox:row:1', at: '2026-08-16T00:00:01.000Z' });
  const duplicate = persistToTargetInbox(base(), inbox, { persisted_coordinate: 'inbox:row:2', at: '2026-08-16T00:00:02.000Z' });
  assert.equal(duplicate.target_persisted_coordinate, 'inbox:row:1');
  assert.equal(inbox.operations.size, 1);
  assert.throws(() => persistToTargetInbox(createDispatchEnvelope({ ...base(), payload_checksum: 'sha256:different', content_checksum: undefined }), inbox, { persisted_coordinate: 'inbox:row:3', at: '2026-08-16T00:00:03.000Z' }), (error) => error.code === 'SEMANTIC_OPERATION_COLLISION');
  assert.equal(first.state, 'TARGET_PERSISTED');
});
