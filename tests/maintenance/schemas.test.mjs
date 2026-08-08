import test from 'node:test';import assert from 'node:assert/strict';import { readFile } from 'node:fs/promises';
const names=['maintenance-finding','maintenance-fsck-report','repair-plan','repair-execution','maintenance-checkpoint','quarantine-record','retention-plan'];
for(const name of names)test(`maintenance schema ${name}`,async()=>{const j=JSON.parse(await readFile(new URL(`../../schemas/maintenance/${name}.schema.json`,import.meta.url),'utf8'));assert.equal(j.$schema,'https://json-schema.org/draft/2020-12/schema');assert.ok(j.title);});
