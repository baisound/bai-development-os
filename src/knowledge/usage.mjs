import { KnowledgeError } from './errors.mjs';
import { USAGE_ACTIONS, VERIFICATION_RESULTS } from './constants.mjs';
import { deepFreeze, nowIso, requireEnum, requireString, safeId } from './util.mjs';

export function createKnowledgeUsageEvent(input,{clock}={}){
  const asset= input.pack?.assets?.find(a=>a.asset_id===input.asset_id);
  if(!asset)throw new KnowledgeError('KNOWLEDGE_USAGE_ASSET_NOT_IN_PACK');
  const action=requireEnum(input.action,USAGE_ACTIONS,'action'); const verification=requireEnum(input.verification??'NOT_RUN',VERIFICATION_RESULTS,'verification');
  if(action==='DEVIATED'&&!input.deviation_reason)throw new KnowledgeError('KNOWLEDGE_DEVIATION_REASON_REQUIRED');
  if(action==='DEVIATED'&&['MANDATORY','CONDITIONAL_MANDATORY'].includes(asset.enforcement)&&input.exception_approval?.result!=='APPROVED')throw new KnowledgeError('KNOWLEDGE_MANDATORY_DEVIATION_NOT_AUTHORIZED');
  return deepFreeze({event_id:safeId(input.event_id,'event_id'),pack_id:input.pack.pack_id,asset_id:asset.asset_id,asset_revision:asset.revision,task_id:requireString(input.task_id??input.pack.task_id,'task_id'),action,verification,deviation_reason:input.deviation_reason??null,exception_approval:input.exception_approval??null,outcome:input.outcome??null,evidence_refs:[...(input.evidence_refs??[])],recorded_at:nowIso(clock)});
}
export function verifyKnowledgeApplication({pack,usage_events}){
  const byAsset=new Map(); for(const e of usage_events??[])if(e.pack_id===pack.pack_id)byAsset.set(e.asset_id,e);
  const missing=[],failed=[];
  for(const a of pack.assets){const e=byAsset.get(a.asset_id);if(['MANDATORY','CONDITIONAL_MANDATORY'].includes(a.enforcement)){if(!e)missing.push(a.asset_id);else if(e.verification!=='PASS'&&a.verification_steps.length)failed.push(a.asset_id);}}
  return deepFreeze({result:missing.length||failed.length?'KNOWLEDGE_APPLICATION_INCOMPLETE':'KNOWLEDGE_APPLICATION_VERIFIED',missing,failed,pack_id:pack.pack_id});
}
export function summarizeKnowledgeEffectiveness(events=[]){
  const stats={total:events.length,applied:0,deviated:0,not_applicable:0,verified_pass:0,verified_fail:0};
  for(const e of events){if(e.action==='APPLIED')stats.applied++;else if(e.action==='DEVIATED')stats.deviated++;else if(e.action==='NOT_APPLICABLE')stats.not_applicable++;if(e.verification==='PASS')stats.verified_pass++;if(e.verification==='FAIL')stats.verified_fail++;}
  stats.effectiveness_rate=stats.total?stats.verified_pass/stats.total:0; return deepFreeze(stats);
}
