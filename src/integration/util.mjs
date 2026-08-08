import { createHash, randomUUID } from 'node:crypto';
export class IntegrationError extends Error { constructor(code,message=code,details=null){super(message);this.code=code;this.details=details;} }
function sort(value){ if(Array.isArray(value))return value.map(sort); if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,sort(value[k])])); return value; }
export const stable=(v)=>JSON.stringify(sort(v));
export const sha256=(v)=>`sha256:${createHash('sha256').update(Buffer.isBuffer(v)?v:String(v)).digest('hex')}`;
export const checksumObject=(value,omit=['content_checksum'])=>{const c=structuredClone(value);for(const k of omit)delete c[k];return sha256(stable(c));};
export const deepFreeze=(value)=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const v of Object.values(value))deepFreeze(v);}return value;};
export const id=(prefix)=>`${prefix}-${randomUUID()}`;
export const requireString=(v,n)=>{if(typeof v!=='string'||!v.trim())throw new IntegrationError('INTEGRATION_INPUT_INVALID',n);return v.trim();};
export const nowIso=(clock=()=>new Date())=>{const v=clock();const d=v instanceof Date?v:new Date(v);if(Number.isNaN(d.getTime()))throw new IntegrationError('INTEGRATION_CLOCK_INVALID');return d.toISOString();};
export const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
export function redact(value,sensitiveKeys=[]){const keys=new Set(sensitiveKeys.map(x=>String(x).toLowerCase()));function walk(v){if(Array.isArray(v))return v.map(walk);if(v&&typeof v==='object'){const out={};for(const [k,x] of Object.entries(v)){out[k]=keys.has(k.toLowerCase())?'[REDACTED]':walk(x);}return out;}return v;}return walk(value);}
export function hasForbiddenSecretMaterial(value,keys){let found=false;const set=new Set(keys.map(x=>x.toLowerCase()));function walk(v){if(found||v==null)return;if(Array.isArray(v)){for(const x of v)walk(x);return;}if(typeof v==='object'){for(const [k,x] of Object.entries(v)){if(set.has(k.toLowerCase())&&typeof x==='string'&&x.trim()){found=true;return;}walk(x);}}}walk(value);return found;}

export function containsExactSecret(value,secret){if(secret==null)return false;const needles=[];const collect=v=>{if(v==null)return;if(typeof v==='string'&&v.length>=4)needles.push(v);else if(Array.isArray(v))v.forEach(collect);else if(typeof v==='object')Object.values(v).forEach(collect);};collect(secret);if(!needles.length)return false;let found=false;const walk=v=>{if(found||v==null)return;if(typeof v==='string'){if(needles.some(n=>v===n||v.includes(n)))found=true;return;}if(Array.isArray(v))v.forEach(walk);else if(typeof v==='object')Object.values(v).forEach(walk);};walk(value);return found;}
