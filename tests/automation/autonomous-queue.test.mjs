import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import test from 'node:test';
import {
  assertAutonomousWorkMode,
  createHumanGate,
  selectAutonomousTask,
  validateHumanGate,
} from '../../src/automation/index.mjs';
import { createCanonicalStatusSnapshotManifest, createCanonicalTaskBinding } from '../../src/lifecycle/phase1/design-only-closure.mjs';

const bindingKeys = generateKeyPairSync('ed25519');
const snapshotKeys = generateKeyPairSync('ed25519');
const fixedClock = () => new Date('2026-08-27T00:00:00.000Z');
const canonical_status_trust = { public_key: bindingKeys.publicKey, expected_key_id: 'CANONICAL-STORE', clock: fixedClock };
const canonical_snapshot_trust = { public_key: snapshotKeys.publicKey, expected_key_id: 'SNAPSHOT-COORDINATOR', clock: fixedClock };
const completionBinding = (task_id) => createCanonicalTaskBinding({ source: 'LIFECYCLE_STORE_VERIFIED_READ', observation_id: crypto.randomUUID(), project_id: 'fixture', task_id, task_status: 'COMPLETED', task_classification: 'IMPLEMENTATION', record_revision: 1, canonical_checksum: `sha256:${'a'.repeat(64)}`, transition_id: crypto.randomUUID(), event_checksum: `sha256:${'b'.repeat(64)}`, receipt_checksum: null, canonical_authority: false, observed_at: fixedClock().toISOString(), expires_at: '2026-08-27T00:01:00.000Z' }, { private_key: bindingKeys.privateKey, key_id: 'CANONICAL-STORE', clock: fixedClock });
const snapshot = (bindings) => createCanonicalStatusSnapshotManifest(bindings, { private_key: snapshotKeys.privateKey, key_id: 'SNAPSHOT-COORDINATOR', binding_trust: canonical_status_trust, clock: fixedClock });

const gate = (task_id, extra = {}) => createHumanGate({
  gate_id: `HG-${task_id}-001`,
  task_id,
  type: 'NATIVE_EXTERNAL_APPLICATION',
  status: 'WAITING_OWNER',
  reason_code: 'NATIVE_EVIDENCE_REQUIRED',
  required_environment: ['Windows'],
  safe_to_continue_other_tasks: true,
  blocking_capabilities: ['native.close'],
  non_blocking_candidates: [],
  evidence_required: ['native-report'],
  authorized_by: null,
  authority_verification_result: null,
  authorization_evidence_checksum: null,
  satisfaction_evidence: [],
  created_by_session: 'session-001',
  created_at: '2026-08-13T00:00:00.000Z',
  ...extra,
});
const task = (task_id, extra = {}) => ({
  task_id,
  priority: 'P1',
  owner_priority: 0,
  dev_profile: 'DEV_2_STANDARD',
  authorization: 'AUTHORIZED',
  dependencies: [],
  state: 'PENDING',
  human_gates: [],
  native_gate_required: false,
  paid_execution_required: false,
  destructive_operation_required: false,
  release_or_deploy_required: false,
  credential_required: false,
  design_runnable: true,
  implementation_runnable: true,
  files_owned: [`src/${task_id}.mjs`],
  expected_context_cost: 1000,
  expected_runtime_minutes: 30,
  context_locality: 50,
  roadmap_order: 1,
  ...extra,
});

test('human gate is deterministic immutable and tamper-evident', () => {
  const value = gate('TASK-001');
  assert.equal(validateHumanGate(value).result, 'HUMAN_GATE_VALID');
  assert.ok(Object.isFrozen(value));
  const tampered = { ...value, status: 'SATISFIED' };
  assert.throws(() => validateHumanGate(tampered), (error) => error.code === 'HUMAN_GATE_TAMPERED');
});

test('P0 and Owner priority outrank context locality and cost', () => {
  const result = selectAutonomousTask([
    task('TASK-LOW-COST', { priority: 'P1', expected_context_cost: 1, context_locality: 100 }),
    task('TASK-P0', { priority: 'P0', expected_context_cost: 9999, context_locality: 0 }),
  ]);
  assert.equal(result.selected.task_id, 'TASK-P0');
});

test('human-gated task parks while another authorized task runs', () => {
  const result = selectAutonomousTask([
    task('TASK-NATIVE', {
      priority: 'P0',
      native_gate_required: true,
      human_gates: [gate('TASK-NATIVE')],
    }),
    task('TASK-SAFE'),
  ]);
  assert.equal(result.result, 'RUNNABLE_TASK_SELECTED');
  assert.equal(result.selected.task_id, 'TASK-SAFE');
  assert.equal(result.parked[0].task_id, 'TASK-NATIVE');
  assert.equal(result.system_blocked, false);
});

test('unsafe shared human gate distinguishes SYSTEM_BLOCKED from task parking', () => {
  const result = selectAutonomousTask([
    task('TASK-SYSTEM', {
      human_gates: [gate('TASK-SYSTEM', { safe_to_continue_other_tasks: false })],
    }),
    task('TASK-OTHER'),
  ]);
  assert.equal(result.result, 'SYSTEM_BLOCKED');
  assert.equal(result.system_blocked, true);
  assert.equal(result.selected, null);
});

