import { spawn } from 'node:child_process';
import { realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { CONFORMANCE_STATUS } from './constants.mjs';
import { ConformanceError } from './errors.mjs';
import { deepFreeze, finite, nowIso, safeId } from './util.mjs';

const MAX_OUTPUT=1024*1024;
function inside(root,target){const rel=path.relative(root,target);return rel===''||(!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel));}
async function commandFor(fixture,root){ const contract=fixture.consumer_contract??{mode:'NONE',trust:'DECLARED_ONLY'}; if(!['TRUSTED_LOCAL','SANDBOXED'].includes(contract.trust)) throw new ConformanceError('CONFORMANCE_CONTRACT_UNTRUSTED'); if(contract.mode==='NODE_TEST'||contract.mode==='NODE_SCRIPT'){ const target=await realpath(path.join(root,contract.target)); if(!inside(root,target))throw new ConformanceError('CONFORMANCE_CONTRACT_TARGET_ESCAPE'); return {command:process.execPath,args:contract.mode==='NODE_TEST'?['--test',target]:[target]}; } if(contract.mode==='NPM_SCRIPT') return {command:process.platform==='win32'?'npm.cmd':'npm',args:['run',contract.script,'--if-present=false']}; throw new ConformanceError('CONFORMANCE_CONTRACT_NOT_CONFIGURED'); }
export async function runConsumerContract({fixture,cwd,timeout_ms=60000,env={},clock=()=>new Date()}={}){
  if(!fixture?.fixture_id)throw new ConformanceError('CONFORMANCE_FIXTURE_REQUIRED'); const root=await realpath(cwd); await stat(root); finite(timeout_ms,'timeout_ms',{min:1,max:300000}); const {command,args}=await commandFor(fixture,root);
  const started=Date.now(); let stdout='',stderr='',timedOut=false;
  const result=await new Promise((resolve,reject)=>{const child=spawn(command,args,{cwd:root,shell:false,env:{...process.env,...env},stdio:['ignore','pipe','pipe']}); const append=(kind,chunk)=>{const text=chunk.toString(); if(kind==='out')stdout=(stdout+text).slice(-MAX_OUTPUT); else stderr=(stderr+text).slice(-MAX_OUTPUT);}; child.stdout.on('data',c=>append('out',c)); child.stderr.on('data',c=>append('err',c)); child.on('error',reject); const timer=setTimeout(()=>{timedOut=true;child.kill('SIGKILL');},timeout_ms); child.on('close',(code,signal)=>{clearTimeout(timer);resolve({code,signal});});});
  const status=!timedOut&&result.code===0?CONFORMANCE_STATUS.PASS:CONFORMANCE_STATUS.FAIL;
  return deepFreeze({consumer_contract_run_version:'1.0.0',fixture_id:safeId(fixture.fixture_id),project_id:safeId(fixture.project_id),generated_at:nowIso(clock),evidence_level:fixture.evidence_level,status,contract_mode:fixture.consumer_contract.mode,contract_trust:fixture.consumer_contract.trust,exit_code:result.code,signal:result.signal,timed_out:timedOut,duration_ms:Date.now()-started,stdout,stderr});
}
