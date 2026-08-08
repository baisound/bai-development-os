import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { validateKnowledgeAsset } from '../../src/knowledge/index.mjs';

const root=path.resolve(import.meta.dirname,'../..');

test('TASK-005 JSON schemas are syntactically valid contracts',async()=>{
  const dir=path.join(root,'schemas','knowledge');
  const files=(await readdir(dir)).filter(x=>x.endsWith('.json')).sort();
  assert.equal(files.length,8);
  for(const file of files){const schema=JSON.parse(await readFile(path.join(dir,file),'utf8'));assert.equal(typeof schema,'object');assert.ok(schema.$schema||schema.type||schema.$id,`${file} must look like a JSON schema`);}
});

test('TASK-004 failure seed migration contains 14 unique candidate assets',async()=>{
  const file=path.join(root,'knowledge','seeds','task004-failure-candidates.json');
  const data=JSON.parse(await readFile(file,'utf8'));
  assert.equal(data.length,14);
  const ids=new Set(), fingerprints=new Set();
  for(const raw of data){
    const a=validateKnowledgeAsset(raw,{verifyChecksum:true});
    assert.equal(a.status,'CANDIDATE');
    assert.equal(a.knowledge_type,'FAILURE_CASE');
    assert.equal(a.scope.level,'DOMAIN');
    assert.equal(a.scope.domain,'bai-development-os');
    assert.ok(!ids.has(a.asset_id)); ids.add(a.asset_id);
    assert.ok(!fingerprints.has(a.failure.fingerprint)); fingerprints.add(a.failure.fingerprint);
  }
});
