import test from 'node:test';
import assert from 'node:assert/strict';
import { ConformanceOS, SecurityOS, ReleaseOS } from '../../../../src/index.mjs';
test('small-node imports governed OS surfaces',()=>{assert.equal(typeof ConformanceOS.createConformanceFixture,'function');assert.ok(SecurityOS);assert.ok(ReleaseOS);});
test('small-node project fixture validates',()=>{const f=ConformanceOS.createConformanceFixture({fixture_id:'small-node',project_id:'small-node',name:'small-node',scale:'SMALL',risk_tier:'STANDARD',domains:['software'],languages:['javascript'],platform:{os:process.platform,arch:process.arch,filesystem:'local',evidence_level:'REAL'},runtime:{name:'node',version:process.versions.node,shell:'sh'},consumer_contract:{mode:'NODE_TEST',target:'tests/contract.test.mjs',trust:'TRUSTED_LOCAL'},evidence_level:'REAL'});assert.equal(f.project_id,'small-node');});
