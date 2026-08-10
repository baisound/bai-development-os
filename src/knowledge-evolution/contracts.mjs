import { CONSUMER_EVIDENCE_SCHEMA_VERSION, CONSUMER_EVENT_TYPES, DEFAULT_CLIENT_POLICY, MAX_BATCH_BYTES, MAX_BATCH_EVENTS, PRIVACY_LEVELS, TRUST_LEVELS } from './constants.mjs';
import { KnowledgeEvolutionError } from './errors.mjs';
import { sanitizeCanonicalConsumerEvidenceEvent, sanitizeConsumerEvidencePayload } from './sanitizer.mjs';
import { validateConsumerEventAgainstCatalog } from './event-catalog.mjs';
import { canonicalJson, deepFreeze, parseIso, requireNoUnknownKeys, requireNonEmptyString, requirePlainObject, safeRecordId, sha256 } from './util.mjs';

const CANON_EVENT_KEYS=['event_id','occurred_at','type','feature','operation','result','duration_ms','retry_count','error_code','privacy_level','properties'];
const LEGACY_EVENT_KEYS=['schema_version','event_id','occurred_at','product','installation_id','event_type','privacy_level','payload'];
const PRODUCT_KEYS=['product_id','product_version']; const INSTALL_KEYS=['installation_id'];
const BATCH_KEYS=['schema_version','batch_id','created_at','product','installation','events','content_sha256'];
const PRIVACY_ORDER=Object.freeze({P0:0,P1:1,P2:2});

