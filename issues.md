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

### ~~🟡 攻撃・回避でスタミナが消費されない~~ ✅ 解決済み
- 対応：`attack()` 先頭にスタミナ不足ガードと消費処理を追加。`keydown` の ShiftLeft にスタミナ消費と `playSE("dodge")` を追加

### ~~🟡 dodge SEが再生されない~~ ✅ 解決済み
- 対応：`keydown` の ShiftLeft 処理内に `playSE("dodge")` を追加（スタミナ足りる場合のみ再生）



### ~~🟡 弾がプレイヤーにダメージを与えない~~ ✅ 解決済み
- 対応：`updateBullets()` 内に距離判定（半径16px）を追加し、命中時にダメージ5・shake・hit SEを付与。命中弾は `dead` フラグで同フレーム内に除去

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

### 🟢 小屋内でも弾ダメージを受ける
- 症状：`player.inHut=true` の状態で shooter の弾が命中するとダメージを受ける
- 原因：`updateBullets()` の衝突判定に `player.inHut` チェックがない
- 対象：`script.js` の `updateBullets()`

---

## ■ 軽微

### 🟢 ノックバック位置ズレ（まれに発生）
- 症状：ノックバック時にプレイヤーが想定外の方向に移動することがある
- 原因：knockbackX/Y の初期化タイミング不明確。要調査
- 対象：`script.js` の `move()`
