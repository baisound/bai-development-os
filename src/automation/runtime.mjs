import { access, realpath } from 'node:fs/promises';
import path from 'node:path';
import { deepFreeze, requireArray, requireString } from './util.mjs';

export class RuntimeResolutionError extends Error { constructor(code,message=code){super(message);this.code=code;} }
const OS = new Set(['linux','darwin','win32']);
const SHELL = new Set(['bash','sh','zsh','fish','powershell','cmd']);
const TRANSPORT = new Set(['LOCAL_PROCESS','WSL_BRIDGE','REMOTE_SHELL','CONTAINER','UNKNOWN']);
export function resolveRuntimeProfile(observation={}){
  const platform=requireString(observation.platform,'platform',RuntimeResolutionError,'RUNTIME_OBSERVATION_INVALID');
  const shell=requireString(observation.shell,'shell',RuntimeResolutionError,'RUNTIME_OBSERVATION_INVALID').toLowerCase();
  if(!OS.has(platform)||!SHELL.has(shell)) throw new RuntimeResolutionError('RUNTIME_OBSERVATION_INVALID');
  const transport=observation.transport??'LOCAL_PROCESS'; if(!TRANSPORT.has(transport)) throw new RuntimeResolutionError('RUNTIME_OBSERVATION_INVALID','transport');
  if(observation.ui_label && !observation.probe_evidence) throw new RuntimeResolutionError('RUNTIME_INFERENCE_FORBIDDEN','UI label is not runtime evidence');
  const path_style=observation.path_style??(platform==='win32'?'WINDOWS':'POSIX');
  if(!['POSIX','WINDOWS'].includes(path_style)) throw new RuntimeResolutionError('RUNTIME_OBSERVATION_INVALID','path_style');
  const profile={runtime_profile_version:'1.0.0',platform,shell,transport,path_style,probe_evidence:observation.probe_evidence??null,environment_tags:[...(observation.environment_tags??[])],capabilities:[...(observation.capabilities??[])],observed_not_inferred:true};
  return deepFreeze(profile);
}
export async function resolveProjectRoot({workspace_root,project_root}){
  requireString(workspace_root,'workspace_root',RuntimeResolutionError,'ROOT_RESOLUTION_INVALID'); requireString(project_root,'project_root',RuntimeResolutionError,'ROOT_RESOLUTION_INVALID');
  const [workspace,project]=await Promise.all([realpath(workspace_root),realpath(project_root)]).catch(()=>{throw new RuntimeResolutionError('ROOT_NOT_FOUND');});
  if(project!==workspace && !project.startsWith(workspace+path.sep)) throw new RuntimeResolutionError('ROOT_OUTSIDE_WORKSPACE');
  return deepFreeze({result:'ROOT_RESOLVED',workspace_root:workspace,project_root:project,relative_project_path:path.relative(workspace,project)||'.'});
}
export function resolveEnvironmentCapabilities({runtime_profile,toolchains=[],required_capabilities=[],required_tools=[]}={}){
  if(!runtime_profile?.observed_not_inferred) throw new RuntimeResolutionError('RUNTIME_PROFILE_UNVERIFIED');
  requireArray(toolchains,'toolchains',RuntimeResolutionError,'CAPABILITY_INPUT_INVALID');
  const tools=toolchains.map(t=>({name:requireString(t.name,'toolchain.name',RuntimeResolutionError,'CAPABILITY_INPUT_INVALID'),version:t.version??null,available:t.available!==false,capabilities:[...(t.capabilities??[])]}));
  const availableTools=new Set(tools.filter(t=>t.available).map(t=>t.name));
  const caps=new Set([...runtime_profile.capabilities,...tools.filter(t=>t.available).flatMap(t=>t.capabilities)]);
  const missing_capabilities=required_capabilities.filter(x=>!caps.has(x)); const missing_tools=required_tools.filter(x=>!availableTools.has(x));
  const result=missing_capabilities.length||missing_tools.length?'ENVIRONMENT_CAPABILITY_BLOCKED':'ENVIRONMENT_CAPABILITY_READY';
  return deepFreeze({result,runtime_profile,toolchains:tools,missing_capabilities,missing_tools});
}
export function selectCommandDialect(runtime_profile){
  if(!runtime_profile?.observed_not_inferred) throw new RuntimeResolutionError('RUNTIME_PROFILE_UNVERIFIED');
  const dialect=['powershell','cmd'].includes(runtime_profile.shell)?'WINDOWS_SHELL':'POSIX_SHELL';
  return deepFreeze({result:'COMMAND_DIALECT_RESOLVED',dialect,shell:runtime_profile.shell,path_style:runtime_profile.path_style});
}
export function buildRuntimeProbeFromProcess({shell=process.env.SHELL?.split('/').pop() ?? (process.platform==='win32'?'powershell':'sh')}={}){
  return resolveRuntimeProfile({platform:process.platform,shell,transport:'LOCAL_PROCESS',path_style:process.platform==='win32'?'WINDOWS':'POSIX',probe_evidence:`node:${process.version}`,capabilities:['NODE_RUNTIME']});
}
