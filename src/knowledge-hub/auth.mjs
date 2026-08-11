import { TRUST_LEVELS } from '../knowledge-evolution/constants.mjs';
import { safeRecordId } from '../knowledge-evolution/util.mjs';
import { KnowledgeHubError } from './errors.mjs';

const ALLOWED_SCOPES = new Set(['evidence:write', 'policy:read', 'evidence:read']);

export function validateAuthContext(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new KnowledgeHubError('HUB_AUTH_CONTEXT_REQUIRED', 'Authenticated server context required', { status: 401 });
  const subject_id = safeRecordId(value.subject_id, 'auth.subject_id');
  const product_id = safeRecordId(value.product_id, 'auth.product_id');
  if (!Array.isArray(value.scopes) || value.scopes.length < 1) throw new KnowledgeHubError('HUB_AUTH_SCOPES_REQUIRED', 'At least one scope is required', { status: 403 });
  const scopes = [...new Set(value.scopes.map(scope => safeRecordId(scope, 'auth.scope')))];
  if (scopes.some(scope => !ALLOWED_SCOPES.has(scope))) throw new KnowledgeHubError('HUB_AUTH_SCOPE_UNKNOWN', 'Unknown scope', { status: 403 });
  const trust_level = value.trust_level ?? 'REGISTERED_CLIENT';
  if (!TRUST_LEVELS.includes(trust_level)) throw new KnowledgeHubError('HUB_AUTH_TRUST_INVALID', 'Server-derived trust level is invalid', { status: 403 });
  return Object.freeze({ subject_id, product_id, scopes: Object.freeze(scopes), trust_level });
}

export function requireScope(authContext, scope) {
  const auth = validateAuthContext(authContext);
  if (!auth.scopes.includes(scope)) throw new KnowledgeHubError('HUB_AUTH_SCOPE_DENIED', `Required scope: ${scope}`, { status: 403 });
  return auth;
}

export function assertProductBinding(authContext, productId) {
  const auth = validateAuthContext(authContext);
  if (auth.product_id !== productId) throw new KnowledgeHubError('HUB_AUTH_PRODUCT_MISMATCH', 'Credential subject is not bound to this Product', { status: 403 });
  return auth;
}