test('required native paid destructive release and credential gates fail closed', () => {
  const variants = [
    ['native_gate_required', 'NATIVE_EXTERNAL_APPLICATION'],
    ['paid_execution_required', 'PAID_PROVIDER_EXECUTION'],
    ['destructive_operation_required', 'DESTRUCTIVE_OPERATION'],
    ['release_or_deploy_required', 'RELEASE_OR_DEPLOYMENT'],
    ['credential_required', 'CREDENTIAL_REQUIRED'],
  ];
  for (const [field, type] of variants) {
    const result = selectAutonomousTask([task(`TASK-${field}`, { [field]: true })]);
    assert.equal(result.selected, null);
    assert.equal(result.parked[0].reason, `GATE_UNSATISFIED:${type}`);
  }
});

test('satisfied exact gate permits selection', () => {
  const result = selectAutonomousTask([task('TASK-NATIVE', {
    native_gate_required: true,
    human_gates: [gate('TASK-NATIVE', {
      status: 'SATISFIED',
      authorized_by: 'OWNER',
      authority_verification_result: 'OWNER_AUTHORIZATION_VERIFIED',
      authorization_evidence_checksum: `sha256:${'a'.repeat(64)}`,
      satisfaction_evidence: ['evidence/native-report.json'],
    })],
  })]);
  assert.equal(result.selected.task_id, 'TASK-NATIVE');
});

test('satisfied gate without authority and evidence cannot be constructed', () => {
  assert.throws(
    () => gate('TASK-NATIVE', { status: 'SATISFIED' }),
    (error) => error.code === 'HUMAN_GATE_SATISFACTION_UNVERIFIED',
  );
});

test('design-ahead can run but cannot become speculative implementation', () => {
  const result = selectAutonomousTask([task('TASK-DESIGN', {
    authorization: 'DESIGN_ONLY',
    implementation_runnable: false,
  })]);
  assert.equal(result.selected.mode, 'DESIGN_ONLY');
  assert.throws(
    () => assertAutonomousWorkMode(result, 'IMPLEMENTATION'),
    (error) => error.code === 'SPECULATIVE_IMPLEMENTATION',
  );
  assert.equal(assertAutonomousWorkMode(result, 'DESIGN_ONLY').result, 'AUTONOMOUS_WORK_MODE_ALLOWED');
});

test('dependency and file ownership conflicts do not become runnable', () => {
  const completed = completionBinding('TASK-A');
  const result = selectAutonomousTask([
    task('TASK-A', { project_id: 'fixture', state: 'COMPLETED', canonical_binding: completed }),
    task('TASK-B', { project_id: 'fixture', dependencies: ['TASK-A'], files_owned: ['shared.mjs'] }),
    task('TASK-C', { project_id: 'fixture', dependencies: ['TASK-B'] }),
  ], { project_id: 'fixture', locked_files: ['shared.mjs'], canonical_status_trust, canonical_status_snapshot: snapshot([completed]), canonical_snapshot_trust });
  assert.equal(result.selected, null);
  assert.equal(result.parked[0].reason, 'FILE_OWNERSHIP_CONFLICT');
  assert.equal(result.waiting[0].reason, 'DEPENDENCY_WAIT');
});

test('dependency cycles and missing dependencies fail closed', () => {
  assert.throws(
    () => selectAutonomousTask([
      task('TASK-A', { dependencies: ['TASK-B'] }),
      task('TASK-B', { dependencies: ['TASK-A'] }),
    ]),
    (error) => error.code === 'AUTONOMY_TASK_DEPENDENCY_CYCLE',
  );
  assert.throws(
    () => selectAutonomousTask([task('TASK-A', { dependencies: ['TASK-MISSING'] })]),
    (error) => error.code === 'AUTONOMY_TASK_DEPENDENCY_MISSING',
  );
});

test('authority conflict parks only that task', () => {
  const result = selectAutonomousTask([
    task('TASK-CONFLICT', { priority: 'P0', authorization: 'AUTHORITY_CONFLICT' }),
    task('TASK-SAFE'),
  ]);
  assert.equal(result.selected.task_id, 'TASK-SAFE');
  assert.equal(result.parked[0].reason, 'AUTHORITY_CONFLICT');
});

test('explicit BLOCKED task is not silently reselected', () => {
  const result = selectAutonomousTask([task('TASK-BLOCKED', { state: 'BLOCKED' })]);
  assert.equal(result.selected, null);
  assert.equal(result.parked[0].reason, 'TASK_BLOCKED');
  assert.equal(result.system_blocked, false);
});

test('wrong-project runnable task is rejected before selection', () => {
  assert.throws(
    () => selectAutonomousTask([task('TASK-WRONG', { project_id: 'other' })], { project_id: 'fixture' }),
    (error) => error.code === 'AUTONOMOUS_TASK_PROJECT_MISMATCH',
  );
});
