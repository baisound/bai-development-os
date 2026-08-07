import { createHash, randomUUID } from 'node:crypto';
import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
export class ArchiveError extends Error { constructor(code,message=code){super(message);this.code=code;} }
const sha=async(file)=>`sha256:${createHash('sha256').update(await readFile(file)).digest('hex')}`;
async function safeFile(root,rel){if(path.isAbsolute(rel)||rel.split('/').includes('..'))throw new ArchiveError('ARCHIVE_PATH_INVALID');const rr=await realpath(root);let target;try{target=await realpath(path.join(rr,rel));}catch{throw new ArchiveError('ARCHIVE_FILE_MISSING',rel);}if(target!==rr&&!target.startsWith(rr+path.sep))throw new ArchiveError('ARCHIVE_PATH_INVALID',rel);return target;}
export async function createArchiveManifest({root,task_id,files,destination='IN_PLACE_READ_ONLY',retention='INDEFINITE',references=[],knowledge_provenance=[]},{clock=()=>new Date()}={}){
  if(!Array.isArray(files)||!files.length)throw new ArchiveError('ARCHIVE_FILES_REQUIRED');const entries=[];
  for(const rel of files){const target=await safeFile(root,rel);entries.push({path:rel,checksum:await sha(target)});}
  return Object.freeze({archive_manifest_version:'1.0.0',archive_id:randomUUID(),task_id,destination,retention,files:Object.freeze(entries),references:Object.freeze([...references]),knowledge_provenance:Object.freeze([...knowledge_provenance]),created_at:clock().toISOString()});
}
export async function verifyArchiveManifest(manifest,{root,existing_references=[]}={}){
  if(!manifest||manifest.archive_manifest_version!=='1.0.0')throw new ArchiveError('ARCHIVE_MANIFEST_INVALID');
  for(const e of manifest.files){const target=await safeFile(root,e.path);const actual=await sha(target);if(actual!==e.checksum)throw new ArchiveError('ARCHIVE_CHECKSUM_MISMATCH',e.path);}
  const available=new Set(existing_references);const missing=(manifest.references??[]).filter(r=>!available.has(r));if(missing.length)throw new ArchiveError('ARCHIVE_REFERENCE_BROKEN',missing.join(','));
  return Object.freeze({result:'ARCHIVE_VERIFIED',archive_id:manifest.archive_id,file_count:manifest.files.length});
}
export function evaluateArchiveReadiness({task_status,destination,manifest_verified=false,reference_integrity=false,knowledge_provenance=false,retention_defined=false,recovery_defined=false,post_archive_verify=false}={}){
  const missing=[];if(task_status!=='COMPLETED')missing.push('completion');if(!destination)missing.push('destination');if(!manifest_verified)missing.push('manifest');if(!reference_integrity)missing.push('references');if(!knowledge_provenance)missing.push('knowledge_provenance');if(!retention_defined)missing.push('retention');if(!recovery_defined)missing.push('recovery');if(!post_archive_verify)missing.push('post_archive_verify');
  return Object.freeze({result:missing.length?'ARCHIVE_NOT_READY':'ARCHIVE_READY',missing:Object.freeze(missing)});
}
