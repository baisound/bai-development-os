import { KnowledgeEvolutionError } from './errors.mjs';
import { CONSUMER_EVENT_CATALOG_VERSION } from './constants.mjs';
import { deepFreeze } from './util.mjs';

const CATALOG = deepFreeze({
  catalog_version: CONSUMER_EVENT_CATALOG_VERSION,
  entries: {
    'feature_result:subtitle_import': { privacy:['P0','P1'], results:['success','failure'], optional:['duration_ms','retry_count','error_code'], properties:{cue_count:'nonnegative_integer'} },
    'performance:long_running_job_result': { privacy:['P0','P1'], results:['success','failure'], optional:['duration_ms','retry_count','error_code'], properties:{chunk_count:'nonnegative_integer',resume_used:'boolean',resumed_chunk_count:'nonnegative_integer'} },
    'correction:subtitle_review_summary': { privacy:['P0','P1'], results:['completed','aborted'], optional:['duration_ms','retry_count','error_code'], properties:{imported_cue_count:'nonnegative_integer',edited_cue_count:'nonnegative_integer',inserted_cue_count:'nonnegative_integer',deleted_cue_count:'nonnegative_integer',approved_cue_count:'nonnegative_integer',export_success:'boolean'} }
  }
});
export function consumerEvidenceEventCatalog(){ return CATALOG; }
function validatePropertyType(name, value, kind){
  if(kind==='nonnegative_integer' && (!Number.isInteger(value)||value<0)) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_CATALOG_PROPERTY_INVALID',name);
  if(kind==='boolean' && typeof value!=='boolean') throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_CATALOG_PROPERTY_INVALID',name);
}
export function validateConsumerEventAgainstCatalog(event){
  const feature=event.feature ?? event.operation;
  const key=`${event.type}:${feature}`;
  const entry=CATALOG.entries[key];
  if(!entry) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_CATALOG_EVENT_UNKNOWN',key);
  if(!entry.privacy.includes(event.privacy_level)) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_CATALOG_PRIVACY_INVALID',key);
  if(!entry.results.includes(event.result)) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_CATALOG_RESULT_INVALID',key);
  for(const field of ['duration_ms','retry_count','error_code']) if(event[field]!==undefined && !entry.optional.includes(field)) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_CATALOG_FIELD_FORBIDDEN',field);
  const props=event.properties ?? {};
  for(const [name,value] of Object.entries(props)){
    const kind=entry.properties[name];
    if(!kind) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_CATALOG_PROPERTY_FORBIDDEN',name);
    validatePropertyType(name,value,kind);
  }
  return event;
}
