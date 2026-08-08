import { DEFAULT_MONITORING_POLICY } from './constants.mjs';
import { MonitoringError, deepFreeze } from './util.mjs';
const DEFAULT_SOURCE_STALE_MS = 60 * 60 * 1000;
export function evaluateSourceProvenance(source_metadata={}, {clock=()=>new Date(), source_stale_ms=DEFAULT_SOURCE_STALE_MS}={}){
  if(!source_metadata || typeof source_metadata!=='object' || Array.isArray(source_metadata) || !Number.isFinite(source_stale_ms) || source_stale_ms<0) throw new MonitoringError('MONITORING_SOURCE_METADATA_INVALID');
  const now=(clock() instanceof Date?clock():new Date(clock())).getTime(); if(Number.isNaN(now)) throw new MonitoringError('MONITORING_CLOCK_INVALID');
  const sources=[]; let stale=0,unverified=0,invalid=0;
  for(const [name,meta] of Object.entries(source_metadata).sort(([a],[b])=>a.localeCompare(b))){
    if(!meta || typeof meta!=='object'){invalid++;sources.push({name,result:'INVALID_METADATA'});continue;}
    const t=Date.parse(meta.observed_at); if(Number.isNaN(t)){invalid++;sources.push({name,result:'INVALID_TIMESTAMP'});continue;}
    const age_ms=Math.max(0,now-t);const verified=meta.verified!==false;const is_stale=age_ms>source_stale_ms;if(!verified)unverified++;if(is_stale)stale++;
    sources.push({name,observed_at:meta.observed_at,age_ms,verified,is_stale,checksum:meta.checksum??null,revision:meta.revision??null,result:!verified?'UNVERIFIED':is_stale?'STALE':'FRESH'});
  }
  return deepFreeze({source_count:sources.length,stale_count:stale,unverified_count:unverified,invalid_count:invalid,source_stale_ms,sources});
}
