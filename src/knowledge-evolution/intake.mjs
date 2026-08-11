import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { inspectKnowledgeSnapshot } from './snapshot.mjs';
import { KnowledgeEvolutionError } from './errors.mjs';
import { canonicalJson, confineOutput, nowIso, requireNoUnknownKeys, requireNonEmptyString, requirePlainObject, safeRecordId, sha256 } from './util.mjs';
import { validateRepositorySnapshotReference } from './repository-snapshot.mjs';

const EVIDENCE_TYPES=new Set(['success_pattern','rejected_pattern','regression','incident','recovery','user_feedback','ui_ux','performance','security','privacy','rights','cost','architecture_decision','implementation_decision','test_result','critic_finding','judge_decision']);
const SCOPES=new Set(['project','domain','product-family','organization','universal']);
const SENSITIVITY=new Set(['PUBLIC','INTERNAL','CONFIDENTIAL','RESTRICTED']);
const PROCESSING=new Set(['RECEIVED','VALIDATED','CANDIDATE_CREATED','REJECTED','ARCHIVED','QUARANTINED']);
const CANDIDATE_STATUS=new Set(['OBSERVED','CANDIDATE','SUPPORTED','CONFLICTED','REJECTED','PROMOTED','SUPERSEDED','DEPRECATED']);
const RISKS=new Set(['LOW','MEDIUM','HIGH']);
const REVIEWS=new Set(['LIGHTWEIGHT','CRITIC','CRITIC_AND_JUDGE']);

function validateKnowledgeEvidence(e) {
  requirePlainObject(e,'evidence');
  requireNoUnknownKeys(e,['schema_version','evidence_id','evidence_type','producer','observation','resolution','outcome','candidate_scope','provenance','sensitivity','payload_hash','processing_status'],'evidence');
  if(e.schema_version!=='1.0')throw new KnowledgeEvolutionError('KNOWLEDGE_EVIDENCE_SCHEMA_INVALID');
  safeRecordId(e.evidence_id,'evidence_id'); requireNonEmptyString(e.evidence_type,'evidence_type'); requireNonEmptyString(e.observation,'observation');
  if(!EVIDENCE_TYPES.has(e.evidence_type)||!SCOPES.has(e.candidate_scope)||!SENSITIVITY.has(e.sensitivity)||!PROCESSING.has(e.processing_status))throw new KnowledgeEvolutionError('KNOWLEDGE_EVIDENCE_SCHEMA_INVALID','enum');
  if(!e.producer?.project_id)throw new KnowledgeEvolutionError('KNOWLEDGE_EVIDENCE_SCHEMA_INVALID','producer.project_id');
  if(!['COMPLETE','PARTIAL','UNVERIFIED'].includes(e.provenance?.completeness))throw new KnowledgeEvolutionError('KNOWLEDGE_EVIDENCE_SCHEMA_INVALID','provenance');
  return e;
}
function validateKnowledgeCandidate(c) {
  requirePlainObject(c,'candidate');
  requireNoUnknownKeys(c,['schema_version','candidate_id','source_evidence_ids','status','scope','risk','title','statement','rationale','supersedes','required_review'],'candidate');
  if(c.schema_version!=='1.0')throw new KnowledgeEvolutionError('KNOWLEDGE_CANDIDATE_SCHEMA_INVALID');
  safeRecordId(c.candidate_id,'candidate_id');
  if(!CANDIDATE_STATUS.has(c.status)||!SCOPES.has(c.scope)||!RISKS.has(c.risk)||!REVIEWS.has(c.required_review))throw new KnowledgeEvolutionError('KNOWLEDGE_CANDIDATE_SCHEMA_INVALID','enum');
  if(!Array.isArray(c.source_evidence_ids)||c.source_evidence_ids.length<1)throw new KnowledgeEvolutionError('KNOWLEDGE_CANDIDATE_SCHEMA_INVALID','source_evidence_ids');
  requireNonEmptyString(c.title,'title');requireNonEmptyString(c.statement,'statement');
  return c;
}
async function writeJson(file,value){await writeFile(file,JSON.stringify(value,null,2)+'\n','utf8');}

