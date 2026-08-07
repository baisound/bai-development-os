import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createEvidenceSession } from '../../src/context-guard/evidence-store.mjs';
import { collectInputInventory, deduplicateInputs, selectInputs } from '../../src/context-guard/inventory.mjs';
import { consumeRoleActivationPermit, createCanonicalPreflightResult, issueRoleActivationPermit, validateRoleActivationPermit } from '../../src/context-guard/permit.mjs';
import { persistAndConsumeOverride, validateOverride } from '../../src/context-guard/override.mjs';

const OS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
process.env.BAI_OS_ALLOWED_READ_ROOTS = OS_ROOT;

const canonical = (value) => JSON.stringify(sort(value));
const sort = (value) => Array.isArray(value) ? value.map(sort) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, sort(value[key])])) : value;
const permitChecksum = (permit) => {
  const copy = { ...permit };
  delete copy.content_checksum;
  return `sha256:${createHash('sha256').update(canonical(copy)).digest('hex')}`;
};
const baselineChecksum = (baseline) => {
  const copy = { ...baseline };
  delete copy.baseline_result_checksum;
  delete copy.content_checksum;
  return `sha256:${createHash('sha256').update(canonical(copy)).digest('hex')}`;
};
const output_estimates = { estimated_output_tokens: 0, estimated_artifact_bytes: 0, expected_top_level_sections: 0 };
const makeOverride = (request, changes = {}) => ({
  override_id: 'baseline-eligibility', project_id: request.project_id, task_id: request.task_id,
  role: request.role, session_id: request.session_id, overridden_limit: 'max_files_per_role',
  original_limit: 12, approved_limit: 13,
  selected_input_checksums: request.selected_inputs.map((item) => item.content_checksum),
  issued_at: new Date().toISOString(), expires_at: new Date(Date.now() + 60_000).toISOString(),
  single_use: true, owner_authority: 'owner-decision', justification: 'bounded test override',
  ...changes,
});
const makeRequest = async (session_id, requested_inputs) => {
  const selected_inputs = selectInputs(deduplicateInputs(await collectInputInventory(requested_inputs))).selected;
  return {
    project_id: 'javascript-roulette', task_id: 'TASK-004', role: 'Builder', session_id,
    selected_inputs, requested_inputs, output_estimates,
  };
};
const issueFromPreflight = async ({ session, request, outputEstimates = output_estimates, override_binding }) => {
  const preflight = override_binding?.repreflight ?? await createCanonicalPreflightResult({
    session, ...request, output_estimates: outputEstimates,
  });
  return issueRoleActivationPermit({
    session, ...request,
    preflight_result: preflight,
    preflight_result_checksum: preflight.content_checksum,
    override_binding,
  });
};

test('CG-PERMIT: immutable permit is single-use through the ledger', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'guard-')); t.after(() => rm(root, { recursive: true, force: true }));
  const session = await createEvidenceSession({ projectRoot: root, taskId: 'TASK-004', sessionId: 'one' });
  const request = { project_id: 'javascript-roulette', task_id: 'TASK-004', role: 'Builder', session_id: 'one', selected_inputs: [{ content_checksum: 'sha256:a', bytes: 1, estimated_tokens: 1 }] };
  const permit = await issueFromPreflight({ session, request });
  assert.equal('consumed_at' in permit, false);
  await validateRoleActivationPermit({ session, permit, request });
  await consumeRoleActivationPermit({ session, permit, request });
  await assert.rejects(() => validateRoleActivationPermit({ session, permit, request }), (error) => error.code === 'CONTEXT_ROLE_ACTIVATION_PERMIT_ALREADY_CONSUMED');
});

