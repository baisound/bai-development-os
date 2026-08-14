import { open, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { assertNoSymlinkPath, resolveExistingInside, resolveWritableInside, secureAtomicWrite } from '../security/path.mjs';
import { assertNoSecretMaterial } from '../security/dlp.mjs';
import { deepFreeze, sha256, stableStringify, verifyRecordChecksum } from './contracts.mjs';
import { DesignGovernanceError } from './errors.mjs';

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
function id(value, name) {
  if (typeof value !== 'string' || !SAFE_ID.test(value)) throw new DesignGovernanceError('DESIGN_REPOSITORY_ID_INVALID', name);
  return value;
}
function revision(value) {
  if (!Number.isSafeInteger(value) || value < 1) throw new DesignGovernanceError('DESIGN_REPOSITORY_REVISION_INVALID');
  return value;
}
function base(intakeId, rev) { return `.bai-os/design-governance/intakes/${id(intakeId, 'intake_id')}/revisions/${revision(rev)}`; }
function jsonBytes(value) { return Buffer.from(`${JSON.stringify(value, null, 2)}\n`, 'utf8'); }
async function atomicWriteVerified(root, relative, bytes) {
  try { return await secureAtomicWrite(root, relative, bytes); }
  catch (error) {
    // Windows does not support fsync on a directory handle. The shared writer
    // may have completed its atomic rename before that durability call fails.
    if (process.platform === 'win32' && error?.code === 'EPERM') {
      try {
        const committed = await readFile(await resolveExistingInside(root, relative));
        if (sha256(committed) === sha256(bytes)) return relative;
      } catch {}
    }
    throw error;
  }
}
function normalizeArtifacts(artifacts) {
  if (!artifacts || typeof artifacts !== 'object' || Array.isArray(artifacts)) throw new DesignGovernanceError('DESIGN_REPOSITORY_ARTIFACTS_INVALID');
  const rows = Object.entries(artifacts).map(([name, value]) => {
    if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(name) || name.includes('raw')) throw new DesignGovernanceError('DESIGN_REPOSITORY_ARTIFACT_NAME_INVALID', name);
    verifyRecordChecksum(value);
    try { assertNoSecretMaterial(value); }
    catch (error) { throw new DesignGovernanceError('DESIGN_REPOSITORY_DLP_BLOCKED', name, { cause: error.code, findings: error.details?.findings ?? [] }); }
    return { name, value: structuredClone(value), bytes: jsonBytes(value) };
  }).sort((a, b) => a.name.localeCompare(b.name));
  if (!rows.length || new Set(rows.map((x) => x.name)).size !== rows.length) throw new DesignGovernanceError('DESIGN_REPOSITORY_ARTIFACTS_INVALID');
  return rows;
}

async function readJsonInside(root, relative, missingCode = 'DESIGN_REPOSITORY_REVISION_NOT_FINALIZED') {
  try { return JSON.parse(await readFile(await resolveExistingInside(root, relative), 'utf8')); }
  catch (error) {
    if (error?.code === 'SECURITY_PATH_MISSING') throw new DesignGovernanceError(missingCode, relative);
    if (error instanceof SyntaxError) throw new DesignGovernanceError('DESIGN_REPOSITORY_CORRUPT_JSON', relative);
    if (error?.code?.startsWith('SECURITY_')) throw new DesignGovernanceError('DESIGN_REPOSITORY_PATH_ESCAPE', relative);
    throw error;
  }
}

export class DesignGovernanceRepository {
  constructor({ root, clock = () => new Date(), fault = null } = {}) {
    if (typeof root !== 'string' || !path.isAbsolute(root)) throw new DesignGovernanceError('DESIGN_REPOSITORY_ROOT_INVALID');
    this.root = root; this.clock = clock; this.fault = fault;
  }

