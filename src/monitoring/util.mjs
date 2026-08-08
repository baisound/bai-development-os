import { createHash, randomUUID } from 'node:crypto';
export class MonitoringError extends Error { constructor(code,message=code){super(message);this.code=code;} }
function sort(value){ if(Array.isArray(value))return value.map(sort); if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,sort(value[k])])); return value; }
export const stable=(value)=>JSON.stringify(sort(value));
export const sha256=(value)=>`sha256:${createHash('sha256').update(Buffer.isBuffer(value)?value:String(value)).digest('hex')}`;
export const checksumObject=(value,omit=['content_checksum'])=>{const c=structuredClone(value);for(const k of omit)delete c[k];return sha256(stable(c));};
export const deepFreeze=(value)=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const v of Object.values(value))deepFreeze(v);}return value;};
export const nowIso=(clock=()=>new Date())=>{const v=clock(); const d=v instanceof Date?v:new Date(v); if(Number.isNaN(d.getTime()))throw new MonitoringError('MONITORING_CLOCK_INVALID'); return d.toISOString();};
export const requireString=(v,n)=>{if(typeof v!=='string'||!v.trim())throw new MonitoringError('MONITORING_INPUT_INVALID',n);return v.trim();};
export const finite=(v,n,{min=-Infinity,max=Infinity}={})=>{if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)throw new MonitoringError('MONITORING_INPUT_INVALID',n);return v;};
export const ratio=(a,b)=>b>0?a/b:null;
export const avg=(xs)=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;
export const sum=(xs)=>xs.reduce((a,b)=>a+b,0);
export const id=(prefix)=>`${prefix}-${randomUUID()}`;
export const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
export const percent=(r)=>r==null?null:Math.round(r*10000)/100;
export const groupBy=(items,keyFn)=>{const m=new Map();for(const x of items){const k=keyFn(x);if(!m.has(k))m.set(k,[]);m.get(k).push(x);}return m;};

export const shortHash=(value,length=16)=>sha256(stable(value)).slice(7,7+length);
