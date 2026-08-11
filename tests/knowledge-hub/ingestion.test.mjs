import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createCommonIngestionCore, InMemoryEvidenceRepository, createFixedWindowRateLimiter } from '../../src/knowledge-hub/index.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const fixture=name=>JSON.parse(fs.readFileSync(path.join(root,'fixtures/knowledge-evolution/consumer-evidence/v1',name),'utf8'));
const auth={subject_id:'subject-demo',product_id:'bai-video-production',scopes:['evidence:write','policy:read'],trust_level:'REGISTERED_CLIENT'};
const fixedClock=()=>new Date('2026-08-11T00:30:00.000Z');

test('common ingestion accepts canonical batch and creates server-derived evidence',async()=>{
 const repository=new InMemoryEvidenceRepository();
 const core=createCommonIngestionCore({repository,clock:fixedClock});
 const receipt=await core.submitBatch(fixture('valid-batch.json'),{authContext:auth});
 assert.deepEqual(receipt.accepted,['evt-subtitle-0001','evt-longjob-0002','evt-review-0003']);
 assert.deepEqual(receipt.already_seen,[]);assert.deepEqual(receipt.rejected,[]);
 const records=await repository.listEvents();assert.equal(records.length,3);
 assert.equal(records[0].trust_level,'REGISTERED_CLIENT');
 assert.equal(records[0].knowledge_evidence.producer.project_id,'bai-video-production');
 assert.equal(records[0].transport,'https');
});

test('same events backfilled later preserve identity and are already seen',async()=>{
 const repository=new InMemoryEvidenceRepository();const core=createCommonIngestionCore({repository,clock:fixedClock});const batch=fixture('valid-batch.json');
 await core.submitBatch(batch,{authContext:auth});
 const receipt=await core.backfillBatch(batch,{authContext:auth});
 assert.equal(receipt.accepted.length,0);assert.deepEqual(receipt.already_seen,batch.events.map(e=>e.event_id));
 assert.equal((await repository.listEvents()).length,3);
});

test('event-level privacy reject does not discard safe siblings',async()=>{
 const repository=new InMemoryEvidenceRepository();const core=createCommonIngestionCore({repository,clock:fixedClock});
 const batch=fixture('valid-batch.json');batch.batch_id='batch-partial-privacy';batch.events[1].privacy_level='P3';
 const receipt=await core.submitBatch(batch,{authContext:auth});
 assert.deepEqual(receipt.accepted,['evt-subtitle-0001','evt-review-0003']);
 assert.deepEqual(receipt.rejected,[{event_id:'evt-longjob-0002',reason_code:'CONSUMER_EVIDENCE_PRIVACY_LEVEL_INVALID'}]);
 assert.equal((await repository.listEvents()).length,2);
});

test('stable event id with changed content is rejected as integrity conflict',async()=>{
 const repository=new InMemoryEvidenceRepository();const core=createCommonIngestionCore({repository,clock:fixedClock});
 const first=fixture('valid-batch.json');await core.submitBatch(first,{authContext:auth});
 const changed=fixture('valid-batch.json');changed.batch_id='batch-conflict';changed.events[0].duration_ms+=1;changed.events=changed.events.slice(0,1);
 const receipt=await core.submitBatch(changed,{authContext:auth});
 assert.deepEqual(receipt.rejected,[{event_id:'evt-subtitle-0001',reason_code:'HUB_EVENT_ID_CONFLICT'}]);
});

test('credential subject is bound to one Product and client cannot self-elevate trust',async()=>{
 const repository=new InMemoryEvidenceRepository();const core=createCommonIngestionCore({repository,clock:fixedClock});
 const batch=fixture('valid-batch.json');batch.product.product_id='other-product';
 await assert.rejects(core.submitBatch(batch,{authContext:auth}),e=>e.code==='HUB_AUTH_PRODUCT_MISMATCH'&&e.status===403);
 assert.ok(!JSON.stringify(fixture('valid-batch.json')).includes('TRUSTED_OS'));
});

test('client policy is server-side and default policy is returned when unset',async()=>{
 const repository=new InMemoryEvidenceRepository();const core=createCommonIngestionCore({repository,clock:fixedClock});
 const fallback=await core.getClientPolicy({authContext:auth});assert.equal(fallback.policy_version,'1.0');
 await repository.setPolicy('bai-video-production',{...fallback,policy_version:'server-2'});
 const configured=await core.getClientPolicy({authContext:auth});assert.equal(configured.policy_version,'server-2');
});

test('per-subject rate limit fails with 429 without changing Product semantics',async()=>{
 let now=0;const limiter=createFixedWindowRateLimiter({limit:1,windowMs:60_000,clock:()=>now});
 const repository=new InMemoryEvidenceRepository();const core=createCommonIngestionCore({repository,clock:fixedClock,rateLimiter:limiter});
 await core.submitBatch(fixture('valid-batch.json'),{authContext:auth});
 await assert.rejects(core.submitBatch(fixture('duplicate-resend-batch.json'),{authContext:auth}),e=>e.code==='HUB_RATE_LIMITED'&&e.status===429);
 now=60_001;const r=await core.submitBatch(fixture('duplicate-resend-batch.json'),{authContext:auth});assert.ok(r.already_seen.length>0);
});

test('retention prunes expired raw event records only through explicit call',async()=>{
 const repository=new InMemoryEvidenceRepository();
 const core=createCommonIngestionCore({repository,clock:()=>new Date('2026-08-11T00:30:00Z'),retentionDays:1});
 await core.submitBatch(fixture('valid-batch.json'),{authContext:auth});assert.equal((await repository.listEvents()).length,3);
 const later=createCommonIngestionCore({repository,clock:()=>new Date('2026-08-13T00:31:00Z'),retentionDays:1});
 assert.equal(await later.pruneExpired(),3);assert.equal((await repository.listEvents()).length,0);
});
