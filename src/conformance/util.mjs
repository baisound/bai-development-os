import { createHash, randomUUID } from 'node:crypto';
import { ConformanceError } from './errors.mjs';

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object' && !(value instanceof Date) && !Buffer.isBuffer(value)) {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value instanceof Date ? value.toISOString() : value;
}
export const stable = (value) => JSON.stringify(canonicalize(value));
export const sha256 = (value) => `sha256:${createHash('sha256').update(Buffer.isBuffer(value) ? value : Buffer.from(typeof value === 'string' ? value : stable(value))).digest('hex')}`;
export function deepFreeze(value) { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); for (const item of Object.values(value)) deepFreeze(item); } return value; }
export function requireString(value, name) { if (typeof value !== 'string' || !value.trim()) throw new ConformanceError('CONFORMANCE_INPUT_INVALID', `${name} is required`); return value.trim(); }
export function safeId(value, name = 'id') { const v = requireString(value, name); if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(v) || v.includes('..')) throw new ConformanceError('CONFORMANCE_ID_INVALID', `${name} is invalid`); return v; }
export function nowIso(clock = () => new Date()) { const raw = clock(); const d = raw instanceof Date ? raw : new Date(raw); if (Number.isNaN(d.getTime())) throw new ConformanceError('CONFORMANCE_CLOCK_INVALID'); return d.toISOString(); }
export const newId = (prefix) => `${prefix}-${randomUUID()}`;
export const uniq = (items) => [...new Set(items)];
export const sortStrings = (items) => [...items].sort((a,b)=>String(a).localeCompare(String(b)));
export function finite(value, name, { min = -Infinity, max = Infinity } = {}) { if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new ConformanceError('CONFORMANCE_INPUT_INVALID', `${name} is invalid`); return value; }
