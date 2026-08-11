#!/usr/bin/env node
import pg from 'pg';
import { createApiKeyCredential, createPostgresApiKeyStore } from '../../../src/knowledge-hub/index.mjs';

const { Pool } = pg;
if (!process.env.DATABASE_URL) { console.error('DATABASE_URL required'); process.exit(2); }
const endpoint = process.env.BAI_KNOWLEDGE_HUB_REHEARSAL_ENDPOINT ?? 'http://127.0.0.1:8787';
const productId = 'bai-video-production';
const subjectId = `rehearsal-${Date.now()}`;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1, application_name: 'bai-knowledge-hub-rehearsal-client' });

function event(id, occurredAt, type, feature, result, properties, privacyLevel='P0') {
  return { event_id:id, occurred_at:occurredAt, type, feature, result, retry_count:0, privacy_level:privacyLevel, properties };
}
function batch(batchId, events) {
  return { schema_version:'1.0', batch_id:batchId, created_at:new Date().toISOString(), product:{ product_id:productId, product_version:'rehearsal' }, installation:{ installation_id:'inst-rehearsal-12345678' }, events };
}
async function request(pathname, apiKey, options={}) {
  return fetch(endpoint+pathname,{...options,headers:{authorization:`Bearer ${apiKey}`,'content-type':'application/json',...(options.headers??{})},signal:AbortSignal.timeout(5000)});
}
try {
  const store=createPostgresApiKeyStore({query:(sql,params)=>pool.query(sql,params)});
  const issued=await createApiKeyCredential({subjectId,productId,scopes:['evidence:write','policy:read'],trustLevel:'REGISTERED_CLIENT'});
  await store.saveCredential(issued.record);
  const apiKey=issued.api_key;
  const now=new Date().toISOString();
  const baseEvents=[
    event('evt-rehearsal-subtitle-0001',now,'feature_result','subtitle_import','success',{cue_count:3}),
    event('evt-rehearsal-longjob-0002',now,'performance','long_running_job_result','success',{chunk_count:2,resume_used:true,resumed_chunk_count:1}),
    event('evt-rehearsal-review-0003',now,'correction','subtitle_review_summary','completed',{imported_cue_count:3,edited_cue_count:1,inserted_cue_count:0,deleted_cue_count:0,approved_cue_count:3,export_success:true})
  ];
  const firstBatch=batch('batch-rehearsal-0001',baseEvents);
  const first=await request('/v1/evidence/batch',apiKey,{method:'POST',body:JSON.stringify(firstBatch)}); const firstReceipt=await first.json();
  if(first.status!==200||firstReceipt.accepted?.length!==3)throw new Error('first submit failed');
  const retry=await request('/v1/evidence/batch',apiKey,{method:'POST',body:JSON.stringify(firstBatch)}); const retryReceipt=await retry.json();
  if(retry.status!==200||retryReceipt.already_seen?.length!==3)throw new Error('idempotent retry failed');
  const partial=batch('batch-rehearsal-partial-0002',[
    event('evt-rehearsal-safe-0004',now,'feature_result','subtitle_import','success',{cue_count:1}),
    event('evt-rehearsal-p3-0005',now,'feature_result','subtitle_import','success',{cue_count:1},'P3')
  ]);
  const partialResponse=await request('/v1/evidence/batch',apiKey,{method:'POST',body:JSON.stringify(partial)});const partialReceipt=await partialResponse.json();
  if(partialResponse.status!==200||partialReceipt.accepted?.length!==1||partialReceipt.rejected?.length!==1)throw new Error('partial rejection failed');
  const policy=await request('/v1/client-policy',apiKey);if(policy.status!==200)throw new Error('policy retrieval failed');
  const rows=await pool.query('SELECT count(*)::int AS count FROM evidence_events WHERE subject_id=$1',[subjectId]);
  if((rows.rows[0]?.count??0)!==4)throw new Error('persisted Evidence count mismatch');
  await store.revokeCredential(issued.record.key_id);
  const revoked=await request('/v1/client-policy',apiKey);if(revoked.status!==401)throw new Error('credential revoke verification failed');
  console.log(JSON.stringify({status:'PASS',accepted:firstReceipt.accepted.length,retry_already_seen:retryReceipt.already_seen.length,partial_accepted:partialReceipt.accepted.length,partial_rejected:partialReceipt.rejected.length,persisted_events:rows.rows[0].count,credential_revoke:'PASS'}));
} finally { await pool.end(); }
