import { selectDevelopmentProfile } from '../governance/adaptive-development-profile.mjs';
import { resolveKnowledgeFromRepository } from '../knowledge/service.mjs';
import { deepFreeze, requireString } from './util.mjs';

export class OrchestrationResolutionError extends Error { constructor(code,message=code){super(message);this.code=code;} }
export function resolveProject({project_id,project_root,registry,expected_manifest_path='PROJECT.md'}={}){
  requireString(project_id,'project_id',OrchestrationResolutionError,'PROJECT_RESOLUTION_INVALID'); requireString(project_root,'project_root',OrchestrationResolutionError,'PROJECT_RESOLUTION_INVALID');
  if(Array.isArray(registry?.projects)){
    const matches=registry.projects.filter(e=>e.project_id===project_id);
    if(matches.length!==1) throw new OrchestrationResolutionError(matches.length?'PROJECT_RESOLUTION_AMBIGUOUS':'PROJECT_MANIFEST_NOT_DISCOVERED');
    if(matches[0].root!==project_root) throw new OrchestrationResolutionError('PROJECT_ROOT_MISMATCH');
    return deepFreeze({result:'PROJECT_RESOLVED',project_id,project_root,project_manifest:matches[0],authority:'PROJECT_INDEX_PLUS_OWNER_INPUT'});
  }
  const matches=(registry?.entries??[]).filter(e=>e.category==='PROJECT'&&e.path===expected_manifest_path);
  if(matches.length!==1) throw new OrchestrationResolutionError(matches.length?'PROJECT_RESOLUTION_AMBIGUOUS':'PROJECT_MANIFEST_NOT_DISCOVERED');
  return deepFreeze({result:'PROJECT_RESOLVED',project_id,project_root,project_manifest:matches[0],authority:'PROJECT_MANIFEST_PLUS_OWNER_INPUT'});
}
export function resolveRisk(change){
  try { const selection=selectDevelopmentProfile(change); return deepFreeze({result:'RISK_RESOLVED',profile_id:selection.profile_id,score:selection.score,reasons:[...selection.reasons],execution:selection.execution}); }
  catch(error){ throw new OrchestrationResolutionError('RISK_RESOLUTION_INVALID',error.message); }
}
export async function resolveTaskKnowledge({knowledge_root,request,pack_id,clock}={}){
  if(!knowledge_root) throw new OrchestrationResolutionError('KNOWLEDGE_ROOT_REQUIRED');
  const outcome=await resolveKnowledgeFromRepository(knowledge_root,request,{pack_id,clock});
  if(outcome.resolution.result!=='KNOWLEDGE_RESOLUTION_READY') return deepFreeze({result:'KNOWLEDGE_INTEGRATION_BLOCKED',...outcome});
  return deepFreeze({result:'KNOWLEDGE_INTEGRATION_READY',resolution:outcome.resolution,pack:outcome.pack,context_ingestion_required:true,registry_is_knowledge_authority:false});
}
