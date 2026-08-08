import test from 'node:test'; import assert from 'node:assert/strict';
import { classifyTrust, evaluateDependencyRisk, assertDependencyPolicy } from '../../src/security/policy.mjs';
test('external and generated input defaults untrusted',()=>{assert.equal(classifyTrust({external:true}),'UNTRUSTED');assert.equal(classifyTrust({generated:true}),'UNTRUSTED');});
test('verified signed input is verified',()=>assert.equal(classifyTrust({verified:true,signed:true}),'VERIFIED'));
test('high vulnerability blocks by default',()=>{const r=evaluateDependencyRisk([{id:'CVE-1',package:'x',severity:'HIGH'}]);assert.equal(r.decision,'BLOCK');assert.equal(r.blocking.length,1);});
test('fixed or allowlisted vulnerability does not block',()=>{assert.equal(evaluateDependencyRisk([{id:'CVE-1',severity:'CRITICAL',fixed:true}]).decision,'ALLOW');assert.equal(evaluateDependencyRisk([{id:'CVE-1',severity:'CRITICAL'}],{allowlist:['CVE-1']}).decision,'ALLOW');});
test('assert dependency policy throws with evidence',()=>assert.throws(()=>assertDependencyPolicy([{id:'CVE-1',severity:'CRITICAL'}],{}),e=>e.code==='SECURITY_DEPENDENCY_RISK_BLOCKED'));
