import { validateContextCostRecord } from '../context-control/context-cost-observatory.mjs';
import { checksumObject, deepFreeze, requireArray, requireString } from './util.mjs';

const SHA = /^sha256:[a-f0-9]{64}$/;
const TIERS = new Set(['ECONOMY', 'STANDARD', 'DEEP_REASONING', 'NATIVE_TOOLING_REQUIRED']);
const PROVIDER = new Set(['AVAILABLE', 'UNAVAILABLE', 'UNKNOWN']);
const DECISION_KEYS = Object.freeze([
  'authority_created', 'content_checksum', 'context_optimization_applied',
  'context_record_checksum', 'eligible_route_ids', 'rejected_routes', 'result',
  'route_decision_version', 'routing_input_checksum', 'selected_route_id', 'task_id',
]);

export class SafetyFirstRoutingError extends Error {
  constructor(code, message = code) { super(message); this.name = 'SafetyFirstRoutingError'; this.code = code; }
}

const text = (value, name) => requireString(value, name, SafetyFirstRoutingError, 'AUTONOMY_ROUTE_INPUT_INVALID');
const strings = (value, name) => requireArray(value, name, SafetyFirstRoutingError, 'AUTONOMY_ROUTE_INPUT_INVALID').map((item) => text(item, name));
const bool = (value, name) => { if (typeof value !== 'boolean') throw new SafetyFirstRoutingError('AUTONOMY_ROUTE_INPUT_INVALID', `${name} invalid`); return value; };
const integer = (value, name) => { if (!Number.isSafeInteger(value) || value < 0) throw new SafetyFirstRoutingError('AUTONOMY_ROUTE_INPUT_INVALID', `${name} invalid`); return value; };
const score = (value, name) => { if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) throw new SafetyFirstRoutingError('AUTONOMY_ROUTE_INPUT_INVALID', `${name} invalid`); return value; };

const normalizeRoute = (route) => {
  const tier = text(route?.capability_tier, 'capability_tier');
  const providerStatus = text(route?.provider_status, 'provider_status');
  if (!TIERS.has(tier) || !PROVIDER.has(providerStatus)) throw new SafetyFirstRoutingError('AUTONOMY_ROUTE_INPUT_INVALID');
  const authorityEvidence = text(route.authority_evidence_checksum, 'authority_evidence_checksum');
  const safetyEvidence = text(route.safety_evidence_checksum, 'safety_evidence_checksum');
  if (!SHA.test(authorityEvidence) || !SHA.test(safetyEvidence)) throw new SafetyFirstRoutingError('AUTONOMY_ROUTE_INPUT_INVALID');
  return deepFreeze({
    route_id: text(route.route_id, 'route_id'), capability_tier: tier,
    authorized: bool(route.authorized, 'authorized'), authority_evidence_checksum: authorityEvidence,
    authority_verification_result: text(route.authority_verification_result, 'authority_verification_result'),
    safety_floor_passed: bool(route.safety_floor_passed, 'safety_floor_passed'),
    safety_floor_id: text(route.safety_floor_id, 'safety_floor_id'), safety_evidence_checksum: safetyEvidence,
    model_control_passed: bool(route.model_control_passed, 'model_control_passed'),
    model_route_ref: text(route.model_route_ref, 'model_route_ref'),
    dev_profiles: strings(route.dev_profiles, 'dev_profile'), capabilities: strings(route.capabilities, 'capability'),
    quality_status: text(route.quality_status, 'quality_status'), quality_score: score(route.quality_score, 'quality_score'),
    reliability_score: score(route.reliability_score, 'reliability_score'), provider_status: providerStatus,
    paid_execution: bool(route.paid_execution, 'paid_execution'), native_execution: bool(route.native_execution, 'native_execution'),
    context_estimate_evidence_checksum: text(route.context_estimate_evidence_checksum, 'context_estimate_evidence_checksum'),
    estimated_context_tokens: integer(route.estimated_context_tokens, 'estimated_context_tokens'),
    estimated_cost_microusd: integer(route.estimated_cost_microusd, 'estimated_cost_microusd'),
  });
};

