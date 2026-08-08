import { DISTRIBUTED_ROLLOUT_STATES, DISTRIBUTED_VERSION } from './constants.mjs';
import { DistributedError } from './errors.mjs';
import { checksumObject, deepFreeze, newId, nowIso, requireEnum, requireFinite, requireString, safeId } from './util.mjs';
import { verifyDistributedLease } from './lease.mjs';

export function createDistributedRolloutPlan(input = {}, { clock = () => new Date() } = {}) {
  const cohorts = (input.cohorts ?? []).map((c) => ({ cohort_id: safeId(c.cohort_id, 'cohort_id'), members: [...new Set((c.members ?? []).map((x) => safeId(x, 'member_id')))].sort(), canary: c.canary === true }));
  if (!cohorts.length || !cohorts.some((x) => x.canary)) throw new DistributedError('DISTRIBUTED_ROLLOUT_CANARY_REQUIRED');
  const plan = {
    distributed_rollout_version: DISTRIBUTED_VERSION, rollout_id: safeId(input.rollout_id ?? newId('DROL'), 'rollout_id'), created_at: nowIso(clock),
    subject: requireString(input.subject, 'subject'), target_checksum: requireString(input.target_checksum, 'target_checksum'), policy_version: String(input.policy_version ?? '1'), activation_epoch: requireFinite(input.activation_epoch ?? 1, 'activation_epoch', { min: 1, integer: true }),
    owner_authorization_ref: requireString(input.owner_authorization_ref, 'owner_authorization_ref'), policy_authorization_ref: requireString(input.policy_authorization_ref, 'policy_authorization_ref'),
    max_parallel: requireFinite(input.max_parallel ?? 1, 'max_parallel', { min: 1, integer: true }), soak_ms: requireFinite(input.soak_ms ?? 0, 'soak_ms', { min: 0, integer: true }), cohorts,
    rollback_target_checksum: input.rollback_target_checksum ?? null,
  };
  plan.content_checksum = checksumObject(plan); return deepFreeze(plan);
}
export function verifyDistributedRolloutPlan(plan) { if (!plan || plan.distributed_rollout_version !== DISTRIBUTED_VERSION || plan.content_checksum !== checksumObject(plan)) throw new DistributedError('DISTRIBUTED_ROLLOUT_TAMPERED'); return true; }
export function initialDistributedRolloutState(plan, { clock = () => new Date() } = {}) { verifyDistributedRolloutPlan(plan); return deepFreeze({ rollout_id: plan.rollout_id, state: 'PENDING', started_at: null, updated_at: nowIso(clock), active_cohort_id: null, cohort_results: {}, canonical_target_checksum: plan.target_checksum, activation_epoch: plan.activation_epoch, rollback_recommended: false, rollback_reason: null, soak_started_at: null }); }
export function advanceDistributedRollout(plan, state, action = {}, { lease = null, clock = () => new Date() } = {}) {
  verifyDistributedRolloutPlan(plan); if (!state || state.rollout_id !== plan.rollout_id) throw new DistributedError('DISTRIBUTED_ROLLOUT_STATE_MISMATCH');
  if (lease) verifyDistributedLease(lease, { scope: `rollout:${plan.rollout_id}`, min_epoch: plan.activation_epoch });
  const next = structuredClone(state); const type = String(action.type ?? '').toUpperCase();
  if (['PROMOTED','ROLLED_BACK','BLOCKED'].includes(next.state)) throw new DistributedError('DISTRIBUTED_ROLLOUT_TERMINAL');
  if (type === 'START_CANARY') { if (next.state !== 'PENDING') throw new DistributedError('DISTRIBUTED_ROLLOUT_TRANSITION_INVALID'); next.state = 'CANARY'; next.started_at = nowIso(clock); next.active_cohort_id = plan.cohorts.find((x) => x.canary).cohort_id; }
  else if (type === 'COHORT_RESULT') { requireEnum(action.result, ['PASS','FAIL','REGRESSION'], 'result'); const cid = safeId(action.cohort_id, 'cohort_id'); if (!plan.cohorts.some((x) => x.cohort_id === cid)) throw new DistributedError('DISTRIBUTED_ROLLOUT_COHORT_INVALID'); next.cohort_results[cid] = { result: action.result, at: nowIso(clock), evidence_ref: action.evidence_ref ?? null }; if (action.result !== 'PASS') { next.rollback_recommended = true; next.rollback_reason = action.result; next.state = plan.rollback_target_checksum ? 'ROLLED_BACK' : 'BLOCKED'; next.canonical_target_checksum = plan.rollback_target_checksum ?? plan.target_checksum; } else if (plan.cohorts.find((x) => x.cohort_id === cid)?.canary) { next.state = 'SOAKING'; next.soak_started_at = nowIso(clock); } }
  else if (type === 'PROMOTE') { if (next.state !== 'SOAKING') throw new DistributedError('DISTRIBUTED_ROLLOUT_TRANSITION_INVALID'); const canary = plan.cohorts.find((x) => x.canary); if (next.cohort_results[canary.cohort_id]?.result !== 'PASS') throw new DistributedError('DISTRIBUTED_ROLLOUT_CANARY_NOT_PASSED'); const nowMs=Date.parse(nowIso(clock)); const soakStart=Date.parse(next.soak_started_at); if(nowMs-soakStart<plan.soak_ms) throw new DistributedError('DISTRIBUTED_ROLLOUT_SOAK_INCOMPLETE'); next.state = 'PROMOTED'; next.active_cohort_id = null; }
  else if (type === 'ROLLBACK') { if (!plan.rollback_target_checksum) throw new DistributedError('DISTRIBUTED_ROLLOUT_ROLLBACK_TARGET_REQUIRED'); next.state = 'ROLLED_BACK'; next.rollback_recommended = true; next.rollback_reason = action.reason ?? 'MANUAL'; next.canonical_target_checksum = plan.rollback_target_checksum; }
  else throw new DistributedError('DISTRIBUTED_ROLLOUT_ACTION_INVALID');
  next.updated_at = nowIso(clock); return deepFreeze(next);
}
export function detectPolicyDivergence({ canonical_version, workers = [] } = {}) { const divergent = workers.filter((x) => x.policy_version !== canonical_version).map((x) => ({ worker_id: x.worker_id, policy_version: x.policy_version })).sort((a,b)=>a.worker_id.localeCompare(b.worker_id)); return deepFreeze({ result: divergent.length ? 'DIVERGENCE_DETECTED' : 'CONSISTENT', canonical_version, divergent }); }
