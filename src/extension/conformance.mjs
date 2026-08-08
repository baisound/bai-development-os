import { evaluateExtensionCompatibility } from './compatibility.mjs';
import { verifyExtensionManifest } from './manifest.mjs';
import { verifyDomainPack } from './packs.mjs';
import { validateProviderContract } from './provider.mjs';
import { checksumObject,deepFreeze } from './util.mjs';
export async function runExtensionConformance({manifest,provider=null,environment={},required_capabilities=[],required_pack_types=[],packs=[],sandbox_probe=null,trust_probe=null}={}){
  const checks=[];
  try{verifyExtensionManifest(manifest);checks.push({check:'MANIFEST',status:'PASS'});}catch(e){checks.push({check:'MANIFEST',status:'FAIL',code:e.code});}
  const manifestOk=checks[0].status==='PASS';
  const comp=manifestOk?evaluateExtensionCompatibility(manifest,environment):{status:'INCOMPATIBLE',reasons:['MANIFEST']};
  checks.push({check:'COMPATIBILITY',status:comp.status==='COMPATIBLE'?'PASS':'FAIL',details:comp.reasons});
  const caps=new Set(manifest?.capabilities?.map(x=>x.capability_id)??[]);const missing=required_capabilities.filter(x=>!caps.has(x));checks.push({check:'CAPABILITIES',status:missing.length?'FAIL':'PASS',details:missing});
  const boundPacks=[];const badPacks=[];
  for(const p of packs.filter(p=>p?.extension_id===manifest?.extension_id)){try{verifyDomainPack(p);boundPacks.push(p);}catch(e){badPacks.push({pack_id:p?.pack_id??null,code:e.code});}}
  checks.push({check:'PACK_INTEGRITY',status:badPacks.length?'FAIL':'PASS',details:badPacks});
  const packTypes=new Set(boundPacks.map(p=>p.pack_type));const missingP=required_pack_types.filter(x=>!packTypes.has(x));checks.push({check:'PACKS',status:missingP.length?'FAIL':'PASS',details:missingP});
  const runtime=manifest?.execution_mode;
  if(runtime==='DECLARATIVE'){
    checks.push({check:'RUNTIME',status:'PASS',details:['DECLARATIVE']});
  }else if(!provider){
    checks.push({check:'PROVIDER_CONTRACT',status:'FAIL',details:['PROVIDER_MISSING']});
  }else{
    try{validateProviderContract(manifest,provider);checks.push({check:'PROVIDER_CONTRACT',status:'PASS',details:[provider.implementation_checksum]});}
    catch(e){checks.push({check:'PROVIDER_CONTRACT',status:'FAIL',code:e.code,details:e.details??[]});}
  }
  if(runtime==='IN_PROCESS_TRUSTED'&&manifest?.capabilities?.some(c=>c.sandbox_required))checks.push({check:'SANDBOX_BOUNDARY',status:'FAIL',details:['IN_PROCESS_CAPABILITY_REQUIRES_SANDBOX']});
  if(runtime==='SANDBOXED'&&provider&&sandbox_probe){const ok=await sandbox_probe({manifest,provider});checks.push({check:'SANDBOX',status:ok?'PASS':'FAIL'});}
  else if(runtime==='SANDBOXED'&&provider)checks.push({check:'SANDBOX',status:'CONDITIONAL',details:['NOT_EXECUTED']});
  else if(runtime==='IN_PROCESS_TRUSTED'&&provider&&trust_probe){const ok=await trust_probe({manifest,provider});checks.push({check:'EXECUTION_TRUST',status:ok?'PASS':'FAIL'});}
  else if(runtime==='IN_PROCESS_TRUSTED'&&provider)checks.push({check:'EXECUTION_TRUST',status:'CONDITIONAL',details:['SELF_DECLARED_TRUST_NOT_EVIDENCE']});
  if(runtime==='IN_PROCESS_TRUSTED')checks.push({check:'RESOURCE_ISOLATION',status:'PASS',details:['MAX_CONCURRENCY_AND_RUNTIME_ENFORCED','MAX_MEMORY_ADVISORY_REQUIRES_SANDBOX_FOR_HARD_LIMIT']});
  const status=checks.some(x=>x.status==='FAIL')?'FAIL':checks.some(x=>x.status==='CONDITIONAL')?'CONDITIONAL':'PASS';
  const report={extension_conformance_version:'1.0.0',extension_id:manifest?.extension_id??null,status,checks};report.content_checksum=checksumObject(report);return deepFreeze(report);
}
