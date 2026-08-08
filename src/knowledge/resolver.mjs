import { KnowledgeError } from './errors.mjs';
import { validateKnowledgeAsset, estimateAssetTokens } from './asset.mjs';
import { evaluateKnowledgeFreshness } from './freshness.mjs';
import { validateKnowledgeGraph } from './graph.mjs';
import { ENFORCEMENT_RANK, SCOPE_SPECIFICITY, SENSITIVITY_RANK, TRUST_RANK } from './constants.mjs';
import { scopeMatches } from './taxonomy.mjs';
import { deepFreeze, requireArray, requireString } from './util.mjs';

function matchesList(allowed, value){return !allowed?.length || allowed.includes(value);}
function applicabilityMatches(a,r){
  const p=a.applicability??{};
  if(!matchesList(p.roles,r.role)||!matchesList(p.phases,r.phase))return false;
  if(p.environment_tags?.length&&!p.environment_tags.every(x=>(r.environment_tags??[]).includes(x)))return false;
  if(p.project_tags?.length&&!p.project_tags.every(x=>(r.project_tags??[]).includes(x)))return false;
  for(const [tool,ver] of Object.entries(p.tool_versions??{})) if(r.tool_versions?.[tool]!==ver)return false;
  return true;
}
function score(a){return ENFORCEMENT_RANK[a.enforcement]*10000+SCOPE_SPECIFICITY[a.scope.level]*1000+TRUST_RANK[a.source_trust]*100+Math.round(a.confidence*99)+Math.min(a.revision,50);}
function reasonForIneligibility(a,r,now){
  if(a.status!=='ACTIVE')return `STATUS_${a.status}`;
  if(!scopeMatches(a.scope,r.scope))return 'SCOPE_MISMATCH';
  if(!applicabilityMatches(a,r))return 'APPLICABILITY_MISMATCH';
  if(SENSITIVITY_RANK[a.sensitivity]>SENSITIVITY_RANK[r.sensitivity])return 'SENSITIVITY_EXCEEDS_REQUEST';
  if((r.minimum_source_trust_rank??0)>TRUST_RANK[a.source_trust])return 'SOURCE_TRUST_TOO_LOW';
  const fresh=evaluateKnowledgeFreshness(a,{now}).state;
  if(['EXPIRED','INVALID','STALE','DEPRECATED','ARCHIVED'].includes(fresh))return `FRESHNESS_${fresh}`;
  return null;
}
export function validateResolutionRequest(input){
  const r={task_id:requireString(input.task_id,'task_id'),role:requireString(input.role,'role'),phase:requireString(input.phase,'phase'),scope:input.scope??{},tool_versions:input.tool_versions??{},environment_tags:input.environment_tags??[],project_tags:input.project_tags??[],sensitivity:input.sensitivity??'INTERNAL',token_budget:input.token_budget??100000,required_asset_ids:input.required_asset_ids??[],required_tags:input.required_tags??[],minimum_source_trust_rank:input.minimum_source_trust_rank??0,now:input.now??new Date().toISOString()};
  if(!Number.isSafeInteger(r.token_budget)||r.token_budget<1)throw new KnowledgeError('KNOWLEDGE_RESOLUTION_REQUEST_INVALID','token_budget');
  if(!(r.sensitivity in SENSITIVITY_RANK))throw new KnowledgeError('KNOWLEDGE_RESOLUTION_REQUEST_INVALID','sensitivity');
  requireArray(r.required_asset_ids,'required_asset_ids'); requireArray(r.required_tags,'required_tags'); if(!Number.isSafeInteger(r.minimum_source_trust_rank)||r.minimum_source_trust_rank<0||r.minimum_source_trust_rank>6)throw new KnowledgeError('KNOWLEDGE_RESOLUTION_REQUEST_INVALID','minimum_source_trust_rank');
  return deepFreeze(r);
}
export function resolveKnowledge(request, assets){
  const r=validateResolutionRequest(request); const list=assets.map(a=>validateKnowledgeAsset(a,{verifyChecksum:Boolean(a.checksum)}));
  validateKnowledgeGraph(list);
  const excluded=[]; let eligible=[];
  for(const a of list){const reason=reasonForIneligibility(a,r,r.now); if(reason)excluded.push({asset_id:a.asset_id,revision:a.revision,reason,enforcement:a.enforcement}); else eligible.push({asset:a,score:score(a),tokens:estimateAssetTokens(a)});}
  eligible.sort((x,y)=>y.score-x.score || x.asset.asset_id.localeCompare(y.asset.asset_id) || y.asset.revision-x.asset.revision);
  const byId=new Map(eligible.map(x=>[x.asset.asset_id,x]));
  const superseded=new Set(); for(const x of eligible) for(const rel of x.asset.relations.filter(r=>r.type==='SUPERSEDES')) if(byId.has(rel.target_asset_id))superseded.add(rel.target_asset_id);
  eligible=eligible.filter(x=>!superseded.has(x.asset.asset_id)); for(const id of superseded)excluded.push({asset_id:id,reason:'SUPERSEDED_BY_SELECTED_ASSET'});
  const selected=[]; const selectedIds=new Set(); const conflictRecords=[];
  for(const x of eligible){
    const conflicts=x.asset.relations.filter(rel=>rel.type==='CONFLICT').map(rel=>rel.target_asset_id);
    const existing=selected.find(s=>conflicts.includes(s.asset.asset_id)||s.asset.relations.some(rel=>rel.type==='CONFLICT'&&rel.target_asset_id===x.asset.asset_id));
    if(existing){
      conflictRecords.push({asset_ids:[existing.asset.asset_id,x.asset.asset_id],winner:existing.asset.asset_id});
      if(existing.asset.enforcement==='MANDATORY'&&x.asset.enforcement==='MANDATORY')return deepFreeze({result:'KNOWLEDGE_RESOLUTION_BLOCKED',reason:'MANDATORY_CONFLICT',selected:[],excluded,conflicts:conflictRecords,request:r});
      excluded.push({asset_id:x.asset.asset_id,revision:x.asset.revision,reason:'CONFLICT_LOWER_RANK'}); continue;
    }
    selected.push(x); selectedIds.add(x.asset.asset_id);
  }
  for(const x of [...selected]) for(const req of x.asset.relations.filter(rel=>rel.type==='REQUIRES')) {
    if(!selectedIds.has(req.target_asset_id)) {
      if(x.asset.enforcement==='MANDATORY') return deepFreeze({result:'KNOWLEDGE_RESOLUTION_BLOCKED',reason:'MANDATORY_REQUIREMENT_MISSING',missing:[req.target_asset_id],selected:[],excluded,conflicts:conflictRecords,request:r});
      excluded.push({asset_id:x.asset.asset_id,revision:x.asset.revision,reason:`REQUIRES_MISSING:${req.target_asset_id}`}); selected.splice(selected.indexOf(x),1); selectedIds.delete(x.asset.asset_id);
    }
  }
  const requiredMissing=r.required_asset_ids.filter(id=>!selectedIds.has(id));
  const tagMissing=r.required_tags.filter(tag=>!selected.some(x=>x.asset.tags.includes(tag)));
  const applicableMandatoryExcluded=excluded.filter(e=>e.enforcement==='MANDATORY'&&!['SCOPE_MISMATCH','APPLICABILITY_MISMATCH','SUPERSEDED_BY_SELECTED_ASSET'].includes(e.reason));
  if(requiredMissing.length||tagMissing.length||applicableMandatoryExcluded.length)return deepFreeze({result:'KNOWLEDGE_RESOLUTION_BLOCKED',reason:'MANDATORY_OR_REQUIRED_KNOWLEDGE_UNAVAILABLE',missing:[...requiredMissing,...tagMissing.map(x=>`tag:${x}`),...applicableMandatoryExcluded.map(x=>x.asset_id)],selected:[],excluded,conflicts:conflictRecords,request:r});
  return deepFreeze({result:'KNOWLEDGE_RESOLUTION_READY',selected:selected.map(x=>({asset_id:x.asset.asset_id,revision:x.asset.revision,checksum:x.asset.checksum,score:x.score,estimated_tokens:x.tokens,enforcement:x.asset.enforcement})),total_estimated_tokens:selected.reduce((n,x)=>n+x.tokens,0),excluded,conflicts:conflictRecords,request:r});
}
