import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import {
  bootstrapHandoff,
  handoffManifestChecksum,
  validateHandoffBootstrapResult,
} from '../../src/context-control/index.mjs';

const hash = (value) => `sha256:${createHash('sha256').update(value).digest('hex')}`;
const head = (character) => character.repeat(40);
const file = (path, extra = {}) => ({
  path,
  sha256: hash(path),
  critical: false,
  trust_level: 'PROJECT_DOCUMENTATION',
  instruction_scope: false,
  contains_secret: false,
  include_in_context: true,
  estimated_tokens: 100,
  changed_since_previous_session: false,
  stale: false,
  relevant_to_current_task: true,
  ...extra,
});
const makeManifest = (extra = {}) => {
  const manifest = {
    handoff_version: '2.0.0',
    created_at: '2026-08-13T00:00:00.000Z',
    created_by: 'BAI Development OS',
    project_id: 'bai-development-os',
    project_repo: 'owner/bai-development-os',
    project_branch: 'autonomy/task-018/codex-autonomy-p0',
    project_head: head('a'),
    os_version: '1.0.0',
    architecture_version: '2.29',
    authority_sources: [
      { source_id: 'task', trust_level: 'AUTHORIZED_TASK', path_or_ref: 'tasks/TASK-018/task.md' },
      { source_id: 'owner', trust_level: 'OWNER_AUTHORITY', path_or_ref: 'owner:2026-08-13' },
    ],
    current_task: 'TASK-018',
    completed_tasks: [],
    parked_tasks: ['TASK-017'],
    human_gates: [],
    known_risks: [],
    files: [
      file('README-FIRST.md', {
        critical: true,
        trust_level: 'CANONICAL_GOVERNANCE',
        instruction_scope: true,
      }),
      file('src/feature.mjs'),
      file('history.md', {
        relevant_to_current_task: false,
        include_in_context: false,
        stale: true,
      }),
    ],
    ...extra,
  };
  manifest.manifest_sha256 = handoffManifestChecksum(manifest);
  return manifest;
};
const input = (extra = {}) => {
  const manifest = extra.handoff_manifest ?? makeManifest();
  return {
    handoff_manifest: manifest,
    current_project_id: 'bai-development-os',
    current_checkout: {
      repository_mode: 'LOCAL',
      head: manifest.project_head,
      relation_to_recorded_head: 'EQUAL',
      dirty: false,
      dirty_ownership: 'NOT_APPLICABLE',
    },
    file_observations: manifest.files.map((entry) => ({
      path: entry.path,
      present: true,
      sha256: entry.sha256,
    })),
    authorization_state: 'AUTHORIZED',
    ...extra,
  };
};

test('equal clean checkout produces immutable authorized minimum bootstrap', () => {
  const result = bootstrapHandoff(input());
  assert.equal(result.source_truth_mode, 'LOCAL_CHECKOUT');
  assert.equal(result.handoff_status, 'CURRENT');
  assert.equal(result.implementation_allowed, true);
  assert.deepEqual(result.loading_plan.map((entry) => entry.path), ['README-FIRST.md', 'src/feature.mjs']);
  assert.equal(result.estimated_bootstrap_tokens, 200);
  assert.equal(result.authority_sources[0].trust_level, 'OWNER_AUTHORITY');
  assert.equal(validateHandoffBootstrapResult(result).result, 'HANDOFF_BOOTSTRAP_RESULT_VALID');
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.loading_plan));
});

test('newer current checkout wins over stale handoff', () => {
  const value = input();
  value.current_checkout.head = head('b');
  value.current_checkout.relation_to_recorded_head = 'RECORDED_ANCESTOR_OF_CURRENT';
  const result = bootstrapHandoff(value);
  assert.equal(result.source_truth_mode, 'LOCAL_CHECKOUT');
  assert.equal(result.handoff_status, 'HANDOFF_STALE');
  assert.equal(result.implementation_allowed, true);
  assert.equal(result.findings[0].code, 'HANDOFF_STALE');
});

test('newer checkout may change a critical source without stale handoff overriding it', () => {
  const value = input();
  value.current_checkout.head = head('b');
  value.current_checkout.relation_to_recorded_head = 'RECORDED_ANCESTOR_OF_CURRENT';
  value.file_observations[0].sha256 = hash('new-current-governance');
  const result = bootstrapHandoff(value);
  assert.equal(result.implementation_allowed, true);
  assert.ok(result.findings.some(
    (finding) => finding.code === 'CRITICAL_SOURCE_CHANGED_IN_NEWER_CHECKOUT',
  ));
});

test('newer handoff makes stale checkout read-only', () => {
  const value = input();
  value.current_checkout.head = head('b');
  value.current_checkout.relation_to_recorded_head = 'CURRENT_ANCESTOR_OF_RECORDED';
  const result = bootstrapHandoff(value);
  assert.equal(result.source_truth_mode, 'HANDOFF_ONLY_READONLY');
  assert.equal(result.handoff_status, 'CHECKOUT_STALE');
  assert.equal(result.implementation_allowed, false);
  assert.equal(result.next_action, 'UPDATE_CHECKOUT_WITHOUT_DISCARDING_LOCAL_STATE');
});

