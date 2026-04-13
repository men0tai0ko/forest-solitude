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

### ~~🟡 壁を通り抜けられる~~ ✅ 解決済み
- 対応：`move()` 内でX軸・Y軸それぞれの移動後座標を `isWall()` で事前チェックし、壁の場合はoffset更新をスキップ

### ~~🟡 回避に無敵フレームがない~~ ✅ 解決済み
- 対応：ShiftLeft keydown で `player.invincible=30` をセット。`update()` 内でカウントダウン。`updateEnemies()` の接触ダメージに `player.invincible===0` ガードを追加

### ~~🟡 deathDrop を回収できない~~ ✅ 解決済み
- 対応：`update()` 内に距離30px以内の接触でwood回収＋deathDrops除去処理を追加。`drawEnemies()` 内に黄色 `D` 記号での描画を追加

---

## ■ 軽微

### 🟢 ノックバック位置ズレ（まれに発生）
- 症状：ノックバック時にプレイヤーが想定外の方向に移動することがある
- 原因：knockbackX/Y の初期化タイミング不明確。要調査
- 対象：`script.js` の `move()`
