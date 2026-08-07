export class ModelRoutingError extends Error { constructor(code,message=code){super(message);this.code=code;} }
const SENS=['PUBLIC','INTERNAL','CONFIDENTIAL','RESTRICTED'];
const req=(v,n)=>{if(typeof v!=='string'||!v.trim())throw new ModelRoutingError('MODEL_ROUTE_INVALID',`${n} required`)};
export function validateModelProfile(profile){
  req(profile.model_id,'model_id'); if(!Array.isArray(profile.capabilities)||!profile.capabilities.length)throw new ModelRoutingError('MODEL_ROUTE_INVALID','capabilities required');
  if(!Number.isSafeInteger(profile.context_capacity)||profile.context_capacity<1)throw new ModelRoutingError('MODEL_ROUTE_INVALID','context_capacity invalid');
  if(!Array.isArray(profile.tools))throw new ModelRoutingError('MODEL_ROUTE_INVALID','tools invalid');
  if(!SENS.includes(profile.max_sensitivity))throw new ModelRoutingError('MODEL_ROUTE_INVALID','max_sensitivity invalid');
  if(typeof profile.reliability!=='number'||profile.reliability<0||profile.reliability>1)throw new ModelRoutingError('MODEL_ROUTE_INVALID','reliability invalid');
  if(!Number.isSafeInteger(profile.estimated_cost_microusd)||profile.estimated_cost_microusd<0)throw new ModelRoutingError('MODEL_ROUTE_INVALID','cost invalid');
  return Object.freeze({...profile,available:profile.available!==false,deprecated:Boolean(profile.deprecated),latency_ms:profile.latency_ms??0});
}
function eligible(request,p){
  const sr=Object.fromEntries(SENS.map((v,i)=>[v,i]));
  if(!p.available||p.deprecated)return false;
  if(request.capabilities.some(c=>!p.capabilities.includes(c)))return false;
  if(request.context_tokens>p.context_capacity)return false;
  if(request.required_tools.some(t=>!p.tools.includes(t)))return false;
  if(sr[p.max_sensitivity]<sr[request.sensitivity])return false;
  if(request.max_cost_microusd!=null&&p.estimated_cost_microusd>request.max_cost_microusd)return false;
  if(request.minimum_reliability!=null&&p.reliability<request.minimum_reliability)return false;
  if(request.independent_from_session&&p.session_id===request.independent_from_session)return false;
  return true;
}
export function routeModel(request,profiles){
  const normalized={capabilities:request.capabilities??[],context_tokens:request.context_tokens??0,required_tools:request.required_tools??[],sensitivity:request.sensitivity??'INTERNAL',max_cost_microusd:request.max_cost_microusd??null,minimum_reliability:request.minimum_reliability??0,prefer_low_latency:Boolean(request.prefer_low_latency),independent_from_session:request.independent_from_session??null,preferred_model_id:request.preferred_model_id??null};
  if(!Array.isArray(normalized.capabilities)||!Array.isArray(normalized.required_tools)||!Number.isSafeInteger(normalized.context_tokens)||normalized.context_tokens<0||!SENS.includes(normalized.sensitivity))throw new ModelRoutingError('MODEL_ROUTE_INVALID');
  const valid=profiles.map(validateModelProfile); const candidates=valid.filter(p=>eligible(normalized,p));
  if(!candidates.length){ const potential=valid.filter(p=>p.available&&!p.deprecated); return Object.freeze({result:potential.length?'MODEL_ROUTE_ESCALATION_REQUIRED':'MODEL_ROUTE_BLOCKED',model:null,reasons:['NO_ELIGIBLE_MODEL']}); }
  candidates.sort((a,b)=>b.reliability-a.reliability || a.estimated_cost_microusd-b.estimated_cost_microusd || (normalized.prefer_low_latency?a.latency_ms-b.latency_ms:0));
  const selected=candidates[0]; const preferred=normalized.preferred_model_id?valid.find(p=>p.model_id===normalized.preferred_model_id):null;
  const fallback=preferred&&preferred.model_id!==selected.model_id;
  return Object.freeze({result:fallback?'MODEL_ROUTE_FALLBACK':'MODEL_ROUTE_READY',model:selected,reasons:Object.freeze(fallback?['PREFERRED_MODEL_INELIGIBLE_OR_LOWER_RANKED']:['BEST_ELIGIBLE_MODEL']),alternates:Object.freeze(candidates.slice(1).map(p=>p.model_id))});
}
export function verifyRoleIndependence({role,session_id,builder_session_id,artifact_based=true}){
  if(['Critic','Judge'].includes(role)){ if(!artifact_based)throw new ModelRoutingError('MODEL_INDEPENDENCE_VIOLATION','independent role must evaluate stored artifact'); if(session_id&&builder_session_id&&session_id===builder_session_id)throw new ModelRoutingError('MODEL_INDEPENDENCE_VIOLATION','independent role must use separate session'); }
  return Object.freeze({result:'INDEPENDENCE_CONFIRMED'});
}
export function explainRoute(route){ if(!route?.result)throw new ModelRoutingError('MODEL_ROUTE_INVALID'); return {result:route.result,model_id:route.model?.model_id??null,reasons:[...(route.reasons??[])]}; }
