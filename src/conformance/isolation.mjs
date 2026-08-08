import { CONFORMANCE_STATUS, RESOURCE_TYPES } from './constants.mjs';
import { ConformanceError } from './errors.mjs';
import { deepFreeze } from './util.mjs';

const resourceSet=new Set(RESOURCE_TYPES);
function namespaceFor(fixture,resource){ if(resource==='VAULT'||resource==='CREDENTIAL') return fixture.security.vault_namespace; if(resource==='SIGNER') return fixture.security.signer_namespace; if(resource==='TRUST_ANCHOR') return fixture.security.trust_namespace; if(resource==='SECURITY_POLICY') return fixture.security.policy_namespace; return `${fixture.project_id}:${resource.toLowerCase()}`; }
export function evaluateNamespaceIsolation(fixtures,{resources=RESOURCE_TYPES,allowed_shared=[]}={}){
  const violations=[]; const checked=[]; const allowed=new Set(allowed_shared.map(x=>`${x.resource}:${[...x.projects].sort().join('|')}:${x.namespace}`));
  for(const resource of resources){ if(!resourceSet.has(resource)) throw new ConformanceError('CONFORMANCE_RESOURCE_INVALID',resource); for(let i=0;i<fixtures.length;i++)for(let j=i+1;j<fixtures.length;j++){ const a=fixtures[i],b=fixtures[j],na=namespaceFor(a,resource),nb=namespaceFor(b,resource); const key=`${resource}:${[a.project_id,b.project_id].sort().join('|')}:${na}`; const shared=na===nb; const permitted=shared&&allowed.has(key); checked.push({resource,left:a.project_id,right:b.project_id,left_namespace:na,right_namespace:nb,shared,permitted}); if(shared&&!permitted)violations.push({code:'CROSS_PROJECT_NAMESPACE_COLLISION',resource,projects:[a.project_id,b.project_id],namespace:na}); }}
  return deepFreeze({status:violations.length?CONFORMANCE_STATUS.FAIL:CONFORMANCE_STATUS.PASS,checked_pairs:checked.length,violations,checked});
}
export function evaluateOwnershipRecords(records=[]){ const violations=[]; for(const record of records){ if(!record.project_id||!record.owner_project_id) throw new ConformanceError('CONFORMANCE_OWNERSHIP_RECORD_INVALID'); if(record.project_id!==record.owner_project_id) violations.push({code:'CROSS_PROJECT_OWNERSHIP_LEAK',resource_type:record.resource_type??'UNKNOWN',project_id:record.project_id,owner_project_id:record.owner_project_id,reference:record.reference??null}); } return deepFreeze({status:violations.length?CONFORMANCE_STATUS.FAIL:CONFORMANCE_STATUS.PASS,checked:records.length,violations}); }
export function assertIsolation(result){ if(result.status==='FAIL') throw new ConformanceError('CONFORMANCE_ISOLATION_FAILED','cross-project isolation failed',result); return result; }
