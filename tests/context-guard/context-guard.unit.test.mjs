import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_CONTEXT_GUARD_CONFIG, validateConfig } from '../../src/context-guard/config.mjs';
import { estimateArtifactBytes, estimateInputTokens, estimateOutput } from '../../src/context-guard/estimate.mjs';
import { evaluateLimits } from '../../src/context-guard/evaluate.mjs';

test('CG-EST: conservative UTF-8 estimates and exact boundaries', () => {
  assert.equal(estimateArtifactBytes('é'), 2);
  assert.equal(estimateInputTokens(3), 2);
  assert.equal(estimateOutput({ section_token_estimates: [100] }).estimated_output_tokens, 120);
  const selected = Array.from({ length: 12 }, (_, index) => ({ path: `/${index}`, bytes: 1, estimated_tokens: 1, authority_class: 'MANDATORY_CANONICAL' }));
  assert.equal(evaluateLimits({
    selected, estimated_output_tokens: 0, estimated_artifact_bytes: 0, expected_top_level_sections: 0,
  }).decision, 'PASS');
});
test('CG-CONFIG: defaults are positive and immutable', () => {
  assert.equal(validateConfig().max_files_per_role, 12);
  assert.throws(() => validateConfig({ max_files_per_role: 0 }));
  assert.equal(Object.isFrozen(DEFAULT_CONTEXT_GUARD_CONFIG), true);
});

const input = (authority_class, index, bytes = 1, estimated_tokens = 1) => ({
  path: `/input-${index}`, authority_class, bytes, estimated_tokens,
});
const limits = (selected, extra = {}) => evaluateLimits({
  selected,
  estimated_output_tokens: 0,
  estimated_artifact_bytes: 0,
  expected_top_level_sections: 0,
  ...extra,
});

test('CG-OUTPUT-ESTIMATION: every missing or invalid required output estimate hard-stops', () => {
  const selected = [input('MANDATORY_CANONICAL', 1)];
  const valid = { estimated_output_tokens: 0, estimated_artifact_bytes: 0, expected_top_level_sections: 0 };
  for (const field of Object.keys(valid)) {
    for (const value of [undefined, null, '', Number.NaN, Infinity, -1, '1', 1.5]) {
      const data = { selected, ...valid, [field]: value };
      if (value === undefined) delete data[field];
      const result = evaluateLimits(data);
      assert.equal(result.decision, 'HARD_STOP', `${field}: ${String(value)}`);
      assert.equal(result.permit_issuance_allowed, false);
      assert.equal(result.role_activation_allowed, false);
    }
    assert.equal(evaluateLimits({ selected, ...valid, [field]: 0 }).decision, 'PASS');
  }
});

test('CG-OUTPUT-ESTIMATION: exact boundaries pass and one-over requires split', () => {
  const selected = [input('MANDATORY_CANONICAL', 1)];
  for (const [field, limit] of [
    ['estimated_output_tokens', 8000],
    ['estimated_artifact_bytes', 65536],
    ['expected_top_level_sections', 16],
  ]) {
    assert.equal(limits(selected, { [field]: limit }).decision, 'PASS');
    assert.equal(limits(selected, { [field]: limit + 1 }).decision, 'SPLIT_REQUIRED');
  }
});

test('CG-DECISION: PASS contract permits only fully in-limit input', () => {
  const result = limits([input('MANDATORY_CANONICAL', 1)]);
  assert.equal(result.decision, 'PASS');
  assert.equal(result.role_activation_allowed, true);
  assert.equal(result.permit_issuance_allowed, true);
  assert.equal(result.reduction_applied, false);
});

test('CG-DECISION: PASS_WITH_REDUCTION excludes only permitted optional inputs', () => {
  const selected = [
    ...Array.from({ length: 12 }, (_, index) => input('MANDATORY_CANONICAL', index)),
    input('DUPLICATE', 13), input('IRRELEVANT', 14),
    input('HISTORICAL_EVIDENCE', 15), input('CONDITIONAL_SUPPORTING', 16),
  ];
  const result = limits(selected);
  assert.equal(result.decision, 'PASS_WITH_REDUCTION');
  assert.deepEqual(result.excluded_inputs, ['/input-13', '/input-14', '/input-15', '/input-16']);
  assert.equal(result.reduction_applied, true);
  assert.equal(result.permit_issuance_allowed, true);
});

test('CG-DECISION: mandatory input is never removed by reduction', () => {
  const selected = Array.from({ length: 13 }, (_, index) => input('MANDATORY_CANONICAL', index));
  const result = limits(selected);
  assert.equal(result.decision, 'OWNER_OVERRIDE_REQUIRED');
  assert.deepEqual(result.excluded_inputs, []);
  assert.equal(result.override_eligible_limit, 'max_files_per_role');
});

test('CG-DECISION: output limits require split and never issue permits', () => {
  for (const extra of [
    { estimated_output_tokens: 8001 },
    { estimated_artifact_bytes: 65537 },
    { expected_top_level_sections: 17 },
  ]) {
    const result = limits([input('MANDATORY_CANONICAL', 1)], extra);
    assert.equal(result.decision, 'SPLIT_REQUIRED');
    assert.equal(result.role_activation_allowed, false);
    assert.equal(result.permit_issuance_allowed, false);
  }
});

test('CG-DECISION: security, inventory, canonical conflict, and unresolved limits hard-stop', () => {
  for (const extra of [
    { security_failure: true },
    { inventory_complete: false },
    { canonical_conflict: true },
    { selected: Array.from({ length: 13 }, (_, index) => input('MANDATORY_CANONICAL', index, 20000, 5000)) },
  ]) {
    const result = limits([input('MANDATORY_CANONICAL', 1)], extra);
    assert.equal(result.decision, 'HARD_STOP');
    assert.equal(result.safe_stop, true);
    assert.equal(result.permit_issuance_allowed, false);
  }
});

test('CG-DECISION: precedence is hard stop, override, split, reduction, pass', () => {
  assert.equal(limits([input('MANDATORY_CANONICAL', 1)], { security_failure: true, estimated_output_tokens: 8001 }).decision, 'HARD_STOP');
  assert.equal(limits(Array.from({ length: 13 }, (_, index) => input('MANDATORY_CANONICAL', index)), { estimated_output_tokens: 8001 }).decision, 'OWNER_OVERRIDE_REQUIRED');
  assert.equal(limits([input('MANDATORY_CANONICAL', 1)], { expected_top_level_sections: 17 }).decision, 'SPLIT_REQUIRED');
  assert.equal(limits([...Array.from({ length: 12 }, (_, index) => input('MANDATORY_CANONICAL', index)), input('DUPLICATE', 13)], { expected_top_level_sections: 17 }).decision, 'SPLIT_REQUIRED');
  assert.equal(limits([...Array.from({ length: 12 }, (_, index) => input('MANDATORY_CANONICAL', index)), input('DUPLICATE', 13)]).decision, 'PASS_WITH_REDUCTION');
  assert.equal(limits([input('MANDATORY_CANONICAL', 1)]).decision, 'PASS');
});
