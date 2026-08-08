import { generateKeyPairSync } from 'node:crypto';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createEd25519SigningProvider } from '../../src/security/signing.mjs';
import { sha256 } from '../../src/security/util.mjs';
export async function tempRoot(prefix='bai-release-'){const root=await mkdtemp(path.join(os.tmpdir(),prefix));return {root,cleanup:()=>rm(root,{recursive:true,force:true})};}
export function keys(key_id='release-key-1'){const {privateKey,publicKey}=generateKeyPairSync('ed25519');const private_key=privateKey.export({type:'pkcs8',format:'pem'}).toString();const public_key=publicKey.export({type:'spki',format:'pem'}).toString();return {private_key,public_key,key_id,provider:createEd25519SigningProvider({private_key,public_key,key_id})};}
export async function addFile(root,rel,content){const file=path.join(root,...rel.split('/'));await mkdir(path.dirname(file),{recursive:true});const b=Buffer.from(content);await writeFile(file,b);return {path:rel,checksum:sha256(b),size_bytes:b.length};}
export const fixedClock=()=>new Date('2026-08-08T07:00:00.000Z');
