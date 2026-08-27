# BAI VOICE APP TASK-001 — Protected trust key provisioning runbook

## Why these keys are required

TASK-001 completion changes the Canonical Status and may release dependent Tasks to the autonomous queue. BAI Development OS therefore requires cryptographic proof that:

1. the Owner authorized the exact revision-bound classification or completion operation;
2. a distinct verifier checked the Owner signature, authority epoch, revocation state and Authority Ledger binding;
3. the Canonical Store, rather than a queue projection, produced the completed-task binding; and
4. the snapshot coordinator signed the exact same-project dependency set used by queue recalculation.

Without these proofs, copied JSON, plain chat text or a queue-only completion could impersonate Owner authority. The OS intentionally rejects such input.

## Authorized scope

- Consumer: `D:\BAI\BAI VOICE APP`, TASK-001 only.
- Private root: `C:\key\Private\bai-voice-app-task-001`.
- Public root: `C:\key\Public\bai-voice-app-task-001`.
- Algorithm: Ed25519; private encoding PKCS#8 PEM; public encoding SPKI PEM.
- Four distinct roles: Owner signer, independent verifier, Canonical Store binding signer and snapshot coordinator.
- No existing file is overwritten. The generator stops if any final target already exists.
- No private key content is printed, copied into the repository, included in Evidence or sent to the secretary.
- Product implementation, Native, Download/Install, Release/Deploy/Tag and destructive cleanup remain unauthorized.

## One copy-and-paste command

Open PowerShell as the Windows account that owns `C:\key\Private`, then paste the following block:

```powershell
$osRoot = 'C:\home\baisound\projects\os'
$scriptPath = Join-Path $osRoot 'tasks\TASK-021\new-bai-voice-task001-trust-keys.ps1'
$expectedSha256 = '6ffc1f31dd42c2121468128a4531f9a2225a67bd712f3129b97663279dcd3a55'
if (-not (Test-Path -LiteralPath $scriptPath -PathType Leaf)) { throw "Approved OS script is missing: $scriptPath" }
if ((Get-FileHash -Algorithm SHA256 -LiteralPath $scriptPath).Hash.ToLowerInvariant() -ne $expectedSha256) { throw 'OS key-provisioning script hash mismatch; stop without creating keys.' }
powershell.exe -NoProfile -ExecutionPolicy Bypass -File $scriptPath -KeyRoot 'C:\key'
```

Expected final line: `KEY_PROVISIONING_PASS`. The command generates four distinct key pairs, performs an Ed25519 sign/verify self-test before and after writing, removes inherited permissions from the new private subtree and grants full control only to the existing Private-directory owner, Local System and local Administrators.

The ACL step addresses the private root, each role directory and each private-key file separately. It does not use recursive `/T`; a provisioning PASS is emitted only after every object has exactly the expected protected ACL and all four files permit a read-only handle to be opened and closed without reading their contents.

The command is deliberately non-idempotent: a second run fails instead of overwriting or rotating keys.

## Safe verification — public metadata only

Paste this block after a successful generation:

```powershell
$osRoot = 'C:\home\baisound\projects\os'
$scriptPath = Join-Path $osRoot 'tasks\TASK-021\repair-bai-voice-task001-trust-key-acl.ps1'
$expectedSha256 = 'e81c96d494202bc63b25c73991f509cec2528e270b37e9f5e81a1c38f4426d1e'
if (-not (Test-Path -LiteralPath $scriptPath -PathType Leaf)) { throw "Approved OS verification script is missing: $scriptPath" }
if ((Get-FileHash -Algorithm SHA256 -LiteralPath $scriptPath).Hash.ToLowerInvariant() -ne $expectedSha256) { throw 'OS ACL verification script hash mismatch; stop without touching keys.' }
$privateRoot = 'C:\key\Private\bai-voice-app-task-001'
$publicRoot = 'C:\key\Public\bai-voice-app-task-001'
Write-Output ('PRIVATE_KEY_COUNT=' + @(Get-ChildItem -LiteralPath $privateRoot -Recurse -File -Filter '*.pem').Count)
Write-Output ('PUBLIC_KEY_COUNT=' + @(Get-ChildItem -LiteralPath $publicRoot -Recurse -File -Filter '*.pem').Count)
& $scriptPath -KeyRoot 'C:\key' -VerifyOnly
Get-Content -LiteralPath (Join-Path $publicRoot 'trust-manifest.json')
```

Expected counts are `4` and `4`. Displaying the public manifest is safe. Never run `Get-Content` against the Private directory.

Expected verification markers are nine `ACL_VERIFIED=...` lines, four `READ_HANDLE_VERIFIED=...` lines, `ACL_VERIFICATION_PASS` and `PRIVATE_KEY_CONTENT_READ=NO`. The verification command does not change ACLs and never reads private-key bytes.

