import { SecurityError } from './errors.mjs';
import { deepFreeze } from './util.mjs';
const ORDER = new Map([['NONE',0],['LOW',1],['MEDIUM',2],['HIGH',3],['CRITICAL',4]]);
export function classifyTrust({ source = 'UNKNOWN', signed = false, verified = false, generated = false, external = false } = {}) {
  if (verified && signed) return 'VERIFIED';
  if (verified) return 'TRUSTED';
  if (external || generated || source === 'UNKNOWN') return 'UNTRUSTED';
  return 'REFERENCE';
}
export function evaluateDependencyRisk(findings = [], { block_at = 'HIGH', allowlist = [] } = {}) {
  if (!ORDER.has(block_at)) throw new SecurityError('SECURITY_RISK_POLICY_INVALID');
  const allowed = new Set(allowlist); const normalized = findings.map((f) => ({ id: String(f.id ?? f.cve ?? 'unknown'), package: String(f.package ?? 'unknown'), severity: String(f.severity ?? 'UNKNOWN').toUpperCase(), fixed: Boolean(f.fixed), direct: f.direct !== false }));
  const blocking = normalized.filter((f) => !allowed.has(f.id) && ORDER.has(f.severity) && ORDER.get(f.severity) >= ORDER.get(block_at) && !f.fixed);
  return deepFreeze({ decision: blocking.length ? 'BLOCK' : 'ALLOW', block_at, findings: normalized, blocking });
}
export function assertDependencyPolicy(findings, policy) { const result = evaluateDependencyRisk(findings, policy); if (result.decision === 'BLOCK') throw new SecurityError('SECURITY_DEPENDENCY_RISK_BLOCKED','dependency risk policy blocked',{blocking:result.blocking}); return result; }
