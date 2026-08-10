import crypto from 'node:crypto';
import path from 'node:path';
import { KnowledgeEvolutionError } from './errors.mjs';

export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(k => [k, canonicalize(value[k])]));
  return value;
}
export function canonicalJson(value) { return JSON.stringify(canonicalize(value)); }
export function sha256(value) { return crypto.createHash('sha256').update(Buffer.isBuffer(value) ? value : (typeof value === 'string' ? value : canonicalJson(value))).digest('hex'); }
export function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}
export function requireNonEmptyString(value, name, { max = 4096 } = {}) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new KnowledgeEvolutionError('KNOWLEDGE_EVOLUTION_SCHEMA_INVALID', `${name} invalid`);
  return value.trim();
}
export function requirePlainObject(value, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new KnowledgeEvolutionError('KNOWLEDGE_EVOLUTION_SCHEMA_INVALID', `${name} must be object`);
  return value;
}
export function requireNoUnknownKeys(value, allowed, name) {
  for (const key of Object.keys(value)) if (!allowed.includes(key)) throw new KnowledgeEvolutionError('KNOWLEDGE_EVOLUTION_SCHEMA_INVALID', `${name}.${key} is not allowed`);
}
export function parseIso(value, name) {
  requireNonEmptyString(value, name, { max: 128 });
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) throw new KnowledgeEvolutionError('KNOWLEDGE_EVOLUTION_SCHEMA_INVALID', `${name} must be ISO date-time`);
  return new Date(ms).toISOString();
}
export function safeRecordId(value, name = 'id') {
  const v = requireNonEmptyString(value, name, { max: 128 });
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(v) || v.includes('..')) throw new KnowledgeEvolutionError('KNOWLEDGE_EVOLUTION_ID_INVALID', `${name} unsafe`);
  return v;
}
export function safeArchivePath(name) {
  if (typeof name !== 'string' || !name || name.includes('\0')) throw new KnowledgeEvolutionError('KNOWLEDGE_SNAPSHOT_PATH_INVALID');
  const normalized = name.replaceAll('\\', '/');
  if (normalized.startsWith('/') || /^[A-Za-z]:\//.test(normalized)) throw new KnowledgeEvolutionError('KNOWLEDGE_SNAPSHOT_PATH_ESCAPE', name);
  const pieces = normalized.split('/').filter(Boolean);
  if (pieces.some(p => p === '..')) throw new KnowledgeEvolutionError('KNOWLEDGE_SNAPSHOT_PATH_ESCAPE', name);
  return pieces.join('/');
}
export function confineOutput(root, ...parts) {
  const base = path.resolve(root);
  const target = path.resolve(base, ...parts);
  if (target !== base && !target.startsWith(base + path.sep)) throw new KnowledgeEvolutionError('KNOWLEDGE_INTAKE_PATH_ESCAPE');
  return target;
}
export function nowIso(clock = () => new Date()) {
  const value = clock();
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) throw new KnowledgeEvolutionError('KNOWLEDGE_EVOLUTION_CLOCK_INVALID');
  return d.toISOString();
}
