import test from 'node:test';import assert from 'node:assert/strict';import { allocateFairCapacity,evaluateNoisyNeighbor } from '../../src/conformance/index.mjs';
test('equal weights split capacity',()=>{const r=allocateFairCapacity({capacity:10,demands:[{project_id:'a',demand:10},{project_id:'b',demand:10}]});assert.equal(r.projects[0].allocated,5);assert.equal(r.projects[1].allocated,5);});
test('unused share redistributes',()=>{const r=allocateFairCapacity({capacity:10,demands:[{project_id:'a',demand:1},{project_id:'b',demand:20}]});assert.equal(r.projects.find(x=>x.project_id==='a').allocated,1);assert.equal(r.allocated,10);});
test('weighted share favors higher weight',()=>{const r=allocateFairCapacity({capacity:12,demands:[{project_id:'a',demand:100,weight:1},{project_id:'b',demand:100,weight:3}]});assert.equal(r.projects.find(x=>x.project_id==='b').allocated,9);});
test('minimum share detects starvation',()=>assert.equal(allocateFairCapacity({capacity:1,minimum_share:1,demands:[{project_id:'a',demand:1},{project_id:'b',demand:1}]}).status,'FAIL'));
test('noisy neighbor preserves normal consumer',()=>{const r=evaluateNoisyNeighbor({normal_demand:10,noisy_demand:1000,capacity:20});assert.equal(r.status,'PASS');assert.equal(r.projects.find(x=>x.project_id==='normal').allocated,10);});
test('capacity zero does not overallocate',()=>assert.equal(allocateFairCapacity({capacity:0,demands:[{project_id:'a',demand:2}]}).allocated,0));
test('empty demands rejected',()=>assert.throws(()=>allocateFairCapacity({capacity:10,demands:[]})));
test('negative demand rejected',()=>assert.throws(()=>allocateFairCapacity({capacity:10,demands:[{project_id:'a',demand:-1}]})));
