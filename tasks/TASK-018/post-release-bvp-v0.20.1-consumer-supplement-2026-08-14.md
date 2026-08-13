# TASK-018 Post-release BAI VIDEO PRODUCTION v0.20.1 Consumer Supplement

Date: `2026-08-14`

## Decision

`POST_RELEASE_CONSUMER_SUPPLEMENT_ACCEPTED`

TASK-018 remains `COMPLETED`, and the published BAI Development OS `v1.1.0` tag and Release remain immutable. This supplement does not reopen Phase G, Phase H2 or I1 and does not rewrite their chronological Evidence. It records a newer Consumer outcome that supersedes only the current BAI VIDEO PRODUCTION TASK-036/M3B status.

## Exact Consumer publication

- Repository: `baisound/bai_video_production`
- Release-code PR: `#22`
- Exact release-code merge SHA: `c2e12d59f869a6b612848aab7ba8319e9cb8a4b4`
- Annotated tag: `v0.20.1`
- Tag object: `d29a9c414e3f65011966b788835e91fb8c24f199`
- Tag target: `c2e12d59f869a6b612848aab7ba8319e9cb8a4b4`
- Stable GitHub Release: `https://github.com/baisound/bai_video_production/releases/tag/v0.20.1`
- Release workflow run: `31742523107 / PASS`
- Wheel SHA-256: `3cb9d56b4ea4a76df29139a990891fa4767dd09737f8160e14cd0beadf5ef9fc`
- Source distribution SHA-256: `f5e739ed6c7c8739dc4f7237f1f1b4b0606a4893ca08b15731e3284b670b469c`
- Post-release documentation PR: `#23`
- Current Consumer documentation-main SHA: `7873488c85cf1fd9e49b8061e4c201b6fec976d6`

The release-code SHA and the later documentation-main SHA are intentionally different. Release claims bind to the tag target; current repository documentation binds to the later main SHA.

## Native and regression closure

- BAI VIDEO PRODUCTION full regression: `810 / 810 PASS`
- Python compile gate: `PASS`
- TASK-036 packaged Windows executable SHA-256: `700acbe7384521a075779eddb173bd5e655e4752874195ae61da02ace612550a`
- Clean-profile packaged launch: `PASS`
- Three real `1920 x 1080`, `100% DPI` monitors: native `1500 x 850` window move/visibility gate `PASS`
- Windows Narrator / UI Automation: `14` named controls `PASS`
- Isolated missing-WebView2 recovery: `PASS`; installed runtime was not modified
- Executable-path policy: `166` characters accepted; the previous `245`-character failure remains preserved as boundary Evidence
- Responsive high-scale layout contract below `900 CSS px`: `PASS`
- TASK-036 W0/W1/W2: `PASS`
- TASK-036 overall / M3B: `PASS`

Consumer Evidence remains in the Consumer repository under `docs/ai-team/tasks/TASK-036/`. Raw native artifacts are not copied into the OS repository.

## Phase G / H2 hardening result

The later Consumer closure confirms the existing OS hardening decisions:

1. An exact Human Gate can be parked without blocking independent work and can be re-entered when the required native environment becomes available.
2. Historical Evidence is append-only. A newer supplement updates current claims without altering what was known at the earlier Phase G/H2/I1 decision point.
3. Release-code identity, annotated-tag target and later documentation-main identity must be recorded separately.
4. Current-context loading must prefer this supplement for current Consumer status while retaining the original Phase G/H2 records for provenance.
5. One additional Consumer closure sample does not justify model, provider, cadence, permanent policy or Knowledge-promotion changes.

No OS runtime, schema, provider policy, safety floor or release artifact changes are required. Therefore no BAI Development OS `v1.1.1` publication is opened by this supplement.

## Preserved boundaries and next route

- TASK-017 remains paused at its recorded safe checkpoint.
- TASK-017 Production Activation remains `BLOCKED`.
- BAI VIDEO PRODUCTION may next promote its already-present R2 Production Control Plane foundation through the Consumer repository's own Governance and task sequence: TASK-037, TASK-038, then TASK-027 minimum.
- This supplement grants no authority to resume TASK-017, activate Production, or perform paid Provider execution.
