# TASK-003 Builder Proposal — Automated Regression Test Foundation

## Authoring Role: Builder

## 1. Objective and preserved baseline

TASK-003 adds persistent, independently executable automated regression tests for the Version 1 baseline. It does not alter the roulette UI, Canvas drawing, CSS transition, state transitions, selected-index selection timing, or browser-visible behavior established by TASK-002.

TASK-002 is `COMPLETED` and remains read-only historical evidence. This proposal uses its approved formulas and runtime rules without reopening or rewriting TASK-002.

The in-scope functions are:

1. `normalizeCandidates`
2. `validateCandidates`
3. `calculateStopAngle`
4. `calculateNextRotation`
5. `getRandomIndex`

## 2. Evidence

### 2.1 Current source evidence

`/home/baisound/projects/javascript-roulette/src/roulette.js` currently:

- defines all five in-scope functions in the same classic browser script as DOM access and event registration;
- executes `resizeCanvas()` and `handleInputChange()` after registering event listeners;
- uses `window.crypto.getRandomValues.bind(window.crypto)` as the default random-value supplier;
- applies rejection sampling with:

```text
RANGE = 0x100000000 = 4294967296
limit = floor(RANGE / count) * count
reject when array[0] >= limit
return array[0] % count only when array[0] < limit
```

- computes rotations with:

```text
sectorAngle = 360 / count
sectorCenterAngle = index * sectorAngle + sectorAngle / 2
stopAngle = (360 - sectorCenterAngle) % 360
currentRotationMod = ((rotation % 360) + 360) % 360
angleDelta = (stopAngle - currentRotationMod + 360) % 360
finalRotation = rotation + 1800 + angleDelta
```

### 2.2 TASK-002 compatibility evidence

`TASK-002/task.md` records:

- `COMPLETED`;
- `FINAL_PLAN_PASS`;
- `IMPLEMENTATION_APPROVED`;
- `PRODUCTION_READY`.

`TASK-002/final-implementation-decision.md` records:

- architecture compliance: `PASS`;
- roulette mathematics: `PASS`;
- randomness compliance: `PASS`;
- the missing persistent automated regression tests as the accepted residual risk followed up by TASK-003.

`docs/risk-register.md` identifies `RISK-001` as persistent automated regression test coverage missing and names TASK-003 as its follow-up. No Version 1 behavior change is required to address that risk.

### 2.3 Current development configuration evidence

`/home/baisound/projects/javascript-roulette/package.json` currently contains Vite as its only dev dependency and has `dev`, `dev:open`, `build`, and `preview` scripts.

`/home/baisound/projects/javascript-roulette/vite.config.js` sets:

```text
root = "src"
host = "0.0.0.0"
port = 8080
strictPort = true
```

## 3. Test-runner decision

### 3.1 Compared options

| Candidate | Browser/Vite compatibility | Dependency impact | Independent execution | Decision |
|---|---|---:|---|---|
| Node.js standard test runner (`node:test`) | Tests import pure ES modules; Vite continues to load browser modules | 0 packages | `node --test tests/roulette-core.test.mjs` from project root | Adopt |
| Vitest | Vite-native and browser-compatible | Adds Vitest and its transitive dependencies | `vitest run` from project root | Reject |

### 3.2 Adopted runner

Adopt the Node.js standard test runner through `node:test` and `node:assert/strict`.

Reasons:

1. The five required functions are deterministic or accept an injected value supplier and do not require a browser DOM after separation into a pure module.
2. Node.js provides both `node:test` and `node:assert/strict`; no test framework package is added.
3. The existing application continues to use Vite for browser serving and building.
4. The test command is runnable from the project root without a Vite server, browser, watcher, or external service.
5. Node test failure produces a non-zero process exit code; success produces exit code 0.

### 3.3 Node requirement

Set the project package metadata to:

```json
"engines": {
  "node": ">=20.19.0"
}
```

Node.js 20.19.0 or later is required for the repository's Vite 7 development dependency and includes the adopted standard test runner.

## 4. Package and command changes

### 4.1 Exact `package.json` changes

Implementation changes only these fields:

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

