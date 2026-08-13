import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { createContextCostRecord } from '../../src/context-control/index.mjs';
import { validateKnowledgeAsset } from '../../src/knowledge/index.mjs';
import {
  assessAutonomyRecovery,
  assessAutonomySessionLease,
  createAutonomySessionLease,
  createContextFailureEvidence,
  proposeContextFailureKnowledge,
  verifyAutonomySessionLease,
} from '../../src/automation/autonomy-hardening.mjs';
import { createSessionCheckpoint } from '../../src/automation/session-rotation.mjs';
import { checksumObject } from '../../src/automation/util.mjs';

const hash = (value) => `sha256:${createHash('sha256').update(value).digest('hex')}`;
const source = (id, tokens, extra = {}) => ({
  source_id: id, source_type: 'REPOSITORY_FILE', path_or_ref: `registry/${id}.md`, sha256: hash(id),
  estimated_tokens: tokens, observed_tokens: null, selected_reason: 'bounded phase', mandatory: false,
  cacheable: true, changed_since_previous_session: false, used_in_decision: true, used_in_patch: false,
  duplicate_of: null, stale: false, trust_level: 'CANONICAL', ...extra,
});
const contextRecord = ({ avoidable = 500, repeat = 2, quality = 'PASS' } = {}) => createContextCostRecord({
  record_id: 'CCR-H-1', task_id: 'TASK-018', session_id: 'S-H-1', phase: 'PHASE_H',
  recorded_at: '2026-08-13T00:00:00Z', confidence: 'LOCAL_TOKENIZER_ESTIMATE',
  sources: [source('used', 1000 - avoidable), source('unused', avoidable, { used_in_decision: false, used_in_patch: false })],
  usage: { observed_input_tokens: null, observed_cached_input_tokens: null, observed_output_tokens: null, billed_tokens: null },
  quality_gate: { status: quality, gate_id: quality === 'PASS' ? 'H-GATE' : null }, repeated_overfetch_count: repeat,
});
const lease = (extra = {}) => createAutonomySessionLease({
  lease_id: 'LEASE-H-1', project_id: 'BAI-OS', session_id: 'S-H-1',
  branch: 'autonomy/task-018/hardening-knowledge-loop', task_id: 'TASK-018',
  acquired_at: '2026-08-13T00:00:00Z', heartbeat_at: '2026-08-13T00:05:00Z',
  expires_at: '2026-08-13T01:00:00Z', ...extra,
});
const checkpoint = (extra = {}) => createSessionCheckpoint({
  checkpoint_id: 'CP-H-1', session_id: 'S-H-1', task_id: 'TASK-018', head: 'a'.repeat(40),
  branch: 'autonomy/task-018/hardening-knowledge-loop', dirty: true, dirty_paths: ['src/owned.mjs'],
  test_status: 'PASS', unresolved_critical: 0, unresolved_high: 0, claimed_success: true,
  last_completed_unit: 'PHASE_H1', created_at: '2026-08-13T00:00:00Z', ...extra,
});
const recovery = (extra = {}) => {
  const cp = extra.checkpoint ?? checkpoint();
  return assessAutonomyRecovery({
    checkpoint: cp, current_head: cp.head, merge_conflict: false, dirty_paths: [...cp.dirty_paths],
    owned_dirty_paths: [...cp.dirty_paths], evidence_status: 'COMPLETE', test_status: 'PASS',
    provider_status: 'AVAILABLE', usage_limit_reached: false, missed_schedule: false, ...extra,
  });
};

test('verified overfetch becomes immutable noncanonical Failure Evidence', () => {
  const evidence = createContextFailureEvidence({ project_id: 'BAI-OS', context_record: contextRecord() });
  assert.equal(evidence.evidence_type, 'CONTEXT_OVERFETCH');
  assert.equal(evidence.canonical, false);
  assert.equal(evidence.policy_change_authorized, false);
  assert.equal(Object.isFrozen(evidence), true);
});

test('record without overfetch produces no failure claim', () => {
  const result = createContextFailureEvidence({ project_id: 'BAI-OS', context_record: contextRecord({ avoidable: 0, repeat: 0 }) });
  assert.equal(result.result, 'NO_CONTEXT_FAILURE');
});

test('Knowledge Candidate requires recurrence and remains inactive', () => {
  const lowRecurrence = createContextFailureEvidence({ project_id: 'BAI-OS', context_record: contextRecord({ avoidable: 300, repeat: 1 }) });
  assert.equal(proposeContextFailureKnowledge({ failure_evidence: lowRecurrence }).result, 'KNOWLEDGE_CANDIDATE_NOT_YET_ELIGIBLE');
  const evidence = createContextFailureEvidence({ project_id: 'BAI-OS', context_record: contextRecord() });
  const result = proposeContextFailureKnowledge({ failure_evidence: evidence, clock: () => new Date('2026-08-13T00:00:00Z') });
  assert.equal(result.result, 'KNOWLEDGE_CANDIDATE_PROPOSED');
  assert.equal(result.candidate.status, 'CANDIDATE');
  assert.equal(result.candidate.knowledge_type, 'FAILURE_CASE');
  assert.equal(result.activation_authorized, false);
  assert.equal(validateKnowledgeAsset(result.candidate, { verifyChecksum: true }).asset_id, result.candidate.asset_id);
});

