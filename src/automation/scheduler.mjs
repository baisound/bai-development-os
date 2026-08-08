import { deepFreeze } from './util.mjs';
export class SchedulerError extends Error { constructor(code,message=code){super(message);this.code=code;} }
export function orderAutomationActions(actions=[]){
  const byId=new Map(); for(const a of actions){if(!a.action_id||byId.has(a.action_id))throw new SchedulerError('SCHEDULER_ACTION_ID_INVALID');byId.set(a.action_id,a);} const visiting=new Set(),done=new Set(),out=[];
  function visit(id){if(done.has(id))return;if(visiting.has(id))throw new SchedulerError('SCHEDULER_DEPENDENCY_CYCLE');const a=byId.get(id);if(!a)throw new SchedulerError('SCHEDULER_DEPENDENCY_MISSING',id);visiting.add(id);for(const dep of a.depends_on??[])visit(dep);visiting.delete(id);done.add(id);out.push(a);}
  for(const id of byId.keys())visit(id); return deepFreeze(out.map(x=>structuredClone(x)));
}
export function selectRunnableActions(actions,{completed_action_ids=[],now=new Date()}={}){
  const completed=new Set(completed_action_ids); const ordered=orderAutomationActions(actions); const runnable=[]; const waiting=[];
  for(const a of ordered){const deps=a.depends_on??[];if(deps.some(d=>!completed.has(d))){waiting.push({action_id:a.action_id,reason:'DEPENDENCY'});continue;}if(a.not_before&&Date.parse(a.not_before)>now.getTime()){waiting.push({action_id:a.action_id,reason:'NOT_BEFORE'});continue;}if(a.deadline&&Date.parse(a.deadline)<=now.getTime())throw new SchedulerError('SCHEDULER_DEADLINE_EXPIRED',a.action_id);runnable.push(a);}
  return deepFreeze({result:'SCHEDULE_RESOLVED',runnable,waiting});
}
export function normalizeExecutionResult({action_id,raw_result,expected_schema=null,evidence=[]}={}){
  if(!action_id)throw new SchedulerError('RESULT_NORMALIZATION_INVALID');const ok=raw_result?.ok!==false;const normalized={action_id,ok,status:ok?'PASS':'FAIL',artifact:raw_result?.artifact??null,data:raw_result?.data??null,evidence:[...evidence],schema_valid:expected_schema?Boolean(raw_result?.schema_valid):null};if(expected_schema&&normalized.schema_valid!==true)normalized.status='FAIL';return deepFreeze(normalized);
}
export function evaluateGate({results=[],authorization='NOT_REQUIRED',required_evidence_count=0}={}){
  const failed=results.filter(r=>r.status!=='PASS');const evidence=results.reduce((n,r)=>n+(r.evidence?.length??0),0);if(authorization==='REQUIRED_NOT_AUTHORIZED')return deepFreeze({result:'GATE_BLOCKED',reasons:['NOT_AUTHORIZED']});if(failed.length)return deepFreeze({result:'GATE_FAIL',reasons:failed.map(x=>`ACTION_FAILED:${x.action_id}`)});if(evidence<required_evidence_count)return deepFreeze({result:'GATE_FAIL',reasons:['EVIDENCE_INSUFFICIENT']});return deepFreeze({result:'GATE_PASS',reasons:[]});
}
