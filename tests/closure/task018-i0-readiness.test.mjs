import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import {
  assessTask018I0ClosureReadiness,
  verifyTask018I0ClosureReadiness,
} from '../../src/closure/index.mjs';

const sha = `sha256:${'a'.repeat(64)}`;
const input = (extra = {}) => ({
  task_id: 'TASK-018',
  planning_artifacts: {
    closure_checklist: true, changelog_draft: true, release_plan_draft: true,
    rollback_plan: true, evidence_index: true,
  },
  evidence: {
    phase_g: 'PARKED_HUMAN_GATE', phase_h2: 'WAITING', consumer_regression: 'NOT_PROVEN',
    conversation_free_restart: 'NOT_PROVEN', context_cost_report: 'NOT_PROVEN', full_os_regression: 'PASS',
  },
  evidence_index_checksum: sha,
  unresolved_critical: 0,
  unresolved_high: 0,
  worktree_clean: true,
  exact_release_decision_verified: false,
  completion_record_created: false,
  tag_created: false,
  release_created: false,
  ...extra,
});

test('current I0 is prepared while I1 is blocked by exact empirical gaps', () => {
  const value = assessTask018I0ClosureReadiness(input());
  assert.equal(value.i0_result, 'I0_PREPARED');
  assert.equal(value.finalization_result, 'I1_RELEASE_FINALIZATION_BLOCKED');
  assert.deepEqual(value.finalization_blockers, [
    'EVIDENCE_NOT_PASS:phase_g:PARKED_HUMAN_GATE',
    'EVIDENCE_NOT_PASS:phase_h2:WAITING',
    'EVIDENCE_NOT_PASS:consumer_regression:NOT_PROVEN',
    'EVIDENCE_NOT_PASS:conversation_free_restart:NOT_PROVEN',
    'EVIDENCE_NOT_PASS:context_cost_report:NOT_PROVEN',
    'EXACT_RELEASE_DECISION_NOT_VERIFIED',
  ]);
  assert.equal(verifyTask018I0ClosureReadiness(value).result, 'TASK018_I0_READINESS_VALID');
  assert.equal(Object.isFrozen(value), true);
});

test('assessment is deterministic and performs no external effect', () => {
  const first = assessTask018I0ClosureReadiness(input());
  const second = assessTask018I0ClosureReadiness(input());
  assert.deepEqual(first, second);
  for (const key of ['completion_record_created', 'tag_created', 'release_created', 'external_effect_performed']) {
    assert.equal(first[key], false);
  }
});

test('missing planning artifact blocks I0 and consequently I1', () => {
  const value = assessTask018I0ClosureReadiness(input({
    planning_artifacts: { ...input().planning_artifacts, changelog_draft: false },
  }));
  assert.equal(value.i0_result, 'I0_BLOCKED');
  assert.ok(value.i0_blockers.includes('PLANNING_ARTIFACT_MISSING:changelog_draft'));
  assert.ok(value.finalization_blockers.includes('I0_NOT_PREPARED'));
});

test('all Evidence still requires the exact Release decision', () => {
  const value = assessTask018I0ClosureReadiness(input({
    evidence: Object.fromEntries(Object.keys(input().evidence).map((key) => [key, 'PASS'])),
  }));
  assert.deepEqual(value.finalization_blockers, ['EXACT_RELEASE_DECISION_NOT_VERIFIED']);
});

test('all prerequisites can become eligible without creating completion, tag or Release', () => {
  const value = assessTask018I0ClosureReadiness(input({
    evidence: Object.fromEntries(Object.keys(input().evidence).map((key) => [key, 'PASS'])),
    exact_release_decision_verified: true,
  }));
  assert.equal(value.finalization_result, 'I1_RELEASE_FINALIZATION_ELIGIBLE');
  assert.equal(value.external_effect_performed, false);
});

test('unresolved severe findings, dirty state and failed regression block finalization', () => {
  const value = assessTask018I0ClosureReadiness(input({
    evidence: { ...input().evidence, full_os_regression: 'FAIL' },
    unresolved_high: 1,
    worktree_clean: false,
  }));
  assert.ok(value.finalization_blockers.includes('UNRESOLVED_CRITICAL_OR_HIGH'));
  assert.ok(value.finalization_blockers.includes('WORKTREE_NOT_CLEAN'));
  assert.ok(value.finalization_blockers.includes('EVIDENCE_NOT_PASS:full_os_regression:FAIL'));
});

test('I0 rejects any claim that completion, tag or Release already occurred', () => {
  for (const key of ['completion_record_created', 'tag_created', 'release_created']) {
    assert.throws(() => assessTask018I0ClosureReadiness(input({ [key]: true })),
      (error) => error.code === 'TASK018_I0_EXTERNAL_EFFECT_CLAIM_FORBIDDEN');
  }
});

test('wrong Task, invalid gate and malformed Evidence checksum fail closed', () => {
  assert.throws(() => assessTask018I0ClosureReadiness(input({ task_id: 'TASK-017' })),
    (error) => error.code === 'TASK018_I0_TASK_MISMATCH');
  assert.throws(() => assessTask018I0ClosureReadiness(input({ evidence: { ...input().evidence, phase_g: 'CLAIMED' } })),
    (error) => error.code === 'TASK018_I0_INPUT_INVALID');
  assert.throws(() => assessTask018I0ClosureReadiness(input({ evidence_index_checksum: 'sha256:no' })),
    (error) => error.code === 'TASK018_I0_INPUT_INVALID');
});

test('tampered output fails verification', () => {
  const value = assessTask018I0ClosureReadiness(input());
  assert.throws(() => verifyTask018I0ClosureReadiness({ ...value, i0_result: 'I0_BLOCKED' }),
    (error) => error.code === 'TASK018_I0_RESULT_INVALID');
});

test('semantically forged result fails even with a recomputed checksum', () => {
  const value = structuredClone(assessTask018I0ClosureReadiness(input()));
  value.finalization_blockers = [];
  value.finalization_result = 'I1_RELEASE_FINALIZATION_ELIGIBLE';
  delete value.content_checksum;
  const canonicalSort = (candidate) => Array.isArray(candidate) ? candidate.map(canonicalSort)
    : candidate && typeof candidate === 'object'
      ? Object.fromEntries(Object.keys(candidate).sort().map((key) => [key, canonicalSort(candidate[key])]))
      : candidate;
  value.content_checksum = `sha256:${createHash('sha256').update(JSON.stringify(canonicalSort(value))).digest('hex')}`;
  assert.throws(() => verifyTask018I0ClosureReadiness(value),
    (error) => error.code === 'TASK018_I0_RESULT_INVALID');
});

test('I0 schema is closed and external-effect fields are fixed false', async () => {
  const { readFile } = await import('node:fs/promises');
  const schema = JSON.parse(await readFile(new URL('../../schemas/closure/task018-i0-readiness.schema.json', import.meta.url), 'utf8'));
  assert.equal(schema.additionalProperties, false);
  assert.deepEqual(new Set(schema.required), new Set(Object.keys(schema.properties)));
  for (const key of ['completion_record_created', 'tag_created', 'release_created', 'external_effect_performed']) {
    assert.equal(schema.properties[key].const, false);
  }
});
