import { routeModel } from '../model-control/index.mjs';
import { resolveContextSources } from '../context-control/index.mjs';
import { deepFreeze } from './util.mjs';
export class AdvancedGuardError extends Error { constructor(code,message=code){super(message);this.code=code;} }
export function optimizeContext({sources=[],token_budget}={}){
  if(!Number.isInteger(token_budget)||token_budget<1) throw new AdvancedGuardError('ADVANCED_GUARD_INPUT_INVALID');
  const resolved=resolveContextSources(sources); const ranked=[...resolved.selected].sort((a,b)=>(b.priority??0)-(a.priority??0)); let used=0; const selected=[],excluded=[...resolved.excluded];
  for(const source of ranked){ const tokens=source.token_estimate??0; if(used+tokens<=token_budget){selected.push(source);used+=tokens;} else if(['CANONICAL','TRUSTED'].includes(source.trust_level)&&source.required===true) throw new AdvancedGuardError('ADVANCED_CONTEXT_BUDGET_BLOCKED'); else excluded.push({source_id:source.source_id,reason:'TOKEN_BUDGET'}); }
  return deepFreeze({result:'ADVANCED_CONTEXT_READY',selected,excluded,token_estimate:used,token_budget});
}
export function selectModelWithPolicy({request,profiles,policy={}}={}){
  const merged={...request,max_cost_microusd:policy.max_cost_microusd??request?.max_cost_microusd,minimum_reliability:policy.minimum_reliability??request?.minimum_reliability}; const route=routeModel(merged,profiles);
  if(route.result==='MODEL_ROUTE_ESCALATION_REQUIRED' && policy.allow_escalation!==true) throw new AdvancedGuardError('ADVANCED_MODEL_ESCALATION_BLOCKED'); return route;
}
export function compressPrompt({sections=[],max_chars}={}){
  if(!Number.isInteger(max_chars)||max_chars<1) throw new AdvancedGuardError('ADVANCED_GUARD_INPUT_INVALID');
  const required=sections.filter(s=>s.required); const optional=sections.filter(s=>!s.required).sort((a,b)=>(b.priority??0)-(a.priority??0)); let text=required.map(s=>s.text).join('\n\n');
  if(text.length>max_chars) throw new AdvancedGuardError('MANDATORY_PROMPT_EXCEEDS_LIMIT'); const included=[...required.map(s=>s.id)],excluded=[];
  for(const section of optional){const candidate=`${text}${text?'\n\n':''}${section.text}`; if(candidate.length<=max_chars){text=candidate;included.push(section.id);}else excluded.push(section.id);}
  return deepFreeze({result:'PROMPT_COMPRESSED',text,included,excluded,char_count:text.length});
}
export function optimizeDynamicBudget({profile_id,remaining_microusd,estimated_next_microusd,reserve_ratio=0.1}={}){
  if(!Number.isSafeInteger(remaining_microusd)||remaining_microusd<0||!Number.isSafeInteger(estimated_next_microusd)||estimated_next_microusd<0) throw new AdvancedGuardError('ADVANCED_GUARD_INPUT_INVALID');
  const reserve=Math.ceil(remaining_microusd*reserve_ratio); const spendable=remaining_microusd-reserve; const allowed=estimated_next_microusd<=spendable;
  return deepFreeze({result:allowed?'DYNAMIC_BUDGET_READY':'DYNAMIC_BUDGET_BLOCKED',profile_id,remaining_microusd,reserve_microusd:reserve,spendable_microusd:spendable,estimated_next_microusd});
}
