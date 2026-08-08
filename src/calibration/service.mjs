import { buildCalibrationReport } from './recommendation.mjs';
import { createPolicyCandidate, verifyPolicyCandidate } from './policy.mjs';
import { createCalibrationEvidence, evidenceFromMonitoringEvent } from './evidence.mjs';
import { evaluatePolicyCandidateCases, verifyCalibrationEvaluation } from './simulation.mjs';
import { appendCalibrationRecord, buildCalibrationSnapshot, readCalibrationLedger, verifyCalibrationLedger } from './store.mjs';
import { CalibrationError } from './errors.mjs';
import { checksumObject, deepFreeze, newId, nowIso, requireString } from './util.mjs';

export class CalibrationService {
  constructor({ root = null, current_policy = {}, catalog, clock = () => new Date(), policy_applier = null } = {}) {
    this.root = root; this.current_policy = current_policy; this.catalog = catalog; this.clock = clock; this.policy_applier = policy_applier;
    this.memoryEvidence = [];
  }
  async recordEvidence(input) {
    const evidence = createCalibrationEvidence(input, { clock: this.clock });
    this.memoryEvidence.push(evidence);
    if (this.root) await appendCalibrationRecord(this.root, 'EVIDENCE', evidence);
    return evidence;
  }
  async recordMonitoringEvent(event, options = {}) {
    const evidence = evidenceFromMonitoringEvent(event, { ...options, clock: this.clock });
    this.memoryEvidence.push(evidence);
    if (this.root) await appendCalibrationRecord(this.root, 'EVIDENCE', evidence);
    return evidence;
  }
  async evidence() {
    if (!this.root) return deepFreeze([...this.memoryEvidence]);
    const records = await readCalibrationLedger(this.root);
    return deepFreeze(records.filter((r) => r.type === 'EVIDENCE').map((r) => r.payload));
  }
  async analyze({ current_policy = this.current_policy } = {}) {
    return buildCalibrationReport(await this.evidence(), { current_policy, catalog: this.catalog, clock: this.clock });
  }
  async propose({ report = null, base_policy_version = '1', selected_policy_keys = null } = {}) {
    const actualReport = report ?? await this.analyze();
    const candidate = createPolicyCandidate({ report: actualReport, base_policy_version, selected_policy_keys, clock: this.clock });
    if (this.root) await appendCalibrationRecord(this.root, 'POLICY_CANDIDATE', candidate);
    return candidate;
  }
  async evaluate(candidate, { counterfactual_cases = [], shadow_cases = [], evaluator, min_cases = 3 } = {}) {
    const counterfactual = await evaluatePolicyCandidateCases({ candidate, mode: 'COUNTERFACTUAL', cases: counterfactual_cases, evaluator, min_cases, clock: this.clock });
    const shadow = await evaluatePolicyCandidateCases({ candidate, mode: 'SHADOW', cases: shadow_cases, evaluator, min_cases, clock: this.clock });
    if (this.root) { await appendCalibrationRecord(this.root, 'POLICY_EVALUATION', counterfactual); await appendCalibrationRecord(this.root, 'POLICY_EVALUATION', shadow); }
    return deepFreeze({ counterfactual, shadow });
  }
  async activate(candidate, { evaluations, owner_authorization_ref, policy_authorization_ref, apply = true } = {}) {
    verifyPolicyCandidate(candidate);
    if (candidate.safety_decision !== 'ALLOW') throw new CalibrationError('CALIBRATION_SAFETY_BLOCK');
    const owner = requireString(owner_authorization_ref, 'owner_authorization_ref');
    const policy = requireString(policy_authorization_ref, 'policy_authorization_ref');
    const provided = Array.isArray(evaluations) ? evaluations : Object.values(evaluations ?? {});
    const byMode = new Map();
    for (const evaluation of provided) { verifyCalibrationEvaluation(evaluation, candidate); byMode.set(evaluation.mode, evaluation); }
    for (const required of candidate.evaluation_requirements) if (byMode.get(required)?.result !== 'PASS') throw new CalibrationError('CALIBRATION_EVALUATION_GATE_NOT_PASSED', required);
    const activation = {
      calibration_activation_version: '1.0.0', activation_id: newId('PACT'), activated_at: nowIso(this.clock),
      candidate_id: candidate.candidate_id, candidate_checksum: candidate.content_checksum,
      owner_authorization_ref: owner, policy_authorization_ref: policy,
      adjustments: candidate.adjustments.map((x) => ({ policy_key: x.policy_key, current_value: x.current_value, proposed_value: x.proposed_value, effect: x.effect })),
      evaluation_refs: [...byMode.values()].map((x) => ({ mode: x.mode, evaluation_id: x.evaluation_id, checksum: x.content_checksum })),
      authority_effect: 'AUTHORIZED_ADVISORY_POLICY_ACTIVATION_ONLY',
    };
    activation.content_checksum = checksumObject(activation);
    if (apply && this.policy_applier) await this.policy_applier(deepFreeze(structuredClone(activation)));
    if (this.root) await appendCalibrationRecord(this.root, 'POLICY_ACTIVATED', activation);
    return deepFreeze(activation);
  }
  async verifyStore() { if (!this.root) return deepFreeze({ result: 'CALIBRATION_MEMORY_STORE', evidence_count: this.memoryEvidence.length }); return verifyCalibrationLedger(this.root); }
  async snapshot() { if (!this.root) return deepFreeze({ calibration_snapshot_version: '1.0.0', active_advisory_policy: {}, evidence_count: this.memoryEvidence.length }); return buildCalibrationSnapshot(this.root); }
}
