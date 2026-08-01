# Final Implementation Plan for TASK-002

## 1. 適用範囲とファイル構成
本計画は `projects/javascript-roulette/` の TASK-002 にのみ適用する。本番コードは `projects/javascript-roulette/src/` 直下に配置する。

```text
projects/javascript-roulette/
├── PROJECT.md
├── src/
│   ├── index.html
│   ├── style.css
│   └── roulette.js
└── docs/
    └── ai-team/
        └── tasks/
            └── TASK-002/
                ├── task.md
                ├── builder-proposal.md
                ├── critic-review.md
                ├── builder-response.md
                ├── judge-decision.md
                └── final-plan.md
```

- `src/index.html`: アプリケーション構造、フォーム、ライブリージョンを定義する。
- `src/style.css`: レイアウト、固定ポインター、レスポンシブ表示、Canvas の CSS transition を定義する。
- `src/roulette.js`: 入力処理、検証、乱数、停止角度、Canvas 静的描画、状態遷移、抽選イベントを実装する。

外部フレームワーク、バックエンド、`requestAnimationFrame` による回転アニメーションは使用しない。

---

## 2. 完成 HTML

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="style.css">
  <title>JavaScript Roulette</title>
</head>
<body>
  <main>
    <div class="roulette-wrapper">
      <div class="roulette-pointer" aria-hidden="true"></div>
      <canvas id="rouletteCanvas"></canvas>
    </div>

    <label for="candidateInput">候補リスト入力（1行1候補）</label>
    <textarea
      id="candidateInput"
      placeholder="候補を入力"
      aria-describedby="candidateHelp errorMessage"
    ></textarea>
    <div id="candidateHelp" role="note">
      1行につき1候補、2〜20件まで。候補名は30文字以内です。
    </div>

    <button id="spinButton" type="button" disabled>回す</button>
    <div id="errorMessage" role="alert" aria-live="assertive"></div>
    <div id="result" role="status" aria-live="polite"></div>
  </main>
  <script src="roulette.js"></script>
</body>
</html>
```

`roulette-pointer` は `.roulette-wrapper` の子であり、`#rouletteCanvas` の外側に置く。Canvas だけを CSS transform で回転するため、ポインターは常に12時位置に残る。

`roulette.js` の初期化時に次の DOM 参照と状態値を定義する。

```javascript
const textarea = document.getElementById("candidateInput");
const spinButton = document.getElementById("spinButton");
const errorMessage = document.getElementById("errorMessage");
const result = document.getElementById("result");

let candidates = [];
let state = "idle";
let currentRotation = 0;
let finalRotation = 0;
let selectedIndex = -1;
let selectedCandidate = "";
let fallbackTimer = null;
let spinFinished = false;
```

---

## 3. CSS、固定ポインター、レスポンシブ表示

```css
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 16px;
}

main {
  width: min(100%, 400px);
  margin: 0 auto;
}

.roulette-wrapper {
  position: relative;
  width: min(100%, 400px);
  margin: 0 auto 16px;
}

#rouletteCanvas {
  display: block;
  width: 100%;
  height: auto;
  margin: 0 auto;
  transition: transform 3000ms cubic-bezier(0.1, 0.8, 0.1, 1);
}

.roulette-pointer {
  position: absolute;
  z-index: 1;
  top: 0;
  left: 50%;
  width: 24px;
  height: 18px;
  background: #222;
  clip-path: polygon(0 0, 100% 0, 50% 100%);
  transform: translate(-50%, 0);
  pointer-events: none;
}

#candidateInput {
  display: block;
  width: 100%;
  min-height: 160px;
}

#spinButton {
  display: block;
  width: 100%;
  max-width: 320px;
  margin: 16px auto 0;
}
```

`main`、`.roulette-wrapper`、textarea は最大幅400px、Canvas の論理表示幅は最大360px、狭い画面では親幅100%とする。Canvas は `margin: 0 auto` で wrapper の中心へ配置するため、wrapper 幅400pxでも pointer の `left: 50%` と Canvas の中心が一致する。幅375pxの表示で横スクロールを発生させない。ポインターは Canvas より高い `z-index: 1` を持ち、Canvas の transform の対象外とする。

