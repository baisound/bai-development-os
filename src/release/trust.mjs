import { readFile } from 'node:fs/promises';
import { createPublicKey } from 'node:crypto';
import { resolveExistingInside, secureAtomicWrite } from '../security/path.mjs';
import { signEnvelopeWithProvider, verifySignedEnvelope } from '../security/signing.mjs';
import { ReleaseError } from './errors.mjs';
import { deepFreeze, nowIso, safeId, sha256 } from './util.mjs';
import { withReleaseLock } from './lock.mjs';
const REL='.bai-os/release/trust-anchors.json';
async function readSet(root){ try{return JSON.parse(await readFile(await resolveExistingInside(root,REL),'utf8'));}catch(e){if(e.code==='SECURITY_PATH_MISSING')return {trust_anchor_set_version:'1.0.0',revision:0,anchors:[]};throw e;} }
function normalizePem(pem){ try{return createPublicKey(pem).export({type:'spki',format:'pem'}).toString();}catch{throw new ReleaseError('RELEASE_TRUST_KEY_INVALID');} }
export async function bootstrapTrustAnchor(root,{key_id,public_key_pem,owner_authorization_ref,clock=()=>new Date()}={}){
  return withReleaseLock(root,'trust-anchor',async()=>{
    const current=await readSet(root); if(current.anchors.some(a=>a.status==='TRUSTED')) throw new ReleaseError('RELEASE_TRUST_ALREADY_BOOTSTRAPPED');
    if(!owner_authorization_ref) throw new ReleaseError('RELEASE_OWNER_AUTHORIZATION_REQUIRED');
    const pem=normalizePem(public_key_pem); const set={trust_anchor_set_version:'1.0.0',revision:current.revision+1,updated_at:nowIso(clock),anchors:[{key_id:safeId(key_id,'key_id'),status:'TRUSTED',public_key_pem:pem,fingerprint:sha256(pem),trusted_at:nowIso(clock),owner_authorization_ref}]};
    await secureAtomicWrite(root,REL,Buffer.from(`${JSON.stringify(set,null,2)}\n`)); return deepFreeze(set);
  });
}
export async function createTrustAnchorRotation({current_key_id,new_key_id,new_public_key_pem,effective_at=null,reason='rotation'}={},signer,{clock=()=>new Date()}={}){
  const statement={trust_anchor_rotation_version:'1.0.0',current_key_id:safeId(current_key_id,'current_key_id'),new_key_id:safeId(new_key_id,'new_key_id'),new_public_key_pem:normalizePem(new_public_key_pem),effective_at:effective_at??nowIso(clock),reason};
  return signEnvelopeWithProvider(statement,signer,{clock});
}
export async function applyTrustAnchorRotation(root,rotation,{owner_authorization_ref,clock=()=>new Date()}={}){
  return withReleaseLock(root,'trust-anchor',async()=>{
    if(!owner_authorization_ref) throw new ReleaseError('RELEASE_OWNER_AUTHORIZATION_REQUIRED');
    const set=await readSet(root); const current=set.anchors.find(a=>a.key_id===rotation.current_key_id&&a.status==='TRUSTED'); if(!current) throw new ReleaseError('RELEASE_TRUST_CURRENT_KEY_NOT_TRUSTED');
    verifySignedEnvelope(rotation,{public_key:current.public_key_pem,expected_key_id:current.key_id});
    const now=clock(); const nowDate=now instanceof Date?now:new Date(now); if(new Date(rotation.effective_at).getTime()>nowDate.getTime()) throw new ReleaseError('RELEASE_TRUST_ROTATION_NOT_EFFECTIVE');
    const next=structuredClone(set); const retiredAt=nowDate.toISOString(); for(const a of next.anchors) if(a.status==='TRUSTED'){ a.status='RETIRED'; a.retired_at=retiredAt; }
    const pem=normalizePem(rotation.new_public_key_pem); next.anchors.push({key_id:rotation.new_key_id,status:'TRUSTED',public_key_pem:pem,fingerprint:sha256(pem),trusted_at:retiredAt,owner_authorization_ref,rotated_from:rotation.current_key_id}); next.revision+=1; next.updated_at=retiredAt;
    await secureAtomicWrite(root,REL,Buffer.from(`${JSON.stringify(next,null,2)}\n`)); return deepFreeze(next);
  });
}
export async function getTrustAnchor(root,key_id,{allow_retired=true}={}){ const set=await readSet(root); const a=set.anchors.find(x=>x.key_id===key_id&&(allow_retired||x.status==='TRUSTED')); if(!a) throw new ReleaseError('RELEASE_TRUST_ANCHOR_NOT_FOUND'); return deepFreeze(a); }
export async function readTrustAnchorSet(root){ return deepFreeze(await readSet(root)); }
