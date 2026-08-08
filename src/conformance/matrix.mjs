import { CONFORMANCE_STATUS, EVIDENCE_LEVEL, RISK_TIERS, SCALES } from './constants.mjs';
import { ConformanceError } from './errors.mjs';
import { deepFreeze, newId, sortStrings, uniq } from './util.mjs';

const scoreEvidence=(level)=>({REAL:4,SANDBOX:3,SIMULATED:2,DECLARED:1}[level]??0);
export function buildCompatibilityMatrix({fixtures=[],required={}}={}){
  if(!Array.isArray(fixtures)||fixtures.length===0) throw new ConformanceError('CONFORMANCE_MATRIX_EMPTY');
  const axes={projects:sortStrings(uniq(fixtures.map(f=>f.project_id))),scales:sortStrings(uniq(fixtures.map(f=>f.scale))),risk_tiers:sortStrings(uniq(fixtures.map(f=>f.risk_tier))),domains:sortStrings(uniq(fixtures.flatMap(f=>f.domains))),languages:sortStrings(uniq(fixtures.flatMap(f=>f.languages))),platforms:sortStrings(uniq(fixtures.map(f=>`${f.platform.os}/${f.platform.arch}/${f.platform.filesystem}`))),providers:sortStrings(uniq(fixtures.flatMap(f=>f.providers.map(p=>`${p.capability}:${p.provider_id}`))))};
  const evidence={REAL:0,SANDBOX:0,SIMULATED:0,DECLARED:0}; for(const f of fixtures)evidence[f.evidence_level]=(evidence[f.evidence_level]??0)+1;
  const missing=[]; for(const s of required.scales??[])if(!axes.scales.includes(s))missing.push({axis:'scale',value:s}); for(const r of required.risk_tiers??[])if(!axes.risk_tiers.includes(r))missing.push({axis:'risk_tier',value:r}); for(const d of required.domains??[])if(!axes.domains.includes(d))missing.push({axis:'domain',value:d}); for(const p of required.platforms??[])if(!axes.platforms.some(x=>x.startsWith(`${p}/`)))missing.push({axis:'platform',value:p});
  const bestEvidence=Math.max(...fixtures.map(f=>scoreEvidence(f.evidence_level))); const status=missing.length?CONFORMANCE_STATUS.FAIL:(bestEvidence>=3?CONFORMANCE_STATUS.PASS:CONFORMANCE_STATUS.CONDITIONAL);
  return deepFreeze({matrix_version:'1.0.0',matrix_id:newId('matrix'),status,axes,evidence,missing_required_coverage:missing,fixture_count:fixtures.length,pair_count:fixtures.length*(fixtures.length-1)/2,required:structuredClone(required)});
}
export function pairwiseFixtureCases(fixtures){ const cases=[]; for(let i=0;i<fixtures.length;i++)for(let j=i+1;j<fixtures.length;j++)cases.push(deepFreeze({case_id:`pair:${fixtures[i].fixture_id}:${fixtures[j].fixture_id}`,left:fixtures[i].fixture_id,right:fixtures[j].fixture_id,projects:[fixtures[i].project_id,fixtures[j].project_id]})); return deepFreeze(cases); }