---

## 4. Canvas 静的描画

Canvas は候補入力の変更後、初期化時、または resize 後にだけ再描画する。回転中に Canvas 内部を毎フレーム再描画しない。

Canvas の角度基準と配置は次のとおりとする。

- Canvas の12時方向は `-Math.PI / 2` ラジアン（270度）である。
- セクター index 0 は12時方向から始める。
- セクターは時計回りに増加する。
- CSS の `rotate(Xdeg)` における正の `X` は時計回りである。

描画で使用する値は次のとおりとする。

```javascript
const centerX = displaySize / 2;
const centerY = displaySize / 2;
const radius = displaySize / 2 - 8;
const sectorAngleRad = (2 * Math.PI) / N;

const sectorColors = [
  "#FF6B6B",
  "#FFD93D",
  "#6BCB77",
  "#4D96FF",
  "#845EC2",
  "#FF9671"
];
```

`drawRoulette(candidates)` は、候補数が2から20のときに次の処理を実行する。

```javascript
function drawRoulette(candidates) {
  const N = candidates.length;
  const centerX = displaySize / 2;
  const centerY = displaySize / 2;
  const radius = displaySize / 2 - 8;
  const sectorAngleRad = (2 * Math.PI) / N;

  ctx.clearRect(0, 0, displaySize, displaySize);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  candidates.forEach((candidate, i) => {
    const startAngle = -Math.PI / 2 + i * sectorAngleRad;
    const endAngle = startAngle + sectorAngleRad;
    const textAngle = startAngle + sectorAngleRad / 2;
    const textRadius = radius * 0.65;
    const textX = centerX + Math.cos(textAngle) * textRadius;
    const textY = centerY + Math.sin(textAngle) * textRadius;
    const displayLabel = candidate.length <= 10
      ? candidate
      : `${candidate.slice(0, 9)}…`;

    ctx.fillStyle = sectorColors[i % sectorColors.length];
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#111";
    ctx.fillText(displayLabel, textX, textY);
  });
}
```

10文字以下の候補はそのまま描画する。11文字以上は先頭9文字と `…` を描画する。たとえば `"ABCDEFGHIJK"` は `"ABCDEFGHI…"` と表示する。この省略は Canvas 上の `displayLabel` にだけ適用し、配列内の元の `candidate` を変更しない。

---

## 5. 高 DPI Canvas 初期化と resize

Canvas の論理描画座標は `displaySize` を基準とした CSS ピクセル単位で扱う。内部バッファだけを device pixel ratio 倍にする。

```javascript
const wrapper = document.querySelector(".roulette-wrapper");
const canvas = document.getElementById("rouletteCanvas");
const ctx = canvas.getContext("2d");
let displaySize = 0;

function resizeCanvas() {
  displaySize = Math.min(wrapper.clientWidth, 360);
  const dpr = window.devicePixelRatio || 1;

  canvas.style.width = `${displaySize}px`;
  canvas.style.height = `${displaySize}px`;
  canvas.width = Math.round(displaySize * dpr);
  canvas.height = Math.round(displaySize * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  if (validateCandidates(candidates).valid) {
    drawRoulette(candidates);
  } else {
    ctx.clearRect(0, 0, displaySize, displaySize);
  }
}

window.addEventListener("resize", resizeCanvas);
```

すべての関数とイベントリスナーを登録した後、初期化時に `resizeCanvas()`、`handleInputChange()` の順で各1回実行する。`ctx.scale()` は使用しない。resize 時は上記の width、height、transform を再設定し、その時点の有効候補で Canvas を1回静的再描画する。CSS transition による回転中に resize が発生した場合も、回転角を timer や `requestAnimationFrame` で補間しない。

---

## 6. 停止角度と累積回転

`N` は候補数、`selectedIndex` は `0 <= selectedIndex < N` の当選 index、`currentRotation` は前回終了時の累積回転角度（degree）である。承認済みの計算式は次のとおりとする。

```plaintext
sectorAngle = 360 / N

sectorCenterAngle =
selectedIndex * sectorAngle + sectorAngle / 2

stopAngle =
(360 - sectorCenterAngle) % 360

currentRotationMod =
((currentRotation % 360) + 360) % 360

angleDelta =
(stopAngle - currentRotationMod + 360) % 360

additionalRotations = 1800

finalRotation =
currentRotation + additionalRotations + angleDelta
```

