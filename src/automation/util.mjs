import { createHash, randomUUID } from 'node:crypto';
import { lstat, mkdir, open, realpath, rename, stat } from 'node:fs/promises';
import path from 'node:path';

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
  const rr = await realpath(root);
  let target;
  try { target = await realpath(path.join(rr, safe)); } catch { throw new ErrorType(missingCode, safe); }
  if(target !== rr && !target.startsWith(rr + path.sep)) throw new ErrorType(escapeCode, safe);
  return target;
}
export async function resolveWritableInside(root, rel, ErrorType, {escapeCode='PATH_ESCAPE'}={}){
  const safe = normalizeRel(rel, ErrorType);
  const rr = await realpath(root);
  const candidate = path.join(rr, safe);
  const parent = path.dirname(candidate);
  await mkdir(parent, {recursive:true});
  const rp = await realpath(parent);
  if(rp !== rr && !rp.startsWith(rr + path.sep)) throw new ErrorType(escapeCode, safe);
  try {
    const s = await lstat(candidate);
    if(s.isSymbolicLink()) throw new ErrorType(escapeCode, safe);
    const actual = await realpath(candidate);
    if(actual !== rr && !actual.startsWith(rr + path.sep)) throw new ErrorType(escapeCode, safe);
  } catch (error) {
    if(error instanceof ErrorType) throw error;
    if(error?.code !== 'ENOENT') throw error;
  }
  return candidate;
}
export async function atomicWrite(root, rel, bytes, ErrorType){
  const target = await resolveWritableInside(root, rel, ErrorType);
  const temp = `${target}.tmp-${process.pid}-${Date.now()}`;
  const handle = await open(temp, 'wx', 0o600);
  try { await handle.writeFile(bytes); await handle.sync(); } finally { await handle.close(); }
  await rename(temp, target);
  const dir = await open(path.dirname(target), 'r');
  try { await dir.sync(); } finally { await dir.close(); }
  return target;
}
export async function fileMeta(target){
  const s = await stat(target);
  return {size_bytes:s.size, mtime_ms:Math.trunc(s.mtimeMs)};
}
