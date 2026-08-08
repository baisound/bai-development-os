import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateKnowledgeDebt, computeMonitoringMetrics, deduplicateAlerts, evaluateMonitoringAlerts } from '../../src/monitoring/index.mjs';
const clock=()=>new Date('2026-08-08T12:00:00Z');
function sources(){return{
 lifecycle_records:[{task_status:'ACTIVE',current_phase:'IMPLEMENTATION',gate_status:'PASS',entered_at:'2026-08-08T00:00:00Z'}],
 test_results:[{status:'PASS'},{status:'PASS'},{status:'FAIL'}],
 automation_runs:[{retry_count:2,status:'STALLED',owner_approval_required:true,authorization_status:'PENDING'}],
 context_observations:[{token_count:1000,duplicate_count:2,stale_count:1,conflict_count:1,mandatory_missing:1}],
 cost_events:[{event_type:'ACTUAL_RECORDED',cost_microusd:900,budget_microusd:1000}],
 model_events:[{status:'PASS',latency_ms:100},{status:'FAIL',latency_ms:300,fallback:true}],
 knowledge_assets:[{status:'CANDIDATE'},{status:'STALE',owner_id:'a'},{status:'INVALID',owner_id:'b'}],
 knowledge_usage_events:[{applied:true,verified:true},{result:'APPLIED',verification_result:'PASS',recurrence:true}],
 registry_events:[{result:'FAIL',error_code:'HASH_MISMATCH'},{event_type:'REBUILD',result:'PASS'}],
 integration_events:[{status:'FAIL',rate_limited:true},{status:'PASS'}],
 governance_events:[{event_type:'VERIFY_FAIL',verification_result:'FAIL'},{status:'PENDING'}],
 system_events:[]
};}
test('knowledge debt scores candidate stale invalid and ownerless',()=>{const d=calculateKnowledgeDebt([{status:'CANDIDATE'},{status:'STALE',owner_id:'x'},{status:'INVALID',owner_id:'y'},{status:'ACTIVE'}]);assert.equal(d.details.candidate,1);assert.equal(d.details.stale,1);assert.equal(d.details.invalid,1);assert.equal(d.details.ownerless,2);assert.equal(d.score,14);});
test('metrics aggregate all monitoring domains',()=>{const m=computeMonitoringMetrics(sources(),{clock});assert.equal(m.lifecycle.task_count,1);assert.equal(m.quality.test_total,3);assert.equal(m.quality.test_pass,2);assert.equal(m.automation.retry_count,2);assert.equal(m.context.token_count,1000);assert.equal(m.cost.actual_cost_microusd,900);assert.equal(m.cost.utilization,0.9);assert.equal(m.model.failure_count,1);assert.equal(m.knowledge.application_count,2);assert.equal(m.registry.verify_failure_count,1);assert.equal(m.integration.rate_limit_count,1);assert.equal(m.governance.verify_failure_count,1);});
test('metrics handle empty sources without division by zero',()=>{const m=computeMonitoringMetrics({}, {clock});assert.equal(m.quality.test_pass_rate,null);assert.equal(m.model.failure_rate,null);assert.equal(m.cost.utilization,null);assert.equal(m.lifecycle.active_phase_age_max_ms,0);});
test('alerts raise lifecycle warning/high based on phase age',()=>{const m=computeMonitoringMetrics(sources(),{clock,policy:{phase_age_warning_ms:1,phase_age_high_ms:2}});const a=evaluateMonitoringAlerts(m,{clock,policy:{phase_age_warning_ms:1,phase_age_high_ms:2}});assert.ok(a.some(x=>x.code==='PHASE_LONG_RUNNING_HIGH'));});
test('alerts raise high on repeated stall',()=>{const m=computeMonitoringMetrics(sources(),{clock,policy:{repeated_stall_high_at:1}});assert.ok(evaluateMonitoringAlerts(m,{clock,policy:{repeated_stall_high_at:1}}).some(x=>x.code==='REPEATED_STALL'));});
test('alerts raise high on low test pass rate',()=>{const m=computeMonitoringMetrics(sources(),{clock});assert.ok(evaluateMonitoringAlerts(m,{clock}).some(x=>x.code==='TEST_PASS_RATE_LOW_HIGH'));});
test('alerts raise mandatory context missing',()=>{const m=computeMonitoringMetrics(sources(),{clock});assert.ok(evaluateMonitoringAlerts(m,{clock}).some(x=>x.code==='MANDATORY_CONTEXT_MISSING'));});
test('alerts raise soft cost budget warning',()=>{const m=computeMonitoringMetrics(sources(),{clock});assert.ok(evaluateMonitoringAlerts(m,{clock}).some(x=>x.code==='COST_BUDGET_SOFT_LIMIT'));});
test('alerts raise model failure high',()=>{const m=computeMonitoringMetrics(sources(),{clock});assert.ok(evaluateMonitoringAlerts(m,{clock}).some(x=>x.code==='MODEL_FAILURE_RATE_HIGH'));});
test('alerts raise knowledge debt high or warning',()=>{const m=computeMonitoringMetrics(sources(),{clock,policy:{knowledge_debt_high_at:5}});assert.ok(evaluateMonitoringAlerts(m,{clock,policy:{knowledge_debt_high_at:5}}).some(x=>x.code==='KNOWLEDGE_DEBT_HIGH'));});
test('alerts raise registry verify failure',()=>{const m=computeMonitoringMetrics(sources(),{clock});assert.ok(evaluateMonitoringAlerts(m,{clock}).some(x=>x.code==='REGISTRY_VERIFY_FAILURE'));});
test('alerts raise integration failure high',()=>{const m=computeMonitoringMetrics(sources(),{clock});assert.ok(evaluateMonitoringAlerts(m,{clock}).some(x=>x.code==='INTEGRATION_FAILURE_RATE_HIGH'));});
test('alerts raise governance verify failure',()=>{const m=computeMonitoringMetrics(sources(),{clock});assert.ok(evaluateMonitoringAlerts(m,{clock}).some(x=>x.code==='GOVERNANCE_VERIFY_FAILURE'));});
test('critical system incident becomes critical alert',()=>{const s=sources();s.system_events=[{severity:'CRITICAL'}];const m=computeMonitoringMetrics(s,{clock});const a=evaluateMonitoringAlerts(m,{clock});assert.ok(a.some(x=>x.severity==='CRITICAL'&&x.code==='CRITICAL_SYSTEM_INCIDENT'));});
test('canonical integrity failure becomes critical alert',()=>{const s=sources();s.system_events=[{canonical_integrity:false}];const m=computeMonitoringMetrics(s,{clock});const a=evaluateMonitoringAlerts(m,{clock});assert.ok(a.some(x=>x.code==='CANONICAL_INTEGRITY_FAILURE'));});
test('deduplicateAlerts removes recent same code/severity',()=>{const m=computeMonitoringMetrics(sources(),{clock});const a=evaluateMonitoringAlerts(m,{clock});const prior=a.map(x=>({...x,created_at:'2026-08-08T11:55:00Z'}));assert.equal(deduplicateAlerts(a,prior,{clock,window_ms:10*60*1000}).length,0);});
test('deduplicateAlerts allows alert after window',()=>{const m=computeMonitoringMetrics(sources(),{clock});const a=evaluateMonitoringAlerts(m,{clock});const prior=a.map(x=>({...x,created_at:'2026-08-08T10:00:00Z'}));assert.equal(deduplicateAlerts(a,prior,{clock,window_ms:10*60*1000}).length,a.length);});
