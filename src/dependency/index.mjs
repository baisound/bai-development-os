import { verifyCanonicalStatusSnapshotManifest, verifyCanonicalTaskBinding } from '../lifecycle/phase1/design-only-closure.mjs';
export class DependencyError extends Error { constructor(code,message=code){super(message);this.code=code;} }
export function detectDependencyCycles(tasks){
  const map=new Map(tasks.map(t=>[t.task_id,t.dependency_task_ids??[]])); const visiting=new Set(),done=new Set(),cycles=[];
  const visit=(id,stack)=>{if(visiting.has(id)){const i=stack.indexOf(id);cycles.push([...stack.slice(i),id]);return;}if(done.has(id))return;visiting.add(id);for(const d of map.get(id)??[])if(map.has(d))visit(d,[...stack,id]);visiting.delete(id);done.add(id);};
  for(const id of map.keys())visit(id,[]); return Object.freeze(cycles.map(Object.freeze));
}
export function evaluateDependencies(task,tasks,{project_id=null,canonical_status_trust=null,canonical_status_snapshot=null,canonical_snapshot_trust=null}={}){
  if(project_id!==null&&(typeof project_id!=='string'||!project_id||task?.project_id!==project_id||!Array.isArray(tasks)||tasks.some((row)=>row?.project_id!==project_id)))throw new DependencyError('DEPENDENCY_PROJECT_MISMATCH');
  const cycles=detectDependencyCycles(tasks);if(cycles.length)throw new DependencyError('DEPENDENCY_CYCLE');
  const map=new Map(tasks.map(t=>[t.task_id,t]));const unmet=[];const completed=[];for(const id of task.dependency_task_ids??[]){const dep=map.get(id);if(!dep||dep.task_status!=='COMPLETED'){unmet.push(id);continue;}try{verifyCanonicalTaskBinding(dep.canonical_binding,canonical_status_trust);if(typeof project_id!=='string'||task.project_id!==project_id||dep.project_id!==project_id||dep.canonical_binding.project_id!==project_id||dep.canonical_binding.task_id!==dep.task_id||dep.canonical_binding.task_status!=='COMPLETED')throw new Error();completed.push(dep.canonical_binding);}catch{throw new DependencyError('QUEUE_COMPLETION_CANONICAL_MISMATCH');}}
  if(completed.length)try{verifyCanonicalStatusSnapshotManifest(canonical_status_snapshot,completed,{...canonical_snapshot_trust,binding_trust:canonical_status_trust});}catch{throw new DependencyError('QUEUE_COMPLETION_CANONICAL_MISMATCH');}
  return Object.freeze({result:unmet.length?'DEPENDENCY_BLOCKED':'DEPENDENCY_READY',unmet:Object.freeze(unmet)});
}
