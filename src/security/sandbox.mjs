import { SecurityError } from './errors.mjs';
import { deepFreeze } from './util.mjs';
import { normalizeRelativePath } from './path.mjs';

const CAPABILITIES = new Set(['FILESYSTEM_READ','FILESYSTEM_WRITE','NETWORK','PROCESS','ENV_READ','SECRET_READ']);
export function createSandboxPolicy({ capabilities = [], read_roots = [], write_roots = [], env_allow = [], network_allow_hosts = [], max_runtime_ms = 30000 } = {}) {
  const caps = [...new Set(capabilities.map(String))].sort();
  if (caps.some((c)=>!CAPABILITIES.has(c))) throw new SecurityError('SECURITY_SANDBOX_CAPABILITY_INVALID');
  if (!Number.isSafeInteger(max_runtime_ms) || max_runtime_ms < 1) throw new SecurityError('SECURITY_SANDBOX_RUNTIME_INVALID');
  return deepFreeze({
    sandbox_policy_version:'1.0.0', capabilities:caps,
    read_roots:read_roots.map(normalizeRelativePath), write_roots:write_roots.map(normalizeRelativePath),
    env_allow:[...new Set(env_allow.map(String))].sort(), network_allow_hosts:[...new Set(network_allow_hosts.map((x)=>String(x).toLowerCase()))].sort(),
    max_runtime_ms
  });
}
export function authorizeSandboxAction(policy, { capability, path = null, env_key = null, host = null } = {}) {
  if (!policy?.capabilities?.includes(capability)) throw new SecurityError('SECURITY_SANDBOX_CAPABILITY_DENIED');
  if (path) {
    const rel = normalizeRelativePath(path);
    const roots = capability === 'FILESYSTEM_WRITE' ? policy.write_roots : policy.read_roots;
    if (!roots.some((r)=>rel === r || rel.startsWith(`${r}/`))) throw new SecurityError('SECURITY_SANDBOX_PATH_DENIED');
  }
  if (env_key && !policy.env_allow.includes(env_key)) throw new SecurityError('SECURITY_SANDBOX_ENV_DENIED');
  if (host && !policy.network_allow_hosts.includes(String(host).toLowerCase())) throw new SecurityError('SECURITY_SANDBOX_NETWORK_DENIED');
  return true;
}