## ACL correction for the 2026-08-27 initial provisioning

PR #36's original wrapper incorrectly used `/inheritance:r` and directory-only `(OI)(CI)` grants together with recursive `/T`. BAI VOICE APP preflight correctly found that all four private-key files were protected but had zero rules and the owner provider received `EPERM`. The original `KEY_PROVISIONING_PASS` usability claim is revoked for that execution. No Consumer mutation occurred.

After the separate Owner-approved ACL-only correction implementation has passed review, the existing keys are repaired in place with this copy-and-paste command:

```powershell
$osRoot = 'C:\Users\user\.codex\worktrees\7254\os'
$expectedBranch = 'codex/task-021-key-acl-correction'
$baseline = '37aabafdf503d5f02dd5c4d09d27c82db1b74349'
$scriptPath = Join-Path $osRoot 'tasks\TASK-021\repair-bai-voice-task001-trust-key-acl.ps1'
$expectedSha256 = 'e81c96d494202bc63b25c73991f509cec2528e270b37e9f5e81a1c38f4426d1e'
$identity = [System.Security.Principal.WindowsIdentity]::GetCurrent()
$principal = [System.Security.Principal.WindowsPrincipal]::new($identity)
if (-not $principal.IsInRole([System.Security.Principal.WindowsBuiltInRole]::Administrator)) { throw 'Open PowerShell with Run as administrator, then paste this block again. No ACL was changed.' }
if (-not (Test-Path -LiteralPath $scriptPath -PathType Leaf)) { throw "Approved OS correction script is missing: $scriptPath" }
if ((git -C $osRoot branch --show-current).Trim() -ne $expectedBranch) { throw 'Unexpected OS correction branch; stop without touching keys.' }
git -C $osRoot merge-base --is-ancestor $baseline HEAD
if ($LASTEXITCODE -ne 0) { throw 'OS correction checkout is not based on the approved PR #36 baseline.' }
if ((Get-FileHash -Algorithm SHA256 -LiteralPath $scriptPath).Hash.ToLowerInvariant() -ne $expectedSha256) { throw 'OS ACL correction script hash mismatch; stop without touching keys.' }
powershell.exe -NoProfile -ExecutionPolicy Bypass -File $scriptPath -KeyRoot 'C:\key'
```

This command changes only DACLs on the existing private root, four role directories and four key files. It refuses unexpected layout, deny rules and extra explicit principals. The Administrator requirement exists only so the zero-ACE files' hardlink counts can be queried without changing their ACLs: the script enables the already-assigned `SeBackupPrivilege` and requests only `FILE_READ_ATTRIBUTES` with `FILE_FLAG_BACKUP_SEMANTICS`. Neither metadata path reads key bytes. It does not generate, rotate, delete, display, copy or read private-key content.

After an Owner-authorized merge, do not reuse the branch-check block above. Use the following separate fail-closed template only after replacing the placeholder with the exact corrected merge commit recorded in the correction Evidence. No pull, checkout or merge is implicit.

```powershell
$osRoot = 'C:\home\baisound\projects\os'
$approvedMergeCommit = '<EXACT_CORRECTION_MAIN_MERGE_COMMIT_FROM_EVIDENCE>'
$scriptPath = Join-Path $osRoot 'tasks\TASK-021\repair-bai-voice-task001-trust-key-acl.ps1'
$expectedSha256 = 'e81c96d494202bc63b25c73991f509cec2528e270b37e9f5e81a1c38f4426d1e'
if ($approvedMergeCommit.StartsWith('<')) { throw 'Exact correction merge commit is not recorded yet.' }
if ((git -C $osRoot rev-parse HEAD).Trim() -ne $approvedMergeCommit) { throw 'Persistent OS checkout is not at the approved correction merge commit.' }
if ((Get-FileHash -Algorithm SHA256 -LiteralPath $scriptPath).Hash.ToLowerInvariant() -ne $expectedSha256) { throw 'OS ACL correction script hash mismatch.' }
powershell.exe -NoProfile -ExecutionPolicy Bypass -File $scriptPath -KeyRoot 'C:\key' -VerifyOnly
```

## Generated layout

```text
C:\key\Private\bai-voice-app-task-001\
  owner-signer\key.ed25519.pkcs8.pem
  independent-verifier\key.ed25519.pkcs8.pem
  canonical-store-binding\key.ed25519.pkcs8.pem
  snapshot-coordinator\key.ed25519.pkcs8.pem

C:\key\Public\bai-voice-app-task-001\
  owner-signer\key.ed25519.spki.pem
  independent-verifier\key.ed25519.spki.pem
  canonical-store-binding\key.ed25519.spki.pem
  snapshot-coordinator\key.ed25519.spki.pem
  trust-manifest.json
```

