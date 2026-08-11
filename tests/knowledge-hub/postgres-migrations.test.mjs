import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { applyPostgresMigrations } from '../../src/knowledge-hub/index.mjs';

test('migration runner applies ordered SQL once and verifies immutable checksum',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hub-migrations-'));fs.writeFileSync(path.join(dir,'001_first.sql'),'CREATE TABLE x(id int);\n');fs.writeFileSync(path.join(dir,'002_second.sql'),'ALTER TABLE x ADD COLUMN y int;\n');
 const applied=new Map();const calls=[];const query=async(sql,params=[])=>{calls.push({sql,params});if(sql.startsWith('SELECT checksum'))return{rows:applied.has(params[0])?[{checksum:applied.get(params[0])}]:[]};if(sql.startsWith('INSERT INTO schema_migrations')){applied.set(params[0],params[1]);return{rows:[]};}return{rows:[]};};
 const first=await applyPostgresMigrations({query,directory:dir});assert.deepEqual(first.applied,['001_first.sql','002_second.sql']);const second=await applyPostgresMigrations({query,directory:dir});assert.deepEqual(second.skipped,['001_first.sql','002_second.sql']);
 fs.writeFileSync(path.join(dir,'001_first.sql'),'CREATE TABLE changed(id int);\n');await assert.rejects(()=>applyPostgresMigrations({query,directory:dir}),e=>e.code==='HUB_MIGRATION_CHECKSUM_MISMATCH');
});


test('migration runner can delegate atomic application to deployment executor',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hub-migrations-atomic-'));fs.writeFileSync(path.join(dir,'001_first.sql'),'CREATE TABLE x(id int);\n');
 const applied=new Map();let executorCalls=0;const query=async(sql,params=[])=>{if(sql.startsWith('SELECT checksum'))return{rows:applied.has(params[0])?[{checksum:applied.get(params[0])}]:[]};return{rows:[]};};
 const executeMigration=async({name,checksum})=>{executorCalls+=1;applied.set(name,checksum);return{applied:true};};const result=await applyPostgresMigrations({query,directory:dir,executeMigration});assert.equal(executorCalls,1);assert.deepEqual(result.applied,['001_first.sql']);
});


test('migration executor may report concurrent already-applied migration as skipped',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hub-migrations-concurrent-'));fs.writeFileSync(path.join(dir,'001_first.sql'),'CREATE TABLE x(id int);\n');
 const query=async(sql)=>sql.startsWith('SELECT checksum')?{rows:[]}:{rows:[]};const result=await applyPostgresMigrations({query,directory:dir,executeMigration:async()=>({applied:false})});assert.deepEqual(result.applied,[]);assert.deepEqual(result.skipped,['001_first.sql']);
});
