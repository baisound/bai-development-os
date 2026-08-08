import { validateRecord } from '../lifecycle/phase1/index.mjs';
import { readCostLedger } from '../cost-guard/index.mjs';
import { listCurrentKnowledgeAssets, listKnowledgeUsageEvents, verifyKnowledgeStore } from '../knowledge/index.mjs';
import { checksumObject, deepFreeze, nowIso } from './util.mjs';
export async function collectVerifiedMonitoringSources(input={}, {clock=()=>new Date()}={}){
  const observed_at=nowIso(clock); const sources={}; const source_metadata={};
  if(input.lifecycle_records){for(const record of input.lifecycle_records)validateRecord(record);sources.lifecycle_records=input.lifecycle_records.map(x=>structuredClone(x));source_metadata.lifecycle_records={observed_at,verified:true,checksum:checksumObject(sources.lifecycle_records),revision:Math.max(...sources.lifecycle_records.map(x=>x.record_revision??0),0)};}
  if(input.cost_root){const events=await readCostLedger(input.cost_root);sources.cost_events=events.map(x=>structuredClone(x));source_metadata.cost_events={observed_at,verified:true,checksum:checksumObject(sources.cost_events),revision:events.length};}
  if(input.knowledge_root){const verification=await verifyKnowledgeStore(input.knowledge_root);const [assets,usage]=await Promise.all([listCurrentKnowledgeAssets(input.knowledge_root),listKnowledgeUsageEvents(input.knowledge_root)]);sources.knowledge_assets=assets.map(x=>structuredClone(x));sources.knowledge_usage_events=usage.map(x=>structuredClone(x));source_metadata.knowledge_assets={observed_at,verified:verification.repository?.result==='KNOWLEDGE_REPOSITORY_VERIFIED',checksum:checksumObject(sources.knowledge_assets),revision:sources.knowledge_assets.length};source_metadata.knowledge_usage_events={observed_at,verified:verification.usage?.result==='KNOWLEDGE_USAGE_LEDGER_VERIFIED',checksum:checksumObject(sources.knowledge_usage_events),revision:sources.knowledge_usage_events.length};}
  for(const name of ['test_results','automation_runs','context_observations','model_events','registry_events','integration_events','governance_events','system_events']){
    if(input[name]){sources[name]=input[name].map(x=>structuredClone(x));const meta=input.source_metadata?.[name]??{};source_metadata[name]={observed_at:meta.observed_at??observed_at,verified:meta.verified===true,checksum:meta.checksum??checksumObject(sources[name]),revision:meta.revision??sources[name].length};}
  }
  return deepFreeze({result:'VERIFIED_MONITORING_SOURCES_COLLECTED',sources,source_metadata,canonical_mutation_authority:false});
}
