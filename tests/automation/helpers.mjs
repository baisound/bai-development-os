import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
export async function miniWorkspace(){
  const root=await mkdtemp(path.join(os.tmpdir(),'bai-task006-'));
  await mkdir(path.join(root,'tasks','TASK-001'),{recursive:true}); await mkdir(path.join(root,'specifications'),{recursive:true}); await mkdir(path.join(root,'roles'),{recursive:true}); await mkdir(path.join(root,'templates'),{recursive:true}); await mkdir(path.join(root,'schemas'),{recursive:true}); await mkdir(path.join(root,'architecture'),{recursive:true}); await mkdir(path.join(root,'registry'),{recursive:true}); await mkdir(path.join(root,'knowledge'),{recursive:true});
  await writeFile(path.join(root,'PROJECT.md'),'# Project\n'); await writeFile(path.join(root,'tasks','TASK-001','task.md'),'# TASK-001\n'); await writeFile(path.join(root,'specifications','spec.md'),'# Spec\n'); await writeFile(path.join(root,'roles','README-Builder.md'),'# Builder\n'); await writeFile(path.join(root,'templates','task.template.md'),'# Template\n'); await writeFile(path.join(root,'schemas','x.schema.json'),'{}\n'); await writeFile(path.join(root,'architecture','arch.md'),'# Arch\n'); await writeFile(path.join(root,'registry','current-state.md'),'# State\n');
  return root;
}
export const runtimeReady={result:'ENVIRONMENT_CAPABILITY_READY',runtime_profile:{observed_not_inferred:true,platform:'linux',shell:'bash'},toolchains:[],missing_capabilities:[],missing_tools:[]};
export const projectResolved={result:'PROJECT_RESOLVED',project_id:'P1',project_root:'/tmp/p1',project_manifest:{path:'PROJECT.md'},authority:'PROJECT_MANIFEST_PLUS_OWNER_INPUT'};
export const riskResolved={result:'RISK_RESOLVED',profile_id:'DEV_3_HIGH_ASSURANCE',score:12,reasons:[],execution:{}};
export const noKnowledge={result:'KNOWLEDGE_NOT_REQUIRED',pack:null};
export const lifecycle={task_id:'TASK-006',status_revision:1,status:'ACTIVE',phase:'IMPLEMENTATION',authorization_status:'AUTHORIZED'};
export const modelProfiles=[{model_id:'m1',capabilities:['code'],context_capacity:10000,tools:['shell'],max_sensitivity:'RESTRICTED',reliability:.99,estimated_cost_microusd:100,available:true,session_id:'model-session'}];
export const modelRequest={capabilities:['code'],context_tokens:100,required_tools:['shell'],sensitivity:'INTERNAL',max_cost_microusd:1000,minimum_reliability:.8};
