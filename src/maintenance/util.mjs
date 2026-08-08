import { createHash, randomUUID } from 'node:crypto';
import { MaintenanceError } from './errors.mjs';
function canonicalize(v){ if(Array.isArray(v)) return v.map(canonicalize); if(v&&typeof v==='object'&&!(v instanceof Date)&&!Buffer.isBuffer(v)) return Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonicalize(v[k])])); return v instanceof Date?v.toISOString():v; }
export const stable=(v)=>JSON.stringify(canonicalize(v));
export const sha256=(v)=>`sha256:${createHash('sha256').update(Buffer.isBuffer(v)?v:Buffer.from(typeof v==='string'?v:stable(v))).digest('hex')}`;
export function deepFreeze(v){ if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))deepFreeze(x);}return v; }
export const newId=(prefix)=>`${prefix}-${randomUUID()}`;
export function nowIso(clock=()=>new Date()){const raw=clock();const d=raw instanceof Date?raw:new Date(raw);if(Number.isNaN(d.getTime()))throw new MaintenanceError('MAINTENANCE_CLOCK_INVALID');return d.toISOString();}
export function requireString(v,name){if(typeof v!=='string'||!v.trim())throw new MaintenanceError('MAINTENANCE_INPUT_INVALID',`${name} is required`);return v.trim();}
export function safeId(v,name='id'){const s=requireString(v,name);if(!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(s)||s.includes('..'))throw new MaintenanceError('MAINTENANCE_ID_INVALID',`${name} invalid`);return s;}
export function ageMs(iso,clock=()=>new Date()){const t=Date.parse(iso);if(!Number.isFinite(t))return Infinity;const n=(clock() instanceof Date?clock():new Date(clock())).getTime();return Math.max(0,n-t);}
