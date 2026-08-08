import test from 'node:test'; import assert from 'node:assert/strict';
import { scanSensitiveData, assertNoSecretMaterial, redactSensitiveData } from '../../src/security/dlp.mjs';
test('nested token key is detected',()=>{const f=scanSensitiveData({meta:{nested:{token:'abc'}}});assert.equal(f[0].category,'TOKEN');assert.equal(f[0].path,'meta.nested.token');});
test('private key pattern is detected',()=>assert.equal(scanSensitiveData('-----BEGIN PRIVATE KEY-----\nabc').some(x=>x.category==='PRIVATE_KEY'),true));
test('assert blocks secret material',()=>assert.throws(()=>assertNoSecretMaterial({x:{client_secret:'abc'}}),e=>e.code==='SECURITY_DLP_BLOCKED'));
test('redaction recursively removes sensitive values',()=>assert.deepEqual(redactSensitiveData({a:{password:'pw'},b:'ok'}),{a:{password:'[REDACTED]'},b:'ok'}));
test('allowed category can pass',()=>assert.equal(assertNoSecretMaterial({token:'abc'},{allowCategories:['TOKEN']}),true));
