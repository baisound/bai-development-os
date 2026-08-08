import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const statePath = path.join(root, 'registry/current-state.md');
const sourcePath = path.join(root, 'architecture/BAI_Development_OS_Architecture_Ver2.13.md');
const task009RefinementPath = path.join(root, 'architecture/BAI_Development_OS_Post_TASK009_Roadmap_Refinement_Ver1.0.md');
const task010RefinementPath = path.join(root, 'architecture/BAI_Development_OS_Post_TASK010_Roadmap_Refinement_Ver1.0.md');
const task011RefinementPath = path.join(root, 'architecture/BAI_Development_OS_Post_TASK011_Roadmap_Refinement_Ver1.0.md');
const task012RefinementPath = path.join(root, 'architecture/BAI_Development_OS_Post_TASK012_Roadmap_Refinement_Ver1.0.md');
const task013RefinementPath = path.join(root, 'architecture/BAI_Development_OS_Post_TASK013_Roadmap_Refinement_Ver1.0.md');
const task014RefinementPath = path.join(root, 'architecture/BAI_Development_OS_Post_TASK014_Roadmap_Refinement_Ver1.0.md');

const state = fs.readFileSync(statePath, 'utf8');
const versionMatch = state.match(/Current Architecture Canonical: `BAI Development OS Architecture Ver\.([0-9.]+)`/);
if (!versionMatch) throw new Error('ROADMAP_CHECK_FAIL: current architecture version not found');
const currentVersion = versionMatch[1];
const currentPath = path.join(root, `architecture/BAI_Development_OS_Architecture_Ver${currentVersion}.md`);
if (!fs.existsSync(currentPath)) throw new Error(`ROADMAP_CHECK_FAIL: current architecture missing: ${currentPath}`);

const source = fs.readFileSync(sourcePath, 'utf8');
const current = fs.readFileSync(currentPath, 'utf8');
const marker = '# Part XV — Current Consolidated Roadmap Authority';
const markerIndex = current.indexOf(marker);
if (markerIndex < 0) throw new Error('ROADMAP_CHECK_FAIL: Part XV current consolidated roadmap missing');
const consolidated = current.slice(markerIndex);

const lines = source.split(/\r?\n/);
const acceptedRanges = [[64,69],[76,81],[93,99],[112,118],[129,135]];
const inRange = (n) => acceptedRanges.some(([a,b]) => n >= a && n <= b);
const sections = [];
for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(/^##\s+(\d+)\.\s+(TASK-0(?:09|10|11|12|13|14|15)\b.*)$/);
  if (!m) continue;
  const n = Number(m[1]);
  if (!inRange(n)) continue;
  let j = i + 1;
  while (j < lines.length && !lines[j].startsWith('## ')) j++;
  const body = lines.slice(i + 1, j).join('\n').trim();
  sections.push({ heading: lines[i], body });
}

if (sections.length !== 33) {
  throw new Error(`ROADMAP_CHECK_FAIL: expected 33 historical source sections, got ${sections.length}`);
}

