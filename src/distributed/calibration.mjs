import { verifyCalibrationEvidence } from '../calibration/evidence.mjs';
import { verifyCalibrationReport } from '../calibration/recommendation.mjs';
import { verifyPolicyCandidate, evaluateAdjustmentSafety } from '../calibration/policy.mjs';
import { DISTRIBUTED_VERSION } from './constants.mjs';
import { DistributedError } from './errors.mjs';
import { checksumObject, deepFreeze, newId, nowIso, safeId } from './util.mjs';

export function createDistributedCalibrationEvidenceEnvelope(evidence, source = {}, { clock = () => new Date() } = {}) {
  verifyCalibrationEvidence(evidence);
  const env = {
    distributed_calibration_evidence_version: DISTRIBUTED_VERSION, distributed_evidence_id: safeId(source.distributed_evidence_id ?? newId('DCE'), 'distributed_evidence_id'),
    evidence_id: evidence.evidence_id, evidence_checksum: evidence.content_checksum, evidence_class: evidence.evidence_class, project_id: evidence.project_id, task_id: evidence.task_id,
    subsystem: evidence.subsystem, metric: evidence.metric, observed_at: evidence.observed_at, source_node_id: safeId(source.source_node_id ?? 'local-node', 'source_node_id'), worker_id: source.worker_id == null ? null : safeId(source.worker_id, 'worker_id'),
    cohort_id: safeId(source.cohort_id ?? 'default', 'cohort_id'), environment_fingerprint: source.environment_fingerprint ?? null, time_source: source.time_source ?? 'UTC_WALL_CLOCK', clock_skew_ms: Number(source.clock_skew_ms ?? 0), policy_version: source.policy_version == null ? null : String(source.policy_version),
    idempotency_key: safeId(source.idempotency_key ?? evidence.evidence_id, 'idempotency_key'), worker_attestation_ref: source.worker_attestation_ref ?? null, transported_at: nowIso(clock), evidence: structuredClone(evidence),
  };
  if (!Number.isFinite(env.clock_skew_ms)) throw new DistributedError('DISTRIBUTED_CLOCK_SKEW_INVALID');
  env.content_checksum = checksumObject(env); return deepFreeze(env);
}
export function verifyDistributedCalibrationEvidenceEnvelope(env) {
  if (!env || env.distributed_calibration_evidence_version !== DISTRIBUTED_VERSION || env.content_checksum !== checksumObject(env)) throw new DistributedError('DISTRIBUTED_CALIBRATION_EVIDENCE_TAMPERED');
  verifyCalibrationEvidence(env.evidence); if (env.evidence_id !== env.evidence.evidence_id || env.evidence_checksum !== env.evidence.content_checksum || env.evidence_class !== env.evidence.evidence_class) throw new DistributedError('DISTRIBUTED_CALIBRATION_EVIDENCE_BINDING_MISMATCH'); return true;
}
export function aggregateDistributedCalibrationEvidence(envelopes = [], { expected_cohorts = [] } = {}) {
  const dedup = new Map(); const collisions = [];
  for (const env of envelopes) { verifyDistributedCalibrationEvidenceEnvelope(env); const existing = dedup.get(env.idempotency_key); if (!existing) dedup.set(env.idempotency_key, env); else if (existing.evidence_checksum !== env.evidence_checksum) collisions.push(env.idempotency_key); }
  if (collisions.length) throw new DistributedError('DISTRIBUTED_CALIBRATION_IDEMPOTENCY_COLLISION', collisions.join(','));
  const unique = [...dedup.values()]; const cohorts = {};
  for (const env of unique) { const c = cohorts[env.cohort_id] ?? { cohort_id: env.cohort_id, sample_count: 0, verified_sample_count: 0, evidence_ids: [], max_abs_clock_skew_ms: 0 }; c.sample_count++; if (['REAL','SANDBOX'].includes(env.evidence_class)) c.verified_sample_count++; c.evidence_ids.push(env.evidence_id); c.max_abs_clock_skew_ms = Math.max(c.max_abs_clock_skew_ms, Math.abs(env.clock_skew_ms)); cohorts[env.cohort_id] = c; }
  const observed = Object.keys(cohorts).sort(); const missing = expected_cohorts.filter((x) => !observed.includes(x)).sort(); const totalExpected = expected_cohorts.length || observed.length || 1; const coverage = observed.length / totalExpected;
  return deepFreeze({ distributed_calibration_aggregate_version: DISTRIBUTED_VERSION, input_count: envelopes.length, unique_count: unique.length, duplicate_count: envelopes.length - unique.length, cohorts: Object.values(cohorts).sort((a,b)=>a.cohort_id.localeCompare(b.cohort_id)), observed_cohorts: observed, missing_cohorts: missing, coverage_ratio: Math.min(1, coverage), partition_uncertainty: missing.length > 0, evidence: unique.map((x) => x.evidence) });
}
export function createDistributedPolicyCandidateEnvelope(candidate, { report, policy_version = null, activation_epoch = 1, clock = () => new Date() } = {}) {
  verifyPolicyCandidate(candidate); if (report) verifyCalibrationReport(report);
  if (report && report.content_checksum !== candidate.source_report_checksum) throw new DistributedError('DISTRIBUTED_CANDIDATE_REPORT_BINDING_MISMATCH');
  const reportMap = new Map((report?.recommendations ?? []).map((r) => [r.policy_key, r]));
  const explainability = candidate.adjustments.map((a) => { const r = reportMap.get(a.policy_key); return { policy_key: a.policy_key, current_value: a.current_value, proposed_value: a.proposed_value, evidence_ids: [...a.evidence_ids], confidence: a.confidence, rationale: a.rationale, diagnostic_reason: r?.rationale ?? a.rationale, evidence_summary: r?.evidence_summary ?? null, safety: evaluateAdjustmentSafety(a) }; });
  const env = { distributed_policy_candidate_version: DISTRIBUTED_VERSION, envelope_id: newId('DPC'), created_at: nowIso(clock), candidate_id: candidate.candidate_id, candidate_checksum: candidate.content_checksum, source_report_checksum: candidate.source_report_checksum, policy_version: String(policy_version ?? candidate.base_policy_version), activation_epoch, safety_decision: candidate.safety_decision, explainability, candidate: structuredClone(candidate) };
  env.content_checksum = checksumObject(env); return deepFreeze(env);
}
export function decomposeDistributedConfidence({ evidence_sufficiency = 0, freshness = 0, coverage = 0, evaluation = 0 } = {}) { const parts = { evidence_sufficiency, freshness, coverage, evaluation }; for (const [k,v] of Object.entries(parts)) if (!Number.isFinite(v) || v < 0 || v > 1) throw new DistributedError('DISTRIBUTED_CONFIDENCE_INVALID', k); const composite = (evidence_sufficiency + freshness + coverage + evaluation) / 4; return deepFreeze({ ...parts, composite }); }
