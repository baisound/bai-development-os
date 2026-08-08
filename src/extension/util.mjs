import crypto from 'node:crypto';
import { ExtensionError } from './errors.mjs';
export function stable(value){ if(Array.isArray(value)) return value.map(stable); if(value&&typeof value==='object'){return Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])]))} return value; }
export function checksumObject(value){ const clone=structuredClone(value); delete clone.content_checksum; return crypto.createHash('sha256').update(JSON.stringify(stable(clone))).digest('hex'); }
export function deepFreeze(value){ if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value); for(const v of Object.values(value)) deepFreeze(v);} return value; }
export function req(value,name){if(typeof value!=='string'||!value.trim()) throw new ExtensionError('EXTENSION_INPUT_INVALID',name); return value.trim();}
export function uniq(values=[]){return [...new Set(values.map(String))].sort();}
export function nowIso(clock=()=>new Date()){return clock().toISOString();}
export function assertSafeId(v,name='id'){const x=req(v,name);if(!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(x))throw new ExtensionError('EXTENSION_ID_INVALID',name);return x;}
export function byteLength(v){return Buffer.byteLength(typeof v==='string'?v:JSON.stringify(v??null));}
