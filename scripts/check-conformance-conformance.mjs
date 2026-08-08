import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd();
const required=['src/conformance/index.mjs','src/conformance/fixture.mjs','src/conformance/matrix.mjs','src/conformance/isolation.mjs','src/conformance/fairness.mjs','src/conformance/provider.mjs','src/conformance/upgrade.mjs','src/conformance/portability.mjs','src/conformance/certification.mjs','src/conformance/lab.mjs'];
for(const rel of required) await readFile(path.join(root,rel));
const schemas=(await readdir(path.join(root,'schemas/conformance'))).filter(x=>x.endsWith('.json'));
if(schemas.length<10) throw new Error(`CONFORMANCE_SCHEMA_COUNT:${schemas.length}`);
for(const file of schemas){const schema=JSON.parse(await readFile(path.join(root,'schemas/conformance',file),'utf8'));if(schema.$schema!=='https://json-schema.org/draft/2020-12/schema'||!schema.$id||!schema.title)throw new Error(`CONFORMANCE_SCHEMA_INVALID:${file}`);}
const pkg=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
if(pkg.exports?.['./conformance']!=='./src/conformance/index.mjs') throw new Error('CONFORMANCE_EXPORT_MISSING');
const rootIndex=await readFile(path.join(root,'src/index.mjs'),'utf8');if(!rootIndex.includes('ConformanceOS'))throw new Error('CONFORMANCE_ROOT_EXPORT_MISSING');
console.log(`CONFORMANCE_CONFORMANCE_PASS schemas=${schemas.length}`);