The existing `dev`, `dev:open`, `build`, and `preview` scripts remain byte-for-byte unchanged. No dependencies or devDependencies are added, removed, or version-changed.

### 4.2 Lockfile handling

`/home/baisound/projects/javascript-roulette/package-lock.json` is updated with:

```bash
npm install --package-lock-only --ignore-scripts
```

This synchronizes root package metadata, including `engines` and the `test` script, without adding a package. The resulting lockfile must not add a test-runner package or change Vite dependency versions.

### 4.3 Independent command and exit behavior

Working directory:

```text
/home/baisound/projects/javascript-roulette
```

Command:

```bash
npm test
```

The command invokes:

```bash
node --test tests/roulette-core.test.mjs
```

Expected exit behavior:

- every assertion passes: exit code `0`;
- any assertion fails, test file cannot be imported, or test stub exhausts: non-zero exit code;
- a non-zero result blocks TASK-003 implementation completion and is recorded with the failing test name and assertion output.

## 5. Planned file structure and modification boundary

### 5.1 Files created during implementation

```text
/home/baisound/projects/javascript-roulette/src/roulette-core.mjs
/home/baisound/projects/javascript-roulette/tests/roulette-core.test.mjs
```

### 5.2 Files modified during implementation

```text
/home/baisound/projects/javascript-roulette/src/index.html
/home/baisound/projects/javascript-roulette/src/roulette.js
/home/baisound/projects/javascript-roulette/package.json
/home/baisound/projects/javascript-roulette/package-lock.json
```

### 5.3 Responsibility of each file

| File | Responsibility |
|---|---|
| `src/roulette-core.mjs` | Exports only the five in-scope pure functions and no DOM, Canvas, state-machine, CSS, timer, or event-listener code. |
| `src/roulette.js` | Imports the five functions and retains all DOM lookup, Canvas drawing, state, animation, timer, event listener, and browser startup behavior. |
| `src/index.html` | Changes `<script src="roulette.js"></script>` to `<script type="module" src="roulette.js"></script>`; markup content is otherwise unchanged. |
| `tests/roulette-core.test.mjs` | Uses `node:test` and `node:assert/strict` to test exact baseline behavior. |
| `package.json` | Adds the exact `engines.node` value and exact `test` script. |
| `package-lock.json` | Records the root package metadata synchronization from the package-lock-only npm command. |

### 5.4 Files not modified by TASK-003 implementation

```text
/home/baisound/projects/javascript-roulette/src/style.css
/home/baisound/projects/javascript-roulette/vite.config.js
/home/baisound/projects/javascript-roulette/docs/risk-register.md
/home/baisound/projects/javascript-roulette/docs/ai-team/tasks/TASK-002/**
/home/baisound/projects/javascript-roulette/docs/ai-team/tasks/TASK-003/task.md
```

No file outside `/home/baisound/projects/javascript-roulette/` is created or modified.

## 6. Module boundary and browser runtime preservation

### 6.1 Export format

`src/roulette-core.mjs` uses native ES module named exports:

```javascript
export {
  normalizeCandidates,
  validateCandidates,
  calculateStopAngle,
  calculateNextRotation,
  getRandomIndex
};
```

`src/roulette.js` imports those exact names:

```javascript
import {
  normalizeCandidates,
  validateCandidates,
  calculateStopAngle,
  calculateNextRotation,
  getRandomIndex
} from "./roulette-core.mjs";
```

### 6.2 Browser entry path

`index.html` uses:

```html
<script type="module" src="roulette.js"></script>
```

The script element remains at the end of `<body>`. ES module execution is deferred until HTML parsing completes. Therefore the existing DOM elements exist before `roulette.js` calls `document.getElementById`, `document.querySelector`, `canvas.getContext`, event registration, `resizeCanvas()`, and `handleInputChange()`.

Vite serves native ES modules from its existing `src` root and requires no Vite configuration change.

### 6.3 Runtime non-regression rules

The pure module must not:

- import `document`, `window`, Canvas, CSS, timers, or application state;
- call `crypto.getRandomValues` at module evaluation time;
- register event listeners;
- call `resizeCanvas`, `handleInputChange`, `startSpin`, or `finishSpin`;
- mutate candidate arrays or DOM values.

