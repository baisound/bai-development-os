import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  assertIntakeTransition, createDesignIntakeCheckpoint, createHandoffIntakeManifest,
  createInteractionAcceptanceRecord, createRegressionSurfaceRecord, evaluateDesignCompleteness,
  resumeDesignIntake, routeImprovementCandidate, sha256, transitionIntake, verifyRecordChecksum,
} from '../../src/design-governance/index.mjs';

const sum = (value) => sha256(String(value));
const intakeInput = () => ({ intake_id: 'intake-1', project_id: 'project-1', consumer_id: 'consumer-1', supplied_at: '2026-08-14T00:00:00Z', source_artifacts: [{ artifact_id: 'pack-1', source_name: 'handoff.zip', sha256: sum('pack'), size_bytes: 10, retention_location: 'C:/handoff.zip' }], claimed_repository: 'baisound/consumer', claimed_ref: 'main@abc', claimed_version: '1.0.0', provenance_complete: true, sensitivity: 'INTERNAL', missing_sources: [], assumptions: [], canonical_authority: false });

test('all ten schemas are closed Draft 2020-12 v1 contracts', async () => {
  const names = ['handoff-intake-manifest', 'handoff-revalidation-report', 'source-curation-record', 'implementation-coverage-record', 'design-gap-register', 'roadmap-impact-record', 'design-completeness-report', 'regression-surface-record', 'interaction-acceptance-record', 'improvement-candidate-routing-record'];
  for (const name of names) {
    const schema = JSON.parse(await readFile(new URL(`../../schemas/design-governance/${name}.schema.json`, import.meta.url), 'utf8'));
    assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
    assert.equal(schema.additionalProperties, false);
    assert.equal(schema.properties.schema_version.const, '1.0.0');
    assert.deepEqual(new Set(schema.required), new Set(Object.keys(schema.properties)));
  }
  const interaction = JSON.parse(await readFile(new URL('../../schemas/design-governance/interaction-acceptance-record.schema.json', import.meta.url), 'utf8'));
  assert.equal(interaction.allOf[0].then.properties.evidence_class.const, 'REAL_NATIVE');
});

test('handoff manifest is deterministic, immutable and never authority', () => {
  const a = createHandoffIntakeManifest(intakeInput());
  const b = createHandoffIntakeManifest(intakeInput());
  assert.equal(a.content_checksum, b.content_checksum);
  assert.equal(a.idempotency_key, b.idempotency_key);
  assert.equal(a.canonical_authority, false);
  assert.equal(Object.isFrozen(a.source_artifacts[0]), true);
  assert.equal(verifyRecordChecksum(a), true);
});

test('source curation requires one decision for every supplied artifact', async () => {
  const { curateHandoffSources } = await import('../../src/design-governance/index.mjs');
  const input = intakeInput(); input.source_artifacts.push({ artifact_id: 'pack-2', source_name: 'notes.md', sha256: sum('notes'), size_bytes: 5, retention_location: null });
  const manifest = createHandoffIntakeManifest(input);
  assert.throws(() => curateHandoffSources(manifest, [{ artifact_id: 'pack-1', ownership: 'CONSUMER', relevance: 'RELEVANT', freshness: 'CURRENT', superseded_by: null, retention: 'REFERENCE_ONLY', redaction: 'NONE' }]), (e) => e.code === 'SOURCE_CURATION_INCOMPLETE');
});

test('handoff manifest rejects authority and malformed checksum', () => {
  assert.throws(() => createHandoffIntakeManifest({ ...intakeInput(), canonical_authority: true }), (e) => e.code === 'HANDOFF_AUTHORITY_FORBIDDEN');
  const input = intakeInput(); input.source_artifacts[0].sha256 = 'bad';
  assert.throws(() => createHandoffIntakeManifest(input), (e) => e.code === 'DESIGN_GOVERNANCE_INPUT_INVALID');
});

test('state machine permits only explicit forward and safety transitions', () => {
  assert.equal(assertIntakeTransition('RECEIVED', 'INTEGRITY_VERIFIED'), true);
  assert.equal(assertIntakeTransition('CURATED', 'STALE'), true);
  assert.throws(() => assertIntakeTransition('RECEIVED', 'AUTHORIZED'), (e) => e.code === 'INTAKE_STATE_TRANSITION_INVALID');
  const moved = transitionIntake({ intake_id: 'intake-1', state: 'RECEIVED' }, 'INTEGRITY_VERIFIED', [sum('e')]);
  assert.equal(moved.previous_state, 'RECEIVED');
  assert.equal(verifyRecordChecksum(moved), true);
  assert.throws(() => transitionIntake({ intake_id: 'intake-1', state: 'OWNER_DECISION_REQUIRED' }, 'AUTHORIZED'), (e) => e.code === 'INTAKE_AUTHORIZATION_BINDING_REQUIRED');
  const authorized = transitionIntake({ intake_id: 'intake-1', state: 'OWNER_DECISION_REQUIRED' }, 'AUTHORIZED', [sum('owner')], { authorization: { owner_authorized: true, task_id: 'TASK-019', design_checksum: sum('design'), allowed_files_checksum: sum('files'), authorization_ref: sum('authorization') } });
  assert.equal(authorized.authorization_binding.task_id, 'TASK-019');
});

