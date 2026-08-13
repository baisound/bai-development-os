# TASK-018 Phase G — TASK-036 Windows Native Shell Evidence

- Status: `W0_PARTIAL / W1_PARTIAL / W2_BLOCKED_NOT_WIRED`
- Operation ID: `BVP-PHASEG-TASK036-20260813-01`
- Consumer: `baisound/bai_video_production`
- Consumer branch / HEAD baseline: `feature/task-007-012-native-validation` / `26045adda380d0396d5cbdb86dc673524ce99bf7` with preserved corrective worktree changes

## Capability and correction

- Initial preflight: WebView2 present but optional `pywebview` absent; layout launch correctly refused.
- Dependency spike: installed free `pywebview 6.2.1` into the gitignored Consumer `.venv/` only; no Product dependency metadata or paid provider changed.
- Native bug found: `Task036NativeProbe` lexicographically selected the non-version `SetupMetrics` directory as the runtime candidate.
- Correction: require numeric dotted version directories and sort numeric components; actual selected Runtime is `151.0.4129.78`.
- Focused native probe/security/UI tests after correction: `23 / 23 PASS`.

## Real Windows result

- Top-level native window: `BAI Video Production — TASK-036 Layout Spike`, one `pythonw` owner; no user-visible terminal or localhost URL.
- Renderer: six owned `msedgewebview2.exe` processes from exact WebView2 `151.0.4129.78`; root renderer process parent was the shell `pythonw` process.
- Native layout: professional NLE shell visibly rendered at `1600x900` and `1366x768`; Viewer, Transcript/Cut panel, Inspector/AI and multi-track Timeline remained present.
- Bridge: clicking the `字幕` workspace changed the active workspace state through the bounded bridge.
- Keyboard: Tab traversal produced a visible white focus indicator on the Transcript control.
- Display inventory: window DPI `96` / `100%`; monitor count `3`; virtual desktop `3840x2160`.
- Lifecycle: normal `WM_CLOSE` terminated the owner and all six operation-owned WebView2 children; leftovers `0`.
- Screenshots are retained in the Codex local visualization workspace and are not claimed as the sole source of semantic control identity.

## Subsequent packaged checkpoint

The initial shell probe below is retained as provenance. Consumer commit `1f328776e980a08b59b7a9fd62c5c30ffbba01d5` subsequently added HTML-reachable native Project/Media/EDITOR_WORK chooser controls and a reproducible PyInstaller one-directory package.

- Packaged `BAI Video Production.exe` launch, WebView2 `151.0.4129.78`, terminal-free startup, two-instance launch, owned-process cleanup and Unicode install path: PASS.
- Media selection and Project/Media/Handoff cancel-focus return: PASS; selection remained ephemeral and started no Product operation.
- Path length `166`: PASS. Path length `245`: FAIL due an internal `_cffi_backend` path; supported-install-path policy remains required.
- Clean-profile, missing-WebView2 recovery, full DPI/mixed-monitor matrix and screen-reader smoke remain incomplete.
- W2 real TASK-003/006/007/010/011/012 binding remains `BLOCKED_NOT_WIRED`.

## Initial fail-closed gaps

- `G-E11 TASK-036 runtime`: `PASS` for the real pywebview/WebView2 layout runtime.
- `G-E12 layout/DPI`: `PARTIAL`; `1366x768` and `1600x900` passed, but an actual `150%` Windows display scale and explicit `1920x1080` capture remain pending.
- `G-E13 native dialogs/focus`: `BLOCKED`; bridge methods exist and unit tests pass, but the current HTML has no Project/Media/Handoff controls that invoke them, so native dialog flow cannot be accepted from the real shell. Keyboard focus smoke passed only the currently reachable layout controls.
- `G-E14 packaging`: `BLOCKED`; the real window launched from `pythonw`, not a release-target packaged `BAI Video Production.exe`.
- W2 minimum editing E2E: `BLOCKED_NOT_WIRED`; the foundation report itself lists real TASK-003/006/007/010/011/012 binding as not implemented.

## Decision

TASK-036 continues on the dedicated Consumer branch `feature/task-036-phase-g-w2`. No `SHELL_INTEGRATED`, TASK-036 `NATIVE_VALIDATED`, `DESKTOP_SHELL_NATIVE_UX_PASS`, or `MINIMUM_EDITING_PRODUCT_MVP_PASS` claim is made. M3A TASK-010/011/012 native PASS, Consumer regression, PR all-green and conversation-free restart Evidence remain valid.
