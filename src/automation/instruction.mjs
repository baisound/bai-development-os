import { createHash } from 'node:crypto';
import { verifyAuthorizationEnvelope } from '../security/authorization.mjs';
import { deepFreeze, requireString, stable } from './util.mjs';

export class InstructionCompilationError extends Error { constructor(code,message=code){super(message);this.code=code;} }
const checksum=(v)=>`sha256:${createHash('sha256').update(stable(v)).digest('hex')}`;
export function compileOrchestratorInstruction({startup_package,task_definition,role_specification,knowledge_summary=null,additional_constraints=[]}={}){
  if(!startup_package?.startup_id) throw new InstructionCompilationError('INSTRUCTION_STARTUP_REQUIRED');
  requireString(task_definition,'task_definition',InstructionCompilationError,'INSTRUCTION_INPUT_INVALID');
  requireString(role_specification,'role_specification',InstructionCompilationError,'INSTRUCTION_INPUT_INVALID');
  const instruction={instruction_version:'1.0.0',project_id:startup_package.project_id,task_id:startup_package.task_id,role:startup_package.role,phase:startup_package.phase,run_id:startup_package.run_id,authority:{owner_approval_required:startup_package.owner_approval_required,lifecycle_snapshot:startup_package.lifecycle_snapshot},scope:{allowed_paths:[...startup_package.allowed_paths],protected_paths:[...startup_package.protected_paths]},stop_conditions:[...startup_package.stop_conditions],expected_outputs:[...startup_package.expected_outputs],task_definition,role_specification,knowledge_summary,context_manifest_id:startup_package.context_manifest.manifest_id,model_id:startup_package.model_route.model.model_id,runtime:startup_package.runtime_resolution,additional_constraints:[...additional_constraints]};
  const compiled_text=[`ROLE: ${instruction.role}`,`TASK: ${instruction.task_id}`,`PHASE: ${instruction.phase}`,`RUN: ${instruction.run_id}`,'','AUTHORITY',JSON.stringify(instruction.authority),'','ALLOWED PATHS',instruction.scope.allowed_paths.join('\n'),'','PROTECTED PATHS',instruction.scope.protected_paths.join('\n'),'','STOP CONDITIONS',instruction.stop_conditions.join('\n'),'','EXPECTED OUTPUTS',instruction.expected_outputs.join('\n'),'','TASK DEFINITION',task_definition,'','ROLE SPECIFICATION',role_specification,knowledge_summary?'\nKNOWLEDGE SUMMARY\n'+knowledge_summary:'',additional_constraints.length?'\nADDITIONAL CONSTRAINTS\n'+additional_constraints.join('\n'):''].join('\n');
  return deepFreeze({...instruction,compiled_text,prompt_checksum:checksum(compiled_text)});
}
export function createOwnerAuthorizationProposal(input={}){
  for(const field of ['owner_intent','requested_role','task_id','phase']) requireString(input[field],field,InstructionCompilationError,'OWNER_PROPOSAL_INVALID');
  if(!input.current_state||!input.active_gate||!input.runtime_preflight) throw new InstructionCompilationError('OWNER_PROPOSAL_INVALID');
  return deepFreeze({authorization_proposal_version:'1.0.0',type:'AUTHORIZATION_PROPOSAL',task_id:input.task_id,phase:input.phase,requested_role:input.requested_role,owner_intent:input.owner_intent,current_state:structuredClone(input.current_state),active_gate:structuredClone(input.active_gate),critical_high_findings:[...(input.critical_high_findings??[])],allowed_paths:[...(input.allowed_paths??[])],protected_paths:[...(input.protected_paths??[])],runtime_preflight:structuredClone(input.runtime_preflight),risk_profile:structuredClone(input.risk_profile??{}),validation_plan:[...(input.validation_plan??[])],stop_conditions:[...(input.stop_conditions??[])],completion_pause:input.completion_pause??'PAUSE_BEFORE_IRREVERSIBLE_OR_EXTERNAL_SIDE_EFFECT',recommended_model_cost_tier:input.recommended_model_cost_tier??null,retry_classification:input.retry_classification??'BOUNDED',human_approval_summary:input.human_approval_summary??input.owner_intent,owner_approval_required:true,authorization_granted:false});
}
export function validateOwnerApproval(proposal,approval,{clock=()=>new Date(),security=null}={}){
  if(!proposal?.owner_approval_required) throw new InstructionCompilationError('OWNER_PROPOSAL_INVALID');
  if(!approval||approval.authorized!==true) throw new InstructionCompilationError('NOT_AUTHORIZED');
  if(approval.task_id!==proposal.task_id||approval.phase!==proposal.phase||approval.role!==proposal.requested_role) throw new InstructionCompilationError('AUTHORIZATION_SCOPE_MISMATCH');
  if(approval.expires_at && (Number.isNaN(Date.parse(approval.expires_at)) || Date.parse(approval.expires_at)<=clock().getTime())) throw new InstructionCompilationError('AUTHORIZATION_EXPIRED');
  if(security?.require_signed===true){try{verifyAuthorizationEnvelope(approval,{public_key:security.public_key,expected_key_id:security.expected_key_id??null,required_binding:{task_id:proposal.task_id,phase:proposal.phase,role:proposal.requested_role},now:clock().getTime()});}catch(error){throw new InstructionCompilationError(error.code==='SECURITY_AUTHORIZATION_SIGNATURE_REQUIRED'?'AUTHORIZATION_SIGNATURE_REQUIRED':'AUTHORIZATION_SIGNATURE_INVALID',error.message);}}
  return deepFreeze({result:'OWNER_APPROVAL_VALID',approval_id:approval.approval_id??null,task_id:proposal.task_id,phase:proposal.phase,role:proposal.requested_role});
}
