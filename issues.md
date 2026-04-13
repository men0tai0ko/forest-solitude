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

### ~~🔴 仮想パッドが機能しない~~ ✅ 解決済み
- 症状：スマホで操作できない
- 対応：`script.js` に IIFE `bindVpad()` を追加。`up/down/left/right` は `touchstart`/`touchend`/`touchcancel` で `input` フラグを操作。`atk` は `touchstart` で `attack()` 直接呼び出し。`dodge` は `touchstart` でスタミナ判定付きの回避処理を実行

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

### ~~🟡 deathDrop を回収できない~~ ✅ 解決済み
- 症状：死亡地点のアイテムが拾えない
- 対応：`update()` 末尾に近接判定（30px未満）と `inventory.wood` 加算・配列除去処理を追加

---

## ■ 軽微

### ~~🟢 ノックバック位置ズレ（まれに発生）~~ ✅ 解決済み
- 症状：ノックバック時にプレイヤーが想定外の方向に移動することがある
- 対応：`move()` でノックバックを入力移動から分離。入力移動のみ `isWall()` チェック対象とし、ノックバックは壁チェック後に独立適用することで干渉を解消
- 残課題：強いノックバックで壁内に押し込まれる可能性あり（tasks.md に技術負債として記録）

### ~~🟢 stamina が maxStamina を超えてオーバーフローする~~ ✅ 解決済み
- 症状：`stamina += STAMINA_RECOVER` の浮動小数点誤差により `maxStamina(100)` を超える値が蓄積される
- 対応：`update()` の回復処理直後に `if(player.stamina > player.maxStamina) player.stamina = player.maxStamina` を追加

### ~~🟢 attack() / updateEnemies() でゼロ除算が発生しうる~~ ✅ 解決済み
- 症状：プレイヤーと敵の座標が完全一致した際に `dist=0` となり `dx/dist` が `NaN` になる。attack() では攻撃判定破損、updateEnemies() では slime 座標が NaN に破損する
- 対応：両関数の `dist` 算出直後に `if(dist===0) return;` ガードを追加
