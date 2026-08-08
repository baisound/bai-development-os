import test from 'node:test';import assert from 'node:assert/strict';
import * as Root from '../../src/index.mjs';
import { selectDevelopmentProfile } from '../../src/governance/adaptive-development-profile.mjs';
import { createMonitoringEvent } from '../../src/monitoring/event.mjs';
import { CalibrationService } from '../../src/calibration/service.mjs';

test('root exports CalibrationOS without replacing AdaptiveDevelopmentGovernance',()=>{assert.ok(Root.CalibrationOS);assert.ok(Root.AdaptiveDevelopmentGovernance);});
test('existing DEV safety floor remains immutable after TASK-014 module introduction',()=>{const x=selectDevelopmentProfile({criticality:'FOUNDATION'});assert.equal(x.profile_id,'DEV_4_FOUNDATION_CRITICAL');});
test('MonitoringOS evidence can feed CalibrationOS as derived input',async()=>{const s=new CalibrationService();const event=createMonitoringEvent({project_id:'p',task_id:'TASK-014',component:'INTEGRATION',metric:'successful_latency_ms',value:120,unit:'ms'});const e=await s.recordMonitoringEvent(event);assert.equal(e.subsystem,'INTEGRATION');assert.equal((await s.evidence()).length,1);});
