# TASK-021 Owner sleep operation procedure and activity record

## Applied instruction

Owner instruction received through the BAI Development OS delegation:

- `OWNER_SLEEPING=YES`
- Draft PR creation does not require another Owner confirmation.
- Computer operation is authorized.
- Installation and download are authorized.
- Any installation, download, setting or operation must be documented here and sent to the BAI Development OS secretary.

This authority does not authorize protected-main direct push, force push, release, deployment, tag, Product native/model execution, credential creation, paid provider use, Production Activation or destructive operations.

## Operations performed

1. Used isolated Codex worktree `C:\Users\user\.codex\worktrees\7254\os` and branch `codex/task-021-design-only-closure` from remote-main baseline `8e13c81a986adbe41be7cfa6f4ffa8bb72ab40fc`.
2. Read the primary OS checkout/worktree inventory and preserved the separate TASK-017 checkout and its unknown changes.
3. Ran Windows focused Node tests in the isolated worktree.
4. Used WSL2 Ubuntu to copy source into fixed `/tmp` validation directories and execute tests on ext4. The first source-only copy exposed that Git-evidence regression tests require real repository metadata.
5. Created local, non-network Git clone `/tmp/task021-full-git-20260827-04` from the existing read-only OS repository, checked out baseline `8e13c81a986adbe41be7cfa6f4ffa8bb72ab40fc`, then overlaid the isolated TASK-021 worktree while preserving `.git`. This was a temporary validation clone only; it did not change either canonical checkout or any remote.
6. Ran the focused lifecycle/queue/dependency suite and the full repository regression in that ext4 Git clone. No package installation or download was performed; existing Node/npm, Git objects and repository contents were used.
7. Read BAI VOICE APP git identity/status without mutation and resolved `415ac2c` to `415ac2ce1bcc5a38a3bdd366536d7350b3c64c14`.
8. Created and edited TASK-021 code, schemas, tests and evidence only in the isolated OS worktree.
9. Created a second local validation clone `/tmp/task021-full-git-20260827-05` after the first temporary clone lost Git metadata during repeated validation. It was checked against the same baseline, received a non-deleting source overlay, and was used only for the final full regression.
10. Created replacement local validation clones `-06`, `-07` and `-08` when WSL `/tmp` cleanup removed earlier clones between bounded validation commands. Each used the same exact baseline and a non-deleting source overlay excluding `.git`; no canonical checkout or remote was changed.
11. Ran the final latest-diff validation in clone `-08`: ext4 focused `145/145 PASS` and full regression `1533/1533 PASS`. Re-ran the focused suite to capture its exact aggregate count.

## Settings changed

- Candidate package version changed from `1.1.0` to `1.2.0` in the TASK-021 branch to identify the additive lifecycle API. No tag, release or deployment was created.
- No operating-system, application, credential, provider, production or Consumer setting was changed.

## Remaining authorized operations

1. Commit explicit TASK-021 paths only, using a Japanese commit message.
2. Push only `codex/task-021-design-only-closure` and create a Draft PR in Japanese. Do not merge protected main.
3. Send this procedure and final outcome to the BAI Development OS secretary.

Completed assurance: three independent implementation Critics returned Critical/High `0/0`, and the independent Judge returned `PASS_IMPLEMENTATION_READY_FOR_CHECKPOINT`.

## Recovery and cleanup

- The isolated worktree remains the recoverable source until PR disposition.
- Temporary WSL `/tmp/task021-*` validation copies may be removed only after verifying their resolved absolute paths. Their removal does not affect either canonical checkout.
- Branch rollback before merge is by PR closure or a new corrective commit; no `reset --hard` or force push is permitted.
- Consumer execution waits for an exact approved main merge commit and the runbook preconditions.
