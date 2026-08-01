# Builder Proposal (TASK-002 Redesign - Round 1 Revised)

## 1. ファイル構成
プロジェクト固有ルール `PROJECT.md` の要求に従い、不要な中間ディレクトリ（`src/javascript-roulette/` 等）を完全に排除し、本番アプリケーションコードは以下のフラットな構成で `projects/javascript-roulette/src/` 直下に配置します。

```
projects/javascript-roulette/
├── PROJECT.md
├── src/
│   ├── index.html       # アプリケーション構造・アクセシビリティ定義
│   ├── style.css        # レスポンシブレイアウト・CSS Transition定義
│   └── roulette.js      # バリデーション、乱数、角度計算、Canvas描画、状態遷移、イベント処理
└── docs/
    └── ai-team/
        └── tasks/
            └── TASK-002/
                ├── task.md
                ├── builder-proposal.md
                ├── critic-review.md
                └── builder-response.md
```

---

## 2. ルーレット停止角度の数理モデル
12時方向に固定されたポインターに対し、選ばれたセクターの中央が時計回り回転を伴って正確に停止するための数理ロジックを定義します。

### 座標系定義
- **基準角 (0度):** Canvas の `arc(x, y, r, startAngle, endAngle)` において、真上（12時方向）を `270度`（または `-90度`）とします。
- **配置方向:** セクター index 0 は12時方向（270度）から開始し、時計回りに配置されます。
- **回転方向:** CSS の `transform: rotate(Xdeg)` は正の値で時計回りに回転します。

### 数理計算式
$N$ を候補数、$selectedIndex$ を当選インデックス（$0 \le selectedIndex < N$）とします。

1. **セクターごとの中心角度算出 ($sectorCenterAngle$):**
   12時方向（0度）を基準とし、時計回りに測った各セクターの中央角度です。
   $$\text{sectorAngle} = \frac{360}{N}$$
   $$\text{sectorCenterAngle}(i) = i \times \text{sectorAngle} + \frac{\text{sectorAngle}}{2}$$

2. **静止状態での目標時計回り回転角 ($stopAngle$):**
   ルーレットを回転させ、インデックス $selectedIndex$ のセクター中央を12時（0度基準）に合わせるために必要な、盤面全体の時計回り最小回転角です。
   $$\text{stopAngle} = (360 - \text{sectorCenterAngle}(selectedIndex)) \bmod 360$$

3. **連続抽選に対応した累積回転角の算出 ($finalRotation$):**
   逆回転を絶対に起こさず、常に時計回りに最低5回転（$1800$度）以上の回転量を確保しながら正確に停止させる累積角度の計算です。現在の累積回転角度を `currentRotation` とします。
   * 現在の回転位置の剰余角:
     $$\text{currentRotationMod} = \text{currentRotation} \bmod 360$$
   * 目標停止位置までの必要な追加回転角差分:
     $$\text{angleDelta} = (\text{stopAngle} - \text{currentRotationMod} + 360) \bmod 360$$
   * 最低限追加する回転角度（5回転分）:
     $$\text{additionalRotations} = 1800$$
   * 次回の目標累積回転角度:
     $$\text{finalRotation} = \text{currentRotation} + \text{angleDelta} + \text{additionalRotations}$$

### 数値具体例による検証

#### 検算ケース1: $N = 4$, $selectedIndex = 0$, $currentRotation = 0$
- $\text{sectorAngle} = 90$ 度
- $\text{sectorCenterAngle}(0) = 0 \times 90 + 45 = 45$ 度（12時方向から時計回りに45度進んだ位置、すなわち右上 1:30 方向）
- $\text{stopAngle} = (360 - 45) \bmod 360 = 315$ 度
- $\text{currentRotationMod} = 0 \bmod 360 = 0$ 度
- $\text{angleDelta} = (315 - 0 + 360) \bmod 360 = 315$ 度
- $\text{finalRotation} = 0 + 315 + 1800 = 2115$ 度
- **検証:** $2115 \bmod 360 = 315$ 度。初期位置で右上（45度方向）にあったセクター0を時計回りに315度回転させると、位置は $45 + 315 = 360 \equiv 0$ 度（真上12時位置）にピッタリ重なり、**正常に停止します**。

