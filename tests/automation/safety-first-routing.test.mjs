import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { createContextCostRecord } from '../../src/context-control/index.mjs';
import {
  selectSafetyFirstAutonomyRoute,
  verifySafetyFirstAutonomyRouteDecision,
} from '../../src/automation/index.mjs';
import { checksumObject } from '../../src/automation/util.mjs';

const hash = (value) => `sha256:${createHash('sha256').update(value).digest('hex')}`;
const route = (route_id, extra = {}) => ({
  route_id,
  capability_tier: 'STANDARD',
  authorized: true,
  authority_evidence_checksum: hash(`authority:${route_id}`),
  authority_verification_result: 'OWNER_AUTHORIZATION_VERIFIED',
  safety_floor_passed: true,
  safety_floor_id: 'DEV4-SAFETY',
  safety_evidence_checksum: hash(`safety:${route_id}`),
  model_control_passed: true,
  model_route_ref: `model:${route_id}`,
  dev_profiles: ['DEV_4_FOUNDATION_CRITICAL'],
  capabilities: ['repository.write-branch'],
  quality_status: 'PASS',
  quality_score: 0.95,
  reliability_score: 0.95,
  provider_status: 'AVAILABLE',
  paid_execution: false,
  native_execution: false,
  context_estimate_evidence_checksum: hash(`context-estimate:${route_id}`),
  estimated_context_tokens: 1000,
  estimated_cost_microusd: 100,
  ...extra,
});
const source = (source_id) => ({
  source_id,
  source_type: 'REPOSITORY_FILE',
  path_or_ref: `registry/${source_id}.md`,
  sha256: hash(source_id),
  estimated_tokens: 100,
  observed_tokens: null,
  selected_reason: 'bounded routing evidence',
  mandatory: true,
  cacheable: true,
  changed_since_previous_session: false,
  used_in_decision: true,
  used_in_patch: false,
  duplicate_of: null,
  stale: false,
  trust_level: 'CANONICAL',
});
const contextRecord = (quality = 'PASS') => createContextCostRecord({
  record_id: `CCR-ROUTE-${quality}`,
  task_id: 'TASK-018',
  session_id: 'SESSION-ROUTE',
  phase: 'PHASE_H1_2',
  recorded_at: '2026-08-13T00:00:00Z',
  confidence: 'LOCAL_TOKENIZER_ESTIMATE',
  sources: [source('route-source')],
  usage: {
    observed_input_tokens: null,
    observed_cached_input_tokens: null,
    observed_output_tokens: null,
    billed_tokens: null,
  },
  quality_gate: { status: quality, gate_id: quality === 'UNKNOWN' ? null : 'ROUTING-QUALITY' },
  repeated_overfetch_count: 0,
});
const request = (routes, extra = {}) => ({
  task_id: 'TASK-018',
  required_dev_profile: 'DEV_4_FOUNDATION_CRITICAL',
  required_safety_floor_id: 'DEV4-SAFETY',
  allowed_capability_tiers: ['STANDARD', 'DEEP_REASONING'],
  required_capabilities: ['repository.write-branch'],
  max_cost_microusd: 1000,
  paid_execution_authorized: false,
  native_execution_authorized: false,
  paid_execution_authority_evidence_checksum: null,
  paid_execution_authority_verification_result: 'NOT_AUTHORIZED',
  native_execution_authority_evidence_checksum: null,
  native_execution_authority_verification_result: 'NOT_AUTHORIZED',
  routes,
  ...extra,
});

test('creates an immutable deterministic verifiable decision independent of input order', () => {
  const a = route('a', { estimated_cost_microusd: 20 });
  const b = route('b', { estimated_cost_microusd: 10 });
  const rejected = route('rejected', { provider_status: 'UNAVAILABLE' });
  const first = selectSafetyFirstAutonomyRoute(request([a, rejected, b]));
  const second = selectSafetyFirstAutonomyRoute(request([b, a, rejected]));
  assert.deepEqual(first, second);
  assert.equal(first.selected_route_id, 'b');
  assert.equal(first.authority_created, false);
  assert.equal(verifySafetyFirstAutonomyRouteDecision(first, request([a, rejected, b])).result, 'AUTONOMY_ROUTE_DECISION_VALID');
  assert.match(first.routing_input_checksum, /^sha256:[a-f0-9]{64}$/);
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(first.rejected_routes), true);
});

