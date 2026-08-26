import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import test from 'node:test';
import { assertCanonicalSnapshot, bindCanonicalStatusToQueueTask } from '../../src/automation/index.mjs';
import { createCanonicalStatusSnapshotManifest, createCanonicalTaskBinding } from '../../src/lifecycle/phase1/design-only-closure.mjs';

const trustedKeys = generateKeyPairSync('ed25519'); const attackerKeys = generateKeyPairSync('ed25519');
const clock = () => new Date('2026-08-27T00:00:00.000Z');
const trust = { public_key: trustedKeys.publicKey, expected_key_id: 'CANONICAL-STORE', clock };
const binding = (status = 'COMPLETED', keys = trustedKeys, key_id = 'CANONICAL-STORE') => createCanonicalTaskBinding({ source: 'LIFECYCLE_STORE_VERIFIED_READ', observation_id: crypto.randomUUID(), project_id: 'bai-voice-app', task_id: 'TASK-001', task_status: status, task_classification: 'DESIGN_ONLY', record_revision: 15, canonical_checksum: `sha256:${'a'.repeat(64)}`, transition_id: crypto.randomUUID(), event_checksum: `sha256:${'b'.repeat(64)}`, receipt_checksum: status === 'COMPLETED' ? `sha256:${'c'.repeat(64)}` : null, canonical_authority: false, observed_at: clock().toISOString(), expires_at: '2026-08-27T00:01:00.000Z' }, { private_key: keys.privateKey, key_id, clock });

test('queue binding derives completion only from verified Canonical Store read', async () => {
  const store = { readVerifiedCanonical: async () => ({ result: 'CANONICAL_READ_VERIFIED', record: { project_id: 'bai-voice-app', task_id: 'TASK-001', task_status: 'COMPLETED' }, binding: binding() }) };
  const task = await bindCanonicalStatusToQueueTask({ project_id: 'bai-voice-app', task_id: 'TASK-001', state: 'PENDING' }, store, { canonical_status_trust: trust });
  assert.equal(task.state, 'COMPLETED'); assert.equal(task.canonical_authority, false);
});

test('projection-only completion and forged binding fail closed', async () => {
  const store = { readVerifiedCanonical: async () => ({ result: 'CANONICAL_READ_VERIFIED', record: { project_id: 'bai-voice-app', task_id: 'TASK-001', task_status: 'ACTIVE' }, binding: binding('ACTIVE') }) };
  await assert.rejects(() => bindCanonicalStatusToQueueTask({ project_id: 'bai-voice-app', task_id: 'TASK-001', state: 'COMPLETED' }, store, { canonical_status_trust: trust }), (error) => error.code === 'QUEUE_COMPLETION_CANONICAL_MISMATCH');
  const forged = { ...binding(), content_checksum: `sha256:${'0'.repeat(64)}` };
  await assert.rejects(() => bindCanonicalStatusToQueueTask({ project_id: 'bai-voice-app', task_id: 'TASK-001', state: 'PENDING' }, { readVerifiedCanonical: async () => ({ record: { project_id: 'bai-voice-app', task_id: 'TASK-001', task_status: 'COMPLETED' }, binding: forged }) }, { canonical_status_trust: trust }), (error) => error.code === 'CANONICAL_READ_NOT_VERIFIED');
  const selfConsistentForgery = binding('COMPLETED', attackerKeys, 'ATTACKER');
  await assert.rejects(() => bindCanonicalStatusToQueueTask({ project_id: 'bai-voice-app', task_id: 'TASK-001', state: 'PENDING' }, { readVerifiedCanonical: async () => ({ record: { project_id: 'bai-voice-app', task_id: 'TASK-001', task_status: 'COMPLETED' }, binding: selfConsistentForgery }) }, { canonical_status_trust: trust }), (error) => error.code === 'CANONICAL_READ_NOT_VERIFIED');
  await assert.rejects(() => bindCanonicalStatusToQueueTask({ project_id: 'wrong-project', task_id: 'TASK-001', state: 'PENDING' }, { readVerifiedCanonical: async () => ({ record: { project_id: 'bai-voice-app', task_id: 'TASK-001', task_status: 'COMPLETED' }, binding: binding() }) }, { canonical_status_trust: trust }), (error) => error.code === 'QUEUE_COMPLETION_CANONICAL_MISMATCH');
});

test('signed snapshot is exact, expiring, and optionally single-use', () => {
  const snapshotKeys = generateKeyPairSync('ed25519'); const completed = binding();
  const manifest = createCanonicalStatusSnapshotManifest([completed], { private_key: snapshotKeys.privateKey, key_id: 'SNAPSHOT-COORDINATOR', binding_trust: trust, clock, ttl_ms: 30_000 });
  const snapshot_trust = { public_key: snapshotKeys.publicKey, expected_key_id: 'SNAPSHOT-COORDINATOR', clock };
  const usage = new Set(); const task = { project_id: 'bai-voice-app', task_id: 'TASK-001', state: 'COMPLETED', canonical_binding: completed };
  assert.equal(assertCanonicalSnapshot([task], manifest, { snapshot_trust, canonical_status_trust: trust, usage_ledger: usage, consume: true }), true);
  assert.throws(() => assertCanonicalSnapshot([task], manifest, { snapshot_trust, canonical_status_trust: trust, usage_ledger: usage, consume: true }), (error) => error.code === 'QUEUE_COMPLETION_CANONICAL_MISMATCH');
  assert.throws(() => assertCanonicalSnapshot([task], manifest, { snapshot_trust: { ...snapshot_trust, clock: () => new Date('2026-08-27T00:01:00.000Z') }, canonical_status_trust: { ...trust, clock: () => new Date('2026-08-27T00:01:00.000Z') } }), (error) => error.code === 'QUEUE_COMPLETION_CANONICAL_MISMATCH');
});
