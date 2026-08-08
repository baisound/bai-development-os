import { satisfiesBounds } from '../release/semver.mjs';
import { verifyExtensionManifest } from './manifest.mjs';
import { deepFreeze } from './util.mjs';
export function evaluateExtensionCompatibility(manifest,{os_version,platform=null,architecture=null,installed_extension_ids=[],installed_extensions=[]}={}){
  verifyExtensionManifest(manifest); const reasons=[]; if(!os_version||!satisfiesBounds(os_version,{min:manifest.compatibility.os_min,max:manifest.compatibility.os_max})) reasons.push('OS_VERSION');
  if(manifest.compatibility.platforms.length&&(!platform||!manifest.compatibility.platforms.includes(platform))) reasons.push('PLATFORM');
  if(manifest.compatibility.architectures.length&&(!architecture||!manifest.compatibility.architectures.includes(architecture))) reasons.push('ARCHITECTURE');
  const byId=new Map(installed_extensions.map(x=>[x.extension_id,x]));for(const id of installed_extension_ids)if(!byId.has(id))byId.set(id,{extension_id:id,manifest:null,state:'INSTALLED'});
  for(const d of manifest.compatibility.dependencies??[]){const e=byId.get(d.extension_id);if(!e){reasons.push(`DEPENDENCY:${d.extension_id}`);continue;}const v=e.manifest?.extension_version;if((d.min_version||d.max_version)&&(!v||!satisfiesBounds(v,{min:d.min_version,max:d.max_version})))reasons.push(`DEPENDENCY_VERSION:${d.extension_id}`);if(d.require_enabled&&e.state!=='ENABLED')reasons.push(`DEPENDENCY_STATE:${d.extension_id}`);}
  return deepFreeze({status:reasons.length?'INCOMPATIBLE':'COMPATIBLE',reasons:[...new Set(reasons)].sort()});
}
