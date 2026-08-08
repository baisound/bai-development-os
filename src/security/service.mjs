import { deepFreeze } from './util.mjs';
import { evaluateEgressTarget } from './network.mjs';
import { assertNoSecretMaterial, redactSensitiveData, scanSensitiveData } from './dlp.mjs';
import { createSupplyChainManifest, verifySupplyChainManifest } from './supply-chain.mjs';
import { createPackageSbom, verifyPackageSbom } from './sbom.mjs';
import { createSandboxPolicy, authorizeSandboxAction } from './sandbox.mjs';
export class SecurityService {
  constructor({ root, egress_policy = null } = {}) { this.root = root; this.egressPolicy = egress_policy; }
  scan(value) { return scanSensitiveData(value); }
  redact(value) { return redactSensitiveData(value); }
  assertSafe(value, options) { return assertNoSecretMaterial(value, options); }
  evaluateEgress(input) { return evaluateEgressTarget({ ...(this.egressPolicy ?? {}), ...input }); }
  createManifest(files, options) { return createSupplyChainManifest(this.root, files, options); }
  verifyManifest(manifest, options) { return verifySupplyChainManifest(this.root, manifest, options); }
  createSbom(options) { return createPackageSbom(this.root, options); }
  verifySbom(sbom) { return verifyPackageSbom(sbom); }
  createSandboxPolicy(input) { return createSandboxPolicy(input); }
  authorizeSandboxAction(policy, input) { return authorizeSandboxAction(policy, input); }
  capabilities() { return deepFreeze(['PATH_SAFETY','SECRET_VAULT','SIGNING','JOURNAL','LEDGER','REPLAY','EGRESS','DLP','SUPPLY_CHAIN','SBOM','SANDBOX']); }
}
