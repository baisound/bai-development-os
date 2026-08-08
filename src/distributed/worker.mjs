import { DISTRIBUTED_VERSION, DISTRIBUTED_WORKER_TRUST } from './constants.mjs';
import { DistributedError } from './errors.mjs';
import { checksumObject, deepFreeze, newId, nowIso, requireEnum, safeId, uniqSorted } from './util.mjs';

export function createWorkerAdvertisement(input = {}, { clock = () => new Date() } = {}) {
  const trust_state = requireEnum(String(input.trust_state ?? 'UNATTESTED').toUpperCase(), DISTRIBUTED_WORKER_TRUST, 'trust_state');
  const capabilities = uniqSorted((input.capabilities ?? []).map((x) => safeId(String(x), 'capability')));
  const worker = {
    distributed_worker_version: DISTRIBUTED_VERSION,
    worker_id: safeId(input.worker_id ?? newId('DW'), 'worker_id'),
    node_id: safeId(input.node_id ?? input.worker_id ?? 'local-node', 'node_id'),
    advertised_at: input.advertised_at ?? nowIso(clock),
    environment_fingerprint: safeId(input.environment_fingerprint ?? 'unknown', 'environment_fingerprint'),
    capabilities,
    project_ids: uniqSorted((input.project_ids ?? []).map((x) => safeId(String(x), 'project_id'))),
    trust_state,
    attestation_ref: input.attestation_ref ?? null,
    provider_checksums: Object.fromEntries(Object.entries(input.provider_checksums ?? {}).sort()),
    metadata: input.metadata && typeof input.metadata === 'object' ? structuredClone(input.metadata) : {},
  };
  if (trust_state === 'ATTESTED' && !worker.attestation_ref) throw new DistributedError('DISTRIBUTED_WORKER_ATTESTATION_REQUIRED');
  worker.content_checksum = checksumObject(worker);
  return deepFreeze(worker);
}
export function verifyWorkerAdvertisement(worker) {
  if (!worker || worker.distributed_worker_version !== DISTRIBUTED_VERSION || worker.content_checksum !== checksumObject(worker)) throw new DistributedError('DISTRIBUTED_WORKER_TAMPERED');
  requireEnum(worker.trust_state, DISTRIBUTED_WORKER_TRUST, 'trust_state');
  if (worker.trust_state === 'ATTESTED' && !worker.attestation_ref) throw new DistributedError('DISTRIBUTED_WORKER_ATTESTATION_REQUIRED');
  return true;
}
export function evaluateWorkerEligibility(worker, requirements = {}) {
  verifyWorkerAdvertisement(worker);
  const requiredCapabilities = uniqSorted(requirements.capabilities ?? []);
  const missing = requiredCapabilities.filter((x) => !worker.capabilities.includes(x));
  const projectAllowed = !requirements.project_id || worker.project_ids.length === 0 || worker.project_ids.includes(requirements.project_id);
  const attestationRequired = requirements.require_attested === true;
  const providerMismatches = [];
  for (const [provider, checksum] of Object.entries(requirements.provider_checksums ?? {})) if (worker.provider_checksums?.[provider] !== checksum) providerMismatches.push(provider);
  const eligible = missing.length === 0 && projectAllowed && (!attestationRequired || worker.trust_state === 'ATTESTED') && worker.trust_state !== 'REVOKED' && providerMismatches.length === 0;
  return deepFreeze({ result: eligible ? 'ELIGIBLE' : 'INELIGIBLE', worker_id: worker.worker_id, missing_capabilities: missing, project_allowed: projectAllowed, attestation_satisfied: !attestationRequired || worker.trust_state === 'ATTESTED', provider_mismatches: providerMismatches });
}
