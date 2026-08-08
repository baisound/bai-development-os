import { DISTRIBUTED_VERSION } from './constants.mjs';
import { DistributedError } from './errors.mjs';
import { checksumObject, deepFreeze, newId, nowIso, parseTime, requireFinite, safeId } from './util.mjs';

export function issueDistributedLease(input = {}, { clock = () => new Date() } = {}) {
  const issuedAt = input.issued_at ?? nowIso(clock);
  const ttl = requireFinite(input.ttl_ms ?? 30000, 'ttl_ms', { min: 1, max: 24 * 60 * 60 * 1000, integer: true });
  const epoch = requireFinite(input.epoch ?? 1, 'epoch', { min: 1, integer: true });
  const previous = input.previous_lease ?? null;
  if (previous) {
    verifyDistributedLease(previous, { allow_expired: true });
    if (epoch <= previous.epoch) throw new DistributedError('DISTRIBUTED_LEASE_EPOCH_NOT_ADVANCED');
  }
  const lease = {
    distributed_lease_version: DISTRIBUTED_VERSION,
    lease_id: safeId(input.lease_id ?? newId('DL'), 'lease_id'),
    scope: safeId(input.scope, 'scope'),
    owner_id: safeId(input.owner_id, 'owner_id'),
    epoch,
    fencing_token: safeId(input.fencing_token ?? `FENCE-${epoch}-${newId('T')}`, 'fencing_token'),
    issued_at: issuedAt,
    expires_at: new Date(parseTime(issuedAt) + ttl).toISOString(),
  };
  lease.content_checksum = checksumObject(lease);
  return deepFreeze(lease);
}
export function verifyDistributedLease(lease, { now = Date.now(), scope = null, owner_id = null, min_epoch = null, fencing_token = null, allow_expired = false } = {}) {
  if (!lease || lease.distributed_lease_version !== DISTRIBUTED_VERSION || lease.content_checksum !== checksumObject(lease)) throw new DistributedError('DISTRIBUTED_LEASE_TAMPERED');
  if (scope != null && lease.scope !== scope) throw new DistributedError('DISTRIBUTED_LEASE_SCOPE_MISMATCH');
  if (owner_id != null && lease.owner_id !== owner_id) throw new DistributedError('DISTRIBUTED_LEASE_OWNER_MISMATCH');
  if (min_epoch != null && lease.epoch < min_epoch) throw new DistributedError('DISTRIBUTED_LEASE_STALE_EPOCH');
  if (fencing_token != null && lease.fencing_token !== fencing_token) throw new DistributedError('DISTRIBUTED_FENCING_TOKEN_MISMATCH');
  if (!allow_expired && parseTime(lease.expires_at) <= (now instanceof Date ? now.getTime() : Number(now))) throw new DistributedError('DISTRIBUTED_LEASE_EXPIRED');
  return true;
}
export function renewDistributedLease(lease, { ttl_ms = 30000, clock = () => new Date() } = {}) {
  verifyDistributedLease(lease, { allow_expired: true });
  return issueDistributedLease({ scope: lease.scope, owner_id: lease.owner_id, epoch: lease.epoch + 1, previous_lease: lease, ttl_ms }, { clock });
}
