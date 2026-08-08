import { SecurityError } from './errors.mjs';
import { deepFreeze } from './util.mjs';

const KEY_CATEGORIES = new Map([
  ['password', 'CREDENTIAL'], ['passwd', 'CREDENTIAL'], ['secret', 'CREDENTIAL'], ['token', 'TOKEN'],
  ['api_key', 'CREDENTIAL'], ['apikey', 'CREDENTIAL'], ['private_key', 'PRIVATE_KEY'], ['authorization', 'TOKEN'],
  ['access_token', 'TOKEN'], ['refresh_token', 'TOKEN'], ['client_secret', 'CREDENTIAL']
]);
const PATTERNS = [
  ['PRIVATE_KEY', /-----BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY-----/],
  ['OPENAI_KEY', /\bsk-(?:proj-)?[A-Za-z0-9_-]{16,}\b/],
  ['GITHUB_TOKEN', /\bgh[pousr]_[A-Za-z0-9]{20,}\b/],
  ['BEARER_TOKEN', /\bBearer\s+[A-Za-z0-9._~+\/-]{12,}=*\b/i]
];
function pathString(parts) { return parts.length ? parts.join('.') : '$'; }
export function scanSensitiveData(value, { maxFindings = 100 } = {}) {
  const findings = [];
  const add = (category, path, reason) => { if (findings.length < maxFindings) findings.push({ category, path: pathString(path), reason }); };
  function walk(v, parts = []) {
    if (findings.length >= maxFindings || v == null) return;
    if (Array.isArray(v)) { v.forEach((x, i) => walk(x, [...parts, String(i)])); return; }
    if (typeof v === 'object') {
      for (const [k, x] of Object.entries(v)) {
        const cat = KEY_CATEGORIES.get(k.toLowerCase());
        if (cat && x != null && String(x).trim()) add(cat, [...parts, k], `sensitive key: ${k}`);
        walk(x, [...parts, k]);
      }
      return;
    }
    if (typeof v === 'string') {
      for (const [cat, regex] of PATTERNS) if (regex.test(v)) add(cat, parts, `pattern: ${cat}`);
    }
  }
  walk(value);
  return deepFreeze(findings);
}
export function assertNoSecretMaterial(value, { allowCategories = [] } = {}) {
  const allowed = new Set(allowCategories);
  const findings = scanSensitiveData(value).filter((f) => !allowed.has(f.category));
  if (findings.length) throw new SecurityError('SECURITY_DLP_BLOCKED', 'sensitive material detected', { findings });
  return true;
}
export function redactSensitiveData(value, replacement = '[REDACTED]') {
  function walk(v, key = null) {
    if (v == null) return v;
    if (key && KEY_CATEGORIES.has(String(key).toLowerCase())) return replacement;
    if (Array.isArray(v)) return v.map((x) => walk(x));
    if (typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x, k)]));
    if (typeof v === 'string' && PATTERNS.some(([, re]) => re.test(v))) return replacement;
    return v;
  }
  return walk(structuredClone(value));
}
