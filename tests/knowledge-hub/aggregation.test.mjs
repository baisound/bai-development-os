import assert from 'node:assert/strict';
import test from 'node:test';
import { aggregateEvidenceRecords, createCandidateHandoff } from '../../src/knowledge-hub/index.mjs';

const rec=(id,result='success')=>({product_id:'bai-video-production',product_version:'0.17.0',event:{event_id:id,type:'feature_result',feature:'subtitle_import',result,privacy_level:'P0',properties:{}},knowledge_evidence:{evidence_id:`CE-${id}-12345678`}});

test('aggregation is deterministic and Candidate handoff never promotes automatically',()=>{
 const aggregates=aggregateEvidenceRecords([rec('evt-2'),rec('evt-1')]);assert.equal(aggregates.length,1);assert.equal(aggregates[0].observations,2);
 const candidate=createCandidateHandoff(aggregates[0]);assert.equal(candidate.status,'CANDIDATE');assert.equal(candidate.scope,'project');assert.equal(candidate.required_review,'CRITIC');
 assert.deepEqual(candidate.source_evidence_ids,['CE-evt-1-12345678','CE-evt-2-12345678']);
});

test('single observation does not create a reusable Candidate',()=>{assert.equal(createCandidateHandoff(aggregateEvidenceRecords([rec('evt-1')])[0]),null);});
