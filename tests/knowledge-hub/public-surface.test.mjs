import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import * as rootApi from '../../src/index.mjs';
import * as hubApi from '../../src/knowledge-hub/index.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');

test('root exports KnowledgeHubOS without replacing KnowledgeEvolutionOS',()=>{assert.ok(rootApi.KnowledgeHubOS);assert.ok(rootApi.KnowledgeEvolutionOS);});
test('package exposes knowledge-hub public subpath',()=>{const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));assert.equal(pkg.exports['./knowledge-hub'],'./src/knowledge-hub/index.mjs');});
test('Hub public module exposes local foundation primitives',()=>{for(const name of ['createCommonIngestionCore','InMemoryEvidenceRepository','createPostgresEvidenceRepository','createFixedWindowRateLimiter','aggregateEvidenceRecords'])assert.equal(typeof hubApi[name],'function');});