`roulette.js` retains the existing invocation sequence:

```text
DOM references
↓
state and Canvas setup
↓
event listener registration
↓
resizeCanvas()
↓
handleInputChange()
```

The Canvas remains statically redrawn only for initialization, input changes, and resize. CSS `transform` and CSS `transition` remain the only wheel-rotation animation mechanism. `requestAnimationFrame` remains absent from the rotation path.

## 7. Deterministic randomness design

### 7.1 Decision

Use dependency injection through the existing optional second parameter of `getRandomIndex`:

```javascript
getRandomIndex(count, getRandomValues = globalThis.crypto.getRandomValues.bind(globalThis.crypto))
```

`getRandomValues` accepts a `Uint32Array(1)`, writes one unsigned 32-bit value to index 0, and returns the same array.

### 7.2 Production behavior

`roulette.js` calls:

```javascript
getRandomIndex(candidates.length)
```

With no second argument, the default supplier calls `globalThis.crypto.getRandomValues`, which is the browser cryptographic randomness API. The application does not mock or replace global crypto.

### 7.3 Test behavior

Tests pass a local stub as the second argument. The stub supplies a finite predetermined sequence and never modifies `globalThis.crypto`.

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

If an implementation performs one more random draw than the expected sequence, the stub throws `random stub exhausted`; the Node test fails with a non-zero exit code. This is the finite termination rule for rejection-loop tests.

### 7.4 Rejection-sampling invariant

For `RANGE = 4294967296`:

```text
limit = floor(RANGE / N) * N
accepted value: 0 <= value < limit
rejected value: limit <= value <= 4294967295
index: value % N only after acceptance
```

No test and no production code may replace this with unconditional `value % N`. The only modulo mapping remains after `value < limit`, which gives every output index the same number of accepted source values.

## 8. Exact function test matrix

### 8.1 `normalizeCandidates(input)`

| Case | Input | Expected |
|---|---|---|
| whitespace and blank lines | `"  寿司  \n\n 焼肉 \n寿司  "` | `["寿司", "焼肉", "寿司"]` |
| empty string | `""` | `[]` |
| whitespace-only lines | `" \n\t\n　"` | `[]` |
| duplicates | `"寿司\n寿司\n焼肉"` | `["寿司", "寿司", "焼肉"]` |
| array input | `["寿司", "焼肉"]` | throws `TypeError` because the current baseline calls `.split()` |
| null input | `null` | throws `TypeError` because the current baseline calls `.split()` |

The function returns a new array of trimmed non-empty strings and performs no deduplication.

### 8.2 `validateCandidates(candidateList)`

| Case | Input | Expected `valid` | Expected `errors` |
|---|---|---:|---|
| zero candidates | `[]` | `false` | `["候補を入力してください"]` |
| one candidate | `["寿司"]` | `false` | `["候補を2件以上入力してください"]` |
| minimum valid | `["寿司", "焼肉"]` | `true` | `[]` |
| duplicate valid | `["寿司", "寿司"]` | `true` | `[]` |
| empty string retained by direct call | `["", "寿司"]` | `true` | `[]` |
| maximum valid | 20 strings `["0", ..., "19"]` | `true` | `[]` |
| over maximum | 21 strings `["0", ..., "20"]` | `false` | `["候補は20件以内で入力してください"]` |
| length 31 | `["A".repeat(31), "寿司"]` | `false` | `["候補名は30文字以内で入力してください"]` |
| length 30 | `["A".repeat(30), "寿司"]` | `true` | `[]` |
| null list | `null` | throws `TypeError` | not applicable |

The direct `["", "寿司"]` case records the current function’s behavior exactly: empty-line removal belongs to `normalizeCandidates`, not `validateCandidates`.

### 8.3 `calculateStopAngle(count, index)`

| Case | count | index | sectorAngle | sectorCenterAngle | Expected stopAngle |
|---|---:|---:|---:|---:|---:|
| N=2 first segment | 2 | 0 | 180 | 90 | 270 |
| N=4 first segment | 4 | 0 | 90 | 45 | 315 |
| N=4 middle segment | 4 | 1 | 90 | 135 | 225 |
| N=4 last segment | 4 | 3 | 90 | 315 | 45 |
| N=6 last segment | 6 | 5 | 60 | 330 | 30 |

