import assert from 'node:assert/strict';
import {
  existsSync,
  linkSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const repairScript = path.join(repositoryRoot, 'tasks', 'TASK-021', 'repair-bai-voice-task001-trust-key-acl.ps1');
const provisioningScript = path.join(repositoryRoot, 'tasks', 'TASK-021', 'new-bai-voice-task001-trust-keys.ps1');
const roles = [
  'owner-signer',
  'independent-verifier',
  'canonical-store-binding',
  'snapshot-coordinator',
];

function powerShellLiteral(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

function runPowerShell(command) {
  return spawnSync('pwsh.exe', ['-NoProfile', '-NonInteractive', '-Command', command], {
    encoding: 'utf8',
    windowsHide: true,
  });
}

function currentTokenIsAdministrator() {
  const command = `$identity = [System.Security.Principal.WindowsIdentity]::GetCurrent(); $principal = [System.Security.Principal.WindowsPrincipal]::new($identity); $principal.IsInRole([System.Security.Principal.WindowsBuiltInRole]::Administrator)`;
  const result = runPowerShell(command);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.trim().toLowerCase() === 'true';
}

function runRepair(root, verifyOnly = false, allowTestRoot = true, engine = 'pwsh.exe', testFailMutationAt = 0, testExpectedOwnerSid = '') {
  const powershellArguments = [
    '-NoProfile',
    '-NonInteractive',
    '-File',
    repairScript,
    '-KeyRoot',
    root,
  ];
  if (verifyOnly) powershellArguments.push('-VerifyOnly');
  if (allowTestRoot) powershellArguments.push('-AllowTestRoot');
  if (testFailMutationAt > 0) powershellArguments.push('-TestFailMutationAt', String(testFailMutationAt));
  if (testExpectedOwnerSid) powershellArguments.push('-TestExpectedOwnerSid', testExpectedOwnerSid);
  return spawnSync(engine, powershellArguments, { encoding: 'utf8', windowsHide: true });
}

function runPreflight(root, engine = 'pwsh.exe') {
  return spawnSync(engine, [
    '-NoProfile',
    '-NonInteractive',
    '-File',
    repairScript,
    '-KeyRoot',
    root,
    '-PreflightOnly',
    '-AllowTestRoot',
  ], { encoding: 'utf8', windowsHide: true });
}

function aclSddl(target) {
  const result = runPowerShell(`(Get-Acl -LiteralPath ${powerShellLiteral(target)}).Sddl`);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.trim();
}

function restoreFixtureInheritance(privateTarget) {
  const result = runPowerShell(`& icacls.exe ${powerShellLiteral(privateTarget)} '/reset' '/T' '/C' '/Q'; exit $LASTEXITCODE`);
  assert.equal(result.status, 0, result.stderr || result.stdout);
}

function aclSnapshot(privateTarget) {
  const targets = [
    { label: 'private-root', target: privateTarget, directory: true },
    ...roles.flatMap((role) => [
      { label: `role:${role}`, target: path.join(privateTarget, role), directory: true },
      { label: `key:${role}`, target: path.join(privateTarget, role, 'key.ed25519.pkcs8.pem'), directory: false },
    ]),
  ];
  const serializedTargets = targets.map(({ label, target, directory }) => (
    `[pscustomobject]@{ Label=${powerShellLiteral(label)}; Path=${powerShellLiteral(target)}; IsDirectory=$${directory} }`
  )).join(',');
  const command = [
    `$targets = @(${serializedTargets})`,
    `$rows = foreach ($target in $targets) { $acl = Get-Acl -LiteralPath $target.Path; $ownerSid = ([System.Security.Principal.NTAccount]$acl.Owner).Translate([System.Security.Principal.SecurityIdentifier]).Value; $rules = @($acl.GetAccessRules($true, $true, [System.Security.Principal.SecurityIdentifier]) | Sort-Object { $_.IdentityReference.Value } | ForEach-Object { [pscustomobject]@{ sid=$_.IdentityReference.Value; rights=[int64]$_.FileSystemRights; type=$_.AccessControlType.ToString(); inherited=$_.IsInherited; inheritance=[int]$_.InheritanceFlags; propagation=[int]$_.PropagationFlags } }); [pscustomobject]@{ label=$target.Label; directory=$target.IsDirectory; owner_sid=$ownerSid; protected=$acl.AreAccessRulesProtected; sddl=$acl.Sddl; rules=$rules } }`,
    `$rows | ConvertTo-Json -Depth 6 -Compress`,
  ].join('; ');
  const result = runPowerShell(command);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout.trim().split(/\r?\n/u).at(-1));
}

function privateBaseOwnerSid(privateTarget) {
  const privateBase = path.dirname(privateTarget);
  const command = `([System.Security.Principal.NTAccount](Get-Acl -LiteralPath ${powerShellLiteral(privateBase)}).Owner).Translate([System.Security.Principal.SecurityIdentifier]).Value`;
  const result = runPowerShell(command);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.trim();
}

function assertExactAclSnapshot(rows, privateTarget) {
  assert.equal(rows.length, 9);
  const ownerSid = privateBaseOwnerSid(privateTarget);
  const expectedSids = [ownerSid, 'S-1-5-18', 'S-1-5-32-544'].sort();
  for (const row of rows) {
    assert.equal(row.protected, true, row.label);
    assert.equal(row.owner_sid, ownerSid, row.label);
    assert.equal(row.rules.length, 3, row.label);
    assert.deepEqual(row.rules.map(({ sid }) => sid).sort(), expectedSids, row.label);
    for (const rule of row.rules) {
      assert.equal(rule.rights, 2032127, row.label);
      assert.equal(rule.type, 'Allow', row.label);
      assert.equal(rule.inherited, false, row.label);
      assert.equal(rule.inheritance, row.directory ? 3 : 0, row.label);
      assert.equal(rule.propagation, 0, row.label);
    }
  }
}

function buildFixture() {
  const root = mkdtempSync(path.join(tmpdir(), 'bai-task021-acl-'));
  const privateBase = path.join(root, 'Private');
  const privateTarget = path.join(privateBase, 'bai-voice-app-task-001');
  mkdirSync(privateTarget, { recursive: true });
  for (const role of roles) {
    const roleDirectory = path.join(privateTarget, role);
    mkdirSync(roleDirectory, { recursive: true });
    writeFileSync(path.join(roleDirectory, 'key.ed25519.pkcs8.pem'), 'NON_SECRET_TEST_FIXTURE\n');
  }
  return { root, privateBase, privateTarget };
}

function startExclusiveFixtureHolder(keyPath) {
  const command = [
    `$handle = [System.IO.File]::Open(${powerShellLiteral(keyPath)}, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::None)`,
    `try { Write-Output 'HOLDER_READY'; [Console]::Out.Flush(); Start-Sleep -Seconds 20 } finally { $handle.Dispose() }`,
  ].join('; ');
  const child = spawn('pwsh.exe', ['-NoProfile', '-NonInteractive', '-Command', command], {
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error(`exclusive holder did not become ready: ${stderr || stdout}`));
    }, 5_000);
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
      if (stdout.includes('HOLDER_READY')) {
        clearTimeout(timeout);
        resolve(child);
      }
    });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    child.once('exit', (code) => {
      if (!stdout.includes('HOLDER_READY')) {
        clearTimeout(timeout);
        reject(new Error(`exclusive holder exited before ready: code=${code} ${stderr || stdout}`));
      }
    });
  });
}