#### 検算ケース2: $N = 4$, $selectedIndex = 1$, $currentRotation = 2115$ (連続抽選)
- $\text{sectorAngle} = 90$ 度
- $\text{sectorCenterAngle}(1) = 1 \times 90 + 45 = 135$ 度（右下 4:30 方向）
- $\text{stopAngle} = (360 - 135) \bmod 360 = 225$ 度
- $\text{currentRotationMod} = 2115 \bmod 360 = 315$ 度（セクター0が12時で停止している状態）
- $\text{angleDelta} = (225 - 315 + 360) \bmod 360 = 270$ 度
- $\text{finalRotation} = 2115 + 270 + 1800 = 4185$ 度
- **検証:** $4185 \bmod 360 = 225$ 度。前回の回転終了角度 2115度から、時計回りに $270 + 1800$ 度回転します。静止状態の 135度方向（右下）にあったセクター1を 225度時計回りに回すと $135 + 225 = 360 \equiv 0$ 度（真上12時位置）となり、**逆回転せずに滑らかに時計回りしてセクター1が正常に停止します**。

#### 検算ケース3: $N = 6$, $selectedIndex = 5$, $currentRotation = 4185$
- $\text{sectorAngle} = 60$ 度
- $\text{sectorCenterAngle}(5) = 5 \times 60 + 30 = 330$ 度（左上 11:00 方向）
- $\text{stopAngle} = (360 - 330) \bmod 360 = 30$ 度
- $\text{currentRotationMod} = 4185 \bmod 360 = 225$ 度
- $\text{angleDelta} = (30 - 225 + 360) \bmod 360 = 165$ 度
- $\text{finalRotation} = 4185 + 165 + 1800 = 6150$ 度
- **検証:** $6150 \bmod 360 = 30$ 度。静止状態で 330度方向（左上）にあったセクター5を時計回りに30度回転させると $330 + 30 = 360 \equiv 0$ 度（真上12時位置）となり、**連続回転時でも時計回りにのみ回転して正常に停止します**。

---

## 3. 乱数生成（Rejection Sampling による剰余バイアス完全排除）
$N$ が $2^{32}$ の約数でない場合に発生する剰余バイアス（Modulo Bias）を完全に排除するため、**Rejection Sampling（棄却サンプリング）**をJavaScriptで実装します。

### アルゴリズムと実装コード
- 使用する整数型: `Uint32Array`（32ビット符号なし整数、最大値 $4294967295$）
- **拒否上限（limit）の算出:**
  $2^{32} = 4294967296$ 未満で最大の $N$ の倍数 `limit` を求めます。
  $$\text{limit} = \lfloor 4294967296 / N \rfloor \times N$$
- **棄却条件:**
  `window.crypto.getRandomValues()` から取得した32ビット整数 `rand` が `rand >= limit` である場合は、その乱数を破棄して再取得をループします。
- **0 〜 N-1 へのマッピング:**
  安全な範囲内の乱数 `rand` から `rand % N` を取ることで、すべてのインデックスの当選確率が**100%数学的に均等（無偏）**になります。

```javascript
function getRandomIndex(N) {
    if (N < 2 || N > 20) {
        throw new Error("Invalid candidate count N");
    }
    const limit = Math.floor(4294967296 / N) * N;
    const array = new Uint32Array(1);
    while (true) {
        window.crypto.getRandomValues(array);
        const rand = array[0];
        if (rand < limit) {
            return rand % N;
        }
    }
}
```

---

## 4. 入力バリデーションおよびエラーハンドリング
要件漏れのないセキュアで厳格なバリデーションアルゴリズムを実装します。

### 制限値の定義
- **最低候補数:** 2件
- **最大候補数:** 20件
- **候補名最大文字数:** 30文字（サニタイズ・トリム後）
- **重複候補の扱い:** 重複を許可（それぞれ独立したルーレットセグメントとして個別に描画・抽選されます）。

### 処理フロー
1. テキストエリアの入力値を改行 `\n` で分割します。
2. 各候補の前後空白（全角空白 `\u3000` および半角空白・改行コード等）を正規表現で完全に `trim` します。
3. 空行（トリム後に文字数が0のもの）を完全に除外します。
4. **長さチェック:** いずれか1件でも30文字を超える候補が存在すれば、検証エラーとします。
5. **件数チェック:** 有効な候補数が2件未満、あるいは20件を超える場合は、検証エラーとします。

