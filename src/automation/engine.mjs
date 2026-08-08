import { randomUUID } from 'node:crypto';
import { validateOwnerApproval } from './instruction.mjs';
import { validateRoleActivation } from './startup.mjs';
import { classifyRetry } from './reliability.mjs';
import { deepFreeze } from './util.mjs';
export class AutomationEngineError extends Error { constructor(code,message=code){super(message);this.code=code;} }
const AUTO = new Set(['READ','SEARCH','DESIGN_PROPOSAL','TEST_NO_EXTERNAL_SIDE_EFFECT','VERIFY']);
const OWNER = new Set(['IMPLEMENT_WRITE','POLICY_UPDATE','GLOBAL_KNOWLEDGE_PROMOTION','PUBLISH','SEND','DELETE','EXTERNAL_SIDE_EFFECT','IRREVERSIBLE_CHANGE']);
export function classifyAutomationAction(action={}){
  if(AUTO.has(action.kind)) return deepFreeze({classification:'AUTOMATION_ALLOWED',owner_approval_required:false});
  if(action.kind==='IMPLEMENT_WRITE' && action.authorization_status==='AUTHORIZED' && action.scope_bound===true && action.reversible!==false && action.external_side_effect!==true){
    return deepFreeze({classification:'AUTOMATION_ALLOWED_AUTHORIZED_SCOPE',owner_approval_required:false});
  }
  if(OWNER.has(action.kind)) return deepFreeze({classification:'OWNER_APPROVAL_REQUIRED',owner_approval_required:true});
  return deepFreeze({classification:'SAFE_STOP_UNKNOWN_ACTION',owner_approval_required:true});
}
export function createAutomationPlan({startup_package,instruction,actions=[]}={}){
  if(!startup_package?.run_id||!instruction?.prompt_checksum) throw new AutomationEngineError('AUTOMATION_PLAN_INVALID');
  const classified=actions.map(action=>({...structuredClone(action),...classifyAutomationAction(action)}));
  return deepFreeze({automation_plan_version:'1.0.0',plan_id:randomUUID(),run_id:startup_package.run_id,session_id:startup_package.session_id,task_id:startup_package.task_id,phase:startup_package.phase,actions:classified,owner_approval_required:classified.some(x=>x.owner_approval_required),lifecycle_mutation_authority:false,knowledge_content_authority:false});
}
export async function executeConditionalAutomation(plan,{startup_package,current_state={},proposal=null,approval=null,approval_security=null,executor}={}){
  if(!plan?.actions||typeof executor!=='function') throw new AutomationEngineError('AUTOMATION_EXECUTION_INVALID');
  validateRoleActivation(startup_package,current_state);
  if(plan.owner_approval_required){ if(!proposal) throw new AutomationEngineError('AUTOMATION_OWNER_PROPOSAL_REQUIRED'); try{validateOwnerApproval(proposal,approval,{security:approval_security});}catch(error){throw new AutomationEngineError(error.code??'NOT_AUTHORIZED',error.message);} }
  const results=[];
  for(const action of plan.actions){
    if(action.classification==='SAFE_STOP_UNKNOWN_ACTION') throw new AutomationEngineError('AUTOMATION_UNKNOWN_ACTION');
    const result=await executor(action,{run_id:plan.run_id,session_id:plan.session_id}); results.push({action_id:action.action_id??null,kind:action.kind,result});
  }
  return deepFreeze({result:'AUTOMATION_RUN_COMPLETE',plan_id:plan.plan_id,run_id:plan.run_id,results,lifecycle_transition_proposed_not_applied:true});
}
export function evaluateAutomationResult({result,error,attempt,retry_limit,hypothesis_changed=false,external_side_effect=false}={}){
  if(result?.ok===true) return deepFreeze({decision:'CONTINUE_OR_COMPLETE',retry:null});
  const retry=classifyRetry({attempt,limit:retry_limit,error_class:error?.class??'UNKNOWN',hypothesis_changed,external_side_effect});
  return deepFreeze({decision:retry.retry_allowed?'RETRY':'SAFE_STOP_OR_ESCALATE',retry});
}
export function proposeLifecycleAction({task_id,current_status,target_status,reason,evidence=[]}={}){
  if(!task_id||!current_status||!target_status||!reason) throw new AutomationEngineError('LIFECYCLE_PROPOSAL_INVALID');
  return deepFreeze({type:'LIFECYCLE_TRANSITION_PROPOSAL',task_id,current_status,target_status,reason,evidence:[...evidence],applied:false,requires_lifecycle_authority:true});
}
