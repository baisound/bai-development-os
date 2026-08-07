import { CostGuardError } from './errors.mjs';
const valid = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0;
export function estimateModelCostMicrousd({ input_tokens = 0, output_tokens = 0, input_usd_per_million, output_usd_per_million }) {
  for (const value of [input_tokens, output_tokens]) if (!Number.isSafeInteger(value) || value < 0) throw new CostGuardError('COST_USAGE_INVALID');
  if (!valid(input_usd_per_million) || !valid(output_usd_per_million)) throw new CostGuardError('COST_PRICING_INVALID');
  return Math.ceil((input_tokens * input_usd_per_million) + (output_tokens * output_usd_per_million));
}
export const microusdToUsd = (value) => value / 1_000_000;