test('unrelated or unknown history fails closed', () => {
  for (const relation of ['UNRELATED', 'UNKNOWN']) {
    const value = input();
    value.current_checkout.relation_to_recorded_head = relation;
    assert.throws(
      () => bootstrapHandoff(value),
      (error) => error.code === 'SOURCE_OF_TRUTH_UNKNOWN',
    );
  }
});

test('owned dirty checkout is preserved and remains local truth', () => {
  const value = input();
  value.current_checkout.dirty = true;
  value.current_checkout.dirty_ownership = 'OWNED';
  const result = bootstrapHandoff(value);
  assert.equal(result.source_truth_mode, 'LOCAL_CHECKOUT');
  assert.equal(result.implementation_allowed, true);
  assert.ok(result.findings.some((finding) => finding.code === 'DIRTY_WORKTREE_PRESERVED'));
});

test('unknown dirty ownership hard stops and known external ownership blocks mutation', () => {
  const unknown = input();
  unknown.current_checkout.dirty = true;
  unknown.current_checkout.dirty_ownership = 'UNKNOWN';
  assert.throws(
    () => bootstrapHandoff(unknown),
    (error) => error.code === 'DIRTY_WORKTREE_OWNERSHIP_UNKNOWN',
  );
  const external = input();
  external.current_checkout.dirty = true;
  external.current_checkout.dirty_ownership = 'EXTERNAL';
  const result = bootstrapHandoff(external);
  assert.equal(result.implementation_allowed, false);
  assert.equal(result.next_action, 'PRESERVE_EXTERNAL_CHANGES_AND_REPLAN');
});

test('critical missing or mismatched file fails closed', () => {
  const missing = input();
  missing.file_observations[0].present = false;
  assert.throws(
    () => bootstrapHandoff(missing),
    (error) => error.code === 'AUTONOMY_BOOTSTRAP_MISSING',
  );
  const mismatch = input();
  mismatch.file_observations[0].sha256 = hash('tampered');
  assert.throws(
    () => bootstrapHandoff(mismatch),
    (error) => error.code === 'HANDOFF_MANIFEST_INVALID',
  );
});

test('manifest tamper and project mismatch fail closed', () => {
  const tampered = input();
  tampered.handoff_manifest.current_task = 'TASK-999';
  assert.throws(
    () => bootstrapHandoff(tampered),
    (error) => error.code === 'HANDOFF_MANIFEST_INVALID',
  );
  assert.throws(
    () => bootstrapHandoff(input({ current_project_id: 'other-project' })),
    (error) => error.code === 'HANDOFF_PROJECT_MISMATCH',
  );
});

test('untrusted instructions and secret context are blocked', () => {
  const untrustedManifest = makeManifest({
    files: [file('external.md', {
      critical: true,
      trust_level: 'EXTERNAL_UNTRUSTED',
      instruction_scope: true,
    })],
  });
  assert.throws(
    () => bootstrapHandoff(input({ handoff_manifest: untrustedManifest })),
    (error) => error.code === 'UNTRUSTED_INSTRUCTION_INJECTION',
  );
  const secretManifest = makeManifest({
    files: [file('secret.txt', { critical: true, contains_secret: true })],
  });
  assert.throws(
    () => bootstrapHandoff(input({ handoff_manifest: secretManifest })),
    (error) => error.code === 'SECRET_CONTEXT_BLOCKED',
  );
});

test('authorization never comes from a valid handoff manifest', () => {
  const result = bootstrapHandoff(input({ authorization_state: 'NOT_AUTHORIZED' }));
  assert.equal(result.implementation_allowed, false);
  assert.equal(result.next_action, 'PARK_UNAUTHORIZED_TASK');
  assert.ok(result.findings.some((finding) => finding.code === 'AUTONOMY_TASK_NOT_AUTHORIZED'));
  const conflict = bootstrapHandoff(input({ authorization_state: 'AUTHORITY_CONFLICT' }));
  assert.equal(conflict.implementation_allowed, false);
  assert.equal(conflict.next_action, 'RESOLVE_AUTHORITY_CONFLICT');
});

test('handoff-only mode is explicitly read-only', () => {
  const value = input();
  value.current_checkout = {
    repository_mode: 'HANDOFF_ONLY',
    head: null,
    relation_to_recorded_head: 'UNKNOWN',
    dirty: false,
    dirty_ownership: 'NOT_APPLICABLE',
  };
  const result = bootstrapHandoff(value);
  assert.equal(result.source_truth_mode, 'HANDOFF_ONLY_READONLY');
  assert.equal(result.implementation_allowed, false);
});

test('bootstrap result tamper is detected', () => {
  const result = structuredClone(bootstrapHandoff(input()));
  result.implementation_allowed = false;
  assert.throws(
    () => validateHandoffBootstrapResult(result),
    (error) => error.code === 'HANDOFF_BOOTSTRAP_RESULT_TAMPERED',
  );
});
