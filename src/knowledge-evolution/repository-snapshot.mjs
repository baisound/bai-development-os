import { KnowledgeEvolutionError } from './errors.mjs';
import { deepFreeze, parseIso, requireNoUnknownKeys, requireNonEmptyString, requirePlainObject, safeArchivePath, safeRecordId } from './util.mjs';

const SHA=/^[a-f0-9]{40}(?:[a-f0-9]{24})?$/;
const TOP=['schema_version','snapshot_id','observed_at','vcs','repository_url','ref','commit_sha','tree_sha','development_os','consumer','validation','notes'];
function gitSha(value,name){const v=requireNonEmptyString(value,name,{max:64});if(!SHA.test(v))throw new KnowledgeEvolutionError('KNOWLEDGE_REPOSITORY_SNAPSHOT_SHA_INVALID',name);return v;}
function repositoryUrl(value){const raw=requireNonEmptyString(value,'repository_url',{max:512});let u;try{u=new URL(raw);}catch{throw new KnowledgeEvolutionError('KNOWLEDGE_REPOSITORY_SNAPSHOT_URL_INVALID');}if(u.protocol!=='https:'||u.username||u.password||u.hash)throw new KnowledgeEvolutionError('KNOWLEDGE_REPOSITORY_SNAPSHOT_URL_INVALID');return u.toString().replace(/\/$/,'');}
function nullableString(value,name,max=128){if(value===null||value===undefined)return null;return requireNonEmptyString(value,name,{max});}
export function validateRepositorySnapshotReference(value){
  const v=requirePlainObject(value,'repository_snapshot');requireNoUnknownKeys(v,TOP,'repository_snapshot');
  if(v.schema_version!=='1.0'||v.vcs!=='git')throw new KnowledgeEvolutionError('KNOWLEDGE_REPOSITORY_SNAPSHOT_VERSION_UNSUPPORTED');
  const d=requirePlainObject(v.development_os,'development_os');requireNoUnknownKeys(d,['version','architecture','commit'],'development_os');
  const c=requirePlainObject(v.consumer,'consumer');requireNoUnknownKeys(c,['project_id','task_id','version','commit'],'consumer');
  const validation=requirePlainObject(v.validation,'validation');requireNoUnknownKeys(validation,['tree_identity_verified','content_scan_status','key_files'],'validation');
  if(typeof validation.tree_identity_verified!=='boolean'||!['NONE','KEY_FILES_ONLY','FULL_TRACKED_CONTENT'].includes(validation.content_scan_status)||!Array.isArray(validation.key_files))throw new KnowledgeEvolutionError('KNOWLEDGE_REPOSITORY_SNAPSHOT_VALIDATION_INVALID');
  const seen=new Set();const keyFiles=validation.key_files.map((item,i)=>{const f=requirePlainObject(item,`key_files[${i}]`);requireNoUnknownKeys(f,['path','blob_id','size_bytes'],`key_files[${i}]`);const p=safeArchivePath(requireNonEmptyString(f.path,'path',{max:1024}));if(seen.has(p))throw new KnowledgeEvolutionError('KNOWLEDGE_REPOSITORY_SNAPSHOT_DUPLICATE_PATH',p);seen.add(p);if(f.size_bytes!==null&&f.size_bytes!==undefined&&(!Number.isInteger(f.size_bytes)||f.size_bytes<0))throw new KnowledgeEvolutionError('KNOWLEDGE_REPOSITORY_SNAPSHOT_SIZE_INVALID',p);return {path:p,blob_id:f.blob_id===null||f.blob_id===undefined?null:gitSha(f.blob_id,'blob_id'),size_bytes:f.size_bytes??null};});
  const consumerCommit=c.commit===null||c.commit===undefined?null:gitSha(c.commit,'consumer.commit');
  const devCommit=d.commit===null||d.commit===undefined?null:gitSha(d.commit,'development_os.commit');
  const commit=gitSha(v.commit_sha,'commit_sha');if(consumerCommit&&consumerCommit!==commit)throw new KnowledgeEvolutionError('KNOWLEDGE_REPOSITORY_SNAPSHOT_CONSUMER_COMMIT_MISMATCH');
  return deepFreeze({schema_version:'1.0',snapshot_id:safeRecordId(v.snapshot_id,'snapshot_id'),observed_at:parseIso(v.observed_at,'observed_at'),vcs:'git',repository_url:repositoryUrl(v.repository_url),ref:requireNonEmptyString(v.ref,'ref',{max:256}),commit_sha:commit,tree_sha:gitSha(v.tree_sha,'tree_sha'),development_os:{version:nullableString(d.version,'development_os.version'),architecture:nullableString(d.architecture,'development_os.architecture'),commit:devCommit},consumer:{project_id:requireNonEmptyString(c.project_id,'consumer.project_id',{max:128}),task_id:nullableString(c.task_id,'consumer.task_id'),version:nullableString(c.version,'consumer.version'),commit:consumerCommit},validation:{tree_identity_verified:validation.tree_identity_verified,content_scan_status:validation.content_scan_status,key_files:keyFiles},notes:v.notes===null||v.notes===undefined?null:requireNonEmptyString(v.notes,'notes',{max:4096})});
}
