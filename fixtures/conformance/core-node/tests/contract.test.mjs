import test from 'node:test';
import assert from 'node:assert/strict';
import { ConformanceOS, SecurityOS, ReleaseOS } from '../../../../src/index.mjs';
test('core-node imports governed OS surfaces',()=>{assert.equal(typeof ConformanceOS.createConformanceFixture,'function');assert.ok(SecurityOS);assert.ok(ReleaseOS);});
test('core-node project fixture validates',()=>{const f=ConformanceOS.createConformanceFixture({fixture_id:'core-node',project_id:'core-node',name:'core-node',scale:'MEDIUM',risk_tier:'CORE_CRITICAL',domains:['software'],languages:['javascript'],platform:{os:process.platform,arch:process.arch,filesystem:'local',evidence_level:'REAL'},runtime:{name:'node',version:process.versions.node,shell:'sh'},consumer_contract:{mode:'NODE_TEST',target:'tests/contract.test.mjs',trust:'TRUSTED_LOCAL'},evidence_level:'REAL'});assert.equal(f.project_id,'core-node');});
