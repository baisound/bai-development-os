import { listCurrentKnowledgeAssets, verifyKnowledgeRepository } from './repository.mjs';
import { resolveKnowledge } from './resolver.mjs';
import { buildKnowledgePack } from './pack.mjs';
import { appendKnowledgeUsageEvent, listKnowledgePackArtifacts, listKnowledgeUsageEvents, saveKnowledgePackArtifact, verifyKnowledgeUsageLedger } from './ledger.mjs';
import { createKnowledgeUsageEvent } from './usage.mjs';
import { analyzeInvalidKnowledgeImpact } from './impact.mjs';
import { deepFreeze, safeId } from './util.mjs';

export async function resolveKnowledgeFromRepository(root,request,{pack_id,ttl_seconds=3600,clock,persist_pack=true}={}){
  const assets=await listCurrentKnowledgeAssets(root); const resolution=resolveKnowledge(request,assets);
  if(resolution.result!=='KNOWLEDGE_RESOLUTION_READY')return deepFreeze({resolution,pack:null});
  const id=pack_id??`KP-${safeId(request.task_id,'task_id')}-${Date.now()}`; const pack=buildKnowledgePack({resolution,assets,pack_id:id,ttl_seconds,clock});
  if(persist_pack)await saveKnowledgePackArtifact(root,pack); return deepFreeze({resolution,pack});
}
export async function recordKnowledgeApplication(root,input,{clock}={}){const event=createKnowledgeUsageEvent(input,{clock});await appendKnowledgeUsageEvent(root,event);return event;}
export async function analyzeRepositoryKnowledgeImpact(root,asset){const [usage_events,packs]=await Promise.all([listKnowledgeUsageEvents(root),listKnowledgePackArtifacts(root)]);return analyzeInvalidKnowledgeImpact({asset,usage_events,packs});}
export async function verifyKnowledgeStore(root){const [repository,usage,packs]=await Promise.all([verifyKnowledgeRepository(root),verifyKnowledgeUsageLedger(root),listKnowledgePackArtifacts(root)]);return deepFreeze({result:'KNOWLEDGE_STORE_VERIFIED',repository,usage,pack_count:packs.length});}
