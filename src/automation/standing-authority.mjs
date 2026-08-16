import { checksumObject, deepFreeze, requireArray, requireString } from './util.mjs';

export class StandingAuthorityError extends Error {
  constructor(code, message){ super(message); this.name = 'StandingAuthorityError'; this.code = code; }
}

const sortedUnique = (items, name) => {
  requireArray(items, name, StandingAuthorityError);
  const values = items.map((item, index) => requireString(item, `${name}[${index}]`, StandingAuthorityError));
  if(new Set(values).size !== values.length) throw new StandingAuthorityError('AUTHORITY_DUPLICATE_VALUE', name);
  return [...values].sort();
};

export function createStandingAuthorityGrant(input){
  const grant = {
    schema: 'BAI_STANDING_AUTHORITY_GRANT_V1',
    grant_id: requireString(input?.grant_id, 'grant_id', StandingAuthorityError),
    issuer_id: requireString(input?.issuer_id, 'issuer_id', StandingAuthorityError),
    subject_id: requireString(input?.subject_id, 'subject_id', StandingAuthorityError),
    epoch: Number(input?.epoch),
    valid_from: requireString(input?.valid_from, 'valid_from', StandingAuthorityError),
    valid_until: requireString(input?.valid_until, 'valid_until', StandingAuthorityError),
    allowed_capabilities: sortedUnique(input?.allowed_capabilities ?? [], 'allowed_capabilities'),
    denied_capabilities: sortedUnique(input?.denied_capabilities ?? [], 'denied_capabilities'),
    resource_scope: sortedUnique(input?.resource_scope ?? [], 'resource_scope'),
    evidence_coordinate: requireString(input?.evidence_coordinate, 'evidence_coordinate', StandingAuthorityError),
    signature_evidence: requireString(input?.signature_evidence, 'signature_evidence', StandingAuthorityError),
    revocation_coordinate: input?.revocation_coordinate ?? null,
  };
  if(!Number.isSafeInteger(grant.epoch) || grant.epoch < 1) throw new StandingAuthorityError('AUTHORITY_EPOCH_INVALID', String(grant.epoch));
  const validFrom = Date.parse(grant.valid_from);
  const validUntil = Date.parse(grant.valid_until);
  if(!Number.isFinite(validFrom) || !Number.isFinite(validUntil) || validFrom >= validUntil) throw new StandingAuthorityError('AUTHORITY_WINDOW_INVALID', grant.grant_id);
  if(grant.allowed_capabilities.some((item) => grant.denied_capabilities.includes(item))) throw new StandingAuthorityError('AUTHORITY_ALLOW_DENY_CONFLICT', grant.grant_id);
  grant.content_checksum = checksumObject(grant);
  return deepFreeze(grant);
}

export function evaluateStandingAuthority(grant, request, { now, current_epoch, verify_signature }){
  if(!grant || checksumObject(grant) !== grant.content_checksum) throw new StandingAuthorityError('AUTHORITY_TAMPERED', grant?.grant_id ?? 'unknown');
  if(typeof verify_signature !== 'function' || verify_signature(grant) !== true) throw new StandingAuthorityError('AUTHORITY_SIGNATURE_UNVERIFIED', grant.grant_id);
  const requested = sortedUnique(request?.capabilities ?? [], 'request.capabilities');
  const subject = requireString(request?.subject_id, 'request.subject_id', StandingAuthorityError);
  const resource = requireString(request?.resource, 'request.resource', StandingAuthorityError);
  if(subject !== grant.subject_id) return { result: 'DENY', reason_code: 'SUBJECT_MISMATCH' };
  if(grant.revocation_coordinate) return { result: 'DENY', reason_code: 'GRANT_REVOKED' };
  if(grant.epoch !== current_epoch) return { result: 'DENY', reason_code: 'STALE_AUTHORITY_EPOCH' };
  const instant = Date.parse(now);
  if(!Number.isFinite(instant) || instant < Date.parse(grant.valid_from) || instant >= Date.parse(grant.valid_until)) return { result: 'DENY', reason_code: 'OUTSIDE_VALIDITY_WINDOW' };
  if(!grant.resource_scope.includes(resource)) return { result: 'DENY', reason_code: 'RESOURCE_OUT_OF_SCOPE' };
  const denied = requested.find((capability) => grant.denied_capabilities.includes(capability));
  if(denied) return { result: 'DENY', reason_code: 'EXPLICIT_DENY', capability: denied };
  const missing = requested.find((capability) => !grant.allowed_capabilities.includes(capability));
  if(missing) return { result: 'DENY', reason_code: 'CAPABILITY_NOT_GRANTED', capability: missing };
  return { result: 'ALLOW', grant_id: grant.grant_id, epoch: grant.epoch, capabilities: requested };
}
