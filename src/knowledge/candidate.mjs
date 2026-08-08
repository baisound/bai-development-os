import { KnowledgeError } from './errors.mjs';
import { createKnowledgeAsset, validateKnowledgeAsset } from './asset.mjs';
import { deepFreeze, requireString, safeId } from './util.mjs';

export function createKnowledgeCandidateFromHandoff(handoff,{clock}={}){
  if(!handoff||typeof handoff!=='object')throw new KnowledgeError('KNOWLEDGE_CANDIDATE_HANDOFF_INVALID');
  const assetId=safeId(handoff.asset_id??`KA-CANDIDATE-${safeId(handoff.candidate_id,'candidate_id')}`,'asset_id');
  const base={asset_id:assetId,title:requireString(handoff.title,'title'),knowledge_type:handoff.knowledge_type??'LESSON_LEARNED',status:'CANDIDATE',maturity:'EXPERIENCE',enforcement:handoff.enforcement??'REFERENCE',scope:handoff.scope??{level:'PROJECT',project_id:requireString(handoff.project_id,'project_id')},source_trust:handoff.source_trust??'USER_OBSERVED',sensitivity:handoff.sensitivity??'INTERNAL',confidence:handoff.confidence??0.5,provenance:{source_ids:[requireString(handoff.source_task,'source_task')],evidence_refs:[...(handoff.evidence_refs??[])],created_by:handoff.created_by??'LifecycleHandoff'},content:{summary:requireString(handoff.summary,'summary'),guidance:[...(handoff.guidance??[])],required_actions:[...(handoff.required_actions??[])],prohibited_actions:[...(handoff.prohibited_actions??[])],verification_steps:[...(handoff.verification_steps??[])]},freshness:handoff.freshness??{review_after:new Date(Date.parse(handoff.review_after??'2027-01-01T00:00:00Z')).toISOString()},tags:[...(handoff.tags??[])],taxonomy_node_ids:[...(handoff.taxonomy_node_ids??[])],relations:[...(handoff.relations??[])],applicability:handoff.applicability??{}};
  if(handoff.failure)base.failure=handoff.failure;if(handoff.pattern)base.pattern=handoff.pattern;if(handoff.decision)base.decision=handoff.decision;
  return createKnowledgeAsset(base,{clock});
}
export function findFailureKnowledgeDuplicates(candidate,assets){
  const c=validateKnowledgeAsset(candidate);if(c.knowledge_type!=='FAILURE_CASE')throw new KnowledgeError('KNOWLEDGE_FAILURE_SCHEMA_INVALID','candidate must be FAILURE_CASE');
  return deepFreeze(assets.map(a=>validateKnowledgeAsset(a)).filter(a=>a.asset_id!==c.asset_id&&a.knowledge_type==='FAILURE_CASE'&&a.failure?.fingerprint===c.failure.fingerprint).map(a=>({asset_id:a.asset_id,revision:a.revision,status:a.status,scope:a.scope,confidence:a.confidence})));
}
