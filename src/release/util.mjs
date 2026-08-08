import { createHash, randomUUID } from 'node:crypto';
import { ReleaseError } from './errors.mjs';
export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object' && !Buffer.isBuffer(value) && !(value instanceof Date)) return Object.fromEntries(Object.keys(value).sort().map((k)=>[k, canonicalize(value[k])]));
  return value instanceof Date ? value.toISOString() : value;
}
export const stable = (v) => JSON.stringify(canonicalize(v));
export const sha256 = (v) => `sha256:${createHash('sha256').update(Buffer.isBuffer(v)?v:Buffer.from(typeof v === 'string'?v:stable(v))).digest('hex')}`;
export function deepFreeze(v) { if (v && typeof v === 'object' && !Object.isFrozen(v)) { Object.freeze(v); for (const x of Object.values(v)) deepFreeze(x); } return v; }
export function requireString(v, name) { if (typeof v !== 'string' || !v.trim()) throw new ReleaseError('RELEASE_INPUT_INVALID', `${name} is required`); return v.trim(); }
export function safeId(v, name='id') { const s=requireString(v,name); if(!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(s)||s.includes('..')) throw new ReleaseError('RELEASE_ID_INVALID', `${name} is invalid`); return s; }
export function nowIso(clock=()=>new Date()) { const raw=clock(); const d=raw instanceof Date?raw:new Date(raw); if(Number.isNaN(d.getTime())) throw new ReleaseError('RELEASE_CLOCK_INVALID'); return d.toISOString(); }
export const newId=(prefix)=>`${prefix}-${randomUUID()}`;