test('hard eligibility floors reject unverified authority, safety, tier, model, DEV, capability, quality and provider', () => {
  const routes = [
    route('authority', { authority_verification_result: 'CLAIMED_ONLY' }),
    route('safety', { safety_floor_passed: false }),
    route('tier', { capability_tier: 'ECONOMY' }),
    route('model', { model_control_passed: false }),
    route('dev', { dev_profiles: ['DEV_2'] }),
    route('capability', { capabilities: [] }),
    route('quality', { quality_status: 'FAIL' }),
    route('provider', { provider_status: 'UNKNOWN' }),
  ];
  const decision = selectSafetyFirstAutonomyRoute(request(routes));
  assert.equal(decision.result, 'AUTONOMY_ROUTE_BLOCKED');
  assert.equal(decision.selected_route_id, null);
  assert.deepEqual(decision.rejected_routes.map((item) => item.route_id),
    ['authority', 'capability', 'dev', 'model', 'provider', 'quality', 'safety', 'tier']);
  assert.ok(decision.rejected_routes.every((item) => item.reasons.length >= 1));
});

test('paid and native execution remain excluded without their exact authorization', () => {
  const routes = [route('paid', { paid_execution: true }), route('native', { native_execution: true })];
  const blocked = selectSafetyFirstAutonomyRoute(request(routes));
  assert.equal(blocked.result, 'AUTONOMY_ROUTE_BLOCKED');
  const paid = selectSafetyFirstAutonomyRoute(request(routes, {
    paid_execution_authorized: true,
    paid_execution_authority_evidence_checksum: hash('paid-authorization'),
    paid_execution_authority_verification_result: 'OWNER_AUTHORIZATION_VERIFIED',
  }));
  assert.equal(paid.selected_route_id, 'paid');
  const native = selectSafetyFirstAutonomyRoute(request(routes, {
    native_execution_authorized: true,
    native_execution_authority_evidence_checksum: hash('native-authorization'),
    native_execution_authority_verification_result: 'OWNER_AUTHORIZATION_VERIFIED',
  }));
  assert.equal(native.selected_route_id, 'native');
});

test('paid and native authorization claims require exact verified evidence', () => {
  assert.throws(() => selectSafetyFirstAutonomyRoute(request([route('paid', { paid_execution: true })], {
    paid_execution_authorized: true,
    paid_execution_authority_evidence_checksum: null,
    paid_execution_authority_verification_result: 'OWNER_AUTHORIZATION_VERIFIED',
  })), (error) => error.code === 'AUTONOMY_ROUTE_AUTHORIZATION_EVIDENCE_INVALID');
  assert.throws(() => selectSafetyFirstAutonomyRoute(request([route('native', { native_execution: true })], {
    native_execution_authorized: true,
    native_execution_authority_evidence_checksum: hash('native-authorization'),
    native_execution_authority_verification_result: 'CLAIMED_ONLY',
  })), (error) => error.code === 'AUTONOMY_ROUTE_AUTHORIZATION_EVIDENCE_INVALID');
});

test('cost ceiling is a hard filter before optimization', () => {
  const decision = selectSafetyFirstAutonomyRoute(request([
    route('over-budget', { estimated_cost_microusd: 1001 }),
    route('within-budget', { estimated_cost_microusd: 999 }),
  ]));
  assert.equal(decision.selected_route_id, 'within-budget');
  assert.deepEqual(decision.rejected_routes[0].reasons, ['COST_LIMIT_EXCEEDED']);
});

test('verified PASS context breaks only a quality-and-reliability tie', () => {
  const decision = selectSafetyFirstAutonomyRoute(request([
    route('cheap-large', { estimated_context_tokens: 2000, estimated_cost_microusd: 10 }),
    route('costly-small', { estimated_context_tokens: 500, estimated_cost_microusd: 20 }),
  ], { context_record: contextRecord('PASS') }));
  assert.equal(decision.selected_route_id, 'costly-small');
  assert.equal(decision.context_optimization_applied, true);
  assert.equal(decision.context_record_checksum, contextRecord('PASS').content_checksum);
});

