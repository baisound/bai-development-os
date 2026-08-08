import { SecurityError } from './errors.mjs';
import { signEnvelope, verifySignedEnvelope } from './signing.mjs';
import { deepFreeze, requireString } from './util.mjs';
export function signAuthorizationEnvelope(approval, signer) {
  if (!approval || approval.authorized !== true) throw new SecurityError('SECURITY_AUTHORIZATION_INVALID');
  for (const field of ['task_id','phase','role']) requireString(approval[field], field);
  return signEnvelope({ authorization_envelope_version:'1.0.0', ...structuredClone(approval) }, signer);
}
export function verifyAuthorizationEnvelope(approval, { public_key, expected_key_id = null, required_binding = null, now = Date.now() } = {}) {
  if (!approval?.signature) throw new SecurityError('SECURITY_AUTHORIZATION_SIGNATURE_REQUIRED');
  verifySignedEnvelope(approval, { public_key, expected_key_id });
  if (approval.authorized !== true) throw new SecurityError('SECURITY_AUTHORIZATION_INVALID');
  if (approval.expires_at) { const exp = Date.parse(approval.expires_at); if (!Number.isFinite(exp) || exp <= now) throw new SecurityError('SECURITY_AUTHORIZATION_EXPIRED'); }
  if (required_binding) for (const [k,v] of Object.entries(required_binding)) if (v != null && approval[k] !== v) throw new SecurityError('SECURITY_AUTHORIZATION_BINDING_MISMATCH', k);
  return deepFreeze({ result:'SECURITY_AUTHORIZATION_VERIFIED', approval_id:approval.approval_id??null, key_id:approval.key_id });
}
