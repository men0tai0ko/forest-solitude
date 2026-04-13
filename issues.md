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
- 対応：`world.offsetX/Y` をタイル(1,1)中央に来るよう `calcSpawnOffset()` で初期化

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

### ~~🔴 死亡処理が毎フレーム多重実行される~~ ✅ 解決済み
- 症状：`player.hp <= 0` の間、`handleDeath()` が毎フレーム呼ばれ続ける
- 対応：`isDead` フラグを追加。`update()` で `!isDead` の場合のみ `handleDeath()` を呼び、`handleDeath()` 末尾で `isDead=false` にリセット

### ~~🔴 ロード後に前セッションの敵・弾が残存する~~ ✅ 解決済み
- 症状：`loadGame()` 実行後、前ゲームの `enemies`/`bullets`/`deathDrops` がリセットされない
- 対応：`loadGame()` 末尾で `enemies=[]; bullets=[]; deathDrops=[];` を追加

---

## ■ 重大

### ~~🟡 攻撃でスタミナが消費されない~~ ✅ 解決済み
- 症状：Space（攻撃）を連打してもスタミナが減らない
- 対応：`attack()` 冒頭にスタミナ不足ガードと `STAMINA_ATTACK_COST` 消費処理を追加

### ~~🟡 dodge SEが再生されない~~ ✅ 解決済み
- 症状：回避操作時に効果音が鳴らない
- 対応：ShiftLeft `keydown` 処理内に `playSE("dodge")` を追加済み

### ~~🟡 弾がプレイヤーにダメージを与えない~~ ✅ 解決済み
- 症状：shooterの弾に当たってもHPが減らない
- 対応：`updateBullets()` に距離判定（20px未満）・ダメージ5・無敵チェック・命中弾除去を追加

### ~~🟡 壁を通り抜けられる~~ ✅ 解決済み
- 症状：壁タイルに侵入できる
- 対応：`move()` でX/Y軸を独立して `isWall()` チェックし、壁ずり移動を実現

### ~~🟡 回避に無敵フレームがない~~ ✅ 解決済み
- 症状：回避中もダメージを受ける
- 対応：ShiftLeft `keydown` で `player.invincible=30` を付与。`updateEnemies()` に `invincible===0` ガードを追加済み

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
