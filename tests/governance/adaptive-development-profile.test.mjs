import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEVELOPMENT_PROFILES,
  selectDevelopmentProfile,
  applyProfileOverride,
  validateDevelopmentChange,
} from '../../src/governance/adaptive-development-profile.mjs';

test('micro documentation change stays quick and does not require critic ceremony', () => {
  const result = selectDevelopmentProfile({
    system_scale: 'LOCAL', feature_scale: 'MICRO', criticality: 'AUXILIARY',
    failure_impact: 'LOW', reversibility: 'EASY', novelty: 'ROUTINE', change_kind: 'DOC_ONLY',
  });
  assert.equal(result.profile_id, 'DEV_0_QUICK');
  assert.equal(result.execution.critic, 'NOT_REQUIRED');
  assert.deepEqual(result.execution.test_requirements, ['DOCUMENT_LINK_AND_CONSISTENCY_CHECK']);
});

test('ordinary small feature selects a bounded light or standard workflow, not critical governance', () => {
  const result = selectDevelopmentProfile({
    system_scale: 'PROJECT', feature_scale: 'SMALL', criticality: 'STANDARD',
    failure_impact: 'MODERATE', reversibility: 'EASY', novelty: 'ROUTINE', change_kind: 'FEATURE',
  });
  assert.ok(['DEV_1_LIGHT', 'DEV_2_STANDARD'].includes(result.profile_id));
  assert.ok(result.execution.review_cycle_cap <= 1);
});

test('core function has a high-assurance floor even when change size is small', () => {
  const result = selectDevelopmentProfile({
    system_scale: 'PROJECT', feature_scale: 'SMALL', criticality: 'CORE',
    failure_impact: 'MODERATE', reversibility: 'EASY', novelty: 'ROUTINE', change_kind: 'BUGFIX',
  });
  assert.equal(result.profile_id, 'DEV_3_HIGH_ASSURANCE');
  assert.match(result.execution.critic, /REQUIRED/);
  assert.ok(result.execution.test_requirements.includes('BOUNDARY_NEGATIVE'));
});

test('foundation function always receives the maximum profile', () => {
  const result = selectDevelopmentProfile({
    system_scale: 'PROJECT', feature_scale: 'MICRO', criticality: 'FOUNDATION',
    failure_impact: 'LOW', reversibility: 'EASY', novelty: 'ROUTINE', change_kind: 'BUGFIX',
  });
  assert.equal(result.profile_id, 'DEV_4_FOUNDATION_CRITICAL');
  assert.ok(result.execution.test_requirements.includes('FAULT_INJECTION_OR_RECOVERY'));
  assert.ok(result.execution.test_requirements.includes('CONSUMER_FIXTURE_WHEN_APPLICABLE'));
});

test('critical failure impact always receives the maximum profile', () => {
  const result = selectDevelopmentProfile({
    system_scale: 'LOCAL', feature_scale: 'MICRO', criticality: 'AUXILIARY',
    failure_impact: 'CRITICAL', reversibility: 'EASY', novelty: 'ROUTINE', change_kind: 'CONFIG',
  });
  assert.equal(result.profile_id, 'DEV_4_FOUNDATION_CRITICAL');
});

test('multi-project contract receives at least high assurance', () => {
  const result = selectDevelopmentProfile({
    system_scale: 'MULTI_PROJECT', feature_scale: 'SMALL', criticality: 'STANDARD',
    failure_impact: 'MODERATE', reversibility: 'EASY', novelty: 'ADAPTATION', change_kind: 'FEATURE',
    cross_project_contract: true,
  });
  assert.ok(DEVELOPMENT_PROFILES[result.profile_id].rank >= DEVELOPMENT_PROFILES.DEV_3_HIGH_ASSURANCE.rank);
});

for (const flag of ['touches_security', 'touches_authorization', 'touches_state_machine', 'data_migration']) {
  test(`${flag} cannot be treated as a low-assurance change`, () => {
    const result = selectDevelopmentProfile({
      system_scale: 'LOCAL', feature_scale: 'MICRO', criticality: 'AUXILIARY',
      failure_impact: 'LOW', reversibility: 'EASY', novelty: 'ROUTINE', change_kind: 'BUGFIX',
      [flag]: true,
    });
    assert.ok(DEVELOPMENT_PROFILES[result.profile_id].rank >= 3);
  });
}

test('large plus high-impact combination escalates to foundation-critical', () => {
  const result = selectDevelopmentProfile({
    system_scale: 'PROJECT', feature_scale: 'LARGE', criticality: 'STANDARD',
    failure_impact: 'HIGH', reversibility: 'MODERATE', novelty: 'ADAPTATION', change_kind: 'FEATURE',
  });
  assert.equal(result.profile_id, 'DEV_4_FOUNDATION_CRITICAL');
});

test('profile never changes model policy', () => {
  for (const criticality of ['AUXILIARY', 'STANDARD', 'CORE', 'FOUNDATION']) {
    const result = selectDevelopmentProfile({ criticality });
    assert.equal(result.execution.model_policy, 'UNCHANGED_BY_PROFILE');
  }
});

test('localized fixes do not restart the complete workflow by default', () => {
  const result = selectDevelopmentProfile({ criticality: 'CORE', change_kind: 'BUGFIX' });
  assert.notEqual(result.execution.revalidation_scope, 'FULL_WORKFLOW_RESTART');
  assert.ok(result.execution.token_efficiency_rules.includes('NO_FULL_REVIEW_RESTART_FOR_LOCAL_FIX'));
});

test('manual escalation is always allowed', () => {
  const base = selectDevelopmentProfile({
    system_scale: 'LOCAL', feature_scale: 'MICRO', criticality: 'AUXILIARY', failure_impact: 'LOW', change_kind: 'DOC_ONLY',
  });
  const raised = applyProfileOverride(base, 'DEV_3_HIGH_ASSURANCE');
  assert.equal(raised.profile_id, 'DEV_3_HIGH_ASSURANCE');
  assert.equal(raised.override, 'ESCALATED');
});

test('manual de-escalation requires explicit owner authority and a reason', () => {
  const base = selectDevelopmentProfile({ criticality: 'CORE' });
  assert.throws(() => applyProfileOverride(base, 'DEV_1_LIGHT'), /OWNER_AUTHORIZATION/);
  const lowered = applyProfileOverride(base, 'DEV_2_STANDARD', { owner_authorized: true, justification: 'isolated non-production fixture adjustment' });
  assert.equal(lowered.profile_id, 'DEV_2_STANDARD');
});

test('foundation and critical changes cannot be manually de-escalated', () => {
  const foundation = selectDevelopmentProfile({ criticality: 'FOUNDATION' });
  assert.throws(
    () => applyProfileOverride(foundation, 'DEV_3_HIGH_ASSURANCE', { owner_authorized: true, justification: 'requested' }),
    /DEESCALATION_FORBIDDEN/,
  );
  const critical = selectDevelopmentProfile({ failure_impact: 'CRITICAL' });
  assert.throws(
    () => applyProfileOverride(critical, 'DEV_3_HIGH_ASSURANCE', { owner_authorized: true, justification: 'requested' }),
    /DEESCALATION_FORBIDDEN/,
  );
});

test('invalid classification is rejected rather than guessed', () => {
  assert.throws(() => validateDevelopmentChange({ feature_scale: 'HUGE' }), /feature_scale/);
  assert.throws(() => validateDevelopmentChange({ touches_security: 'yes' }), /must be boolean/);
});
