import { KnowledgeError } from './errors.mjs';
import { validateKnowledgeAsset } from './asset.mjs';
import { checksumObject, deepFreeze, nowIso, safeId } from './util.mjs';

export function buildKnowledgePack({resolution,assets,pack_id,ttl_seconds=3600,clock}){
  if(resolution?.result!=='KNOWLEDGE_RESOLUTION_READY')throw new KnowledgeError('KNOWLEDGE_PACK_RESOLUTION_NOT_READY');
  if(!Number.isSafeInteger(ttl_seconds)||ttl_seconds<1)throw new KnowledgeError('KNOWLEDGE_PACK_TTL_INVALID');
  const byId=new Map(assets.map(a=>{const v=validateKnowledgeAsset(a,{verifyChecksum:Boolean(a.checksum)});return[v.asset_id,v]}));
  const chosen=resolution.selected.map(s=>{const a=byId.get(s.asset_id);if(!a||a.revision!==s.revision||a.checksum!==s.checksum)throw new KnowledgeError('KNOWLEDGE_PACK_SOURCE_CHANGED',s.asset_id);return{asset:a,meta:s};});
  let total=chosen.reduce((n,x)=>n+x.meta.estimated_tokens,0); const budget=resolution.request.token_budget; const dropped=[];
  const retained=[...chosen];
  if(total>budget){
    retained.sort((a,b)=>a.meta.score-b.meta.score || b.asset.asset_id.localeCompare(a.asset.asset_id));
    for(const x of [...retained]){if(total<=budget)break;if(['MANDATORY','CONDITIONAL_MANDATORY'].includes(x.asset.enforcement))continue;const idx=retained.indexOf(x);retained.splice(idx,1);total-=x.meta.estimated_tokens;dropped.push({asset_id:x.asset.asset_id,reason:'TOKEN_BUDGET_TRIM'});}
  }
  if(total>budget)throw new KnowledgeError('KNOWLEDGE_PACK_BUDGET_BLOCKED','mandatory knowledge exceeds token budget',{required_tokens:total,budget});
  retained.sort((a,b)=>b.meta.score-a.meta.score||a.asset.asset_id.localeCompare(b.asset.asset_id));
  const generated_at=nowIso(clock); const requestedExpiry=Date.parse(generated_at)+ttl_seconds*1000;
  const assetExpiries=retained.map(x=>x.asset.freshness.expires_at?Date.parse(x.asset.freshness.expires_at):Infinity);
  const validUntil=new Date(Math.min(requestedExpiry,...assetExpiries)).toISOString();
  const pack={pack_id:safeId(pack_id,'pack_id'),task_id:resolution.request.task_id,role:resolution.request.role,phase:resolution.request.phase,generated_at,valid_until:validUntil,token_budget:budget,estimated_tokens:total,assets:retained.map(({asset,meta})=>({asset_id:asset.asset_id,revision:asset.revision,checksum:asset.checksum,enforcement:asset.enforcement,sensitivity:asset.sensitivity,source_trust:asset.source_trust,summary:asset.content.summary,required_actions:[...asset.content.required_actions],prohibited_actions:[...asset.content.prohibited_actions],verification_steps:[...asset.content.verification_steps]})),dropped,conflicts:structuredClone(resolution.conflicts??[])};
  pack.checksum=checksumObject(pack); return deepFreeze(pack);
}
export function validateKnowledgePack(pack,currentAssets,{now=new Date().toISOString()}={}){
  if(!pack||typeof pack!=='object'||pack.checksum!==checksumObject(pack))throw new KnowledgeError('KNOWLEDGE_PACK_CHECKSUM_MISMATCH');
  if(Date.parse(now)>=Date.parse(pack.valid_until))throw new KnowledgeError('KNOWLEDGE_PACK_EXPIRED');
  const byId=new Map(currentAssets.map(a=>{const v=validateKnowledgeAsset(a,{verifyChecksum:Boolean(a.checksum)});return[v.asset_id,v]}));
  for(const p of pack.assets){const a=byId.get(p.asset_id);if(!a||a.revision!==p.revision||a.checksum!==p.checksum||a.status!=='ACTIVE')throw new KnowledgeError('KNOWLEDGE_PACK_REVISION_STALE',p.asset_id);}
  return deepFreeze({result:'KNOWLEDGE_PACK_VALID',pack_id:pack.pack_id,asset_count:pack.assets.length});
}

export function knowledgePackToContextSource(pack,{path='knowledge-pack.json'}={}){
  if(!pack||pack.checksum!==checksumObject(pack))throw new KnowledgeError('KNOWLEDGE_PACK_CHECKSUM_MISMATCH');
  const sens={PUBLIC:0,INTERNAL:1,CONFIDENTIAL:2,RESTRICTED:3};
  const sensitivity=pack.assets.reduce((max,a)=>sens[a.sensitivity]>sens[max]?a.sensitivity:max,'PUBLIC');
  return deepFreeze({source_id:`knowledge-pack:${pack.pack_id}`,canonical_identity:`knowledge-pack:${pack.task_id}:${pack.role}:${pack.phase}`,path,trust_level:'TRUSTED',sensitivity,content_checksum:pack.checksum,token_estimate:pack.estimated_tokens,revalidate_after:pack.valid_until,priority:100,knowledge_pack_id:pack.pack_id});
}
