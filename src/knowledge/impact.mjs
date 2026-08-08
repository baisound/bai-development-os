import { validateKnowledgeAsset } from './asset.mjs';
import { deepFreeze } from './util.mjs';
export function analyzeInvalidKnowledgeImpact({asset,usage_events=[],packs=[]}){
  const a=validateKnowledgeAsset(asset); const usages=usage_events.filter(e=>e.asset_id===a.asset_id&&e.asset_revision===a.revision); const affectedTasks=[...new Set(usages.map(e=>e.task_id))].sort();
  const packIds=[...new Set(packs.filter(p=>p.assets?.some(x=>x.asset_id===a.asset_id&&x.revision===a.revision)).map(p=>p.pack_id))].sort();
  const severity=a.enforcement==='MANDATORY'?'CRITICAL':a.enforcement==='CONDITIONAL_MANDATORY'?'HIGH':a.enforcement==='ADVISORY'?'MEDIUM':'LOW';
  const required_action=affectedTasks.length?(severity==='CRITICAL'?'BLOCK_OR_IMMEDIATE_FOLLOW_UP':'REVIEW_OR_FOLLOW_UP'):'NO_CONSUMER_ACTION';
  return deepFreeze({asset_id:a.asset_id,revision:a.revision,severity,affected_tasks:affectedTasks,affected_pack_ids:packIds,usage_count:usages.length,required_action});
}
