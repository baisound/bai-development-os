import { sign as cryptoSign, verify as cryptoVerify } from 'node:crypto';
import { SecurityError } from './errors.mjs';
import { deepFreeze, nowIso, requireString, sha256, stable } from './util.mjs';

export function canonicalEnvelopePayload(envelope) {
  const copy = structuredClone(envelope); delete copy.signature; delete copy.signature_algorithm; delete copy.key_id; delete copy.signed_at; delete copy.payload_checksum;
  return Buffer.from(stable(copy));
}
export function signEnvelope(envelope, { private_key, key_id, clock = () => new Date() } = {}) {
  if (!private_key) throw new SecurityError('SECURITY_SIGNING_KEY_REQUIRED');
  const kid = requireString(key_id, 'key_id'); const payload = canonicalEnvelopePayload(envelope);
  const signature = cryptoSign(null, payload, private_key).toString('base64');
  return deepFreeze({ ...structuredClone(envelope), key_id: kid, signature_algorithm: 'Ed25519', signed_at: nowIso(clock), signature, payload_checksum: sha256(payload) });
}
export function verifySignedEnvelope(envelope, { public_key, expected_key_id = null } = {}) {
  if (!public_key || envelope?.signature_algorithm !== 'Ed25519' || typeof envelope.signature !== 'string') throw new SecurityError('SECURITY_SIGNATURE_INVALID');
  if (expected_key_id && envelope.key_id !== expected_key_id) throw new SecurityError('SECURITY_SIGNATURE_KEY_MISMATCH');
  const payload = canonicalEnvelopePayload(envelope);
  if (envelope.payload_checksum !== sha256(payload)) throw new SecurityError('SECURITY_SIGNATURE_PAYLOAD_MISMATCH');
  const ok = cryptoVerify(null, payload, public_key, Buffer.from(envelope.signature, 'base64'));
  if (!ok) throw new SecurityError('SECURITY_SIGNATURE_INVALID');
  return true;
}

export function createEd25519SigningProvider({ private_key = null, public_key, key_id } = {}) {
  const kid = requireString(key_id, 'key_id');
  if (!public_key) throw new SecurityError('SECURITY_SIGNING_KEY_REQUIRED');
  return deepFreeze({
    provider_type: 'ED25519', key_id: kid,
    async sign(envelope, options = {}) {
      if (!private_key) throw new SecurityError('SECURITY_SIGNING_PRIVATE_KEY_REQUIRED');
      return signEnvelope(envelope, { private_key, key_id: kid, clock: options.clock });
    },
    async verify(envelope) { return verifySignedEnvelope(envelope, { public_key, expected_key_id: kid }); }
  });
}
export async function signEnvelopeWithProvider(envelope, provider, options = {}) {
  if (!provider || typeof provider.sign !== 'function' || !provider.key_id) throw new SecurityError('SECURITY_SIGNING_PROVIDER_INVALID');
  return deepFreeze(await provider.sign(structuredClone(envelope), options));
}
export async function verifyEnvelopeWithProvider(envelope, provider) {
  if (!provider || typeof provider.verify !== 'function') throw new SecurityError('SECURITY_SIGNING_PROVIDER_INVALID');
  const ok = await provider.verify(structuredClone(envelope));
  if (ok !== true) throw new SecurityError('SECURITY_SIGNATURE_INVALID');
  return true;
}