const task009Refinement = fs.readFileSync(task009RefinementPath, 'utf8');
const task009Sections = [];
for (const task of ['010','011','012','013','014','015']) {
  const heading = `## TASK-${task}`;
  const start = task009Refinement.indexOf(heading);
  if (start < 0) throw new Error(`ROADMAP_CHECK_FAIL: TASK-${task} TASK-009 refinement missing`);
  const bodyStart = task009Refinement.indexOf('\n', start) + 1;
  const next = task009Refinement.indexOf('\n## ', bodyStart);
  const body = task009Refinement.slice(bodyStart, next < 0 ? task009Refinement.length : next).trim();
  task009Sections.push({ heading, body });
}
const task010Refinement = fs.readFileSync(task010RefinementPath, 'utf8');
const task010Sections = [];
for (const task of ['011','012','013','014','015']) {
  const heading = `## TASK-${task}`;
  const start = task010Refinement.indexOf(heading);
  if (start < 0) throw new Error(`ROADMAP_CHECK_FAIL: TASK-${task} TASK-010 refinement missing`);
  const bodyStart = task010Refinement.indexOf('\n', start) + 1;
  const next = task010Refinement.indexOf('\n## ', bodyStart);
  let body = task010Refinement.slice(bodyStart, next < 0 ? task010Refinement.length : next).trim();
  body = body.replace(/^### [^\n]+\n+/, '').trim();
  task010Sections.push({ heading, body });
}
const task011Refinement = fs.readFileSync(task011RefinementPath, 'utf8');
const task011Sections = [];
for (const task of ['012','013','014','015']) {
  const heading = `## TASK-${task}`;
  const start = task011Refinement.indexOf(heading);
  if (start < 0) throw new Error(`ROADMAP_CHECK_FAIL: TASK-${task} TASK-011 refinement missing`);
  const bodyStart = task011Refinement.indexOf('\n', start) + 1;
  const next = task011Refinement.indexOf('\n## ', bodyStart);
  const body = task011Refinement.slice(bodyStart, next < 0 ? task011Refinement.length : next).trim();
  task011Sections.push({ heading, body });
}
const task012Refinement = fs.readFileSync(task012RefinementPath, 'utf8');
const task012Sections = [];
for (const task of ['013','014','015']) {
  const heading = `## TASK-${task}`;
  const start = task012Refinement.indexOf(heading);
  if (start < 0) throw new Error(`ROADMAP_CHECK_FAIL: TASK-${task} TASK-012 refinement missing`);
  const bodyStart = task012Refinement.indexOf('\n', start) + 1;
  const next = task012Refinement.indexOf('\n## ', bodyStart);
  const body = task012Refinement.slice(bodyStart, next < 0 ? task012Refinement.length : next).trim();
  task012Sections.push({ heading, body });
}
const task013Refinement = fs.readFileSync(task013RefinementPath, 'utf8');
const task013Sections = [];
for (const task of ['014','015']) {
  const heading = `## TASK-${task}`;
  const start = task013Refinement.indexOf(heading);
  if (start < 0) throw new Error(`ROADMAP_CHECK_FAIL: TASK-${task} TASK-013 refinement missing`);
  const bodyStart = task013Refinement.indexOf('\n', start) + 1;
  const next = task013Refinement.indexOf('\n## ', bodyStart);
  const body = task013Refinement.slice(bodyStart, next < 0 ? task013Refinement.length : next).trim();
  task013Sections.push({ heading, body });
}
const task014Refinement = fs.readFileSync(task014RefinementPath, 'utf8');
const task014Sections = [];
for (const task of ['015']) {
  const heading = `## TASK-${task}`;
  const start = task014Refinement.indexOf(heading);
  if (start < 0) throw new Error(`ROADMAP_CHECK_FAIL: TASK-${task} TASK-014 refinement missing`);
  const bodyStart = task014Refinement.indexOf('\n', start) + 1;
  const next = task014Refinement.indexOf('\n## ', bodyStart);
  let body = task014Refinement.slice(bodyStart, next < 0 ? task014Refinement.length : next).trim();
  body = body.replace(/\n## Task-allocation decision[\s\S]*$/, '').trim();
  task014Sections.push({ heading, body });
}
const allSections = [...sections, ...task009Sections, ...task010Sections, ...task011Sections, ...task012Sections, ...task013Sections, ...task014Sections];
const missing = allSections.filter((s) => !consolidated.includes(s.body));
if (missing.length) {
  console.error('ROADMAP_CHECK_MISSING_SECTIONS');
  for (const s of missing) console.error(`- ${s.heading}`);
  process.exit(1);
}

const task13Required = [
  'TASK-013 — Domain Adapter / Plugin SDK',
  'Domain-specific Project Policy Pack / Test Pack / Evidence Pack',
  '動画・音声・BGM・SE・配信・Unity・Web・Desktop・Automation',
];
for (const required of task13Required) {
  if (!consolidated.includes(required)) throw new Error(`ROADMAP_CHECK_FAIL: TASK-013 identity fragment missing: ${required}`);
}

const historicalWarnings = [
  'TASK-009 is not defined in the current canonical OS roadmap.',
  'TASK-009 remains undefined unless separately designed and authorized.',
];
for (const warning of historicalWarnings) {
  if (current.includes(warning) && !consolidated.includes('explicitly superseded for current routing')) {
    throw new Error(`ROADMAP_CHECK_FAIL: historical/current ambiguity not superseded: ${warning}`);
  }
}

console.log(`ROADMAP_CONSOLIDATION_PASS current=Ver.${currentVersion} source_sections=${allSections.length} missing=0`);