test('CG-OVERRIDE: persists verified, bound override before preflight', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'guard-')); t.after(() => rm(root, { recursive: true, force: true }));
  const session = await createEvidenceSession({ projectRoot: root, taskId: 'TASK-004', sessionId: 'override' });
  const requested_inputs = [
    'activation-gateway', 'config', 'errors', 'estimate', 'evaluate', 'evidence-store', 'index',
    'inventory', 'override', 'path-safety', 'permit', 'role-runtime-executor',
  ].map((name) => ({ path: `${OS_ROOT}/src/context-guard/${name}.mjs`, authority_class: 'MANDATORY_CANONICAL' }));
  requested_inputs.push({ path: path.join(OS_ROOT, 'PROJECT.md'), authority_class: 'MANDATORY_CANONICAL' });
  const { selected_inputs } = { selected_inputs: selectInputs(deduplicateInputs(await collectInputInventory(requested_inputs))).selected };
  const request = {
    project_id: 'javascript-roulette', task_id: 'TASK-004', role: 'Builder', session_id: 'override',
    selected_inputs, requested_inputs,
    output_estimates: { estimated_output_tokens: 0, estimated_artifact_bytes: 0, expected_top_level_sections: 0 },
  };
  const override = { override_id: 'one', project_id: request.project_id, task_id: request.task_id, role: request.role, session_id: request.session_id,
    overridden_limit: 'max_files_per_role', original_limit: 12, approved_limit: 13,
    selected_input_checksums: selected_inputs.map((item) => item.content_checksum), issued_at: new Date().toISOString(), expires_at: new Date(Date.now() + 60_000).toISOString(),
    single_use: true, owner_authority: 'owner-decision', justification: 'bounded test override' };
  const binding = await persistAndConsumeOverride({ session, override, request });
  assert.equal(binding.repreflight.decision, 'PASS');
  const permit = await issueFromPreflight({ session, request, override_binding: binding });
  await validateRoleActivationPermit({ session, permit, request });
  assert.deepEqual(Object.keys(binding.baseline.measured_values).sort(), [
    'estimated_artifact_bytes', 'estimated_input_tokens', 'estimated_output_tokens',
    'expected_artifact_sections', 'selected_file_count', 'total_input_bytes',
  ]);
  assert.deepEqual(Object.keys(binding.baseline.configured_limits).sort(), [
    'max_artifact_sections', 'max_estimated_input_tokens', 'max_estimated_output_tokens',
    'max_files_per_role', 'max_single_artifact_bytes', 'max_total_input_bytes',
  ]);
  assert.deepEqual(binding.baseline.override_eligible_limits, [
    'max_estimated_input_tokens', 'max_files_per_role', 'max_total_input_bytes',
  ]);
  assert.equal(binding.baseline.baseline_result_checksum, baselineChecksum(binding.baseline));
  assert.equal(permit.overridden_limit, 'max_files_per_role');
  assert.equal(permit.baseline_original_limit, 12);
  assert.equal(permit.approved_limit, 13);
  assert.equal(permit.final_guard_decision, 'PASS');
  for (const field of [
    'baseline_preflight_result_checksum', 'override_record_checksum', 'repreflight_result_checksum',
    'trusted_root_set_checksum', 'selected_input_set_checksum', 'guard_config_checksum',
    'overridden_limit', 'baseline_original_limit', 'approved_limit', 'final_guard_decision',
  ]) {
    const malformed = { ...permit };
    delete malformed[field];
    malformed.content_checksum = permitChecksum(malformed);
    await assert.rejects(
      () => validateRoleActivationPermit({ session, permit: malformed, request }),
      (error) => ['CONTEXT_ROLE_ACTIVATION_PERMIT_INVALID', 'CONTEXT_LEGACY_PERMIT_REJECTED'].includes(error.code),
    );
  }
  for (const change of [
    { overridden_limit: 'max_total_input_bytes' },
    { baseline_original_limit: 11 },
    { approved_limit: 14 },
  ]) {
    const malformed = { ...permit, ...change };
    malformed.content_checksum = permitChecksum(malformed);
    await assert.rejects(
      () => validateRoleActivationPermit({ session, permit: malformed, request }),
      (error) => error.code === 'CONTEXT_ROLE_ACTIVATION_PERMIT_INVALID',
    );
  }
  const baselinePath = path.join(session, 'baseline-preflight-result.json');
  const malformedBaseline = { ...binding.baseline, measured_values: { ...binding.baseline.measured_values, selected_file_count: 0 } };
  malformedBaseline.baseline_result_checksum = baselineChecksum(malformedBaseline);
  malformedBaseline.content_checksum = permitChecksum(malformedBaseline);
  await writeFile(baselinePath, canonical(malformedBaseline));
  await assert.rejects(
    () => validateRoleActivationPermit({ session, permit, request }),
    (error) => error.code === 'CONTEXT_OWNER_OVERRIDE_INVALID',
  );
  const assertMalformedBaselineRejected = async (makeMalformed) => {
    const candidate = makeMalformed(structuredClone(binding.baseline));
    candidate.baseline_result_checksum = baselineChecksum(candidate);
    candidate.content_checksum = permitChecksum(candidate);
    await writeFile(baselinePath, canonical(candidate));
    await assert.rejects(
      () => validateRoleActivationPermit({ session, permit, request }),
      (error) => error.code === 'CONTEXT_OWNER_OVERRIDE_INVALID',
    );
  };
  await assertMalformedBaselineRejected((baseline) => {
    delete baseline.measured_values.total_input_bytes;
    return baseline;
  });
  await assertMalformedBaselineRejected((baseline) => {
    baseline.configured_limits.unknown_limit = 1;
    return baseline;
  });
  await assertMalformedBaselineRejected((baseline) => {
    baseline.measured_values.estimated_input_tokens = Number.NaN;
    return baseline;
  });
  await assertMalformedBaselineRejected((baseline) => {
    baseline.override_eligible_limits = [...baseline.override_eligible_limits, 'security_limit'];
    return baseline;
  });
  await assertMalformedBaselineRejected((baseline) => {
    baseline.exceeded_limits = ['max_total_input_bytes'];
    return baseline;
  });
  await assertMalformedBaselineRejected((baseline) => {
    baseline.decision = 'PASS';
    return baseline;
  });
  const schema = JSON.parse(await readFile(path.join(OS_ROOT, 'context-guard/phase1.5/schemas/context-override.schema.json'), 'utf8'));
  const persisted = binding.override;
  assert.deepEqual(Object.keys(persisted).sort(), Object.keys(schema.properties).sort());
  const timestampPattern = new RegExp(schema.properties.issued_at.pattern);
  assert.equal(schema.properties.expires_at.pattern, schema.properties.issued_at.pattern);
  for (const value of ['2026-08-01T00:00:00.000Z', '2026-12-31T23:59:59.999Z']) {
    assert.equal(timestampPattern.test(value), true);
    assert.equal(validateOverride({
      ...override, issued_at: value, expires_at: '2030-01-01T00:00:00.000Z',
    }, request, Date.parse('2025-01-01T00:00:00.000Z')), true);
  }
  for (const value of [
    '2026-08-01T00:00:00Z', '2026-08-01T00:00:00.0Z', '2026-08-01T00:00:00.00Z',
    '2026-08-01T00:00:00.0000Z', '2026-08-01T00:00:00.000z',
    '2026-08-01T00:00:00.000+00:00', '2026-08-01T00:00:00.000+09:00',
    '2026-08-01 00:00:00.000Z', '2026-08-01T00:00:00.000',
    ' 2026-08-01T00:00:00.000Z', '2026-08-01T00:00:00.000Z ',
    '2026-08-01T00:00:00.000Zextra',
  ]) {
    assert.equal(timestampPattern.test(value), false);
    assert.throws(
      () => validateOverride({ ...override, issued_at: value }, request, Date.parse('2025-01-01T00:00:00.000Z')),
      (error) => error.code === 'OVERRIDE_SCHEMA_TIMESTAMP_INVALID',
    );
  }
  for (const field of Object.keys(override)) {
    const malformed = { ...override }; delete malformed[field];
    assert.throws(() => validateOverride(malformed, request));
  }
  assert.throws(
    () => validateOverride({ ...override, unknown: true }, request),
    (error) => error.code === 'OVERRIDE_SCHEMA_UNKNOWN_FIELD',
  );
  for (const value of ['not_a_limit', 'MAX_FILES_PER_ROLE', '', ' ', null, 1]) {
    assert.throws(
      () => validateOverride({ ...override, overridden_limit: value }, request),
      (error) => error.code === 'OVERRIDE_SCHEMA_ENUM_INVALID',
    );
  }
  assert.equal(validateOverride({ ...override, original_limit: 1, approved_limit: 1 }, request), true);
  for (const field of ['original_limit', 'approved_limit']) {
    for (const value of [0, -1]) {
      assert.throws(
        () => validateOverride({ ...override, [field]: value }, request),
        (error) => error.code === 'OVERRIDE_SCHEMA_MINIMUM_VIOLATION',
      );
    }
    for (const value of [1.5, '1', Number.NaN, Infinity, -Infinity, null, true, {}, []]) {
      assert.throws(
        () => validateOverride({ ...override, [field]: value }, request),
        (error) => error.code === 'OVERRIDE_SCHEMA_TYPE_INVALID',
      );
    }
  }
  for (const field of ['issued_at', 'expires_at']) {
    for (const value of [
      new Date(), Date.now(), true, null, undefined, [], {}, '', ' ', 'not-a-timestamp',
      '2030-01-01T00:00:00.000', '2030-01-01t00:00:00.000z',
      '2030-01-01T00:00:00Z', '1735689600000', { toString: () => '2030-01-01T00:00:00.000Z' },
    ]) {
      assert.throws(
        () => validateOverride({ ...override, [field]: value }, request),
        (error) => ['OVERRIDE_SCHEMA_TYPE_INVALID', 'OVERRIDE_SCHEMA_TIMESTAMP_INVALID'].includes(error.code),
      );
    }
  }
  assert.equal(validateOverride({
    ...override, issued_at: '2030-01-01T00:00:00.000Z', expires_at: '2030-01-01T00:00:00.001Z',
  }, request), true);
  for (const timestamps of [
    { issued_at: '2030-01-01T00:00:00.000Z', expires_at: '2030-01-01T00:00:00.000Z' },
    { issued_at: '2030-01-01T00:00:00.001Z', expires_at: '2030-01-01T00:00:00.000Z' },
  ]) {
    assert.throws(
      () => validateOverride({ ...override, ...timestamps }, request),
      (error) => error.code === 'OVERRIDE_SCHEMA_TEMPORAL_ORDER_INVALID',
    );
  }
  assert.throws(
    () => validateOverride({
      ...override, issued_at: '2000-01-01T00:00:00.000Z', expires_at: '2000-01-01T00:00:00.001Z',
    }, request),
    (error) => error.code === 'CONTEXT_OWNER_OVERRIDE_INVALID',
  );
  const invalidSession = await createEvidenceSession({ projectRoot: root, taskId: 'TASK-004', sessionId: 'timestamp-invalid' });
  const invalidRequest = { ...request, session_id: 'timestamp-invalid' };
  await assert.rejects(
    () => persistAndConsumeOverride({
      session: invalidSession,
      override: { ...override, session_id: invalidRequest.session_id, issued_at: new Date() },
      request: invalidRequest,
    }),
    (error) => error.code === 'OVERRIDE_SCHEMA_TYPE_INVALID',
  );
  const forged = { ...permit, permit_binding: { ...permit.permit_binding, repreflight_result_checksum: 'sha256:forged' } };
  forged.content_checksum = permitChecksum(forged);
  await assert.rejects(
    () => validateRoleActivationPermit({ session, permit: forged, request }),
    (error) => ['CONTEXT_ROLE_ACTIVATION_PERMIT_INVALID', 'CONTEXT_OWNER_OVERRIDE_INVALID'].includes(error.code),
  );
  await assert.rejects(
    () => persistAndConsumeOverride({ session, override, request, rerunPreflight: async () => ({ decision: 'PASS' }) }),
    (error) => error.code === 'CONTEXT_OWNER_OVERRIDE_INVALID',
  );
});

