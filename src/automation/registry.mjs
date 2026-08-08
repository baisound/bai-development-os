import { createHash } from 'node:crypto';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { atomicWrite, checksumObject, deepFreeze, normalizeRel, resolveExistingInside, stable } from './util.mjs';

export class WorkspaceRegistryError extends Error { constructor(code,message=code){super(message);this.code=code;} }
const CATEGORY_ROOTS = Object.freeze([
  ['PROJECT','PROJECT.md'], ['TASK','tasks'], ['SPECIFICATION','specifications'], ['ROLE','roles'], ['TEMPLATE','templates'],
  ['SCHEMA','schemas'], ['ARCHITECTURE','architecture'], ['REGISTRY','registry'], ['KNOWLEDGE','knowledge'], ['CONNECTOR','connectors'],
]);
const hash = (b)=>`sha256:${createHash('sha256').update(b).digest('hex')}`;
const docId = (category,rel)=>`${category.toLowerCase()}:${rel.replace(/[^A-Za-z0-9._/-]+/g,'-').toLowerCase()}`;
const authorityFor = (rel,category) => {
  if(category==='REGISTRY') return 'INDEX_OR_DERIVED_VIEW';
  if(rel.includes('/evidence/') || /review|report|decision|record/i.test(path.basename(rel))) return 'HISTORICAL_OR_OPERATIONAL_EVIDENCE';
  if(/\.summary\.md$/i.test(rel)) return 'SUMMARY';
  if(/\.docx$/i.test(rel)) return 'HUMAN_CANONICAL_COMPANION';
  if(['SPECIFICATION','ARCHITECTURE'].includes(category) && /\.md$/i.test(rel)) return 'MACHINE_CANONICAL_OR_BASELINE';
  return 'DISCOVERED_ASSET';
};
async function walk(root, rel=''){
  const abs = rel ? path.join(root,rel) : root; let entries=[];
  try { entries=await readdir(abs,{withFileTypes:true}); } catch(error){ if(error.code==='ENOENT') return []; throw error; }
  const out=[];
  for(const entry of entries.sort((a,b)=>a.name.localeCompare(b.name))){
    if(entry.name==='.git' || entry.name==='node_modules' || entry.name==='dist') continue;
    const child=rel?`${rel}/${entry.name}`:entry.name;
    if(entry.isDirectory()) out.push(...await walk(root,child));
    else if(entry.isFile()) out.push(child);
  }
  return out;
}
async function entryFor(root, category, rel){
  const target=await resolveExistingInside(root,rel,WorkspaceRegistryError,{missingCode:'REGISTRY_SOURCE_MISSING',escapeCode:'REGISTRY_PATH_ESCAPE'});
  const [body,s]=await Promise.all([readFile(target),stat(target)]);
  return {entry_id:docId(category,rel),category,path:rel,sha256:hash(body),size_bytes:s.size,mtime_ms:Math.trunc(s.mtimeMs),authority:authorityFor(rel,category),status:'CURRENT'};
}
export async function rebuildWorkspaceRegistry(root,{include_extensions=null,clock=()=>new Date()}={}){
  const rr=await resolveExistingInside(root,'PROJECT.md',WorkspaceRegistryError,{missingCode:'REGISTRY_PROJECT_MANIFEST_MISSING',escapeCode:'REGISTRY_PATH_ESCAPE'}).then(()=>root);
  const all=[];
  for(const [category,anchor] of CATEGORY_ROOTS){
    if(anchor==='PROJECT.md') { all.push(await entryFor(rr,category,anchor)); continue; }
    const files=await walk(rr,anchor);
    for(const rel of files){ if(include_extensions && !include_extensions.some(ext=>rel.endsWith(ext))) continue; all.push(await entryFor(rr,category,rel)); }
  }
  const ids=new Set();
  for(const e of all){ if(ids.has(e.entry_id)) throw new WorkspaceRegistryError('REGISTRY_DUPLICATE_ID',e.entry_id); ids.add(e.entry_id); }
  const registry={registry_schema_version:'1.0.0',registry_id:'BAI-WORKSPACE-REGISTRY',root_identity:path.basename(path.resolve(root)),entries:all.sort((a,b)=>a.entry_id.localeCompare(b.entry_id)),generated_at:clock().toISOString(),content_authority:false};
  registry.content_checksum=checksumObject(registry);
  return deepFreeze(registry);
}
export async function verifyWorkspaceRegistry(root,registry,{clock=()=>new Date()}={}){
  if(!registry || registry.registry_schema_version!=='1.0.0' || registry.content_checksum!==checksumObject(registry)) throw new WorkspaceRegistryError('REGISTRY_TAMPERED');
  const seen=new Set(); const results=[];
  for(const entry of registry.entries){
    if(seen.has(entry.entry_id)) throw new WorkspaceRegistryError('REGISTRY_DUPLICATE_ID',entry.entry_id); seen.add(entry.entry_id);
    const target=await resolveExistingInside(root,entry.path,WorkspaceRegistryError,{missingCode:'REGISTRY_SOURCE_MISSING',escapeCode:'REGISTRY_PATH_ESCAPE'});
    const body=await readFile(target); const s=await stat(target); const actual=hash(body);
    if(actual!==entry.sha256) throw new WorkspaceRegistryError('REGISTRY_HASH_MISMATCH',entry.path);
    if(s.size!==entry.size_bytes) throw new WorkspaceRegistryError('REGISTRY_SIZE_MISMATCH',entry.path);
    results.push({entry_id:entry.entry_id,path:entry.path,result:'VERIFIED'});
  }
  return deepFreeze({result:'WORKSPACE_REGISTRY_VERIFIED',verified_at:clock().toISOString(),entry_count:results.length,entries:results});
}
export function resolveRegistryEntries(registry,{category=null,entry_id=null,path:requestedPath=null,authority=null,limit=50}={}){
  if(!registry?.entries) throw new WorkspaceRegistryError('REGISTRY_INVALID');
  if(!Number.isInteger(limit)||limit<1||limit>500) throw new WorkspaceRegistryError('REGISTRY_QUERY_INVALID','limit');
  let rows=registry.entries;
  if(category) rows=rows.filter(x=>x.category===category);
  if(entry_id) rows=rows.filter(x=>x.entry_id===entry_id);
  if(requestedPath) rows=rows.filter(x=>x.path===requestedPath);
  if(authority) rows=rows.filter(x=>x.authority===authority);
  if((entry_id||requestedPath) && rows.length>1) throw new WorkspaceRegistryError('REGISTRY_AMBIGUOUS_RESOLUTION');
  return deepFreeze(rows.slice(0,limit).map(x=>structuredClone(x)));
}
export function createRegistryUpdateProposal({reason,source_evidence=[],changes=[],requested_by,owner_approval_required=true}={}){
  if(typeof reason!=='string'||!reason.trim()||typeof requested_by!=='string'||!requested_by.trim()||!Array.isArray(changes)||!changes.length) throw new WorkspaceRegistryError('REGISTRY_UPDATE_PROPOSAL_INVALID');
  return deepFreeze({proposal_version:'1.0.0',type:'REGISTRY_UPDATE_PROPOSAL',reason,source_evidence:[...source_evidence],changes:changes.map(x=>structuredClone(x)),requested_by,owner_approval_required:Boolean(owner_approval_required),registry_is_content_authority:false});
}
export async function persistWorkspaceRegistry(root,registry,{relative_path='.bai-os/workspace-registry.json',authorized=false}={}){
  if(!authorized) throw new WorkspaceRegistryError('REGISTRY_WRITE_NOT_AUTHORIZED');
  normalizeRel(relative_path,WorkspaceRegistryError,'REGISTRY_PATH_INVALID');
  await verifyWorkspaceRegistry(root,registry);
  await atomicWrite(root,relative_path,Buffer.from(`${JSON.stringify(registry,null,2)}\n`),WorkspaceRegistryError);
  return deepFreeze({result:'WORKSPACE_REGISTRY_SNAPSHOT_PERSISTED',path:relative_path,checksum:registry.content_checksum});
}
export function diffWorkspaceRegistry(previous,next){
  if(!previous?.entries||!next?.entries) throw new WorkspaceRegistryError('REGISTRY_INVALID');
  const a=new Map(previous.entries.map(x=>[x.entry_id,x])); const b=new Map(next.entries.map(x=>[x.entry_id,x]));
  const added=[],removed=[],changed=[];
  for(const [id,row] of b){ if(!a.has(id)) added.push(id); else if(stable(a.get(id))!==stable(row)) changed.push(id); }
  for(const id of a.keys()) if(!b.has(id)) removed.push(id);
  return deepFreeze({added,removed,changed,requires_authorized_update:Boolean(added.length||removed.length||changed.length)});
}

