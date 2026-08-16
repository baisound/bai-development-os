import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assessAutomaticTakeover, assessGateContinuation, classifyLegacyHumanGate,
  createHumanGateV2,
} from '../../src/automation/index.mjs';

test('V2 human gate parks only its lane and selects explicit safe fallback', () => {
  const gate = createHumanGateV2({
    gate_id: 'HG-2', lane_id: 'L-BLOCKED', blocked_resource_scope: ['OBS/install'],
    blocked_capabilities: ['obs.install'], safe_fallback_lane_ids: ['L-DOC'],
    system_wide_block: false, reason_code: 'OWNER_DECISION_REQUIRED', authority_epoch: 2,
    created_at: '2026-08-16T00:00:00.000Z',
  });
  const result = assessGateContinuation(gate, [{ lane_id: 'L-DOC', state: 'RUNNABLE' }]);
  assert.equal(result.result, 'FALLBACK_RUNNABLE');
  assert.equal(result.fallback.lane_id, 'L-DOC');
});

test('system wide gate cannot carry fallback and legacy gates require migration', () => {
  assert.throws(() => createHumanGateV2({ gate_id: 'HG-X', lane_id: 'L', blocked_resource_scope: [], blocked_capabilities: [], safe_fallback_lane_ids: ['L2'], system_wide_block: true, reason_code: 'GLOBAL', authority_epoch: 1, created_at: '2026-08-16T00:00:00.000Z' }), (error) => error.code === 'HUMAN_GATE_V2_SYSTEM_FALLBACK_CONFLICT');
  assert.equal(classifyLegacyHumanGate({ human_gate_schema_version: '1.0.0', safe_to_continue_other_tasks: false }).result, 'LEGACY_FAIL_CLOSED_SYSTEM_BLOCK');
});

test('automatic takeover requires stale lease authority fencing and reconciliation', () => {
  const base = { operation_id: 'OP-1', prior_lease_state: 'STALE', new_fencing_token_valid: true, authority_result: 'ALLOW' };
  assert.equal(assessAutomaticTakeover({ ...base, effect_class: 'PURE', reconciliation_receipts: [] }).result, 'AUTOMATIC_TAKEOVER_ALLOWED');
  assert.equal(assessAutomaticTakeover({ ...base, effect_class: 'IDEMPOTENT_KEYED', reconciliation_receipts: [] }).reason_code, 'RECONCILIATION_REQUIRED');
  assert.equal(assessAutomaticTakeover({ ...base, effect_class: 'UNFENCEABLE', reconciliation_receipts: ['receipt:1'] }).reason_code, 'UNFENCEABLE_EFFECT');
});