### エラー時のUX挙動
- **勝手に切り捨てない / 勝手に自動削除しない:** ユーザーの入力をサイレントに削除・修正することは一切行いません。
- **抽選の抑止:** 状態をロックし、スピンボタンを強制的に `disabled` にします。
- **具体的なエラーのフィードバック:**
  - 候補数が1件以下の場合: 「候補を2件以上入力してください。」
  - 候補数が21件以上の場合: 「候補数は最大20件までです。（現在 X 件）」
  - 30文字を超える候補がある場合: 「30文字を超える候補があります。（"◯◯..." は X 文字）」
  - 空行・空白のみの場合: 「有効な候補が入力されていません。」
- **支援技術への通知:** エラー領域の `role="status"` および `aria-live="polite"` を用いて、エラーテキストを視覚障害者などのスクリーンリーダーに即座に読み上げさせます。

---

## 5. 状態管理（State Machine）
連打防止、不正遷移の防止、および連続抽選時のUX破綻を防ぐ厳格な状態遷移図・一覧表を定義します。

### アプリケーション状態の一覧

| 状態名 | 役割説明 | textarea (入力欄) | spinButton (回すボタン) | 結果表示 | エラー表示 | 次状態への遷移イベント・条件 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`idle`** | 初期状態、または入力変更時の待機状態 | 有効（編集可） | **有効** (バリデーション成功時)<br>**無効** (バリデーション失敗時) | クリア（なし） | バリデーションエラーがあれば表示、なければ非表示 | ボタン押下: `spinning` へ遷移<br>入力変更: `idle` を維持（再検証） |
| **`spinning`** | ルーレット回転中（操作ロック） | **無効 (disabled)** | **無効 (disabled)** | クリア（なし） | 非表示 | CSS transition 終了 (`transitionend`): `result` へ遷移 |
| **`result`** | 抽選結果発表中 | 有効（編集可） | **有効** (バリデーション成功時)<br>**無効** (バリデーション失敗時) | **当選結果を強調表示** | バリデーションエラーがあれば表示、なければ非表示 | ボタン押下: 古い結果をクリアし `spinning` へ遷移<br>入力変更: `idle` へ遷移（結果クリア） |

---

## 6. CSSアニメーションおよび Canvas 描画方式
Canvas による静的描画と CSS による回転アニメーションを最適に組み合わせ、デバイス負荷を最小限に抑えながら滑らかな回転を実現します。

### Canvas は静的描画のみ
- ルーレットの円盤（セクター背景・テキスト描画）は、候補リストが更新されたタイミング（`idle` への遷移や入力変更時）に**1回だけ静的に Canvas に描画**します。
- アニメーション中に `requestAnimationFrame` やタイマーによる Canvas 内部の再描画（クリアおよび再 rotate 描画）は**絶対に実行しません**。

### 回転およびアニメーション制御
- **回転:** Canvas 要素そのもの（DOM）に対し、CSS の `transform: rotate(finalRotationdeg)` を適用して回転させます。
- **アニメーション:** CSS の `transition` プロパティを利用して滑らかな減速（イージング）を表現します。
- **プロパティ定義:**
  - `transition-property: transform;`
  - `transition-duration: 3s;`（回転時間: 3秒）
  - `transition-timing-function: cubic-bezier(0.1, 0.8, 0.1, 1);`（スムーズな ease-out 減速）
- **回転中の再クリック防止:** アニメーション中は状態が `spinning` となり、ボタンが `disabled = true` になるため物理的に再クリックできません。
- **transitionend イベント:** アニメーション終了を `transitionend` イベントで検知し、安全に `result` 状態へ遷移させます。
- **フォールバックタイマー:** ブラウザのタブがバックグラウンドに回り `transitionend` が発火しなかった場合を考慮し、3.2秒後に自動的に `transitionend` と同等の終了処理を安全に実行する `setTimeout` セーフティタイマーを実装します（二重発火しないようフラグ制御を徹底）。

---

## 7. 高DPI Canvas 対応
Retina ディスプレイや高解像度モバイル端末において、ルーレット盤や描画される候補テキストがぼやける現象を防ぐため、デバイスピクセル比を正確に反映したスケーリング処理を実装します。

### スケーリングロジック
- CSS上の物理表示サイズを `displaySize = 360` (px) に固定します。
- `window.devicePixelRatio` (DPI比) を取得します（未定義の場合は 1）。
- **内部バッファサイズ設定:**
  $$\text{canvas.width} = \text{displaySize} \times \text{devicePixelRatio}$$
  $$\text{canvas.height} = \text{displaySize} \times \text{devicePixelRatio}$$