test('CG-OVERRIDE: rejects baseline-ineligible and mismatched overrides before Permit issuance', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'guard-')); t.after(() => rm(root, { recursive: true, force: true }));
  const sourceInputs = [
    'activation-gateway', 'config', 'errors', 'estimate', 'evaluate', 'evidence-store', 'index',
    'inventory', 'override', 'path-safety', 'permit', 'role-runtime-executor',
  ].map((name) => ({ path: `${OS_ROOT}/src/context-guard/${name}.mjs`, authority_class: 'MANDATORY_CANONICAL' }));
  const baselineFailureInputs = [...sourceInputs, {
    path: path.join(OS_ROOT, 'PROJECT.md'), authority_class: 'MANDATORY_CANONICAL',
  }];
  const cases = [
    { name: 'baseline already passes', inputs: [baselineFailureInputs[0]], changes: {} },
    {
      name: 'override names a different limit', inputs: baselineFailureInputs,
      changes: { overridden_limit: 'max_total_input_bytes', original_limit: 131072, approved_limit: 131073 },
    },
    {
      name: 'override original limit differs from trusted configuration', inputs: baselineFailureInputs,
      changes: { original_limit: 11 },
    },
    {
      name: 'baseline exceeds multiple input limits',
      inputs: [
        path.join(OS_ROOT, 'tasks/TASK-004/task.md'),
        path.join(OS_ROOT, 'tasks/TASK-004/final-plan.md'),
        path.join(OS_ROOT, 'tasks/TASK-004/closure-final-plan-amendment-revision-01.md'),
        path.join(OS_ROOT, 'tasks/TASK-004/closure-final-plan-amendment-revision-02.md'),
        path.join(OS_ROOT, 'tasks/TASK-004/closure-final-plan-consistency-check.md'),
        path.join(OS_ROOT, 'tasks/TASK-004/closure-final-plan-consistency-recheck-01.md'),
        path.join(OS_ROOT, 'tasks/TASK-004/closure-final-plan-consistency-recheck-02.md'),
        path.join(OS_ROOT, 'tasks/TASK-004/implementation-fix-report.md'),
        path.join(OS_ROOT, 'tasks/TASK-004/phase1.5-context-guard-design-final-plan.md'),
        path.join(OS_ROOT, 'tasks/TASK-004/phase1.5-context-guard-design-final-plan-revision-01.md'),
        path.join(OS_ROOT, 'tasks/TASK-004/phase1.5-context-guard-independent-critic-rereview-01.md'),
        path.join(OS_ROOT, 'tasks/TASK-004/phase1.5-context-guard-independent-test-retest-05.md'),
        path.join(OS_ROOT, 'tasks/TASK-004/phase1.5-context-guard-owner-decisions-addendum-01.md'),
      ].map((path) => ({ path, authority_class: 'MANDATORY_CANONICAL' })),
      changes: {},
    },
  ];
  for (const [index, scenario] of cases.entries()) {
    const session = await createEvidenceSession({ projectRoot: root, taskId: 'TASK-004', sessionId: `baseline-${index}` });
    const request = await makeRequest(`baseline-${index}`, scenario.inputs);
    await assert.rejects(
      () => persistAndConsumeOverride({ session, override: makeOverride(request, scenario.changes), request }),
      (error) => error.code === 'CONTEXT_OWNER_OVERRIDE_INVALID',
      scenario.name,
    );
    await assert.rejects(
      () => issueRoleActivationPermit({ session, ...request, override_binding: {} }),
      (error) => error.code === 'CONTEXT_PREFLIGHT_RESULT_REQUIRED',
      `${scenario.name}: Permit must not issue`,
    );
  }
});