test('tampered Failure Evidence cannot become Knowledge', () => {
  const evidence = createContextFailureEvidence({ project_id: 'BAI-OS', context_record: contextRecord() });
  assert.throws(() => proposeContextFailureKnowledge({ failure_evidence: { ...evidence, severity: 'INFO' } }), (error) => error.code === 'AUTONOMY_FAILURE_EVIDENCE_INVALID');
  const forged = { ...evidence, repeated_occurrences: -1 };
  forged.content_checksum = checksumObject(forged);
  assert.throws(() => proposeContextFailureKnowledge({ failure_evidence: forged }), (error) => error.code === 'AUTONOMY_FAILURE_EVIDENCE_INVALID');
});

test('Session Lease is deterministic immutable and tamper evident', () => {
  const value = lease();
  assert.equal(verifyAutonomySessionLease(value).result, 'AUTONOMY_LEASE_VALID');
  assert.equal(lease().content_checksum, value.content_checksum);
  assert.equal(Object.isFrozen(value), true);
  assert.throws(() => verifyAutonomySessionLease({ ...value, task_id: 'TASK-X' }), (error) => error.code === 'AUTONOMY_LEASE_TAMPERED');
});

test('invalid Lease time ordering fails closed', () => {
  assert.throws(() => lease({ heartbeat_at: '2026-08-12T23:59:00Z' }), (error) => error.code === 'AUTONOMY_LEASE_INVALID');
  assert.throws(() => lease({ expires_at: '2026-08-13T00:00:00Z' }), (error) => error.code === 'AUTONOMY_LEASE_INVALID');
});

test('foreign active Lease conflicts and stale Lease still requires review', () => {
  assert.equal(assessAutonomySessionLease({ lease: lease(), current_session_id: 'OTHER', now: '2026-08-13T00:30:00Z' }).result, 'AUTOMATION_LEASE_CONFLICT');
  const stale = assessAutonomySessionLease({ lease: lease(), current_session_id: 'OTHER', now: '2026-08-13T02:00:00Z' });
  assert.equal(stale.result, 'STALE_LEASE_REVIEW_REQUIRED');
  assert.equal(stale.automatic_takeover_allowed, false);
});

test('verified exact checkpoint may resume without automatic mutation', () => {
  const result = recovery();
  assert.equal(result.result, 'RECOVERY_RESUME_READY');
  assert.equal(result.safe_to_resume, true);
  assert.equal(result.automatic_mutation_allowed, false);
});

test('invalid checkpoint, changed HEAD, merge conflict and unknown dirty changes require Recovery Gate', () => {
  const cp = checkpoint();
  const tampered = { ...cp, last_completed_unit: 'FORGED' };
  for (const patch of [
    { checkpoint: tampered },
    { current_head: 'b'.repeat(40) },
    { merge_conflict: true },
    { dirty_paths: [...cp.dirty_paths, 'src/unknown.mjs'] },
  ]) {
    const result = recovery(patch);
    assert.equal(result.result, 'RECOVERY_GATE_REQUIRED');
    assert.equal(result.safe_to_resume, false);
  }
});

test('partial Evidence and unknown tests never claim safe resume', () => {
  assert.equal(recovery({ evidence_status: 'PARTIAL' }).safe_to_resume, false);
  assert.equal(recovery({ test_status: 'UNKNOWN' }).safe_to_resume, false);
});

test('isolated failed tests route to repair while provider, usage and missed schedule suspend/replan', () => {
  assert.equal(recovery({ test_status: 'FAIL' }).result, 'TEST_FAILURE_REPAIR');
  assert.equal(recovery({ provider_status: 'UNAVAILABLE' }).result, 'PROVIDER_UNAVAILABLE_SUSPENDED');
  assert.equal(recovery({ usage_limit_reached: true }).result, 'USAGE_LIMIT_SUSPENDED');
  assert.equal(recovery({ missed_schedule: true }).result, 'MISSED_SCHEDULE_REPLAN');
});

test('provider status and suspension booleans must be explicit', () => {
  assert.throws(() => recovery({ provider_status: undefined }), (error) => error.code === 'AUTONOMY_HARDENING_INPUT_INVALID');
  assert.throws(() => recovery({ usage_limit_reached: undefined }), (error) => error.code === 'AUTONOMY_HARDENING_INPUT_INVALID');
});