The function is tested only with valid candidate counts and valid indices, which are the values supplied by the Version 1 application after validation and random-index selection.

### 8.4 `calculateNextRotation(rotation, stopAngle)`

The approved formula remains unchanged:

```text
currentRotationMod = ((rotation % 360) + 360) % 360
angleDelta = (stopAngle - currentRotationMod + 360) % 360
additionalRotations = 1800
finalRotation = rotation + additionalRotations + angleDelta
```

| Case | rotation | stopAngle | currentRotationMod | angleDelta | Expected finalRotation |
|---|---:|---:|---:|---:|---:|
| first spin | 0 | 315 | 0 | 315 | 2115 |
| consecutive N=4 spin | 2115 | 225 | 315 | 270 | 4185 |
| consecutive N=6 last segment | 4185 | 30 | 225 | 165 | 6150 |
| negative rotation normalization | -45 | 315 | 315 | 0 | 1755 |
| rotation above 360 | 765 | 315 | 45 | 270 | 2835 |
| aligned target | 315 | 315 | 315 | 0 | 2115 |

For every case, assert:

```text
finalRotation - rotation >= 1800
finalRotation > rotation
```

These assertions verify that each generated transition is strictly clockwise in cumulative CSS rotation space and cannot introduce a visual reverse rotation.

### 8.5 `getRandomIndex(count, getRandomValues)`

#### Range coverage

For every integer `N` from 2 through 20, use a stub sequence `[0]` and assert:

```text
0 <= getRandomIndex(N, stub) < N
```

#### Exact boundary coverage

| Case | N | limit | Stub sequence | Expected behavior | Expected index |
|---|---:|---:|---|---|---:|
| divisor minimum | 2 | 4294967296 | `[0]` | accept minimum | 0 |
| divisor maximum | 2 | 4294967296 | `[4294967295]` | accept maximum uint32 | 1 |
| non-divisor accepted upper boundary | 6 | 4294967292 | `[4294967291]` | accept `limit - 1` | 5 |
| rejection start | 6 | 4294967292 | `[4294967292, 0]` | reject `limit`, then accept 0 | 0 |
| above rejection start | 6 | 4294967292 | `[4294967293, 1]` | reject `limit + 1`, then accept 1 | 1 |
| repeated rejected values | 6 | 4294967292 | `[4294967292, 4294967293, 17]` | reject twice, then accept 17 | 5 |
| uint32 maximum rejected for non-divisor | 6 | 4294967292 | `[4294967295, 5]` | reject maximum uint32, then accept 5 | 5 |

Every boundary test asserts the stub call count equals the length of its listed sequence. A lower call count means rejection was skipped; a higher call count exhausts the stub and fails the test.

## 9. Test file implementation outline

`tests/roulette-core.test.mjs` contains:

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

It contains separate named `test(...)` blocks for:

1. normalization and duplicate preservation;
2. malformed normalization inputs;
3. validation boundaries and exact Japanese errors;
4. direct validator empty-string and malformed-list behavior;
5. approved stop-angle cases;
6. approved and normalized cumulative-rotation cases;
7. range safety for N=2 through N=20;
8. divisor boundary random values;
9. non-divisor rejection threshold and repeated-rejection values.

The test file never creates a DOM, starts Vite, accesses Canvas, mutates CSS, or dispatches spin events.

## 10. Commands or Procedures

### 10.1 Implementation procedure

1. Create `src/roulette-core.mjs` with the five current function bodies, preserving formulas, messages, validation checks, and rejection sampling.
2. Replace the five local function declarations in `src/roulette.js` with the exact named import from `./roulette-core.mjs`.
3. Change only the `script` element in `src/index.html` to `type="module"`.
4. Add the `engines.node` field and `test` script to `package.json`.
5. Run `npm install --package-lock-only --ignore-scripts`.
6. Create `tests/roulette-core.test.mjs` with every case in Sections 8 and 9.
7. Run `npm test` from `/home/baisound/projects/javascript-roulette`.
8. Run `npm run build` from the same directory to verify Vite imports the module and builds the unchanged browser application.
9. Start `npm run dev` and verify Vite reports its configured URL `http://localhost:8080`.
10. Perform the existing Version 1 manual smoke checks: valid two-candidate input enables spin, invalid input disables spin and shows the current error, the wheel rotates clockwise, and the result is displayed.

