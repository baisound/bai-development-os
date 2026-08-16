import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createAtomicUnitTerminal, evaluateBranchCleanup, evaluateProductCompletion,
  routeAtomicUnitTerminal,
} from '../../src/automation/index.mjs';

const terminal = (extra = {}) => createAtomicUnitTerminal({
  terminal_id: 'T-1', lane_id: 'L-1', atomic_unit_id: 'U-1', type: 'NEXT_UNIT_READY',
  evidence_coordinate: 'evidence:1', next_unit_intent: 'intent:2', created_at: '2026-08-16T00:00:00.000Z', ...extra,
});

test('atomic terminal carries exactly one route and next unit is durable dispatch', () => {
  assert.equal(routeAtomicUnitTerminal(terminal()).action, 'DURABLY_DISPATCH_NEXT');
  assert.throws(() => terminal({ human_gate_coordinate: 'gate:1' }), (error) => error.code === 'ATOMIC_TERMINAL_ROUTE_CARDINALITY');
});

test('failed and unknown terminals stop and cannot invent next work', () => {
  const failed = terminal({ type: 'FAILED_KNOWN', next_unit_intent: null, failure_code: 'BUILD_FAILED' });
  assert.equal(routeAtomicUnitTerminal(failed).action, 'STOP_AND_ESCALATE');
});

test('branch cleanup requires merged reachability clean ownership and capability', () => {
  const input = { branch: 'codex/task-020', pr_state: 'MERGED', head_reachable_from_main: true, expected_head_oid: 'abc', actual_head_oid: 'abc', worktree_clean: true, worktree_binding_count: 0, active_lock_count: 0, unmerged_descendant_count: 0, protected_branch: false, delete_capability: true };
  assert.equal(evaluateBranchCleanup(input).result, 'BRANCH_CLEANUP_ELIGIBLE');
  const blocked = evaluateBranchCleanup({ ...input, worktree_binding_count: 1, delete_capability: false });
  assert.deepEqual(blocked.failed, ['no_worktree_binding', 'delete_capability']);
});

test('product complete requires same-revision current receipts Judge lifecycle and closure', () => {
  const input = {
    product_id: 'P-OBS', revision: 'r7', required_gates: ['build', 'install'],
    gate_receipts: [
      { gate_id: 'build', revision: 'r7', result: 'PASS', current_valid: true },
      { gate_id: 'install', revision: 'r7', result: 'PASS', current_valid: true },
    ],
    judge_result: 'PASS', lifecycle_state: 'COMPLETED', closure_state: 'CLOSED',
  };
  assert.equal(evaluateProductCompletion(input).result, 'PRODUCT_COMPLETE');
  const stale = evaluateProductCompletion({ ...input, gate_receipts: [input.gate_receipts[0], { ...input.gate_receipts[1], revision: 'r6' }] });
  assert.equal(stale.result, 'PRODUCT_COMPLETION_NOT_ESTABLISHED');
  assert.ok(stale.failed.includes('install:STALE_REVISION'));
  assert.throws(() => evaluateProductCompletion({ ...input, gate_receipts: [input.gate_receipts[0], input.gate_receipts[0]] }), (error) => error.code === 'COMPLETION_GATE_RECEIPT_DUPLICATE');
  const extra = evaluateProductCompletion({ ...input, gate_receipts: [...input.gate_receipts, { gate_id: 'release', revision: 'r7', result: 'PASS', current_valid: true }] });
  assert.ok(extra.failed.includes('release:EXTRA'));
});
