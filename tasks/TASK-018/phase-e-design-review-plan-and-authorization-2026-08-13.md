# TASK-018 Phase E — Session Rotation Plan and Authorization

Date: `2026-08-13`
Target gate: `SESSION_ROTATION_PASS`
Authorization: `AUTHORIZED_UNDER_CONTINUOUS_OWNER_DIRECTIVE`

Extend AutomationOS with a pure Session Rotation controller. Inputs are already-observed budgets, Gate results, Git/checkpoint facts and compact references. The controller performs no Git/file/network/Automation operation.

Rotation triggers on bounded elapsed time, completed Task units, commits, estimated Context and explicit provider-limit signals. It is deferred inside an unsafe atomic unit. A checkpoint cannot claim success unless required tests pass, unresolved Critical/High are zero, current HEAD is exact and dirty state is explicitly captured. Handoff content is reference-first, checksummed, immutable and capped at 2,000 estimated tokens. Resume validation requires exact project/task/head, checkpoint and source-reference integrity without conversation history.

Allowed Files: `src/automation/session-rotation.mjs`, `src/automation/index.mjs`, `schemas/automation/autonomous-session-state.schema.json`, `tests/automation/session-rotation*.test.mjs`, `tasks/TASK-018/**`, and active status/index synchronization files.

Critic design: `DESIGN_PASS`; Recovery/Context Guard/Cost Guard are consumed as facts and not duplicated. Rollback removes the new pure surface.
