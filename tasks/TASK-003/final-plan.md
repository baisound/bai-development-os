# Final Plan

## Authoring Role
Builder

## Objective

TASK-003 adds a persistent, independently runnable regression-test foundation for the five existing Version 1 pure-logic functions without changing Version 1 browser-visible behavior:

```text
normalizeCandidates
validateCandidates
calculateStopAngle
calculateNextRotation
getRandomIndex
```

The foundation uses Node.js built-in `node:test` and `node:assert/strict`, with no new dependency. TASK-002 remains completed historical evidence and is not modified.

## Evidence

Reviewed artifacts:

```text
/home/baisound/AGENTS.md
/home/baisound/projects/javascript-roulette/PROJECT.md
/home/baisound/projects/javascript-roulette/docs/ai-team/README-Builder.md
/home/baisound/projects/javascript-roulette/docs/ai-team/templates/final-plan.template.md
/home/baisound/projects/javascript-roulette/docs/ai-team/tasks/TASK-002/final-implementation-decision.md
/home/baisound/projects/javascript-roulette/docs/ai-team/tasks/TASK-003/task.md
/home/baisound/projects/javascript-roulette/docs/ai-team/tasks/TASK-003/builder-proposal.md
/home/baisound/projects/javascript-roulette/docs/ai-team/tasks/TASK-003/critic-review.md
/home/baisound/projects/javascript-roulette/docs/ai-team/tasks/TASK-003/builder-response.md
/home/baisound/projects/javascript-roulette/docs/ai-team/tasks/TASK-003/judge-decision.md
```

Judge Decision:

```text
Result: APPROVED
Conditions: なし
Binding Corrections: なし
Rejected Decisions: なし
Authorization Impact: NOT_AUTHORIZED
```

## Commands or Procedures

This Final Plan creation performed documentation work only. It did not create or modify production code, test code, package metadata, a lockfile, Vite configuration, or TASK-002 artifacts.

The implementation commands defined by this plan are:

```bash
cd /home/baisound/projects/javascript-roulette
npm install --package-lock-only --ignore-scripts
npm test
npm run build
npm run dev
curl -I http://localhost:8080
```

No listed command was executed while creating this Final Plan.

## Approved Design Baseline

### Test runner

Adopt Node.js standard `node:test` and `node:assert/strict`.

- Required Node.js version: `>=20.19.0`.
- No dependency or devDependency is added, removed, or version-changed.
- Test command: `node --test tests/roulette-core.test.mjs`.
- Passing tests: process exit code `0`.
- Assertion failure, import failure, or deterministic-stub exhaustion: non-zero process exit code.

### Browser runtime preservation

- Canvas remains statically drawn.
- The Canvas element remains the CSS `transform` rotation target.
- CSS `transition` remains the only rotation animation mechanism.
- `requestAnimationFrame` is not introduced.
- The 12 o'clock pointer remains outside the Canvas.
- `selectedIndex` remains selected before the spin animation starts.
- Existing DOM lookup, Canvas drawing, state management, event registration, `resizeCanvas()`, and `handleInputChange()` remain in `src/roulette.js`.

### Native ES module integration

`src/index.html` changes only its application script element:

```html
<script type="module" src="roulette.js"></script>
```

The element stays at the end of `body`. Module execution occurs after parsing, so the existing `candidateInput`, `spinButton`, `errorMessage`, `result`, `rouletteCanvas`, and `.roulette-wrapper` elements exist before `roulette.js` initializes.

## Exact File Plan

### Files created

| Path | Responsibility |
|---|---|
| `/home/baisound/projects/javascript-roulette/src/roulette-core.mjs` | Native ES module containing only the five pure functions and their named exports. |
| `/home/baisound/projects/javascript-roulette/tests/roulette-core.test.mjs` | Persistent Node.js regression test suite using `node:test` and `node:assert/strict`. |

### Files modified

| Path | Exact change |
|---|---|
| `/home/baisound/projects/javascript-roulette/src/index.html` | Change the existing roulette script element to `type="module"`. |
| `/home/baisound/projects/javascript-roulette/src/roulette.js` | Import the five functions from `./roulette-core.mjs`; remove only the five local function declarations. |
| `/home/baisound/projects/javascript-roulette/package.json` | Add `engines.node` and the `scripts.test` entry below. |
| `/home/baisound/projects/javascript-roulette/package-lock.json` | Synchronize root package metadata through the prescribed package-lock-only command. |

`package.json` additions:

```json
{
  "engines": {
    "node": ">=20.19.0"
  },
  "scripts": {
    "test": "node --test tests/roulette-core.test.mjs"
  }
}
```

### Files deleted

```text
なし
```

### Files not modified

