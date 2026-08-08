import test from 'node:test';import assert from 'node:assert/strict';
import { DEFAULT_CALIBRATION_CATALOG } from '../../src/calibration/catalog.mjs';
import { CALIBRATION_SUBSYSTEMS } from '../../src/calibration/constants.mjs';
import { buildCalibrationReport, verifyCalibrationReport } from '../../src/calibration/recommendation.mjs';
import { series } from './helpers.mjs';

test('catalog covers every TASK-014 subsystem',()=>{const s=new Set(DEFAULT_CALIBRATION_CATALOG.map(x=>x.subsystem));for(const x of CALIBRATION_SUBSYSTEMS)assert.ok(s.has(x),x);});
test('report produces bounded governance recommendation',()=>{const r=buildCalibrationReport(series({values:[0,1,1,1,2,1,0,1,1,2]}),{current_policy:{governance:{review_cycle_cap:1}}});assert.equal(verifyCalibrationReport(r),true);const x=r.recommendations.find(x=>x.policy_key==='governance.review_cycle_cap');assert.ok(x);assert.ok(x.proposed_value<=2);});
test('insufficient parameters are reported instead of guessed',()=>{const r=buildCalibrationReport(series({values:[1,1]}));assert.ok(r.insufficient_evidence.length>0);});
test('integration timeout uses p95 headroom and bounds',()=>{const r=buildCalibrationReport(series({subsystem:'INTEGRATION',metric:'successful_latency_ms',values:[100,110,120,130,140,150,160,170,180,200]}));const x=r.recommendations.find(x=>x.policy_key==='integration.timeout_ms');assert.ok(x.proposed_value>=200);assert.ok(x.proposed_value<=300000);});
test('extension calibration is part of current task scope',()=>{const r=buildCalibrationReport(series({subsystem:'EXTENSION',metric:'successful_peak_concurrency',values:[1,2,2,3,3,4,2,3,4,5]}));assert.ok(r.recommendations.some(x=>x.policy_key==='extension.concurrency_limit'));});
test('report tampering is rejected',()=>{const r=buildCalibrationReport(series());assert.throws(()=>verifyCalibrationReport({...r,evidence_count:999}),/TAMPERED/);});