`stopAngle` に270度基準を追加しない。Canvas 描画の `-Math.PI / 2` はセクター配置の開始位置であり、停止角度の式は上記だけで決定する。

```javascript
function calculateStopAngle(N, selectedIndex) {
  const sectorAngle = 360 / N;
  const sectorCenterAngle =
    selectedIndex * sectorAngle + sectorAngle / 2;

  return (360 - sectorCenterAngle) % 360;
}

function calculateNextRotation(currentRotation, stopAngle) {
  const currentRotationMod =
    ((currentRotation % 360) + 360) % 360;
  const angleDelta =
    (stopAngle - currentRotationMod + 360) % 360;

  return currentRotation + 1800 + angleDelta;
}
```

### 検算1

```plaintext
currentRotation = 0
N = 4
selectedIndex = 0
sectorAngle = 90
sectorCenterAngle = 45
stopAngle = 315
currentRotationMod = 0
angleDelta = 315
finalRotation = 2115
```

`2115 % 360 = 315`。静止時45度のセクター0中心に315度を加えると360度となり、12時固定ポインターに停止する。

### 検算2

```plaintext
currentRotation = 2115
N = 4
selectedIndex = 1
sectorAngle = 90
sectorCenterAngle = 135
stopAngle = 225
currentRotationMod = 315
angleDelta = 270
finalRotation = 4185
```

`4185 % 360 = 225`。静止時135度のセクター1中心に225度を加えると360度となり、12時固定ポインターに停止する。

### 検算3

```plaintext
currentRotation = 4185
N = 6
selectedIndex = 5
sectorAngle = 60
sectorCenterAngle = 330
stopAngle = 30
currentRotationMod = 225
angleDelta = 165
finalRotation = 6150
```

`6150 % 360 = 30`。静止時330度のセクター5中心に30度を加えると360度となり、12時固定ポインターに停止する。

各抽選では `additionalRotations = 1800` を必ず加えるため、`angleDelta` が0度の場合も5回転し、逆回転しない。アニメーション完了時に `currentRotation = finalRotation` を実行するため、次の抽選は前回の累積角度から時計回りに継続する。

---

## 7. 乱数生成

`crypto.getRandomValues()` と rejection sampling を使用する。`rand % N` は `rand < limit` のときにだけ実行する。

```javascript
function getRandomIndex(N, getRandomValues = window.crypto.getRandomValues.bind(window.crypto)) {
  if (!Number.isInteger(N) || N < 2 || N > 20) {
    throw new RangeError("N must be an integer from 2 through 20");
  }

  const RANGE = 0x100000000;
  const limit = Math.floor(RANGE / N) * N;
  const array = new Uint32Array(1);

  do {
    getRandomValues(array);
  } while (array[0] >= limit);

  return array[0] % N;
}
```

`limit` は `4294967296` 未満で最大の `N` の倍数である。`0 <= rand < limit` の値だけを `rand % N` に渡すため、各 index は同じ回数だけ対応する。第2引数 `getRandomValues` は既定値では `window.crypto.getRandomValues` を使い、自動テストでは値列を返す代替関数を渡す。

---

## 8. 入力正規化、検証、エラー表示

入力は改行で分割し、前後の空白を除去し、空行を除外する。`trim()` により半角空白と全角空白を含む ECMAScript の空白文字を除去する。

```javascript
function normalizeCandidates(input) {
  return input
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);
}
```

候補の重複は保持する。同じ文字列が複数行にあれば、各行は独立したセクターと抽選枠になる。deduplicate は実行しない。

