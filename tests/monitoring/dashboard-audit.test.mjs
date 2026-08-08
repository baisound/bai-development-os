import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCorrelationTrace, buildDashboardModel, buildMonitoringSnapshot, buildWorkspaceDashboard, queryMonitoringEvents, verifyMonitoringSnapshot } from '../../src/monitoring/index.mjs';
const clock=()=>new Date('2026-08-08T12:00:00Z');
const healthySources={test_results:[{status:'PASS'}],lifecycle_records:[{task_status:'COMPLETED',current_phase:'CLOSURE',gate_status:'PASS',entered_at:'2026-08-08T11:00:00Z'}]};
test('snapshot is derived and not canonical authority',()=>{const s=buildMonitoringSnapshot({project_id:'P1',task_id:'TASK-007',sources:healthySources},{clock});assert.equal(s.canonical_authority,false);assert.equal(s.derived_rebuildable,true);assert.equal(verifyMonitoringSnapshot(s),true);});
test('healthy snapshot reports HEALTHY',()=>assert.equal(buildMonitoringSnapshot({project_id:'P1',sources:healthySources},{clock}).health,'HEALTHY'));
test('warning snapshot reports DEGRADED',()=>{const s=buildMonitoringSnapshot({project_id:'P1',sources:{...healthySources,cost_events:[{event_type:'ACTUAL_RECORDED',cost_microusd:85,budget_microusd:100}]}},{clock});assert.equal(s.health,'DEGRADED');});
test('high snapshot reports AT_RISK',()=>{const s=buildMonitoringSnapshot({project_id:'P1',sources:{test_results:[{status:'FAIL'}]}},{clock});assert.equal(s.health,'AT_RISK');});
test('critical snapshot reports CRITICAL',()=>{const s=buildMonitoringSnapshot({project_id:'P1',sources:{system_events:[{critical:true}]}},{clock});assert.equal(s.health,'CRITICAL');});
test('tampered snapshot is rejected',()=>{const s=structuredClone(buildMonitoringSnapshot({project_id:'P1',sources:healthySources},{clock}));s.health='CRITICAL';assert.throws(()=>verifyMonitoringSnapshot(s));});
test('dashboard exposes all domain cards and remains derived',()=>{const s=buildMonitoringSnapshot({project_id:'P1',sources:healthySources},{clock});const d=buildDashboardModel(s,{clock});assert.equal(d.cards.length,11);assert.equal(d.canonical_authority,false);assert.ok(d.cards.some(x=>x.id==='knowledge'));assert.ok(d.cards.some(x=>x.id==='system'));});
test('workspace dashboard ranks critical project first',()=>{const a=buildMonitoringSnapshot({project_id:'A',sources:healthySources},{clock});const b=buildMonitoringSnapshot({project_id:'B',sources:{system_events:[{critical:true}]}},{clock});const d=buildWorkspaceDashboard([a,b],{clock});assert.equal(d.projects[0].project_id,'B');assert.equal(d.canonical_authority,false);});
const events=[
 {event_id:'1',observed_at:'2026-08-08T10:00:00Z',project_id:'P1',task_id:'TASK-007',run_id:'r1',correlation_id:'c1',component:'QUALITY',severity_hint:'INFO'},
 {event_id:'2',observed_at:'2026-08-08T10:01:00Z',project_id:'P1',task_id:'TASK-007',run_id:'r1',correlation_id:'c1',component:'COST',severity_hint:'WARNING'},
 {event_id:'3',observed_at:'2026-08-08T10:02:00Z',project_id:'P2',task_id:'TASK-008',run_id:'r2',correlation_id:'c2',component:'MODEL',severity_hint:'HIGH'},
];
test('correlation trace returns ordered matching events only',()=>{const t=buildCorrelationTrace(events,'c1');assert.equal(t.event_count,2);assert.deepEqual(t.events.map(x=>x.event_id),['1','2']);assert.equal(t.dashboard_authority,false);});
test('query filters project component severity and time',()=>{assert.equal(queryMonitoringEvents(events,{project_id:'P1'}).length,2);assert.equal(queryMonitoringEvents(events,{component:'MODEL'}).length,1);assert.equal(queryMonitoringEvents(events,{severity:'WARNING'}).length,1);assert.equal(queryMonitoringEvents(events,{since:'2026-08-08T10:01:00Z'}).length,2);});
test('query validates limit',()=>assert.throws(()=>queryMonitoringEvents(events,{limit:0}),e=>e.code==='MONITORING_QUERY_INVALID'));
