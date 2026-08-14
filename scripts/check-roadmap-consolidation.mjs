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
const task015RefinementPath = path.join(root, 'architecture/BAI_Development_OS_Post_TASK015_Roadmap_Refinement_Ver1.0.md');
const creativeKnowledgeRefinementPath = path.join(root, 'architecture/BAI_Development_OS_Post_CREATIVE_OS_Knowledge_Audit_Roadmap_Refinement_Ver1.0.md');
const consumerDesignGovernanceRefinementPath = path.join(root, 'architecture/BAI_Development_OS_Post_TASK018_Consumer_Design_Governance_Roadmap_Refinement_Ver1.0.md');

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
const task015Refinement = fs.readFileSync(task015RefinementPath, 'utf8');
const task015Sections = [];
for (const task of ['016']) {
  const heading = `## TASK-${task}`;
  const start = task015Refinement.indexOf(heading);
  if (start < 0) throw new Error(`ROADMAP_CHECK_FAIL: TASK-${task} TASK-015 refinement missing`);
  const bodyStart = task015Refinement.indexOf('\n', start) + 1;
  const next = task015Refinement.indexOf('\n## ', bodyStart);
  const body = task015Refinement.slice(bodyStart, next < 0 ? task015Refinement.length : next).trim();
  task015Sections.push({ heading, body });
}
const creativeKnowledgeRefinement = fs.readFileSync(creativeKnowledgeRefinementPath, 'utf8');
const creativeKnowledgeSections = [];
for (const task of ['017']) {
  const heading = `## TASK-${task}`;
  const start = creativeKnowledgeRefinement.indexOf(heading);
  if (start < 0) throw new Error(`ROADMAP_CHECK_FAIL: TASK-${task} CREATIVE knowledge refinement missing`);
  const bodyStart = creativeKnowledgeRefinement.indexOf('\n', start) + 1;
  const next = creativeKnowledgeRefinement.indexOf('\n## ', bodyStart);
  let body = creativeKnowledgeRefinement.slice(bodyStart, next < 0 ? creativeKnowledgeRefinement.length : next).trim();
  body = body.replace(/\n## Operational improvement allocation[\s\S]*$/, '').trim();
  creativeKnowledgeSections.push({ heading, body });
}
const consumerDesignGovernanceRefinement = fs.readFileSync(consumerDesignGovernanceRefinementPath, 'utf8');
const consumerDesignGovernanceSections = [];
for (const task of ['019']) {
  const heading = `## TASK-${task}`;
  const start = consumerDesignGovernanceRefinement.indexOf(heading);
  if (start < 0) throw new Error(`ROADMAP_CHECK_FAIL: TASK-${task} post-TASK-018 refinement missing`);
  const bodyStart = consumerDesignGovernanceRefinement.indexOf('\n', start) + 1;
  const next = consumerDesignGovernanceRefinement.indexOf('\n## ', bodyStart);
  const body = consumerDesignGovernanceRefinement.slice(bodyStart, next < 0 ? consumerDesignGovernanceRefinement.length : next).trim();
  consumerDesignGovernanceSections.push({ heading, body });
}
const allSections = [...sections, ...task009Sections, ...task010Sections, ...task011Sections, ...task012Sections, ...task013Sections, ...task014Sections, ...task015Sections, ...creativeKnowledgeSections, ...consumerDesignGovernanceSections];
const missing = allSections.filter((s) => !consolidated.includes(s.body));
if (missing.length) {
  console.error('ROADMAP_CHECK_MISSING_SECTIONS');
  for (const s of missing) console.error(`- ${s.heading}`);
  process.exit(1);
}

const task16Required = [
  'TASK-016 — Resilience, Recovery & Scalability Certification OS',
  'deterministic distributed simulation harness',
  'Resilience Certification levels',
];
for (const required of task16Required) {
  if (!consolidated.includes(required)) throw new Error(`ROADMAP_CHECK_FAIL: TASK-016 identity fragment missing: ${required}`);
}

const task17Required = [
  'TASK-017 — Knowledge Evolution & Federated Evidence Governance OS',
  'Rejected Pattern',
  'privacy-minimized federated Evidence',
];
for (const required of task17Required) {
  if (!consolidated.includes(required)) throw new Error(`ROADMAP_CHECK_FAIL: TASK-017 identity fragment missing: ${required}`);
}

const task19Required = [
  'TASK-019 — Consumer Design Intake, Roadmap Reconciliation & Acceptance Assurance OS',
  'canonical_authority=false',
  'recommendation-only Roadmap Impact record',
];
for (const required of task19Required) {
  if (!consolidated.includes(required)) throw new Error(`ROADMAP_CHECK_FAIL: TASK-019 identity fragment missing: ${required}`);
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
