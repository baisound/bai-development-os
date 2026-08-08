import { createHash, randomUUID } from 'node:crypto';
import { DistributedError } from './errors.mjs';

export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object' && !Buffer.isBuffer(value) && !(value instanceof Date)) {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value instanceof Date ? value.toISOString() : value;
}
export const stableStringify = (value) => JSON.stringify(canonicalize(value));
export const sha256 = (value) => `sha256:${createHash('sha256').update(Buffer.isBuffer(value) ? value : Buffer.from(typeof value === 'string' ? value : stableStringify(value))).digest('hex')}`;
export function checksumObject(value, field = 'content_checksum') {
  const copy = structuredClone(value ?? {}); delete copy[field];
  for (const key of ['signature','signature_algorithm','key_id','signed_at','payload_checksum']) delete copy[key];
  return sha256(copy);
}
export function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value); for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}
export const newId = (prefix) => `${prefix}-${randomUUID()}`;
export function nowIso(clock = () => new Date()) {
  const raw = clock(); const date = raw instanceof Date ? raw : new Date(raw);
  if (Number.isNaN(date.getTime())) throw new DistributedError('DISTRIBUTED_CLOCK_INVALID');
  return date.toISOString();
}
export function requireString(value, name) {
  if (typeof value !== 'string' || !value.trim()) throw new DistributedError('DISTRIBUTED_INPUT_INVALID', `${name} is required`);
  return value.trim();
}
export function safeId(value, name = 'id') {
  const v = requireString(value, name);
  if (!/^[A-Za-z0-9][A-Za-z0-9._:@/-]{0,255}$/.test(v) || v.includes('..')) throw new DistributedError('DISTRIBUTED_ID_INVALID', name);
  return v;
}
export function requireFinite(value, name, { min = -Infinity, max = Infinity, integer = false } = {}) {
  if (!Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) throw new DistributedError('DISTRIBUTED_NUMBER_INVALID', name);
  return value;
}
export function requireEnum(value, allowed, name) {
  if (!allowed.includes(value)) throw new DistributedError('DISTRIBUTED_ENUM_INVALID', `${name}=${value}`);
  return value;
}
export function byteLength(value) { return Buffer.byteLength(stableStringify(value)); }
export function uniqSorted(values = []) { return [...new Set(values)].sort(); }
export function parseTime(value, code = 'DISTRIBUTED_TIME_INVALID') {
  const ms = typeof value === 'number' ? value : Date.parse(value);
  if (!Number.isFinite(ms)) throw new DistributedError(code);
  return ms;
}