### 10.2 Expected command results

| Command | Expected result |
|---|---|
| `npm install --package-lock-only --ignore-scripts` | exit code 0; no dependency version additions or removals |
| `npm test` | exit code 0; all `node:test` cases pass |
| intentionally changed expected assertion | non-zero exit code; failing test name and assertion are printed |
| `npm run build` | exit code 0; Vite output completes without an import-resolution error |
| `npm run dev` | Vite ready log reports `http://localhost:8080` |

## 11. Compatibility and rollback

### 11.1 Compatibility

- Vite supports the proposed native ES module import path from `src/roulette.js` to `src/roulette-core.mjs`.
- The HTML still loads one application entry module at the end of body.
- CSS, Canvas static drawing, transform rotation, transition timing, pointer markup, aria attributes, and form markup are unchanged.
- The browser executes the same five function bodies with the same application arguments.
- Node tests import only `roulette-core.mjs`; they do not load `roulette.js` and therefore do not require a DOM.

### 11.2 Rollback

To remove the TASK-003 test foundation:

1. Restore `src/roulette.js` so it contains the five function definitions locally.
2. Restore `src/index.html` from `type="module"` to the classic `script src="roulette.js"` element.
3. Delete `src/roulette-core.mjs`.
4. Delete `tests/roulette-core.test.mjs`.
5. Remove `scripts.test` and `engines.node` from `package.json`.
6. Run `npm install --package-lock-only --ignore-scripts` to synchronize `package-lock.json`.
7. Run `npm run build` and `npm run dev`.
8. Recheck candidate normalization, validation, spin start, five full clockwise rotations, result text, and the fixed 12 o'clock pointer.

Rollback changes test infrastructure only and restores the same Version 1 browser behavior.

## 12. Completion criteria

TASK-003 implementation is complete only when all items below are true:

- `src/roulette-core.mjs` and `tests/roulette-core.test.mjs` are permanently stored in the repository.
- `npm test` runs from the project root without a Vite server and exits with code 0.
- An intentional assertion failure produces a non-zero test exit code.
- Every case in Sections 8.1 through 8.5 is implemented and passes.
- The test suite covers the five in-scope functions.
- The suite covers N=2 and N=6 rejection-sampling boundaries, including `limit - 1`, `limit`, `limit + 1`, repeated rejected values, 0, and 4294967295.
- The suite covers first, middle, and last segment stop angles; negative and over-360 rotations; and the 2115, 4185, 6150 consecutive-spin sequence.
- No unconditional modulo mapping is introduced.
- `npm run build` succeeds after the module boundary change.
- Browser Version 1 smoke behavior is unchanged.
- No TASK-002 artifact is modified.

## 13. Result

The selected design is a dependency-free Node.js standard-test-runner foundation with a pure native ES module for the five Version 1 regression targets. It uses deterministic injection for random-value sequences while retaining browser `crypto.getRandomValues` in production. It preserves the approved rotation formulas, rejection sampling, and browser runtime behavior.

## 14. Unresolved Items

None. The required source files, task artifacts, Vite configuration, and package configuration exist and provide sufficient evidence for the implementation design.

## 15. Required validation before Critic review

- All proposed paths are inside `/home/baisound/projects/javascript-roulette/`.
- TASK-002 is referenced only as completed historical evidence and is not modified.
- This proposal changes no application, package, lockfile, Vite, risk-register, or task-definition file.
- The proposal defines a runner, Node version, commands, exact changed files, module boundary, deterministic random stub, numeric test inputs, expected outputs, rollback, and completion criteria.
- Implementation Authorization remains `NOT_AUTHORIZED` until TASK-003 reaches its own Final Plan Gate.
