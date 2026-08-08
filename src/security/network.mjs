import net from 'node:net';
import { SecurityError } from './errors.mjs';
import { deepFreeze } from './util.mjs';
function isPrivateIp(ip) {
  if (net.isIPv4(ip)) { const p = ip.split('.').map(Number); return p[0] === 10 || p[0] === 127 || (p[0] === 169 && p[1] === 254) || (p[0] === 172 && p[1] >= 16 && p[1] <= 31) || (p[0] === 192 && p[1] === 168) || p[0] === 0; }
  if (net.isIPv6(ip)) { const x = ip.toLowerCase(); return x === '::1' || x === '::' || x.startsWith('fc') || x.startsWith('fd') || x.startsWith('fe8') || x.startsWith('fe9') || x.startsWith('fea') || x.startsWith('feb'); }
  return false;
}
function hostAllowed(host, allowHosts) { return allowHosts.some((x) => x === host || (x.startsWith('*.') && host.endsWith(x.slice(1)) && host !== x.slice(2))); }
export function evaluateEgressTarget({ url, allow_hosts = [], allow_protocols = ['https:'], resolved_addresses = [], allow_private = false } = {}) {
  let u; try { u = new URL(url); } catch { throw new SecurityError('SECURITY_EGRESS_URL_INVALID'); }
  if (u.username || u.password) throw new SecurityError('SECURITY_EGRESS_URL_CREDENTIALS_FORBIDDEN');
  if (!allow_protocols.includes(u.protocol)) throw new SecurityError('SECURITY_EGRESS_PROTOCOL_DENIED');
  const host = u.hostname.toLowerCase(); if (['localhost', 'localhost.localdomain'].includes(host) || host.endsWith('.localhost')) throw new SecurityError('SECURITY_EGRESS_PRIVATE_DENIED');
  if (allow_hosts.length && !hostAllowed(host, allow_hosts.map((x) => x.toLowerCase()))) throw new SecurityError('SECURITY_EGRESS_HOST_DENIED');
  const candidates = net.isIP(host) ? [host] : resolved_addresses;
  if (!allow_private && candidates.some(isPrivateIp)) throw new SecurityError('SECURITY_EGRESS_PRIVATE_DENIED');
  if (!net.isIP(host) && resolved_addresses.length === 0) throw new SecurityError('SECURITY_EGRESS_DNS_EVIDENCE_REQUIRED');
  return deepFreeze({ decision: 'ALLOW', normalized_url: u.toString(), host, resolved_addresses: [...resolved_addresses] });
}
export function validateRedirectTarget(previous, next, policy) { const a = new URL(previous); const result = evaluateEgressTarget({ ...policy, url: next }); const b = new URL(result.normalized_url); if (a.protocol === 'https:' && b.protocol !== 'https:') throw new SecurityError('SECURITY_EGRESS_DOWNGRADE_DENIED'); return result; }
export { isPrivateIp };
