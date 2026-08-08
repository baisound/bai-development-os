import { createHash, randomUUID } from 'node:crypto';
import { open, stat } from 'node:fs/promises';
import path from 'node:path';
import { resolveExistingInside as securityResolveExistingInside, resolveWritableInside as securityResolveWritableInside, secureAtomicWrite as securityAtomicWrite } from '../security/path.mjs';

export const stable = (value) => JSON.stringify(sort(value));
function sort(value){
  if(Array.isArray(value)) return value.map(sort);
  if(value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key)=>[key, sort(value[key])]));
  return value;
}
export const sha256 = (value) => `sha256:${createHash('sha256').update(Buffer.isBuffer(value) ? value : String(value)).digest('hex')}`;
export const checksumObject = (value, omit=['content_checksum']) => {
  const copy = structuredClone(value);
  for(const key of omit) delete copy[key];
  return sha256(stable(copy));
};
export const freeze = (value) => Object.freeze(value);
export const deepFreeze = (value) => {
  if(value && typeof value === 'object' && !Object.isFrozen(value)){
    Object.freeze(value);
    for(const item of Object.values(value)) deepFreeze(item);
  }
  return value;
};
export const requireString = (value, name, ErrorType, code='AUTOMATION_INPUT_INVALID') => {
  if(typeof value !== 'string' || !value.trim()) throw new ErrorType(code, `${name} is required`);
  return value.trim();
};
export const requireArray = (value, name, ErrorType, code='AUTOMATION_INPUT_INVALID') => {
  if(!Array.isArray(value)) throw new ErrorType(code, `${name} must be an array`);
  return value;
};
export const id = (prefix) => `${prefix}-${randomUUID()}`;
export const normalizeRel = (rel, ErrorType, code='PATH_INVALID') => {
  if(typeof rel !== 'string' || !rel.trim() || path.isAbsolute(rel) || rel.split(/[\\/]/).includes('..')) throw new ErrorType(code, String(rel));
  return rel.replaceAll('\\','/');
};
export async function resolveExistingInside(root, rel, ErrorType, {missingCode='PATH_MISSING', escapeCode='PATH_ESCAPE'}={}){
  const safe = normalizeRel(rel, ErrorType);
  try { return await securityResolveExistingInside(root, safe); }
  catch (error) {
    if (error?.code === 'SECURITY_PATH_MISSING' || error?.code === 'SECURITY_ROOT_MISSING') throw new ErrorType(missingCode, safe);
    if (error?.code?.startsWith('SECURITY_')) throw new ErrorType(escapeCode, safe);
    throw error;
  }
}
export async function resolveWritableInside(root, rel, ErrorType, {escapeCode='PATH_ESCAPE'}={}){
  const safe = normalizeRel(rel, ErrorType);
  try { return await securityResolveWritableInside(root, safe); }
  catch (error) {
    if (error?.code?.startsWith('SECURITY_')) throw new ErrorType(escapeCode, safe);
    throw error;
  }
}
export async function atomicWrite(root, rel, bytes, ErrorType){
  const safe = normalizeRel(rel, ErrorType);
  try { return await securityAtomicWrite(root, safe, bytes); }
  catch (error) {
    if (error?.code?.startsWith('SECURITY_')) throw new ErrorType('PATH_ESCAPE', safe);
    throw error;
  }
}
export async function fileMeta(target){
  const s = await stat(target);
  return {size_bytes:s.size, mtime_ms:Math.trunc(s.mtimeMs)};
}
