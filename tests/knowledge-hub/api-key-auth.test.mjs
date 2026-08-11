import assert from 'node:assert/strict';
import test from 'node:test';
import { createApiKeyAuthenticator, createApiKeyCredential, createPostgresApiKeyStore } from '../../src/knowledge-hub/index.mjs';

function request(apiKey){return{headers:{authorization:`Bearer ${apiKey}`}};}

test('API key issuance returns one-time key and stores only derived secret material',async()=>{
 const issued=await createApiKeyCredential({keyId:'key-test-1',subjectId:'subject-1',productId:'bai-video-production',clock:()=>new Date('2026-08-11T00:00:00Z')});
 assert.match(issued.api_key,/^bkh1\.key-test-1\./);assert.ok(!issued.record.secret_hash.includes(issued.api_key));assert.equal(issued.record.product_id,'bai-video-production');
 const store={getCredentialByKeyId:async id=>id===issued.record.key_id?issued.record:null};const auth=createApiKeyAuthenticator({credentialStore:store,clock:()=>new Date('2026-08-11T01:00:00Z')});
 const context=await auth(request(issued.api_key));assert.equal(context.subject_id,'subject-1');assert.deepEqual(context.scopes,['evidence:write','policy:read']);
});

test('wrong, revoked and expired API keys fail closed',async()=>{
 const issued=await createApiKeyCredential({keyId:'key-test-2',subjectId:'subject-2',productId:'bai-video-production',expiresAt:'2026-08-12T00:00:00Z'});
 const goodStore={getCredentialByKeyId:async()=>issued.record};const auth=createApiKeyAuthenticator({credentialStore:goodStore,clock:()=>new Date('2026-08-11T01:00:00Z')});
 const pieces=issued.api_key.split('.');pieces[2]=pieces[2].slice(0,-1)+(pieces[2].endsWith('A')?'B':'A');await assert.rejects(()=>auth(request(pieces.join('.'))),e=>e.code==='HUB_UNAUTHORIZED');
 const revoked={...issued.record,status:'REVOKED'};await assert.rejects(()=>createApiKeyAuthenticator({credentialStore:{getCredentialByKeyId:async()=>revoked}})(request(issued.api_key)),e=>e.code==='HUB_CREDENTIAL_INACTIVE');
 await assert.rejects(()=>createApiKeyAuthenticator({credentialStore:goodStore,clock:()=>new Date('2026-08-13T00:00:00Z')})(request(issued.api_key)),e=>e.code==='HUB_CREDENTIAL_EXPIRED');
});

test('PostgreSQL credential store persists hash metadata, never raw API key',async()=>{
 const calls=[];const row={key_id:'key-db-1',subject_id:'subject-db',product_id:'bai-video-production',scopes:['evidence:write'],trust_level:'REGISTERED_CLIENT',salt:'salt',secret_hash:'hash',status:'ACTIVE',created_at:'2026-08-11T00:00:00Z',expires_at:null};
 const dbRow={...row,scopes_json:row.scopes};
 const query=async(sql,params)=>{calls.push({sql,params});if(sql.startsWith('SELECT key_id'))return{rows:[dbRow]};return{rows:[],rowCount:1};};const store=createPostgresApiKeyStore({query});
 await store.saveCredential(row);assert.ok(calls[0].sql.includes('secret_hash'));assert.doesNotMatch(calls[0].sql,/api_key\s*[,) ]/i);assert.deepEqual((await store.getCredentialByKeyId('key-db-1')).scopes,['evidence:write']);assert.equal(await store.revokeCredential('key-db-1'),1);
});


test('API key issuance rejects unknown scopes before persistence',async()=>{
 await assert.rejects(()=>createApiKeyCredential({keyId:'key-bad-scope',subjectId:'subject-3',productId:'bai-video-production',scopes:['admin:all']}),e=>e.code==='HUB_AUTH_SCOPE_UNKNOWN');
});
