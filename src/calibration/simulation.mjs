import { EVALUATION_MODES } from './constants.mjs';
import { CalibrationError } from './errors.mjs';
import { checksumObject, deepFreeze, newId, nowIso, requireEnum, round } from './util.mjs';
import { verifyPolicyCandidate } from './policy.mjs';

function normalizeOutcome(value = {}) {
  const out = { cost: Number(value.cost ?? 0), quality: Number(value.quality ?? 0), risk: Number(value.risk ?? 0), mandatory_violation: value.mandatory_violation === true };
  if (![out.cost, out.quality, out.risk].every(Number.isFinite)) throw new CalibrationError('CALIBRATION_EVALUATION_OUTCOME_INVALID');
  return out;
}

export async function evaluatePolicyCandidateCases({ candidate, mode, cases = [], evaluator, min_cases = 3, max_regressions = 0, clock = () => new Date() } = {}) {
  verifyPolicyCandidate(candidate);
  mode = requireEnum(mode, EVALUATION_MODES, 'mode');
  if (typeof evaluator !== 'function') throw new CalibrationError('CALIBRATION_EVALUATOR_REQUIRED');
  const details = [];
  let costDelta = 0, qualityDelta = 0, riskDelta = 0, regressions = 0, improvements = 0, mandatoryViolations = 0;
  for (const sample of cases) {
    const raw = await evaluator(sample, candidate, { mode });
    const baseline = normalizeOutcome(raw?.baseline);
    const proposed = normalizeOutcome(raw?.proposed);
    const delta = { cost: proposed.cost - baseline.cost, quality: proposed.quality - baseline.quality, risk: proposed.risk - baseline.risk };
    const regression = delta.quality < 0 || delta.risk > 0 || proposed.mandatory_violation;
    const improvement = delta.quality > 0 || delta.cost < 0 || delta.risk < 0;
    if (regression) regressions++;
    if (improvement && !regression) improvements++;
    if (proposed.mandatory_violation) mandatoryViolations++;
    costDelta += delta.cost; qualityDelta += delta.quality; riskDelta += delta.risk;
    details.push({ case_id: sample.case_id ?? `case-${details.length + 1}`, baseline, proposed, delta, regression, improvement });
  }
  let result = 'PASS';
  if (cases.length < min_cases) result = 'INSUFFICIENT';
  else if (candidate.safety_decision !== 'ALLOW' || mandatoryViolations > 0 || regressions > max_regressions || riskDelta > 0) result = 'FAIL';
  const evaluation = {
    calibration_evaluation_version: '1.0.0', evaluation_id: newId(mode === 'SHADOW' ? 'SHDW' : 'CFR'), candidate_id: candidate.candidate_id,
    candidate_checksum: candidate.content_checksum, mode, evaluated_at: nowIso(clock), result, case_count: cases.length,
    regression_count: regressions, improvement_count: improvements, mandatory_violation_count: mandatoryViolations,
    cost_delta: round(costDelta), quality_delta: round(qualityDelta), risk_delta: round(riskDelta), details,
  };
  evaluation.content_checksum = checksumObject(evaluation);
  return deepFreeze(evaluation);
}

export function verifyCalibrationEvaluation(evaluation, candidate = null) {
  if (!evaluation || evaluation.calibration_evaluation_version !== '1.0.0' || evaluation.content_checksum !== checksumObject(evaluation)) throw new CalibrationError('CALIBRATION_EVALUATION_TAMPERED');
  if (candidate) {
    verifyPolicyCandidate(candidate);
    if (evaluation.candidate_id !== candidate.candidate_id || evaluation.candidate_checksum !== candidate.content_checksum) throw new CalibrationError('CALIBRATION_EVALUATION_BINDING_INVALID');
  }
  return true;
}
