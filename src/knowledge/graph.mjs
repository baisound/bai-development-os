import { KnowledgeError } from './errors.mjs';
import { validateKnowledgeAsset } from './asset.mjs';
import { deepFreeze } from './util.mjs';

export function validateKnowledgeGraph(assets, { allowDanglingRelated = true } = {}) {
  const list = assets.map(a=>validateKnowledgeAsset(a)); const byId = new Map(list.map(a=>[a.asset_id,a]));
  for (const a of list) for (const rel of a.relations) {
    if (!byId.has(rel.target_asset_id) && !(allowDanglingRelated && ['RELATED_TO','DERIVED_FROM'].includes(rel.type))) throw new KnowledgeError('KNOWLEDGE_GRAPH_DANGLING_RELATION', `${a.asset_id}->${rel.target_asset_id}`);
    if (rel.target_asset_id === a.asset_id && ['REQUIRES','SUPERSEDES'].includes(rel.type)) throw new KnowledgeError('KNOWLEDGE_GRAPH_SELF_RELATION', a.asset_id);
  }
  for (const type of ['REQUIRES','SUPERSEDES']) {
    const visiting=new Set(),visited=new Set();
    function visit(id){ if(visiting.has(id))throw new KnowledgeError('KNOWLEDGE_GRAPH_CYCLE',`${type}:${id}`); if(visited.has(id))return; visiting.add(id); const a=byId.get(id); if(a) for(const r of a.relations.filter(x=>x.type===type)) if(byId.has(r.target_asset_id)) visit(r.target_asset_id); visiting.delete(id);visited.add(id); }
    for(const id of byId.keys()) visit(id);
  }
  return deepFreeze({asset_count:list.length,relation_count:list.reduce((n,a)=>n+a.relations.length,0)});
}
export function relationTargets(asset, type) { return validateKnowledgeAsset(asset).relations.filter(r=>r.type===type).map(r=>r.target_asset_id); }
