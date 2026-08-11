#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const profiles=[
 ['2gb','deploy/knowledge-hub/postgres/postgresql.tuned-2gb.conf'],
 ['4gb','deploy/knowledge-hub/postgres/postgresql.tuned-4gb.conf'],
 ['8gb','deploy/knowledge-hub/postgres/postgresql.tuned-8gb.conf']
];
const failures=[];
function setting(text,name){const m=text.match(new RegExp(`^${name}\\s*=\\s*([^#\\n]+)`,`m`));return m?.[1]?.trim().replace(/^['"]|['"]$/g,'');}
const limits={
 '2gb':{max_connections:40,shared_buffers:'256MB',work_mem:'4MB'},
 '4gb':{max_connections:60,shared_buffers:'768MB',work_mem:'8MB'},
 '8gb':{max_connections:64,shared_buffers:'1536MB',work_mem:'8MB'}
};
for(const [id,rel] of profiles){
 const text=fs.readFileSync(path.join(root,rel),'utf8');const expected=limits[id];
 for(const [name,value] of Object.entries({fsync:'on',synchronous_commit:'on',full_page_writes:'on',autovacuum:'on',password_encryption:'scram-sha-256',...expected})){
   const actual=setting(text,name);if(String(actual)!==String(value))failures.push(`${id}: ${name}=${actual} expected=${value}`);
 }
 if(Number(setting(text,'max_connections'))>64)failures.push(`${id}: max_connections exceeds bounded single-VPS floor`);
 if(setting(text,'listen_addresses')!=='*')failures.push(`${id}: listen_addresses must support private Compose network`);
 if(/random_page_cost\s*=|effective_io_concurrency\s*=/.test(text))failures.push(`${id}: storage-specific planner/I/O settings must remain Evidence-gated`);
}
const compose=fs.readFileSync(path.join(root,'deploy/knowledge-hub/compose.yaml'),'utf8');
for(const required of ['POSTGRES_HOST_AUTH_METHOD: "scram-sha-256"','POSTGRES_INITDB_ARGS: "--data-checksums"','config_file=/etc/postgresql/postgresql.conf','POSTGRES_CONFIG_FILE','POSTGRES_SHM_SIZE']) if(!compose.includes(required))failures.push(`compose: missing ${required}`);
if(/5432:5432/.test(compose))failures.push('compose: PostgreSQL must not be host-published');
if(failures.length){console.error(JSON.stringify({status:'FAIL',failures},null,2));process.exit(1);}
console.log(JSON.stringify({status:'PASS',profiles:['2gb','4gb','8gb'],default_profile:'4gb',scale_up_profile:'8gb',durability:'PRESERVED',public_activation:'NOT_AUTHORIZED'},null,2));
