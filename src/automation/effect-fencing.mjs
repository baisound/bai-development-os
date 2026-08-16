import { requireArray, requireString } from './util.mjs';

export class EffectFencingError extends Error {
  constructor(code, message){ super(message); this.name = 'EffectFencingError'; this.code = code; }
}

export const EFFECT_FENCING_CLASSES = Object.freeze(['PURE', 'IDEMPOTENT_KEYED', 'FENCED_REVERSIBLE', 'UNFENCEABLE']);

export function assessAutomaticTakeover(input){
  const operation_id = requireString(input?.operation_id, 'operation_id', EffectFencingError);
  const effect_class = input?.effect_class;
  if(!EFFECT_FENCING_CLASSES.includes(effect_class)) throw new EffectFencingError('EFFECT_FENCING_CLASS_INVALID', String(effect_class));
  requireArray(input?.reconciliation_receipts ?? [], 'reconciliation_receipts', EffectFencingError);
  if(input?.prior_lease_state !== 'STALE') return { result: 'TAKEOVER_BLOCKED', operation_id, reason_code: 'PRIOR_LEASE_NOT_STALE' };
  if(input?.new_fencing_token_valid !== true) return { result: 'TAKEOVER_BLOCKED', operation_id, reason_code: 'FENCING_TOKEN_INVALID' };
  if(effect_class === 'UNFENCEABLE') return { result: 'TAKEOVER_BLOCKED', operation_id, reason_code: 'UNFENCEABLE_EFFECT' };
  if(effect_class !== 'PURE' && input.reconciliation_receipts.length === 0) return { result: 'TAKEOVER_BLOCKED', operation_id, reason_code: 'RECONCILIATION_REQUIRED' };
  if(input?.authority_result !== 'ALLOW') return { result: 'TAKEOVER_BLOCKED', operation_id, reason_code: 'AUTHORITY_NOT_ALLOWED' };
  return { result: 'AUTOMATIC_TAKEOVER_ALLOWED', operation_id, effect_class };
}