export function selectSafetyFirstAutonomyRoute(input = {}) {
  const taskId = text(input.task_id, 'task_id');
  const requiredProfile = text(input.required_dev_profile, 'required_dev_profile');
  const requiredFloor = text(input.required_safety_floor_id, 'required_safety_floor_id');
  const allowedTiers = new Set(strings(input.allowed_capability_tiers, 'allowed_capability_tier'));
  if (allowedTiers.size === 0 || [...allowedTiers].some((tier) => !TIERS.has(tier))) throw new SafetyFirstRoutingError('AUTONOMY_ROUTE_INPUT_INVALID');
  const requiredCapabilities = strings(input.required_capabilities ?? [], 'required_capability');
  const maxCost = input.max_cost_microusd == null ? null : integer(input.max_cost_microusd, 'max_cost_microusd');
  const paidAuthorized = bool(input.paid_execution_authorized, 'paid_execution_authorized');
  const nativeAuthorized = bool(input.native_execution_authorized, 'native_execution_authorized');
  const paidAuthorizationChecksum = input.paid_execution_authority_evidence_checksum;
  const nativeAuthorizationChecksum = input.native_execution_authority_evidence_checksum;
  const paidAuthorizationResult = text(input.paid_execution_authority_verification_result, 'paid_execution_authority_verification_result');
  const nativeAuthorizationResult = text(input.native_execution_authority_verification_result, 'native_execution_authority_verification_result');
  const exactAuthorizationValid = (authorized, checksum, result) => authorized
    ? SHA.test(checksum ?? '') && result === 'OWNER_AUTHORIZATION_VERIFIED'
    : checksum === null && result === 'NOT_AUTHORIZED';
  if (!exactAuthorizationValid(paidAuthorized, paidAuthorizationChecksum, paidAuthorizationResult)
    || !exactAuthorizationValid(nativeAuthorized, nativeAuthorizationChecksum, nativeAuthorizationResult)) {
    throw new SafetyFirstRoutingError('AUTONOMY_ROUTE_AUTHORIZATION_EVIDENCE_INVALID');
  }
  const routes = requireArray(input.routes, 'routes', SafetyFirstRoutingError, 'AUTONOMY_ROUTE_INPUT_INVALID').map(normalizeRoute);
  if (routes.some((route) => !SHA.test(route.context_estimate_evidence_checksum))) {
    throw new SafetyFirstRoutingError('AUTONOMY_ROUTE_INPUT_INVALID', 'context estimate evidence invalid');
  }
  if (new Set(routes.map((route) => route.route_id)).size !== routes.length) throw new SafetyFirstRoutingError('AUTONOMY_ROUTE_INPUT_INVALID', 'duplicate route_id');

  let contextChecksum = null;
  let contextOptimization = false;
  if (input.context_record != null) {
    validateContextCostRecord(input.context_record);
    if (input.context_record.task_id !== taskId) throw new SafetyFirstRoutingError('AUTONOMY_ROUTING_CONTEXT_MISMATCH');
    contextChecksum = input.context_record.content_checksum;
    contextOptimization = input.context_record.quality_gate.status === 'PASS';
  }

  const rejected = [];
  const eligible = [];
  for (const route of routes) {
    const reasons = [];
    if (!route.authorized || !['OWNER_AUTHORIZATION_VERIFIED', 'NOT_REQUIRED_VERIFIED'].includes(route.authority_verification_result)) reasons.push('AUTHORITY_NOT_VERIFIED');
    if (!route.safety_floor_passed || route.safety_floor_id !== requiredFloor) reasons.push('SAFETY_FLOOR_NOT_MET');
    if (!allowedTiers.has(route.capability_tier)) reasons.push('CAPABILITY_TIER_NOT_ALLOWED');
    if (!route.model_control_passed) reasons.push('MODEL_CONTROL_NOT_PASSED');
    if (!route.dev_profiles.includes(requiredProfile)) reasons.push('DEV_PROFILE_NOT_SUPPORTED');
    if (requiredCapabilities.some((capability) => !route.capabilities.includes(capability))) reasons.push('CAPABILITY_NOT_SUPPORTED');
    if (route.quality_status !== 'PASS') reasons.push('QUALITY_NOT_PASSED');
    if (route.provider_status !== 'AVAILABLE') reasons.push('PROVIDER_NOT_AVAILABLE');
    if (route.paid_execution && !paidAuthorized) reasons.push('PAID_EXECUTION_NOT_AUTHORIZED');
    if (route.native_execution && !nativeAuthorized) reasons.push('NATIVE_EXECUTION_NOT_AUTHORIZED');
    if (maxCost != null && route.estimated_cost_microusd > maxCost) reasons.push('COST_LIMIT_EXCEEDED');
    if (reasons.length) rejected.push({ route_id: route.route_id, reasons }); else eligible.push(route);
  }
  rejected.sort((left, right) => left.route_id.localeCompare(right.route_id));
  eligible.sort((left, right) => right.quality_score - left.quality_score
    || right.reliability_score - left.reliability_score
    || (contextOptimization ? left.estimated_context_tokens - right.estimated_context_tokens : 0)
    || left.estimated_cost_microusd - right.estimated_cost_microusd
    || left.route_id.localeCompare(right.route_id));
  const contextOptimizationApplied = contextOptimization && eligible.some((left, index) => eligible
    .slice(index + 1)
    .some((right) => left.quality_score === right.quality_score
      && left.reliability_score === right.reliability_score
      && left.estimated_context_tokens !== right.estimated_context_tokens));
  const decision = {
    route_decision_version: '1.0.0', result: eligible.length ? 'AUTONOMY_ROUTE_READY' : 'AUTONOMY_ROUTE_BLOCKED',
    task_id: taskId, selected_route_id: eligible[0]?.route_id ?? null,
    eligible_route_ids: eligible.map((route) => route.route_id), rejected_routes: rejected,
    context_optimization_applied: contextOptimizationApplied, context_record_checksum: contextChecksum,
    routing_input_checksum: checksumObject({
      task_id: taskId,
      required_dev_profile: requiredProfile,
      required_safety_floor_id: requiredFloor,
      allowed_capability_tiers: [...allowedTiers].sort(),
      required_capabilities: [...requiredCapabilities].sort(),
      max_cost_microusd: maxCost,
      paid_execution_authorized: paidAuthorized,
      paid_execution_authority_evidence_checksum: paidAuthorizationChecksum,
      paid_execution_authority_verification_result: paidAuthorizationResult,
      native_execution_authorized: nativeAuthorized,
      native_execution_authority_evidence_checksum: nativeAuthorizationChecksum,
      native_execution_authority_verification_result: nativeAuthorizationResult,
      routes: [...routes].sort((left, right) => left.route_id.localeCompare(right.route_id)),
      context_record_checksum: contextChecksum,
    }),
    authority_created: false,
  };
  decision.content_checksum = checksumObject(decision);
  return deepFreeze(decision);
}

