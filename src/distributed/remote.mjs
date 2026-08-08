import { DISTRIBUTED_EVIDENCE_CLASSES, DISTRIBUTED_RUN_KINDS, DISTRIBUTED_VERSION } from './constants.mjs';
import { DistributedError } from './errors.mjs';
import { checksumObject, deepFreeze, newId, nowIso, parseTime, requireEnum, requireFinite, requireString, safeId, uniqSorted } from './util.mjs';
import { verifyWorkerAdvertisement, evaluateWorkerEligibility } from './worker.mjs';
import { verifyDistributedLease } from './lease.mjs';

export function createRemoteRunRequest(input = {}, { clock = () => new Date() } = {}) {
  const kind = requireEnum(String(input.kind ?? 'GENERIC').toUpperCase(), DISTRIBUTED_RUN_KINDS, 'kind');
  const request = {
    distributed_run_request_version: DISTRIBUTED_VERSION,
    run_id: safeId(input.run_id ?? newId('DRUN'), 'run_id'),
    kind,
    project_id: safeId(input.project_id, 'project_id'),
    task_id: input.task_id == null ? null : safeId(input.task_id, 'task_id'),
    correlation_id: safeId(input.correlation_id ?? newId('CORR'), 'correlation_id'),
    idempotency_key: safeId(input.idempotency_key ?? input.run_id ?? newId('RIDEM'), 'idempotency_key'),
    created_at: input.created_at ?? nowIso(clock),
    deadline_at: input.deadline_at ?? null,
    policy_version: input.policy_version == null ? null : String(input.policy_version),
    trust_version: input.trust_version == null ? null : String(input.trust_version),
    activation_epoch: input.activation_epoch == null ? null : requireFinite(input.activation_epoch, 'activation_epoch', { min: 0, integer: true }),
    binding_checksum: requireString(input.binding_checksum, 'binding_checksum'),
    required_capabilities: uniqSorted(input.required_capabilities ?? []),
    require_attested_worker: input.require_attested_worker !== false,
    provider_checksums: Object.fromEntries(Object.entries(input.provider_checksums ?? {}).sort()),
    authorization_ref: input.authorization_ref ?? null,
    resource_budget: input.resource_budget && typeof input.resource_budget === 'object' ? structuredClone(input.resource_budget) : {},
    payload: input.payload == null ? {} : structuredClone(input.payload),
  };
  if (request.deadline_at != null && Number.isNaN(Date.parse(request.deadline_at))) throw new DistributedError('DISTRIBUTED_DEADLINE_INVALID');
  request.content_checksum = checksumObject(request); return deepFreeze(request);
}
export function verifyRemoteRunRequest(request) {
  if (!request || request.distributed_run_request_version !== DISTRIBUTED_VERSION || request.content_checksum !== checksumObject(request)) throw new DistributedError('DISTRIBUTED_RUN_REQUEST_TAMPERED');
  requireEnum(request.kind, DISTRIBUTED_RUN_KINDS, 'kind'); return true;
}
export function scheduleRemoteRun(request, worker, lease = null, { now = Date.now() } = {}) {
  verifyRemoteRunRequest(request); verifyWorkerAdvertisement(worker);
  const eligibility = evaluateWorkerEligibility(worker, { capabilities: request.required_capabilities, project_id: request.project_id, require_attested: request.require_attested_worker, provider_checksums: request.provider_checksums });
  if (eligibility.result !== 'ELIGIBLE') throw new DistributedError('DISTRIBUTED_WORKER_INELIGIBLE', worker.worker_id, eligibility);
  if (request.deadline_at && parseTime(request.deadline_at) <= (now instanceof Date ? now.getTime() : Number(now))) throw new DistributedError('DISTRIBUTED_RUN_EXPIRED');
  if (lease) verifyDistributedLease(lease, { now, owner_id: worker.worker_id, scope: `run:${request.run_id}` });
  return deepFreeze({ result: 'REMOTE_RUN_SCHEDULED', run_id: request.run_id, worker_id: worker.worker_id, request_checksum: request.content_checksum, lease_id: lease?.lease_id ?? null, lease_epoch: lease?.epoch ?? null, fencing_token: lease?.fencing_token ?? null });
}
export function createRemoteRunResult(input = {}, request, worker, { clock = () => new Date() } = {}) {
  verifyRemoteRunRequest(request); verifyWorkerAdvertisement(worker);
  const evidence_class = requireEnum(String(input.evidence_class ?? 'SANDBOX').toUpperCase(), DISTRIBUTED_EVIDENCE_CLASSES, 'evidence_class');
  if (evidence_class === 'REAL' && worker.trust_state !== 'ATTESTED') throw new DistributedError('DISTRIBUTED_REAL_EVIDENCE_REQUIRES_ATTESTED_WORKER');
  const result = {
    distributed_run_result_version: DISTRIBUTED_VERSION,
    result_id: safeId(input.result_id ?? newId('DRES'), 'result_id'),
    run_id: request.run_id,
    request_checksum: request.content_checksum,
    worker_id: worker.worker_id,
    worker_checksum: worker.content_checksum,
    environment_fingerprint: worker.environment_fingerprint,
    completed_at: input.completed_at ?? nowIso(clock),
    status: requireEnum(String(input.status ?? 'PASS').toUpperCase(), ['PASS','FAIL','CANCELLED','UNKNOWN'], 'status'),
    evidence_class,
    policy_version: request.policy_version,
    trust_version: request.trust_version,
    activation_epoch: request.activation_epoch,
    lease_epoch: input.lease_epoch ?? null,
    fencing_token: input.fencing_token ?? null,
    binding_checksum: request.binding_checksum,
    output: input.output == null ? {} : structuredClone(input.output),
  };
  result.content_checksum = checksumObject(result); return deepFreeze(result);
}
export function verifyRemoteRunResult(result, request, worker) {
  verifyRemoteRunRequest(request); verifyWorkerAdvertisement(worker);
  if (!result || result.distributed_run_result_version !== DISTRIBUTED_VERSION || result.content_checksum !== checksumObject(result)) throw new DistributedError('DISTRIBUTED_RUN_RESULT_TAMPERED');
  if (result.run_id !== request.run_id || result.request_checksum !== request.content_checksum || result.binding_checksum !== request.binding_checksum) throw new DistributedError('DISTRIBUTED_RUN_RESULT_BINDING_MISMATCH');
  if (result.worker_id !== worker.worker_id || result.worker_checksum !== worker.content_checksum || result.environment_fingerprint !== worker.environment_fingerprint) throw new DistributedError('DISTRIBUTED_RUN_RESULT_WORKER_MISMATCH');
  if (result.evidence_class === 'REAL' && worker.trust_state !== 'ATTESTED') throw new DistributedError('DISTRIBUTED_REAL_EVIDENCE_REQUIRES_ATTESTED_WORKER');
  return true;
}
export function evaluateRemoteResultFreshness(result, request, worker, current = {}, { now = Date.now() } = {}) {
  verifyRemoteRunResult(result, request, worker);
  const reasons = [];
  if (request.deadline_at && parseTime(request.deadline_at) < (now instanceof Date ? now.getTime() : Number(now))) reasons.push('REQUEST_EXPIRED');
  if (current.binding_checksum != null && current.binding_checksum !== result.binding_checksum) reasons.push('BINDING_CHANGED');
  if (current.policy_version != null && current.policy_version !== result.policy_version) reasons.push('POLICY_CHANGED');
  if (current.trust_version != null && current.trust_version !== result.trust_version) reasons.push('TRUST_CHANGED');
  if (current.activation_epoch != null && current.activation_epoch !== result.activation_epoch) reasons.push('ACTIVATION_EPOCH_CHANGED');
  if (current.lease_epoch != null && result.lease_epoch != null && current.lease_epoch !== result.lease_epoch) reasons.push('LEASE_EPOCH_CHANGED');
  if (current.fencing_token != null && result.fencing_token != null && current.fencing_token !== result.fencing_token) reasons.push('FENCING_CHANGED');
  if (worker.trust_state === 'REVOKED') reasons.push('WORKER_REVOKED');
  return deepFreeze({ result: reasons.length ? 'QUARANTINED' : 'ACCEPTED', reasons, run_id: result.run_id, result_id: result.result_id });
}
