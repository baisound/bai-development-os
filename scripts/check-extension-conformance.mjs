import { readFile } from 'node:fs/promises';
import { ExtensionService, ExtensionRegistry, CapabilityBroker, createExtensionManifest, createDomainPack, evaluateDomainArtifact, createExtensionHook, runExtensionConformance, createReferenceDomainCatalog, saveExtensionRegistrySnapshot, loadExtensionRegistrySnapshot, createContractAssistedAdapterPlan } from '../src/extension/index.mjs';
const schemas=['extension-manifest','extension-registry','domain-pack','extension-invocation','extension-result','artifact-evaluation','extension-hook','extension-conformance-report','extension-provider-contract','adapter-plan'];
for(const name of schemas){const p=`schemas/extension/${name}.schema.json`;const j=JSON.parse(await readFile(p,'utf8'));if(j?.$schema!=='https://json-schema.org/draft/2020-12/schema'||!j?.title)throw new Error(`EXTENSION_SCHEMA_INVALID:${name}`);}
for(const x of [ExtensionService,ExtensionRegistry,CapabilityBroker,createExtensionManifest,createDomainPack,evaluateDomainArtifact,createExtensionHook,runExtensionConformance,createReferenceDomainCatalog,saveExtensionRegistrySnapshot,loadExtensionRegistrySnapshot,createContractAssistedAdapterPlan])if(!x)throw new Error('EXTENSION_EXPORT_MISSING');
const domains=createReferenceDomainCatalog().map(x=>x.domains[0]);
for(const d of ['VIDEO','AUDIO','BGM_SE','STREAMING','UNITY','WEB','DESKTOP','AUTOMATION'])if(!domains.includes(d))throw new Error(`EXTENSION_REFERENCE_DOMAIN_MISSING:${d}`);
console.log(`EXTENSION_CONFORMANCE_PASS schemas=${schemas.length} reference_domains=${domains.length} shared_contracts=12`);
