import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { TRUST_LEVELS } from '../knowledge-evolution/constants.mjs';
import { safeRecordId } from '../knowledge-evolution/util.mjs';
import { KnowledgeHubError } from './errors.mjs';
import { validateAuthContext } from './auth.mjs';

const scryptAsync = promisify(crypto.scrypt);
const KEY_PREFIX = 'bkh1';
const KEY_SECRET_BYTES = 32;
const SCRYPT_KEY_LENGTH = 32;
const DEFAULT_SCOPES = Object.freeze(['evidence:write', 'policy:read']);

function b64url(buffer) { return Buffer.from(buffer).toString('base64url'); }
function parseApiKey(value) {
  if (typeof value !== 'string') throw new KnowledgeHubError('HUB_API_KEY_INVALID', 'API key format invalid', { status: 401 });
  const pieces = value.split('.');
  if (pieces.length !== 3 || pieces[0] !== KEY_PREFIX) throw new KnowledgeHubError('HUB_API_KEY_INVALID', 'API key format invalid', { status: 401 });
  const keyId = safeRecordId(pieces[1], 'api_key.key_id');
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(pieces[2])) throw new KnowledgeHubError('HUB_API_KEY_INVALID', 'API key format invalid', { status: 401 });
  return { keyId, secret: pieces[2] };
}
function authorizationBearer(request) {
  const raw = request?.headers?.authorization;
  if (typeof raw !== 'string' || !raw.startsWith('Bearer ')) throw new KnowledgeHubError('HUB_UNAUTHORIZED', 'Bearer credential required', { status: 401 });
  return raw.slice(7);
}
function validateCredentialRecord(record) {
  if (!record || typeof record !== 'object') throw new KnowledgeHubError('HUB_UNAUTHORIZED', 'Credential not found', { status: 401 });
  for (const field of ['key_id','subject_id','product_id','salt','secret_hash','status']) {
    if (typeof record[field] !== 'string' || !record[field]) throw new KnowledgeHubError('HUB_CREDENTIAL_RECORD_INVALID', `Credential ${field} invalid`, { status: 500 });
  }
  if (!Array.isArray(record.scopes) || record.scopes.length < 1) throw new KnowledgeHubError('HUB_CREDENTIAL_RECORD_INVALID', 'Credential scopes invalid', { status: 500 });
  if (!TRUST_LEVELS.includes(record.trust_level)) throw new KnowledgeHubError('HUB_CREDENTIAL_RECORD_INVALID', 'Credential trust invalid', { status: 500 });
  if (!Number.isFinite(Date.parse(record.created_at))) throw new KnowledgeHubError('HUB_CREDENTIAL_RECORD_INVALID', 'Credential created_at invalid', { status: 500 });
  if (record.expires_at !== null && record.expires_at !== undefined && !Number.isFinite(Date.parse(record.expires_at))) throw new KnowledgeHubError('HUB_CREDENTIAL_RECORD_INVALID', 'Credential expires_at invalid', { status: 500 });
  validateAuthContext({ subject_id: record.subject_id, product_id: record.product_id, scopes: record.scopes, trust_level: record.trust_level });
  return record;
}
async function derive(secret, salt) {
  return Buffer.from(await scryptAsync(secret, Buffer.from(salt, 'base64url'), SCRYPT_KEY_LENGTH));
}

