import test from 'node:test';import assert from 'node:assert/strict';import { createConformanceFixture,evaluatePortabilityCoverage } from '../../src/conformance/index.mjs';
const f=(id,os,ev)=>createConformanceFixture({fixture_id:id,project_id:id,name:id,scale:'SMALL',risk_tier:'STANDARD',domains:['software'],languages:['javascript'],platform:{os,arch:'x64',filesystem:'local',evidence_level:ev},runtime:{name:'node',shell:'sh'},evidence_level:ev});
test('real target passes portability',()=>assert.equal(evaluatePortabilityCoverage({fixtures:[f('a','linux','REAL')],required_targets:[{os:'linux'}]}).status,'PASS'));
test('sandbox target passes portability',()=>assert.equal(evaluatePortabilityCoverage({fixtures:[f('a','linux','SANDBOX')],required_targets:[{os:'linux'}]}).status,'PASS'));
test('simulated target is conditional',()=>assert.equal(evaluatePortabilityCoverage({fixtures:[f('a','windows','SIMULATED')],required_targets:[{os:'windows'}]}).status,'CONDITIONAL'));
test('declared target is conditional',()=>assert.equal(evaluatePortabilityCoverage({fixtures:[f('a','darwin','DECLARED')],required_targets:[{os:'darwin'}]}).status,'CONDITIONAL'));
test('missing target fails',()=>assert.equal(evaluatePortabilityCoverage({fixtures:[f('a','linux','REAL')],required_targets:[{os:'windows'}]}).status,'FAIL'));
test('arch matching is enforced',()=>assert.equal(evaluatePortabilityCoverage({fixtures:[f('a','linux','REAL')],required_targets:[{os:'linux',arch:'arm64'}]}).status,'FAIL'));
