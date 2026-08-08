import { readFile, writeFile, mkdir, open, rm } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { deepFreeze, normalizeRel, resolveWritableInside, stable } from './util.mjs';
export class DerivedSyncError extends Error { constructor(code,message=code){super(message);this.code=code;} }
const hash=(v)=>`sha256:${createHash('sha256').update(stable(v)).digest('hex')}`;
export function validateVerifiedOutboxEvent(event,canonicalRead){
  if(!event||event.source!=='VERIFIED_DURABLE_OUTBOX'||event.gate_result!=='PASS'||!event.idempotency_key||!event.task_id) throw new DerivedSyncError('OUTBOX_EVENT_UNVERIFIED');
  if(!canonicalRead||canonicalRead.result!=='CANONICAL_READ_VERIFIED'||canonicalRead.task_id!==event.task_id) throw new DerivedSyncError('OUTBOX_CANONICAL_READ_INVALID');
  if(event.completed_revision!==canonicalRead.revision||event.canonical_checksum!==canonicalRead.checksum) throw new DerivedSyncError('OUTBOX_CANONICAL_BINDING_MISMATCH');
  return deepFreeze({result:'OUTBOX_EVENT_VERIFIED',task_id:event.task_id,idempotency_key:event.idempotency_key});
}
async function withLock(root,fn){const rel='.bai-os/automation/derived-sync.lock';const lock=await resolveWritableInside(root,rel,DerivedSyncError,{escapeCode:'OUTBOX_PATH_ESCAPE'});await mkdir(path.dirname(lock),{recursive:true});let h;try{h=await open(lock,'wx');}catch(e){if(e.code==='EEXIST')throw new DerivedSyncError('OUTBOX_CONSUMER_BUSY');throw e;}try{return await fn();}finally{await h.close();await rm(lock,{force:true});}}
export async function consumeDerivedSyncOutbox(root,{event,canonical_read,owner_authorized=false,consumer}={}){
  validateVerifiedOutboxEvent(event,canonical_read); if(!owner_authorized) throw new DerivedSyncError('OUTBOX_CONSUMER_NOT_AUTHORIZED'); if(typeof consumer!=='function') throw new DerivedSyncError('OUTBOX_CONSUMER_INVALID');
  return withLock(root,async()=>{const ackRel='.bai-os/automation/derived-sync-acks.jsonl';const ackPath=await resolveWritableInside(root,ackRel,DerivedSyncError,{escapeCode:'OUTBOX_PATH_ESCAPE'});let text='';try{text=await readFile(ackPath,'utf8');}catch(e){if(e.code!=='ENOENT')throw e;}const rows=text.trim()?text.trim().split('\n').map(JSON.parse):[];const existing=rows.find(x=>x.idempotency_key===event.idempotency_key);if(existing)return deepFreeze({result:'DERIVED_SYNC_ALREADY_ACKNOWLEDGED',ack:existing,canonical_completion_rolled_back:false});
    let derived_result; try{derived_result=await consumer({event,canonical_read});}catch(error){return deepFreeze({result:'DERIVED_SYNC_PENDING',error:error.message,idempotency_key:event.idempotency_key,canonical_completion_rolled_back:false});}
    const ack={ack_version:'1.0.0',task_id:event.task_id,idempotency_key:event.idempotency_key,canonical_checksum:event.canonical_checksum,derived_result,ack_checksum:null};ack.ack_checksum=hash({...ack,ack_checksum:null});await writeFile(ackPath,`${JSON.stringify(ack)}\n`,{encoding:'utf8',flag:'a'});return deepFreeze({result:'DERIVED_SYNC_ACKNOWLEDGED',ack,canonical_completion_rolled_back:false});});
}
