# TASK-018 Phase G — TASK-011 Native Operation Preflight

- Status: `AUTHORIZED_SANDBOX_OPERATION_READY`
- Operation ID: `BVP-PHASEG-TASK011-20260813-01`
- Consumer: `baisound/bai_video_production`
- Consumer checkout: `D:/BAI/TASK007`
- Consumer branch / HEAD: `feature/task-007-012-native-validation` / `26045adda380d0396d5cbdb86dc673524ce99bf7`
- BAI Development OS branch / baseline: `autonomy/task-018/phase-g-consumer-pilot` / `dd7225ff681d7243adbbbe121e09f1b5e805c51e`
- Authority: Owner Phase G handoff `01_status/OWNER_AUTHORITY_AND_SCOPE.md` plus the active request to self-run safe native gates

## Target identity

- Application: `DaVinci Resolve Studio 21.0.2.4`
- Interface: installed `WINDOWS_PROGRAMDATA` Python scripting bridge
- Version-matched API authority: installed Resolve Developer/Scripting `README.txt`, last modified `2026-07-01`
- Project: `BAI_CAPABILITY_PROBE_TASK010_FINAL4_20260813`
- Project classification: dedicated `BAI_CAPABILITY_PROBE_*` sandbox
- Timeline: `BAI_AUTO_8D29CE09A005`
- TASK-010 Evidence: `evidence/native/task010-final4/task010-final-native-gate.json`
- TASK-010 case: `SRC30000_1001_PROJECT_RATE / PASS`
- Assembly SHA: `sha256:8561e892f8e7188a1744f5a2ef8fc37cdefbe6f49c6edd76fda6493b7f45a3c5`
- Expected duration: `72` frames at exact Project Timeline rate `24/1`
- Timeline evidence: `2` video items, `2` audio items; first execution and replay assembly SHA match
- Render Queue before operation: `0` jobs

## Bounded write

- Evidence root: `evidence/native/phase-g-task011-20260813-01`
- Evidence report: `evidence/native/phase-g-task011-20260813-01/task011-native-render-qa.json`
- Render output: the gate-owned empty `render-output` child only
- Render format / codec: installed API-supported `mp4` / `H264`
- Mutations: select the exact Automation-owned Timeline, select the explicit format/codec, set bounded render settings, add one Render Queue job, start only that job
- Prohibited: Project/Timeline creation, rename, deletion, content edits, job deletion, human-owned Project access, overwrite, Release/Deploy

## Idempotency and recovery

- The Evidence root and report must not exist before dispatch.
- The gate refuses a non-empty render-output directory, so a retry uses a new operation ID/root and never overwrites the first attempt.
- The gate starts only the job ID returned by its own `AddRenderJob` call.
- Timeout is bounded to `1800` seconds and invokes `StopRendering` best-effort.
- Failed render/QA Evidence and artifacts are preserved for diagnosis.
- Resolve Render Queue jobs are not deleted automatically.

## QA policy

- Product default remains target `-16 LUFS`, tolerance `±2 LU`, maximum true peak `-1 dBTP`.
- The source fixture read-only measurement is approximately `-21.1 LUFS`; this is a predicted QA risk, not permission to loosen the Product policy.
- A real completed render with QA `FAIL` is preserved as real failure Evidence and is not claimed as `NATIVE_VALIDATED`.

## Decision

The exact sandbox, Timeline, assembly identity, operation, output root, authority, idempotency and recovery are bound. The real TASK-011 render may execute.

## Attempt history

### `BVP-PHASEG-TASK011-20260813-01`

- Result: `FAIL_CLOSED_BEFORE_RENDER_QUEUE`
- Provider result: `SetCurrentTimeline -> None`; target Timeline was not selected.
- Root/job/artifact: not created / `0` jobs / none.
- Classification: Resolve had a long-running responsive process but its GUI Project Manager was not opened into the current Project; `GetCurrentPage -> null`.
- Recovery: preserved the provider traceback, activated the existing single Resolve instance without terminating it, inspected the exact HWND, and used image-driven Project Manager selection only after official API and UIA semantic discovery were insufficient.

### `BVP-PHASEG-TASK011-20260813-02`

- Operation ID: `BVP-PHASEG-TASK011-20260813-02`
- Evidence root: `evidence/native/phase-g-task011-20260813-02`
- GUI recovery identity: window title exactly `DaVinci Resolve Studio - BAI_CAPABILITY_PROBE_TASK010_FINAL4_20260813`.
- Structured API recheck: `GetCurrentPage=edit`; `SetCurrentTimeline=True`; current Timeline exactly `BAI_AUTO_8D29CE09A005`; rate `24.0`.
- Result: `REAL_RENDER_COMPLETED_BUT_GATE_ERROR`.
- Resolve job status reached `100%` and localized `完了`, but the provider string arrived through the scripting bridge as mojibake `Š®—ą`; the original English-only completion classifier failed closed before QA/report creation.
- Preserved artifact: `render-output/BAI_TASK011_NATIVE_RENDER.mp4`, `10,120` bytes, `0.042667` seconds, H.264 `1920x1080` plus `48 kHz` stereo AAC.
- Corrective finding: the artifact exposed an upstream TASK-010 record-frame basis defect—the clips existed at `0..72` outside the actual Resolve Timeline extent beginning at `86400`. No `NATIVE_VALIDATED` claim was made.

