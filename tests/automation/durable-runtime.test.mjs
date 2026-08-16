import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createAtomicUnitTerminal, createDispatchEnvelope, createDispatchOutbox,
  createDurableTargetInbox, createNotificationEnvelope, createNotificationOutbox,
  evaluateNoProgress, runAutonomousQuantum, semanticOperationId, sha256,
} from '../../src/automation/index.mjs';

const envelope = () => createDispatchEnvelope({
  dispatch_id: 'D-20', semantic_operation_id: semanticOperationId({ lane_id: 'L-20', atomic_unit_id: 'U-1', operation_kind: 'NEXT', payload: { n: 2 } }),
  lane_id: 'L-20', target_inbox_id: 'I-20', authority_grant_id: 'A-20', payload_checksum: sha256('payload'),
  created_at: '2026-08-16T00:00:00.000Z',
});

test('dispatch outbox fences concurrent workers, reclaims expired lease and never redelivers target ACK', () => {
  const outbox = createDispatchOutbox(); const item = envelope(); outbox.enqueue(item);
  outbox.claim(item.semantic_operation_id, { worker_id: 'w1', lease_epoch: 1, now: '2026-08-16T00:00:00.000Z', lease_expires_at: '2026-08-16T00:01:00.000Z' });
  assert.throws(() => outbox.claim(item.semantic_operation_id, { worker_id: 'w2', lease_epoch: 2, now: '2026-08-16T00:00:30.000Z', lease_expires_at: '2026-08-16T00:02:00.000Z' }), (error) => error.code === 'DISPATCH_LEASE_ACTIVE');
  assert.equal(outbox.reconcileLease(item.semantic_operation_id, { now: '2026-08-16T00:01:01.000Z' }).state, 'PENDING');
  outbox.claim(item.semantic_operation_id, { worker_id: 'w2', lease_epoch: 2, now: '2026-08-16T00:01:02.000Z', lease_expires_at: '2026-08-16T00:02:00.000Z' });
  outbox.markDelivered(item.semantic_operation_id, { worker_id: 'w2', lease_epoch: 2, at: '2026-08-16T00:01:03.000Z' });
  outbox.acknowledgeTarget(item.semantic_operation_id, { target_coordinate: 'inbox:20', at: '2026-08-16T00:01:04.000Z' });
  assert.throws(() => outbox.claim(item.semantic_operation_id, { worker_id: 'w3', lease_epoch: 3, now: '2026-08-16T00:03:00.000Z', lease_expires_at: '2026-08-16T00:04:00.000Z' }), (error) => error.code === 'DISPATCH_NOT_CLAIMABLE');
  assert.equal(outbox.complete(item.semantic_operation_id, { terminal_coordinate: 'terminal:20', at: '2026-08-16T00:05:00.000Z' }).state, 'TERMINAL');
});

test('target inbox deduplicates semantic operations and requires effect/result coordinates', () => {
  const inbox = createDurableTargetInbox('I-20'); const id = envelope().semantic_operation_id;
  inbox.receive({ semantic_operation_id: id, payload_checksum: sha256('payload'), persisted_coordinate: 'inbox:20' });
  inbox.receive({ semantic_operation_id: id, payload_checksum: sha256('payload'), persisted_coordinate: 'inbox:duplicate' });
  assert.equal(inbox.operations.size, 1);
  inbox.claim(id, { worker_id: 'w1', fence_epoch: 1 });
  assert.throws(() => inbox.transition(id, 'EFFECT_STARTED'), (error) => error.code === 'AUTOMATION_INPUT_INVALID');
  inbox.transition(id, 'EFFECT_STARTED', { effect_coordinate: 'effect:1' });
  inbox.transition(id, 'EFFECT_COMMITTED', { effect_coordinate: 'effect:commit:1' });
  inbox.transition(id, 'RESULT_RECORDED', { result_coordinate: 'result:1' });
  assert.equal(inbox.transition(id, 'TERMINAL_PASS', { terminal_coordinate: 'terminal:1' }).state, 'TERMINAL_PASS');
});

test('routine notification stays ledger-only while incident retries with semantic idempotency', () => {
  const outbox = createNotificationOutbox();
  const routine = createNotificationEnvelope({ event_coordinate: 'event:1', notification_class: 'ROUTINE', audience: 'OWNER', public_payload: { status: 'ACTIVE' }, created_at: '2026-08-16T00:00:00.000Z' });
  assert.equal(outbox.enqueue(routine).state, 'LEDGER_ONLY');
  const incident = createNotificationEnvelope({ event_coordinate: 'event:2', notification_class: 'INCIDENT', audience: 'OWNER', public_payload: { title: '停止', incident_code: 'NO_PROGRESS' }, created_at: '2026-08-16T00:00:00.000Z' });
  outbox.enqueue(incident); outbox.enqueue(incident);
  assert.equal(outbox.snapshot().length, 2);
  assert.equal(outbox.recordAttempt(incident.semantic_notification_id, { at: '2026-08-16T00:00:01.000Z', adapter_result: 'UNAVAILABLE' }).state, 'PENDING');
  assert.equal(outbox.recordAttempt(incident.semantic_notification_id, { at: '2026-08-16T00:00:02.000Z', adapter_result: 'DELIVERED' }).state, 'DELIVERED');
  assert.equal(outbox.acknowledge(incident.semantic_notification_id, { at: '2026-08-16T00:00:03.000Z' }).state, 'ACKNOWLEDGED');
  assert.throws(() => createNotificationEnvelope({ event_coordinate: 'event:3', notification_class: 'INCIDENT', audience: 'OWNER', public_payload: { private_path: 'C:\\secret' }, created_at: '2026-08-16T00:00:00.000Z' }), (error) => error.code === 'NOTIFICATION_FIELD_NOT_ALLOWED');
});

test('lane runner accepts exact terminal and no-progress selects declared safe fallback', async () => {
  const result = await runAutonomousQuantum({ lane_id: 'L-20', atomic_unit_id: 'U-1', lane_state: 'ACTIVE', authority_result: 'AUTHORIZED', lease_current: true, fence_current: true, started_at: '2026-08-16T00:00:00.000Z', progress_deadline: '2026-08-16T00:05:00.000Z' }, async () => createAtomicUnitTerminal({ terminal_id: 'T-20', lane_id: 'L-20', atomic_unit_id: 'U-1', type: 'NEXT_UNIT_READY', evidence_coordinate: 'evidence:20', next_unit_intent: 'intent:21', created_at: '2026-08-16T00:01:00.000Z' }));
  assert.equal(result.route.action, 'DURABLY_DISPATCH_NEXT');
  assert.equal(evaluateNoProgress({ now: '2026-08-16T00:06:00.000Z', progress_deadline: '2026-08-16T00:05:00.000Z', progress_event_count: 0, safe_fallback_intent: 'intent:audit' }).action, 'DURABLY_DISPATCH_FALLBACK');
  assert.equal(evaluateNoProgress({ now: '2026-08-16T00:06:00.000Z', progress_deadline: '2026-08-16T00:05:00.000Z', progress_event_count: 0 }).action, 'PARK_AND_ESCALATE');
});
