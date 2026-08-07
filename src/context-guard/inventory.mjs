import { createHash } from 'node:crypto';
import { resolveTrustedAllowedReadRoots } from './config.mjs';
import { readStableUtf8, resolveAndValidateInputPath } from './path-safety.mjs';
import { estimateInputTokens } from './estimate.mjs';

const CLASSES = new Set(['MANDATORY_CANONICAL', 'MANDATORY_CURRENT_TASK', 'CONDITIONAL_SUPPORTING', 'HISTORICAL_EVIDENCE', 'IRRELEVANT']);

export const classifyInput = (candidate) => CLASSES.has(candidate.authority_class)
  ? candidate.authority_class : 'UNKNOWN';

export async function collectInputInventory(candidates) {
  const allowedRoots = await resolveTrustedAllowedReadRoots();
  const rows = [];
  for (const candidate of candidates) {
    const validated = await resolveAndValidateInputPath(candidate.path, allowedRoots);
    const { content, pre_read_identity, post_read_identity } = await readStableUtf8(validated);
    const checksum = `sha256:${createHash('sha256').update(content).digest('hex')}`;
    rows.push({ ...candidate, authority_class: classifyInput(candidate), ...validated,
      bytes: content.byteLength, content_checksum: checksum, estimated_tokens: estimateInputTokens(content.byteLength),
      pre_read_identity, post_read_identity });
  }
  return rows;
}

export function deduplicateInputs(inventory) {
  const seen = new Map();
  return inventory.map((item) => {
    const key = `${item.authority_class}:${item.purpose ?? ''}:${item.content_checksum}`;
    if (seen.has(key)) return { ...item, authority_class: 'DUPLICATE', duplicate_of: seen.get(key).requested_path };
    seen.set(key, item);
    return item;
  });
}

export function selectInputs(inventory) {
  const selected = inventory.filter((entry) => !['DUPLICATE', 'IRRELEVANT', 'UNKNOWN'].includes(entry.authority_class));
  const excluded = inventory.filter((entry) => !selected.includes(entry));
  return { selected, excluded, total_bytes: selected.reduce((sum, entry) => sum + entry.bytes, 0),
    estimated_input_tokens: selected.reduce((sum, entry) => sum + entry.estimated_tokens, 0) };
}
