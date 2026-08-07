import { createHash, randomUUID } from 'node:crypto';
import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
export class SystemSyncError extends Error { constructor(code,message=code){super(message);this.code=code;} }
const sha=(b)=>`sha256:${createHash('sha256').update(b).digest('hex')}`;
async function safeFile(root,rel){if(path.isAbsolute(rel)||rel.split('/').includes('..'))throw new SystemSyncError('SYSTEM_SYNC_UPDATE_INVALID',rel);const rr=await realpath(root);let target;try{target=await realpath(path.join(rr,rel));}catch{throw new SystemSyncError('SYSTEM_SYNC_FILE_MISSING',rel);}if(target!==rr&&!target.startsWith(rr+path.sep))throw new SystemSyncError('SYSTEM_SYNC_PATH_ESCAPE',rel);return target;}
export function createSystemSyncPlan({updates=[],policy_update_authorized=false,scope=[]}={}){
  if(!policy_update_authorized)throw new SystemSyncError('SYSTEM_SYNC_POLICY_AUTH_REQUIRED');if(!Array.isArray(updates)||!updates.length)throw new SystemSyncError('SYSTEM_SYNC_UPDATES_REQUIRED');
  const allowed=['README','COMMON','ROLE','TEMPLATE','REGISTRY','SCHEMA','PACKAGE'];for(const u of updates){if(!allowed.includes(u.kind)||typeof u.path!=='string'||!u.path||path.isAbsolute(u.path)||u.path.split('/').includes('..'))throw new SystemSyncError('SYSTEM_SYNC_UPDATE_INVALID');}
  return Object.freeze({sync_plan_version:'1.0.0',sync_id:randomUUID(),updates:Object.freeze(updates.map(x=>Object.freeze({...x}))),scope:Object.freeze([...scope]),policy_update_authorized:true});
}
export async function verifySystemSync(plan,{root}={}){
  if(!plan?.policy_update_authorized)throw new SystemSyncError('SYSTEM_SYNC_POLICY_AUTH_REQUIRED');const results=[];
  for(const u of plan.updates){const target=await safeFile(root,u.path);const body=await readFile(target);const checksum=sha(body);if(u.expected_checksum&&checksum!==u.expected_checksum)throw new SystemSyncError('SYSTEM_SYNC_CHECKSUM_MISMATCH',u.path);if(u.must_contain){const text=body.toString('utf8');for(const needle of u.must_contain)if(!text.includes(needle))throw new SystemSyncError('SYSTEM_SYNC_CONTENT_MISSING',`${u.path}:${needle}`);}results.push({path:u.path,checksum});}
  return Object.freeze({result:'SYSTEM_SYNC_VERIFIED',sync_id:plan.sync_id,files:Object.freeze(results)});
}
