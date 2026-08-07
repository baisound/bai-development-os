import { createHash } from 'node:crypto';

export class FoundationGuardError extends Error {
  constructor(code, message = code) { super(message); this.name = 'FoundationGuardError'; this.code = code; }
}

const canonical = (value) => JSON.stringify(value, Object.keys(value).sort());
const checksum = (value) => `sha256:${createHash('sha256').update(JSON.stringify(value)).digest('hex')}`;
const nonEmpty = (value) => typeof value === 'string' && value.trim().length > 0;

function normalizeEntry(entry) {
  if (!entry || !nonEmpty(entry.entry_id) || !nonEmpty(entry.owner) || entry.gateway !== 'CONTEXT_GUARD_GATEWAY') {
    throw new FoundationGuardError('FOUNDATION_ENTRY_INVALID');
  }
  const roles = entry.roles == null ? ['*'] : entry.roles;
  const scopes = entry.scopes == null ? ['*'] : entry.scopes;
  if (!Array.isArray(roles) || !roles.length || !roles.every(nonEmpty) || !Array.isArray(scopes) || !scopes.length || !scopes.every(nonEmpty)) {
    throw new FoundationGuardError('FOUNDATION_ENTRY_INVALID');
  }
  return Object.freeze({ entry_id: entry.entry_id, owner: entry.owner, gateway: entry.gateway, enabled: entry.enabled !== false,
    roles: Object.freeze([...new Set(roles)].sort()), scopes: Object.freeze([...new Set(scopes)].sort()) });
}

export function createActivationEntryRegistry({ revision = 1, entries = [] } = {}) {
  if (!Number.isSafeInteger(revision) || revision < 1 || !Array.isArray(entries)) throw new FoundationGuardError('FOUNDATION_REGISTRY_INVALID');
  const normalized = entries.map(normalizeEntry).sort((a, b) => a.entry_id.localeCompare(b.entry_id));
  if (new Set(normalized.map((entry) => entry.entry_id)).size !== normalized.length) throw new FoundationGuardError('FOUNDATION_ENTRY_DUPLICATE');
  const record = { revision, entries: normalized };
  return Object.freeze({ ...record, checksum: checksum(record) });
}

export function resolveActivationEntry(registry, { activation_entry_id, role, scope }) {
  if (!registry?.checksum || !nonEmpty(activation_entry_id)) throw new FoundationGuardError('FOUNDATION_ENTRY_UNCLASSIFIED');
  const entry = registry.entries.find((candidate) => candidate.entry_id === activation_entry_id);
  if (!entry || !entry.enabled) throw new FoundationGuardError('FOUNDATION_ENTRY_UNCLASSIFIED');
  if (!entry.roles.includes('*') && !entry.roles.includes(role)) throw new FoundationGuardError('FOUNDATION_ENTRY_ROLE_DENIED');
  if (!entry.scopes.includes('*') && !entry.scopes.includes(scope)) throw new FoundationGuardError('FOUNDATION_ENTRY_SCOPE_DENIED');
  return entry;
}

export function verifyRegistryIdentity(before, after) {
  if (!before?.checksum || !after?.checksum || before.revision !== after.revision || before.checksum !== after.checksum) {
    throw new FoundationGuardError('FOUNDATION_REGISTRY_CHANGED_BEFORE_USE');
  }
  return true;
}
