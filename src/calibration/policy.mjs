import { ABSOLUTELY_IMMUTABLE_POLICY_KEYS, ADJUSTMENT_EFFECTS, DEVELOPMENT_PROFILE_MINIMUM_RANKS, IMMUTABLE_POLICY_PREFIXES } from './constants.mjs';
import { CalibrationError } from './errors.mjs';
import { checksumObject, deepFreeze, newId, nowIso, requireEnum, requireString } from './util.mjs';
import { verifyCalibrationReport } from './recommendation.mjs';

function profileRank(value) {
  if (Number.isInteger(value)) return value;
  const match = String(value).match(/^DEV_(\d)_/);
  return match ? Number(match[1]) : null;
}
function immutableMatch(key) { return IMMUTABLE_POLICY_PREFIXES.some((prefix) => key.startsWith(prefix)); }

export function evaluateAdjustmentSafety(adjustment) {
  const reasons = [];
  const effect = requireEnum(adjustment.effect ?? 'ADVISORY', ADJUSTMENT_EFFECTS, 'effect');
  const key = requireString(adjustment.policy_key, 'policy_key');
  if (ABSOLUTELY_IMMUTABLE_POLICY_KEYS.includes(key)) reasons.push('ABSOLUTELY_IMMUTABLE_POLICY_KEY');
  if (immutableMatch(key) && effect === 'WEAKEN') reasons.push('IMMUTABLE_SAFETY_FLOOR_WEAKENING');
  if (adjustment.mandatory_floor === true && effect === 'WEAKEN') reasons.push('DECLARED_MANDATORY_FLOOR_WEAKENING');
  const minRank = DEVELOPMENT_PROFILE_MINIMUM_RANKS[key];
  if (minRank != null) {
    const proposedRank = profileRank(adjustment.proposed_value);
    if (proposedRank == null || proposedRank < minRank) reasons.push('DEVELOPMENT_PROFILE_SAFETY_FLOOR');
  }
  if (key === 'integration.external_authorization.required' && adjustment.proposed_value !== true) reasons.push('EXTERNAL_AUTHORIZATION_REQUIRED');
  if (key === 'extension.core_authority.override_allowed' && adjustment.proposed_value !== false) reasons.push('EXTENSION_CORE_OVERRIDE_FORBIDDEN');
  if (key === 'extension.capability_broker_required.enabled' && adjustment.proposed_value !== true) reasons.push('CAPABILITY_BROKER_BYPASS_FORBIDDEN');
  return deepFreeze({ decision: reasons.length ? 'BLOCK' : 'ALLOW', reasons: Object.freeze(reasons), policy_key: key });
}

export function createPolicyCandidate({ report, base_policy_version = '1', selected_policy_keys = null, clock = () => new Date() } = {}) {
  verifyCalibrationReport(report);
  const selected = selected_policy_keys ? new Set(selected_policy_keys) : null;
  const adjustments = report.recommendations.filter((r) => !selected || selected.has(r.policy_key)).map((r) => ({
    policy_key: r.policy_key, current_value: r.current_value, proposed_value: r.proposed_value, effect: r.effect,
    confidence: r.confidence, evidence_ids: [...r.evidence_ids], rationale: r.rationale,
  }));
  if (!adjustments.length) throw new CalibrationError('CALIBRATION_CANDIDATE_EMPTY');
  const safety = adjustments.map(evaluateAdjustmentSafety);
  const candidate = {
    policy_candidate_version: '1.0.0', candidate_id: newId('PC'), created_at: nowIso(clock), base_policy_version: String(base_policy_version),
    source_report_checksum: report.content_checksum, adjustments, safety,
    safety_decision: safety.some((x) => x.decision === 'BLOCK') ? 'BLOCK' : 'ALLOW',
    evaluation_requirements: ['COUNTERFACTUAL', 'SHADOW'], authority_effect: 'NONE_UNTIL_AUTHORIZED_ACTIVATION',
  };
  candidate.content_checksum = checksumObject(candidate);
  return deepFreeze(candidate);
}

export function verifyPolicyCandidate(candidate) {
  if (!candidate || candidate.policy_candidate_version !== '1.0.0' || candidate.content_checksum !== checksumObject(candidate)) throw new CalibrationError('CALIBRATION_CANDIDATE_TAMPERED');
  const safety = candidate.adjustments.map(evaluateAdjustmentSafety);
  if (safety.some((x) => x.decision === 'BLOCK') !== (candidate.safety_decision === 'BLOCK')) throw new CalibrationError('CALIBRATION_CANDIDATE_SAFETY_MISMATCH');
  return true;
}
