import { compareSemver, parseSemver } from '../release/semver.mjs';
import { CONFORMANCE_STATUS } from './constants.mjs';
import { ConformanceError } from './errors.mjs';
import { deepFreeze } from './util.mjs';

function securityWeakening(before={},after={}){ const weakened=[]; for(const key of new Set([...Object.keys(before),...Object.keys(after)])) if(before[key]===true&&after[key]===false)weakened.push(key); return weakened; }
export function evaluateUpgradeChain({versions=[],allowed_direct=[],security_profiles={},migrations=[]}={}){
  if(!Array.isArray(versions)||versions.length<2) throw new ConformanceError('CONFORMANCE_UPGRADE_CHAIN_INVALID'); versions.forEach(parseSemver); const steps=[]; const blockers=[];
  for(let i=0;i<versions.length-1;i++){ const from=versions[i],to=versions[i+1],cmp=compareSemver(from,to); const direction=cmp<0?'UPGRADE':cmp>0?'DOWNGRADE':'SAME'; const key=`${from}->${to}`; const directAllowed=i===0&&versions.length===2 ? (allowed_direct.length===0||allowed_direct.includes(key)) : true; const weakened=securityWeakening(security_profiles[from],security_profiles[to]); const migration=migrations.find(m=>m.from===from&&m.to===to)??null; const stepBlockers=[]; if(!directAllowed)stepBlockers.push('DIRECT_TRANSITION_NOT_ALLOWED'); if(weakened.length)stepBlockers.push('SECURITY_PROFILE_WEAKENING'); if(migration?.required===true&&migration.available!==true)stepBlockers.push('MIGRATION_MISSING'); blockers.push(...stepBlockers.map(code=>({code,from,to,keys:weakened}))); steps.push({from,to,direction,direct_allowed:directAllowed,security_weakened:weakened,migration,blockers:stepBlockers}); }
  return deepFreeze({status:blockers.length?CONFORMANCE_STATUS.FAIL:CONFORMANCE_STATUS.PASS,versions:[...versions],steps,blockers});
}