test('context never beats higher quality or reliability', () => {
  const quality = selectSafetyFirstAutonomyRoute(request([
    route('high-quality-large', { quality_score: 0.99, estimated_context_tokens: 5000 }),
    route('low-quality-small', { quality_score: 0.98, estimated_context_tokens: 1 }),
  ], { context_record: contextRecord('PASS') }));
  const reliability = selectSafetyFirstAutonomyRoute(request([
    route('reliable-large', { reliability_score: 0.99, estimated_context_tokens: 5000 }),
    route('fragile-small', { reliability_score: 0.98, estimated_context_tokens: 1 }),
  ], { context_record: contextRecord('PASS') }));
  assert.equal(quality.selected_route_id, 'high-quality-large');
  assert.equal(reliability.selected_route_id, 'reliable-large');
  assert.equal(quality.context_optimization_applied, false);
  assert.equal(reliability.context_optimization_applied, false);
});

test('FAIL or UNKNOWN Context quality cannot influence the route', () => {
  for (const quality of ['FAIL', 'UNKNOWN']) {
    const decision = selectSafetyFirstAutonomyRoute(request([
      route('cheap-large', { estimated_context_tokens: 2000, estimated_cost_microusd: 10 }),
      route('costly-small', { estimated_context_tokens: 500, estimated_cost_microusd: 20 }),
    ], { context_record: contextRecord(quality) }));
    assert.equal(decision.selected_route_id, 'cheap-large');
    assert.equal(decision.context_optimization_applied, false);
  }
});

test('single eligible route does not falsely claim context optimization', () => {
  const decision = selectSafetyFirstAutonomyRoute(request([route('only')], {
    context_record: contextRecord('PASS'),
  }));
  assert.equal(decision.selected_route_id, 'only');
  assert.equal(decision.context_optimization_applied, false);
});

test('mismatched or tampered Context Evidence fails closed', () => {
  const mismatched = createContextCostRecord({
    ...structuredClone(contextRecord('PASS')),
    record_id: 'CCR-OTHER',
    task_id: 'TASK-OTHER',
  });
  assert.throws(
    () => selectSafetyFirstAutonomyRoute(request([route('a')], { context_record: mismatched })),
    (error) => error.code === 'AUTONOMY_ROUTING_CONTEXT_MISMATCH',
  );
  const tampered = structuredClone(contextRecord('PASS'));
  tampered.metrics.useful_tokens = 0;
  assert.throws(
    () => selectSafetyFirstAutonomyRoute(request([route('a')], { context_record: tampered })),
    (error) => error.code === 'CONTEXT_COST_RECORD_TAMPERED',
  );
});

test('invalid evidence hashes, duplicate routes and empty allowed tiers fail closed', () => {
  assert.throws(() => selectSafetyFirstAutonomyRoute(request([
    route('bad-hash', { authority_evidence_checksum: 'sha256:no' }),
  ])), (error) => error.code === 'AUTONOMY_ROUTE_INPUT_INVALID');
  assert.throws(() => selectSafetyFirstAutonomyRoute(request([
    route('bad-context-hash', { context_estimate_evidence_checksum: 'sha256:no' }),
  ])), (error) => error.code === 'AUTONOMY_ROUTE_INPUT_INVALID');
  assert.throws(() => selectSafetyFirstAutonomyRoute(request([route('same'), route('same')])),
    (error) => error.code === 'AUTONOMY_ROUTE_INPUT_INVALID');
  assert.throws(() => selectSafetyFirstAutonomyRoute(request([route('a')], { allowed_capability_tiers: [] })),
    (error) => error.code === 'AUTONOMY_ROUTE_INPUT_INVALID');
});

test('tampered or internally inconsistent decisions fail verification', () => {
  const decision = selectSafetyFirstAutonomyRoute(request([route('a')]));
  assert.throws(
    () => verifySafetyFirstAutonomyRouteDecision({ ...decision, selected_route_id: 'forged' }),
    (error) => error.code === 'AUTONOMY_ROUTE_DECISION_INVALID',
  );
  const inconsistent = structuredClone(decision);
  inconsistent.result = 'AUTONOMY_ROUTE_BLOCKED';
  inconsistent.content_checksum = checksumObject(inconsistent);
  assert.throws(
    () => verifySafetyFirstAutonomyRouteDecision(inconsistent),
    (error) => error.code === 'AUTONOMY_ROUTE_DECISION_INVALID',
  );
  assert.throws(
    () => verifySafetyFirstAutonomyRouteDecision(decision, request([
      route('a', { estimated_cost_microusd: 999 }),
    ])),
    (error) => error.code === 'AUTONOMY_ROUTE_DECISION_INPUT_MISMATCH',
  );
});