test('CG-PERMIT: concurrent consumers produce one event and one lease conflict', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'guard-')); t.after(() => rm(root, { recursive: true, force: true }));
  const session = await createEvidenceSession({ projectRoot: root, taskId: 'TASK-004', sessionId: 'race' });
  const request = { project_id: 'javascript-roulette', task_id: 'TASK-004', role: 'Builder', session_id: 'race', selected_inputs: [{ content_checksum: 'sha256:a', bytes: 1, estimated_tokens: 1 }] };
  const permit = await issueFromPreflight({ session, request });
  const results = await Promise.allSettled([
    consumeRoleActivationPermit({ session, permit, request }),
    consumeRoleActivationPermit({ session, permit, request }),
  ]);
  assert.equal(results.filter((item) => item.status === 'fulfilled').length, 1);
  assert.equal(results.filter((item) => item.status === 'rejected').length, 1);
});

test('CG-PERMIT: only PASS decisions and settled reductions can issue permits', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'guard-')); t.after(() => rm(root, { recursive: true, force: true }));
  const request = { project_id: 'javascript-roulette', task_id: 'TASK-004', role: 'Builder', session_id: 'decisions', selected_inputs: [{ content_checksum: 'sha256:a', bytes: 1, estimated_tokens: 1 }] };
  const passSession = await createEvidenceSession({ projectRoot: root, taskId: 'TASK-004', sessionId: 'pass' });
  const reducedSession = await createEvidenceSession({ projectRoot: root, taskId: 'TASK-004', sessionId: 'reduced' });
  assert.equal((await issueFromPreflight({ session: passSession, request })).decision, 'PASS');
  const reducedRequest = {
    ...request,
    selected_inputs: [
      ...Array.from({ length: 12 }, (_, index) => ({
        content_checksum: `sha256:mandatory-${index}`, bytes: 1, estimated_tokens: 1, authority_class: 'MANDATORY_CANONICAL',
      })),
      { content_checksum: 'sha256:duplicate', bytes: 1, estimated_tokens: 1, authority_class: 'DUPLICATE' },
    ],
  };
  assert.equal((await issueFromPreflight({ session: reducedSession, request: reducedRequest })).decision, 'PASS_WITH_REDUCTION');
  for (const decision of ['SPLIT_REQUIRED', 'OWNER_OVERRIDE_REQUIRED', 'HARD_STOP']) {
    const session = await createEvidenceSession({ projectRoot: root, taskId: 'TASK-004', sessionId: decision });
    await assert.rejects(() => issueRoleActivationPermit({ session, ...request, decision }), (error) => error.code === 'CONTEXT_PREFLIGHT_RESULT_REQUIRED');
  }
});