test('provisioning wrapper delegates to the exact ACL repair verifier and does not retain recursive icacls', () => {
  const source = readFileSync(provisioningScript, 'utf8');
  assert.match(source, /repair-bai-voice-task001-trust-key-acl\.ps1/u);
  assert.doesNotMatch(source, /['"]\/T['"]/u);
  assert.doesNotMatch(source, /\(OI\)\(CI\)F[\s\S]*\/T/u);
  assert.match(source, /exact Owner-authorized root/u);
});

test('repair source forbids recursive/continue icacls and never reads private-key bytes', () => {
  const source = readFileSync(repairScript, 'utf8');
  assert.doesNotMatch(source, /['"]\/T['"]/u);
  assert.doesNotMatch(source, /['"]\/C['"]/u);
  assert.doesNotMatch(source, /Get-Content|ReadAll|\.Read\s*\(/u);
  assert.doesNotMatch(source, /&\s+icacls\.exe\b/u);
  assert.match(source, /SpecialFolder\]::System/u);
  assert.match(source, /& \$icaclsPath/u);
  assert.match(source, /SeBackupPrivilege/u);
  assert.match(source, /FILE_FLAG_BACKUP_SEMANTICS/u);
  assert.match(source, /\[System\.IO\.File\]::Open/u);
  assert.match(source, /\.Dispose\(\)/u);
});

test('legacy recursive inheritance removal reproduces the zero-ACE private-file defect', {
  skip: process.platform !== 'win32',
}, () => {
  const fixture = buildFixture();
  try {
    const keyPath = path.join(fixture.privateTarget, roles[0], 'key.ed25519.pkcs8.pem');
    const command = [
      `$owner = (Get-Acl -LiteralPath ${powerShellLiteral(fixture.privateBase)}).Owner`,
      `$arguments = @(${powerShellLiteral(fixture.privateTarget)}, '/inheritance:r', '/grant:r', "${'${owner}'}:(OI)(CI)F", '*S-1-5-18:(OI)(CI)F', '*S-1-5-32-544:(OI)(CI)F', '/T', '/C')`,
      '& icacls.exe @arguments | Out-Null',
      `if ($LASTEXITCODE -ne 0) { throw "legacy icacls fixture failed: $LASTEXITCODE" }`,
      `$acl = Get-Acl -LiteralPath ${powerShellLiteral(keyPath)}`,
      `$rules = @($acl.GetAccessRules($true, $true, [System.Security.Principal.SecurityIdentifier]))`,
      `[pscustomobject]@{ protected = $acl.AreAccessRulesProtected; rule_count = $rules.Count } | ConvertTo-Json -Compress`,
    ].join('; ');
    const result = runPowerShell(command);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const metadata = JSON.parse(result.stdout.trim().split(/\r?\n/u).at(-1));
    assert.equal(metadata.protected, true);
    assert.equal(metadata.rule_count, 0);
    const brokenSddl = aclSddl(keyPath);
    const rejected = runRepair(fixture.root, true);
    assert.notEqual(rejected.status, 0);
    assert.doesNotMatch(rejected.stdout, /ACL_VERIFICATION_PASS/u);
    if (currentTokenIsAdministrator()) {
      const preflight = runPreflight(fixture.root);
      assert.equal(preflight.status, 0, preflight.stderr || preflight.stdout);
      assert.match(preflight.stdout, /HARDLINK_ELEVATED_METADATA/u);
      assert.match(preflight.stdout, /ACL_PREFLIGHT_PASS/u);
    } else {
      assert.match(rejected.stderr, /rerun from an Administrator PowerShell/u);
    }
    assert.equal(aclSddl(keyPath), brokenSddl);
  } finally {
    restoreFixtureInheritance(fixture.privateTarget);
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('production mode rejects a noncanonical KeyRoot before mutation', {
  skip: process.platform !== 'win32',
}, () => {
  const fixture = buildFixture();
  try {
    const before = aclSddl(fixture.privateTarget);
    const rejected = runRepair(fixture.root, false, false);
    assert.notEqual(rejected.status, 0);
    assert.match(rejected.stderr, /exact Owner-authorized root/u);
    assert.equal(aclSddl(fixture.privateTarget), before);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('PreflightOnly proves topology, identity and ACL safety without changing any ACL', {
  skip: process.platform !== 'win32',
}, () => {
  const fixture = buildFixture();
  try {
    const before = aclSnapshot(fixture.privateTarget);
    const preflight = runPreflight(fixture.root);
    assert.equal(preflight.status, 0, preflight.stderr || preflight.stdout);
    assert.match(preflight.stdout, /ACL_PREFLIGHT_PASS/u);
    assert.match(preflight.stdout, /PRIVATE_KEY_CONTENT_READ=NO/u);
    assert.doesNotMatch(preflight.stdout, /ACL_REPAIR_PASS|ACL_VERIFICATION_PASS/u);
    assert.deepEqual(aclSnapshot(fixture.privateTarget), before);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('provisioning rejects a noncanonical KeyRoot before creating any key directory', {
  skip: process.platform !== 'win32',
}, () => {
  const root = mkdtempSync(path.join(tmpdir(), 'bai-task021-provisioning-root-'));
  try {
    const rejected = spawnSync('pwsh.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-File',
      provisioningScript,
      '-KeyRoot',
      root,
    ], { encoding: 'utf8', windowsHide: true });
    assert.notEqual(rejected.status, 0);
    assert.match(rejected.stderr, /exact Owner-authorized root/u);
    assert.equal(existsSync(path.join(root, 'Private')), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('unexpected nested directory is rejected before every ACL mutation', {
  skip: process.platform !== 'win32',
}, () => {
  const fixture = buildFixture();
  try {
    mkdirSync(path.join(fixture.privateTarget, roles[0], 'unexpected-empty'));
    const before = aclSddl(fixture.privateTarget);
    const rejected = runRepair(fixture.root);
    assert.notEqual(rejected.status, 0);
    assert.match(rejected.stderr, /Unexpected private subtree topology/u);
    assert.equal(aclSddl(fixture.privateTarget), before);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('key hardlinks are rejected before ACL mutation', {
  skip: process.platform !== 'win32',
}, () => {
  const fixture = buildFixture();
  try {
    const keyPath = path.join(fixture.privateTarget, roles[0], 'key.ed25519.pkcs8.pem');
    const secondLink = path.join(fixture.root, 'second-link.fixture');
    linkSync(keyPath, secondLink);
    const before = aclSddl(fixture.privateTarget);
    const rejected = runRepair(fixture.root);
    assert.notEqual(rejected.status, 0);
    assert.match(rejected.stderr, /exactly one hardlink/u);
    assert.equal(aclSddl(fixture.privateTarget), before);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('role-directory reparse points are rejected before ACL mutation', {
  skip: process.platform !== 'win32',
}, () => {
  const fixture = buildFixture();
  const external = mkdtempSync(path.join(tmpdir(), 'bai-task021-acl-external-'));
  try {
    const rolePath = path.join(fixture.privateTarget, roles[0]);
    rmSync(rolePath, { recursive: true, force: true });
    writeFileSync(path.join(external, 'key.ed25519.pkcs8.pem'), 'NON_SECRET_TEST_FIXTURE\n');
    symlinkSync(external, rolePath, 'junction');
    const before = aclSddl(fixture.privateTarget);
    const rejected = runRepair(fixture.root);
    assert.notEqual(rejected.status, 0);
    assert.match(rejected.stderr, /Reparse point is forbidden/u);
    assert.equal(aclSddl(fixture.privateTarget), before);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
    rmSync(external, { recursive: true, force: true });
  }
});

test('ACL-only repair gives every directory and key file exactly three protected FullControl allow rules', {
  skip: process.platform !== 'win32',
}, () => {
  const fixture = buildFixture();
  try {
    const keyPaths = roles.map((role) => path.join(fixture.privateTarget, role, 'key.ed25519.pkcs8.pem'));
    const fileEvidenceBefore = keyPaths.map((keyPath) => ({
      content: readFileSync(keyPath, 'utf8'),
      mtimeMs: statSync(keyPath).mtimeMs,
    }));
    const repair = runRepair(fixture.root);
    assert.equal(repair.status, 0, repair.stderr || repair.stdout);
    assert.match(repair.stdout, /ACL_REPAIR_PASS/u);
    assert.match(repair.stdout, /PRIVATE_KEY_CONTENT_READ=NO/u);
    assert.equal((repair.stdout.match(/^ACL_VERIFIED=/gmu) ?? []).length, 9);
    assert.equal((repair.stdout.match(/^READ_HANDLE_VERIFIED=/gmu) ?? []).length, 4);
    const independentSnapshot = aclSnapshot(fixture.privateTarget);
    assertExactAclSnapshot(independentSnapshot, fixture.privateTarget);
    const repeatedRepair = runRepair(fixture.root);
    assert.equal(repeatedRepair.status, 0, repeatedRepair.stderr || repeatedRepair.stdout);
    assert.deepEqual(aclSnapshot(fixture.privateTarget), independentSnapshot);
    const beforeVerifyOnly = aclSnapshot(fixture.privateTarget);
    const verification = runRepair(fixture.root, true);
    assert.equal(verification.status, 0, verification.stderr || verification.stdout);
    assert.match(verification.stdout, /ACL_VERIFICATION_PASS/u);
    assert.deepEqual(aclSnapshot(fixture.privateTarget), beforeVerifyOnly);
    keyPaths.forEach((keyPath, index) => {
      assert.equal(readFileSync(keyPath, 'utf8'), fileEvidenceBefore[index].content);
      assert.equal(statSync(keyPath).mtimeMs, fileEvidenceBefore[index].mtimeMs);
    });
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('late-target extra principal is rejected before any earlier ACL changes', {
  skip: process.platform !== 'win32',
}, () => {
  const fixture = buildFixture();
  try {
    const lateKey = path.join(fixture.privateTarget, roles.at(-1), 'key.ed25519.pkcs8.pem');
    const grant = runPowerShell(`& icacls.exe ${powerShellLiteral(lateKey)} '/grant' '*S-1-5-32-545:R' '/Q'; exit $LASTEXITCODE`);
    assert.equal(grant.status, 0, grant.stderr || grant.stdout);
    const before = aclSnapshot(fixture.privateTarget);
    const rejected = runRepair(fixture.root);
    assert.notEqual(rejected.status, 0);
    assert.match(rejected.stderr, /outside the exact allowlist/u);
    assert.deepEqual(aclSnapshot(fixture.privateTarget), before);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('a partial native mutation failure emits no PASS and a clean rerun converges without changing fixture bytes', {
  skip: process.platform !== 'win32',
}, () => {
  const fixture = buildFixture();
  try {
    const keyPaths = roles.map((role) => path.join(fixture.privateTarget, role, 'key.ed25519.pkcs8.pem'));
    const beforeFiles = keyPaths.map((keyPath) => ({
      content: readFileSync(keyPath, 'utf8'),
      mtimeMs: statSync(keyPath).mtimeMs,
    }));
    const injected = runRepair(fixture.root, false, true, 'pwsh.exe', 5);
    assert.notEqual(injected.status, 0);
    assert.match(injected.stderr, /Injected test-only ACL mutation failure/u);
    assert.doesNotMatch(injected.stdout, /ACL_REPAIR_PASS|ACL_VERIFICATION_PASS/u);
    const converged = runRepair(fixture.root);
    assert.equal(converged.status, 0, converged.stderr || converged.stdout);
    assert.match(converged.stdout, /ACL_REPAIR_PASS/u);
    assertExactAclSnapshot(aclSnapshot(fixture.privateTarget), fixture.privateTarget);
    keyPaths.forEach((keyPath, index) => {
      assert.equal(readFileSync(keyPath, 'utf8'), beforeFiles[index].content);
      assert.equal(statSync(keyPath).mtimeMs, beforeFiles[index].mtimeMs);
    });
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('explicit deny is rejected before any ACL changes', {
  skip: process.platform !== 'win32',
}, () => {
  const fixture = buildFixture();
  try {
    const lateKey = path.join(fixture.privateTarget, roles.at(-1), 'key.ed25519.pkcs8.pem');
    const deny = runPowerShell(`& icacls.exe ${powerShellLiteral(lateKey)} '/deny' '*S-1-5-18:R' '/Q'; exit $LASTEXITCODE`);
    assert.equal(deny.status, 0, deny.stderr || deny.stdout);
    const before = aclSnapshot(fixture.privateTarget);
    const rejected = runRepair(fixture.root);
    assert.notEqual(rejected.status, 0);
    assert.match(rejected.stderr, /explicit deny/u);
    assert.deepEqual(aclSnapshot(fixture.privateTarget), before);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('a target owner differing from the Private base owner is rejected before any ACL changes', {
  skip: process.platform !== 'win32',
}, () => {
  const fixture = buildFixture();
  try {
    const before = aclSnapshot(fixture.privateTarget);
    const rejected = runRepair(fixture.root, false, true, 'pwsh.exe', 0, 'S-1-5-18');
    assert.notEqual(rejected.status, 0);
    assert.match(rejected.stderr, /owner differs from the existing Private directory owner/u);
    assert.deepEqual(aclSnapshot(fixture.privateTarget), before);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('VerifyOnly rejects wrong file rights without changing the ACL', {
  skip: process.platform !== 'win32',
}, () => {
  const fixture = buildFixture();
  try {
    const repair = runRepair(fixture.root);
    assert.equal(repair.status, 0, repair.stderr || repair.stdout);
    const keyPath = path.join(fixture.privateTarget, roles[0], 'key.ed25519.pkcs8.pem');
    const ownerSid = privateBaseOwnerSid(fixture.privateTarget);
    const weaken = runPowerShell(`& icacls.exe ${powerShellLiteral(keyPath)} '/grant:r' "*${ownerSid}:R" '/Q'; exit $LASTEXITCODE`);
    assert.equal(weaken.status, 0, weaken.stderr || weaken.stdout);
    const before = aclSnapshot(fixture.privateTarget);
    const rejected = runRepair(fixture.root, true);
    assert.notEqual(rejected.status, 0);
    assert.doesNotMatch(rejected.stdout, /ACL_VERIFICATION_PASS/u);
    assert.deepEqual(aclSnapshot(fixture.privateTarget), before);
  } finally {
    runRepair(fixture.root);
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('VerifyOnly emits no PASS when a private-file read handle cannot be opened', {
  skip: process.platform !== 'win32',
}, async () => {
  const fixture = buildFixture();
  let holder;
  try {
    const repair = runRepair(fixture.root);
    assert.equal(repair.status, 0, repair.stderr || repair.stdout);
    const keyPath = path.join(fixture.privateTarget, roles[0], 'key.ed25519.pkcs8.pem');
    holder = await startExclusiveFixtureHolder(keyPath);
    const rejected = runRepair(fixture.root, true);
    assert.notEqual(rejected.status, 0);
    assert.doesNotMatch(rejected.stdout, /ACL_VERIFICATION_PASS/u);
  } finally {
    if (holder) {
      holder.kill();
      await once(holder, 'exit').catch(() => {});
    }
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('Windows PowerShell 5.1 repair and VerifyOnly match the supported runbook runtime', {
  skip: process.platform !== 'win32',
}, () => {
  const fixture = buildFixture();
  try {
    const repair = runRepair(fixture.root, false, true, 'powershell.exe');
    assert.equal(repair.status, 0, repair.stderr || repair.stdout);
    const verification = runRepair(fixture.root, true, true, 'powershell.exe');
    assert.equal(verification.status, 0, verification.stderr || verification.stdout);
    assert.match(verification.stdout, /ACL_VERIFICATION_PASS/u);
    assertExactAclSnapshot(aclSnapshot(fixture.privateTarget), fixture.privateTarget);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});