```javascript
function validateCandidates(candidates) {
  const errors = [];

  if (candidates.length === 0) {
    errors.push("候補を入力してください");
  }
  if (candidates.length === 1) {
    errors.push("候補を2件以上入力してください");
  }
  if (candidates.length >= 21) {
    errors.push("候補は20件以内で入力してください");
  }
  if (candidates.some(candidate => candidate.length >= 31)) {
    errors.push("候補名は30文字以内で入力してください");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function applyValidation(candidates) {
  const validation = validateCandidates(candidates);
  errorMessage.textContent = validation.errors.join("\n");
  spinButton.disabled = !validation.valid;
  return validation;
}

function handleInputChange() {
  candidates = normalizeCandidates(textarea.value);
  state = "idle";
  const validation = applyValidation(candidates);

  if (validation.valid) {
    drawRoulette(candidates);
  } else {
    ctx.clearRect(0, 0, displaySize, displaySize);
  }
}
```

`textarea.addEventListener("input", handleInputChange)` を登録する。初期化時も `handleInputChange()` を1回実行する。`errors.length > 0` の場合、抽選を開始しない。候補行の自動削除、21件目以降の自動切り捨て、31文字への自動短縮、重複候補の削除は実行しない。エラー文は `role="alert"` と `aria-live="assertive"` を持つ `#errorMessage` の `textContent` へ設定する。

---

## 9. 状態管理

状態は `idle`、`spinning`、`result` の3つだけとする。validation error は状態ではなく、検証結果を保持する UI データである。

| State | textarea | spinButton | result | validationError | Transition |
|---|---|---|---|---|---|
| `idle` | enabled | 有効入力の場合のみ enabled | 前回結果を保持可能 | 現在の validation 結果に従う | spin button click → `spinning`、input change → `idle` |
| `spinning` | disabled | disabled | 前回結果を保持 | なし。`errorMessage.textContent = ""` | spin 完了 → `result` |
| `result` | enabled | 有効入力の場合のみ enabled | `当選：${selectedCandidate}` | なし | spin button click → `spinning`、input change → `idle` |

初期化時は `initial → idle` とし、空の textarea を検証して `spinButton.disabled = true` とする。`idle` で無効入力の場合は state を変えず、`spinButton.disabled = true` のまま抽選を開始しない。

---

## 10. 抽選アニメーション

回転時間とフォールバック遅延は次の値とする。

```javascript
const SPIN_DURATION = 3000;
const FALLBACK_DELAY = 3200;
```

Canvas に設定する CSS transition は次の1つだけとする。

```css
#rouletteCanvas {
  transition: transform 3000ms cubic-bezier(0.1, 0.8, 0.1, 1);
}
```

抽選開始は `spinButton` の click だけで行う。`spinning` 中の click は return する。抽選開始関数は次のとおりとする。

```javascript
function startSpin() {
  if (state === "spinning") return;

  candidates = normalizeCandidates(textarea.value);
  const validation = applyValidation(candidates);
  if (!validation.valid) {
    state = "idle";
    return;
  }

  selectedIndex = getRandomIndex(candidates.length);
  selectedCandidate = candidates[selectedIndex];
  const stopAngle =
    calculateStopAngle(candidates.length, selectedIndex);
  finalRotation =
    calculateNextRotation(currentRotation, stopAngle);

  spinFinished = false;
  state = "spinning";
  textarea.disabled = true;
  spinButton.disabled = true;
  errorMessage.textContent = "";
  canvas.style.transform = `rotate(${finalRotation}deg)`;
  fallbackTimer = setTimeout(finishSpin, FALLBACK_DELAY);
}

spinButton.addEventListener("click", startSpin);
```

`selectedCandidate` は spin 開始時に `selectedIndex` から保存し、アニメーション中に textarea が無効である間は変化しない。

```javascript
canvas.addEventListener("transitionend", event => {
  if (event.propertyName === "transform") {
    finishSpin();
  }
});
```

`finishSpin()` は次の順で実行する。

```javascript
function finishSpin() {
  if (spinFinished) return;

  spinFinished = true;
  clearTimeout(fallbackTimer);
  currentRotation = finalRotation;
  state = "result";
  textarea.disabled = false;
  result.textContent = `当選：${selectedCandidate}`;

  candidates = normalizeCandidates(textarea.value);
  const validation = applyValidation(candidates);
  if (validation.valid) {
    spinButton.disabled = false;
  } else {
    spinButton.disabled = true;
  }
}
```

`transitionend` と `setTimeout` のどちらが先に起きても `spinFinished` により終了処理は1回だけ実行する。`currentRotation` は終了時だけ `finalRotation` に更新する。

