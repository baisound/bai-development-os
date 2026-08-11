#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function checkRuntimeLockCandidate(value) {
  const failures=[];
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {status:'FAIL',failures:['lock object required']};
  if (value.lockfileVersion !== 3) failures.push('lockfileVersion must be 3');
  if (!value.packages || typeof value.packages !== 'object' || Array.isArray(value.packages)) failures.push('packages map required');
  const packages=value.packages ?? {};
  const root=packages[''];
  if (!root || root.name !== 'bai-knowledge-hub-runtime' || root.version !== '1.0.0') failures.push('runtime root package identity/version mismatch');
  if (root?.dependencies?.pg !== '8.13.1') failures.push('root pg dependency must be exact 8.13.1');
  const pg=packages['node_modules/pg'];
  if (!pg || pg.version !== '8.13.1') failures.push('resolved pg package must be 8.13.1');
  for (const [name,pkg] of Object.entries(packages)) {
    if (name === '') continue;
    if (!pkg || typeof pkg !== 'object') { failures.push(`${name}: package metadata invalid`); continue; }
    const resolved=pkg.resolved;
    if (typeof resolved !== 'string' || !resolved.startsWith('https://registry.npmjs.org/')) failures.push(`${name}: resolved source must be HTTPS registry.npmjs.org`);
    if (/(?:^|:)(?:git\+|git:|file:|link:|http:)/i.test(String(resolved ?? ''))) failures.push(`${name}: prohibited non-registry dependency source`);
    if (typeof pkg.integrity !== 'string' || !/^sha512-[A-Za-z0-9+/=]+$/.test(pkg.integrity)) failures.push(`${name}: sha512 integrity required`);
  }
  return failures.length?{status:'FAIL',failures}:{status:'PASS',packages:Object.keys(packages).length-1,pg_version:'8.13.1',registry:'https://registry.npmjs.org/'};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const file=process.argv[2];
  if(!file){console.error('usage: node scripts/check-knowledge-hub-runtime-lock-candidate.mjs <package-lock.json>');process.exit(2);}
  try{
    const result=checkRuntimeLockCandidate(JSON.parse(fs.readFileSync(file,'utf8')));
    console.log(JSON.stringify(result,null,2));
    if(result.status!=='PASS') process.exit(1);
  }catch(error){console.error(JSON.stringify({status:'FAIL',failures:[error.message]},null,2));process.exit(1);}
}
