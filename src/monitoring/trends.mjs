import { MonitoringError, deepFreeze } from './util.mjs';
const get=(obj,path)=>path.split('.').reduce((v,k)=>v?.[k],obj);
export function compareMonitoringSnapshots(previous,current,metric_paths=['quality.test_pass_rate','cost.actual_cost_microusd','knowledge.debt_score','automation.stall_count']){
  if(!previous||!current||previous.project_id!==current.project_id)throw new MonitoringError('MONITORING_TREND_INPUT_INVALID');
  const metrics={};for(const p of metric_paths){const a=get(previous.metrics,p),b=get(current.metrics,p);metrics[p]={previous:a??null,current:b??null,delta:(typeof a==='number'&&typeof b==='number')?b-a:null,direction:(typeof a==='number'&&typeof b==='number')?(b>a?'UP':b<a?'DOWN':'FLAT'):'UNKNOWN'};}
  return deepFreeze({project_id:current.project_id,from:previous.generated_at,to:current.generated_at,metrics,canonical_authority:false});
}
export function buildMetricSeries(snapshots,metric_path){if(!Array.isArray(snapshots)||typeof metric_path!=='string'||!metric_path)throw new MonitoringError('MONITORING_TREND_INPUT_INVALID');const rows=[...snapshots].sort((a,b)=>Date.parse(a.generated_at)-Date.parse(b.generated_at)).map(s=>({at:s.generated_at,value:get(s.metrics,metric_path)??null,health:s.health}));return deepFreeze({metric_path,points:rows,canonical_authority:false});}