test('CG-PERMIT: a Permit bound to a changed trusted Root Set is rejected', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'guard-')); t.after(() => rm(root, { recursive: true, force: true }));
  const session = await createEvidenceSession({ projectRoot: root, taskId: 'TASK-004', sessionId: 'root-set' });
  const request = { project_id: 'javascript-roulette', task_id: 'TASK-004', role: 'Builder', session_id: 'root-set', selected_inputs: [{ content_checksum: 'sha256:a', bytes: 1, estimated_tokens: 1 }] };
  const permit = await issueFromPreflight({ session, request });
  const stalePermit = { ...permit, trusted_root_set_checksum: 'sha256:stale-root-set' };
  stalePermit.content_checksum = permitChecksum(stalePermit);
  await assert.rejects(() => validateRoleActivationPermit({ session, permit: stalePermit, request }), (error) => error.code === 'CONTEXT_ROLE_ACTIVATION_PERMIT_INVALID');
});

test('CG-PREFLIGHT: Permit issuance requires persisted, verified, eligible output-bound Preflight evidence', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'guard-')); t.after(() => rm(root, { recursive: true, force: true }));
  const request = {
    project_id: 'javascript-roulette', task_id: 'TASK-004', role: 'Builder', session_id: 'preflight',
    selected_inputs: [{ content_checksum: 'sha256:a', bytes: 1, estimated_tokens: 1 }],
  };
  const absentSession = await createEvidenceSession({ projectRoot: root, taskId: 'TASK-004', sessionId: 'absent' });
  await assert.rejects(
    () => issueRoleActivationPermit({ session: absentSession, ...request }),
    (error) => error.code === 'CONTEXT_PREFLIGHT_RESULT_REQUIRED',
  );
  for (const [index, output_estimates] of [
    {},
    { estimated_output_tokens: undefined, estimated_artifact_bytes: 0, expected_top_level_sections: 0 },
    { estimated_output_tokens: null, estimated_artifact_bytes: 0, expected_top_level_sections: 0 },
    { estimated_output_tokens: Number.NaN, estimated_artifact_bytes: 0, expected_top_level_sections: 0 },
    { estimated_output_tokens: Infinity, estimated_artifact_bytes: 0, expected_top_level_sections: 0 },
    { estimated_output_tokens: -1, estimated_artifact_bytes: 0, expected_top_level_sections: 0 },
    { estimated_output_tokens: '0', estimated_artifact_bytes: 0, expected_top_level_sections: 0 },
    { estimated_output_tokens: 0, estimated_artifact_bytes: 0, expected_top_level_sections: 17 },
  ].entries()) {
    const session = await createEvidenceSession({ projectRoot: root, taskId: 'TASK-004', sessionId: `invalid-${index}` });
    const scoped = { ...request, session_id: `invalid-${index}` };
    const preflight = await createCanonicalPreflightResult({ session, ...scoped, output_estimates });
    await assert.rejects(
      () => issueRoleActivationPermit({
        session, ...scoped, preflight_result: preflight, preflight_result_checksum: preflight.content_checksum,
      }),
      (error) => ['CONTEXT_OUTPUT_ESTIMATION_REQUIRED', 'CONTEXT_OUTPUT_ESTIMATION_INVALID', 'CONTEXT_PERMIT_DECISION_INELIGIBLE', 'CONTEXT_PREFLIGHT_RESULT_INVALID'].includes(error.code),
    );
  }
  const fake = { result_id: 'fake', decision: 'PASS' };
  await assert.rejects(
    () => issueRoleActivationPermit({
      session: absentSession, ...request, preflight_result: fake, preflight_result_checksum: 'sha256:fake',
    }),
    (error) => error.code === 'CONTEXT_PREFLIGHT_EVIDENCE_REQUIRED',
  );
});
