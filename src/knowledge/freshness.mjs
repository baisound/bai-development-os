import { validateKnowledgeAsset } from './asset.mjs';
import { deepFreeze, nowIso } from './util.mjs';

export function evaluateKnowledgeFreshness(asset, { now } = {}) {
  const a=validateKnowledgeAsset(asset); const t=Date.parse(now ?? new Date().toISOString());
  let state='FRESH';
  if (a.status === 'INVALID') state='INVALID';
  else if (a.status === 'STALE') state='STALE';
  else if (a.status === 'DEPRECATED') state='DEPRECATED';
  else if (a.status === 'ARCHIVED') state='ARCHIVED';
  else if (a.freshness.expires_at && t >= Date.parse(a.freshness.expires_at)) state='EXPIRED';
  else if (t >= Date.parse(a.freshness.review_after)) state='REVIEW_DUE';
  return deepFreeze({asset_id:a.asset_id,revision:a.revision,state,review_after:a.freshness.review_after,expires_at:a.freshness.expires_at??null,evaluated_at:new Date(t).toISOString()});
}
export function scanKnowledgeFreshness(assets, options={}) { return assets.map(a=>evaluateKnowledgeFreshness(a,options)); }
