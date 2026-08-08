import { VERIFIED_EVIDENCE_CLASSES } from './constants.mjs';
import { CalibrationError } from './errors.mjs';
import { deepFreeze, quantile, round } from './util.mjs';
import { verifyCalibrationEvidence } from './evidence.mjs';

export function summarizeEvidence(events = [], { min_samples = 5, min_verified_samples = 3 } = {}) {
  if (!Array.isArray(events)) throw new CalibrationError('CALIBRATION_EVIDENCE_LIST_INVALID');
  for (const event of events) verifyCalibrationEvidence(event);
  const values = events.map((event) => event.value);
  const verified = events.filter((event) => VERIFIED_EVIDENCE_CLASSES.includes(event.evidence_class));
  const weightSum = events.reduce((sum, event) => sum + event.evidence_weight, 0);
  const weightedMean = weightSum ? events.reduce((sum, event) => sum + event.value * event.evidence_weight, 0) / weightSum : null;
  const sufficient = events.length >= min_samples && verified.length >= min_verified_samples;
  return deepFreeze({
    sample_count: events.length,
    verified_sample_count: verified.length,
    simulated_or_declared_count: events.length - verified.length,
    sufficient_evidence: sufficient,
    insufficiency_reasons: Object.freeze([
      ...(events.length < min_samples ? [`TOTAL_SAMPLES_BELOW_${min_samples}`] : []),
      ...(verified.length < min_verified_samples ? [`VERIFIED_SAMPLES_BELOW_${min_verified_samples}`] : []),
    ]),
    weighted_mean: weightedMean == null ? null : round(weightedMean),
    min: values.length ? Math.min(...values) : null,
    max: values.length ? Math.max(...values) : null,
    p10: values.length ? round(quantile(values, 0.1)) : null,
    p25: values.length ? round(quantile(values, 0.25)) : null,
    median: values.length ? round(quantile(values, 0.5)) : null,
    p75: values.length ? round(quantile(values, 0.75)) : null,
    p90: values.length ? round(quantile(values, 0.9)) : null,
    p95: values.length ? round(quantile(values, 0.95)) : null,
    p99: values.length ? round(quantile(values, 0.99)) : null,
  });
}

export function groupEvidence(events = []) {
  const groups = new Map();
  for (const event of events) {
    verifyCalibrationEvidence(event);
    const key = `${event.subsystem}:${event.metric}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(event);
  }
  return groups;
}

export function detectRobustAnomalies(events = [], { z_threshold = 3.5 } = {}) {
  if (events.length < 5) return deepFreeze({ status: 'INSUFFICIENT_EVIDENCE', anomalies: Object.freeze([]), sample_count: events.length });
  for (const event of events) verifyCalibrationEvidence(event);
  const median = quantile(events.map((event) => event.value), 0.5);
  const deviations = events.map((event) => Math.abs(event.value - median));
  const mad = quantile(deviations, 0.5);
  if (!mad) return deepFreeze({ status: 'STABLE_ZERO_MAD', anomalies: Object.freeze([]), sample_count: events.length, median, mad: 0 });
  const anomalies = events.map((event) => ({ event, robust_z: 0.6745 * (event.value - median) / mad })).filter((x) => Math.abs(x.robust_z) >= z_threshold).map((x) => deepFreeze({ evidence_id: x.event.evidence_id, value: x.event.value, robust_z: round(x.robust_z) }));
  return deepFreeze({ status: 'EVALUATED', sample_count: events.length, median: round(median), mad: round(mad), anomalies: Object.freeze(anomalies) });
}

export function evaluateSli(events = [], { objective, direction = 'AT_LEAST' } = {}) {
  if (typeof objective !== 'number' || !Number.isFinite(objective)) throw new CalibrationError('CALIBRATION_SLO_OBJECTIVE_INVALID');
  const summary = summarizeEvidence(events, { min_samples: 1, min_verified_samples: 1 });
  if (!summary.sample_count) return deepFreeze({ status: 'INSUFFICIENT_EVIDENCE', objective, direction, observed: null, met: null });
  const observed = summary.weighted_mean;
  const met = direction === 'AT_MOST' ? observed <= objective : observed >= objective;
  return deepFreeze({ status: 'EVALUATED', objective, direction, observed, met });
}