## Runtime use boundary

- The Owner signer private key signs two distinct envelopes: revision-13 `TASK_CLASSIFICATION`, then revision-14 `DESIGN_ONLY_CLOSURE`. Never reuse an envelope, approval ID or preparation.
- The independent verifier private key is used only by the verifier step after inspecting the exact Owner envelope and Authority Ledger state. It must not be used by the Owner-signing step.
- The Canonical Store private key signs only short-lived `readVerifiedCanonical()` bindings.
- The snapshot coordinator private key signs only the exact verified-binding member manifest used by dependency and queue recalculation.
- Runtime code receives key handles/KeyObjects. Private PEM text must never enter request JSON, logs, receipts, Context Manifests or Git.

Key creation alone does not complete TASK-001. Before revision 14/15 mutation, the protected operation must also create and verify the Authority Ledger coordinate/history proof, separate signed Owner envelopes, independent verifier attestations, current Context Manifests, three closure Critic artifacts and the Judge artifact. Any mismatch remains fail-closed.

## Failure handling

- If the command reports an existing target, stop. Do not delete, rename or overwrite it until its origin is reviewed.
- If key generation succeeds but ACL hardening fails, do not use the keys. Record the output without private content and repair permissions under separate review.
- If counts or self-test fail, do not create replacement keys automatically and do not run Consumer mutation.

## Superseded execution record — 2026-08-27

- Original result: `KEY_PROVISIONING_PASS` — **revoked for post-hardening usability because file ACL verification was absent**.
- Private key count: `4`.
- Public key count: `4`.
- Private ACL owner: `PC-BAIS\user`.
- Private root and role-directory ACL inheritance: protected/disabled.
- Private root and role-directory explicit principals: `PC-BAIS\user`, `NT AUTHORITY\SYSTEM`, `BUILTIN\Administrators`; all `FullControl`, none inherited.
- Four private-key files before correction: protected/disabled, explicit rule count `0`; owner-provider usability `EPERM`.
- Normal Codex sandbox read attempt: `ACCESS_DENIED` as expected after ACL hardening.
- Generator syntax: Node `--check` PASS; PowerShell parser PASS.
- Existing-target negative test: `OVERWRITE_REJECTION_PASS`, exit code `1`; no key was overwritten or rotated.
- Public manifest: `C:\key\Public\bai-voice-app-task-001\trust-manifest.json`.
- Owner public SPKI SHA-256: `sha256:9f9601c9ed74dea45421dc3f0ddf44288293b05896a1f52ed086bb9a4827aa11`.
- Verifier public SPKI SHA-256: `sha256:59d91de302926d8a2ec139a3b991e9cc963bcc39023ca9862f038470fbba1d3c`.
- Canonical Store public SPKI SHA-256: `sha256:193b7a6d7ea934b4b2571b47cf74de8208458226185d5137942f901656eea59f`.
- Snapshot Coordinator public SPKI SHA-256: `sha256:61c8f9dfedef49873fb36894a2ea8622d327b7953250a8ae47b53fbad9bd1547`.

No existing file was overwritten. No private material was printed, committed, copied to the Consumer or sent to another task.

The corrected ACL execution result is recorded separately in `key-acl-correction-implementation-evidence-2026-08-27.md`; it must not be inferred until that Evidence exists and passes review.

## Corrected ACL execution record — 2026-08-27

- Result: `ACL_CORRECTION_IMPLEMENTATION_PASS`.
- Elevated read-only preflight: four single-link metadata checks, `ACL_PREFLIGHT_PASS`, ACL mutation `0`, private content read `NO`.
- Real repair: `ACL_REPAIR_PASS`, exact ACL `9 / 9`, read-handle open/close `4 / 4`, private content read `NO`.
- Normal post-repair verification: `ACL_VERIFICATION_PASS`, exact ACL `9 / 9`, read-handle open/close `4 / 4`.
- Independent oracle: every object protected; exact three non-inherited Allow `FullControl` rules for Private-base owner, System and Administrators; no deny or extra principal; directory/file inheritance flags exact.
- Windows focused: `17 / 17 PASS`; WSL2 ext4 full: `1550 total / 1535 PASS / 0 FAIL / 15 Windows-only SKIP`.
- Consumer: clean HEAD `415ac2ce1bcc5a38a3bdd366536d7350b3c64c14`, revision 13, no mutation.

This correction makes the existing protected key providers ACL-usable. It does not itself create the signed Owner envelopes, independent verifier attestation, Authority Ledger proof, Canonical Store binding or snapshot-coordinator proof required for Consumer TASK-001 closure.
