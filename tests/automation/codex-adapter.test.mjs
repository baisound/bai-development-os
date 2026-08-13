import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createCodexCapabilityProbe,
  discoverCodexCapabilities,
  normalizeCodexRunResult,
  planCodexQuantum,
  verifyCodexCapabilityProbe,
} from '../../src/automation/codex-adapter.mjs';
import { checksumObject } from '../../src/automation/util.mjs';

const sha = `sha256:${'a'.repeat(64)}`;
const probe = () => createCodexCapabilityProbe({
  provider: 'CODEX_MANUAL',
  environment: 'LOCAL_DESKTOP',
  observed_at: '2026-08-13T00:00:00+09:00',
  capabilities: [
    { capability_id: 'repository.read', status: 'AVAILABLE', evidence_refs: ['tool-inventory:local'], source_trust: 'OBSERVED_LOCAL' },
    { capability_id: 'repository.write-branch', status: 'AVAILABLE', evidence_refs: ['pr:13'], source_trust: 'OBSERVED_LOCAL' },
    { capability_id: 'usage.machine-readable', status: 'UNAVAILABLE', evidence_refs: [], source_trust: 'OBSERVED_LOCAL' },
    { capability_id: 'thread.fresh-automation-run', status: 'UNKNOWN', evidence_refs: [], source_trust: 'UNTRUSTED_DESCRIPTION' },
  ],
});
const gate = (overrides = {}) => {
  const value = {
    capability_gate_decision_version: '1.0.0',
    result: 'CAPABILITY_GATE_PASS',
    decision_id: 'GATE-F-1',
    authority_verified: true,
    authority_evidence_checksum: sha,
    safety_floor_passed: true,
    allowed_capabilities: ['repository.read', 'repository.write-branch'],
    denied_capabilities: [],
    ...overrides,
  };
  value.content_checksum = checksumObject(value);
  return value;
};
const request = (overrides = {}) => ({
  project_id: 'BAI-OS',
  task_id: 'TASK-018',
  branch: 'autonomy/task-018/codex-adapter-pilot',
  head: 'b398cb3',
  checkpoint_id: 'CP-F-1',
  checkpoint_checksum: sha,
  capability_id: 'repository.write-branch',
  root_prompt_ref: 'prompts/CODEX_AUTONOMOUS_ROOT_PROMPT.md',
  previous_conversation_required: false,
  ...overrides,
});

test('probe is deterministic, sorted, immutable and verifiable', () => {
  const value = probe();
  assert.equal(verifyCodexCapabilityProbe(value).result, 'CODEX_CAPABILITY_PROBE_VALID');
  assert.deepEqual(value.capabilities.map((item) => item.capability_id), [...value.capabilities.map((item) => item.capability_id)].sort());
  assert.equal(Object.isFrozen(value.capabilities[0]), true);
  assert.equal(probe().content_checksum, value.content_checksum);
});

test('AVAILABLE requires trusted observation evidence', () => {
  assert.throws(() => createCodexCapabilityProbe({
    provider: 'CODEX_AUTOMATION', environment: 'CLOUD', observed_at: '2026-08-13T00:00:00Z',
    capabilities: [{ capability_id: 'automation.schedule', status: 'AVAILABLE', evidence_refs: [], source_trust: 'VERIFIED_PROVIDER' }],
  }), (error) => error.code === 'CODEX_CAPABILITY_EVIDENCE_REQUIRED');
  assert.throws(() => createCodexCapabilityProbe({
    provider: 'CODEX_AUTOMATION', environment: 'CLOUD', observed_at: '2026-08-13T00:00:00Z',
    capabilities: [{ capability_id: 'automation.schedule', status: 'AVAILABLE', evidence_refs: ['page:text'], source_trust: 'UNTRUSTED_DESCRIPTION' }],
  }), (error) => error.code === 'CODEX_CAPABILITY_EVIDENCE_REQUIRED');
});

test('probe rejects duplicate or non-protocol capability identity', () => {
  const base = { status: 'UNKNOWN', evidence_refs: [], source_trust: 'OBSERVED_LOCAL' };
  assert.throws(() => createCodexCapabilityProbe({ provider: 'CODEX_MANUAL', environment: 'UNKNOWN', observed_at: '2026-08-13T00:00:00Z', capabilities: [{ capability_id: 'CODEX_SHELL', ...base }] }), (error) => error.code === 'CODEX_CAPABILITY_PROBE_INVALID');
  assert.throws(() => createCodexCapabilityProbe({ provider: 'CODEX_MANUAL', environment: 'UNKNOWN', observed_at: '2026-08-13T00:00:00Z', capabilities: [{ capability_id: 'repository.read', ...base }, { capability_id: 'repository.read', ...base }] }), (error) => error.code === 'CODEX_CAPABILITY_PROBE_INVALID');
});