export function verifySafetyFirstAutonomyRouteDecision(decision, input = null) {
  if (!decision || typeof decision !== 'object' || Array.isArray(decision)
    || Object.keys(decision).sort().join('\0') !== [...DECISION_KEYS].sort().join('\0')
    || decision.route_decision_version !== '1.0.0'
    || !['AUTONOMY_ROUTE_READY', 'AUTONOMY_ROUTE_BLOCKED'].includes(decision.result)
    || typeof decision.task_id !== 'string' || !decision.task_id.trim()
    || typeof decision.authority_created !== 'boolean' || decision.authority_created !== false
    || typeof decision.context_optimization_applied !== 'boolean'
    || !SHA.test(decision.routing_input_checksum ?? '')
    || !SHA.test(decision.content_checksum ?? '')
    || decision.content_checksum !== checksumObject(decision)
    || !Array.isArray(decision.eligible_route_ids)
    || !Array.isArray(decision.rejected_routes)) {
    throw new SafetyFirstRoutingError('AUTONOMY_ROUTE_DECISION_INVALID');
  }
  if (decision.context_record_checksum !== null && !SHA.test(decision.context_record_checksum)) {
    throw new SafetyFirstRoutingError('AUTONOMY_ROUTE_DECISION_INVALID');
  }
  if (decision.context_optimization_applied && decision.context_record_checksum === null) {
    throw new SafetyFirstRoutingError('AUTONOMY_ROUTE_DECISION_INVALID');
  }
  const eligible = decision.eligible_route_ids;
  if (eligible.some((routeId) => typeof routeId !== 'string' || !routeId.trim())
    || new Set(eligible).size !== eligible.length) {
    throw new SafetyFirstRoutingError('AUTONOMY_ROUTE_DECISION_INVALID');
  }
  const rejectedIds = [];
  for (const rejected of decision.rejected_routes) {
    if (!rejected || typeof rejected !== 'object' || Array.isArray(rejected)
      || Object.keys(rejected).sort().join('\0') !== 'reasons\0route_id'
      || typeof rejected.route_id !== 'string' || !rejected.route_id.trim()
      || !Array.isArray(rejected.reasons) || rejected.reasons.length === 0
      || rejected.reasons.some((reason) => typeof reason !== 'string' || !reason.trim())
      || new Set(rejected.reasons).size !== rejected.reasons.length) {
      throw new SafetyFirstRoutingError('AUTONOMY_ROUTE_DECISION_INVALID');
    }
    rejectedIds.push(rejected.route_id);
  }
  if (new Set(rejectedIds).size !== rejectedIds.length
    || rejectedIds.some((routeId) => eligible.includes(routeId))) {
    throw new SafetyFirstRoutingError('AUTONOMY_ROUTE_DECISION_INVALID');
  }
  const ready = decision.result === 'AUTONOMY_ROUTE_READY';
  if ((ready && (eligible.length === 0 || decision.selected_route_id !== eligible[0]))
    || (!ready && (eligible.length !== 0 || decision.selected_route_id !== null))) {
    throw new SafetyFirstRoutingError('AUTONOMY_ROUTE_DECISION_INVALID');
  }
  if (input != null && selectSafetyFirstAutonomyRoute(input).content_checksum !== decision.content_checksum) {
    throw new SafetyFirstRoutingError('AUTONOMY_ROUTE_DECISION_INPUT_MISMATCH');
  }
  return deepFreeze({
    result: 'AUTONOMY_ROUTE_DECISION_VALID',
    task_id: decision.task_id,
    selected_route_id: decision.selected_route_id,
    content_checksum: decision.content_checksum,
  });
}
