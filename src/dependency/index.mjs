export class DependencyError extends Error { constructor(code,message=code){super(message);this.code=code;} }
export function detectDependencyCycles(tasks){
  const map=new Map(tasks.map(t=>[t.task_id,t.dependency_task_ids??[]])); const visiting=new Set(),done=new Set(),cycles=[];
  const visit=(id,stack)=>{if(visiting.has(id)){const i=stack.indexOf(id);cycles.push([...stack.slice(i),id]);return;}if(done.has(id))return;visiting.add(id);for(const d of map.get(id)??[])if(map.has(d))visit(d,[...stack,id]);visiting.delete(id);done.add(id);};
  for(const id of map.keys())visit(id,[]); return Object.freeze(cycles.map(Object.freeze));
}
export function evaluateDependencies(task,tasks){
  const cycles=detectDependencyCycles(tasks);if(cycles.length)throw new DependencyError('DEPENDENCY_CYCLE');
  const map=new Map(tasks.map(t=>[t.task_id,t]));const unmet=[];for(const id of task.dependency_task_ids??[]){const dep=map.get(id);if(!dep||dep.task_status!=='COMPLETED')unmet.push(id);}
  return Object.freeze({result:unmet.length?'DEPENDENCY_BLOCKED':'DEPENDENCY_READY',unmet:Object.freeze(unmet)});
}
