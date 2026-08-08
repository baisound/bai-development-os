import { DISTRIBUTED_VERSION } from './constants.mjs';
import { DistributedError } from './errors.mjs';
import { deepFreeze, requireFinite } from './util.mjs';

function q(values,p){ if(!values.length)return null; const a=[...values].sort((x,y)=>x-y); const pos=(a.length-1)*p, lo=Math.floor(pos), hi=Math.ceil(pos); return lo===hi?a[lo]:a[lo]+(a[hi]-a[lo])*(pos-lo); }
export function aggregateDistributedMetric(samples = [], { expected_sources = [], slo = null } = {}) {
  const seen = new Map(); let duplicates=0;
  for (const sample of samples) {
    if (!sample?.idempotency_key) throw new DistributedError('DISTRIBUTED_METRIC_IDEMPOTENCY_REQUIRED');
    requireFinite(sample.value,'value'); const checksum=sample.content_checksum ?? JSON.stringify(sample);
    if (seen.has(sample.idempotency_key)) { if (seen.get(sample.idempotency_key).checksum !== checksum) throw new DistributedError('DISTRIBUTED_METRIC_IDEMPOTENCY_COLLISION'); duplicates++; continue; }
    seen.set(sample.idempotency_key,{checksum,sample});
  }
  const unique=[...seen.values()].map(x=>x.sample); const values=unique.map(x=>x.value); const observed=[...new Set(unique.map(x=>x.source_id).filter(Boolean))].sort(); const missing=expected_sources.filter(x=>!observed.includes(x)).sort();
  const mean=values.length?values.reduce((a,b)=>a+b,0)/values.length:null; const p95=q(values,.95); let slo_result='NOT_CONFIGURED';
  if(slo){ const target=requireFinite(slo.target,'slo.target'); const actual=slo.statistic==='P95'?p95:mean; slo_result=(slo.operator??'LTE')==='GTE'?(actual>=target?'PASS':'FAIL'):(actual<=target?'PASS':'FAIL'); }
  const maxSkew=unique.reduce((m,x)=>Math.max(m,Math.abs(Number(x.clock_skew_ms??0))),0);
  return deepFreeze({distributed_metric_aggregate_version:DISTRIBUTED_VERSION,input_count:samples.length,unique_count:unique.length,duplicate_count:duplicates,observed_sources:observed,missing_sources:missing,coverage_ratio:expected_sources.length?observed.length/expected_sources.length:1,partition_uncertainty:missing.length>0,max_abs_clock_skew_ms:maxSkew,mean,p95,slo_result});
}
export function evaluateDistributedPartition({ domain = 'GENERIC', current_state_proven = false, known_good_local = false } = {}) {
  const sensitive=['SECURITY','AUTHORITY','TRUST','RELEASE','MAINTENANCE','EXTERNAL_SIDE_EFFECT'].includes(String(domain).toUpperCase());
  if (current_state_proven) return deepFreeze({ decision:'PROCEED', reason:'CURRENT_STATE_PROVEN' });
  if (sensitive) return deepFreeze({ decision:'FAIL_CLOSED', reason:'SENSITIVE_STATE_NOT_PROVEN' });
  if (known_good_local) return deepFreeze({ decision:'CONTINUE_KNOWN_GOOD_LOCAL', reason:'NON_SENSITIVE_PARTITION' });
  return deepFreeze({ decision:'DEFER', reason:'STATE_NOT_PROVEN' });
}