---

## 11. アクセシビリティと XSS 対策

- `<label for="candidateInput">` が textarea に関連付く。
- `#candidateHelp` の文言は「1行につき1候補、2〜20件まで。候補名は30文字以内です。」とする。
- textarea の `aria-describedby` は `"candidateHelp errorMessage"` とする。
- `#errorMessage` は `role="alert"` と `aria-live="assertive"` を持つ。
- `#result` は `role="status"` と `aria-live="polite"` を持つ。
- `#spinButton` は `type="button"` を持ち、spinning 中は `disabled = true` とする。
- `.roulette-pointer` は視覚的な装飾であるため `aria-hidden="true"` とする。
- textarea へ文字を入力し、Tab で button へ移動し、Enter または Space で button を操作する。独自のキーボードイベントは追加しない。
- ユーザー入力を DOM へ表示する箇所は `textContent` を使用し、`innerHTML` と `insertAdjacentHTML` を使用しない。
- Canvas の候補文字列は `ctx.fillText()` だけで描画する。候補値を HTML や JavaScript として実行しない。

---

## 12. 自動テスト

自動テストは Node.js 標準の `node --test` またはブラウザのテスト HTML で、DOM に依存しない関数を対象に実行する。

### `normalizeCandidates`

| Input | Expected |
|---|---|
| `"  寿司  \n\n焼肉\n寿司"` | `["寿司", "焼肉", "寿司"]` |

### `validateCandidates`

| Input | Expected |
|---|---|
| `[]` | `valid === false`、`errors === ["候補を入力してください"]` |
| `["寿司"]` | `valid === false`、`errors === ["候補を2件以上入力してください"]` |
| `["寿司", "焼肉"]` | `valid === true`、`errors === []` |
| 20件の候補配列 | `valid === true`、`errors === []` |
| 21件の候補配列 | `valid === false`、`errors === ["候補は20件以内で入力してください"]` |
| 31文字の候補を1件含む配列 | `valid === false`、`errors === ["候補名は30文字以内で入力してください"]` |

重複候補の配列 `["寿司", "寿司"]` は `valid === true` であり、配列内容を変更しない。

### `calculateStopAngle`

| N | selectedIndex | Expected stopAngle |
|---|---:|---:|
| 4 | 0 | 315 |
| 4 | 1 | 225 |
| 6 | 5 | 30 |

### `calculateNextRotation`

| currentRotation | stopAngle | Expected finalRotation |
|---:|---:|---:|
| 0 | 315 | 2115 |
| 2115 | 225 | 4185 |
| 4185 | 30 | 6150 |

### `getRandomIndex`

- `N = 2` から `N = 20` の各値で、返値が常に `0 <= result < N` であること。
- `rand = limit - 1` を返す代替 `getRandomValues` では、その値を受理して `result = (limit - 1) % N` を返すこと。
- `rand = limit` の後に `0` を返す代替 `getRandomValues` では、最初の値を棄却し、2回目の値から `result = 0` を返すこと。
- `rand > limit` の後に `0` を返す代替 `getRandomValues` では、最初の値を棄却し、2回目の値から `result = 0` を返すこと。

rejection sampling の境界テストでは、`getRandomIndex(N, getRandomValues)` の第2引数に値列を順に `Uint32Array` へ設定する関数を渡し、実際の `crypto.getRandomValues` を呼び出さない。

---

## 13. 手動テスト

### Canvas 描画
操作手順: `A`、`B`、`C`、`D` の4候補を1行ずつ入力する。  
期待結果: Canvas は4等分され、各候補ラベルが対応するセクターに描画される。

### Pointer 整合
操作手順: ルーレットを表示し、抽選を実行する。  
期待結果: pointer は常に12時位置に固定され、Canvas と一緒に回転しない。

### N=4、selectedIndex=0
操作手順: テスト用の乱数供給関数で `selectedIndex = 0` を選び、4候補で抽選する。  
期待結果: セクター0の中心が12時 pointer に停止する。

### N=4、selectedIndex=1
操作手順: テスト用の乱数供給関数で `selectedIndex = 1` を選び、4候補で抽選する。  
期待結果: セクター1の中心が12時 pointer に停止する。

