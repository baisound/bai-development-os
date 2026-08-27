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
Set-Location 'C:\Users\user\.codex\worktrees\7254\os'
powershell.exe -NoProfile -ExecutionPolicy Bypass -File '.\tasks\TASK-021\new-bai-voice-task001-trust-keys.ps1' -KeyRoot 'C:\key'
```

Expected final line: `KEY_PROVISIONING_PASS`. The command generates four distinct key pairs, performs an Ed25519 sign/verify self-test before and after writing, removes inherited permissions from the new private subtree and grants full control only to the existing Private-directory owner, Local System and local Administrators.

The command is deliberately non-idempotent: a second run fails instead of overwriting or rotating keys.

## Safe verification — public metadata only

Paste this block after a successful generation:

```powershell
$privateRoot = 'C:\key\Private\bai-voice-app-task-001'
$publicRoot = 'C:\key\Public\bai-voice-app-task-001'
Write-Output ('PRIVATE_KEY_COUNT=' + @(Get-ChildItem -LiteralPath $privateRoot -Recurse -File -Filter '*.pem').Count)
Write-Output ('PUBLIC_KEY_COUNT=' + @(Get-ChildItem -LiteralPath $publicRoot -Recurse -File -Filter '*.pem').Count)
Get-Acl -LiteralPath $privateRoot | Format-List Owner,AccessToString
Get-Content -LiteralPath (Join-Path $publicRoot 'trust-manifest.json')
```

Expected counts are `4` and `4`. Displaying the public manifest is safe. Never run `Get-Content` against the Private directory.

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

## Execution record — 2026-08-27

- Result: `KEY_PROVISIONING_PASS`.
- Private key count: `4`.
- Public key count: `4`.
- Private ACL owner: `PC-BAIS\user`.
- Private ACL inheritance: protected/disabled.
- Explicit private ACL principals: `PC-BAIS\user`, `NT AUTHORITY\SYSTEM`, `BUILTIN\Administrators`; all `FullControl`, none inherited.
- Normal Codex sandbox read attempt: `ACCESS_DENIED` as expected after ACL hardening.
- Generator syntax: Node `--check` PASS; PowerShell parser PASS.
- Existing-target negative test: `OVERWRITE_REJECTION_PASS`, exit code `1`; no key was overwritten or rotated.
- Public manifest: `C:\key\Public\bai-voice-app-task-001\trust-manifest.json`.
- Owner public SPKI SHA-256: `sha256:9f9601c9ed74dea45421dc3f0ddf44288293b05896a1f52ed086bb9a4827aa11`.
- Verifier public SPKI SHA-256: `sha256:59d91de302926d8a2ec139a3b991e9cc963bcc39023ca9862f038470fbba1d3c`.
- Canonical Store public SPKI SHA-256: `sha256:193b7a6d7ea934b4b2571b47cf74de8208458226185d5137942f901656eea59f`.
- Snapshot Coordinator public SPKI SHA-256: `sha256:61c8f9dfedef49873fb36894a2ea8622d327b7953250a8ae47b53fbad9bd1547`.

No existing file was overwritten. No private material was printed, committed, copied to the Consumer or sent to another task.
