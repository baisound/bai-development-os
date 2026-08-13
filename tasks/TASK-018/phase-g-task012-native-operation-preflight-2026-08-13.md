# TASK-018 Phase G — TASK-012 Native Operation Preflight

- Status: `AUTHORIZED_SANDBOX_OPERATION_READY`
- Operation ID: `BVP-PHASEG-TASK012-20260813-01`
- Consumer: `baisound/bai_video_production`
- Consumer checkout: `D:/BAI/TASK007`
- Consumer branch / HEAD baseline: `feature/task-007-012-native-validation` / `26045adda380d0396d5cbdb86dc673524ce99bf7` with preserved corrective worktree changes
- Authority: Phase G Owner handoff and active request to self-run safe native gates

## Upstream identity

- TASK-010 Project: `BAI_CAPABILITY_PROBE_PHASEG_TASK010_FIX4_20260813`.
- TASK-010 Timeline / assembly: `BAI_AUTO_AFA597B59BFF` / `sha256:a37baf0fca610791a1c09620b72e5befeeb20e6bb23d4ea8e5dd9b92c8fe7d14` / `PASS`.
- TASK-007 approved Edit Plan SHA reconstructed from the exact native case: `sha256:19b1ab2cda8e8fbc29398799524b20227ef265d1101d5587b059eda402ed05d6`.
- TASK-011 native report: `evidence/native/phase-g-task011-20260813-04/task011-native-render-qa.json` / `PASS`.
- TASK-011 embedded QA SHA: `sha256:1c68713119d5d4101b89c6f6669be30ec236c53a5cd5f501bbfc8967e26eea7b`.
- Render Master SHA: `sha256:93ad7aa8b00decc2d6053b770b66c77e4f93ff25d66bfe8e4997f61d18ff620f`.
- Independent reconstruction check: compiled assembly SHA and complete `RenderQAReport.to_dict()` exactly match the upstream Evidence.

## Exact target

- Destination parent: `evidence/native/phase-g-task012-20260813-01/editor-work` (must be absent before prepare).
- Source PCM export staging: `evidence/native/phase-g-task012-20260813-01/staging/task012-cubase-export-48k-s24.wav` (must be absent).
- Pre-Cubase gate report: `evidence/native/phase-g-task012-20260813-01/task012-editor-work-pre-cubase.json`.
- Final gate report: `evidence/native/phase-g-task012-20260813-01/task012-native-cubase-final.json`.
- Cubase: installed Steinberg Cubase 13 `13.0.41`; actual application capability must be rediscovered before launch. The running `se.trevligaspel.cubase.exe` process is only a Stream Deck plugin and is not treated as Cubase.

## Bounded operation

1. Extract only the accepted render's first audio stream into a new `48 kHz`, stereo, signed 24-bit PCM WAV.
2. Create a deterministic EDITOR_WORK package through `EditorHandoffService.prepare`; do not handcraft its manifest.
3. Run package-integrity validation before Cubase; `cubase_roundtrip=NOT_PRESENT` is only a preflight result.
4. Discover the narrowest legitimate Cubase launch/import/export path. Use the dedicated fixture only, never a human-owned Cubase Project.
5. Export one new `48 kHz` PCM WAV, register it through `EditorHandoffService.register_cubase_return`, then require final Cubase return validation.

## Idempotency and recovery

- Destination parent, staging WAV, final return staging path and gate outputs must be absent before their first writes.
- `EditorHandoffService.prepare` refuses an existing deterministic handoff destination; `register_cubase_return` refuses an existing canonical return.
- No existing Cubase Project is opened, overwritten or deleted. No automatic Cubase project-conversion claim is made.
- Any failed/partial operation is preserved and a retry uses a new operation ID/root.
- No paid provider, production activation, release, tag or deploy operation is part of this native gate.

## Decision

The upstream PASS identities, exact local output boundary, Cubase scope, idempotency and recovery rules are bound. Package creation and pre-Cubase validation may proceed; final native PASS requires a real Cubase-produced `48 kHz` PCM return.

## Execution result

- Deterministic handoff: `EDITOR_WORK_43EC683E54DA`; manifest SHA `sha256:b919653b4f0b389a89464833f304b44341c22a68df8560599b2348f2165be0c1`.
- Pre-Cubase gate: `PASS`, with `cubase_roundtrip.status=NOT_PRESENT` as expected.
- Cubase application: actual Steinberg Cubase 13 `13.0.41`; a separate Stream Deck plugin process was identified and excluded.
- Structured API discovery: installed MIDI Remote JavaScript API is a control-surface API, not an external Project import/export API; no COM automation was registered. The operation therefore used a dedicated Cubase Project and bounded native UI/keyboard automation.
- Dedicated Project: `BAI_PHASEG_TASK012_CUBASE13_20260813.cpr`, `126,346` bytes, SHA-256 `ad7d47f4c0d2605403860a2bbb692175ac1139f00edf1b76577fdb2d762f8f5b`.
- Native steps: empty Project in exact dedicated folder; import the accepted `48 kHz` / 24-bit PCM fixture; copy into Project `Audio/`; select the exact Event; set Locators to Selection; select Stereo Out; export offline Wave / `48.000 kHz` / `24 bit`.
- Cubase return: PCM signed 24-bit little-endian, stereo, `48,000 Hz`, `3,008,000 us`, `867,958` bytes, SHA `sha256:c6cce664d333af2381c83ab17087070d8e0bb616b0010bc044ec7c4f0f1b4cc0`.
- Registration: `ACCEPTED`, duration delta `0`, record SHA `sha256:28e19131345aed9d0a27ea826d1a2901e7f469b7397ba3b7f770b7eaacb3aea9`, automatic Project conversion `false`.
- Final gate: `PASS` / `NATIVE_EDITOR_WORK_HANDOFF` / `cubase_roundtrip.status=PASS`; semantic report SHA `sha256:ea8359790b6359a1a5e3f40b2d56fe67b6eed675310f3ceeadc7314f107e9d49`.
- Final report file SHA-256: `de620d55fe99f5c1c853bd4038b32d37746f3bad8567b3f5a5f8cbd6d6052a8b`.
- Focused TASK-010/011/012 regression after native close: `33 / 33 PASS`.
- Decision: TASK-012 Phase G native requirement is satisfied. This does not claim TASK-036 unified Desktop Shell acceptance or overall Phase G closure.
