import { createHash, randomUUID } from 'node:crypto';

const TRUST = ['CANONICAL','TRUSTED','REFERENCE','UNTRUSTED'];
const SENSITIVITY = ['PUBLIC','INTERNAL','CONFIDENTIAL','RESTRICTED'];
const canonical=(v)=>JSON.stringify(sort(v));
const sort=(v)=>Array.isArray(v)?v.map(sort):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sort(v[k])])):v;
const checksum=(v)=>`sha256:${createHash('sha256').update(canonical((()=>{const c=structuredClone(v);delete c.content_checksum;return c;})())).digest('hex')}`;
export class ContextControlError extends Error { constructor(code,message=code){super(message);this.code=code;} }
const req=(v,n)=>{if(typeof v!=='string'||!v.trim())throw new ContextControlError('CONTEXT_SCHEMA_INVALID',`${n} required`)};

function normalizeSource(source, now) {
  req(source.source_id,'source_id'); req(source.path,'path');
  if(!TRUST.includes(source.trust_level)) throw new ContextControlError('CONTEXT_SCHEMA_INVALID','trust_level invalid');
  if(!SENSITIVITY.includes(source.sensitivity??'INTERNAL')) throw new ContextControlError('CONTEXT_SCHEMA_INVALID','sensitivity invalid');
  if(typeof source.content_checksum!=='string'||!/^sha256:[a-f0-9]{64}$/.test(source.content_checksum)) throw new ContextControlError('CONTEXT_SCHEMA_INVALID','source checksum invalid');
  if(!Number.isSafeInteger(source.token_estimate??0)||(source.token_estimate??0)<0) throw new ContextControlError('CONTEXT_SCHEMA_INVALID','token estimate invalid');
  const updated_at=source.updated_at??now.toISOString(); const revalidate_after=source.revalidate_after??null;
  if(Number.isNaN(Date.parse(updated_at)) || (revalidate_after && Number.isNaN(Date.parse(revalidate_after)))) throw new ContextControlError('CONTEXT_SCHEMA_INVALID','freshness timestamp invalid');
  return Object.freeze({...source, sensitivity:source.sensitivity??'INTERNAL', token_estimate:source.token_estimate??0, updated_at,revalidate_after, priority:Number.isInteger(source.priority)?source.priority:0, instruction_authority:['CANONICAL','TRUSTED'].includes(source.trust_level)});
}

export function detectContextConflicts(sources) {
  const byIdentity=new Map(); const duplicates=[]; const conflicts=[];
  for(const s of sources){ const key=s.canonical_identity??s.source_id; const existing=byIdentity.get(key); if(!existing){byIdentity.set(key,s);continue;} if(existing.content_checksum===s.content_checksum) duplicates.push([existing.source_id,s.source_id]); else conflicts.push([existing.source_id,s.source_id]); }
  return Object.freeze({duplicates:Object.freeze(duplicates),conflicts:Object.freeze(conflicts)});
}

export function buildContextManifest({ task_id,status_revision,role,phase,required_sources=[],optional_sources=[],excluded_sources=[],source_priority=[],summary_reference=null }, {clock=()=>new Date()}={}) {
  req(task_id,'task_id'); req(role,'role'); req(phase,'phase'); if(!Number.isInteger(status_revision)||status_revision<1) throw new ContextControlError('CONTEXT_SCHEMA_INVALID','status_revision invalid');
  const now=clock(); const required=required_sources.map(s=>normalizeSource(s,now)); const optional=optional_sources.map(s=>normalizeSource(s,now));
  const all=[...required,...optional]; const {duplicates,conflicts}=detectContextConflicts(all);
  if(conflicts.length) throw new ContextControlError('CONTEXT_CONFLICT','conflicting canonical identities');
  const stale=all.filter(s=>s.revalidate_after && Date.parse(s.revalidate_after)<=now.getTime()); if(stale.some(s=>required.includes(s))) throw new ContextControlError('CONTEXT_STALE','required source stale');
  const manifest={manifest_schema_version:'1.0.0',manifest_id:randomUUID(),task_id,status_revision,role,phase,required_sources:required,optional_sources:optional,excluded_sources:Object.freeze(excluded_sources.map(x=>structuredClone(x))),source_priority:Object.freeze([...source_priority]),summary_reference,token_estimate:all.reduce((a,s)=>a+s.token_estimate,0),duplicate_sources:duplicates,stale_optional_sources:Object.freeze(stale.filter(s=>optional.includes(s)).map(s=>s.source_id)),created_at:now.toISOString()};
  manifest.content_checksum=checksum(manifest); return Object.freeze(manifest);
}

