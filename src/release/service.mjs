import { deepFreeze } from './util.mjs';
import { createReleaseManifest, signReleaseManifest } from './manifest.mjs';
import { createReleaseBundle, verifyReleaseBundle } from './bundle.mjs';
import { createUpgradePreview } from './planner.mjs';
import { installReleaseBundle, rollbackRelease, readConsumerReleaseState } from './installer.mjs';
import { evaluateCompatibility } from './compatibility.mjs';
import { evaluateCanary } from './canary.mjs';
import { createDiagnosticBundle } from './diagnostics.mjs';
import { createReleaseSigningCeremony, createInstallationAttestation } from './attestation.mjs';
import { createPortableComponentBundle } from './portable.mjs';
import { createRepositoryReleasePlan } from './repository.mjs';
export class ReleaseService {
  constructor({root,signer=null,migration_registry=null}={}){this.root=root;this.signer=signer;this.migrations=migration_registry;}
  createManifest(input){return createReleaseManifest(input);}
  signManifest(manifest,options){return signReleaseManifest(manifest,this.signer,options);}
  createBundle(manifest,options){return createReleaseBundle(this.root,manifest,options);}
  verifyBundle(bundle,options){return verifyReleaseBundle(bundle,options);}
  preview(input){return createUpgradePreview({...input,migration_registry:input.migration_registry??this.migrations});}
  install(bundle,options){return installReleaseBundle(this.root,bundle,{...options,migration_registry:options?.migration_registry??this.migrations});}
  rollback(checkpoint,options){return rollbackRelease(this.root,checkpoint,options);}
  state(){return readConsumerReleaseState(this.root);}
  compatibility(manifest,consumer){return evaluateCompatibility(manifest,consumer);}
  canary(input){return evaluateCanary(input);}
  diagnostics(input){return createDiagnosticBundle({...input,signer:input.signer??this.signer});}
  signingCeremony(input){return createReleaseSigningCeremony(input,this.signer);}
  installationAttestation(manifest,options){return createInstallationAttestation(this.root,manifest,{...options,signer:options?.signer??this.signer});}
  portableBundle(input){return createPortableComponentBundle({...input,signer:input.signer??this.signer});}
  repositoryPlan(input){return createRepositoryReleasePlan(input);}
  capabilities(){return deepFreeze(['SEMVER','RELEASE_MANIFEST','TRUST_ANCHOR','SIGNED_BUNDLE','COMPATIBILITY','MIGRATION','UPGRADE_PREVIEW','INSTALL','DOWNGRADE','ROLLBACK','OFFLINE_BUNDLE','CANARY','DIAGNOSTIC_BUNDLE','LOCK_MANIFEST','SIGNING_CEREMONY','INSTALLATION_ATTESTATION','PORTABLE_COMPONENT_BUNDLE','REPOSITORY_RELEASE_PLAN']);}
}
