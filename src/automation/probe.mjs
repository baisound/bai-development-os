import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { deepFreeze, resolveWritableInside } from './util.mjs';
export class ProbeError extends Error { constructor(code,message=code){super(message);this.code=code;} }
export async function runRuntimeProbeSet(probes=[]){
  if(!Array.isArray(probes)||!probes.length) throw new ProbeError('PROBE_SET_INVALID'); const results=[];
  for(const p of probes){ if(!p?.probe_id||typeof p.run!=='function') throw new ProbeError('PROBE_DEFINITION_INVALID'); try{const value=await p.run();results.push({probe_id:p.probe_id,result:'PASS',value});}catch(error){results.push({probe_id:p.probe_id,result:'FAIL',error:error.message});} }
  return deepFreeze({result:results.every(x=>x.result==='PASS')?'PROBE_SET_PASS':'PROBE_SET_HAS_FAILURES',results});
}
export async function executeSandboxMutationProbe(root,{relative_sandbox='.bai-os/probe-sandbox',authorized=false}={}){
  if(!authorized) throw new ProbeError('MUTATION_PROBE_NOT_AUTHORIZED'); const dir=await resolveWritableInside(root,relative_sandbox,ProbeError,{escapeCode:'MUTATION_PROBE_PATH_ESCAPE'}); await mkdir(dir,{recursive:true});
  const marker=path.join(dir,`probe-${process.pid}-${Date.now()}.txt`); const payload='BAI_MUTATION_PROBE'; await writeFile(marker,payload,{flag:'wx'}); const roundtrip=await readFile(marker,'utf8'); await rm(marker,{force:true});
  if(roundtrip!==payload) throw new ProbeError('MUTATION_PROBE_ROUNDTRIP_FAILED'); return deepFreeze({result:'SANDBOX_MUTATION_PROBE_PASS',sandbox:relative_sandbox,production_mutation:false});
}
export async function runFaultInjection({fault_id,inject,verify,authorized=false,sandbox_only=true}={}){
  if(!authorized) throw new ProbeError('FAULT_INJECTION_NOT_AUTHORIZED'); if(!sandbox_only) throw new ProbeError('FAULT_INJECTION_PRODUCTION_FORBIDDEN'); if(!fault_id||typeof inject!=='function'||typeof verify!=='function') throw new ProbeError('FAULT_INJECTION_INVALID');
  let observed; try{observed=await inject();}catch(error){observed={threw:true,code:error.code??null,message:error.message};} const verdict=await verify(observed); if(verdict!==true) throw new ProbeError('FAULT_INJECTION_EXPECTATION_FAILED',fault_id); return deepFreeze({result:'FAULT_INJECTION_PASS',fault_id,observed,sandbox_only:true});
}
