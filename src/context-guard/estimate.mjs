import { ContextGuardError } from './errors.mjs';

export const estimateArtifactBytes = (text) => Buffer.byteLength(String(text), 'utf8');
export const estimateInputTokens = (bytes) => {
  if (!Number.isSafeInteger(bytes) || bytes < 0) throw new ContextGuardError('CONTEXT_ESTIMATION_FAILED');
  return Math.ceil(Math.ceil(bytes / 3) * 1.2);
};
export const estimateOutput = ({ section_token_estimates = [], expected_top_level_sections = 0, artifact_text = '' } = {}) => ({
  estimated_output_tokens: Math.ceil(section_token_estimates.reduce((sum, value) => sum + value, 0) * 1.2),
  estimated_artifact_bytes: estimateArtifactBytes(artifact_text),
  expected_top_level_sections,
  estimation_method: 'utf8_bytes_divided_by_3_with_20_percent_margin',
});
