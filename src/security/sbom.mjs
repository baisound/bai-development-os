import { readFile } from 'node:fs/promises';
import { SecurityError } from './errors.mjs';
import { resolveExistingInside } from './path.mjs';
import { deepFreeze, nowIso, sha256, stable } from './util.mjs';

function normalizeDeps(pkg = {}) {
  const groups = ['dependencies','devDependencies','optionalDependencies','peerDependencies'];
  const map = new Map();
  for (const group of groups) {
    for (const [name, version] of Object.entries(pkg[group] ?? {})) {
      const current = map.get(name) ?? { name, version: String(version), scopes: [] };
      if (!current.scopes.includes(group)) current.scopes.push(group);
      map.set(name, current);
    }
  }
  return [...map.values()].sort((a,b)=>a.name.localeCompare(b.name));
}

export async function createPackageSbom(root, { package_path = 'package.json', artifact_id = null, clock = () => new Date() } = {}) {
  const file = await resolveExistingInside(root, package_path);
  let pkg;
  try { pkg = JSON.parse(await readFile(file, 'utf8')); } catch { throw new SecurityError('SECURITY_SBOM_PACKAGE_INVALID'); }
  if (!pkg?.name || !pkg?.version) throw new SecurityError('SECURITY_SBOM_PACKAGE_INVALID');
  const components = normalizeDeps(pkg).map((d) => ({ type:'library', name:d.name, version:d.version, scopes:d.scopes }));
  const body = {
    sbom_version:'1.0.0',
    format:'BAI-SPDX-LITE',
    artifact_id:artifact_id ?? pkg.name,
    package:{ name:pkg.name, version:String(pkg.version), license:pkg.license ?? null },
    generated_at:nowIso(clock),
    components
  };
  return deepFreeze({ ...body, sbom_checksum:sha256(stable(body)) });
}

export function verifyPackageSbom(sbom) {
  if (!sbom || sbom.sbom_version !== '1.0.0' || !sbom.package?.name || !Array.isArray(sbom.components)) throw new SecurityError('SECURITY_SBOM_INVALID');
  const copy = structuredClone(sbom); delete copy.sbom_checksum;
  if (sbom.sbom_checksum !== sha256(stable(copy))) throw new SecurityError('SECURITY_SBOM_CHECKSUM_INVALID');
  return true;
}
