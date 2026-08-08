import { CONFORMANCE_STATUS } from './constants.mjs';
import { ConformanceError } from './errors.mjs';
import { deepFreeze, finite } from './util.mjs';

export function allocateFairCapacity({demands,capacity,minimum_share=0}={}){
  finite(capacity,'capacity',{min:0}); if(!Array.isArray(demands)||demands.length===0) throw new ConformanceError('CONFORMANCE_DEMANDS_EMPTY');
  const rows=demands.map(d=>({project_id:d.project_id,demand:finite(d.demand,'demand',{min:0}),weight:finite(d.weight??1,'weight',{min:0.000001}),allocated:0}));
  let remaining=capacity; let active=rows.filter(x=>x.demand>0); let guard=0;
  while(remaining>1e-9&&active.length&&guard++<1000){ const totalWeight=active.reduce((s,x)=>s+x.weight,0); let consumed=0; for(const row of active){ const share=remaining*(row.weight/totalWeight); const take=Math.min(row.demand-row.allocated,share); row.allocated+=take; consumed+=take; } if(consumed<1e-9)break; remaining-=consumed; active=active.filter(x=>x.allocated+1e-9<x.demand); }
  for(const row of rows)row.allocated=Math.round(row.allocated*1e9)/1e9;
  const starved=rows.filter(r=>r.demand>0&&r.allocated<Math.min(r.demand,minimum_share));
  return deepFreeze({status:starved.length?CONFORMANCE_STATUS.FAIL:CONFORMANCE_STATUS.PASS,capacity,allocated:rows.reduce((s,x)=>s+x.allocated,0),remaining:Math.max(0,capacity-rows.reduce((s,x)=>s+x.allocated,0)),projects:rows,starved:starved.map(x=>x.project_id)});
}
export function evaluateNoisyNeighbor({normal_demand=10,noisy_demand=1000,capacity=20}={}){ return allocateFairCapacity({capacity,minimum_share:Math.min(normal_demand,capacity/2),demands:[{project_id:'normal',demand:normal_demand,weight:1},{project_id:'noisy',demand:noisy_demand,weight:1}]}); }
