import { DEFAULT_CALIBRATION_CATALOG } from './catalog.mjs';
import { CalibrationError } from './errors.mjs';
import { summarizeEvidence } from './analytics.mjs';
import { checksumObject, clamp, deepFreeze, getPath, newId, nowIso, quantile, round } from './util.mjs';
import { verifyCalibrationEvidence } from './evidence.mjs';

function strategyValue(values, strategy) {
  const map = { P10: 0.1, P25: 0.25, P50: 0.5, P75: 0.75, P90: 0.9, P95: 0.95, P99: 0.99 };
  if (strategy === 'MEAN') return values.reduce((a, b) => a + b, 0) / values.length;
  if (!(strategy in map)) throw new CalibrationError('CALIBRATION_STRATEGY_INVALID', strategy);
  return quantile(values, map[strategy]);
}
function applyRounding(value, mode) {
  if (mode === 'CEIL') return Math.ceil(value);
  if (mode === 'FLOOR') return Math.floor(value);
  if (mode === 'ROUND') return round(value);
  return value;
}

export function buildCalibrationReport(events = [], { current_policy = {}, catalog = DEFAULT_CALIBRATION_CATALOG, clock = () => new Date() } = {}) {
  for (const event of events) verifyCalibrationEvidence(event);
  const recommendations = [];
  const insufficient = [];
  for (const definition of catalog) {
    const matching = events.filter((event) => event.subsystem === definition.subsystem && event.metric === definition.metric);
    const summary = summarizeEvidence(matching, { min_samples: definition.min_samples, min_verified_samples: definition.min_verified_samples });
    if (!summary.sufficient_evidence) {
      insufficient.push({ policy_key: definition.policy_key, subsystem: definition.subsystem, metric: definition.metric, ...summary });
      continue;
    }
    const values = matching.map((event) => event.value);
    let proposed = strategyValue(values, definition.strategy) * (definition.multiplier ?? 1);
    proposed = applyRounding(proposed, definition.rounding);
    proposed = clamp(proposed, definition.min ?? -Infinity, definition.max ?? Infinity);
    proposed = round(proposed);
    const current = getPath(current_policy, definition.policy_key, definition.default_current);
    const verifiedRatio = summary.verified_sample_count / summary.sample_count;
    const confidence = round(Math.min(1, verifiedRatio * Math.min(1, summary.sample_count / Math.max(definition.min_samples * 2, 1)) + 0.25));
    recommendations.push({
      recommendation_id: newId('CR'), policy_key: definition.policy_key, subsystem: definition.subsystem, metric: definition.metric,
      current_value: current, proposed_value: proposed, effect: definition.effect, strategy: definition.strategy,
      confidence, evidence_summary: summary, evidence_ids: matching.map((event) => event.evidence_id).sort(),
      rationale: `${definition.strategy} evidence recommendation bounded to [${definition.min ?? '-inf'}, ${definition.max ?? 'inf'}]`,
    });
  }
  const report = {
    calibration_report_version: '1.0.0', report_id: newId('CALR'), generated_at: nowIso(clock),
    evidence_count: events.length, recommendations, insufficient_evidence: insufficient,
    safety_statement: 'RECOMMENDATION_ONLY_NO_AUTOMATIC_POLICY_WEAKENING',
  };
  report.content_checksum = checksumObject(report);
  return deepFreeze(report);
}

export function verifyCalibrationReport(report) {
  if (!report || report.calibration_report_version !== '1.0.0' || report.content_checksum !== checksumObject(report)) throw new CalibrationError('CALIBRATION_REPORT_TAMPERED');
  return true;
}