export function validateContextManifest(manifest,{status_revision,current_sources=[],clock=()=>new Date(),max_tokens=null,allowed_sensitivity='RESTRICTED'}={}){
  if(!manifest||manifest.manifest_schema_version!=='1.0.0'||manifest.content_checksum!==checksum(manifest)) throw new ContextControlError('CONTEXT_MANIFEST_TAMPERED');
  if(status_revision!=null&&manifest.status_revision!==status_revision) throw new ContextControlError('CONTEXT_STATUS_REVISION_CHANGED');
  if(max_tokens!=null&&manifest.token_estimate>max_tokens) throw new ContextControlError('CONTEXT_TOKEN_BUDGET_EXCEEDED');
  const sensRank=Object.fromEntries(SENSITIVITY.map((v,i)=>[v,i])); const allowed=sensRank[allowed_sensitivity]; if(allowed==null) throw new ContextControlError('CONTEXT_SCHEMA_INVALID');
  const all=[...manifest.required_sources,...manifest.optional_sources];
  for(const s of all){ if(sensRank[s.sensitivity]>allowed) throw new ContextControlError('CONTEXT_SENSITIVITY_BLOCKED'); if(s.revalidate_after&&Date.parse(s.revalidate_after)<=clock().getTime()&&manifest.required_sources.some(r=>r.source_id===s.source_id)) throw new ContextControlError('CONTEXT_STALE'); }
  if(current_sources.length){ const current=new Map(current_sources.map(s=>[s.source_id,s.content_checksum])); for(const s of all){ if(current.has(s.source_id)&&current.get(s.source_id)!==s.content_checksum) throw new ContextControlError('CONTEXT_SOURCE_CHANGED'); } }
  return Object.freeze({result:'CONTEXT_READY',manifest_id:manifest.manifest_id,token_estimate:manifest.token_estimate});
}

export function classifyInstructionAuthority(source){
  if(!TRUST.includes(source.trust_level)) throw new ContextControlError('CONTEXT_SCHEMA_INVALID');
  return Object.freeze({source_id:source.source_id,trust_level:source.trust_level,may_define_instructions:['CANONICAL','TRUSTED'].includes(source.trust_level),usage:source.trust_level==='REFERENCE'?'FACTS_ONLY':source.trust_level==='UNTRUSTED'?'DATA_ONLY':'INSTRUCTIONS_AND_FACTS'});
}

export function resolveContextSources(sources){
  const rank={CANONICAL:4,TRUSTED:3,REFERENCE:2,UNTRUSTED:1};
  const groups=new Map(); for(const s of sources){const key=s.canonical_identity??s.source_id;(groups.get(key)??groups.set(key,[]).get(key)).push(s);}
  const selected=[]; const excluded=[];
  for(const group of groups.values()){
    group.sort((a,b)=>rank[b.trust_level]-rank[a.trust_level]||b.priority-a.priority);
    const top=group[0]; const differing=group.filter(x=>x.content_checksum!==top.content_checksum);
    if(differing.length && differing.some(x=>x.trust_level===top.trust_level)) throw new ContextControlError('CONTEXT_CONFLICT');
    selected.push(top); for(const x of group.slice(1)) excluded.push({source_id:x.source_id,reason:x.content_checksum===top.content_checksum?'DUPLICATE':'LOWER_TRUST_OR_PRIORITY'});
  }
  return Object.freeze({selected:Object.freeze(selected),excluded:Object.freeze(excluded)});
}

export { TRUST as CONTEXT_TRUST_LEVELS, SENSITIVITY as CONTEXT_SENSITIVITY_LEVELS, checksum as contextManifestChecksum };
export {
  CONTEXT_COST_CONFIDENCE_LEVELS,
  DEFAULT_CONTEXT_OVERFETCH_POLICY,
  ContextCostObservatoryError,
  contextCostRecordChecksum,
  createContextCostRecord,
  validateContextCostRecord,
} from './context-cost-observatory.mjs';
export {
  HANDOFF_AUTHORIZATION_STATES,
  HANDOFF_GIT_RELATIONS,
  HANDOFF_TRUST_LEVELS,
  HandoffBootstrapError,
  bootstrapHandoff,
  handoffBootstrapResultChecksum,
  handoffManifestChecksum,
  validateHandoffBootstrapResult,
} from './handoff-bootstrap.mjs';
