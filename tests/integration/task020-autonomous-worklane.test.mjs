import assert from 'node:assert/strict';
import test from 'node:test';
import {
  claimInboxOperation, completeInboxOperation, createAtomicUnitTerminal,
  createAutonomousWorklane, createDispatchEnvelope, createHumanGateV2,
  createStandingAuthorityGrant, createTargetInbox, evaluateProductCompletion,
  evaluateStandingAuthority, persistToTargetInbox, routeAtomicUnitTerminal,
  selectRunnableFallback, semanticOperationId, transitionWorklane,
} from '../../src/automation/index.mjs';

test('TASK-020 end-to-end lane continues without chat relay and closes only on exact evidence', () => {
  const grant = createStandingAuthorityGrant({
    grant_id: 'AUTH-T020', issuer_id: 'OWNER', subject_id: 'developer-2', epoch: 1,
    valid_from: '2026-08-16T00:00:00.000Z', valid_until: '2026-08-17T00:00:00.000Z',
    allowed_capabilities: ['repo.read', 'repo.write', 'test.run'], denied_capabilities: ['release.deploy'],
    resource_scope: ['TASK-020'], evidence_coordinate: 'owner:directive:1', signature_evidence: 'verified:fixture',
  });
  const authority = evaluateStandingAuthority(grant, { subject_id: 'developer-2', resource: 'TASK-020', capabilities: ['repo.write', 'test.run'] }, {
    now: '2026-08-16T01:00:00.000Z', current_epoch: 1, verify_signature: () => true,
  });
  assert.equal(authority.result, 'ALLOW');

  const implementation = createAutonomousWorklane({
    lane_id: 'LANE-IMPL', task_id: 'TASK-020', subject_id: 'developer-2', authority_grant_id: grant.grant_id,
    authority_epoch: 1, state: 'RUNNABLE', resource_ownership: ['src/automation/worklane.mjs'],
    allowed_capabilities: ['repo.write', 'test.run'], denied_capabilities: ['release.deploy'],
    fallback_lane_ids: ['LANE-DOCS'], updated_at: '2026-08-16T01:00:00.000Z',
  });
  const docs = createAutonomousWorklane({
    lane_id: 'LANE-DOCS', task_id: 'TASK-020', subject_id: 'developer-1', authority_grant_id: 'AUTH-DOCS',
    authority_epoch: 1, state: 'RUNNABLE', resource_ownership: ['tasks/TASK-020/task.md'],
    allowed_capabilities: ['repo.write'], denied_capabilities: ['release.deploy'], fallback_lane_ids: [],
    updated_at: '2026-08-16T01:00:00.000Z',
  });
  const parked = transitionWorklane(transitionWorklane(implementation, { to_state: 'ACTIVE', at: '2026-08-16T01:01:00.000Z', reason_code: 'CLAIMED' }), { to_state: 'GATE_PARKED', at: '2026-08-16T01:02:00.000Z', reason_code: 'OWNER_GATE' });
  createHumanGateV2({ gate_id: 'HG-1', lane_id: parked.lane_id, blocked_resource_scope: ['native.install'], blocked_capabilities: ['native.install'], safe_fallback_lane_ids: ['LANE-DOCS'], system_wide_block: false, reason_code: 'INSTALL_AUTHORITY_REQUIRED', authority_epoch: 1, created_at: '2026-08-16T01:02:00.000Z' });
  assert.equal(selectRunnableFallback([parked, docs], parked.lane_id).lane_id, 'LANE-DOCS');

  const unitTerminal = createAtomicUnitTerminal({ terminal_id: 'TERM-1', lane_id: docs.lane_id, atomic_unit_id: 'UNIT-1', type: 'NEXT_UNIT_READY', evidence_coordinate: 'evidence:unit-1', next_unit_intent: 'intent:unit-2', created_at: '2026-08-16T01:03:00.000Z' });
  assert.equal(routeAtomicUnitTerminal(unitTerminal).action, 'DURABLY_DISPATCH_NEXT');
  const payload = { intent: unitTerminal.next_unit_intent };
  const envelope = createDispatchEnvelope({ dispatch_id: 'DISPATCH-1', semantic_operation_id: semanticOperationId({ lane_id: docs.lane_id, atomic_unit_id: 'UNIT-2', operation_kind: 'RUN', payload }), lane_id: docs.lane_id, target_inbox_id: 'INBOX-DOCS', authority_grant_id: 'AUTH-DOCS', payload_checksum: 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', created_at: '2026-08-16T01:03:00.000Z' });
  const inbox = createTargetInbox('INBOX-DOCS');
  const persisted = persistToTargetInbox(envelope, inbox, { persisted_coordinate: 'inbox:1', at: '2026-08-16T01:04:00.000Z' });
  const claimed = claimInboxOperation(persisted, inbox, { claimer_id: 'developer-1', at: '2026-08-16T01:05:00.000Z' });
  const completed = completeInboxOperation(claimed, inbox, { terminal_coordinate: 'terminal:unit-2', at: '2026-08-16T01:06:00.000Z' });
  assert.equal(completed.state, 'TERMINAL');

  const product = evaluateProductCompletion({
    product_id: 'TASK-020', revision: 'r1', required_gates: ['focused', 'integration'],
    gate_receipts: [
      { gate_id: 'focused', revision: 'r1', result: 'PASS', current_valid: true },
      { gate_id: 'integration', revision: 'r1', result: 'PASS', current_valid: true },
    ],
    judge_result: 'PASS', lifecycle_state: 'COMPLETED', closure_state: 'CLOSED',
  });
  assert.equal(product.result, 'PRODUCT_COMPLETE');
});
