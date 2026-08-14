import assert from 'node:assert/strict';
import test from 'node:test';
import { ConsumerDesignGovernanceService, sha256 } from '../../src/design-governance/index.mjs';

const sum = (x) => sha256(String(x));
const service = new ConsumerDesignGovernanceService();

test('service exposes only bounded governance capabilities', () => {
  const capabilities = service.capabilities();
  assert.ok(capabilities.includes('ROADMAP_RECOMMENDATION_ONLY'));
  assert.ok(capabilities.includes('IMPROVEMENT_CANDIDATE_ROUTING_ONLY'));
  assert.equal(capabilities.some((x) => x.includes('DEPLOY') || x.includes('PAID')), false);
});

test('claim revalidation compares only supplied deterministic observations', () => {
  const report = service.revalidateHandoffClaims({ intake_id: 'intake-1', observation: { os_root: 'C:/os', branch: 'main', head_sha: sum('head'), dirty: false, status_revision: sum('status') }, canonical_facts: { architecture: '2.30' }, claims: [{ claim_id: 'claim-1', fact_key: 'architecture', claimed_value: '2.30', severity: 'CRITICAL', evidence_refs: [sum('e')] }, { claim_id: 'claim-2', fact_key: 'missing', claimed_value: true, severity: 'HIGH' }] });
  assert.equal(report.claim_results[0].result, 'CONFIRMED_CURRENT');
  assert.equal(report.claim_results[1].result, 'MISSING_EVIDENCE');
  assert.deepEqual(report.canonical_facts.map((x) => x.fact_key), ['architecture']);
  assert.match(report.canonical_facts[0].value_checksum, /^sha256:/);
  assert.equal(report.gate_result, 'FAIL');
  assert.equal(report.canonical_authority, false);
});

test('revalidation rejects unbounded object-valued canonical facts', () => {
  assert.throws(() => service.revalidateHandoffClaims({ intake_id: 'intake-1', observation: { os_root: 'C:/os', branch: 'main', head_sha: sum('head'), dirty: false, status_revision: sum('status') }, canonical_facts: { architecture: { version: '2.30' } }, claims: [] }), (e) => e.code === 'DESIGN_GOVERNANCE_INPUT_INVALID');
});

test('coverage mapping distinguishes reuse, partial and missing', () => {
  const results = service.mapExistingImplementation({ intake_id: 'intake-1', requirements: [{ requirement_id: 'REQ-1' }, { requirement_id: 'REQ-2', expected_mappings: 2 }, { requirement_id: 'REQ-3' }], repository_index: [{ kind: 'MODULE', id: 'src/existing.mjs', requirement_ids: ['REQ-1', 'REQ-2'] }] });
  assert.deepEqual(results.map((x) => x.coverage_state), ['IMPLEMENTED', 'PARTIAL', 'MISSING']);
  assert.equal(Object.isFrozen(results), true);
});

test('gap discovery keeps unresolved challenges advisory', () => {
  const gaps = service.discoverDesignGaps({ intake_id: 'intake-1', challenges: [{ gap_id: 'DG-1', category: 'authority', severity: 'CRITICAL', confidence: 1, evidence_refs: [sum('e')], disposition: 'OWNER_REQUIRED', required_authority: 'Owner' }, { gap_id: 'DG-2', category: 'closed', severity: 'LOW', confidence: 1, disposition: 'CLOSED' }] });
  assert.equal(gaps.length, 1);
  assert.equal(gaps[0].canonical_authority, false);
});

test('roadmap analysis cannot allocate a task or mutate canonicals', () => {
  const input = { intake_id: 'intake-1', decision: 'INSERT', dependencies: ['TASK-018'], insertion_point: 'after TASK-018', safe_checkpoint: sum('head'), blocked_tasks: ['TASK-017'], unaffected_tasks: ['TASK-016'], migration: 'NONE', owner_gates: ['Owner acceptance'], proposed_source_count_effect: 1 };
  const result = service.analyzeRoadmapImpact(input);
  assert.equal(result.task_allocation_authority, false);
  assert.equal(result.canonical_mutation_authority, false);
  assert.throws(() => service.analyzeRoadmapImpact({ ...input, allocate_task: true }), (e) => e.code === 'ROADMAP_AUTHORITY_FORBIDDEN');
});
