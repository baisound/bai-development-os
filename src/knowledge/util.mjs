import crypto from 'node:crypto';
import path from 'node:path';
import { lstat, realpath } from 'node:fs/promises';
import { KnowledgeError } from './errors.mjs';

export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(k => [k, canonicalize(value[k])]));
  }
  return value;
}
export function canonicalJson(value) { return JSON.stringify(canonicalize(value)); }
export function sha256(value) { return crypto.createHash('sha256').update(typeof value === 'string' ? value : canonicalJson(value)).digest('hex'); }
export function checksumObject(obj, ignored = ['checksum']) {
  const copy = structuredClone(obj);
  for (const key of ignored) delete copy[key];
  return `sha256:${sha256(copy)}`;
}
export function requireString(value, name) {
  if (typeof value !== 'string' || !value.trim()) throw new KnowledgeError('KNOWLEDGE_SCHEMA_INVALID', `${name} is required`);
  return value.trim();
}
export function requireArray(value, name) {
  if (!Array.isArray(value)) throw new KnowledgeError('KNOWLEDGE_SCHEMA_INVALID', `${name} must be an array`);
  return value;
}
export function requireEnum(value, allowed, name) {
  if (!allowed.includes(value)) throw new KnowledgeError('KNOWLEDGE_SCHEMA_INVALID', `${name} invalid`, { value, allowed });
  return value;
}
export function requireNumber(value, name, min = -Infinity, max = Infinity) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new KnowledgeError('KNOWLEDGE_SCHEMA_INVALID', `${name} invalid`);
  return value;
}
export function parseTime(value, name, { nullable = false } = {}) {
  if ((value === null || value === undefined || value === '') && nullable) return null;
  requireString(value, name);
  const time = Date.parse(value);
  if (!Number.isFinite(time)) throw new KnowledgeError('KNOWLEDGE_SCHEMA_INVALID', `${name} must be ISO date/time`);
  return time;
}
export function nowIso(clock = () => new Date()) {
  const v = clock();
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) throw new KnowledgeError('KNOWLEDGE_CLOCK_INVALID');
  return d.toISOString();
}
export function safeId(id, name = 'id') {
  const value = requireString(id, name);
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value) || value.includes('..')) throw new KnowledgeError('KNOWLEDGE_ID_INVALID', `${name} contains unsafe characters`);
  return value;
}
export function confinePath(root, ...parts) {
  const base = path.resolve(root);
  const target = path.resolve(base, ...parts);
  if (target !== base && !target.startsWith(base + path.sep)) throw new KnowledgeError('KNOWLEDGE_PATH_ESCAPE');
  return target;
}

export async function assertRealContained(root, target, { allowMissing = false } = {}) {
  const basePath = path.resolve(root);
  const targetPath = path.resolve(target);
  const base = await realpath(basePath);
  let actual;
  try {
    actual = await realpath(targetPath);
  } catch (error) {
    if (!(allowMissing && error.code === 'ENOENT')) throw error;
    // A dangling symlink is still unsafe even though realpath reports ENOENT.
    try {
      const info = await lstat(targetPath);
      if (info.isSymbolicLink()) throw new KnowledgeError('KNOWLEDGE_PATH_ESCAPE');
    } catch (lstatError) {
      if (lstatError.code !== 'ENOENT') throw lstatError;
    }
    const parent = await realpath(path.dirname(targetPath));
    if (parent !== base && !parent.startsWith(base + path.sep)) throw new KnowledgeError('KNOWLEDGE_PATH_ESCAPE');
    return targetPath;
  }
  if (actual !== base && !actual.startsWith(base + path.sep)) throw new KnowledgeError('KNOWLEDGE_PATH_ESCAPE');
  return actual;
}

export function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}
