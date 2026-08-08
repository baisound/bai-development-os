import { createHash, randomUUID } from 'node:crypto';
import { CalibrationError } from './errors.mjs';

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object' && !(value instanceof Date) && !Buffer.isBuffer(value)) {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  if (value instanceof Date) return value.toISOString();
  return value;
}
export const stableStringify = (value) => JSON.stringify(canonicalize(value));
export const sha256 = (value) => `sha256:${createHash('sha256').update(Buffer.isBuffer(value) ? value : Buffer.from(typeof value === 'string' ? value : stableStringify(value))).digest('hex')}`;
export function checksumObject(value, excluded = ['content_checksum']) {
  const clone = structuredClone(value);
  for (const key of excluded) delete clone[key];
  return sha256(clone);
}
export function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value)) deepFreeze(nested);
  }
  return value;
}
export const newId = (prefix) => `${prefix}-${randomUUID()}`;
export function nowIso(clock = () => new Date()) {
  const raw = clock();
  const date = raw instanceof Date ? raw : new Date(raw);
  if (Number.isNaN(date.getTime())) throw new CalibrationError('CALIBRATION_CLOCK_INVALID');
  return date.toISOString();
}
export function requireString(value, name) {
  if (typeof value !== 'string' || !value.trim()) throw new CalibrationError('CALIBRATION_INPUT_INVALID', `${name} is required`);
  return value.trim();
}
export function safeId(value, name = 'id') {
  const id = requireString(value, name);
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(id) || id.includes('..')) throw new CalibrationError('CALIBRATION_ID_INVALID', `${name} invalid`);
  return id;
}
export function requireEnum(value, allowed, name) {
  if (!allowed.includes(value)) throw new CalibrationError('CALIBRATION_ENUM_INVALID', `${name} must be one of ${allowed.join(', ')}`);
  return value;
}
export function requireFiniteNumber(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new CalibrationError('CALIBRATION_NUMBER_INVALID', `${name} must be finite`);
  return value;
}
export const clamp = (value, min = -Infinity, max = Infinity) => Math.min(max, Math.max(min, value));
export function quantile(values, q) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 1) return sorted[0];
  const pos = (sorted.length - 1) * q;
  const low = Math.floor(pos);
  const high = Math.ceil(pos);
  if (low === high) return sorted[low];
  const weight = pos - low;
  return sorted[low] * (1 - weight) + sorted[high] * weight;
}
export const round = (value, digits = 6) => Number(value.toFixed(digits));
export function getPath(object, dotted, fallback = undefined) {
  let current = object;
  for (const segment of dotted.split('.')) {
    if (current == null || typeof current !== 'object' || !(segment in current)) return fallback;
    current = current[segment];
  }
  return current;
}
