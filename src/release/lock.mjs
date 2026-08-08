import { open, rm } from 'node:fs/promises';
import { resolveWritableInside } from '../security/path.mjs';
import { ReleaseError } from './errors.mjs';
import { safeId } from './util.mjs';
export async function withReleaseLock(root,name,fn){
  const id=safeId(name,'lock_name'); const rel=`.bai-os/release/locks/${id}.lock`; const file=await resolveWritableInside(root,rel); let h;
  try{h=await open(file,'wx',0o600);await h.writeFile(`${process.pid}\n`);await h.sync();}
  catch(e){if(e.code==='EEXIST')throw new ReleaseError('RELEASE_OPERATION_BUSY',`release lock busy: ${id}`);throw e;}
  try{return await fn();}finally{try{await h?.close();}finally{await rm(file,{force:true});}}
}
