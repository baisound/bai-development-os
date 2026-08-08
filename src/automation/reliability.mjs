import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash, randomUUID } from 'node:crypto';
import { createCheckpoint, evaluateResume, validateCheckpoint } from '../lifecycle/recovery/index.mjs';
import { deepFreeze, requireString, stable } from './util.mjs';
const execFileAsync=promisify(execFile);
export class ReliabilityError extends Error { constructor(code,message=code){super(message);this.code=code;} }
export function classifyRetry({attempt,limit,error_class,hypothesis_changed=false,external_side_effect=false}={}){
  if(!Number.isInteger(attempt)||attempt<0||!Number.isInteger(limit)||limit<0) throw new ReliabilityError('RETRY_INPUT_INVALID');
  if(attempt>=limit) return deepFreeze({result:'RETRY_EXHAUSTED',retry_allowed:false,escalate:true});
  if(external_side_effect) return deepFreeze({result:'RETRY_REQUIRES_OWNER',retry_allowed:false,escalate:true});
  const deterministic=['AUTHORIZATION','POLICY','SCHEMA','PATH_ESCAPE','CANONICAL_CONFLICT'].includes(error_class);
  if(deterministic&&!hypothesis_changed) return deepFreeze({result:'RETRY_BLOCKED_SAME_HYPOTHESIS',retry_allowed:false,escalate:true});
  return deepFreeze({result:'RETRY_ALLOWED',retry_allowed:true,next_attempt:attempt+1,requires_hypothesis_change:deterministic});
}
export function createSessionRecord({project_id,task_id,role,run_id=randomUUID(),session_id=randomUUID(),startup_checksum,status='ACTIVE',attempt=0}={},{clock=()=>new Date()}={}){
  for(const [n,v] of Object.entries({project_id,task_id,role,startup_checksum})) requireString(v,n,ReliabilityError,'SESSION_INPUT_INVALID');
  const record={session_record_version:'1.0.0',project_id,task_id,role,run_id,session_id,startup_checksum,status,attempt,created_at:clock().toISOString()};
  record.content_checksum=`sha256:${createHash('sha256').update(stable(record)).digest('hex')}`; return deepFreeze(record);
}
export function prepareSafeRestart({checkpoint_input,current_state}={}){
  const checkpoint=createCheckpoint(checkpoint_input); const valid=validateCheckpoint(checkpoint,current_state); return deepFreeze({result:'SAFE_RESTART_PREPARED',checkpoint,validation:valid});
}
export function validateSafeRestart({checkpoint,current_state,resume_conditions}={}){
  const validation=validateCheckpoint(checkpoint,current_state); const resume=evaluateResume({current_status:checkpoint.saved_status,checkpoint_result:validation.result,...resume_conditions}); return deepFreeze({result:'SAFE_RESTART_ALLOWED',validation,resume});
}
export async function resolveWorktreeEvidence(root,{exec=execFileAsync}={}){
  try {
    const [{stdout:status},{stdout:head},{stdout:branch}]=await Promise.all([
      exec('git',['status','--porcelain=v1'],{cwd:root}),exec('git',['rev-parse','HEAD'],{cwd:root}),exec('git',['rev-parse','--abbrev-ref','HEAD'],{cwd:root})
    ]);
    const lines=status.trim()?status.trimEnd().split('\n'):[];
    return deepFreeze({result:'WORKTREE_EVIDENCE_READY',branch:branch.trim(),commit:head.trim(),clean:lines.length===0,changes:lines,source:'git-command'});
  } catch(error){ throw new ReliabilityError('WORKTREE_EVIDENCE_UNAVAILABLE',error.message); }
}