test('thirty-section completeness gate distinguishes owner decision and pass', () => {
  const sections = Array.from({ length: 30 }, (_, i) => ({ section_id: `section-${i + 1}`, status: 'COMPLETE' }));
  assert.equal(evaluateDesignCompleteness({ intake_id: 'intake-1', sections }).gate_result, 'OWNER_DECISION_REQUIRED');
  assert.equal(evaluateDesignCompleteness({ intake_id: 'intake-1', sections, critic_refs: [sum('c')], judge_refs: [sum('j')] }).gate_result, 'PASS');
  assert.equal(evaluateDesignCompleteness({ intake_id: 'intake-1', sections, stale: true }).gate_result, 'STALE');
});

test('NOT_APPLICABLE requires an explicit justification', () => {
  const sections = Array.from({ length: 30 }, (_, i) => ({ section_id: `section-${i + 1}`, status: i ? 'COMPLETE' : 'NOT_APPLICABLE' }));
  assert.throws(() => evaluateDesignCompleteness({ intake_id: 'intake-1', sections }), (e) => e.code === 'DESIGN_GOVERNANCE_INPUT_INVALID');
});

test('candidate routing remains recommendation-only', () => {
  const record = routeImprovementCandidate({ intake_id: 'intake-1', candidate_id: 'candidate-1', observation: 'Repeated safe-stop', reproducibility: 'REPRODUCED', recurrence: 2, scope: 'CROSS_PROJECT', severity: 'HIGH', critic_disposition: 'PASS', recommendation: 'KNOWLEDGE' });
  assert.equal(record.knowledge_promotion_authority, false);
  assert.equal(record.task_allocation_authority, false);
});

test('Knowledge recommendation requires reproduced recurrence and Critic PASS', () => {
  assert.throws(() => routeImprovementCandidate({ intake_id: 'intake-1', candidate_id: 'candidate-1', observation: 'Once', reproducibility: 'UNKNOWN', recurrence: 1, scope: 'PROJECT', severity: 'MEDIUM', critic_disposition: 'MORE_EVIDENCE_REQUIRED', recommendation: 'KNOWLEDGE' }), (e) => e.code === 'KNOWLEDGE_RECOMMENDATION_EVIDENCE_INSUFFICIENT');
});

test('mock/static interaction cannot claim native PASS', () => {
  const base = { intake_id: 'intake-1', environment_identity: 'fixture', actual_event_semantics: 'PASS', layout_dpi: 'NOT_APPLICABLE', accessibility: 'NOT_APPLICABLE', long_data: 'PASS', recovery: 'PASS', evidence_refs: [sum('native')] };
  assert.throws(() => createInteractionAcceptanceRecord({ ...base, evidence_class: 'MOCK', acceptance_result: 'PASS' }), (e) => e.code === 'NATIVE_ACCEPTANCE_EVIDENCE_INSUFFICIENT');
  assert.equal(createInteractionAcceptanceRecord({ ...base, evidence_class: 'REAL_NATIVE', acceptance_result: 'PASS' }).acceptance_result, 'PASS');
});

test('regression surface remains noncanonical and checksummed', () => {
  const record = createRegressionSurfaceRecord({ intake_id: 'intake-1', visible_functions: ['create'], commands: [], state_transitions: ['RECEIVED->INTEGRITY_VERIFIED'], schemas: ['handoff'], ui_adapter_behavior: [], tests: ['contracts'], native_evidence_refs: [], protected_invariants: ['TASK-017 paused'] });
  assert.equal(record.canonical_authority, false);
  assert.equal(verifyRecordChecksum(record), true);
});

test('checkpoint resume fails stale on HEAD, status or source drift', () => {
  const checkpoint = createDesignIntakeCheckpoint({ intake_id: 'intake-1', revision: 1, project_id: 'project-1', task_id: 'TASK-019', capability_id: 'BAI-OS-CONSUMER-DESIGN-GOVERNANCE-001', head_sha: sum('head'), status_revision: sum('status'), source_fingerprint: sum('source'), saved_state: 'CURATED' });
  const identity = { intake_id: 'intake-1', revision: 1, project_id: 'project-1', task_id: 'TASK-019', capability_id: 'BAI-OS-CONSUMER-DESIGN-GOVERNANCE-001' };
  assert.equal(resumeDesignIntake(checkpoint, { ...identity, head_sha: sum('head'), status_revision: sum('status'), source_fingerprint: sum('source') }).result, 'DESIGN_INTAKE_RESUME_ALLOWED');
  const stale = resumeDesignIntake(checkpoint, { ...identity, head_sha: sum('other'), status_revision: sum('status'), source_fingerprint: sum('source') });
  assert.equal(stale.result, 'DESIGN_INTAKE_STALE');
  assert.equal(stale.automatic_mutation_allowed, false);
  assert.equal(resumeDesignIntake(checkpoint, { ...identity, task_id: 'TASK-017', head_sha: sum('head'), status_revision: sum('status'), source_fingerprint: sum('source') }).result, 'DESIGN_INTAKE_STALE');
});
