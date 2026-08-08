import test from 'node:test'; import assert from 'node:assert/strict';
import * as Root from '../../src/index.mjs';
import { createDistributedEventEnvelope, createRemoteRunRequest, createDistributedCalibrationEvidenceEnvelope } from '../../src/distributed/index.mjs';
import { createCalibrationEvidence } from '../../src/calibration/index.mjs';
test('root exports DistributedOS namespace',()=>assert.ok(Root.DistributedOS?.DistributedService));
test('distributed event carries monitoring trace correlation metadata',()=>{const e=createDistributedEventEnvelope({event_type:'MONITORING_EVENT',project_id:'p1',task_id:'TASK-015',correlation_id:'trace-1',causation_id:'parent-1',partition_key:'p1',payload:{metric:'queue.depth'}}); assert.equal(e.correlation_id,'trace-1'); assert.equal(e.causation_id,'parent-1');});
test('remote request carries policy trust epoch and authorization binding',()=>{const r=createRemoteRunRequest({kind:'EXTENSION',project_id:'p1',binding_checksum:'sha256:manifest',policy_version:'7',trust_version:'9',activation_epoch:4,authorization_ref:'auth:1'}); assert.equal(r.authorization_ref,'auth:1'); assert.equal(r.activation_epoch,4);});
test('distributed calibration reuses TASK-014 evidence object unchanged',()=>{const e=createCalibrationEvidence({project_id:'p1',subsystem:'GOVERNANCE',metric:'review_cycles_used',value:1,evidence_class:'REAL',source:'integration'}); const d=createDistributedCalibrationEvidenceEnvelope(e,{source_node_id:'n1',cohort_id:'linux'}); assert.equal(d.evidence.content_checksum,e.content_checksum);});
