import { readFile, stat } from 'node:fs/promises';
import { resolveExistingInside } from '../security/path.mjs';
import { signEnvelopeWithProvider, verifySignedEnvelope } from '../security/signing.mjs';
import { ReleaseError } from './errors.mjs';
import { deepFreeze, nowIso, sha256 } from './util.mjs';
export async function createReleaseSigningCeremony({manifest,signer_identity,approval_evidence,key_version,artifact_set=null,clock=()=>new Date()}={},signer){
  if(!manifest||!signer_identity||!approval_evidence||!key_version) throw new ReleaseError('RELEASE_SIGNING_CEREMONY_INPUT_INVALID');
  const body={release_signing_ceremony_version:'1.0.0',os_version:manifest.os_version,manifest_checksum:manifest.manifest_checksum,signer_identity,key_id:signer.key_id,key_version,approval_evidence,artifact_set:artifact_set??manifest.artifacts.map(a=>({path:a.path,checksum:a.checksum})),ceremony_at:nowIso(clock)};
  return deepFreeze(await signEnvelopeWithProvider(body,signer,{clock}));
}
export function verifyReleaseSigningCeremony(record,{public_key,expected_key_id}){verifySignedEnvelope(record,{public_key,expected_key_id});return true;}
export async function createInstallationAttestation(root,manifest,{project_id,clock=()=>new Date(),signer=null}={}){const files=[];for(const a of manifest.artifacts){const p=await resolveExistingInside(root,a.path);const s=await stat(p);const bytes=await readFile(p);files.push({path:a.path,size_bytes:s.size,checksum:sha256(bytes)});}const body={installation_attestation_version:'1.0.0',project_id,os_version:manifest.os_version,manifest_checksum:manifest.manifest_checksum,verified_at:nowIso(clock),files};return deepFreeze(signer?await signEnvelopeWithProvider(body,signer,{clock}):body);}
export function verifyInstallationAttestation(attestation,manifest,{public_key=null,expected_key_id=null,require_signature=false}={}){if(attestation.os_version!==manifest.os_version||attestation.manifest_checksum!==manifest.manifest_checksum)throw new ReleaseError('RELEASE_ATTESTATION_MANIFEST_MISMATCH');const by=new Map(attestation.files.map(x=>[x.path,x]));for(const a of manifest.artifacts){const f=by.get(a.path);if(!f||f.checksum!==a.checksum||f.size_bytes!==a.size_bytes)throw new ReleaseError('RELEASE_ATTESTATION_ARTIFACT_MISMATCH',a.path);}if(require_signature){if(!attestation.signature)throw new ReleaseError('RELEASE_SIGNATURE_REQUIRED');verifySignedEnvelope(attestation,{public_key,expected_key_id});}return true;}
