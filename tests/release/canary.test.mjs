import test from 'node:test';import assert from 'node:assert/strict';import { evaluateCanary,assertCanaryPromotable } from '../../src/release/canary.mjs';
test('healthy canary promotes',()=>assert.equal(evaluateCanary({health:'HEALTHY',samples:100,error_rate:0}).decision,'PROMOTE'));
test('insufficient sample holds',()=>assert.ok(evaluateCanary({health:'HEALTHY',samples:0,minimum_samples:10}).blockers.includes('INSUFFICIENT_SAMPLES')));
test('critical alert holds',()=>assert.ok(evaluateCanary({health:'HEALTHY',samples:10,critical_alerts:1}).blockers.includes('CRITICAL_ALERTS_PRESENT')));
test('error rate holds',()=>assert.ok(evaluateCanary({health:'HEALTHY',samples:10,error_rate:.2,maximum_error_rate:.01}).blockers.includes('ERROR_RATE_EXCEEDED')));
test('assert canary throws when held',()=>assert.throws(()=>assertCanaryPromotable({health:'DEGRADED',samples:10}),e=>e.code==='RELEASE_CANARY_HOLD'));