```text
/home/baisound/projects/javascript-roulette/src/style.css
/home/baisound/projects/javascript-roulette/vite.config.js
/home/baisound/projects/javascript-roulette/docs/risk-register.md
/home/baisound/projects/javascript-roulette/docs/ai-team/tasks/TASK-001/**
/home/baisound/projects/javascript-roulette/docs/ai-team/tasks/TASK-002/**
/home/baisound/projects/javascript-roulette/docs/ai-team/tasks/TASK-003/task.md
/home/baisound/projects/javascript-roulette/docs/ai-team/tasks/TASK-003/builder-proposal.md
/home/baisound/projects/javascript-roulette/docs/ai-team/tasks/TASK-003/critic-review.md
/home/baisound/projects/javascript-roulette/docs/ai-team/tasks/TASK-003/builder-response.md
/home/baisound/projects/javascript-roulette/docs/ai-team/tasks/TASK-003/judge-decision.md
```

## Implementation Procedure

### Step 1 — Create the core module

Precondition: implementation authorization is `AUTHORIZED`.

Create `src/roulette-core.mjs` and define these exact named exports:

```javascript
export function normalizeCandidates(input) {}
export function validateCandidates(candidateList) {}
export function calculateStopAngle(count, index) {}
export function calculateNextRotation(rotation, stopAngle) {}
export function getRandomIndex(
  count,
  getRandomValues = globalThis.crypto.getRandomValues.bind(globalThis.crypto)
) {}
```

The module imports no DOM, Canvas, CSS, timer, application state, or event code. It registers no event listener and performs no call at module evaluation time.

Completion condition: every function body preserves the current Version 1 formula, validation behavior, messages, and rejection sampling behavior.

### Step 2 — Preserve existing application integration

Replace the five local function declarations in `src/roulette.js` with:

```javascript
import {
  normalizeCandidates,
  validateCandidates,
  calculateStopAngle,
  calculateNextRotation,
  getRandomIndex
} from "./roulette-core.mjs";
```

Leave all remaining DOM references, variables, Canvas functions, state transitions, event listeners, fallback timer behavior, and initialization calls unchanged.

Completion condition: `roulette.js` calls the imported functions with the same arguments as before.

### Step 3 — Add package metadata and synchronize lockfile

Add the exact `engines.node` and `scripts.test` fields from Exact File Plan. Run:

```bash
npm install --package-lock-only --ignore-scripts
```

Completion condition: the command exits `0`; package-lock changes only synchronize root metadata and do not add a test framework or alter Vite versions.

### Step 4 — Create the persistent test suite

Create `tests/roulette-core.test.mjs` with:

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeCandidates,
  validateCandidates,
  calculateStopAngle,
  calculateNextRotation,
  getRandomIndex
} from "../src/roulette-core.mjs";
```

Completion condition: every case in Test Foundation is represented by a named `test(...)` block.

### Step 5 — Validate non-regression

Run `npm test`, `npm run build`, and the Vite validation procedure in Validation Procedure.

Completion condition: all commands meet their specified results, and the manual smoke checks confirm no Version 1 UI behavior changes.

## Test Foundation

### Deterministic random-value stub

All rejection-sampling tests use this finite stub:

```javascript
function createRandomValuesStub(values) {
  let position = 0;

  return array => {
    if (position >= values.length) {
      throw new Error("random stub exhausted");
    }
    array[0] = values[position];
    position += 1;
    return array;
  };
}
```

The test asserts that the stub consumes exactly the listed values. A missing rejection consumes too few values; an unexpected extra draw throws `random stub exhausted`; either condition fails the test.

### `normalizeCandidates`

| Input | Expected |
|---|---|
| `"  寿司  \n\n 焼肉 \n寿司  "` | `["寿司", "焼肉", "寿司"]` |
| `""` | `[]` |
| `" \n\t\n　"` | `[]` |
| `"寿司\n寿司\n焼肉"` | `["寿司", "寿司", "焼肉"]` |
| `["寿司", "焼肉"]` | throws `TypeError` |
| `null` | throws `TypeError` |

### `validateCandidates`

| Input | Expected |
|---|---|
| `[]` | `{ valid: false, errors: ["候補を入力してください"] }` |
| `["寿司"]` | `{ valid: false, errors: ["候補を2件以上入力してください"] }` |
| `["寿司", "焼肉"]` | `{ valid: true, errors: [] }` |
| `["寿司", "寿司"]` | `{ valid: true, errors: [] }` |
| `["", "寿司"]` | `{ valid: true, errors: [] }` |
| `["0", ..., "19"]` | `{ valid: true, errors: [] }` |
| `["0", ..., "20"]` | `{ valid: false, errors: ["候補は20件以内で入力してください"] }` |
| `["A".repeat(30), "寿司"]` | `{ valid: true, errors: [] }` |
| `["A".repeat(31), "寿司"]` | `{ valid: false, errors: ["候補名は30文字以内で入力してください"] }` |
| `null` | throws `TypeError` |

Empty-line removal belongs to `normalizeCandidates`; direct `validateCandidates(["", "寿司"])` remains valid.

### `calculateStopAngle`

| count | index | Expected |
|---:|---:|---:|
| 2 | 0 | 270 |
| 4 | 0 | 315 |
| 4 | 1 | 225 |
| 4 | 3 | 45 |
| 6 | 5 | 30 |

Formula:

```text
sectorAngle = 360 / count
sectorCenterAngle = index * sectorAngle + sectorAngle / 2
stopAngle = (360 - sectorCenterAngle) % 360
```

### `calculateNextRotation`

Formula:

```text
currentRotationMod = ((rotation % 360) + 360) % 360
angleDelta = (stopAngle - currentRotationMod + 360) % 360
additionalRotations = 1800
finalRotation = rotation + additionalRotations + angleDelta
```

| rotation | stopAngle | currentRotationMod | angleDelta | Expected finalRotation |
|---:|---:|---:|---:|---:|
| 0 | 315 | 0 | 315 | 2115 |
| 2115 | 225 | 315 | 270 | 4185 |
| 4185 | 30 | 225 | 165 | 6150 |
| -45 | 315 | 315 | 0 | 1755 |
| 765 | 315 | 45 | 270 | 2835 |
| 315 | 315 | 315 | 0 | 2115 |

For each case assert:

```text
finalRotation - rotation >= 1800
finalRotation > rotation
```

### `getRandomIndex`

For each integer N from 2 through 20, stub `[0]` and assert:

```text
0 <= result < N
```

Use `RANGE = 4294967296` and:

```text
limit = floor(RANGE / N) * N
accept when value < limit
reject when value >= limit
result = value % N only after acceptance
```

| N | limit | Stub values | Expected index |
|---:|---:|---|---:|
| 2 | 4294967296 | `[0]` | 0 |
| 2 | 4294967296 | `[4294967295]` | 1 |
| 6 | 4294967292 | `[4294967291]` | 5 |
| 6 | 4294967292 | `[4294967292, 0]` | 0 |
| 6 | 4294967292 | `[4294967293, 1]` | 1 |
| 6 | 4294967292 | `[4294967292, 4294967293, 17]` | 5 |
| 6 | 4294967292 | `[4294967295, 5]` | 5 |

Production calls `getRandomIndex(candidates.length)` without the second parameter. Therefore the default remains `globalThis.crypto.getRandomValues.bind(globalThis.crypto)`. Tests inject the stub and do not replace or mutate global crypto.

## Validation Procedure

| Command or procedure | Success result | Failure result |
|---|---|---|
| `npm install --package-lock-only --ignore-scripts` | exit `0` | non-zero; stop and record npm output |
| `npm test` | exit `0`; all named `node:test` blocks pass | non-zero; record failing test name and assertion |
| intentionally changed expected assertion in a temporary uncommitted test edit | non-zero exit | exit `0` is a test-runner defect and blocks completion |
| `npm run build` | exit `0`; no module import-resolution error | non-zero; stop and record Vite error |
| `npm run dev` | Vite ready log shows `http://localhost:8080` | no ready log; report NOT_CONFIRMED |
| `curl -I http://localhost:8080` | HTTP 200 response | connection or non-200 response; report failure |

