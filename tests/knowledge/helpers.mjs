import { createKnowledgeAsset } from '../../src/knowledge/index.mjs';
export const fixedClock=(iso='2026-08-08T00:00:00.000Z')=>()=>new Date(iso);
export function asset(id,extra={}){
  return createKnowledgeAsset({
    asset_id:id,title:`Knowledge ${id}`,knowledge_type:'GOOD_PRACTICE',status:'ACTIVE',maturity:'KNOWLEDGE_ASSET',enforcement:'ADVISORY',
    scope:{level:'GLOBAL'},source_trust:'VERIFIED_INTERNAL',sensitivity:'INTERNAL',confidence:.9,
    provenance:{source_ids:['SRC-1'],evidence_refs:['evidence.md'],created_by:'Builder'},
    content:{summary:`summary ${id}`,guidance:['do it'],required_actions:[],prohibited_actions:[],verification_steps:['verify']},
    freshness:{review_after:'2027-01-01T00:00:00.000Z',expires_at:'2028-01-01T00:00:00.000Z'},
    ...extra
  },{clock:fixedClock()});
}
export const reviewerApproval={role:'KnowledgeReviewer',result:'APPROVED',actor:'reviewer'};
export const ownerApproval={role:'Owner',result:'APPROVED',actor:'owner'};
