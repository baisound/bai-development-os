import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { createSystemSyncPlan, verifySystemSync } from '../system-sync/index.mjs';
import { atomicWrite, deepFreeze, normalizeRel, resolveExistingInside, stable } from './util.mjs';
export class DocumentAutomationError extends Error { constructor(code,message=code){super(message);this.code=code;} }
const sha=(b)=>`sha256:${createHash('sha256').update(b).digest('hex')}`;
export function resolveCanonicalDocument(manifest,{document_id,version=null}={}){
  if(!manifest?.documents||!document_id) throw new DocumentAutomationError('DOCUMENT_RESOLUTION_INVALID');
  const matches=manifest.documents.filter(d=>d.document_id===document_id&&(version==null||d.version===version)&&d.status==='CURRENT_CANONICAL');
  if(matches.length!==1) throw new DocumentAutomationError(matches.length?'DOCUMENT_CANONICAL_AMBIGUOUS':'DOCUMENT_CANONICAL_NOT_FOUND');
  const doc=matches[0];
  for(const field of ['markdown_path','summary_path']) normalizeRel(doc[field],DocumentAutomationError,'DOCUMENT_PATH_INVALID');
  if(doc.docx_path) normalizeRel(doc.docx_path,DocumentAutomationError,'DOCUMENT_PATH_INVALID');
  if(!doc.sha256?.markdown) throw new DocumentAutomationError('DOCUMENT_HASH_MISSING');
  return deepFreeze(structuredClone(doc));
}
export async function verifyCanonicalDocumentSet(root,document){
  const files=[['markdown',document.markdown_path],['summary',document.summary_path],...(document.docx_path?[['docx',document.docx_path]]:[])]; const results=[];
  for(const [kind,rel] of files){
    const target=await resolveExistingInside(root,rel,DocumentAutomationError,{missingCode:'DOCUMENT_SOURCE_MISSING',escapeCode:'DOCUMENT_PATH_ESCAPE'}); const body=await readFile(target); const actual=sha(body); const expected=document.sha256?.[kind];
    if(expected&&expected!==actual) throw new DocumentAutomationError('DOCUMENT_HASH_MISMATCH',rel); results.push({kind,path:rel,sha256:actual,size_bytes:(await stat(target)).size});
  }
  return deepFreeze({result:'CANONICAL_DOCUMENT_SET_VERIFIED',document_id:document.document_id,version:document.version,files:results});
}
export function checkCrossFormatConsistency({markdown_text,summary_text,docx_text=null,required_markers=[]}={}){
  if(typeof markdown_text!=='string'||typeof summary_text!=='string') throw new DocumentAutomationError('DOCUMENT_CONSISTENCY_INPUT_INVALID');
  const missing=[]; for(const marker of required_markers){ if(!markdown_text.includes(marker)) missing.push(`markdown:${marker}`); if(!summary_text.includes(marker)) missing.push(`summary:${marker}`); if(docx_text!=null&&!docx_text.includes(marker)) missing.push(`docx:${marker}`); }
  return deepFreeze({result:missing.length?'DOCUMENT_CONSISTENCY_UNKNOWN':'CROSS_FORMAT_CONSISTENCY_PASS',missing});
}
export function createDocumentationSyncProposal({updates,source_evidence,requested_by}={}){
  if(!Array.isArray(updates)||!updates.length||!Array.isArray(source_evidence)||!source_evidence.length||!requested_by) throw new DocumentAutomationError('DOCUMENT_SYNC_PROPOSAL_INVALID');
  return deepFreeze({type:'DOCUMENT_SYNC_PROPOSAL',updates:updates.map(x=>structuredClone(x)),source_evidence:[...source_evidence],requested_by,owner_approval_required:true,derived_views_only:true,canonical_authority_unchanged:true});
}
export async function applyAuthorizedDocumentationSync(root,proposal,{authorized=false}={}){
  if(!authorized) throw new DocumentAutomationError('DOCUMENT_SYNC_NOT_AUTHORIZED');
  const updates=[];
  for(const item of proposal.updates){
    if(item.authority && !['SUMMARY','INDEX_OR_DERIVED_VIEW','CURRENT_STATE_SNAPSHOT'].includes(item.authority)) throw new DocumentAutomationError('DOCUMENT_SYNC_CANONICAL_WRITE_FORBIDDEN');
    normalizeRel(item.path,DocumentAutomationError,'DOCUMENT_PATH_INVALID'); await atomicWrite(root,item.path,Buffer.from(String(item.content)),DocumentAutomationError); updates.push({kind:item.kind??'REGISTRY',path:item.path});
  }
  const plan=createSystemSyncPlan({updates:updates.map(x=>({kind:['REGISTRY','SUMMARY','CURRENT_STATE'].includes(x.kind)?'REGISTRY':x.kind,path:x.path})),policy_update_authorized:true,scope:['DERIVED_DOCUMENT_SYNC']});
  const verification=await verifySystemSync(plan,{root}); return deepFreeze({result:'DOCUMENT_SYNC_APPLIED_AND_VERIFIED',verification});
}

export function buildCanonicalDocumentManifest(documents,{manifest_id='BAI-CANONICAL-DOCUMENT-MANIFEST'}={}){
  if(!Array.isArray(documents)||!documents.length) throw new DocumentAutomationError('DOCUMENT_MANIFEST_INVALID'); const ids=new Set(); const currents=new Map();
  for(const d of documents){if(!d.document_id||!d.version||!d.status||!d.markdown_path||!d.summary_path)throw new DocumentAutomationError('DOCUMENT_MANIFEST_INVALID');const key=`${d.document_id}@${d.version}`;if(ids.has(key))throw new DocumentAutomationError('DOCUMENT_MANIFEST_DUPLICATE_ID',key);ids.add(key);if(d.status==='CURRENT_CANONICAL'){if(currents.has(d.document_id))throw new DocumentAutomationError('DOCUMENT_MANIFEST_MULTIPLE_CURRENT',d.document_id);currents.set(d.document_id,d.version);}}
  const manifest={document_manifest_version:'1.0.0',manifest_id,documents:documents.map(d=>structuredClone(d)).sort((a,b)=>a.document_id.localeCompare(b.document_id)||String(a.version).localeCompare(String(b.version))),content_authority:false}; manifest.content_checksum=`sha256:${createHash('sha256').update(stable({...manifest,content_checksum:undefined})).digest('hex')}`;return deepFreeze(manifest);
}
