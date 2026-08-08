import { createHash, randomUUID } from 'node:crypto';
import { SecurityError } from './errors.mjs';

export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object' && !Buffer.isBuffer(value) && !(value instanceof Date)) {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value instanceof Date ? value.toISOString() : value;
}
export const stable = (value) => JSON.stringify(canonicalize(value));
export const sha256Hex = (value) => createHash('sha256').update(Buffer.isBuffer(value) ? value : Buffer.from(typeof value === 'string' ? value : stable(value))).digest('hex');
export const sha256 = (value) => `sha256:${sha256Hex(value)}`;
export const id = (prefix) => `${prefix}-${randomUUID()}`;
export function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}
export function requireString(value, name, code = 'SECURITY_INPUT_INVALID') {
  if (typeof value !== 'string' || !value.trim()) throw new SecurityError(code, `${name} is required`);
  return value.trim();
}
export function requireSafeId(value, name = 'id') {
  const v = requireString(value, name);
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(v) || v.includes('..')) throw new SecurityError('SECURITY_ID_INVALID', `${name} is invalid`);
  return v;
}
export function nowIso(clock = () => new Date()) {
  const raw = clock();
  const d = raw instanceof Date ? raw : new Date(raw);
  if (Number.isNaN(d.getTime())) throw new SecurityError('SECURITY_CLOCK_INVALID');
  return d.toISOString();
}
