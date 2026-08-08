import fs from 'node:fs'; import path from 'node:path';
const root=process.cwd();
const required=['src/security/index.mjs','schemas/security/secret-reference.schema.json','schemas/security/signed-envelope.schema.json','schemas/security/journal-manifest.schema.json','schemas/security/supply-chain-manifest.schema.json','schemas/security/security-ledger-record.schema.json','schemas/security/egress-decision.schema.json','schemas/security/dependency-risk-result.schema.json','schemas/security/sbom.schema.json','schemas/security/sandbox-policy.schema.json'];
for(const rel of required) if(!fs.existsSync(path.join(root,rel))) throw new Error(`SECURITY_CONFORMANCE_FAIL missing=${rel}`);
const schemas=required.filter(x=>x.endsWith('.json'));for(const rel of schemas){const s=JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));if(s.$schema!=='https://json-schema.org/draft/2020-12/schema')throw new Error(`SECURITY_CONFORMANCE_FAIL schema=${rel}`);}
const automationUtil=fs.readFileSync(path.join(root,'src/automation/util.mjs'),'utf8');if(!automationUtil.includes("../security/path.mjs"))throw new Error('SECURITY_CONFORMANCE_FAIL automation path primitives are not shared');
const integrationCred=fs.readFileSync(path.join(root,'src/integration/credentials.mjs'),'utf8');if(!integrationCred.includes("../security/dlp.mjs"))throw new Error('SECURITY_CONFORMANCE_FAIL integration credential DLP is not shared');
const monitoringStore=fs.readFileSync(path.join(root,'src/monitoring/store.mjs'),'utf8');if(!monitoringStore.includes('atomicWrite'))throw new Error('SECURITY_CONFORMANCE_FAIL monitoring persistence is not atomic');
console.log(`SECURITY_CONFORMANCE_PASS schemas=${schemas.length} shared_primitives=3`);
