import {
  createHash,
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  randomUUID,
  sign,
  verify,
} from 'node:crypto';
import { access, chmod, mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

const roles = Object.freeze([
  Object.freeze({ role: 'owner-signer', key_id: 'BAI-VOICE-TASK001-OWNER' }),
  Object.freeze({ role: 'independent-verifier', key_id: 'BAI-VOICE-TASK001-SECURITY-VERIFIER' }),
  Object.freeze({ role: 'canonical-store-binding', key_id: 'BAI-VOICE-TASK001-CANONICAL-STORE' }),
  Object.freeze({ role: 'snapshot-coordinator', key_id: 'BAI-VOICE-TASK001-SNAPSHOT-COORDINATOR' }),
]);

function argument(name) {
  const index = process.argv.indexOf(name);
  if (index < 0 || !process.argv[index + 1]) throw new Error(`${name} is required`);
  return path.resolve(process.argv[index + 1]);
}

async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

const privateRoot = argument('--private-dir');
const publicRoot = argument('--public-dir');
if (privateRoot === publicRoot) throw new Error('private and public directories must differ');

const targets = roles.flatMap(({ role }) => [
  path.join(privateRoot, role, 'key.ed25519.pkcs8.pem'),
  path.join(publicRoot, role, 'key.ed25519.spki.pem'),
]);
const manifestPath = path.join(publicRoot, 'trust-manifest.json');
targets.push(manifestPath);

for (const target of targets) {
  if (await exists(target)) throw new Error(`refusing to overwrite existing target: ${target}`);
}

for (const { role } of roles) {
  await mkdir(path.join(privateRoot, role), { recursive: true });
  await mkdir(path.join(publicRoot, role), { recursive: true });
}

const nonce = `${process.pid}-${randomUUID()}`;
const staged = [];
const manifestKeys = [];

try {
  for (const { role, key_id } of roles) {
    const { privateKey, publicKey } = generateKeyPairSync('ed25519');
    const privatePem = privateKey.export({ type: 'pkcs8', format: 'pem' });
    const publicPem = publicKey.export({ type: 'spki', format: 'pem' });
    const challenge = Buffer.from(`BAI-VOICE-APP:TASK-001:${role}:KEY-SELF-TEST`, 'utf8');
    const signature = sign(null, challenge, createPrivateKey(privatePem));
    if (!verify(null, challenge, createPublicKey(publicPem), signature)) throw new Error(`self-test failed: ${role}`);

    const privatePath = path.join(privateRoot, role, 'key.ed25519.pkcs8.pem');
    const publicPath = path.join(publicRoot, role, 'key.ed25519.spki.pem');
    const privateTemporary = `${privatePath}.tmp-${nonce}`;
    const publicTemporary = `${publicPath}.tmp-${nonce}`;
    await writeFile(privateTemporary, privatePem, { flag: 'wx', mode: 0o600 });
    await writeFile(publicTemporary, publicPem, { flag: 'wx', mode: 0o644 });
    staged.push({ temporary: privateTemporary, final: privatePath, private: true });
    staged.push({ temporary: publicTemporary, final: publicPath, private: false });
    manifestKeys.push({
      role,
      key_id,
      algorithm: 'Ed25519',
      private_path: privatePath,
      public_path: publicPath,
      public_spki_sha256: `sha256:${createHash('sha256').update(publicKey.export({ type: 'spki', format: 'der' })).digest('hex')}`,
    });
  }

  const manifest = {
    manifest_schema_version: '1.0.0',
    project_id: 'bai-voice-app',
    task_id: 'TASK-001',
    purpose: 'TASK-021_DESIGN_ONLY_CANONICAL_CLOSURE',
    created_at: new Date().toISOString(),
    keys: manifestKeys,
  };
  const manifestTemporary = `${manifestPath}.tmp-${nonce}`;
  await writeFile(manifestTemporary, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx', mode: 0o644 });
  staged.push({ temporary: manifestTemporary, final: manifestPath, private: false });

  for (const file of staged) await rename(file.temporary, file.final);
  for (const file of staged.filter((row) => row.private)) await chmod(file.final, 0o600);
} catch (error) {
  for (const file of staged) {
    if (await exists(file.temporary)) await unlink(file.temporary).catch(() => {});
  }
  throw error;
}

for (const key of manifestKeys) {
  const privateKey = createPrivateKey(await readFile(key.private_path));
  const publicKey = createPublicKey(await readFile(key.public_path));
  const challenge = Buffer.from(`BAI-VOICE-APP:TASK-001:${key.role}:POST-WRITE-SELF-TEST`, 'utf8');
  if (!verify(null, challenge, publicKey, sign(null, challenge, privateKey))) throw new Error(`post-write self-test failed: ${key.role}`);
  process.stdout.write(`CREATED ${key.role} ${key.key_id} ${key.public_spki_sha256}\n`);
}
process.stdout.write(`PUBLIC_MANIFEST ${manifestPath}\n`);
