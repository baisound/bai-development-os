import { CONFORMANCE_STATUS } from './constants.mjs';
import { buildCompatibilityMatrix } from './matrix.mjs';
import { evaluateNamespaceIsolation, evaluateOwnershipRecords } from './isolation.mjs';
import { allocateFairCapacity } from './fairness.mjs';
import { createCertification } from './certification.mjs';
import { deepFreeze, newId, nowIso } from './util.mjs';

export async function runConformanceLab({fixtures,required_coverage={},ownership_records=[],consumer_runs=[],quota_probe=null,provider_probe=null,upgrade_probe=null,portability_probe=null,adversarial_probe=null,required_level='C3_MULTI_PROJECT',clock=()=>new Date()}={}){
  const matrix=buildCompatibilityMatrix({fixtures,required:required_coverage}); const results=[];
  results.push({result_id:newId('result'),category:'CONTRACT',name:'compatibility-matrix',status:matrix.status,evidence:{matrix_id:matrix.matrix_id,missing:matrix.missing_required_coverage}});
  const namespaces=evaluateNamespaceIsolation(fixtures); results.push({result_id:newId('result'),category:'ISOLATION',name:'namespace-isolation',status:namespaces.status,evidence:{checked:namespaces.checked_pairs,violations:namespaces.violations}});
  for(const run of consumer_runs){ results.push({result_id:newId('result'),category:'EXECUTION',name:`consumer-contract:${run.project_id}`,status:run.status,project_id:run.project_id,evidence_level:run.evidence_level,evidence:{fixture_id:run.fixture_id,contract_mode:run.contract_mode??null,exit_code:run.exit_code??null,timed_out:run.timed_out??false,duration_ms:run.duration_ms??null}}); }
  const ownership=evaluateOwnershipRecords(ownership_records); results.push({result_id:newId('result'),category:'ISOLATION',name:'ownership-isolation',status:ownership.status,evidence:{checked:ownership.checked,violations:ownership.violations}});
  if(quota_probe){ const q=allocateFairCapacity(quota_probe); results.push({result_id:newId('result'),category:'FAIRNESS',name:'shared-resource-fairness',status:q.status,evidence:q}); }
  if(provider_probe){ const r=await provider_probe(); results.push({result_id:newId('result'),category:'PORTABILITY',name:'provider-conformance',status:r.status,evidence:r}); }
  if(upgrade_probe){ const r=await upgrade_probe(); results.push({result_id:newId('result'),category:'PORTABILITY',name:'upgrade-chain',status:r.status,evidence:r}); }
  if(portability_probe){ const r=await portability_probe(); results.push({result_id:newId('result'),category:'PORTABILITY',name:'platform-portability',status:r.status,evidence:r,limitation:r.limitation}); }
  if(adversarial_probe){ const r=await adversarial_probe(); results.push({result_id:newId('result'),category:'ADVERSARIAL',name:'adversarial-fixtures',status:r.status,evidence:r}); }
  const certification=createCertification({subject:'BAI Development OS Consumer Conformance',results,matrix,scope:{fixtures},required_level,clock}); return deepFreeze({lab_run_version:'1.0.0',run_id:newId('lab'),generated_at:nowIso(clock),matrix,results,certification});
}
