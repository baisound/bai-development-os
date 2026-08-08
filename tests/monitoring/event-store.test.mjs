import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { appendMonitoringEvent, createMonitoringEvent, readMonitoringEventLedger, verifyMonitoringEvent, verifyMonitoringEventLedger } from '../../src/monitoring/index.mjs';
const clock=()=>new Date('2026-08-08T00:00:00Z');
const base={project_id:'P1',task_id:'TASK-007',run_id:'run-1',component:'QUALITY',metric:'test.pass',value:1};

test('createMonitoringEvent creates immutable checksummed event',()=>{const e=createMonitoringEvent(base,{clock});assert.equal(e.project_id,'P1');assert.equal(e.observed_at,'2026-08-08T00:00:00.000Z');assert.equal(verifyMonitoringEvent(e),true);assert.equal(Object.isFrozen(e),true);});
test('event uses run id as correlation id by default',()=>assert.equal(createMonitoringEvent(base,{clock}).correlation_id,'run-1'));
test('event rejects invalid component',()=>assert.throws(()=>createMonitoringEvent({...base,component:'MAGIC'},{clock}),e=>e.code==='MONITORING_COMPONENT_INVALID'));
test('event rejects invalid severity',()=>assert.throws(()=>createMonitoringEvent({...base,severity_hint:'PANIC'},{clock}),e=>e.code==='MONITORING_SEVERITY_INVALID'));
test('event rejects malformed timestamp',()=>assert.throws(()=>createMonitoringEvent({...base,observed_at:'bad'},{clock}),e=>e.code==='MONITORING_TIME_INVALID'));
test('tampered event is rejected',()=>{const e=structuredClone(createMonitoringEvent(base,{clock}));e.value=9;assert.throws(()=>verifyMonitoringEvent(e),x=>x.code==='MONITORING_EVENT_TAMPERED');});
test('ledger starts empty when missing',async()=>{const root=await mkdtemp(path.join(os.tmpdir(),'bai-mon-'));try{assert.deepEqual(await readMonitoringEventLedger(root),[]);}finally{await rm(root,{recursive:true,force:true});}});
test('append and verify monitoring ledger',async()=>{const root=await mkdtemp(path.join(os.tmpdir(),'bai-mon-'));try{await appendMonitoringEvent(root,createMonitoringEvent(base,{clock}));await appendMonitoringEvent(root,createMonitoringEvent({...base,event_id:'ME-2',metric:'test.fail',value:0},{clock}));const rows=await readMonitoringEventLedger(root);assert.equal(rows.length,2);assert.equal(rows[1].previous_record_checksum,rows[0].record_checksum);assert.equal((await verifyMonitoringEventLedger(root)).event_count,2);}finally{await rm(root,{recursive:true,force:true});}});
test('ledger detects row tamper',async()=>{const root=await mkdtemp(path.join(os.tmpdir(),'bai-mon-'));try{await appendMonitoringEvent(root,createMonitoringEvent(base,{clock}));const file=path.join(root,'monitoring/events.jsonl');const row=JSON.parse((await readFile(file,'utf8')).trim());row.event.value=99;await writeFile(file,JSON.stringify(row)+'\n');await assert.rejects(()=>readMonitoringEventLedger(root),e=>e.code==='MONITORING_LEDGER_CORRUPT'||e.code==='MONITORING_EVENT_TAMPERED');}finally{await rm(root,{recursive:true,force:true});}});
test('monitoring write rejects symlink escape',async()=>{const root=await mkdtemp(path.join(os.tmpdir(),'bai-mon-'));const outside=await mkdtemp(path.join(os.tmpdir(),'bai-out-'));try{await symlink(outside,path.join(root,'monitoring'));await assert.rejects(()=>appendMonitoringEvent(root,createMonitoringEvent(base,{clock})),e=>['MONITORING_PATH_ESCAPE','MONITORING_LEDGER_BUSY'].includes(e.code));}finally{await rm(root,{recursive:true,force:true});await rm(outside,{recursive:true,force:true});}});
