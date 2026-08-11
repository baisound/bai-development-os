import { KnowledgeEvolutionError } from './errors.mjs';
import { PRIVACY_LEVELS } from './constants.mjs';
import { requireNoUnknownKeys, requirePlainObject } from './util.mjs';
import { scanSensitiveData } from '../security/dlp.mjs';

const SENSITIVE_KEY = /(?:api[_-]?key|token|secret|password|passwd|authorization|credential|private[_-]?key|access[_-]?key)/i;
const FORBIDDEN_CONTENT_KEY = /(?:subtitle|transcript|prompt|raw[_-]?content|file[_-]?content|crash[_-]?dump|absolute[_-]?path|file[_-]?path|filename|email|phone|username)/i;
const SECRET_VALUE_PATTERNS = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bsk-[A-Za-z0-9_-]{20,}\b/, /\bgh[pousr]_[A-Za-z0-9]{20,}\b/, /\bAKIA[A-Z0-9]{16}\b/,
  /\bBearer\s+[A-Za-z0-9._~+\/-]{16,}\b/i
];
const WINDOWS_PATH = /\b[A-Za-z]:\\(?:[^\s<>:"|?*]+\\)*[^\s<>:"|?*]*/;
const UNIX_HOME_PATH = /\/(?:home|Users)\/[^\s/]+\/[^\s]*/;
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const PHONE_LIKE = /(?<!\d)(?:\+\d{1,3}[ -])?(?:\(?\d{2,4}\)?[ -])\d{2,4}[ -]\d{3,4}(?!\d)/;

const LEGACY_PAYLOAD_KEYS = Object.freeze({
  feature_result: ['feature','result','duration_ms','retry_count','reason_code'],
  diagnostic: ['component','error_code','retry_count','recovered'], performance: ['feature','duration_ms','retry_count','sample_count'],
  capability: ['capability','available','provider','version'], user_feedback: ['feature','rating','category','comment'],
  incident: ['component','error_code','recovered','recovery_action','retry_count'], correction: ['feature','action','reason_code'], adoption: ['feature','status','sample_count']
});
function assertSafeString(value){
  for(const pattern of SECRET_VALUE_PATTERNS) if(pattern.test(value)) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_SECRET_DETECTED');
  if(WINDOWS_PATH.test(value)||UNIX_HOME_PATH.test(value)) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_ABSOLUTE_PATH_FORBIDDEN');
  if(EMAIL.test(value)||PHONE_LIKE.test(value)) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_PERSONAL_DATA_FORBIDDEN');
}
function walk(value, trail=[]){
  if(Array.isArray(value)) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_NESTED_COLLECTION_FORBIDDEN',trail.join('.'));
  if(value===null || value===undefined) return;
  if(typeof value==='string'){ assertSafeString(value); return; }
  if(typeof value!=='object') return;
  for(const [key,child] of Object.entries(value)){
    if(SENSITIVE_KEY.test(key)) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_SENSITIVE_KEY_FORBIDDEN',trail.concat(key).join('.'));
    if(FORBIDDEN_CONTENT_KEY.test(key)) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_FORBIDDEN_FIELD',trail.concat(key).join('.'));
    walk(child,[...trail,key]);
  }
}
export function assertConsumerEvidencePrivacySafe(value){
  if(scanSensitiveData(value).length) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_SECRET_DETECTED');
  walk(value); return value;
}
export function sanitizeCanonicalConsumerEvidenceEvent(event){
  if(!PRIVACY_LEVELS.includes(event.privacy_level)) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_PRIVACY_LEVEL_INVALID');
  assertConsumerEvidencePrivacySafe(event);
  return structuredClone(event);
}
export function sanitizeConsumerEvidencePayload(eventType, privacyLevel, payload){
  if(!PRIVACY_LEVELS.includes(privacyLevel)) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_PRIVACY_LEVEL_INVALID');
  requirePlainObject(payload,'payload'); assertConsumerEvidencePrivacySafe(payload);
  const allowed=LEGACY_PAYLOAD_KEYS[eventType]; if(!allowed) throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_EVENT_TYPE_INVALID');
  requireNoUnknownKeys(payload,allowed,'payload');
  if(eventType==='user_feedback'&&privacyLevel!=='P2') throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_FEEDBACK_REQUIRES_P2');
  if(eventType==='user_feedback') throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_LEGACY_FEEDBACK_REQUIRES_EXPLICIT_MIGRATION');
  return structuredClone(payload);
}
export function scanTextForSecrets(text){
  const hits=[]; const lines=String(text).split(/\r?\n/);
  for(let i=0;i<lines.length;i++){
    const line=lines[i];
    if(/^\s*(?:API[_-]?KEY|TOKEN|SECRET|PASSWORD|PASSWD|AUTHORIZATION|PRIVATE[_-]?KEY|ACCESS[_-]?KEY)\s*[:=]\s*[^\s#]+/i.test(line)) hits.push({rule_id:'SECRET_ASSIGNMENT',line:i+1});
    for(const [idx,pattern] of SECRET_VALUE_PATTERNS.entries()) if(pattern.test(line)) hits.push({rule_id:`SECRET_PATTERN_${idx+1}`,line:i+1});
  } return hits;
}
export function isSecretBearingPath(name){
  const p=name.toLowerCase().replaceAll('\\','/');
  if(/(^|\/)\.env(?:\.|$)/.test(p)&&!p.endsWith('.example')) return true;
  if(/(^|\/)(?:id_rsa|id_ed25519|credentials|secrets?)(?:\.|$)/.test(p)) return true;
  if(/\.(?:pem|p12|pfx|key|keystore)$/.test(p)) return true;
  return false;
}
