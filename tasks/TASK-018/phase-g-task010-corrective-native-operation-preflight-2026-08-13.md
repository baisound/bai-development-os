# TASK-018 Phase G — TASK-010 Corrective Native Operation Preflight

- Status: `AUTHORIZED_SANDBOX_OPERATION_READY`
- Operation ID: `BVP-PHASEG-TASK010-FIX-20260813-01`
- Trigger: TASK-011 Attempt 2 produced a real 100%-completed Resolve artifact of only `0.042667` seconds because the TASK-010 clips were placed at frames `0..72` while the Resolve Timeline extent was `86400..86400`.
- Consumer branch / HEAD baseline: `feature/task-007-012-native-validation` / `26045adda380d0396d5cbdb86dc673524ce99bf7` with an unstaged five-file corrective patch.
- Focused regression: `20 / 20 PASS`.

## Exact target

- New Project: `BAI_CAPABILITY_PROBE_PHASEG_TASK010_FIX_20260813`
- Preflight: exact name absent from the current Resolve Project folder (`75` Projects enumerated).
- Project class: dedicated disposable capability sandbox; no human-owned Project mutation.
- Interface: Resolve Studio `21.0.2.4` official Python scripting bridge.
- Evidence root: `evidence/native/phase-g-task010-fix-20260813-01`
- Output: `task010-native-gate.json`

## Bounded operation

1. Create exactly the absent named sandbox Project.
2. Run the repository TASK-010 native matrix with corrected assembly plan `1.3.0` and `RESOLVE_TIMELINE_START_RELATIVE` record-frame basis.
3. Require fresh corrected Automation Timelines and exact Timeline extent verification.
4. Preserve generated sources, native report and any failure state.
5. Do not delete or rewrite the earlier marker-bound incorrect Timelines.

## Idempotency and recovery

- Project and Evidence root must both be absent before creation.
- Any retry uses a new operation ID, Project name and Evidence root.
- No overwrite, force, Project deletion, Timeline deletion or Evidence deletion is permitted.
- On failure, leave the sandbox Project and Evidence intact and classify the exact provider result.

## Decision

The new sandbox creation and corrected TASK-010 native matrix are authorized as the smallest recovery needed to resume TASK-011 real render validation.

## Attempt history

### `BVP-PHASEG-TASK010-FIX-20260813-01`

- Result: `FAIL_CLOSED_AT_EXTENT_GATE`.
- Corrected placement was proven: Timeline/items moved from invalid frame `0` into real Timeline range beginning at `86400`.
- Observed Timeline: `86400..86471`; the initial extent formula treated the Resolve inclusive end as exclusive and calculated `71` instead of `72` frames.
- Partial sandbox Project and generated-source Evidence are preserved; no retry occurs in that Project/root.

### `BVP-PHASEG-TASK010-FIX-20260813-02`

- Project: `BAI_CAPABILITY_PROBE_PHASEG_TASK010_FIX2_20260813` (`target_exists=false` at preflight).
- Evidence root: `evidence/native/phase-g-task010-fix-20260813-02`.
- Corrected contract: Resolve 21 inclusive Timeline extent is `end-start+1`; `86400..86471 = 72` frames.
- Focused regression after correction: `20 / 20 PASS`.
- Result: `FAIL_CLOSED_AT_EXTENT_GATE` after two matrix cases passed the first corrected check.
- Observed Resolve 21 behavior is source-rate dependent: the 24 fps and 60 fps source cases reported a raw `end-start` delta of `71`, while the 30000/1001 source case reported `72`, for the same planned 72-frame Timeline duration.
- The second formula incorrectly required only one of the two legitimate native representations. Project/root remain immutable Evidence.

### `BVP-PHASEG-TASK010-FIX-20260813-03`

- Project: `BAI_CAPABILITY_PROBE_PHASEG_TASK010_FIX3_20260813`.
- Evidence root: `evidence/native/phase-g-task010-fix-20260813-03`.
- Preflight contract: both exact target Project and Evidence root must be absent before creation.
- Corrected extent gate: accept only the tightly bounded Resolve 21 raw delta set `{expected_frames - 1, expected_frames}`; a zero-length or otherwise mismatched Timeline still fails closed.
- Focused regression after correction: `20 / 20 PASS`.
- Result: `PASS` (`NATIVE_VALIDATION_PHASE2`, linked AV semantic probe `PASS`).
- Native report: `evidence/native/phase-g-task010-fix-20260813-03/task010-native-gate.json`.
- Three corrected Automation Timelines passed fresh apply, idempotent replay, exact extent, marker and audio/video item checks. Negative partial/hash-conflict gates also passed.
- Selected downstream identity: `BAI_AUTO_AFA597B59BFF` / `sha256:a37baf0fca610791a1c09620b72e5befeeb20e6bb23d4ea8e5dd9b92c8fe7d14` / `72` frames at `24/1`.

### `BVP-PHASEG-TASK010-FIX-20260813-04`

- Trigger: TASK-011 attempt 3 proved the corrected 72-frame Timeline and real render path, but the deterministic sine fixture measured `-18.13 LUFS`, missing the default acceptance lower bound by `0.13 LU`.
- Correction: add an explicit `+1.0 dB` FFmpeg audio filter to the native-only deterministic fixture. Product QA thresholds remain `-16 LUFS ±2 LU`; no production-content transform or Resolve GUI gain mutation is introduced.
- Project: `BAI_CAPABILITY_PROBE_PHASEG_TASK010_FIX4_20260813`.
- Evidence root: `evidence/native/phase-g-task010-fix-20260813-04`.
- Preflight contract: exact Project/root absence, new source checksums and fresh Timeline creation are required; earlier Projects/roots remain immutable Evidence.
- Focused regression including fixture argv contract: `21 / 21 PASS`.
- Result: `PASS` (`NATIVE_VALIDATION_PHASE2`, linked AV semantic probe `PASS`).
- Native report: `evidence/native/phase-g-task010-fix-20260813-04/task010-native-gate.json`, file SHA-256 `0f862db2c73ea99ed97ac1623e9dd1f750b4e8f81f3c66004568946140d718ce`.
- Selected source SHA: `sha256:424d48a40c53e3ad389be3db9cd715862f6d95b641b98d687afc262ef23498a2`.
- Downstream Timeline remains deterministic `BAI_AUTO_AFA597B59BFF` / assembly SHA `sha256:a37baf0fca610791a1c09620b72e5befeeb20e6bb23d4ea8e5dd9b92c8fe7d14`, within the new exact Project identity.