test('tampered probe fails closed', () => {
  assert.throws(() => verifyCodexCapabilityProbe({ ...probe(), provider: 'CODEX_AUTOMATION' }), (error) => error.code === 'CODEX_CAPABILITY_PROBE_TAMPERED');
  const structurallyInvalid = { ...probe(), capabilities: [{ capability_id: 'bad', status: 'UNKNOWN', evidence_refs: [], source_trust: 'OBSERVED_LOCAL' }] };
  structurallyInvalid.content_checksum = checksumObject(structurallyInvalid);
  assert.throws(() => verifyCodexCapabilityProbe(structurallyInvalid), (error) => error.code === 'CODEX_CAPABILITY_PROBE_TAMPERED');
});

test('discovery requires an external verified Authority and Safety decision', () => {
  assert.throws(() => discoverCodexCapabilities(probe(), null), (error) => error.code === 'CODEX_CAPABILITY_GATE_REQUIRED');
  assert.throws(() => discoverCodexCapabilities(probe(), gate({ authority_verified: false })), (error) => error.code === 'CODEX_CAPABILITY_GATE_REQUIRED');
  assert.throws(() => discoverCodexCapabilities(probe(), gate({ safety_floor_passed: false })), (error) => error.code === 'CODEX_CAPABILITY_GATE_REQUIRED');
  const tampered = gate(); tampered.allowed_capabilities.push('release.publish');
  assert.throws(() => discoverCodexCapabilities(probe(), tampered), (error) => error.code === 'CODEX_CAPABILITY_GATE_REQUIRED');
  assert.throws(() => discoverCodexCapabilities(probe(), gate({ denied_capabilities: ['repository.read'] })), (error) => error.code === 'CODEX_CAPABILITY_GATE_REQUIRED');
});

test('discovery hides denied, unavailable and unknown capabilities', () => {
  const result = discoverCodexCapabilities(probe(), gate({ allowed_capabilities: ['repository.read'], denied_capabilities: ['repository.write-branch'] }));
  assert.deepEqual(result.capabilities, ['repository.read']);
  assert.equal(result.capabilities.includes('usage.machine-readable'), false);
  assert.equal(result.capabilities.includes('thread.fresh-automation-run'), false);
});

test('run plan is exact-state bound and never dispatches by itself', () => {
  const plan = planCodexQuantum({ probe: probe(), gate_decision: gate(), request: request() });
  assert.equal(plan.result, undefined);
  assert.equal(plan.dispatch_performed, false);
  assert.equal(plan.head, 'b398cb3');
  assert.equal(plan.gate_decision_id, 'GATE-F-1');
  assert.equal(plan.gate_decision_checksum, gate().content_checksum);
  assert.equal(plan.capability_probe_checksum, probe().content_checksum);
  assert.equal(Object.isFrozen(plan), true);
});

test('denied capability and conversation dependency fail before planning', () => {
  assert.throws(() => planCodexQuantum({ probe: probe(), gate_decision: gate({ allowed_capabilities: ['repository.read'], denied_capabilities: ['repository.write-branch'] }), request: request() }), (error) => error.code === 'CODEX_CAPABILITY_NOT_DISPATCHABLE');
  assert.throws(() => planCodexQuantum({ probe: probe(), gate_decision: gate(), request: request({ previous_conversation_required: true }) }), (error) => error.code === 'CODEX_CONVERSATION_DEPENDENCY_FORBIDDEN');
});

test('result normalization cannot claim canonical or native truth', () => {
  const result = normalizeCodexRunResult({ run_id: 'RUN-F-1', plan_checksum: sha, status: 'PASS', test_status: 'PASS', evidence_refs: ['evidence:test-log'] });
  assert.equal(result.canonical, false);
  assert.equal(result.native_evidence, false);
  assert.equal(result.requires_judge, true);
  assert.equal(Object.isFrozen(result), true);
});

test('success and test PASS require evidence while unknown remains honest', () => {
  assert.throws(() => normalizeCodexRunResult({ run_id: 'RUN-F-1', plan_checksum: sha, status: 'PASS', test_status: 'UNKNOWN', evidence_refs: [] }), (error) => error.code === 'CODEX_RESULT_EVIDENCE_REQUIRED');
  const result = normalizeCodexRunResult({ run_id: 'RUN-F-2', plan_checksum: sha, status: 'UNKNOWN' });
  assert.equal(result.test_status, 'UNKNOWN');
  assert.equal(result.review_queue_ref, null);
});
