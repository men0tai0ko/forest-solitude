# issues.md

バグ・技術課題の管理。開発タスクは `tasks.md` を参照。

---

## ■ 凡例

| 記号 | 意味 |
|---|---|
| 🔴 | クリティカル（ゲームが成立しない） |
| 🟡 | 重大（主要機能が動かない） |
| 🟢 | 軽微（動作はするが問題あり） |
| ⚪ | 技術負債・改善余地 |

---

## ■ クリティカル

### ~~🔴 スタート位置がマップ外（壁）になる~~ ✅ 解決済み
- 症状：`world.offsetX/Y=0` のためプレイヤー実座標がcanvasサイズ依存でマップ範囲外になる
- 対応：`world.offsetX/Y` をタイル(1,1)中央に来るよう `canvas.width/2 - TILE_SIZE*1.5` で初期化

### ~~🔴 攻撃キーを押しても attack() が実行されない~~ ✅ 解決済み
- 症状：Space キーで `input.attack=true` になるが `attack()` はどこからも呼ばれていなかった
- 対応：Space `keydown` 時に `attack()` を即時呼び出すよう修正

### ~~🔴 回避に無敵・SE・スタミナ消費が未実装~~ ✅ 解決済み
- 対応：ShiftLeft keydown にスタミナ消費・`player.invincible=30`・`playSE("dodge")` を追加。`update()` に無敵カウントダウン、`updateEnemies()` に `invincible===0` ガードを追加

### 🔴 仮想パッドが機能しない
- 症状：スマホで操作できない
- 原因：`script.js` にタッチイベントのバインドが存在しない
- 対象：`script.js`（タッチイベント追加）、`index.html`（ボタンID確認）
- 影響：スマホ対応を謳っているが実質PC専用

### 🔴 死亡処理が毎フレーム多重実行される
- 症状：`player.hp <= 0` の間、`handleDeath()` が毎フレーム呼ばれ続ける
- 原因：`update()` の先頭で `hp <= 0` チェック後に `handleDeath()` を呼び `return` するが、`handleDeath` 内で `player.hp = 100` にするまでの間に複数フレーム処理が走る可能性あり。また `hp` が回復前に次フレームで再呼出しされる構造
- 対象：`script.js` の `update()` / `handleDeath()`

### 🔴 ロード後に前セッションの敵・弾が残存する
- 症状：`loadGame()` 実行後、前ゲームの `enemies`/`bullets`/`deathDrops` がリセットされない
- 原因：`loadGame` は `player`/`world`/`inventory`/`map` のみ復元。配列3種は上書きなし
- 対象：`script.js` の `loadGame()`

---

## ■ 重大

### 🟡 攻撃・回避でスタミナが消費されない
- 症状：Space（攻撃）・Shift（回避）を連打してもスタミナが減らない
- 原因：`attack()` にスタミナ消費処理なし。dodge入力はフラグセットのみで実処理・消費処理が未実装
- 対象：`script.js` の `attack()`・dodge入力処理
- 補足：`STAMINA_ATTACK_COST=15` / `STAMINA_DODGE_COST=30` は定数定義済みだが未使用

### 🟡 dodge SEが再生されない
- 症状：回避操作時に効果音が鳴らない
- 原因：`playSE("dodge")` の呼び出し箇所が `script.js` に存在しない（SE定義はあり）
- 対象：`script.js`（dodge処理に `playSE("dodge")` の追加が必要）



### 🟡 弾がプレイヤーにダメージを与えない
- 症状：shooterの弾に当たってもHPが減らない
- 原因：`updateBullets()` は弾の移動のみ。プレイヤーとの衝突判定・ダメージ処理が未実装
- 対象：`script.js` の `updateBullets()`
- 補足：`balance.md` に弾ダメージ5と記載があるが処理なし

### 🟡 壁を通り抜けられる
- 症状：壁タイルに侵入できる
- 原因：`isWall()` は定義済みだが `move()` 内で呼ばれていない
- 対象：`script.js` の `move()`

### 🟡 回避に無敵フレームがない
- 症状：回避中もダメージを受ける
- 原因：`player.invincible` は定義されているが、dodge 処理内で値を設定していない。また `updateEnemies()` で無敵チェックをしていない
- 対象：`script.js` の dodge 処理・`updateEnemies()`

### 🟡 deathDrop を回収できない
- 症状：死亡地点のアイテムが拾えない
- 原因：`deathDrops` の生成処理は存在するが、プレイヤーとの接触判定・回収処理が未実装
- 対象：`script.js`（回収処理の追加）

---

## ■ 軽微

### 🟢 ノックバック位置ズレ（まれに発生）
- 症状：ノックバック時にプレイヤーが想定外の方向に移動することがある
- 原因：knockbackX/Y の初期化タイミング不明確。要調査
- 対象：`script.js` の `move()`
