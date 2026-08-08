import test from 'node:test';import assert from 'node:assert/strict';import { selectAcquisitionSource } from '../../src/release/acquisition.mjs';
test('verified cache preferred',()=>assert.equal(selectAcquisitionSource({cache:{available:true,verified:true,source:'cache'},registry:{available:true,verified:true,source:'npm'}}).type,'CACHE'));
test('verified mirror next',()=>assert.equal(selectAcquisitionSource({cache:{available:false},mirrors:[{available:true,verified:true,source:'m'}],registry:{available:true,verified:true,source:'npm'}}).type,'MIRROR'));
test('registry used when online',()=>assert.equal(selectAcquisitionSource({registry:{available:true,verified:true,source:'npm'}}).type,'REGISTRY'));
test('air-gapped refuses registry',()=>assert.throws(()=>selectAcquisitionSource({air_gapped:true,registry:{available:true,verified:true,source:'npm'}}),e=>e.code==='RELEASE_OFFLINE_SOURCE_UNAVAILABLE'));
test('unverified source rejected',()=>assert.throws(()=>selectAcquisitionSource({cache:{available:true,verified:false,source:'cache'}}),e=>e.code==='RELEASE_ACQUISITION_SOURCE_UNAVAILABLE'));
