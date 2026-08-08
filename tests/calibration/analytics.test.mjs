import test from 'node:test';import assert from 'node:assert/strict';
import { summarizeEvidence, detectRobustAnomalies, evaluateSli, groupEvidence } from '../../src/calibration/analytics.mjs';
import { series } from './helpers.mjs';

test('summarizes verified evidence with percentiles',()=>{const s=summarizeEvidence(series(),{min_samples:5,min_verified_samples:3});assert.equal(s.sufficient_evidence,true);assert.equal(s.sample_count,10);assert.ok(s.p95>=1);});
test('insufficient evidence remains explicit',()=>{const s=summarizeEvidence(series({values:[1,2]}),{min_samples:5,min_verified_samples:3});assert.equal(s.sufficient_evidence,false);assert.ok(s.insufficiency_reasons.length);});
test('simulated-only data cannot satisfy verified floor',()=>{const s=summarizeEvidence(series({values:[1,1,1,1,1,1,1,1],evidence_class:'SIMULATED'}),{min_samples:5,min_verified_samples:3});assert.equal(s.sufficient_evidence,false);assert.equal(s.verified_sample_count,0);});
test('groups by subsystem and metric',()=>{const g=groupEvidence([...series(),...series({subsystem:'INTEGRATION',metric:'x'})]);assert.equal(g.size,2);});
test('robust anomaly detector finds strong outlier',()=>{const a=detectRobustAnomalies(series({values:[10,11,9,10,12,10,11,100]}));assert.equal(a.status,'EVALUATED');assert.equal(a.anomalies.length,1);});
test('zero MAD is stable not fabricated anomaly',()=>{const a=detectRobustAnomalies(series({values:[1,1,1,1,1]}));assert.equal(a.status,'STABLE_ZERO_MAD');});
test('SLI at least objective passes',()=>{const r=evaluateSli(series({values:[.99,.98,1]}),{objective:.95});assert.equal(r.met,true);});
test('SLI at most objective detects violation',()=>{const r=evaluateSli(series({values:[3,4,5]}),{objective:3,direction:'AT_MOST'});assert.equal(r.met,false);});
