# TASK-021 — Protected Trust Key ACL Correction Judge Decision

## Decision

`PASS_IMPLEMENTATION_READY_FOR_AUTHORIZED_REAL_ACL_REPAIR_AND_DRAFT_CHECKPOINT`

- Critical blockers: `0`.
- High blockers: `0`.
- Authority compliance: `PASS`.
- Forbidden effects before decision: `NONE`.
- Real ACL repair: `GO`.

## Basis

- Critic Round 1: `PASS / 0C / 0H / 0M / 0L`.
- Critic Round 2: `PASS / 0C / 0H / 0M / 1L`; accepted because `SeBackupPrivilege` exists only in the dedicated child process used by the official runbook.
- Critic Round 3: `PASS / 0C / 0H / 0M / 0L`.
- Windows focused: `17 / 17 PASS`, including PowerShell 5.1.
- WSL2 ext4 full regression: `1550 total / 1535 PASS / 0 FAIL / 15 Windows-only SKIP`.
- Real zero-ACE `PreflightOnly`: four single-hardlink checks, all safety checks, content read `NO`, mutation `0`.
- Canonical Document Registry: old false usability PASS revoked; corrective artifacts registered and verified.

## Conditions applied to the approved execution

The repair had to revalidate branch, PR #36 baseline and repair-script SHA-256 `e81c96d494202bc63b25c73991f509cec2528e270b37e9f5e81a1c38f4426d1e`, execute only exact `C:\key` from an Administrator child process, immediately run non-elevated `-VerifyOnly`, retain only sanitized Evidence and stop without Consumer mutation on any failure.

Those conditions were met. The subsequent implementation Evidence records `ACL_REPAIR_PASS`, `ACL_VERIFICATION_PASS`, exact `9 / 9` ACLs, `4 / 4` handle checks and `PRIVATE_KEY_CONTENT_READ=NO`.

## Remaining authority boundary

Draft PR creation is authorized. PR Ready conversion and protected-main merge require a new Owner Gate. Consumer Canonical mutation, TASK-001 revision 14/15, queue activation, Release, Deploy, Tag, Production Activation, native/paid provider actions, credential addition and destructive operations remain outside this decision.
