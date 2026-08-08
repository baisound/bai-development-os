import { createHash, randomUUID } from 'node:crypto';
import { buildContextManifest, validateContextManifest } from '../context-control/index.mjs';
import { routeModel, verifyRoleIndependence } from '../model-control/index.mjs';
import { deepFreeze, requireString, stable } from './util.mjs';

export class StartupError extends Error { constructor(code,message=code){super(message);this.code=code;} }
const digest=(v)=>`sha256:${createHash('sha256').update(stable(v)).digest('hex')}`;
export function buildRoleStartupPackage(input={}){
  for(const field of ['project_id','task_id','role','phase']) requireString(input[field],field,StartupError,'STARTUP_INPUT_INVALID');
  if(!input.runtime_resolution || !['ENVIRONMENT_CAPABILITY_READY','RUNTIME_READY'].includes(input.runtime_resolution.result)) throw new StartupError('INVALID_START_RUNTIME');
  if(!input.project_resolution || input.project_resolution.result!=='PROJECT_RESOLVED') throw new StartupError('INVALID_START_PROJECT');
  if(!input.risk_resolution || input.risk_resolution.result!=='RISK_RESOLVED') throw new StartupError('INVALID_START_RISK');
  if(!input.knowledge_integration || !['KNOWLEDGE_INTEGRATION_READY','KNOWLEDGE_NOT_REQUIRED'].includes(input.knowledge_integration.result)) throw new StartupError('INVALID_START_KNOWLEDGE');
  if(!input.lifecycle_snapshot || input.lifecycle_snapshot.task_id!==input.task_id) throw new StartupError('INVALID_START_LIFECYCLE');
  const modelRoute=routeModel(input.model_request??{},input.model_profiles??[]);
  if(!['MODEL_ROUTE_READY','MODEL_ROUTE_FALLBACK'].includes(modelRoute.result)) throw new StartupError('INVALID_START_MODEL');
  verifyRoleIndependence({role:input.role,session_id:input.session_id,builder_session_id:input.builder_session_id,artifact_based:input.artifact_based!==false});
  const sources=[...(input.canonical_sources??[])];
  if(input.knowledge_integration.pack){
    sources.push({source_id:`knowledge-pack:${input.knowledge_integration.pack.pack_id}`,path:`knowledge-pack://${input.knowledge_integration.pack.pack_id}`,trust_level:'TRUSTED',sensitivity:input.model_request?.sensitivity??'INTERNAL',content_checksum:input.knowledge_integration.pack.content_checksum,token_estimate:input.knowledge_integration.pack.total_estimated_tokens??0,canonical_identity:`knowledge-pack:${input.knowledge_integration.pack.pack_id}`});
  }
  const context_manifest=buildContextManifest({task_id:input.task_id,status_revision:input.lifecycle_snapshot.status_revision,role:input.role,phase:input.phase,required_sources:sources,optional_sources:input.optional_sources??[],excluded_sources:[],source_priority:sources.map(x=>x.source_id)});
  validateContextManifest(context_manifest,{status_revision:input.lifecycle_snapshot.status_revision,max_tokens:input.context_token_budget??null,allowed_sensitivity:input.model_request?.sensitivity??'RESTRICTED'});
  const pkg={startup_package_version:'1.0.0',startup_id:randomUUID(),project_id:input.project_id,task_id:input.task_id,role:input.role,phase:input.phase,session_id:input.session_id??randomUUID(),run_id:input.run_id??randomUUID(),lifecycle_snapshot:structuredClone(input.lifecycle_snapshot),runtime_resolution:structuredClone(input.runtime_resolution),project_resolution:structuredClone(input.project_resolution),risk_resolution:structuredClone(input.risk_resolution),knowledge_pack_id:input.knowledge_integration.pack?.pack_id??null,context_manifest,model_route:modelRoute,allowed_paths:[...(input.allowed_paths??[])],protected_paths:[...(input.protected_paths??[])],stop_conditions:[...(input.stop_conditions??[])],expected_outputs:[...(input.expected_outputs??[])],owner_approval_required:Boolean(input.owner_approval_required??false),created_at:new Date().toISOString()};
  pkg.prompt_binding_checksum=digest({project_id:pkg.project_id,task_id:pkg.task_id,role:pkg.role,phase:pkg.phase,context_checksum:context_manifest.content_checksum,model_id:modelRoute.model.model_id,allowed_paths:pkg.allowed_paths,protected_paths:pkg.protected_paths});
  return deepFreeze(pkg);
}
export function validateRoleActivation(pkg,current={}){
  if(!pkg?.startup_package_version||!pkg.prompt_binding_checksum) throw new StartupError('INVALID_START_PACKAGE');
  if(current.task_id && current.task_id!==pkg.task_id) throw new StartupError('INVALID_START_TASK_CHANGED');
  if(current.status_revision!=null && current.status_revision!==pkg.lifecycle_snapshot.status_revision) throw new StartupError('INVALID_START_STATUS_CHANGED');
  if(current.phase && current.phase!==pkg.phase) throw new StartupError('INVALID_START_PHASE_CHANGED');
  if(current.owner_approval_required && !current.owner_authorized) throw new StartupError('INVALID_START_NOT_AUTHORIZED');
  if(current.worktree_clean_required && current.worktree_clean!==true) throw new StartupError('INVALID_START_WORKTREE');
  return deepFreeze({result:'ROLE_ACTIVATION_VALID',startup_id:pkg.startup_id,run_id:pkg.run_id,session_id:pkg.session_id});
}
