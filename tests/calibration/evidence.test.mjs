import test from 'node:test';import assert from 'node:assert/strict';
import { createCalibrationEvidence, verifyCalibrationEvidence, evidenceFromMonitoringEvent } from '../../src/calibration/evidence.mjs';
import { fixedClock } from './helpers.mjs';

test('creates checksummed REAL calibration evidence',()=>{const e=createCalibrationEvidence({project_id:'p',subsystem:'governance',metric:'x',value:1,source:'unit'},{clock:fixedClock});assert.equal(e.subsystem,'GOVERNANCE');assert.equal(e.evidence_weight,1);assert.match(e.content_checksum,/^sha256:/);assert.equal(verifyCalibrationEvidence(e),true);});
test('SANDBOX evidence has reduced default weight',()=>{const e=createCalibrationEvidence({project_id:'p',subsystem:'SECURITY',metric:'x',value:1,evidence_class:'SANDBOX',source:'unit'},{clock:fixedClock});assert.equal(e.evidence_weight,.8);});
test('SIMULATED evidence has limited weight',()=>{const e=createCalibrationEvidence({project_id:'p',subsystem:'RELEASE',metric:'x',value:1,evidence_class:'SIMULATED',source:'unit'},{clock:fixedClock});assert.equal(e.evidence_weight,.35);});
test('DECLARED evidence has minimal weight',()=>{const e=createCalibrationEvidence({project_id:'p',subsystem:'CONFORMANCE',metric:'x',value:1,evidence_class:'DECLARED',source:'unit'},{clock:fixedClock});assert.equal(e.evidence_weight,.1);});
test('tampered evidence is rejected',()=>{const e=createCalibrationEvidence({project_id:'p',subsystem:'GOVERNANCE',metric:'x',value:1,source:'unit'},{clock:fixedClock});assert.throws(()=>verifyCalibrationEvidence({...e,value:2}),/TAMPERED/);});
test('invalid subsystem fails closed',()=>assert.throws(()=>createCalibrationEvidence({project_id:'p',subsystem:'MAGIC',metric:'x',value:1,source:'unit'}),/ENUM/));
test('non numeric calibration value is rejected',()=>assert.throws(()=>createCalibrationEvidence({project_id:'p',subsystem:'GOVERNANCE',metric:'x',value:'1',source:'unit'}),/NUMBER/));
test('monitoring events become calibration evidence without authority',()=>{const e=evidenceFromMonitoringEvent({event_id:'ME-1',observed_at:'2026-08-08T11:00:00.000Z',project_id:'p',task_id:'TASK-014',component:'INTEGRATION',metric:'successful_latency_ms',value:250,unit:'ms',content_checksum:'abc'});assert.equal(e.subsystem,'INTEGRATION');assert.equal(e.source,'MONITORING_EVENT');assert.equal(e.value,250);});
test('non numeric monitoring event is rejected',()=>assert.throws(()=>evidenceFromMonitoringEvent({project_id:'p',component:'SYSTEM',metric:'state',value:'ok'}),/NON_NUMERIC/));
