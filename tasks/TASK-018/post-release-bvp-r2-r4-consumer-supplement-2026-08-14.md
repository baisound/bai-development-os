# TASK-018 Post-release BAI VIDEO PRODUCTION R2-R4 Consumer Supplement

Date: `2026-08-14`

## Decision

`POST_RELEASE_R2_R4_CONSUMER_SUPPLEMENT_ACCEPTED`

TASK-018 remains `COMPLETED`, and BAI Development OS `v1.1.0` remains the immutable published OS result. This append-only supplement does not reopen Phase G, Phase H2 or I1. It updates only the current Consumer development position after the earlier BAI VIDEO PRODUCTION `v0.20.1` release supplement.

## Exact current Consumer identity

- Repository: `baisound/bai_video_production`
- Stable formal release: `v0.20.1`
- Release-code SHA: `c2e12d59f869a6b612848aab7ba8319e9cb8a4b4`
- Current Consumer main: `7d6486059c468009042e4c186d54b566d6e1477e`
- Current hosted-closure PR: `#42`
- PR #42 exact head: `a6858de5b617abfc591af866e17096b7fb0d4159`
- PR #42 hosted checks: `9 / 9 PASS`
- PR #42 exact merge SHA: `7d6486059c468009042e4c186d54b566d6e1477e`
- PR #42 implementation branch: deleted remotely and locally

The current main is newer than the stable release tag because R2, R3 and bounded R4 development were intentionally integrated without selecting a new Product release. Release claims remain bound to `v0.20.1`; current development claims remain bound to the exact current main above.

## Consumer progression after v0.20.1

BAI VIDEO PRODUCTION completed the governed R2 Production Control promotion across TASK-037 Asset Registry 2, TASK-038 Audit Workspace and TASK-027 Planning minimum. It then completed the R3 generation-safe control-loop promotion across TASK-013 Shot Feasibility, TASK-039 Continuity/STALE propagation, TASK-040 Prompt/Generation Evidence and TASK-027 Generation Queue admission.

The R4 TASK-013 local execution path then advanced through two bounded hosted-closed units:

1. restart-safe local generation execution control with durable pre-side-effect `DISPATCHING`, exact Queue/Profile/Prompt revalidation and no automatic replay;
2. a package-owned, body-free MiniMax H3 ComfyUI adapter restricted to exact `http://127.0.0.1:<port>`, `LOCAL_FREE_AI / TEXT_TO_VIDEO`, approved native models/classes and Product-owned output roots.

Implementation PR #41 exact head `ff481147080518f44865c88ad0a8caffadd96947` passed `9 / 9` checks and merged at `74d6b5af0c6de66168f5ab6ab63a6a049b11acd4`. The subsequent hosted-closure PR #42 also passed `9 / 9` and produced the current main. The implementation local gate passed `35 / 35` exact focused tests and `919 / 919` full WSL2 regression. Raw native artifacts and private Prompt bodies remain Consumer-local and are not copied into the OS repository.

## Native failure and recovery result

The contained native H3 completion gate is not PASS:

- attempt 01 reached the real GPU/model/sampler path and failed at `SamplerCustomAdvanced` with `hostbuf_file_reader_read failed`; no canonical output was published;
- attempt 02 used legacy low-VRAM flags, Windows became unresponsive and the Owner confirmed a forced restart;
- attempt 02 remains durably `QUEUED / RECOVERY_REQUIRED`; it is not rewritten as a false terminal failure and cannot be automatically replayed;
- the Product now rejects `--disable-dynamic-vram`, `--lowvram`, `--highvram`, `--novram`, `--gpu-only` and `--cpu` before dispatch;
- Candidate, TASK-040 Attempt, Human Audit acceptance and TASK-013/R4 overall completion remain unclaimed.

The Native Gate is `PARKED_TO_SAFE_RUNTIME_REVIEW`. Hosted review and independent safe development continued without weakening or bypassing that gate.

## Existing Governance behavior confirmed

This Consumer sequence validates existing TASK-018 behavior without changing OS runtime policy or allocating a new roadmap item:

1. Human/native gates must park the exact blocked unit while independent authorized work continues.
2. An external force restart is an uncertain side-effect boundary, not evidence of failure or permission to replay.
3. Empirical host instability must tighten admission before side effects; it must not be handled by repeated Critic loops or repeated unsafe execution.
4. Consumer current-main identity, stable release identity and later closure-document identity must stay distinct.
5. Hosted closure can be completed for a fail-closed adapter while a narrower native behavior claim remains parked.

It does not justify a BAI Development OS code change, model/provider/cadence change, Knowledge promotion, new Task allocation or `v1.1.1` release.

## Preserved boundaries and next route

- TASK-017 remains paused at `07af447`; this supplement does not authorize resume.
- TASK-017 Production Activation remains `BLOCKED`.
- The preserved TASK-013 uncertain execution must never be automatically replayed.
- A third native H3 attempt requires a separately reviewed safe runtime route.
- Independent BAI VIDEO PRODUCTION R4 work may continue only through its own current Governance, dedicated branch and exact Task authority.
- No paid Provider, Deploy, Tag or Release is authorized by this supplement.
