# TASK-018 Phase G — Post-W2 Conversation-free Restart Bootstrap

- Date: `2026-08-14`
- Status: `READY_FOR_INDEPENDENT_FRESH_RUN`
- Consumer: `baisound/bai_video_production`
- Consumer checkout: `D:\BAI\TASK007`
- Expected Consumer branch: `feature/task-036-phase-g-w2`
- Expected Consumer HEAD: `b30da2298a47cad49d650133b6ab2ccf78f11c29`
- Consumer PR: `https://github.com/baisound/bai_video_production/pull/20`
- Latest formal release: `0.19.0`

## Independence requirement

This bootstrap is for a new Codex task/run that has no access to the originating chat history. The fresh run must not be given a prose summary copied from that conversation. Repository state, this bootstrap and the referenced durable Evidence are the only task facts.

## Minimum loading order

1. BAI Development OS `registry/current-state.md`.
2. BAI Development OS `registry/ai-context-pack.md`.
3. This bootstrap.
4. Read-only Git/GitHub verification for both repositories.
5. Consumer `docs/ai-team/current-state.md` (`sha256:42ba1f77d310102e4eebe54155d266e7e88f3523d3a9209bb35632cdb7729b3c`, estimated `3,284` tokens).
6. Consumer W0/W1 parking decision (`sha256:77225d46d4ab077605f726b93fff5ef4a4917b55a18a7566338769cf9624bfa7`, estimated `849` tokens).
7. Consumer W2 runtime binding report (`sha256:dcf5035ee7ffa6a3e3453647b35be3262cabc38f4f9ab57592345f629094e993`, estimated `1,232` tokens).
8. Machine Evidence only if the reports or current external state conflict:
   - W0/W1 parking Evidence `sha256:e1d82b2070cdf115cb8ffb459ecfbe21768ee5a7a37119aeb72ab52787a2322c` (`635` estimated tokens);
   - W2 packaged native Evidence `sha256:eeb7f233541e772b77646a5ac29690fe88e80bc72460893f4cfff98807ac39f9` (`665` estimated tokens).

Do not load the full Consumer Roadmap or `PROJECT.md` unless a conflict requires them. Their current hashes are respectively `sha256:6f0dcda9726a3cdc6aa99fe6b540fbafc288a9c6cc4109e956b193638d45a4bc` and `sha256:685906a004f4e402640dd161169c1bce6eb6c787e244d91bc4e82a0aa03c6698`.

## Expected independent reconstruction

The fresh run must independently recover and verify:

- TASK-010/011/012 native gates are PASS;
- TASK-036 W2 is `PACKAGED_NATIVE_E2E_PASS`;
- the W0/W1 remainder is `PARTIAL / PARKED_TO_PHASE_H2`, not PASS;
- overall TASK-036 `NATIVE_VALIDATED` and `MINIMUM_EDITING_PRODUCT_MVP_PASS` remain unclaimed;
- Consumer PR #20 is not merged unless GitHub now proves otherwise;
- package/latest formal release remains `0.19.0` unless the repository now proves otherwise;
- no tag or GitHub Release after `v0.19.0` may be assumed;
- the next safe unit is final Context Cost comparison and exact release decision only after this restart audit passes.

## Required first action and Evidence

The fresh run performs a harmless read-only verification of Consumer branch, HEAD, status, PR state/checks, package version and latest release. It then writes BAI Development OS restart Evidence containing:

- new task/run identity;
- exact sources loaded and their hashes;
- expected versus recovered state;
- first read-only action and result;
- estimated/provider/cached/output/billed token fields kept distinct;
- PASS/FAIL with no hidden dependence on the old conversation.

No Consumer mutation, merge, release metadata edit, tag, GitHub Release, paid execution, Deploy or Production Activation is authorized by this bootstrap.
