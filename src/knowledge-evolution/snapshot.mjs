import { lstat, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { parseZip } from './zip.mjs';
import { KnowledgeEvolutionError } from './errors.mjs';
import { isSecretBearingPath, scanTextForSecrets } from './sanitizer.mjs';
import { safeArchivePath, sha256 } from './util.mjs';

const TEXT_EXT = new Set(['.md', '.txt', '.json', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf', '.py', '.mjs', '.js', '.ts', '.tsx', '.jsx', '.ps1', '.sh', '.bat']);
const IGNORE_PARTS = new Set(['node_modules', '.venv', 'venv', '__pycache__', '.pytest_cache', '.mypy_cache', '.ruff_cache']);

function suffixMatch(entries, suffix) { return entries.find(e => e.name === suffix || e.name.endsWith('/' + suffix)); }
function architectureFromEntries(entries) {
  const matches = entries.map(e => /BAI_Development_OS_Architecture_Ver([0-9.]+)\.md$/i.exec(e.name)).filter(Boolean).map(m => m[1]);
  if (!matches.length) return null;
  return matches.sort((a,b)=>a.localeCompare(b, undefined, { numeric:true })).at(-1);
}
function projectIdFromObject(obj) {
  return obj?.project_id ?? obj?.id ?? obj?.project?.project_id ?? obj?.project?.id ?? null;
}
function taskFromProjectMarkdown(text) {
  const m = text.match(/Active Task:\s*`?([A-Za-z0-9._:-]+)`?/i) ?? text.match(/Active TASK\s*[:：]\s*`?([A-Za-z0-9._:-]+)`?/i);
  return m?.[1] ?? null;
}
function productVersionFromProjectMarkdown(text) {
  const m = text.match(/(?:Package|Version)\s*:\s*`?v?([0-9]+\.[0-9]+\.[0-9]+[^`\s]*)`?/i);
  return m?.[1] ?? null;
}
function parseJsonSafe(text) { try { return JSON.parse(text); } catch { return null; } }

async function openDirectory(root) {
  const entries = [];
  async function walk(abs, rel='') {
    for (const dirent of await readdir(abs, { withFileTypes: true })) {
      if (IGNORE_PARTS.has(dirent.name)) continue;
      const childRel = safeArchivePath(rel ? `${rel}/${dirent.name}` : dirent.name);
      const childAbs = path.join(abs, dirent.name);
      const st = await lstat(childAbs);
      if (st.isSymbolicLink()) { entries.push({ name: childRel, is_directory:false, is_symlink:true, uncompressed_size:0, source_path:childAbs }); continue; }
      if (st.isDirectory()) { entries.push({ name: childRel+'/', is_directory:true, is_symlink:false, uncompressed_size:0, source_path:childAbs }); await walk(childAbs, childRel); }
      else if (st.isFile()) entries.push({ name: childRel, is_directory:false, is_symlink:false, uncompressed_size:st.size, source_path:childAbs });
    }
  }
  await walk(root);
  return { kind:'directory', entries, readEntry: async entry => readFile(entry.source_path), source_sha256:null };
}
async function openZip(file) {
  const buf = await readFile(file);
  const zip = parseZip(buf);
  return { kind:'zip', entries:zip.entries, readEntry: async entry => zip.readEntry(entry), source_sha256:sha256(buf) };
}
async function openSingleFile(file) {
  const st = await lstat(file); const name=safeArchivePath(path.basename(file));
  return { kind:'file', entries:[{name,is_directory:false,is_symlink:false,uncompressed_size:st.size,source_path:file}], readEntry: async()=>readFile(file), source_sha256:sha256(await readFile(file)) };
}
async function openSource(sourcePath) {
  const st = await lstat(sourcePath);
  if (st.isDirectory()) return openDirectory(sourcePath);
  if (st.isFile() && sourcePath.toLowerCase().endsWith('.zip')) return openZip(sourcePath);
  if (st.isFile()) return openSingleFile(sourcePath);
  throw new KnowledgeEvolutionError('KNOWLEDGE_SNAPSHOT_SOURCE_UNSUPPORTED');
}

export async function inspectKnowledgeSnapshot(sourcePath, { maxTextScanBytes = 25 * 1024 * 1024, maxSingleTextBytes = 1024 * 1024 } = {}) {
  const source = await openSource(sourcePath);
  const files = source.entries.filter(e => !e.is_directory);
  if (files.some(e=>e.is_symlink)) throw new KnowledgeEvolutionError('KNOWLEDGE_SNAPSHOT_SYMLINK_UNSUPPORTED');
  const issues = [];
  let scanned = 0;
  for (const entry of files) {
    if (isSecretBearingPath(entry.name)) issues.push({ severity:'BLOCK', rule_id:'SECRET_BEARING_PATH', path:entry.name });
    const ext = path.extname(entry.name).toLowerCase();
    if (!TEXT_EXT.has(ext) || entry.uncompressed_size > maxSingleTextBytes || scanned + entry.uncompressed_size > maxTextScanBytes) continue;
    const text = (await source.readEntry(entry)).toString('utf8'); scanned += Buffer.byteLength(text);
    for (const hit of scanTextForSecrets(text)) issues.push({ severity:'BLOCK', rule_id:hit.rule_id, path:entry.name, line:hit.line });
  }

  let manifest = null;
  const manifestEntry = suffixMatch(files, 'snapshot-manifest.json');
  if (manifestEntry) manifest = parseJsonSafe((await source.readEntry(manifestEntry)).toString('utf8'));

  let projectManifest = null;
  const projectEntry = suffixMatch(files, '.bai-os/project.json');
  if (projectEntry) projectManifest = parseJsonSafe((await source.readEntry(projectEntry)).toString('utf8'));
  let projectMdText = '';
  const projectPrefix = projectEntry ? projectEntry.name.slice(0, -'.bai-os/project.json'.length) : '';
  const projectMd = (projectPrefix ? files.find(e=>e.name === projectPrefix + 'PROJECT.md') : null) ?? files.find(e=>/(^|\/)PROJECT\.md$/i.test(e.name) && !e.name.startsWith('architecture/'));
  if (projectMd && projectMd.uncompressed_size <= maxSingleTextBytes) projectMdText=(await source.readEntry(projectMd)).toString('utf8');

  let osPackage = null;
  for (const entry of files.filter(e=>/(^|\/)package\.json$/.test(e.name)).slice(0,50)) {
    if (entry.uncompressed_size > maxSingleTextBytes) continue;
    const obj=parseJsonSafe((await source.readEntry(entry)).toString('utf8'));
    if (obj?.name === 'bai-development-os') { osPackage=obj; break; }
  }

  const architecture = manifest?.development_os?.architecture ?? architectureFromEntries(files);
  const projectId = manifest?.consumer?.project_id ?? projectIdFromObject(projectManifest) ?? (projectMdText.match(/Product ID\s*\n+\s*`([^`]+)`/i)?.[1] ?? null);
  const consumerVersion = manifest?.consumer?.version ?? productVersionFromProjectMarkdown(projectMdText);
  const taskId = manifest?.consumer?.task_id ?? taskFromProjectMarkdown(projectMdText);
  const osVersion = manifest?.development_os?.version ?? osPackage?.version ?? null;
  const sourceHash = source.source_sha256;
  const complete = Boolean(manifest && manifest.schema_version === '1.0' && manifest.snapshot_id && manifest.created_at && manifest.development_os && manifest.consumer);
  const recoveredAny = Boolean(projectId || consumerVersion || taskId || osVersion || architecture);
  const provenance = {
    completeness: complete ? 'COMPLETE' : recoveredAny ? 'PARTIAL' : 'UNVERIFIED',
    source_kind: source.kind,
    snapshot_sha256: sourceHash ? `sha256:${sourceHash}` : null,
    development_os: { version: osVersion, architecture: architecture, commit: manifest?.development_os?.commit ?? null },
    consumer: { project_id: projectId, task_id: taskId, version: consumerVersion, commit: manifest?.consumer?.commit ?? null },
    manifest_present: Boolean(manifestEntry),
    manifest_valid_minimum: complete
  };
  return {
    state: issues.some(i=>i.severity==='BLOCK') ? 'QUARANTINED' : 'PROVENANCE_RECOVERED',
    source_kind: source.kind,
    inventory: { entries:source.entries.length, files:files.length, total_bytes:files.reduce((s,e)=>s+e.uncompressed_size,0), scanned_text_bytes:scanned },
    provenance,
    issues,
    files: files.map(e=>({ path:e.name, size_bytes:e.uncompressed_size }))
  };
}
