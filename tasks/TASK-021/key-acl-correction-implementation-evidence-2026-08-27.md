# TASK-021 — Protected Trust Key ACL Correction Implementation Evidence

## Decision and scope

- Amendment: `TASK-021-ACL-CORRECTION-AMENDMENT-001`.
- Result: `ACL_CORRECTION_IMPLEMENTATION_PASS`.
- Baseline: protected main `37aabafdf503d5f02dd5c4d09d27c82db1b74349` (PR #36 merge).
- Branch: `codex/task-021-key-acl-correction`.
- OS version: `1.2.0`.
- Repair script SHA-256: `e81c96d494202bc63b25c73991f509cec2528e270b37e9f5e81a1c38f4426d1e`.
- Exact real target: `C:\key\Private\bai-voice-app-task-001`, four role directories and their four existing `key.ed25519.pkcs8.pem` files; nine ACL objects total.

No private-key content was read, displayed, copied, hashed or committed. No key was generated, rotated, replaced or deleted. No public-key artifact or Consumer Canonical state was changed.

## Pre-mutation proof

An Administrator-only dedicated child PowerShell ran `-PreflightOnly`. It enabled the token's already-assigned `SeBackupPrivilege` solely for Win32 `FILE_READ_ATTRIBUTES | FILE_FLAG_BACKUP_SEMANTICS` metadata handles. The result was:

- `HARDLINK_ELEVATED_METADATA`: `4 / 4` keys;
- exact single-hardlink result: `4 / 4`;
- `ACL_PREFLIGHT_PASS`;
- `PRIVATE_KEY_CONTENT_READ=NO`;
- ACL mutation during preflight: `0`.

The preflight also completed exact closed-topology, reparse-point, owner, explicit-deny and extra-principal checks before permitting repair.

## Real ACL-only correction

The same hash-checked script was executed from a dedicated Administrator child process after three Critic rounds and the independent Implementation Judge returned GO.

- process exit: `0`;
- `ACL_VERIFIED`: `9 / 9`;
- `READ_HANDLE_VERIFIED`: `4 / 4`;
- terminal marker: `ACL_REPAIR_PASS`;
- content marker: `PRIVATE_KEY_CONTENT_READ=NO`.

The final ACL on every object is protected and has exactly three explicit, non-inherited, deny-free Allow rules:

- existing `C:\key\Private` owner SID `S-1-5-21-2766638347-3437810110-1407032029-1001`: `FullControl`;
- Local System `S-1-5-18`: `FullControl`;
- local Administrators `S-1-5-32-544`: `FullControl`.

Directory rules have `ObjectInherit | ContainerInherit`, propagation `None`. File rules have inheritance `None`, propagation `None`. No extra principal or deny rule exists.

## Independent post-repair verification

Normal, non-elevated `-VerifyOnly` completed with:

- `ACL_VERIFIED`: `9 / 9`;
- `READ_HANDLE_VERIFIED`: `4 / 4`;
- `ACL_VERIFICATION_PASS`;
- `PRIVATE_KEY_CONTENT_READ=NO`.

A separate `Get-Acl` oracle independently enumerated every object. All nine reported `protected=true`, `rule_count=3`, owner SID equal to the Private-base owner, rights numeric value `2032127` (`FullControl`), `type=Allow`, `inherited=false`, expected inheritance flags and propagation `0`. Each of the four file handles opened with `FileAccess.Read` and was disposed without a byte read.

## Regression Evidence

- Windows focused ACL suite: `17 / 17 PASS`, skip `0`.
- Windows PowerShell 5.1 repair and VerifyOnly parity: `PASS`.
- Legacy `/T + (OI)(CI)` zero-ACE defect fixture: reproduced and rejected without mutation.
- Negative coverage: noncanonical root, unexpected topology, reparse point, hardlink, explicit deny, extra principal, wrong owner, wrong rights, unavailable read handle, injected partial native mutation, no-PASS and convergent rerun.
- WSL2 Ubuntu ext4 full regression: `1550 total / 1535 PASS / 0 FAIL / 15 Windows-only SKIP`.
- Windows-specific skipped full-regression cases are covered by the `17 / 17` focused Windows run.

## Consumer boundary

Read-only post-repair check of `D:\BAI\BAI VOICE APP` found a clean worktree at exact HEAD `415ac2ce1bcc5a38a3bdd366536d7350b3c64c14`, branch `codex/task-001-condition-remediation-2`. TASK-001 remains revision 13; this Amendment performed no Consumer mutation and did not claim revision 14/15 completion or queue activation.

The repaired keys are now ACL-usable, but Consumer closure still requires the authorized runtime to produce and verify the exact revision-bound Owner envelopes, Authority Ledger/history proof, independent verifier attestation, Canonical Store binding, snapshot-coordinator proof, Context Manifests, closure Critic records and Judge record. This Evidence does not fabricate those artifacts.

## Publication gate

Draft PR creation is authorized. Ready conversion and protected-main merge remain a separate Owner Gate. Release, Deploy, Tag, Production Activation, native/paid provider use and Consumer implementation remain unauthorized.
