import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createPostgresEvidenceRepository } from '../../src/knowledge-hub/index.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');

test('PostgreSQL DDL owns idempotency on Product + Installation + Event and has retention index',()=>{
 const sql=fs.readFileSync(path.join(root,'deploy/knowledge-hub/postgres/001_initial.sql'),'utf8');
 assert.match(sql,/PRIMARY KEY \(product_id, installation_id, event_id\)/);
 assert.match(sql,/expires_at_idx/);assert.match(sql,/delivery_receipts/);assert.match(sql,/client_policies/);
 assert.doesNotMatch(sql,/password|api_key|secret/i);
});

test('PostgreSQL adapter uses injected query boundary and distinguishes duplicate from conflict',async()=>{
 const calls=[];let storedHash=null;
 const query=async(sql,params)=>{calls.push({sql,params});if(sql.startsWith('INSERT INTO evidence_events')){if(storedHash)return{rows:[]};storedHash=params[3];return{rows:[{event_hash:storedHash}]};}if(sql.startsWith('SELECT event_hash'))return{rows:[{event_hash:storedHash}]};return{rows:[],rowCount:0};};
 const repo=createPostgresEvidenceRepository({query});
 const base={product_id:'bai-video-production',installation_id:'inst-1',event:{event_id:'evt-1',type:'feature_result',feature:'subtitle_import',result:'success',privacy_level:'P0',properties:{}},knowledge_evidence:{evidence_id:'CE-12345678'},subject_id:'sub-1',trust_level:'REGISTERED_CLIENT',transport:'https',received_at:'2026-08-11T00:00:00.000Z',expires_at:'2026-09-10T00:00:00.000Z'};
 assert.equal((await repo.storeEvent(base)).outcome,'ACCEPTED');assert.equal((await repo.storeEvent(base)).outcome,'ALREADY_SEEN');assert.ok(calls.some(c=>c.sql.includes('ON CONFLICT')));
 const conflict=structuredClone(base);conflict.event.result='failure';assert.equal((await repo.storeEvent(conflict)).outcome,'CONFLICT');
});
