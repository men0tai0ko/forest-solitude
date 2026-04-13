# architecture.md

## ■ 概要

単一HTML＋CSS＋JavaScriptによるシンプル構成。完全オフライン動作・外部依存なし。

---

## ■ ファイル構成

ファイルマップは `README.md` を参照。ゲームロジックは `script.js` 単一ファイルに集約。

---

## ■ ゲームループ

```
requestAnimationFrame → loop()
  ├─ [タイトル中] drawTitle()
  └─ [ゲーム中]
       ├─ update()
       │    ├─ move()
       │    ├─ updateEnemies()
       │    ├─ updateBullets()
       │    ├─ スタミナ回復
       │    ├─ 小屋内HP回復
       │    ├─ berry時間回復
       │    └─ handleDeath()（HP≤0時）
       └─ render()
            ├─ drawMap()
            ├─ drawEnemies()
            ├─ drawPlayer()
            └─ drawUI()
```

---

## ■ 状態変数（グローバル）

### player
```js
{
  hp, stamina, maxStamina, atk,
  dirX, dirY,          // 向き（正規化ベクトル）
  invincible,          // 無敵フレーム数
  knockbackX, knockbackY,
  healing,             // berry回復残フレーム
  inHut                // 小屋内フラグ
}
```

### world
```js
{ offsetX, offsetY }   // プレイヤー中央固定のためのワールドオフセット
// 初期値：calcSpawnOffset() で HUT_SPAWN_TX/TY タイル中央に配置
```

### map
```js
// 2D配列（20列×15行）。値：0=床 / 1=壁 / 2=小屋
// プレイヤー座標は canvas.width/2 - world.offsetX で算出
```

### enemies
```js
// 配列。{ x, y, hp, type }
// type: "slime" | "shooter" | "charger" | "boss"
// 全敵はフィールド（小屋外の床タイル）上に配置
// 座標はタイル座標ベース：tx * TILE_SIZE + 20（タイル中央近似）
```

### bullets
```js
// 配列。{ x, y, vx, vy }
```

### inventory
```js
{ wood, berry }
```

### deathDrops
```js
// 配列。{ x, y, items: { wood } }
// ※回収処理は未実装
```

---

## ■ 座標系

- プレイヤーは常に `(canvas.width/2, canvas.height/2)` に描画
- 実際のプレイヤー位置 = `(canvas.width/2 - world.offsetX, canvas.height/2 - world.offsetY)`
- 移動時は `world.offset` を変更することでワールドをスクロール
- 敵・マップの描画は `x + world.offsetX` で画面座標に変換

---

## ■ スポーン座標

```js
// 定数
const HUT_SPAWN_TX = 1;  // スポーンタイルX（小屋左上）
const HUT_SPAWN_TY = 1;  // スポーンタイルY

// 計算関数（初期化・リボーン両方で使用）
function calcSpawnOffset() {
  return {
    offsetX: canvas.width/2  - (HUT_SPAWN_TX * TILE_SIZE + TILE_SIZE / 2),
    offsetY: canvas.height/2 - (HUT_SPAWN_TY * TILE_SIZE + TILE_SIZE / 2),
  };
}
```

- `world` 初期値と `handleDeath()` のリボーン処理が共通してこの関数を使用

---

## ■ 衝突判定

### 壁判定（isWall）
```js
// プレイヤー実座標 → タイル座標に変換 → map配列で値1を確認
// ※現状、壁衝突時の移動キャンセル処理は未実装（壁を通り抜ける）
```

### 小屋判定（isHut）
```js
// プレイヤー実座標 → タイル座標 → map配列で値2を確認
// → player.inHut フラグに反映
```

### 敵・弾との衝突
```js
// 距離判定（Math.hypot）
// 敵：dist < 30 でダメージ
// 攻撃：dist < 50 かつ内積 > 0.5 でヒット
// 弾：当たり判定は未実装（弾の移動のみ、プレイヤーへのダメージ処理なし）
```

> **注意：** `issues.md` 記載の「弾の当たり判定粗い」は、実際には弾→プレイヤーへのダメージ処理が `script.js` に存在しない状態。バグではなく未実装。

---

## ■ 入力処理

### PC
| キー | 処理 |
|---|---|
| Arrow | 移動 |
| Space | attack() |
| Shift | dodge（スタミナ消費・無敵フレーム付与・SE再生） |
| Z | useHeal() |
| C（小屋内） | craftHeal() |
| X（小屋内） | craftWeapon() |
| V（小屋内） | expandHut() |
| S | saveGame() |
| M | sound ON/OFF |

### スマホ
- 仮想パッド（`#pad`）のボタンに touch イベントが**未接続**
- ※ `index.html` にボタンは存在するが `script.js` にタッチイベントのバインドなし（要実装）

---

## ■ セーブ構造

```json
{
  "player": { ... },
  "world":  { "offsetX": 0, "offsetY": 0 },
  "inventory": { "wood": 0, "berry": 0 },
  "map": [ [...], ... ]
}
```

保存先：`localStorage["forest_survival_save_v1"]`

> **注意：** マップ定義変更後の旧セーブをロードした場合、旧マップが復元される。旧セーブが存在する場合は手動削除が必要。

---

## ■ サウンド

- Web Audio API（OscillatorNode + GainNode）
- 初回クリックで AudioContext を初期化（ブラウザ制約対応）
- SE種別：`attack` / `hit` / `dodge`

---

## ■ 描画

- Canvas 2D API
- ASCII風テキスト描画（`ctx.fillText`）
- 画面シェイク：`ctx.setTransform` でランダムオフセット（shake > 0 の間）
- タイル描画：`#`（壁）/ `H`（小屋）/ `.`（床）
- プレイヤー：`@`（シアン）
- 敵：`E`（赤）

---

## ■ 拡張ポイント

| 対象 | 方法 |
|---|---|
| 敵追加 | `enemies` 配列に追加 + `updateEnemies` の type 分岐を追加 |
| マップ拡張 | `map` 配列を拡大 |
| アイテム追加 | `inventory` に追加 + 対応する処理関数を追加 |
| UI追加 | `drawUI` 関数に追加 |

---

## ■ 注意事項

- グローバル変数を多用しているため、関数間の依存に注意
- `script.js` は単一ファイルのため、規模拡大時はモジュール分割を検討
- スポーン座標は `HUT_SPAWN_TX/TY` と `calcSpawnOffset()` で一元管理。`world` 初期値と `handleDeath()` の両方でこれを参照する
