import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { createContextCostRecord } from '../../src/context-control/index.mjs';
import {
  assessAutonomyRecovery,
  assessAutonomySessionLease,
  createAutonomySessionLease,
  createContextFailureEvidence,
  createHumanGate,
  createSessionCheckpoint,
  proposeContextFailureKnowledge,
  selectAutonomousTask,
} from '../../src/automation/index.mjs';

const sha = (value) => `sha256:${createHash('sha256').update(value).digest('hex')}`;
const task = (taskId, extra = {}) => ({
  task_id: taskId, priority: 'P0', owner_priority: 100, dev_profile: 'DEV_4_FOUNDATION_CRITICAL',
  authorization: 'AUTHORIZED', dependencies: [], state: 'PENDING', human_gates: [],
  native_gate_required: false, paid_execution_required: false, destructive_operation_required: false,
  release_or_deploy_required: false, credential_required: false, design_runnable: true,
  implementation_runnable: true, files_owned: [], expected_context_cost: 1000,
  expected_runtime_minutes: 30, context_locality: 100, roadmap_order: 1, ...extra,
});
const source = (id, tokens, used) => ({
  source_id: id, source_type: 'REPOSITORY_FILE', path_or_ref: `registry/${id}.md`, sha256: sha(id),
  estimated_tokens: tokens, observed_tokens: null, selected_reason: 'bounded integration', mandatory: false,
  cacheable: true, changed_since_previous_session: false, used_in_decision: used, used_in_patch: false,
  duplicate_of: null, stale: false, trust_level: 'CANONICAL',
});

test('parked Consumer Pilot does not stop authorized Consumer-independent H1 work', () => {
  const gate = createHumanGate({
    gate_id: 'HG-PILOT', task_id: 'TASK-018-G', type: 'NATIVE_EXTERNAL_APPLICATION',
    status: 'WAITING_OWNER', reason_code: 'CONSUMER_LOCALLY_DEVELOPED', required_environment: ['BAI VIDEO PRODUCTION'],
    safe_to_continue_other_tasks: true, blocking_capabilities: ['consumer.native-pilot'],
    non_blocking_candidates: ['TASK-018-H1'], evidence_required: ['owner-bound-consumer-checkout'],
    created_by_session: 'S-H1', created_at: '2026-08-13T00:00:00Z',
  });
  const selection = selectAutonomousTask([
    task('TASK-018-G', { human_gates: [gate], native_gate_required: true, roadmap_order: 0 }),
    task('TASK-018-H1', { files_owned: ['src/automation/autonomy-hardening.mjs'] }),
  ]);
  assert.deepEqual(selection.selected, { task_id: 'TASK-018-H1', mode: 'IMPLEMENTATION' });
  assert.equal(selection.parked[0].task_id, 'TASK-018-G');
  assert.equal(selection.system_blocked, false);
});

test('simulated H1 quantum creates only Candidate knowledge and resumes only from verified state', () => {
  const record = createContextCostRecord({
    record_id: 'CCR-H1-INT', task_id: 'TASK-018', session_id: 'S-H1', phase: 'PHASE_H1',
    recorded_at: '2026-08-13T00:00:00Z', confidence: 'LOCAL_TOKENIZER_ESTIMATE',
    sources: [source('useful', 400, true), source('avoidable', 600, false)],
    usage: { observed_input_tokens: null, observed_cached_input_tokens: null, observed_output_tokens: null, billed_tokens: null },
    quality_gate: { status: 'PASS', gate_id: 'H1-FOCUSED' }, repeated_overfetch_count: 2,
  });
  const evidence = createContextFailureEvidence({ project_id: 'BAI-OS', context_record: record });
  const knowledge = proposeContextFailureKnowledge({ failure_evidence: evidence, clock: () => new Date('2026-08-13T00:00:00Z') });
  assert.equal(knowledge.candidate.status, 'CANDIDATE');
  assert.equal(knowledge.activation_authorized, false);

  const checkpoint = createSessionCheckpoint({
    checkpoint_id: 'CP-H1-INT', session_id: 'S-H1', task_id: 'TASK-018', head: 'c'.repeat(40),
    branch: 'autonomy/task-018/hardening-knowledge-loop', dirty: true,
    dirty_paths: ['src/automation/autonomy-hardening.mjs'], test_status: 'PASS',
    unresolved_critical: 0, unresolved_high: 0, claimed_success: true,
    last_completed_unit: 'PHASE_H1', created_at: '2026-08-13T00:00:00Z',
  });
  const recovery = assessAutonomyRecovery({
    checkpoint, current_head: checkpoint.head, merge_conflict: false,
    dirty_paths: [...checkpoint.dirty_paths], owned_dirty_paths: [...checkpoint.dirty_paths],
    evidence_status: 'COMPLETE', test_status: 'PASS', provider_status: 'NOT_REQUIRED',
    usage_limit_reached: false, missed_schedule: false,
  });
  assert.equal(recovery.result, 'RECOVERY_RESUME_READY');
  assert.equal(recovery.automatic_mutation_allowed, false);
});

test('duplicate run and provider outage remain suspended without takeover or dispatch', () => {
  const lease = createAutonomySessionLease({
    lease_id: 'LEASE-H1-INT', project_id: 'BAI-OS', session_id: 'OTHER-SESSION',
    branch: 'autonomy/task-018/hardening-knowledge-loop', task_id: 'TASK-018',
    acquired_at: '2026-08-13T00:00:00Z', heartbeat_at: '2026-08-13T00:05:00Z', expires_at: '2026-08-13T01:00:00Z',
  });
  const conflict = assessAutonomySessionLease({ lease, current_session_id: 'S-H1', now: '2026-08-13T00:10:00Z' });
  assert.equal(conflict.result, 'AUTOMATION_LEASE_CONFLICT');
  assert.equal(conflict.automatic_takeover_allowed, false);
  const checkpoint = createSessionCheckpoint({
    checkpoint_id: 'CP-H1-PROVIDER', session_id: 'S-H1', task_id: 'TASK-018', head: 'd'.repeat(40),
    branch: 'autonomy/task-018/hardening-knowledge-loop', dirty: false, dirty_paths: [],
    test_status: 'PASS', unresolved_critical: 0, unresolved_high: 0, claimed_success: true,
    last_completed_unit: 'PHASE_H1', created_at: '2026-08-13T00:00:00Z',
  });
  const provider = assessAutonomyRecovery({
    checkpoint, current_head: checkpoint.head, merge_conflict: false, dirty_paths: [], owned_dirty_paths: [],
    evidence_status: 'COMPLETE', test_status: 'PASS', provider_status: 'UNAVAILABLE',
    usage_limit_reached: false, missed_schedule: false,
  });
  assert.equal(provider.result, 'PROVIDER_UNAVAILABLE_SUSPENDED');
  assert.equal(provider.safe_to_resume, false);
});
