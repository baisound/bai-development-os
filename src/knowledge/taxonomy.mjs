import { KnowledgeError } from './errors.mjs';
import { SCOPE_LEVELS, SCOPE_SPECIFICITY } from './constants.mjs';
import { requireArray, requireString, safeId, deepFreeze } from './util.mjs';

export function validateVocabulary(entries = []) {
  requireArray(entries, 'vocabulary');
  const ids = new Set(); const terms = new Map();
  for (const entry of entries) {
    const id = safeId(entry.term_id, 'term_id');
    const term = requireString(entry.term, 'term').toLowerCase();
    if (ids.has(id)) throw new KnowledgeError('KNOWLEDGE_VOCABULARY_DUPLICATE_ID', id);
    if (terms.has(term)) throw new KnowledgeError('KNOWLEDGE_VOCABULARY_DUPLICATE_TERM', entry.term);
    ids.add(id); terms.set(term, id);
    for (const aliasRaw of entry.aliases ?? []) {
      const alias = requireString(aliasRaw, 'alias').toLowerCase();
      if (terms.has(alias)) throw new KnowledgeError('KNOWLEDGE_VOCABULARY_ALIAS_COLLISION', aliasRaw);
      terms.set(alias, id);
    }
  }
  return deepFreeze({ entries: structuredClone(entries), term_index: Object.fromEntries(terms) });
}

export function validateTaxonomy(nodes = []) {
  requireArray(nodes, 'taxonomy');
  const byId = new Map();
  for (const node of nodes) {
    const id = safeId(node.node_id, 'node_id');
    requireString(node.label, 'label');
    if (byId.has(id)) throw new KnowledgeError('KNOWLEDGE_TAXONOMY_DUPLICATE', id);
    if (node.scope_level && !SCOPE_LEVELS.includes(node.scope_level)) throw new KnowledgeError('KNOWLEDGE_TAXONOMY_SCOPE_INVALID', id);
    byId.set(id, node);
  }
  for (const node of nodes) {
    for (const parent of node.parent_ids ?? []) if (!byId.has(parent)) throw new KnowledgeError('KNOWLEDGE_TAXONOMY_DANGLING_PARENT', parent);
  }
  const visiting = new Set(); const visited = new Set();
  function visit(id) {
    if (visiting.has(id)) throw new KnowledgeError('KNOWLEDGE_TAXONOMY_CYCLE', id);
    if (visited.has(id)) return;
    visiting.add(id);
    for (const p of byId.get(id).parent_ids ?? []) visit(p);
    visiting.delete(id); visited.add(id);
  }
  for (const id of byId.keys()) visit(id);
  return deepFreeze({ nodes: structuredClone(nodes), node_ids: [...byId.keys()] });
}

const requiredKey = Object.freeze({DOMAIN:'domain',TECHNOLOGY:'technology',SPECIALIZATION:'specialization',TOOL:'tool',PROJECT:'project_id',TASK:'task_id'});
export function validateScope(scope) {
  if (!scope || typeof scope !== 'object') throw new KnowledgeError('KNOWLEDGE_SCOPE_INVALID');
  if (!SCOPE_LEVELS.includes(scope.level)) throw new KnowledgeError('KNOWLEDGE_SCOPE_INVALID', 'scope.level invalid');
  const key = requiredKey[scope.level];
  if (key) requireString(scope[key], `scope.${key}`);
  if (scope.level === 'TASK') requireString(scope.project_id, 'scope.project_id');
  return deepFreeze(structuredClone(scope));
}
export function scopeSpecificity(scope) { return SCOPE_SPECIFICITY[validateScope(scope).level]; }
export function scopeMatches(assetScope, requestScope = {}) {
  const a = validateScope(assetScope); const r = requestScope ?? {};
  switch (a.level) {
    case 'GLOBAL': return true;
    case 'DOMAIN': return a.domain === r.domain;
    case 'TECHNOLOGY': return a.technology === r.technology;
    case 'SPECIALIZATION': return a.specialization === r.specialization;
    case 'TOOL': return a.tool === r.tool;
    case 'PROJECT': return a.project_id === r.project_id;
    case 'TASK': return a.project_id === r.project_id && a.task_id === r.task_id;
    default: return false;
  }
}
