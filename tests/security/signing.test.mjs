import test from 'node:test'; import assert from 'node:assert/strict'; import { generateKeyPairSync } from 'node:crypto';
import { signEnvelope, verifySignedEnvelope } from '../../src/security/signing.mjs';
const keys=()=>generateKeyPairSync('ed25519');
test('ed25519 canonical envelope verifies independent of key order',()=>{const {privateKey,publicKey}=keys();const s=signEnvelope({b:2,a:1},{private_key:privateKey,key_id:'K1'});assert.equal(verifySignedEnvelope(s,{public_key:publicKey,expected_key_id:'K1'}),true);});
test('tamper is rejected',()=>{const {privateKey,publicKey}=keys();const s=signEnvelope({a:1},{private_key:privateKey,key_id:'K1'});assert.throws(()=>verifySignedEnvelope({...s,a:2},{public_key:publicKey}),e=>['SECURITY_SIGNATURE_PAYLOAD_MISMATCH','SECURITY_SIGNATURE_INVALID'].includes(e.code));});
test('wrong key id rejected',()=>{const {privateKey,publicKey}=keys();const s=signEnvelope({a:1},{private_key:privateKey,key_id:'K1'});assert.throws(()=>verifySignedEnvelope(s,{public_key:publicKey,expected_key_id:'K2'}),e=>e.code==='SECURITY_SIGNATURE_KEY_MISMATCH');});
