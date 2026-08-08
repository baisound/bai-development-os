import { CalibrationError } from './errors.mjs';
import { deepFreeze, round } from './util.mjs';

const profileRank = (value) => { const match = String(value).match(/^DEV_(\d)_/); return match ? Number(match[1]) : null; };
export function compareDevelopmentProfiles(runs = []) {
  const groups = new Map();
  for (const run of runs) {
    const rank = profileRank(run.profile_id); if (rank == null) throw new CalibrationError('CALIBRATION_PROFILE_ID_INVALID');
    if (!groups.has(run.profile_id)) groups.set(run.profile_id, []); groups.get(run.profile_id).push(run);
  }
  const profiles = [];
  for (const [profile_id, rows] of [...groups.entries()].sort()) {
    const avg = (key) => round(rows.reduce((sum, row) => sum + Number(row[key] ?? 0), 0) / rows.length);
    profiles.push({ profile_id, sample_count: rows.length, avg_token_cost: avg('token_cost'), avg_lead_time_ms: avg('lead_time_ms'), defect_escape_rate: avg('defect_escape'), avg_critic_findings: avg('critic_findings'), avg_test_failures: avg('test_failures'), owner_override_rate: avg('owner_override') });
  }
  return deepFreeze({ result: profiles.length ? 'PROFILE_COMPARISON_READY' : 'INSUFFICIENT_EVIDENCE', profiles });
}
export function detectGovernanceImbalance(runs = []) {
  const findings = [];
  for (const run of runs) {
    const rank = profileRank(run.profile_id); if (rank == null) continue;
    const lowRisk = ['AUXILIARY','STANDARD'].includes(run.criticality) && ['LOW','MODERATE'].includes(run.failure_impact) && run.reversible !== false;
    if (lowRisk && rank >= 3 && Number(run.critic_findings ?? 0) === 0 && Number(run.test_failures ?? 0) === 0 && Number(run.defect_escape ?? 0) === 0) findings.push({ run_id: run.run_id ?? null, finding: 'POSSIBLE_OVER_GOVERNANCE', severity: 'ADVISORY' });
    const critical = run.criticality === 'FOUNDATION' || run.failure_impact === 'CRITICAL';
    if (critical && rank < 4) findings.push({ run_id: run.run_id ?? null, finding: 'UNDER_ASSURANCE_SAFETY_FLOOR', severity: 'BLOCKING' });
    else if ((run.criticality === 'CORE' || run.system_scale === 'MULTI_PROJECT') && rank < 3) findings.push({ run_id: run.run_id ?? null, finding: 'UNDER_ASSURANCE_SAFETY_FLOOR', severity: 'BLOCKING' });
  }
  return deepFreeze({ result: 'GOVERNANCE_IMBALANCE_ANALYZED', findings, blocking_count: findings.filter((x) => x.severity === 'BLOCKING').length });
}
export function detectPolicyOscillation(history = [], { policy_key, window = 6 } = {}) {
  const values = history.filter((x) => !policy_key || x.policy_key === policy_key).slice(-window).map((x) => x.value);
  let alternating = false;
  if (values.length >= 4) {
    const a = values.at(-4), b = values.at(-3), c = values.at(-2), d = values.at(-1);
    alternating = a === c && b === d && a !== b;
  }
  return deepFreeze({ result: alternating ? 'POLICY_OSCILLATION_DETECTED' : 'NO_POLICY_OSCILLATION', policy_key: policy_key ?? null, values });
}
export function rankCalibrationOpportunities(items = []) {
  const ranked = items.map((item, index) => {
    const riskReduction = Number(item.risk_reduction ?? 0), cost = Number(item.cost ?? 0), time = Number(item.time ?? 0);
    if (![riskReduction, cost, time].every(Number.isFinite) || riskReduction < 0 || cost < 0 || time < 0) throw new CalibrationError('CALIBRATION_PRIORITY_INPUT_INVALID');
    return { ...structuredClone(item), priority_score: round(riskReduction / Math.max(1, cost + time)), _index: index };
  }).sort((a,b)=>b.priority_score-a.priority_score||a._index-b._index).map(({_index,...x})=>x);
  return deepFreeze(ranked);
}
