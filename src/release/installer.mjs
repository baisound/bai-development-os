import { readFile } from 'node:fs/promises';
import { resolveExistingInside, secureAtomicWrite } from '../security/path.mjs';
import { prepareJournalTransaction, commitJournalTransaction } from '../security/journal.mjs';
import { getTrustAnchor } from './trust.mjs';
import { verifyReleaseBundle } from './bundle.mjs';
import { createUpgradePreview } from './planner.mjs';
import { createReleaseCheckpoint, restoreReleaseCheckpoint } from './checkpoint.mjs';
import { ReleaseError } from './errors.mjs';
import { deepFreeze, newId, nowIso } from './util.mjs';
import { withReleaseLock } from './lock.mjs';
const STATE='.bai-os/release-state.json';
export async function readConsumerReleaseState(root){try{return deepFreeze(JSON.parse(await readFile(await resolveExistingInside(root,STATE),'utf8')));}catch(e){if(e.code==='SECURITY_PATH_MISSING')return null;throw e;}}
export async function installReleaseBundle(root,bundle,{migration_registry=null,consumer_profile={},allow_downgrade=false,owner_authorization_ref=null,clock=()=>new Date()}={}){
  return withReleaseLock(root,'install',async()=>{
  const trust=await getTrustAnchor(root,bundle.manifest.key_id,{allow_retired:true});verifyReleaseBundle(bundle,{trust_anchor:trust}); const current=await readConsumerReleaseState(root); const effectiveConsumer={...consumer_profile,schemas:current?.schemas??consumer_profile.schemas,security_profile:current?.security_profile??consumer_profile.security_profile}; const preview=createUpgradePreview({current_state:current,target_manifest:bundle.manifest,consumer_profile:effectiveConsumer,allow_downgrade,migration_registry,clock}); if(!preview.mutation_permitted)throw new ReleaseError('RELEASE_PREVIEW_BLOCKED','upgrade preview blocked',preview);
  if(preview.direction==='DOWNGRADE'&&!owner_authorization_ref)throw new ReleaseError('RELEASE_OWNER_AUTHORIZATION_REQUIRED');
  let migrated=current??{schemas:{}}; if(migration_registry)migrated=await migration_registry.apply(bundle.manifest,migrated);
  const paths=[...bundle.manifest.artifacts.map(a=>a.path),STATE];const checkpoint=await createReleaseCheckpoint(root,paths,{current_state:current,clock});
  const operations=bundle.files.map(f=>({path:f.path,data:Buffer.from(f.data,'base64'),mode:'REPLACE'})); const nextState={consumer_release_state_version:'1.0.0',os_version:bundle.manifest.os_version,channel:bundle.manifest.channel,installed_at:nowIso(clock),manifest_checksum:bundle.manifest.manifest_checksum,key_id:bundle.manifest.key_id,schemas:{...(migrated.schemas??{}),...(bundle.manifest.schemas??{})},security_profile:structuredClone(bundle.manifest.security_profile??{}),rollback_checkpoint_id:checkpoint.checkpoint_id,previous_os_version:current?.os_version??null}; operations.push({path:STATE,data:Buffer.from(`${JSON.stringify(nextState,null,2)}\n`),mode:'REPLACE'});
  const tx=await prepareJournalTransaction(root,{tx_id:newId('release-install'),operations},{clock}); await commitJournalTransaction(root,tx.tx_id,{clock}); return deepFreeze({result:'INSTALLED',preview,checkpoint,next_state:nextState,tx_id:tx.tx_id});
  });
}
export async function rollbackRelease(root,checkpoint,{owner_authorization_ref}={}){return withReleaseLock(root,'install',async()=>{if(!owner_authorization_ref)throw new ReleaseError('RELEASE_OWNER_AUTHORIZATION_REQUIRED');await restoreReleaseCheckpoint(root,checkpoint);return deepFreeze({result:'ROLLED_BACK',checkpoint_id:checkpoint.checkpoint_id,state:await readConsumerReleaseState(root)});});}
