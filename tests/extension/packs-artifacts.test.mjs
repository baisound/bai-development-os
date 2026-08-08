import test from 'node:test';import assert from 'node:assert/strict';
import { createDomainPack,verifyDomainPack,validatePolicyPackFloors,buildDomainPackSet,evaluateDomainArtifact } from '../../src/extension/index.mjs';
const pack=(o={})=>createDomainPack({pack_id:'pack.a',extension_id:'ext.a',domain:'VIDEO',pack_type:'PROJECT_POLICY',mandatory_floors:['AUTHORITY','SECURITY'],rules:[{id:'x'}],...o});
test('domain pack is checksummed and immutable',()=>{const p=pack();assert.match(p.content_checksum,/^[a-f0-9]{64}$/);assert(Object.isFrozen(p));});
test('invalid pack type rejected',()=>assert.throws(()=>pack({pack_type:'MAGIC'}),e=>e.code==='EXTENSION_PACK_TYPE_INVALID'));
test('tampered pack rejected',()=>{const p=structuredClone(pack());p.domain='AUDIO';assert.throws(()=>verifyDomainPack(p),e=>e.code==='EXTENSION_PACK_TAMPERED');});
test('policy floor validation passes',()=>assert.equal(validatePolicyPackFloors(pack(),{required_floors:['AUTHORITY']}),true));
test('policy floor weakening blocked',()=>assert.throws(()=>validatePolicyPackFloors(pack(),{required_floors:['AUTHORITY','TRUST']}),e=>e.code==='EXTENSION_POLICY_FLOOR_WEAKENING'));
test('pack set sorts packs',()=>{const a=pack({pack_id:'z'}),b=pack({pack_id:'a'});assert.deepEqual(buildDomainPackSet([a,b]).packs.map(x=>x.pack_id),['a','z']);});
test('duplicate pack id blocked',()=>assert.throws(()=>buildDomainPackSet([pack(),pack()]),e=>e.code==='EXTENSION_PACK_DUPLICATE'));
test('artifact validator pass permits preview',async()=>{const r=await evaluateDomainArtifact({artifact:{x:1},validators:[async()=>({validator_id:'v',status:'PASS'})],previewers:[async()=>({previewer_id:'p',value:{url:'preview'}})]});assert.equal(r.status,'PASS');assert.equal(r.previews[0].status,'DERIVED_NON_CANONICAL');});
test('artifact validation failure suppresses previews',async()=>{const r=await evaluateDomainArtifact({artifact:{x:1},validators:[async()=>({validator_id:'v',status:'FAIL'})],previewers:[async()=>({previewer_id:'p',value:1})]});assert.equal(r.status,'FAIL');assert.equal(r.previews.length,0);});
test('quality gate failure fails artifact',async()=>{const r=await evaluateDomainArtifact({artifact:{x:1},quality_gates:[async()=>({gate_id:'quality',status:'FAIL',findings:['bad']})]});assert.equal(r.status,'FAIL');});
test('quality gate pass succeeds',async()=>assert.equal((await evaluateDomainArtifact({artifact:{x:1},quality_gates:[async()=>({gate_id:'q',status:'PASS'})]})).status,'PASS'));
test('artifact evaluation is checksummed',async()=>assert.match((await evaluateDomainArtifact({artifact:{x:1}})).content_checksum,/^[a-f0-9]{64}$/));
test('artifact evaluation rejects non-object',async()=>assert.rejects(()=>evaluateDomainArtifact({artifact:'bad'}),e=>e.code==='EXTENSION_ARTIFACT_INVALID'));
test('preview never claims canonical status',async()=>{const r=await evaluateDomainArtifact({artifact:{x:1},previewers:[async()=>({previewer_id:'p',value:{canonical:true}})]});assert.equal(r.previews[0].status,'DERIVED_NON_CANONICAL');});

test('pack version must be semver',()=>assert.throws(()=>pack({pack_version:'latest'})));