export async function createApiKeyCredential({
  keyId = `key-${crypto.randomBytes(12).toString('hex')}`,
  subjectId,
  productId,
  scopes = DEFAULT_SCOPES,
  trustLevel = 'REGISTERED_CLIENT',
  expiresAt = null,
  clock = () => new Date()
} = {}) {
  const key_id = safeRecordId(keyId, 'key_id');
  const subject_id = safeRecordId(subjectId, 'subject_id');
  const product_id = safeRecordId(productId, 'product_id');
  if (!Array.isArray(scopes) || scopes.length < 1) throw new TypeError('scopes must be non-empty array');
  const normalizedScopes = [...new Set(scopes.map(scope => safeRecordId(scope, 'scope')))];
  if (!TRUST_LEVELS.includes(trustLevel)) throw new TypeError('trustLevel invalid');
  validateAuthContext({ subject_id, product_id, scopes: normalizedScopes, trust_level: trustLevel });
  const secret = b64url(crypto.randomBytes(KEY_SECRET_BYTES));
  const salt = crypto.randomBytes(16);
  const derived = await derive(secret, b64url(salt));
  const clockValue = clock();
  const createdAt = (clockValue instanceof Date ? clockValue : new Date(clockValue)).toISOString();
  let normalizedExpiresAt = null;
  if (expiresAt !== null && expiresAt !== undefined) {
    const expires = new Date(expiresAt);
    if (!Number.isFinite(expires.getTime())) throw new TypeError('expiresAt invalid');
    normalizedExpiresAt = expires.toISOString();
  }
  return Object.freeze({
    api_key: `${KEY_PREFIX}.${key_id}.${secret}`,
    record: Object.freeze({
      key_id,
      subject_id,
      product_id,
      scopes: Object.freeze(normalizedScopes),
      trust_level: trustLevel,
      salt: b64url(salt),
      secret_hash: b64url(derived),
      status: 'ACTIVE',
      created_at: createdAt,
      expires_at: normalizedExpiresAt
    })
  });
}

export function createApiKeyAuthenticator({ credentialStore, clock = () => new Date() } = {}) {
  if (!credentialStore || typeof credentialStore.getCredentialByKeyId !== 'function') throw new TypeError('credentialStore.getCredentialByKeyId is required');
  return async function authenticate(request) {
    const parsed = parseApiKey(authorizationBearer(request));
    const record = validateCredentialRecord(await credentialStore.getCredentialByKeyId(parsed.keyId));
    if (record.status !== 'ACTIVE') throw new KnowledgeHubError('HUB_CREDENTIAL_INACTIVE', 'Credential inactive', { status: 401 });
    if (record.expires_at && Date.parse(record.expires_at) <= new Date(clock()).getTime()) throw new KnowledgeHubError('HUB_CREDENTIAL_EXPIRED', 'Credential expired', { status: 401 });
    const expected = Buffer.from(record.secret_hash, 'base64url');
    const actual = await derive(parsed.secret, record.salt);
    if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) throw new KnowledgeHubError('HUB_UNAUTHORIZED', 'Credential rejected', { status: 401 });
    return validateAuthContext({ subject_id: record.subject_id, product_id: record.product_id, scopes: record.scopes, trust_level: record.trust_level });
  };
}

export function createPostgresApiKeyStore({ query } = {}) {
  if (typeof query !== 'function') throw new TypeError('query is required');
  return Object.freeze({
    async getCredentialByKeyId(keyId) {
      const id = safeRecordId(keyId, 'key_id');
      const result = await query(`SELECT key_id, subject_id, product_id, scopes_json, trust_level, salt, secret_hash, status, created_at, expires_at
FROM api_credentials WHERE key_id=$1`, [id]);
      const row = result?.rows?.[0];
      if (!row) return null;
      return {
        key_id: row.key_id,
        subject_id: row.subject_id,
        product_id: row.product_id,
        scopes: Array.isArray(row.scopes_json) ? row.scopes_json : JSON.parse(row.scopes_json),
        trust_level: row.trust_level,
        salt: row.salt,
        secret_hash: row.secret_hash,
        status: row.status,
        created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
        expires_at: row.expires_at instanceof Date ? row.expires_at.toISOString() : row.expires_at
      };
    },
    async saveCredential(record) {
      validateCredentialRecord(record);
      await query(`INSERT INTO api_credentials
(key_id, subject_id, product_id, scopes_json, trust_level, salt, secret_hash, status, created_at, expires_at)
VALUES($1,$2,$3,$4::jsonb,$5,$6,$7,$8,$9::timestamptz,$10::timestamptz)`, [
        record.key_id, record.subject_id, record.product_id, JSON.stringify(record.scopes), record.trust_level,
        record.salt, record.secret_hash, record.status, record.created_at, record.expires_at
      ]);
    },
    async revokeCredential(keyId) {
      const id = safeRecordId(keyId, 'key_id');
      const result = await query(`UPDATE api_credentials SET status='REVOKED', revoked_at=now() WHERE key_id=$1 AND status <> 'REVOKED'`, [id]);
      return result?.rowCount ?? 0;
    }
  });
}
