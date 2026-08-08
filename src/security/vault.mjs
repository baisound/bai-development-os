import { SecurityError } from './errors.mjs';
import { deepFreeze, id, nowIso, requireSafeId, requireString } from './util.mjs';
import { assertNoSecretMaterial } from './dlp.mjs';

export function createSecretReference(input = {}) {
  assertNoSecretMaterial(input.metadata ?? {});
  const ref = {
    secret_reference_version: '1.0.0',
    secret_id: requireSafeId(input.secret_id, 'secret_id'),
    provider: requireString(input.provider, 'provider'),
    key_version: requireString(input.key_version ?? 'current', 'key_version'),
    scopes: [...new Set(input.scopes ?? [])].sort(),
    expires_at: input.expires_at ?? null,
    metadata: structuredClone(input.metadata ?? {})
  };
  if (ref.expires_at && Number.isNaN(Date.parse(ref.expires_at))) throw new SecurityError('SECURITY_SECRET_EXPIRY_INVALID');
  return deepFreeze(ref);
}
export class InMemorySecretVault {
  #records = new Map(); #leases = new Map();
  constructor({ provider = 'memory', clock = () => new Date(), max_lease_ms = 300000 } = {}) { this.provider = provider; this.clock = clock; this.maxLease = max_lease_ms; }
  put({ secret_id, value, scopes = [], version = '1', expires_at = null } = {}) {
    const sid = requireSafeId(secret_id, 'secret_id');
    if (value == null || (typeof value === 'string' && !value)) throw new SecurityError('SECURITY_SECRET_VALUE_INVALID');
    this.#records.set(sid, { value, scopes: new Set(scopes), version, expires_at, revoked: false });
    return createSecretReference({ secret_id: sid, provider: this.provider, key_version: version, scopes, expires_at });
  }
  rotate(secret_id, value, { version, scopes = null, expires_at = null } = {}) {
    const current = this.#records.get(secret_id); if (!current) throw new SecurityError('SECURITY_SECRET_NOT_FOUND');
    return this.put({ secret_id, value, version: version ?? String(Number(current.version) + 1 || Date.now()), scopes: scopes ?? [...current.scopes], expires_at });
  }
  revoke(secret_id) { const r = this.#records.get(secret_id); if (!r) throw new SecurityError('SECURITY_SECRET_NOT_FOUND'); r.revoked = true; for (const lease of this.#leases.values()) if (lease.secret_id === secret_id) lease.revoked = true; return true; }
  issueLease(ref, { scopes = [], ttl_ms = 60000, subject = 'runtime' } = {}) {
    const record = this.#records.get(ref?.secret_id); if (!record) throw new SecurityError('SECURITY_SECRET_NOT_FOUND');
    if (record.revoked) throw new SecurityError('SECURITY_SECRET_REVOKED');
    if (record.version !== ref.key_version) throw new SecurityError('SECURITY_SECRET_VERSION_MISMATCH');
    const now = this.clock().getTime(); if (ref.expires_at && Date.parse(ref.expires_at) <= now) throw new SecurityError('SECURITY_SECRET_EXPIRED');
    if (!Number.isSafeInteger(ttl_ms) || ttl_ms < 1 || ttl_ms > this.maxLease) throw new SecurityError('SECURITY_SECRET_LEASE_TTL_INVALID');
    for (const scope of scopes) if (!record.scopes.has(scope) || !ref.scopes.includes(scope)) throw new SecurityError('SECURITY_SECRET_SCOPE_DENIED', scope);
    const lease = { lease_id: id('LEASE'), secret_id: ref.secret_id, key_version: ref.key_version, scopes: [...scopes].sort(), subject, issued_at: nowIso(this.clock), expires_at: new Date(now + ttl_ms).toISOString(), revoked: false };
    this.#leases.set(lease.lease_id, lease); return deepFreeze({ ...lease });
  }
  resolveLease(lease_id) {
    const lease = this.#leases.get(lease_id); if (!lease) throw new SecurityError('SECURITY_SECRET_LEASE_NOT_FOUND');
    if (lease.revoked || this.clock().getTime() >= Date.parse(lease.expires_at)) throw new SecurityError('SECURITY_SECRET_LEASE_EXPIRED');
    const record = this.#records.get(lease.secret_id); if (!record || record.revoked || record.version !== lease.key_version) throw new SecurityError('SECURITY_SECRET_REVOKED');
    return record.value;
  }
}
