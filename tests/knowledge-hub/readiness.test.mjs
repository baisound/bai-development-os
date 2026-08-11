import assert from 'node:assert/strict';
import test from 'node:test';
import { createCommonIngestionCore, createKnowledgeHubHttpServer, createPostgresEvidenceRepository, InMemoryEvidenceRepository } from '../../src/knowledge-hub/index.mjs';

test('readyz reports repository-backed readiness without authentication',async(t)=>{
 const core=createCommonIngestionCore({repository:new InMemoryEvidenceRepository()});const hub=createKnowledgeHubHttpServer({core,authenticate:()=>{throw new Error('must not authenticate readyz')}});const {base_url}=await hub.start();t.after(()=>hub.stop());const response=await fetch(`${base_url}/readyz`);assert.equal(response.status,200);assert.deepEqual(await response.json(),{status:'ready',service:'bai-knowledge-hub',backend:'memory'});
});

test('PostgreSQL readiness uses SELECT 1 and fails closed through core',async()=>{
 const repo=createPostgresEvidenceRepository({query:async sql=>{if(sql==='SELECT 1 AS ready')return{rows:[{ready:1}]};return{rows:[]};}});const core=createCommonIngestionCore({repository:repo});assert.deepEqual(await core.checkReady(),{ready:true,backend:'postgres'});
 const broken=createPostgresEvidenceRepository({query:async sql=>{if(sql==='SELECT 1 AS ready')throw new Error('db down');return{rows:[]};}});assert.equal((await createCommonIngestionCore({repository:broken}).checkReady()).ready,false);
});
