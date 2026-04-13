# tasks.md

開発タスクの進捗管理。バグ管理は `issues.md` を参照。

---

## ■ 完了済み

- [x] 移動（ワールドスクロール方式）
- [x] 攻撃（前方判定・スタミナ消費）
- [x] 回避（入力処理・スタミナ消費）
- [x] スタミナ（消費・時間回復）
- [x] ノックバック
- [x] 敵AI（slime接近・shooter弾発射）
- [x] 弾（発射・移動）
- [x] 小屋（安全地帯・HP自動回復）
- [x] クラフト（wood→berry、wood→atk強化）
- [x] 小屋拡張（Vキー）
- [x] 死亡処理（HP全回復・アイテムロスト・deathDrops生成）
- [x] セーブ・ロード（localStorage）
- [x] サウンド（Web Audio API・attack/hit/dodge）
- [x] タイトル画面（N:NEW / L:LOAD）
- [x] スマホ対応（仮想パッドHTML）

---

## ■ 未実装（優先度：高）

> これらは「完了済み」とされているが実装が不完全または存在しない

- [x] **仮想パッドのタッチイベント接続**（index.htmlにボタンあり、script.jsにバインドなし）
- [ ] **弾→プレイヤーへのダメージ処理**（updateBullets は移動のみ）
- [ ] **壁の当たり判定を move() に組み込む**（isWall()は存在するが未使用）
- [ ] **回避の無敵フレーム付与**（player.invincible は定義済みだが未使用）
- [ ] **deathDrops の回収処理**（生成のみで拾えない）

---

## ■ 未実装（優先度：中）

- [ ] charger 専用AI（突進）
- [ ] boss 専用AI（弾幕）
- [ ] 敵のドロップ処理（getDrop関数が未実装）
- [ ] 自動セーブ（spec.mdに記載あるが未実装）

---

## ■ 改善提案（優先度：高〜中）

- [ ] **スタミナバーをHUD左上にバー形式で描画**（`drawUI` に `fillRect` 2本追加）｜回避判断不能のため高優先
- [ ] **弾を画面外で自動削除**（`updateBullets` に `canvas` 範囲チェックを追加）｜配列肥大化によるパフォーマンス劣化防止
- [ ] **スタミナ不足時に攻撃・回避をスキップ**（`attack()`・dodge処理に `if(stamina < cost) return` 追加）｜スタミナ0でも連続行動できる不正防止
- [ ] **タイトル画面にキー操作ヒントを表示**（`drawTitle` に移動/攻撃/回避のキー3行追加）｜初見プレイヤーが操作不明で詰まる
- [ ] **HP上限を `player.maxHp` で管理**（`player` 定義に `maxHp:100` を追加し `100` ハードコードを除去）｜将来のHP拡張時に破綻防止
- [ ] **HUDのHP表示を `Math.floor` で統一**（`drawUI` の `Math.floor(player.hp)` はあるが小屋回復中に小数が出る箇所を統一）｜表示崩れ防止
- [ ] **deathDrops をマップ上に `D` 記号で描画**（`render` の `drawMap` 直後に `deathDrops` をループして `fillText("D",...)` 追加）｜回収場所不明
- [ ] **HUDに残敵数を表示**（`drawUI` に `"ENEMY:"+enemies.length` の1行追加）｜状況把握困難
- [ ] **saveGame 成功時に "SAVED" をHUD数フレーム表示**（`saveFlash` カウンタを追加し `drawUI` で描画・`saveGame()` 呼出時にセット）｜保存確認不能
- [ ] **expandHut 実行後に "EXPANDED" をHUD数フレーム表示**（`saveFlash` と同パターンで `hutFlash` カウンタを追加）｜操作フィードバック皆無
- [ ] **クラフト素材不足時にフラッシュ表示**（`craftHeal`/`craftWeapon` の素材不足分岐に `hutFlash` 流用で "NO WOOD" を数フレーム表示）｜無反応で混乱する
- [ ] **`player.hp` 上限クランプを `update()` 末尾1箇所に集約**（現在 `player.hp=100` が `update` 内複数箇所に散在 → 末尾の1行に統一）｜多重上限バグ防止
- [ ] **`loadGame` 時に `enemies`/`bullets`/`deathDrops` をリセット**（`Object.assign` 後に各配列を初期値で上書き）｜ロード後に壊れる
- [ ] **`settings` をセーブ対象に追加**（`saveGame` の JSON に `settings` を含め `loadGame` で復元）｜設定が保持されない
- [ ] **HUDに小屋内表示 `[HUT]` を追加**（`drawUI` に `player.inHut` 条件で1行追加）｜判定境界が不明
- [ ] **`drawTitle` に `ctx.font` を明示指定**（`drawMap` の `"20px monospace"` が引き継がれる前提になっているため独立して設定）｜タイトル文字崩れ

---

## ■ 今後の拡張（優先度：低）

- [ ] マップ自動生成（ローグライク化）
- [ ] 新エリア追加
- [ ] 新敵追加（wolf等）
- [ ] 装備システム（アイテムとしてのwood_swordなど）
- [ ] スキル
- [ ] 状態異常（毒・出血）
- [ ] レアリティシステム
- [ ] UI改善（スタミナバー表示など）
- [ ] BGM追加
- [ ] エフェクト強化

---

## ■ 技術負債

- [ ] **グローバル変数の整理**：player/world/inventory/map/enemies/bullets をひとつの gameState オブジェクトにまとめる
- [ ] **script.js のモジュール分割検討**：450行超の単一ファイル。外部依存禁止の制約内でのモジュール化
- [ ] **描画最適化**：全タイルを毎フレーム描画。画面外タイルのスキップで改善余地あり