After the HTTP check, stop the development server by sending `Ctrl+C` to the terminal that runs `npm run dev`. Record that the server was deliberately stopped after verification.

Manual smoke checks:

1. Enter two candidates; spin button becomes enabled and the wheel is drawn.
2. Enter zero, one, 21, and 31-character candidate inputs; button is disabled and the exact existing errors display.
3. Enter duplicates; duplicates remain separate candidate slots.
4. Spin valid candidates; Canvas rotates through CSS transform and transition, pointer remains at 12 o'clock, and result text appears.
5. Trigger consecutive spins; each spin advances clockwise by at least 1800 degrees.

## Rollback

Rollback uses these exact file actions:

1. Restore the five local function declarations in `src/roulette.js` and remove its import block.
2. Restore `src/index.html` to `<script src="roulette.js"></script>`.
3. Delete `src/roulette-core.mjs`.
4. Delete `tests/roulette-core.test.mjs`.
5. Remove `scripts.test` and `engines.node` from `package.json`.
6. Run `npm install --package-lock-only --ignore-scripts` to synchronize `package-lock.json`.
7. Run `npm run build` and the manual smoke checks from Validation Procedure.

Partial implementation is not retained: if any file in steps 1 through 5 is reverted, all five are reverted in the same change set before package-lock synchronization.

## Completion Criteria

- The two planned new files exist at the exact paths in Exact File Plan.
- `npm test` is independently runnable from the project root and exits 0.
- The intentional failing assertion exits non-zero.
- All Test Foundation cases pass.
- `npm run build` exits 0.
- Vite reports a ready log for `http://localhost:8080` and `curl -I` returns HTTP 200.
- Manual smoke checks preserve Canvas drawing, pointer, validation, duplicate handling, CSS rotation, result display, and continuous clockwise spins.
- No external test dependency exists in `package.json` or `package-lock.json`.
- No TASK-002 artifact is changed.
- The test suite remains stored in `tests/roulette-core.test.mjs`.

## Authorization Status

```text
Authorization Status: NOT_AUTHORIZED
```

This Final Plan is not implementation authorization. It did not create test code, modify application code, modify package files, modify the lockfile, or modify Vite configuration.

## Result

```text
FINAL_PLAN_READY
```

The Judge-approved design, Critic PASS, Builder Response, and Judge Decision are integrated without conditions or binding corrections.

## Unresolved Items

なし
