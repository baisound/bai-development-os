import { ReleaseError } from './errors.mjs';
import { compareSemver } from './semver.mjs';
import { evaluateCompatibility, detectBreakingChanges } from './compatibility.mjs';
import { deepFreeze, nowIso } from './util.mjs';
export function createUpgradePreview({current_state=null,current_manifest=null,target_manifest,consumer_profile={},allow_downgrade=false,migration_registry=null,clock=()=>new Date()}={}){
  const from=current_state?.os_version??current_manifest?.os_version??null; const to=target_manifest.os_version; let direction='INSTALL';if(from){const c=compareSemver(to,from);direction=c>0?'UPGRADE':c<0?'DOWNGRADE':'REINSTALL';if(c<0&&!allow_downgrade)throw new ReleaseError('RELEASE_DOWNGRADE_NOT_ALLOWED');}
  const compatibility=evaluateCompatibility(target_manifest,consumer_profile); if(compatibility.issues.some(x=>x.code==='SECURITY_PROFILE_WEAKENING')) throw new ReleaseError('RELEASE_SECURITY_WEAKENING'); const breaking=detectBreakingChanges(current_manifest,target_manifest); if(breaking.some(x=>x.type==='SECURITY_WEAKENING')) throw new ReleaseError('RELEASE_SECURITY_WEAKENING');
  let migrations=[]; if(migration_registry)migrations=migration_registry.plan(target_manifest,current_state?.schemas??consumer_profile.schemas??{});
  const blockers=[...compatibility.issues]; if(target_manifest.migrations?.some(m=>m.irreversible)&&direction==='DOWNGRADE') blockers.push({code:'IRREVERSIBLE_MIGRATION_DOWNGRADE'});
  return deepFreeze({upgrade_preview_version:'1.0.0',generated_at:nowIso(clock),direction,from,to,compatible:blockers.length===0,blockers,warnings:compatibility.warnings,breaking_changes:breaking,migrations,rollback_target:target_manifest.rollback_target,mutation_permitted:blockers.length===0});
}