### N=6、selectedIndex=5
操作手順: テスト用の乱数供給関数で `selectedIndex = 5` を選び、6候補で抽選する。  
期待結果: セクター5の中心が12時 pointer に停止する。

### 3回連続抽選
操作手順: 検算1、検算2、検算3の順に `selectedIndex` を固定して3回抽選する。  
期待結果: `finalRotation` は2115、4185、6150となる。逆回転せず、各回は時計回りに5回転以上し、各当選セクターが12時 pointer に停止する。

### 同一 selectedIndex の連続当選
操作手順: 同じ `selectedIndex` を2回連続で選ぶ。  
期待結果: 2回目も `additionalRotations = 1800` が加算され、1800度以上時計回りに回転して停止する。

### 回転中の連打
操作手順: 抽選開始後、3000msの回転中に spin button を連打する。  
期待結果: button は disabled のため追加 spin は始まらず、終了処理と結果表示は1回だけ実行される。

### 幅375px
操作手順: ビューポート幅を375pxに設定して表示する。  
期待結果: 横スクロールが発生せず、roulette とフォームが画面内に収まる。

### devicePixelRatio=2
操作手順: devicePixelRatio が2の環境で表示する。  
期待結果: Canvas の円周、境界線、候補文字がぼやけない。

### validation aria-live
操作手順: 空欄、1件、21件、31文字の候補を順に入力する。  
期待結果: `errorMessage` が各検証結果で更新され、スクリーンリーダーへ通知される。

### result aria-live
操作手順: 有効な候補で抽選を完了する。  
期待結果: `result` が `当選：候補名` に更新され、スクリーンリーダーへ通知される。

### keyboard
操作手順: マウスを使わず textarea へ入力し、Tab で spin button に移動して Enter または Space を押す。  
期待結果: 主要操作を完了でき、回転中は button を再実行できない。

---

## 14. 実装順序

1. `index.html` を作成する。
2. label、help、live region、disabled button を含む Accessibility HTML を作成する。
3. `.roulette-wrapper` と `.roulette-pointer` を作成する。
4. `style.css` に基本レイアウトを実装する。
5. 375px幅まで収まるレスポンシブ CSS を実装する。
6. High-DPI Canvas 初期化を実装する。
7. `normalizeCandidates` を実装する。
8. `validateCandidates` と `applyValidation` を実装する。
9. `drawRoulette` を実装する。
10. `getRandomIndex` を実装する。
11. `calculateStopAngle` を実装する。
12. `calculateNextRotation` を実装する。
13. `idle`、`spinning`、`result` の state 管理を実装する。
14. spin 処理と CSS transition を実装する。
15. `transitionend`、fallback timer、`finishSpin` を実装する。
16. 自動テストを実装して実行する。
17. 手動テストを実行する。

---

## 15. 完了条件

- [ ] `FINAL_PLAN_PASS`
- [ ] Canvas 静的描画 PASS
- [ ] 12時 pointer 整合 PASS
- [ ] N=4、selectedIndex=0 検算 PASS
- [ ] N=4、selectedIndex=1 検算 PASS
- [ ] N=6、selectedIndex=5 検算 PASS
- [ ] 3回連続抽選 PASS
- [ ] 同一 selectedIndex 連続抽選 PASS
- [ ] Rejection Sampling 境界テスト PASS
- [ ] 回転中連打防止 PASS
- [ ] devicePixelRatio=2 High-DPI テスト PASS
- [ ] 375px レスポンシブテスト PASS
- [ ] validation aria-live テスト PASS
- [ ] result aria-live テスト PASS
- [ ] キーボード操作 PASS
- [ ] XSS 対策としてユーザー入力に `innerHTML` と `insertAdjacentHTML` を使用しない

## 16. 実装認可

Judge の設計承認は `APPROVED` であるが、Final Plan Consistency Check はまだ `FINAL_PLAN_PASS` を返していない。したがって本計画書の更新後も Implementation Authorization は **NOT AUTHORIZED** とする。本番コードは Judge が `FINAL_PLAN_PASS` を返した後にのみ `projects/javascript-roulette/src/` へ作成または変更できる。