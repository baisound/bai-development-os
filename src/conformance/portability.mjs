import { CONFORMANCE_STATUS, EVIDENCE_LEVEL } from './constants.mjs';
import { deepFreeze } from './util.mjs';
const verified=new Set([EVIDENCE_LEVEL.REAL,EVIDENCE_LEVEL.SANDBOX]);
export function evaluatePortabilityCoverage({fixtures=[],required_targets=[]}={}){
  const targets=[]; let missing=0,conditional=0;
  for(const target of required_targets){ const matches=fixtures.filter(f=>(!target.os||f.platform.os===target.os)&&(!target.arch||f.platform.arch===target.arch)&&(!target.filesystem||f.platform.filesystem===target.filesystem)); const levels=[...new Set(matches.map(f=>f.evidence_level))].sort(); let status;if(!matches.length){status=CONFORMANCE_STATUS.FAIL;missing++;}else if(matches.some(f=>verified.has(f.evidence_level))){status=CONFORMANCE_STATUS.PASS;}else{status=CONFORMANCE_STATUS.CONDITIONAL;conditional++;}targets.push({target:structuredClone(target),status,evidence_levels:levels,fixture_ids:matches.map(f=>f.fixture_id).sort()}); }
  const status=missing?CONFORMANCE_STATUS.FAIL:conditional?CONFORMANCE_STATUS.CONDITIONAL:CONFORMANCE_STATUS.PASS; const limitation=conditional?'SOME_PORTABILITY_TARGETS_HAVE_ONLY_SIMULATED_OR_DECLARED_EVIDENCE':missing?'REQUIRED_PORTABILITY_TARGET_MISSING':null; return deepFreeze({status,targets,limitation});
}
