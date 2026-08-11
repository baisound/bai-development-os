import { KnowledgeEvolutionError } from './errors.mjs';
import { canonicalJson } from './util.mjs';
import { computeConsumerEvidenceBatchSha256, validateConsumerEvidenceBatch, validateDeliveryReceipt, withConsumerEvidenceBatchSha256 } from './contracts.mjs';

const validateReceipt = validateDeliveryReceipt;

function segment(value,name){const v=String(value);if(!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(v)||v.includes('..'))throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_OBJECT_KEY_INVALID',name);return v;}
export function consumerEvidenceObjectKey(value){
  const batch=validateConsumerEvidenceBatch(value,{requireHash:false});const d=new Date(batch.created_at);const y=String(d.getUTCFullYear()),m=String(d.getUTCMonth()+1).padStart(2,'0'),day=String(d.getUTCDate()).padStart(2,'0');
  return `consumer-evidence/v1/${segment(batch.product.product_id,'product_id')}/${y}/${m}/${day}/${segment(batch.installation.installation_id,'installation_id')}/${segment(batch.batch_id,'batch_id')}.json`;
}
export function createConsumerEvidenceObjectArtifact(value){
  const batch=withConsumerEvidenceBatchSha256(value);const body=canonicalJson(batch)+'\n';return Object.freeze({key:consumerEvidenceObjectKey(batch),content_type:'application/json',encoding:'utf-8',compression:'none',content_sha256:batch.content_sha256,body,bytes:Buffer.byteLength(body,'utf8'),batch});
}
export function verifyConsumerEvidenceObjectArtifact({key,body,content_sha256}){
  let parsed;try{parsed=JSON.parse(String(body));}catch{throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_OBJECT_JSON_INVALID');}
  const batch=validateConsumerEvidenceBatch(parsed,{requireHash:true});if(batch.content_sha256!==content_sha256)throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_OBJECT_HASH_METADATA_MISMATCH');if(computeConsumerEvidenceBatchSha256(batch)!==content_sha256)throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_BATCH_HASH_MISMATCH');if(consumerEvidenceObjectKey(batch)!==key)throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_OBJECT_KEY_MISMATCH');return batch;
}
export function classifyConsumerEvidenceObjectRetry(existingHash,newHash){
  if(!existingHash)return'CREATE';if(existingHash===newHash)return'IDEMPOTENT_RETRY';throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_OBJECT_INTEGRITY_CONFLICT');
}
export function receiptFullyAcknowledgesBatch(batchValue,receiptValue){
  const batch=validateConsumerEvidenceBatch(batchValue,{catalog:false});const receipt=validateReceipt(receiptValue);if(receipt.batch_id!==batch.batch_id)throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_RECEIPT_BATCH_MISMATCH');const eventIds=new Set(batch.events.map(e=>e.event_id));for(const id of [...receipt.accepted,...receipt.already_seen,...receipt.rejected.map(x=>x.event_id)])if(!eventIds.has(id))throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_RECEIPT_UNKNOWN_EVENT_ID',id);const ack=new Set([...receipt.accepted,...receipt.already_seen]);return batch.events.every(e=>ack.has(e.event_id));
}