- **CSS表示サイズの設定:**
  $$\text{canvas.style.width} = \text{displaySize} + \text{"px"}$$
  $$\text{canvas.style.height} = \text{displaySize} + \text{"px"}$$
- **コンテキストスケーリング:**
  `ctx.scale(devicePixelRatio, devicePixelRatio)` を描画の最初に適用します。
- これにより、Canvas 内部の描画命令（`fillText`, `arc` 等）は二重スケーリングされることなく、すべて `displaySize` 基準の座標で鮮明にレンダリングされます。

---

## 8. レスポンシブ設計
スマートフォン（モバイル端末）からデスクトップ（PC）まで完璧な流動的表示を確保します。

### CSSレイアウト設計
- ルーレットコンテナの最大幅を `max-width: 400px`、幅を `width: 100%` に設定します。
- テキストエリアやボタンなどのフォーム要素もコンテナ幅に合わせて `width: 100%` でレスポンシブ化します。
- `box-sizing: border-box` を全要素に適用し、padding や border によるはみ出しを防止します。

---

## 9. アクセシビリティ（A11y）
キーボード操作ユーザーやスクリーンリーダー（音声読み上げ）利用者のユーザー体験を保証するセマンティックマークアップを徹底します。

### 具体的なマークアップと属性設定
- `textarea` には明確な `id="candidateInput"` を付与し、`<label for="candidateInput">候補リスト（1行1候補）</label>` を設置して関連付けます。
- スピンボタンにはセマンティックな `<button id="spinButton">` を使用し、キーボードでのフォーカスおよび操作（Enter/Space）を自然に可能にします。
- **エラーおよび結果の通知用ライブリージョン:**
  HTML に `<div id="statusRegion" role="status" aria-live="polite"></div>` を設置。
  エラー発生時のエラー文言、および抽選終了時の「当選候補名」をこの領域の `textContent` に動的にセットすることで、支援技術（スクリーンリーダー）へ即座にアナウンスさせます。
- 回転中は、ボタンに `disabled` 属性を付与することで、支援技術からの不要なフォーカスや重複実行を完全に遮断します。

---

## 10. XSS（クロスサイトスクリプティング）対策
悪意のあるスクリプトが混入した候補名が入力された場合でも、安全性を100%担保するセキュアな設計を適用します。

### 対策の徹底
- ユーザー入力をDOMに反映する結果表示やエラーメッセージ領域の操作においては、絶対に `innerHTML` や `insertAdjacentHTML` を使用せず、**`textContent` による安全な文字列挿入のみを使用します**。
- Canvas への描画処理においては、文字列をピクセルデータとして描画する `ctx.fillText` のみを使用するため、入力値がスクリプトとして解釈される危険性は原理的に存在しません。

---

## 11. テスト戦略
極小規模な Vanilla JS アプリケーションにおいて、ビルド設定や重厚な環境構築を必要としない**軽量かつ実効的なテスト設計**を採用します。

### 自動テスト（ブラウザ上での検証環境、または Node.js 標準アサーション）
テスト用のテストランナー HTML（または `node --test` を利用した軽量スクリプト）を用意し、DOMに依存しないピュアなロジック関数をテストコードから検証します。
- **検証対象のテストケース:**
  1. `normalizeCandidates(text)` の空白トリム、空行除外、改行分割が仕様通り動作すること。
  2. `validateCandidates(candidates)` の最大/最小件数チェック、最大文字数チェック、重複許可が機能すること。
  3. `getRandomIndex(N)` の Rejection Sampling において、バイアスが発生しない乱数が安全に返されること。
  4. `calculateTargetRotation(selectedIndex, N)` の 12時停止のための静的角度が検算ケース1〜3と100%一致すること。
  5. `calculateNextRotation(currentRotation, stopAngle)` が常に時計回りの回転角を正しく累積すること。

### 手動・E2Eテスト項目
1. **Canvas描画:** 2〜20件の候補数変化時に、境界線が綺麗に等分割され、文字が中央に正しく収まって描画されること。
2. **ポインター位置:** 12時方向（真上）をポインターが指し、回転停止時に結果と完全に重なっていること。
3. **連打防止:** 回転中にボタンが無効化され、キーボードやマウスクリックを受け付けないこと。
4. **レスポンシブ:** モバイル表示時（320px幅）でも、Canvasがはみ出さず綺麗に画面内に収まること。
5. **アクセシビリティ:** 音声読み上げツールをオンにした状態で、抽選開始時の状態変化、終了時の当選結果、エラー表示が正しく音声で読み上げられること。