export async function buildWorkspaceProjectIndex({workspace_root,projects=[]},{clock=()=>new Date()}={}){
  if(!workspace_root || !Array.isArray(projects) || !projects.length) throw new WorkspaceRegistryError('PROJECT_INDEX_INPUT_INVALID');
  const workspaceReal=await import('node:fs/promises').then(({realpath})=>realpath(workspace_root)).catch(()=>{throw new WorkspaceRegistryError('WORKSPACE_ROOT_MISSING');});
  const rows=[]; const ids=new Set(); const roots=new Set();
  for(const project of projects){
    if(typeof project.project_id!=='string'||!project.project_id.trim()||typeof project.root!=='string'||!project.root.trim()) throw new WorkspaceRegistryError('PROJECT_INDEX_INPUT_INVALID');
    if(ids.has(project.project_id)) throw new WorkspaceRegistryError('PROJECT_INDEX_DUPLICATE_ID',project.project_id); ids.add(project.project_id);
    const projectReal=await import('node:fs/promises').then(({realpath})=>realpath(project.root)).catch(()=>{throw new WorkspaceRegistryError('PROJECT_INDEX_ROOT_MISSING',project.root);});
    if(projectReal!==workspaceReal&&!projectReal.startsWith(workspaceReal+path.sep)) throw new WorkspaceRegistryError('PROJECT_INDEX_ROOT_ESCAPE',project.root);
    if(roots.has(projectReal)) throw new WorkspaceRegistryError('PROJECT_INDEX_DUPLICATE_ROOT',projectReal); roots.add(projectReal);
    const manifest=await resolveExistingInside(projectReal,project.manifest_path??'PROJECT.md',WorkspaceRegistryError,{missingCode:'PROJECT_INDEX_MANIFEST_MISSING',escapeCode:'PROJECT_INDEX_PATH_ESCAPE'}); const body=await readFile(manifest);
    rows.push({project_id:project.project_id,root:projectReal,manifest_path:project.manifest_path??'PROJECT.md',manifest_sha256:hash(body),status:project.status??'ACTIVE',consumer:project.consumer!==false,tags:[...(project.tags??[])]});
  }
  const index={project_index_version:'1.0.0',workspace_root:workspaceReal,projects:rows.sort((a,b)=>a.project_id.localeCompare(b.project_id)),generated_at:clock().toISOString(),content_authority:false}; index.content_checksum=checksumObject(index); return deepFreeze(index);
}
export function resolveWorkspaceProject(projectIndex,project_id){
  if(!projectIndex?.projects||typeof project_id!=='string'||!project_id) throw new WorkspaceRegistryError('PROJECT_INDEX_QUERY_INVALID'); const matches=projectIndex.projects.filter(x=>x.project_id===project_id);
  if(matches.length!==1) throw new WorkspaceRegistryError(matches.length?'PROJECT_INDEX_AMBIGUOUS':'PROJECT_INDEX_NOT_FOUND',project_id); return deepFreeze(structuredClone(matches[0]));
}
