import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createCommonIngestionCore, createKnowledgeHubHttpServer, InMemoryEvidenceRepository } from '../../src/knowledge-hub/index.mjs';
import { KnowledgeHubError } from '../../src/knowledge-hub/errors.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const fixture=name=>JSON.parse(fs.readFileSync(path.join(root,'fixtures/knowledge-evolution/consumer-evidence/v1',name),'utf8'));
const auth={subject_id:'subject-http',product_id:'bai-video-production',scopes:['evidence:write','policy:read'],trust_level:'REGISTERED_CLIENT'};

function authenticator(req){const value=req.headers.authorization;if(value!=='Bearer local-test-token')throw new KnowledgeHubError('HUB_UNAUTHORIZED','Invalid credential',{status:401});return auth;}

test('real local HTTP path accepts batch and returns idempotent Receipt on retry',async(t)=>{
 const repository=new InMemoryEvidenceRepository();const core=createCommonIngestionCore({repository,clock:()=>new Date('2026-08-11T01:00:00Z')});const hub=createKnowledgeHubHttpServer({core,authenticate:authenticator});const {base_url}=await hub.start();t.after(()=>hub.stop());
 const health=await fetch(`${base_url}/healthz`);assert.equal(health.status,200);
 const unauthorized=await fetch(`${base_url}/v1/client-policy`);assert.equal(unauthorized.status,401);
 const policy=await fetch(`${base_url}/v1/client-policy`,{headers:{authorization:'Bearer local-test-token'}});assert.equal(policy.status,200);assert.equal((await policy.json()).policy_version,'1.0');
 const batch=fixture('valid-batch.json');const first=await fetch(`${base_url}/v1/evidence/batch`,{method:'POST',headers:{authorization:'Bearer local-test-token','content-type':'application/json'},body:JSON.stringify(batch)});assert.equal(first.status,200);const receipt=await first.json();assert.equal(receipt.accepted.length,3);
 const retry=await fetch(`${base_url}/v1/evidence/batch`,{method:'POST',headers:{authorization:'Bearer local-test-token','content-type':'application/json'},body:JSON.stringify(batch)});assert.equal(retry.status,200);const retryReceipt=await retry.json();assert.equal(retryReceipt.already_seen.length,3);
});

test('HTTP path preserves Event-level partial rejection',async(t)=>{
 const repository=new InMemoryEvidenceRepository();const core=createCommonIngestionCore({repository,clock:()=>new Date('2026-08-11T01:00:00Z')});const hub=createKnowledgeHubHttpServer({core,authenticate:authenticator});const {base_url}=await hub.start();t.after(()=>hub.stop());
 const batch=fixture('valid-batch.json');batch.batch_id='http-partial';batch.events[2].privacy_level='P3';
 const response=await fetch(`${base_url}/v1/evidence/batch`,{method:'POST',headers:{authorization:'Bearer local-test-token','content-type':'application/json'},body:JSON.stringify(batch)});assert.equal(response.status,200);const receipt=await response.json();assert.equal(receipt.accepted.length,2);assert.deepEqual(receipt.rejected,[{event_id:'evt-review-0003',reason_code:'CONSUMER_EVIDENCE_PRIVACY_LEVEL_INVALID'}]);
});