function nonneg(v,name){if(v!==undefined&&(!Number.isInteger(v)||v<0))throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_EVENT_FIELD_INVALID',name);return v;}
function normalizeProperties(value){
  if(value===undefined) return {};
  const p=requirePlainObject(value,'event.properties'); if(Object.keys(p).length>16) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_PROPERTIES_TOO_LARGE');
  for(const [k,v] of Object.entries(p)){
    if(!/^[a-z][a-z0-9_]{0,63}$/.test(k)) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_PROPERTY_NAME_INVALID',k);
    if(!['string','number','boolean'].includes(typeof v)||v===null||!Number.isFinite(typeof v==='number'?v:0)) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_PROPERTY_VALUE_INVALID',k);
    if(typeof v==='string'&&v.length>256) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_PROPERTY_VALUE_INVALID',k);
  } return p;
}
export function validateCanonicalConsumerEvidenceEvent(value,{catalog=true}={}){
  requirePlainObject(value,'event'); requireNoUnknownKeys(value,CANON_EVENT_KEYS,'event');
  const event={
    event_id:safeRecordId(value.event_id,'event_id'), occurred_at:parseIso(value.occurred_at,'occurred_at'),
    type:requireNonEmptyString(value.type,'event.type',{max:64}), privacy_level:value.privacy_level,
    properties:normalizeProperties(value.properties)
  };
  if(!CONSUMER_EVENT_TYPES.includes(event.type)) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_EVENT_TYPE_INVALID');
  if(!PRIVACY_LEVELS.includes(event.privacy_level)) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_PRIVACY_LEVEL_INVALID');
  if(value.feature!==undefined) event.feature=requireNonEmptyString(value.feature,'event.feature',{max:128});
  if(value.operation!==undefined) event.operation=requireNonEmptyString(value.operation,'event.operation',{max:128});
  if(!event.feature&&!event.operation) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_FEATURE_OR_OPERATION_REQUIRED');
  if(event.feature&&event.operation) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_FEATURE_OPERATION_AMBIGUOUS');
  if(value.result!==undefined) event.result=requireNonEmptyString(value.result,'event.result',{max:64});
  if(value.error_code!==undefined) event.error_code=safeRecordId(value.error_code,'event.error_code');
  if(value.duration_ms!==undefined) event.duration_ms=nonneg(value.duration_ms,'duration_ms');
  if(value.retry_count!==undefined) event.retry_count=nonneg(value.retry_count,'retry_count');
  const clean=sanitizeCanonicalConsumerEvidenceEvent(event);
  if(catalog) validateConsumerEventAgainstCatalog(clean);
  return deepFreeze(clean);
}
function legacyToCanonical(value){
  requirePlainObject(value,'event'); requireNoUnknownKeys(value,LEGACY_EVENT_KEYS,'event');
  if(value.schema_version!==CONSUMER_EVIDENCE_SCHEMA_VERSION) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_SCHEMA_VERSION_UNSUPPORTED');
  const p=sanitizeConsumerEvidencePayload(value.event_type,value.privacy_level,value.payload);
  const feature=p.feature??p.component??p.capability;
  const event={event_id:value.event_id,occurred_at:value.occurred_at,type:value.event_type,feature,privacy_level:value.privacy_level,properties:{}};
  if(p.result!==undefined) event.result=p.result;
  else if(value.event_type==='performance') event.result='success';
  else if(value.event_type==='correction') event.result='completed';
  if(p.duration_ms!==undefined) event.duration_ms=p.duration_ms; if(p.retry_count!==undefined) event.retry_count=p.retry_count; if(p.error_code!==undefined) event.error_code=p.error_code;
  return validateCanonicalConsumerEvidenceEvent(event,{catalog:false});
}
export function validateConsumerEvidenceEvent(value,options={}){
  if(value&&typeof value==='object'&&('event_type'in value||'payload'in value||'product'in value)) return legacyToCanonical(value);
  return validateCanonicalConsumerEvidenceEvent(value,options);
}
function validateProduct(value){const p=requirePlainObject(value,'product');requireNoUnknownKeys(p,PRODUCT_KEYS,'product');return {product_id:safeRecordId(p.product_id,'product.product_id'),product_version:requireNonEmptyString(p.product_version,'product.product_version',{max:64})};}
function validateInstallation(value){const p=requirePlainObject(value,'installation');requireNoUnknownKeys(p,INSTALL_KEYS,'installation');return {installation_id:safeRecordId(p.installation_id,'installation.installation_id')};}
export function batchHashInput(value){const copy=structuredClone(value);delete copy.content_sha256;return copy;}
export function computeConsumerEvidenceBatchSha256(value){return sha256(batchHashInput(value));}
export function validateConsumerEvidenceBatch(value,{maxEvents=MAX_BATCH_EVENTS,maxBytes=MAX_BATCH_BYTES,requireHash=false,catalog=true}={}){
  requirePlainObject(value,'batch'); requireNoUnknownKeys(value,BATCH_KEYS,'batch');
  if(value.schema_version!==CONSUMER_EVIDENCE_SCHEMA_VERSION) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_SCHEMA_VERSION_UNSUPPORTED');
  const batch={schema_version:CONSUMER_EVIDENCE_SCHEMA_VERSION,batch_id:safeRecordId(value.batch_id,'batch_id'),created_at:parseIso(value.created_at,'created_at'),product:validateProduct(value.product),installation:validateInstallation(value.installation)};
  if(!Array.isArray(value.events)||value.events.length<1||value.events.length>maxEvents) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_BATCH_SIZE_INVALID');
  batch.events=value.events.map(v=>validateCanonicalConsumerEvidenceEvent(v,{catalog}));
  const ids=new Set();for(const e of batch.events){if(ids.has(e.event_id))throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_BATCH_DUPLICATE_EVENT_ID');ids.add(e.event_id);}
  if(value.content_sha256!==undefined){if(!/^[a-f0-9]{64}$/.test(value.content_sha256))throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_BATCH_HASH_INVALID');batch.content_sha256=value.content_sha256;}
  if(requireHash&&!batch.content_sha256) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_BATCH_HASH_REQUIRED');
  if(batch.content_sha256&&computeConsumerEvidenceBatchSha256(batch)!==batch.content_sha256) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_BATCH_HASH_MISMATCH');
  if(Buffer.byteLength(canonicalJson(batch),'utf8')>maxBytes) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_BATCH_PAYLOAD_TOO_LARGE');
  return deepFreeze(batch);
}
export function withConsumerEvidenceBatchSha256(value){const b=validateConsumerEvidenceBatch(value,{catalog:true});const out=structuredClone(b);delete out.content_sha256;out.content_sha256=computeConsumerEvidenceBatchSha256(out);return deepFreeze(out);}
export function validateDeliveryReceipt(value){
  const keys=['receipt_version','receipt_id','batch_id','accepted','already_seen','rejected','server_time'];requirePlainObject(value,'receipt');requireNoUnknownKeys(value,keys,'receipt');
  if(value.receipt_version!=='1.0')throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_RECEIPT_VERSION_UNSUPPORTED');
  const arr=(x,n)=>{if(!Array.isArray(x))throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_RECEIPT_INVALID',n);const values=x.map(v=>safeRecordId(v,n));if(new Set(values).size!==values.length)throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_RECEIPT_DUPLICATE_EVENT_ID',n);return values;};
  const accepted=arr(value.accepted,'accepted'),alreadySeen=arr(value.already_seen,'already_seen');
  const rejected=Array.isArray(value.rejected)?value.rejected.map(x=>{requirePlainObject(x,'rejected');requireNoUnknownKeys(x,['event_id','reason_code'],'rejected');return {event_id:safeRecordId(x.event_id,'rejected.event_id'),reason_code:safeRecordId(x.reason_code,'reason_code')};}):(()=>{throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_RECEIPT_INVALID')})();
  const rejectedIds=rejected.map(x=>x.event_id);if(new Set(rejectedIds).size!==rejectedIds.length)throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_RECEIPT_DUPLICATE_EVENT_ID','rejected');
  const outcomes=[...accepted,...alreadySeen,...rejectedIds];if(new Set(outcomes).size!==outcomes.length)throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_RECEIPT_EVENT_OUTCOME_CONFLICT');
  return deepFreeze({receipt_version:'1.0',receipt_id:safeRecordId(value.receipt_id,'receipt_id'),batch_id:safeRecordId(value.batch_id,'batch_id'),accepted,already_seen:alreadySeen,rejected,server_time:parseIso(value.server_time,'server_time')});
}
function normalizeClientPolicy(value){
  const policy={...DEFAULT_CLIENT_POLICY,...(value??{})};
  if(!Array.isArray(policy.accepted_schema_versions)||!policy.accepted_schema_versions.includes('1.0'))throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_POLICY_INVALID');
  if(typeof policy.event_catalog_version!=='string'||!policy.event_catalog_version)throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_POLICY_INVALID');
  if(!PRIVACY_LEVELS.includes(policy.max_privacy_level))throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_POLICY_INVALID');
  if(!Number.isInteger(policy.max_batch_events)||policy.max_batch_events<1||policy.max_batch_events>MAX_BATCH_EVENTS)throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_POLICY_INVALID');
  if(!Number.isInteger(policy.max_payload_bytes)||policy.max_payload_bytes<1024||policy.max_payload_bytes>MAX_BATCH_BYTES)throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_POLICY_INVALID');
  if(!Number.isInteger(policy.max_outbox_bytes)||policy.max_outbox_bytes<0)throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_POLICY_INVALID');
  if(!Array.isArray(policy.enabled_features)||policy.enabled_features.some(v=>typeof v!=='string'||!v.trim()))throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_POLICY_INVALID');
  if(!policy.sampling||typeof policy.sampling!=='object'||Array.isArray(policy.sampling))throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_POLICY_INVALID');
  for(const rate of Object.values(policy.sampling))if(typeof rate!=='number'||!Number.isFinite(rate)||rate<0||rate>1)throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_POLICY_INVALID');
  return policy;
}
export function intersectClientPolicies(localPolicy,serverPolicy){
  const local=normalizeClientPolicy(localPolicy),server=normalizeClientPolicy(serverPolicy);
  const maxPrivacy=PRIVACY_ORDER[local.max_privacy_level]<=PRIVACY_ORDER[server.max_privacy_level]?local.max_privacy_level:server.max_privacy_level;
  const lf=new Set(local.enabled_features),sf=new Set(server.enabled_features);const enabled=lf.size===0?[...sf]:sf.size===0?[...lf]:[...lf].filter(x=>sf.has(x));
  const keys=new Set([...Object.keys(local.sampling),...Object.keys(server.sampling)]),sampling={};for(const k of keys)sampling[k]=Math.min(local.sampling[k]??1,server.sampling[k]??1);
  if(local.event_catalog_version!==server.event_catalog_version) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_POLICY_CATALOG_VERSION_MISMATCH');
  const acceptedSchemaVersions=local.accepted_schema_versions.filter(v=>server.accepted_schema_versions.includes(v));if(acceptedSchemaVersions.length===0)throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_POLICY_SCHEMA_VERSION_MISMATCH');
  return deepFreeze({policy_version:`${local.policy_version}&${server.policy_version}`,accepted_schema_versions:acceptedSchemaVersions,event_catalog_version:local.event_catalog_version,sampling,enabled_features:enabled.sort(),max_batch_events:Math.min(local.max_batch_events,server.max_batch_events),max_payload_bytes:Math.min(local.max_payload_bytes,server.max_payload_bytes),max_outbox_bytes:Math.min(local.max_outbox_bytes,server.max_outbox_bytes),max_privacy_level:maxPrivacy});
}
function evidenceTypeFor(event){if(event.type==='correction')return'rejected_pattern';if(event.type==='diagnostic'||event.type==='incident')return'incident';if(event.type==='performance')return'performance';if(event.type==='user_feedback'||event.type==='adoption')return'user_feedback';if(event.type==='feature_result'&&String(event.result).toLowerCase()!=='success')return'regression';if(event.type==='capability')return'implementation_decision';return'success_pattern';}
function observationFor(event){return `${event.feature??event.operation} type=${event.type} result=${event.result??'observed'}`;}
export function mapConsumerEventToKnowledgeEvidence(value,{product=null,trustLevel='REGISTERED_CLIENT',architectureVersion=null,sourceCommit=null}={}){
  let productCtx=product;
  if(value&&typeof value==='object'&&value.product){productCtx=validateProduct(value.product);}
  const event=validateConsumerEvidenceEvent(value,{catalog:false});if(!productCtx)throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_PRODUCT_CONTEXT_REQUIRED');if(!TRUST_LEVELS.includes(trustLevel))throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_TRUST_LEVEL_INVALID');
  const digest=sha256({event_id:event.event_id,product:productCtx,occurred_at:event.occurred_at,event});
  return deepFreeze({schema_version:'1.0',evidence_id:`CE-${digest.slice(0,24)}`,evidence_type:evidenceTypeFor(event),producer:{project_id:productCtx.product_id,task_id:null,product_version:productCtx.product_version},observation:observationFor(event),resolution:null,outcome:event.result??null,candidate_scope:'project',provenance:{completeness:'PARTIAL',source_commit:sourceCommit,architecture_version:architectureVersion,snapshot_sha256:null,observed_at:event.occurred_at},sensitivity:event.privacy_level==='P0'?'INTERNAL':'CONFIDENTIAL',payload_hash:`sha256:${sha256(event)}`,processing_status:'VALIDATED'});
}
export function mapConsumerBatchToKnowledgeEvidence(value,options={}){const batch=validateConsumerEvidenceBatch(value);return batch.events.map(event=>mapConsumerEventToKnowledgeEvidence(event,{...options,product:batch.product}));}
