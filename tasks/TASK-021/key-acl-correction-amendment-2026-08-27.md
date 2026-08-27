# TASK-021 — Protected Trust Key ACL Correction Amendment

## Identity and authority

- Amendment ID: `TASK-021-ACL-CORRECTION-AMENDMENT-001`.
- Parent Task: `TASK-021 / BAI-OS-DESIGN-ONLY-CLOSURE-001` remains completed; this Amendment corrects only its later Consumer key-provisioning procedure and Evidence.
- Priority: `P0 / OWNER_DIRECTED_CORRECTION`.
- Baseline: protected main `37aabafdf503d5f02dd5c4d09d27c82db1b74349` (PR #36 merge).
- Branch: `codex/task-021-key-acl-correction`.
- Status: `ACL_CORRECTION_IMPLEMENTATION_PASS / DRAFT_PR_AUTHORIZED / READY_AND_MERGE_NOT_AUTHORIZED`.

The Owner explicitly allocated this correction after BAI VOICE APP read-only preflight found that the four existing `key.ed25519.pkcs8.pem` files were protected but had zero access rules. The Owner authorized ACL-only repair of exactly the existing TASK-001 private root, four role directories and four private-key files, plus OS script, test, runbook and Evidence correction. The Owner did not authorize private-key content reads, display or copying; key generation, rotation or deletion; Consumer Canonical mutation; PR Ready conversion; merge; Release, Deploy or Tag.

## Confirmed defect

The PR #36 wrapper combined recursive `icacls /T`, `/inheritance:r` and directory-only `(OI)(CI)` grants. The recursive operation removed inherited access rules from each file, while the inheritance flags did not grant the file itself. The wrapper then checked only command exit status and file count. Its generator post-write cryptographic self-test ran before ACL hardening. Therefore the resulting `KEY_PROVISIONING_PASS` did not prove post-hardening private-file usability.

The Consumer correctly failed closed with owner-provider `EPERM`. Its repository remained clean at checkpoint `415ac2ce1bcc5a38a3bdd366536d7350b3c64c14`, TASK-001 revision 13, and no Canonical mutation occurred.

## Authorized design

1. Preserve the four existing key files. Do not open or read their contents during ACL repair.
2. Refuse unexpected directories, files, explicit deny rules or explicit principals outside the exact allowlist.
3. Require every private-key file to have exactly one hardlink before any ACL mutation. Normal files use a zero-access Win32 metadata handle. A protected zero-ACE file is queried only from an Administrator PowerShell after enabling its assigned `SeBackupPrivilege`, using `FILE_READ_ATTRIBUTES | FILE_FLAG_BACKUP_SEMANTICS`; a non-elevated process fails closed and requests elevation. Neither path changes the DACL or reads private-key bytes. `-PreflightOnly` stops after topology, identity and all-nine-object ACL safety checks without mutation.
4. Address each of nine objects individually: the private root, four role directories and four private-key files. Never use recursive `/T` or continue-on-error `/C`.
5. Disable inheritance and grant exactly three explicit allow rules:
   - existing `C:\key\Private` owner: `FullControl`;
   - Local System (`S-1-5-18`): `FullControl`;
   - local Administrators (`S-1-5-32-544`): `FullControl`.
6. Directory rules use `ContainerInherit | ObjectInherit`; file rules use no inheritance flags. Every object must be protected, non-inherited, deny-free and free of extra principals.
7. After ACL verification, open and close a read-only `FileStream` handle for each private-key file without reading bytes. No private text or derived private value may be emitted.
8. Provide a `-VerifyOnly` mode that performs all checks and read-handle validation without changing ACLs.
9. Reproduce the old zero-ACE defect with non-secret temporary fixtures, prove non-elevated fail-closed/no-mutation behavior, and test the corrected normal-fixture path, partial-mutation failure convergence and Windows PowerShell 5.1 parity. Real zero-ACE hardlink preflight and repair require the separately evidenced elevated invocation.
10. Provisioning PASS is allowed only after the exact post-hardening verification succeeds. Failure remains fail-closed and forbids Consumer mutation.

## Allowed repository files

- `package.json`
- `tasks/TASK-021/new-bai-voice-task001-trust-keys.ps1`
- `tasks/TASK-021/repair-bai-voice-task001-trust-key-acl.ps1`
- `tasks/TASK-021/consumer-protected-trust-key-provisioning-runbook-2026-08-27.md`
- this Amendment and its Critic, Judge and implementation Evidence records
- `tests/security/task021-key-acl-provisioning.test.mjs`
- `registry/current-state.md`, `registry/ai-context-pack.md`, `registry/document-registry.yaml`

No lifecycle Core, Consumer repository or secret file is in the allowed-file set.

## Validation and publication gates

- Windows negative fixture and repaired fixture focused tests.
- PowerShell and Node syntax checks.
- Security focused regression and necessary full OS regression.
- Three Critic rounds with unresolved Critical/High `0/0`, followed by independent Judge PASS.
- Existing-key ACL-only repair and `-VerifyOnly` Evidence after the implementation has passed pre-mutation review.
- Draft PR creation is authorized. Ready conversion and protected-main merge require a new Owner Gate.

## Rollback and recovery

The repair is repeatable and converges only the nine authorized DACLs to the same exact allowlist. Hardlink preflight is read-only and occurs before any final ACL mutation. A partial final mutation does not authorize key replacement or Consumer execution; rerun the same ACL-only repair after resolving the reported path. Restoring the known-broken zero-ACE state is not a valid rollback. Repository rollback is an ordinary revert of this Amendment after review; it must not modify `C:\key` or imply that the previously invalid Evidence becomes true.

## Implementation outcome

Three Critic rounds reached unresolved Critical/High `0/0`, and the independent Implementation Judge authorized real repair. Elevated `PreflightOnly`, exact-nine ACL repair, normal `VerifyOnly`, an independent ACL oracle, Windows focused `17/17` and WSL2 ext4 full `1550 total / 0 fail` all passed. The four existing keys were preserved and no private bytes were read. The Consumer remained clean at revision 13. Draft PR publication is the only remaining action within this Amendment's current authority; Ready conversion and merge remain separately gated.