  async #lease(intakeId) {
    const rel = `.bai-os/design-governance/intakes/${id(intakeId, 'intake_id')}/writer.lease`;
    await assertNoSymlinkPath(this.root, rel).catch((error) => { throw new DesignGovernanceError('DESIGN_REPOSITORY_PATH_ESCAPE', rel, { cause: error.code }); });
    const file = await resolveWritableInside(this.root, rel).catch((error) => { throw new DesignGovernanceError('DESIGN_REPOSITORY_PATH_ESCAPE', rel, { cause: error.code }); });
    let handle;
    try { handle = await open(file, 'wx', 0o600); }
    catch (error) { if (error.code === 'EEXIST') throw new DesignGovernanceError('DESIGN_REPOSITORY_LEASE_CONFLICT', intakeId); throw error; }
    await handle.writeFile(`${JSON.stringify({ intake_id: intakeId, acquired_at: this.clock().toISOString(), pid: process.pid })}\n`);
    await handle.sync(); await handle.close();
    return async () => rm(file, { force: true });
  }

  async readRevision(intakeId, rev) {
    const prefix = base(intakeId, rev);
    const manifest = await readJsonInside(this.root, `${prefix}/final-manifest.json`);
    if (manifest.manifest_version !== '1.0.0' || manifest.intake_id !== intakeId || manifest.revision !== rev || manifest.canonical_authority !== false) throw new DesignGovernanceError('DESIGN_REPOSITORY_MANIFEST_INVALID');
    const copy = structuredClone(manifest); const expected = copy.manifest_checksum; delete copy.manifest_checksum;
    if (sha256(copy) !== expected) throw new DesignGovernanceError('DESIGN_REPOSITORY_MANIFEST_CHECKSUM_MISMATCH');
    const artifacts = {};
    for (const entry of manifest.artifacts) {
      const value = await readJsonInside(this.root, `${prefix}/${entry.name}.json`, 'DESIGN_REPOSITORY_ARTIFACT_MISSING');
      const bytes = jsonBytes(value);
      if (sha256(bytes) !== entry.file_checksum || value.content_checksum !== entry.content_checksum) throw new DesignGovernanceError('DESIGN_REPOSITORY_ARTIFACT_CHECKSUM_MISMATCH', entry.name);
      verifyRecordChecksum(value); artifacts[entry.name] = value;
    }
    return deepFreeze({ manifest, artifacts });
  }

  async persistRevision({ intake_id, revision: rev, idempotency_key, artifacts, supersedes_revision = null } = {}) {
    id(intake_id, 'intake_id'); revision(rev);
    if (!/^sha256:[a-f0-9]{64}$/.test(idempotency_key ?? '')) throw new DesignGovernanceError('DESIGN_REPOSITORY_IDEMPOTENCY_KEY_INVALID');
    const rows = normalizeArtifacts(artifacts);
    const contentSetChecksum = sha256(rows.map((x) => ({ name: x.name, content_checksum: x.value.content_checksum })));
    try {
      const existing = await this.readRevision(intake_id, rev);
      if (existing.manifest.idempotency_key === idempotency_key && existing.manifest.content_set_checksum === contentSetChecksum) return deepFreeze({ result: 'DESIGN_REVISION_ALREADY_FINALIZED', ...existing });
      if (existing.manifest.idempotency_key === idempotency_key) throw new DesignGovernanceError('INTAKE_IDEMPOTENCY_CONFLICT');
      throw new DesignGovernanceError('DESIGN_REPOSITORY_REVISION_IMMUTABLE');
    } catch (error) {
      if (!['DESIGN_REPOSITORY_REVISION_NOT_FINALIZED', 'DESIGN_REPOSITORY_ARTIFACT_MISSING'].includes(error.code)) throw error;
    }
    const release = await this.#lease(intake_id);
    const prefix = base(intake_id, rev);
    try {
      for (const row of rows) await atomicWriteVerified(this.root, `${prefix}/${row.name}.json`, row.bytes).catch((error) => { throw new DesignGovernanceError('DESIGN_REPOSITORY_WRITE_FAILED', row.name, { cause: error.code }); });
      if (this.fault === 'BEFORE_FINAL_MANIFEST') throw new DesignGovernanceError('DESIGN_REPOSITORY_FAULT_INJECTED');
      const body = {
        manifest_version: '1.0.0', intake_id, revision: rev, supersedes_revision,
        finalized_at: this.clock().toISOString(), idempotency_key,
        content_set_checksum: contentSetChecksum, canonical_authority: false,
        artifacts: rows.map((row) => ({ name: row.name, content_checksum: row.value.content_checksum, file_checksum: sha256(row.bytes), size_bytes: row.bytes.length })),
      };
      const manifest = { ...body, manifest_checksum: sha256(body) };
      await atomicWriteVerified(this.root, `${prefix}/final-manifest.json`, jsonBytes(manifest)).catch((error) => { throw new DesignGovernanceError('DESIGN_REPOSITORY_FINALIZE_FAILED', undefined, { cause: error.code }); });
      const verified = await this.readRevision(intake_id, rev);
      return deepFreeze({ result: 'DESIGN_REVISION_FINALIZED', ...verified });
    } finally { await release(); }
  }

  async verifyRevision(intakeId, rev) {
    const verified = await this.readRevision(intakeId, rev);
    return deepFreeze({ result: 'DESIGN_REVISION_VERIFIED', intake_id: intakeId, revision: rev, artifact_count: Object.keys(verified.artifacts).length, manifest_checksum: verified.manifest.manifest_checksum });
  }
}
