import { randomUUID } from 'node:crypto';
const REQUIRED=['technical','quality','policy','status','risk','follow_up','knowledge','resources','cost','owner'];
export class ClosureError extends Error { constructor(code,message=code){super(message);this.code=code;} }
export function evaluateClosureReadiness(input={}){
  if(['CANCELLED','REJECTED'].includes(input.task_status))return Object.freeze({result:'CLOSURE_NOT_APPLICABLE',blocking:[]});
  const blocking=[];const unconfirmed=[];
  for(const key of REQUIRED){const v=input[key];if(!v||!['PASS','NOT_APPLICABLE','ACCEPTED'].includes(v.result)){if(v?.result==='NOT_CONFIRMED')unconfirmed.push(key);else blocking.push(key);}}
  if((input.unresolved_critical??0)>0||(input.unresolved_high??0)>0)blocking.push('quality.unresolved_high_or_critical');
  if((input.unsettled_cost_microusd??0)>0)blocking.push('cost.unsettled');
  if(input.uncommitted_changes===true)blocking.push('resources.uncommitted_changes');
  if(input.active_processes>0)blocking.push('resources.active_processes');
  if(input.exposed_secrets>0)blocking.push('resources.exposed_secrets');
  const result=blocking.length?'CLOSURE_BLOCKED':unconfirmed.length?'CLOSURE_NOT_CONFIRMED':'CLOSURE_READY';
  return Object.freeze({result,blocking:Object.freeze([...new Set(blocking)]),unconfirmed:Object.freeze([...new Set(unconfirmed)])});
}
export function createCompletionRecord({task_id,closure_result,evidence=[],accepted_risks=[],follow_up_task_ids=[],knowledge_candidates=[],owner_authorized=false},{clock=()=>new Date()}={}){
  if(closure_result!=='CLOSURE_READY')throw new ClosureError('CLOSURE_NOT_READY');if(!owner_authorized)throw new ClosureError('CLOSURE_OWNER_AUTH_REQUIRED');
  return Object.freeze({completion_record_version:'1.0.0',completion_id:randomUUID(),task_id,status:'COMPLETED',closure_result,evidence:Object.freeze([...evidence]),accepted_risks:Object.freeze([...accepted_risks]),follow_up_task_ids:Object.freeze([...follow_up_task_ids]),knowledge_candidates:Object.freeze([...knowledge_candidates]),completed_at:clock().toISOString()});
}