export async function createKnowledgeIntakePackage({ sourcePath, outputRoot, evidence = [], candidates = [], reviewSummary = '', proposedCanonical = [], clock }) {
  const inspection=await inspectKnowledgeSnapshot(sourcePath);
  if(inspection.state==='QUARANTINED')throw new KnowledgeEvolutionError('KNOWLEDGE_INTAKE_QUARANTINED','snapshot failed secret/privacy scan',{issues:inspection.issues});
  const ev=evidence.map(validateKnowledgeEvidence), ca=candidates.map(validateKnowledgeCandidate);
  const evidenceIds=new Set(ev.map(x=>x.evidence_id));
  for(const c of ca)for(const id of c.source_evidence_ids)if(!evidenceIds.has(id))throw new KnowledgeEvolutionError('KNOWLEDGE_CANDIDATE_EVIDENCE_MISSING',id);
  const root=path.resolve(outputRoot);await mkdir(root,{recursive:true});
  for(const dir of ['evidence','candidates','reviews','proposed-canonical','provenance'])await mkdir(confineOutput(root,dir),{recursive:true});
  const createdAt=nowIso(clock);
  const manifest={schema_version:'1.0',intake_id:`KI-${sha256({createdAt,source:inspection.provenance.snapshot_sha256,project:inspection.provenance.consumer.project_id}).slice(0,24)}`,created_at:createdAt,state:inspection.state,source:{kind:inspection.source_kind,snapshot_sha256:inspection.provenance.snapshot_sha256,raw_source_committed:false},provenance_completeness:inspection.provenance.completeness,evidence_count:ev.length,candidate_count:ca.length,canonical_authority:false};
  await writeJson(confineOutput(root,'manifest.json'),manifest);
  for(const item of ev)await writeJson(confineOutput(root,'evidence',`${safeRecordId(item.evidence_id)}.json`),item);
  for(const item of ca)await writeJson(confineOutput(root,'candidates',`${safeRecordId(item.candidate_id)}.json`),item);
  await writeFile(confineOutput(root,'reviews','review-summary.md'), reviewSummary || '# Knowledge Intake Review\n\nNo review summary supplied.\n','utf8');
  for(let i=0;i<proposedCanonical.length;i++)await writeFile(confineOutput(root,'proposed-canonical',`proposal-${String(i+1).padStart(3,'0')}.md`),String(proposedCanonical[i]),'utf8');
  await writeJson(confineOutput(root,'provenance','source-map.json'),inspection);
  await writeJson(confineOutput(root,'provenance','package-checksum.json'),{algorithm:'sha256',manifest:`sha256:${sha256(manifest)}`,evidence:`sha256:${sha256(ev)}`,candidates:`sha256:${sha256(ca)}`});
  return {root,manifest,inspection};
}


export async function createKnowledgeIntakePackageFromRepositorySnapshot({ repositorySnapshot, outputRoot, evidence = [], candidates = [], reviewSummary = '', proposedCanonical = [], clock }) {
  const snapshot=validateRepositorySnapshotReference(repositorySnapshot);
  if(!snapshot.validation.tree_identity_verified) throw new KnowledgeEvolutionError('KNOWLEDGE_REPOSITORY_SNAPSHOT_TREE_UNVERIFIED');
  const ev=evidence.map(validateKnowledgeEvidence),ca=candidates.map(validateKnowledgeCandidate);const evidenceIds=new Set(ev.map(x=>x.evidence_id));
  for(const c of ca)for(const id of c.source_evidence_ids)if(!evidenceIds.has(id))throw new KnowledgeEvolutionError('KNOWLEDGE_CANDIDATE_EVIDENCE_MISSING',id);
  const root=path.resolve(outputRoot);await mkdir(root,{recursive:true});for(const dir of ['evidence','candidates','reviews','proposed-canonical','provenance'])await mkdir(confineOutput(root,dir),{recursive:true});
  const createdAt=nowIso(clock);const completeness=snapshot.validation.content_scan_status==='FULL_TRACKED_CONTENT'?'COMPLETE':'PARTIAL';
  const manifest={schema_version:'1.0',intake_id:`KI-${sha256({createdAt,commit:snapshot.commit_sha,tree:snapshot.tree_sha,project:snapshot.consumer.project_id}).slice(0,24)}`,created_at:createdAt,state:'PROVENANCE_RECOVERED',source:{kind:'git-repository-reference',repository_url:snapshot.repository_url,ref:snapshot.ref,commit_sha:snapshot.commit_sha,tree_sha:snapshot.tree_sha,raw_source_committed:false},provenance_completeness:completeness,evidence_count:ev.length,candidate_count:ca.length,canonical_authority:false};
  await writeJson(confineOutput(root,'manifest.json'),manifest);for(const item of ev)await writeJson(confineOutput(root,'evidence',`${safeRecordId(item.evidence_id)}.json`),item);for(const item of ca)await writeJson(confineOutput(root,'candidates',`${safeRecordId(item.candidate_id)}.json`),item);
  await writeFile(confineOutput(root,'reviews','review-summary.md'),reviewSummary||'# Repository Snapshot Intake Review\n','utf8');for(let i=0;i<proposedCanonical.length;i++)await writeFile(confineOutput(root,'proposed-canonical',`proposal-${String(i+1).padStart(3,'0')}.md`),String(proposedCanonical[i]),'utf8');
  await writeJson(confineOutput(root,'provenance','repository-snapshot-reference.json'),snapshot);await writeJson(confineOutput(root,'provenance','package-checksum.json'),{algorithm:'sha256',manifest:`sha256:${sha256(manifest)}`,evidence:`sha256:${sha256(ev)}`,candidates:`sha256:${sha256(ca)}`});return{root,manifest,snapshot};
}
