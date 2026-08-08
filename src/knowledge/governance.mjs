import { KnowledgeError } from './errors.mjs';
import { reviseKnowledgeAsset, validateKnowledgeAsset } from './asset.mjs';
import { SCOPE_SPECIFICITY } from './constants.mjs';
import { validateScope } from './taxonomy.mjs';
import { deepFreeze, requireString } from './util.mjs';

const TRANSITIONS=Object.freeze({
  CANDIDATE:['DRAFT','UNDER_REVIEW','ARCHIVED'], DRAFT:['UNDER_REVIEW','ARCHIVED'], UNDER_REVIEW:['ACTIVE','DRAFT','INVALID'],
  ACTIVE:['STALE','DEPRECATED','INVALID'], STALE:['UNDER_REVIEW','ACTIVE','DEPRECATED','INVALID'], DEPRECATED:['UNDER_REVIEW','ARCHIVED'], INVALID:['ARCHIVED'], ARCHIVED:[]
});
const hasApproval=(approvals,role)=>approvals.some(a=>a.role===role&&a.result==='APPROVED');
export function authorizeKnowledgeTransition({asset,target_status,actor_role,approvals=[],reason,evidence_refs=[]}) {
  const a=validateKnowledgeAsset(asset); requireString(actor_role,'actor_role'); requireString(reason,'reason');
  if (!(TRANSITIONS[a.status]??[]).includes(target_status)) throw new KnowledgeError('KNOWLEDGE_STATUS_TRANSITION_INVALID',`${a.status}->${target_status}`);
  if (['ACTIVE','INVALID'].includes(target_status) && !hasApproval(approvals,'KnowledgeReviewer')) throw new KnowledgeError('KNOWLEDGE_REVIEW_APPROVAL_REQUIRED');
  if (['ACTIVE','INVALID'].includes(target_status) && (a.scope.level==='GLOBAL'||a.enforcement==='MANDATORY') && !hasApproval(approvals,'Owner')) throw new KnowledgeError('KNOWLEDGE_OWNER_APPROVAL_REQUIRED');
  if (target_status==='ACTIVE' && a.source_trust==='UNTRUSTED') throw new KnowledgeError('KNOWLEDGE_UNTRUSTED_ACTIVATION_FORBIDDEN');
  return deepFreeze({authorized:true,asset_id:a.asset_id,from_status:a.status,target_status,actor_role,approvals:structuredClone(approvals),reason,evidence_refs:[...evidence_refs]});
}
export function applyKnowledgeTransition(asset, decision, {clock}={}) {
  const a=validateKnowledgeAsset(asset);
  if (!decision?.authorized||decision.asset_id!==a.asset_id||decision.from_status!==a.status) throw new KnowledgeError('KNOWLEDGE_GOVERNANCE_DECISION_INVALID');
  return reviseKnowledgeAsset(a,{status:decision.target_status,governance:{last_decision:structuredClone(decision)}},{clock});
}
export function evaluateScopeChange({asset,target_scope,metrics={},approvals=[]}) {
  const a=validateKnowledgeAsset(asset); const target=validateScope(target_scope); const from=SCOPE_SPECIFICITY[a.scope.level], to=SCOPE_SPECIFICITY[target.level];
  if (from===to && JSON.stringify(a.scope)===JSON.stringify(target)) throw new KnowledgeError('KNOWLEDGE_SCOPE_CHANGE_NOOP');
  const direction=to<from?'PROMOTION':'DEMOTION';
  if (direction==='PROMOTION') {
    if ((metrics.verified_success_count??0)<3) throw new KnowledgeError('KNOWLEDGE_PROMOTION_EVIDENCE_INSUFFICIENT');
    if (target.level==='GLOBAL' && (metrics.distinct_projects??0)<3) throw new KnowledgeError('KNOWLEDGE_GLOBAL_PROMOTION_DIVERSITY_INSUFFICIENT');
    if (!hasApproval(approvals,'KnowledgeReviewer')) throw new KnowledgeError('KNOWLEDGE_REVIEW_APPROVAL_REQUIRED');
    if ((target.level==='GLOBAL'||a.enforcement==='MANDATORY')&&!hasApproval(approvals,'Owner')) throw new KnowledgeError('KNOWLEDGE_OWNER_APPROVAL_REQUIRED');
  } else if (!hasApproval(approvals,'KnowledgeReviewer') && !hasApproval(approvals,'Owner')) throw new KnowledgeError('KNOWLEDGE_REVIEW_APPROVAL_REQUIRED');
  return deepFreeze({result:'SCOPE_CHANGE_APPROVED',asset_id:a.asset_id,direction,from_scope:structuredClone(a.scope),target_scope:target,metrics:structuredClone(metrics),approvals:structuredClone(approvals)});
}
export function applyScopeChange(asset, decision, {clock}={}) {
  const a=validateKnowledgeAsset(asset); if(decision?.result!=='SCOPE_CHANGE_APPROVED'||decision.asset_id!==a.asset_id)throw new KnowledgeError('KNOWLEDGE_SCOPE_DECISION_INVALID');
  return reviseKnowledgeAsset(a,{scope:decision.target_scope,governance:{...(a.governance??{}),last_scope_decision:structuredClone(decision)}},{clock});
}
