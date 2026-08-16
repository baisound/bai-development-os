import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertDisjointWorklaneOwnership,
  createAutonomousWorklane,
  selectRunnableFallback,
  transitionWorklane,
  verifyAutonomousWorklane,
} from '../../src/automation/index.mjs';

const makeLane = (lane_id, extra = {}) => createAutonomousWorklane({
  lane_id,
  task_id: `TASK-${lane_id}`,
  subject_id: `developer-${lane_id}`,
  authority_grant_id: `AUTH-${lane_id}`,
  authority_epoch: 1,
  state: 'RUNNABLE',
  resource_ownership: [`src/${lane_id}.mjs`],
  allowed_capabilities: ['repo.read', 'repo.write'],
  denied_capabilities: ['release.deploy'],
  fallback_lane_ids: [],
  updated_at: '2026-08-16T00:00:00.000Z',
  ...extra,
});

test('worklane is immutable and tamper evident', () => {
  const lane = makeLane('L1');
  assert.equal(verifyAutonomousWorklane(lane).result, 'WORKLANE_VALID');
  assert.ok(Object.isFrozen(lane));
  assert.throws(() => verifyAutonomousWorklane({ ...lane, state: 'COMPLETED' }), (error) => error.code === 'WORKLANE_TAMPERED');
});

test('worklane transition table is fail closed', () => {
  const active = transitionWorklane(makeLane('L2'), { to_state: 'ACTIVE', at: '2026-08-16T00:01:00.000Z', reason_code: 'CLAIMED' });
  const done = transitionWorklane(active, { to_state: 'COMPLETED', at: '2026-08-16T00:02:00.000Z', reason_code: 'JUDGED' });
  assert.equal(done.transition_sequence, 2);
  assert.equal(done.previous_transition_checksum, active.content_checksum);
  assert.throws(() => transitionWorklane(done, { to_state: 'ACTIVE', at: '2026-08-16T00:03:00.000Z', reason_code: 'REOPEN' }), (error) => error.code === 'WORKLANE_TRANSITION_FORBIDDEN');
});

test('resource ownership conflicts cannot be hidden', () => {
  const left = makeLane('LEFT', { resource_ownership: ['src/shared.mjs'] });
  const right = makeLane('RIGHT', { resource_ownership: ['src/shared.mjs'] });
  assert.throws(() => assertDisjointWorklaneOwnership([left, right]), (error) => error.code === 'WORKLANE_RESOURCE_CONFLICT');
});

test('gate parked lane selects only an explicitly bound runnable fallback', () => {
  const fallback = makeLane('SAFE');
  const blocked = makeLane('BLOCKED', { state: 'GATE_PARKED', fallback_lane_ids: ['SAFE'] });
  assert.equal(selectRunnableFallback([blocked, fallback], 'BLOCKED').lane_id, 'SAFE');
  assert.equal(selectRunnableFallback([blocked, makeLane('SAFE', { state: 'ACTIVE' })], 'BLOCKED'), null);
});
