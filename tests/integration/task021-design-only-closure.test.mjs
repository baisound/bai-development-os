import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import test from 'node:test';
import { selectAutonomousTask } from '../../src/automation/index.mjs';
import { evaluateDependencies } from '../../src/dependency/index.mjs';
import { createCanonicalStatusSnapshotManifest, createCanonicalTaskBinding } from '../../src/lifecycle/phase1/design-only-closure.mjs';

const bindingKeys = generateKeyPairSync('ed25519');
const snapshotKeys = generateKeyPairSync('ed25519'); const clock = () => new Date('2026-08-27T00:00:00.000Z');
const canonical_status_trust = { public_key: bindingKeys.publicKey, expected_key_id: 'CANONICAL-STORE', clock };
const canonical_snapshot_trust = { public_key: snapshotKeys.publicKey, expected_key_id: 'SNAPSHOT-COORDINATOR', clock };
const canonicalBinding = createCanonicalTaskBinding({ source: 'LIFECYCLE_STORE_VERIFIED_READ', observation_id: crypto.randomUUID(), project_id: 'bai-voice-app', task_id: 'TASK-001', task_status: 'COMPLETED', task_classification: 'DESIGN_ONLY', record_revision: 15, canonical_checksum: `sha256:${'a'.repeat(64)}`, transition_id: crypto.randomUUID(), event_checksum: `sha256:${'b'.repeat(64)}`, receipt_checksum: `sha256:${'c'.repeat(64)}`, canonical_authority: false, observed_at: clock().toISOString(), expires_at: '2026-08-27T00:01:00.000Z' }, { private_key: bindingKeys.privateKey, key_id: 'CANONICAL-STORE', clock });
const canonical_status_snapshot = createCanonicalStatusSnapshotManifest([canonicalBinding], { private_key: snapshotKeys.privateKey, key_id: 'SNAPSHOT-COORDINATOR', binding_trust: canonical_status_trust, clock });
const queueTask = (task_id, extra = {}) => ({ project_id: 'bai-voice-app', task_id, priority: 'P1', owner_priority: 0, dev_profile: 'DEV_2_STANDARD', authorization: 'AUTHORIZED', dependencies: [], state: 'PENDING', human_gates: [], native_gate_required: false, paid_execution_required: false, destructive_operation_required: false, release_or_deploy_required: false, credential_required: false, design_runnable: true, implementation_runnable: true, files_owned: [`${task_id}.md`], expected_context_cost: 1, expected_runtime_minutes: 1, context_locality: 1, roadmap_order: 1, ...extra });

test('verified design-only Canonical completion recalculates dependent readiness and queue selection', () => {
  const dependencyRows = [{ project_id: 'bai-voice-app', task_id: 'TASK-002', dependency_task_ids: ['TASK-001'] }, { project_id: 'bai-voice-app', task_id: 'TASK-001', task_status: 'COMPLETED', canonical_binding: canonicalBinding }];
  assert.equal(evaluateDependencies(dependencyRows[0], dependencyRows, { project_id: 'bai-voice-app', canonical_status_trust, canonical_status_snapshot, canonical_snapshot_trust }).result, 'DEPENDENCY_READY');
  const selected = selectAutonomousTask([queueTask('TASK-001', { state: 'COMPLETED', canonical_binding: canonicalBinding }), queueTask('TASK-002', { dependencies: ['TASK-001'] })], { project_id: 'bai-voice-app', canonical_status_trust, canonical_status_snapshot, canonical_snapshot_trust });
  assert.equal(selected.selected.task_id, 'TASK-002');
});

test('queue-only completion without Canonical binding cannot unlock TASK-002', () => {
  assert.throws(() => selectAutonomousTask([queueTask('TASK-001', { state: 'COMPLETED' }), queueTask('TASK-002', { dependencies: ['TASK-001'] })]), (error) => error.code === 'QUEUE_COMPLETION_CANONICAL_MISMATCH');
});
