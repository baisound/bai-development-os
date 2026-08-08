import { randomUUID } from 'node:crypto';
import { hostname } from 'node:os';
import { open, readFile, rm } from 'node:fs/promises';
import { resolveExistingInside, resolveWritableInside } from '../security/path.mjs';
import { ReleaseError } from './errors.mjs';
import { safeId } from './util.mjs';
const relFor=(id)=>`.bai-os/release/locks/${id}.lock`;
export async function readReleaseLockRecord(root,name){const id=safeId(name,'lock_name');let text;try{text=await readFile(await resolveExistingInside(root,relFor(id)),'utf8');}catch(e){if(e.code==='SECURITY_PATH_MISSING')return null;throw e;}try{const j=JSON.parse(text);if(j?.release_lock_version&&Number.isInteger(j.pid))return j;}catch{/* legacy below */}const pid=Number(text.trim());return {release_lock_version:'LEGACY',lock_name:id,pid:Number.isInteger(pid)?pid:null,host:null,owner_token:null,acquired_at:null};}
export async function withReleaseLock(root,name,fn,{clock=()=>new Date()}={}){
  const id=safeId(name,'lock_name'); const rel=relFor(id); const file=await resolveWritableInside(root,rel); let h;
  const acquired=(clock() instanceof Date?clock():new Date(clock())).toISOString();
  const record={release_lock_version:'1.1.0',lock_name:id,pid:process.pid,host:hostname(),owner_token:randomUUID(),acquired_at:acquired};
  try{h=await open(file,'wx',0o600);await h.writeFile(`${JSON.stringify(record)}\n`);await h.sync();}
  catch(e){if(e.code==='EEXIST')throw new ReleaseError('RELEASE_OPERATION_BUSY',`release lock busy: ${id}`);throw e;}
  try{return await fn(record);}finally{try{await h?.close();}finally{await rm(file,{force:true});}}
}