### `BVP-PHASEG-TASK011-20260813-03`

- Operation ID: `BVP-PHASEG-TASK011-20260813-03`.
- Corrective TASK-010 Evidence: `evidence/native/phase-g-task010-fix-20260813-03/task010-native-gate.json` / `PASS`.
- Project: `BAI_CAPABILITY_PROBE_PHASEG_TASK010_FIX3_20260813`.
- Timeline: `BAI_AUTO_AFA597B59BFF`, exactly one match, extent `86400..86472`, two video and two audio items.
- Assembly SHA: `sha256:a37baf0fca610791a1c09620b72e5befeeb20e6bb23d4ea8e5dd9b92c8fe7d14`.
- Expected duration: `72` frames at Project Timeline rate `24/1`.
- Evidence root: `evidence/native/phase-g-task011-20260813-03`; it and its report/render-output children must be absent before dispatch.
- Localized status correction: canonicalize only documented English completion values or reversible CP1250/CP1252/Latin-1 to CP932 values equal to `完了`/`完了済み`; all other statuses still fail closed.
- Focused regression: `20 / 20 PASS` across the corrected TASK-010/TASK-011 suites.
- Result: `REAL_RENDER_COMPLETE_QA_FAIL` with a canonicalized `Complete` job status and a preserved `3.008` second artifact.
- PASS checks: non-empty artifact, H.264 video, AAC `48 kHz` stereo audio, exact duration `72/72` frames, and true peak.
- Sole FAIL: integrated loudness `-18.13 LUFS`, `2.13 LU` from target and `0.13 LU` outside the unchanged `±2 LU` policy.
- Report: `evidence/native/phase-g-task011-20260813-03/task011-native-render-qa.json`; semantic report SHA `sha256:95bd371a021dd23d8c334da0484fa67fbe52392696ff5ba2d7596a948618622f`.
- Decision: preserve the Project/job/artifact/report and regenerate a fresh TASK-010 native-only fixture with an explicit deterministic `+1.0 dB` gain. Do not loosen QA or mutate clip gain through non-contractual GUI state.

### `BVP-PHASEG-TASK011-20260813-04`

- Operation ID: `BVP-PHASEG-TASK011-20260813-04`.
- Corrective TASK-010 Evidence: `evidence/native/phase-g-task010-fix-20260813-04/task010-native-gate.json` / `PASS`, file SHA-256 `0f862db2c73ea99ed97ac1623e9dd1f750b4e8f81f3c66004568946140d718ce`.
- Project: `BAI_CAPABILITY_PROBE_PHASEG_TASK010_FIX4_20260813`; current exact identity verified.
- Timeline: exactly one `BAI_AUTO_AFA597B59BFF`, extent `86400..86472`.
- Assembly SHA: `sha256:a37baf0fca610791a1c09620b72e5befeeb20e6bb23d4ea8e5dd9b92c8fe7d14`; native fixture source SHA: `sha256:424d48a40c53e3ad389be3db9cd715862f6d95b641b98d687afc262ef23498a2`.
- Expected duration/rate: `72` frames / `24/1`; Render Queue `0`, rendering `false` at preflight.
- Evidence root: `evidence/native/phase-g-task011-20260813-04`, verified absent.
- Render/QA policy: one `mp4/H264` job; unchanged default `-16 LUFS ±2 LU`, max true peak `-1 dBTP`.
- Result: `PASS` / `NATIVE_RESOLVE_RENDER_QA`.
- Report: `evidence/native/phase-g-task011-20260813-04/task011-native-render-qa.json`; semantic report SHA `sha256:651e3cbfe6480b0f201f46a3d3dd4955bf142d3ad3cdc6c224309b1818c1085f`; file SHA-256 `3be9bf9c812e9bc201c67f45f4d75717a5f164bbb538dd0488878807abe8250c`.
- Real artifact: one H.264/AAC MP4, `3,697,764` bytes, SHA `sha256:93ad7aa8b00decc2d6053b770b66c77e4f93ff25d66bfe8e4997f61d18ff620f`; path not persisted in canonical Evidence.
- Native checks: non-empty/video/audio/duration/loudness/true-peak all `PASS`; duration `72/72` frames; audio `48 kHz` stereo; integrated loudness `-17.13 LUFS`; true peak `-17.01 dBTP`.
- Render status canonicalized to `Complete`; transient Render job ID is not persisted.
- Decision: TASK-011 Phase G native requirement is satisfied without widening QA policy. Earlier failed attempts remain preserved as corrective Evidence.
